import { apiFetch } from './client'

/** Totals for the dashboard's cards. Scores are percentages, 0 to 100. */
export interface DashboardSummary {
  total_images: number
  upload_batches: number
  enhanced_images: number
  accepted_images: number
  rejected_images: number
  needs_review_images: number
  processing_images: number
  failed_images: number
  average_quality_score: number | null
  most_common_rejection_reason: string | null
  identity_groups: number
  identity_grouped_images: number
  identity_review_items: number
  /** False while identity grouping is switched off; hide the folder figures. */
  identity_groups_available: boolean
  storage_bytes: number
}

export interface DailyUploads {
  date: string
  uploads: number
  accepted: number
  rejected: number
}

export interface RecentUpload {
  id: number
  filename: string
  status: string
  batch_id: number
  uploaded_at: string
}

export interface RecentActivity {
  type: string
  message: string
  image_id: number | null
  enhancement_id: number | null
  status: string
  created_at: string
}

export interface UserDashboard {
  summary: DashboardSummary
  /** Always seven entries, oldest first, including days with nothing on them. */
  uploads_last_7_days: DailyUploads[]
  recent_uploads: RecentUpload[]
  recent_activity: RecentActivity[]
}

export function getUserDashboard(signal?: AbortSignal): Promise<UserDashboard> {
  return apiFetch<UserDashboard>('/api/user/dashboard/', { signal })
}
