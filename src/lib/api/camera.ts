import { apiFetch } from './client'
import { API_URL } from './config'
import { getAccessToken } from './tokens'
import type { UploadBatch } from './images'

/**
 * Live camera sessions. A session records only that the camera was on (a label for the device and a few plain settings);
 * no video is ever sent or stored. A snapshot the person chooses to take goes through the normal photo pipeline and is
 * linked to the session. This is also what the administrator's "Live Sessions" figures count.
 */
export interface CameraSession {
  id: string
  device_label: string
  settings: Record<string, string | number | boolean | null>
  started_at: string
  ended_at: string | null
  snapshot_count: number
}

/** The backend refuses a longer device name; some cameras report a long one (a file path, a vendor string). */
const DEVICE_LABEL_MAX = 80

export function startCameraSession(deviceLabel: string, settings: CameraSession['settings'] = {}): Promise<CameraSession> {
  return apiFetch<CameraSession>('/api/camera/sessions/', { body: { device_label: deviceLabel.slice(0, DEVICE_LABEL_MAX), settings } })
}

export function endCameraSession(sessionId: string): Promise<CameraSession> {
  return apiFetch<CameraSession>(`/api/camera/sessions/${sessionId}/end/`, { method: 'POST', body: {} })
}

/** Save one snapshot into the session. The photo becomes an ordinary single upload; follow `batch` like any other. */
export function uploadCameraSnapshot(sessionId: string, file: File, signal?: AbortSignal): Promise<{ batch: UploadBatch }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<{ batch: UploadBatch }>(`/api/camera/sessions/${sessionId}/snapshots/`, { formData, signal })
}

/**
 * End a session while the page is closing or reloading. An ordinary request is cancelled when the page goes away; a
 * `keepalive` request is allowed to finish. Best effort: if it never arrives the session simply stays open until it ages out.
 */
export function endCameraSessionOnExit(sessionId: string): void {
  const token = getAccessToken()
  if (!API_URL || !token) return
  try {
    void fetch(`${API_URL}/api/camera/sessions/${sessionId}/end/`, {
      method: 'POST', keepalive: true, body: '{}',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }).catch(() => { /* nothing more can be done */ })
  } catch { /* nothing more can be done */ }
}
