/**
 * How many photos a ZIP holds, read in the browser from the archive's table of contents (its "central directory",
 * stored at the end of the file), so the screen can refuse an archive that is too big BEFORE sending it.
 * Nothing is unpacked and only the table is read, not the photos, so it is quick even for a large archive.
 */

export interface ZipContents {
  /** Photos in the archive: files ending .jpg, .jpeg, .png, .webp and the other common picture types. `null` when the archive has far too many files to count (a ZIP64 table or one over 32 MB). */
  photos: number | null
}

const PHOTO = /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|avif)$/i
const END_SIGNATURE = 0x06054b50       // "end of central directory"
const ENTRY_SIGNATURE = 0x02014b50     // one entry of the central directory
const END_LENGTH = 22
const MAX_COMMENT = 0xffff
const MAX_TABLE_BYTES = 32 * 1024 * 1024
const decoder = new TextDecoder('utf-8')

/** Folders, the junk a Mac adds (`__MACOSX/`, `._name`) and everything that is not a picture are not photos. */
const isPhoto = (name: string) => {
  if (name.endsWith('/')) return false
  const parts = name.split('/')
  if (parts.includes('__MACOSX')) return false
  const base = parts[parts.length - 1]
  return !base.startsWith('._') && PHOTO.test(base)
}

/** `null` when the file is not a ZIP this can read (damaged, or not a ZIP at all). */
export async function readZipContents(file: Blob): Promise<ZipContents | null> {
  if (file.size < END_LENGTH) return null

  const tailStart = Math.max(0, file.size - (END_LENGTH + MAX_COMMENT))
  const tail = new DataView(await file.slice(tailStart).arrayBuffer())
  let end = -1
  for (let i = tail.byteLength - END_LENGTH; i >= 0; i--) {
    // The record is the last thing in the file apart from its own comment, so its length must match what is left.
    if (tail.getUint32(i, true) === END_SIGNATURE && i + END_LENGTH + tail.getUint16(i + 20, true) === tail.byteLength) { end = i; break }
  }
  if (end < 0) return null

  const entries = tail.getUint16(end + 10, true)
  const tableSize = tail.getUint32(end + 12, true)
  const tableStart = tail.getUint32(end + 16, true)
  // A field at its maximum means the real figures live in a ZIP64 record, and a table this size lists tens of thousands of files:
  // far more than any photo limit here, so it is reported as "too many to count" instead of being read.
  if (entries === 0xffff || tableSize === 0xffffffff || tableStart === 0xffffffff || tableSize > MAX_TABLE_BYTES) return { photos: null }
  if (tableStart + tableSize > file.size) return null

  const table = new DataView(await file.slice(tableStart, tableStart + tableSize).arrayBuffer())
  let photos = 0
  let at = 0
  for (let n = 0; n < entries; n++) {
    if (at + 46 > table.byteLength || table.getUint32(at, true) !== ENTRY_SIGNATURE) return null
    const nameLength = table.getUint16(at + 28, true)
    const extraLength = table.getUint16(at + 30, true)
    const commentLength = table.getUint16(at + 32, true)
    if (at + 46 + nameLength > table.byteLength) return null
    const name = decoder.decode(new Uint8Array(table.buffer, table.byteOffset + at + 46, nameLength))
    if (isPhoto(name)) photos++
    at += 46 + nameLength + extraLength + commentLength
  }
  return { photos }
}
