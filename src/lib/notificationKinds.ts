import {
  AlertTriangle, Camera, Download, FileText, Hourglass, Image as ImageIcon, Layers, Upload, Users, XCircle, Bell,
  type LucideIcon,
} from 'lucide-react'

export interface NotificationKind { label: string; icon: LucideIcon }

/** What each kind of notification is about, in words and as an icon, so a long list can be scanned. */
const KINDS: Record<string, NotificationKind> = {
  upload_received: { label: 'Upload', icon: Upload },
  processing_started: { label: 'Upload', icon: Hourglass },
  batch_completed: { label: 'Upload', icon: Layers },
  photo_accepted: { label: 'Photo', icon: ImageIcon },
  photo_rejected: { label: 'Photo', icon: XCircle },
  photo_needs_review: { label: 'Photo', icon: AlertTriangle },
  photo_failed: { label: 'Photo', icon: AlertTriangle },
  report_ready: { label: 'Report', icon: FileText },
  report_failed: { label: 'Report', icon: FileText },
  download_ready: { label: 'Download', icon: Download },
  download_failed: { label: 'Download', icon: Download },
  identity_group_created: { label: 'Person folder', icon: Users },
  live_session_alert: { label: 'Live camera', icon: Camera },
}

export const notificationKind = (eventType: string): NotificationKind => KINDS[eventType] ?? { label: 'Notice', icon: Bell }

/** "Today", "Yesterday", or the date, for grouping a list by day. */
export function dayHeading(iso: string): string {
  const day = new Date(iso); const today = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(today) - startOf(day)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: day.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}
