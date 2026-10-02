/**
 * A rough enhanced preview, made in the browser.
 *
 * Used only when there is no server to do the real work, so the comparison
 * slider has two sides to show. It is a canvas filter — a lift in brightness,
 * contrast and saturation — not the backend's enhancement, and the screen says
 * so wherever this is shown. It must never stand in for a real result.
 */
export async function makeLocalPreview(source: string): Promise<string> {
  const image = await loadImage(source)

  // Cap the working size: a phone photo is far larger than the slider needs,
  // and filtering it at full resolution janks the page for no visible gain.
  const longest = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longest > 1400 ? 1400 / longest : 1
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable.')

  context.filter = 'brightness(1.12) contrast(1.10) saturate(1.08)'
  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.9)
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The photo could not be read.'))
    image.src = source
  })
}
