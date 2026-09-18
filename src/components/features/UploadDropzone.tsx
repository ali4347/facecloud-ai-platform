import { useCallback, useState } from 'react'
import { Upload, FileImage, FolderArchive, X, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UploadedFile {
  name: string
  size: string
  type: 'image' | 'zip'
  progress: number
  done: boolean
}

export function UploadDropzone() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const addMockFiles = useCallback((names: string[]) => {
    const newFiles: UploadedFile[] = names.map(name => ({
      name,
      size: `${(Math.random() * 3 + 0.3).toFixed(1)} MB`,
      type: name.endsWith('.zip') ? 'zip' : 'image',
      progress: 0,
      done: false,
    }))
    setFiles(prev => [...prev, ...newFiles])

    // Simulate progress
    newFiles.forEach((_, idx) => {
      let p = 0
      const interval = setInterval(() => {
        p = Math.min(p + Math.random() * 25 + 10, 100)
        setFiles(prev => prev.map((f, i) => {
          const globalIdx = prev.length - newFiles.length + idx
          if (i === globalIdx) return { ...f, progress: p, done: p >= 100 }
          return f
        }))
        if (p >= 100) clearInterval(interval)
      }, 200 + idx * 80)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addMockFiles(['dropped_image_001.jpg', 'dropped_image_002.png'])
  }, [addMockFiles])

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        className={cn('upload-dropzone', dragging && 'border-accent bg-soft-blue/80')}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => addMockFiles([`face_${Date.now()}.jpg`])}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
            dragging ? 'bg-accent/20' : 'bg-accent/10'
          )}>
            <Upload className={cn('w-7 h-7 transition-colors', dragging ? 'text-accent' : 'text-accent/60')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {dragging ? 'Drop your files here!' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-ink-mute mt-0.5">or click to browse your device</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {['JPG', 'PNG', 'JPEG', 'ZIP'].map(ext => (
              <span key={ext} className="px-2.5 py-0.5 bg-white border border-line rounded-full text-xs text-ink-mute font-medium">
                .{ext}
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-mute">Max file size: 50 MB per file</p>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => addMockFiles([`single_${Date.now()}.jpg`])}
          className="fc-card p-4 flex flex-col items-center gap-2 hover:border-accent/30 hover:bg-soft-blue transition-all cursor-pointer"
        >
          <FileImage className="w-6 h-6 text-accent" />
          <span className="text-xs font-semibold text-ink">Single Image</span>
        </button>
        <button
          onClick={() => addMockFiles([`img_${Date.now()}_1.jpg`, `img_${Date.now()}_2.jpg`, `img_${Date.now()}_3.jpg`])}
          className="fc-card p-4 flex flex-col items-center gap-2 hover:border-accent/30 hover:bg-soft-blue transition-all cursor-pointer"
        >
          <div className="relative">
            <FileImage className="w-6 h-6 text-violet-700" />
            <FileImage className="w-4 h-4 text-violet-700 absolute -bottom-1 -right-1" />
          </div>
          <span className="text-xs font-semibold text-ink">Multiple Images</span>
        </button>
        <button
          onClick={() => addMockFiles([`batch_upload_${Date.now()}.zip`])}
          className="fc-card p-4 flex flex-col items-center gap-2 hover:border-accent/30 hover:bg-soft-blue transition-all cursor-pointer"
        >
          <FolderArchive className="w-6 h-6 text-[#6366F1]" />
          <span className="text-xs font-semibold text-ink">ZIP Upload</span>
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="fc-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">{files.length} file(s) queued</span>
            <button onClick={() => setFiles([])} className="text-xs text-ink-mute hover:text-error transition-colors">Clear all</button>
          </div>
          <div className="divide-y divide-border">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {f.type === 'zip'
                  ? <FolderArchive className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
                  : <FileImage className="w-5 h-5 text-accent flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent-soft rounded-full transition-all duration-300"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-mute flex-shrink-0">{f.done ? f.size : `${Math.round(f.progress)}%`}</span>
                  </div>
                </div>
                {f.done
                  ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  : <button onClick={() => removeFile(i)} className="p-1 hover:bg-soft-blue rounded-lg"><X className="w-3.5 h-3.5 text-ink-mute" /></button>
                }
              </div>
            ))}
          </div>
          {files.every(f => f.done) && (
            <div className="px-4 py-3 border-t border-line bg-green-50">
              <p className="text-sm text-success font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                All files uploaded successfully. AI processing queued.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
