import { apiFetch, apiFetchBlob } from './client'

export type ReportFormat = 'json' | 'csv' | 'pdf'

export interface ProcessingReport {
  id: number
  report_type: string
  format: ReportFormat
  status: 'queued' | 'generating' | 'ready' | 'failed' | 'expired' | string
  source_name: string
  file_size: number
  failure_reason: string
  download_url: string | null
}

interface Created { created: boolean; report: ProcessingReport }

/** Ask for a report on one photo (what each check measured and decided). */
export async function createImageReport(imageId: number, format: ReportFormat): Promise<ProcessingReport> {
  return (await apiFetch<Created>(`/api/reports/images/${imageId}/`, { body: { format } })).report
}

/** Ask for a report on a whole upload. */
export async function createBatchReport(batchId: number, format: ReportFormat): Promise<ProcessingReport> {
  return (await apiFetch<Created>(`/api/reports/batches/${batchId}/`, { body: { format } })).report
}

export function getReport(id: number, signal?: AbortSignal): Promise<ProcessingReport> {
  return apiFetch<ProcessingReport>(`/api/reports/${id}/`, { signal })
}

export function downloadReport(id: number): Promise<Blob> {
  return apiFetchBlob(`/api/reports/${id}/download/`)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Request a report, wait until it is built, and return its file. */
export async function fetchReport(
  start: () => Promise<ProcessingReport>, format: ReportFormat, label: string,
): Promise<{ blob: Blob; filename: string }> {
  let report = await start()
  const deadline = Date.now() + 120_000
  while (report.status === 'queued' || report.status === 'generating') {
    if (Date.now() > deadline) throw new Error('The report is taking longer than expected. Try again in a minute.')
    await sleep(1500)
    report = await getReport(report.id)
  }
  if (report.status !== 'ready') throw new Error(report.failure_reason || 'The report could not be made.')
  return { blob: await downloadReport(report.id), filename: `${label}-report.${format}` }
}
