import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { ApiError } from '../../lib/api/client'
import { createBatchReport, createImageReport, fetchReport, type ReportFormat } from '../../lib/api/reports'
import { saveBlob } from '../../lib/saveBlob'

interface ReportButtonProps {
  kind: 'image' | 'batch'
  id: number
  /** Used in the downloaded file's name. */
  label: string
}

/** Ask for the processing report of a photo or an upload (what each check measured and decided) and download it. */
export function ReportButton({ kind, id, label }: ReportButtonProps) {
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true); setError('')
    try {
      const start = () => (kind === 'image' ? createImageReport(id, format) : createBatchReport(id, format))
      const { blob, filename } = await fetchReport(start, format, label.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-'))
      saveBlob(blob, filename)
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : 'Could not make the report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <select aria-label="Report format" value={format} onChange={e => setFormat(e.target.value as ReportFormat)} disabled={busy}
          className="fc-input !py-1.5 !px-2 text-xs w-auto">
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
        <button type="button" onClick={() => void run()} disabled={busy}
          className="fc-btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {busy ? 'Preparing…' : 'Download report'}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
