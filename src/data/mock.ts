// ─── MOCK DATA & MODEL TYPES ──────────────────────────────────────────────────

export type Role = 'user' | 'admin' | 'moderator'
export type UploadStatus = 'uploaded' | 'resizing' | 'enhancing' | 'validating' | 'grouping' | 'completed' | 'rejected'
export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'purple' | 'muted'
export type ServiceStatus = 'operational' | 'degraded' | 'outage'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'suspended'
  uploads: number
  joinedAt: string
  avatar: string
}

export interface ImageRecord {
  id: string
  filename: string
  status: UploadStatus
  rejectionReason?: string
  feedback?: string
  uploadedAt: string
  size: string
  dimensions: string
  enhanced: boolean
  originalSaved: boolean
  enhancedSaved: boolean
  aiModel: 'Zero-DCE'
  faceDetected: boolean
  faceCount: number
  blurScore: number // 0-100 (higher is cleaner)
  brightnessScore: number // 0-100
  faceSizeScore: number // 0-100
  qualityStatus: 'passed' | 'failed'
  embeddingExtracted: boolean
  matchingConfidence?: number // percentage
  personFolderId?: string
  thumbnail: string // color block representation
  secureDownloadLink?: string
  emailNotificationSent?: boolean
  activityLogged?: boolean
}

export interface PersonFolder {
  id: string
  label: string
  imageCount: number
  lastUpdated: string
  coverImages: string[] // color swatches
  matchingConfidence: number
  createdDate: string
}

export type IdentityGroup = PersonFolder // Type alias for backward compatibility

export interface ProcessingJob {
  id: string
  filename: string
  stages: { label: string; status: 'done' | 'active' | 'pending' | 'failed'; time?: string }[]
  currentStage: UploadStatus
  createdAt: string
  uploadType?: 'Single' | 'Multiple' | 'ZIP'
  progress?: number
  duration?: string
  failureReason?: string
  details?: {
    originalSaved: string
    aiModel: string
    faceCount: number
    blurScore: string
    brightnessScore: string
    faceSizeScore: string
    personFolder: string
    rejectionReason?: string
    notificationSent: string
    secureDownload: string
    activityLog: string
  }
}

export interface ActivityEvent {
  id: string
  type: 'upload' | 'enhance' | 'validate' | 'download' | 'live' | 'group' | 'reject' | 'login' | 'admin' | 'email'
  message: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export interface DownloadRecord {
  id: string
  name: string
  type: 'single' | 'batch' | 'report'
  size: string
  downloadedAt: string
  expiryDate: string
  secureLink: string
  imageCount?: number
}

export interface SystemService {
  name: string
  status: ServiceStatus
  uptime: string
  latency?: string
  lastChecked: string
  cpuUsage?: string
  memUsage?: string
  queueSize?: number
}

export interface ReviewItem {
  id: string
  thumbnail: string
  filename: string
  rejectionReason: string
  uploadedBy: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  qualityScore: number
  riskLevel: RiskLevel
  blurScore: number
  brightnessScore: number
  faceSizeScore: number
  faceCount: number
  detectionConfidence: number
  enhancementScore: number
  isDuplicate?: boolean
  similarityScore?: number
  matchedFilename?: string
  matchedThumbnail?: string
  allowReprocess?: boolean
  escalated?: boolean
  escalationNote?: string
}

export interface SecurityAlert {
  id: string
  type: 'failed_login' | 'rate_limit' | 'suspicious'
  message: string
  ip: string
  timestamp: string
  risk: RiskLevel
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  description: string
  requiredRole: string
  requestBody?: string
  responseExample: string
  status?: string
}

// ─── 1. MOCK IMAGES (AT LEAST 12 RECORDS WITH FULL DETAILS) ───────────────────
export const mockImages: ImageRecord[] = [
  {
    id: 'img-1001',
    filename: 'face_portrait_001.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T18:22:00Z',
    size: '1.4 MB',
    dimensions: '1280×720',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 88,
    brightnessScore: 78,
    faceSizeScore: 92,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 98.4,
    personFolderId: 'grp-001',
    thumbnail: '#60B1FF',
    secureDownloadLink: 'https://facecloud.ai/download/sec-01a2b3c',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1002',
    filename: 'face_underexposed_002.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T17:45:00Z',
    size: '2.1 MB',
    dimensions: '1920×1080',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 91,
    brightnessScore: 82,
    faceSizeScore: 87,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 96.1,
    personFolderId: 'grp-002',
    thumbnail: '#7B61FF',
    secureDownloadLink: 'https://facecloud.ai/download/sec-02c3d4e',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1003',
    filename: 'blurry_shaky_003.jpg',
    status: 'rejected',
    rejectionReason: 'Image too blurry',
    feedback: 'The detected face has a high motion blur index of 35. Please upload a stable, sharp face portrait.',
    uploadedAt: '2026-07-08T17:10:00Z',
    size: '0.9 MB',
    dimensions: '640×480',
    enhanced: false,
    originalSaved: true,
    enhancedSaved: false,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 24,
    brightnessScore: 50,
    faceSizeScore: 68,
    qualityStatus: 'failed',
    embeddingExtracted: false,
    thumbnail: '#EF4444',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1004',
    filename: 'night_portrait_004.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T16:30:00Z',
    size: '1.8 MB',
    dimensions: '1280×720',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 85,
    brightnessScore: 72,
    faceSizeScore: 90,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 94.8,
    personFolderId: 'grp-001',
    thumbnail: '#4FFFB0',
    secureDownloadLink: 'https://facecloud.ai/download/sec-04e5f6g',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1005',
    filename: 'group_crowd_005.jpg',
    status: 'rejected',
    rejectionReason: 'Multiple faces detected',
    feedback: 'Multiple faces (4 detected) were found in this frame. FaceCloud requires exactly one face per image for compliance processing.',
    uploadedAt: '2026-07-08T15:20:00Z',
    size: '3.4 MB',
    dimensions: '2048×1536',
    enhanced: false,
    originalSaved: true,
    enhancedSaved: false,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 4,
    blurScore: 82,
    brightnessScore: 76,
    faceSizeScore: 40,
    qualityStatus: 'failed',
    embeddingExtracted: false,
    thumbnail: '#EF4444',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1006',
    filename: 'landscape_no_face.jpg',
    status: 'rejected',
    rejectionReason: 'Face not detected',
    feedback: 'Could not detect any human facial structural mapping. Please ensure the subject is facing directly forward.',
    uploadedAt: '2026-07-08T14:15:00Z',
    size: '1.2 MB',
    dimensions: '1280×720',
    enhanced: false,
    originalSaved: true,
    enhancedSaved: false,
    aiModel: 'Zero-DCE',
    faceDetected: false,
    faceCount: 0,
    blurScore: 95,
    brightnessScore: 80,
    faceSizeScore: 0,
    qualityStatus: 'failed',
    embeddingExtracted: false,
    thumbnail: '#EF4444',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1007',
    filename: 'small_face_portrait.jpg',
    status: 'rejected',
    rejectionReason: 'Face too small',
    feedback: 'The facial bounding box covers only 4% of the image surface. A minimum threshold of 10% is required.',
    uploadedAt: '2026-07-08T13:00:00Z',
    size: '0.7 MB',
    dimensions: '800×600',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 78,
    brightnessScore: 68,
    faceSizeScore: 8,
    qualityStatus: 'failed',
    embeddingExtracted: false,
    thumbnail: '#EF4444',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1008',
    filename: 'face_portrait_008.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T12:10:00Z',
    size: '1.1 MB',
    dimensions: '1024×768',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 89,
    brightnessScore: 81,
    faceSizeScore: 90,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 99.2,
    personFolderId: 'grp-003',
    thumbnail: '#60B1FF',
    secureDownloadLink: 'https://facecloud.ai/download/sec-08g8h9i',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1009',
    filename: 'dark_face_009.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T11:05:00Z',
    size: '1.6 MB',
    dimensions: '1920×1080',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 92,
    brightnessScore: 86,
    faceSizeScore: 88,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 97.5,
    personFolderId: 'grp-002',
    thumbnail: '#7B61FF',
    secureDownloadLink: 'https://facecloud.ai/download/sec-09i9j0k',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1010',
    filename: 'face_portrait_010.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T10:00:00Z',
    size: '1.2 MB',
    dimensions: '1280×720',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 86,
    brightnessScore: 75,
    faceSizeScore: 93,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 95.8,
    personFolderId: 'grp-003',
    thumbnail: '#4FFFB0',
    secureDownloadLink: 'https://facecloud.ai/download/sec-10k1l2m',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1011',
    filename: 'face_portrait_011.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T09:15:00Z',
    size: '1.5 MB',
    dimensions: '1280×720',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 90,
    brightnessScore: 84,
    faceSizeScore: 91,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 97.9,
    personFolderId: 'grp-001',
    thumbnail: '#7B61FF',
    secureDownloadLink: 'https://facecloud.ai/download/sec-11l2m3n',
    emailNotificationSent: true,
    activityLogged: true
  },
  {
    id: 'img-1012',
    filename: 'face_portrait_012.jpg',
    status: 'completed',
    uploadedAt: '2026-07-08T08:00:00Z',
    size: '1.3 MB',
    dimensions: '1280×720',
    enhanced: true,
    originalSaved: true,
    enhancedSaved: true,
    aiModel: 'Zero-DCE',
    faceDetected: true,
    faceCount: 1,
    blurScore: 87,
    brightnessScore: 80,
    faceSizeScore: 89,
    qualityStatus: 'passed',
    embeddingExtracted: true,
    matchingConfidence: 96.7,
    personFolderId: 'grp-002',
    thumbnail: '#60B1FF',
    secureDownloadLink: 'https://facecloud.ai/download/sec-12m3n4o',
    emailNotificationSent: true,
    activityLogged: true
  }
]

// ─── 2. PERSON FOLDERS (GROUPS) ──────────────────────────────────────────────
export const mockGroups: PersonFolder[] = [
  { id: 'grp-001', label: 'Person 1', imageCount: 4, lastUpdated: '2026-07-08T18:22:00Z', coverImages: ['#60B1FF', '#7B61FF', '#4FFFB0'], matchingConfidence: 98.4, createdDate: '2026-07-06T10:00:00Z' },
  { id: 'grp-002', label: 'Person 2', imageCount: 4, lastUpdated: '2026-07-08T17:45:00Z', coverImages: ['#7B61FF', '#60B1FF', '#7B61FF'], matchingConfidence: 96.1, createdDate: '2026-07-06T11:30:00Z' },
  { id: 'grp-003', label: 'Person 3', imageCount: 2, lastUpdated: '2026-07-08T12:10:00Z', coverImages: ['#60B1FF', '#4FFFB0'], matchingConfidence: 99.2, createdDate: '2026-07-07T08:00:00Z' }
]

// ─── 3. ACTIVITY LOGS (AT LEAST 20 ITEMS FOR SECURITY/METHODOLOGY) ────────────
export const mockActivity: ActivityEvent[] = [
  { id: 'act-1', type: 'upload', message: 'Original image face_portrait_001.jpg saved', timestamp: '2026-07-08T18:21:00Z', status: 'success' },
  { id: 'act-2', type: 'enhance', message: 'Zero-DCE enhancement completed on face_portrait_001.jpg', timestamp: '2026-07-08T18:21:30Z', status: 'success' },
  { id: 'act-3', type: 'validate', message: 'Face validation and quality checks passed for face_portrait_001.jpg', timestamp: '2026-07-08T18:21:50Z', status: 'success' },
  { id: 'act-4', type: 'group', message: 'Image grouped into Person Folder grp-001', timestamp: '2026-07-08T18:22:00Z', status: 'success' },
  { id: 'act-5', type: 'email', message: 'Email notification sent to user for image img-1001', timestamp: '2026-07-08T18:22:15Z', status: 'info' },
  { id: 'act-6', type: 'upload', message: 'Original image face_underexposed_002.jpg saved', timestamp: '2026-07-08T17:44:00Z', status: 'success' },
  { id: 'act-7', type: 'enhance', message: 'Zero-DCE enhancement completed on face_underexposed_002.jpg', timestamp: '2026-07-08T17:44:30Z', status: 'success' },
  { id: 'act-8', type: 'group', message: 'Image grouped into Person Folder grp-002', timestamp: '2026-07-08T17:45:00Z', status: 'success' },
  { id: 'act-9', type: 'upload', message: 'Original image blurry_shaky_003.jpg saved', timestamp: '2026-07-08T17:09:00Z', status: 'success' },
  { id: 'act-10', type: 'validate', message: 'Face validation failed: Image too blurry (blurry_shaky_003.jpg)', timestamp: '2026-07-08T17:10:00Z', status: 'error' },
  { id: 'act-11', type: 'email', message: 'Rejection notification sent for blurry_shaky_003.jpg', timestamp: '2026-07-08T17:10:30Z', status: 'info' },
  { id: 'act-12', type: 'upload', message: 'Original image night_portrait_004.jpg saved', timestamp: '2026-07-08T16:29:00Z', status: 'success' },
  { id: 'act-13', type: 'group', message: 'Image grouped into Person Folder grp-001', timestamp: '2026-07-08T16:30:00Z', status: 'success' },
  { id: 'act-14', type: 'upload', message: 'Original image group_crowd_005.jpg saved', timestamp: '2026-07-08T15:19:00Z', status: 'success' },
  { id: 'act-15', type: 'validate', message: 'Face validation failed: Multiple faces detected (group_crowd_005.jpg)', timestamp: '2026-07-08T15:20:00Z', status: 'error' },
  { id: 'act-16', type: 'upload', message: 'Original image landscape_no_face.jpg saved', timestamp: '2026-07-08T14:14:00Z', status: 'success' },
  { id: 'act-17', type: 'validate', message: 'Face validation failed: Face not detected (landscape_no_face.jpg)', timestamp: '2026-07-08T14:15:00Z', status: 'error' },
  { id: 'act-18', type: 'download', message: 'Secure download link created for face_portrait_001.jpg', timestamp: '2026-07-08T13:40:00Z', status: 'success' },
  { id: 'act-19', type: 'login', message: 'User logged in successfully from IP 192.168.1.45', timestamp: '2026-07-08T13:30:00Z', status: 'info' },
  { id: 'act-20', type: 'login', message: 'Email address verified mock state updated', timestamp: '2026-07-08T10:00:00Z', status: 'success' }
]

// ─── 4. ADMIN AUDIT LOGS (AT LEAST 10 ITEMS) ──────────────────────────────────
export const mockAuditLogs = [
  { id: 'al-1', actor: 'Admin (admin@dtm.io)', role: 'admin', action: 'Modified System Settings - Upload size limit changed to 100MB', timestamp: '2026-07-08T18:00:00Z', resource: 'System Settings', ip: '10.0.0.12', status: 'success', details: 'Increased queue buffer limit for ZIP file extraction pipelines.' },
  { id: 'al-2', actor: 'Moderator (moderator@facecloud.ai)', role: 'moderator', action: 'Approved image low_res_scan.jpg manually', timestamp: '2026-07-08T17:30:00Z', resource: 'Image Queue', ip: '10.0.0.14', status: 'success', details: 'Overrode blur checks - portrait contains acceptable details.' },
  { id: 'al-3', actor: 'Admin (admin@dtm.io)', role: 'admin', action: 'Suspended user Omar Farooq', timestamp: '2026-07-08T16:15:00Z', resource: 'User Directory', ip: '10.0.0.12', status: 'success', details: 'User account flagged for multiple mock security violations.' },
  { id: 'al-4', actor: 'Moderator (moderator@facecloud.ai)', role: 'moderator', action: 'Rejected image no_face_image.jpg manually', timestamp: '2026-07-08T15:45:00Z', resource: 'Image Queue', ip: '10.0.0.14', status: 'success', details: 'Confirmed AI result - zero human faces found.' },
  { id: 'al-5', actor: 'Admin (admin@dtm.io)', role: 'admin', action: 'Triggered model compilation test', timestamp: '2026-07-08T14:00:00Z', resource: 'Zero-DCE Service', ip: '10.0.0.12', status: 'success', details: 'Calculated GPU validation response latency at 180ms.' },
  { id: 'al-6', actor: 'Admin (admin@dtm.io)', role: 'admin', action: 'Updated security API key for AWS Rekognition', timestamp: '2026-07-08T12:00:00Z', resource: 'AWS Config', ip: '10.0.0.12', status: 'success', details: 'Rotated credentials via localStorage mock service keys.' },
  { id: 'al-7', actor: 'Moderator (moderator@facecloud.ai)', role: 'moderator', action: 'Merged Person 2 and Person 7 identity groups', timestamp: '2026-07-08T10:30:00Z', resource: 'Face Clusters', ip: '10.0.0.14', status: 'success', details: 'Merged groups after validation scan indicated 97.4% feature match.' },
  { id: 'al-8', actor: 'System Worker', role: 'admin', action: 'Rotated active API tokens', timestamp: '2026-07-08T09:00:00Z', resource: 'JWT Gateway', ip: '127.0.0.1', status: 'success', details: 'Refreshed internal mock JWT session keys.' },
  { id: 'al-9', actor: 'Admin (admin@dtm.io)', role: 'admin', action: 'Deactivated inactive User Account u4', timestamp: '2026-07-08T08:00:00Z', resource: 'User Registry', ip: '10.0.0.12', status: 'success', details: 'Marked user status as suspended.' },
  { id: 'al-10', actor: 'System Logger', role: 'admin', action: 'Cleaned database transaction logs', timestamp: '2026-07-08T00:00:00Z', resource: 'System Audit', ip: '127.0.0.1', status: 'success', details: 'Archived 14,000 logs into backup storage.' }
]

// ─── 5. SECURITY ALERTS & FAILED LOGINS ────────────────────────────────────────
export const mockSecurityAlerts: SecurityAlert[] = [
  { id: 'sec-1', type: 'failed_login', message: 'Failed login attempt for admin@dtm.io', ip: '198.51.100.22', timestamp: '2026-07-08T18:14:00Z', risk: 'medium' },
  { id: 'sec-2', type: 'rate_limit', message: 'API Rate limit exceeded on /api/images/upload', ip: '203.0.113.88', timestamp: '2026-07-08T17:50:00Z', risk: 'high' },
  { id: 'sec-3', type: 'suspicious', message: 'Multiple rapid image uploads (14 files in 2 seconds)', ip: '198.51.100.4', timestamp: '2026-07-08T16:10:00Z', risk: 'critical' },
  { id: 'sec-4', type: 'failed_login', message: 'Failed login attempt for moderator@facecloud.ai', ip: '192.168.10.15', timestamp: '2026-07-08T11:20:00Z', risk: 'low' }
]

// ─── 6. SYSTEM HEALTH MONITORING SERVICES ──────────────────────────────────────
export const mockServices: SystemService[] = [
  { name: 'Auth/JWT Service', status: 'operational', uptime: '99.98%', latency: '8ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '2%', memUsage: '142 MB', queueSize: 0 },
  { name: 'Upload Storage Service', status: 'operational', uptime: '100%', latency: '55ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '8%', memUsage: '512 MB', queueSize: 0 },
  { name: 'Zero-DCE Enhancement Service', status: 'operational', uptime: '99.91%', latency: '180ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '65%', memUsage: '2.4 GB', queueSize: 2 },
  { name: 'Face Detection Service', status: 'operational', uptime: '99.99%', latency: '210ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '42%', memUsage: '1.8 GB', queueSize: 1 },
  { name: 'Quality Validation Service', status: 'operational', uptime: '99.99%', latency: '95ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '15%', memUsage: '340 MB', queueSize: 0 },
  { name: 'Face Grouping Service', status: 'degraded', uptime: '97.40%', latency: '420ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '88%', memUsage: '4.1 GB', queueSize: 8 },
  { name: 'Notification Service', status: 'operational', uptime: '99.95%', latency: '40ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '1%', memUsage: '94 MB', queueSize: 0 },
  { name: 'Audit Logging Service', status: 'operational', uptime: '99.99%', latency: '15ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '3%', memUsage: '110 MB', queueSize: 0 },
  { name: 'API Gateway', status: 'operational', uptime: '99.99%', latency: '4ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '5%', memUsage: '210 MB', queueSize: 0 },
  { name: 'Queue Worker', status: 'operational', uptime: '99.85%', latency: '12ms', lastChecked: '2026-07-08T18:22:00Z', cpuUsage: '24%', memUsage: '890 MB', queueSize: 3 }
]

// ─── 7. MOCK UPLOAD STATISTICS ────────────────────────────────────────────────
export const mockUploadStats = {
  totalUploads: 48372,
  uploadsToday: 242,
  uploadsThisWeek: 1684,
  uploadsThisMonth: 6420,
  averageUploadSize: '1.62 MB',
  singleUploadsCount: 14209,
  multipleUploadsCount: 22184,
  zipUploadsCount: 11979,
  uploadsPerDay: [
    { date: 'Jul 2', single: 120, multiple: 180, zip: 90 },
    { date: 'Jul 3', single: 130, multiple: 195, zip: 102 },
    { date: 'Jul 4', single: 145, multiple: 160, zip: 88 },
    { date: 'Jul 5', single: 110, multiple: 140, zip: 75 },
    { date: 'Jul 6', single: 160, multiple: 220, zip: 120 },
    { date: 'Jul 7', single: 175, multiple: 245, zip: 135 },
    { date: 'Jul 8', single: 188, multiple: 256, zip: 142 }
  ]
}

// ─── 8. REJECTION ANALYTICS ───────────────────────────────────────────────────
export const mockRejectionStats = {
  totalRejected: 5263,
  rejectionRate: 10.9,
  reasons: [
    { name: 'Face too small', value: 1845, color: '#FF8A02' },
    { name: 'Too dark after enhance', value: 1240, color: '#EF4444' },
    { name: 'Multiple faces', value: 924, color: '#7B61FF' },
    { name: 'Face not detected', value: 684, color: '#0084FF' },
    { name: 'Image too blurry', value: 570, color: '#4FFFB0' }
  ],
  rejectionsPerDay: [
    { date: 'Jul 2', count: 18 },
    { date: 'Jul 3', count: 24 },
    { date: 'Jul 4', count: 15 },
    { date: 'Jul 5', count: 9 },
    { date: 'Jul 6', count: 29 },
    { date: 'Jul 7', count: 32 },
    { date: 'Jul 8', count: 35 }
  ]
}

// ─── 9. DOWNLOADS RECORDS ────────────────────────────────────────────────────
export const mockDownloads: DownloadRecord[] = [
  { id: 'dl-1', name: 'batch_face_results_1001.zip', type: 'batch', size: '14.2 MB', downloadedAt: '2026-07-08T18:22:00Z', expiryDate: '2026-07-15T18:22:00Z', secureLink: 'https://facecloud.ai/download/sec-01a2b3c', imageCount: 12 },
  { id: 'dl-2', name: 'enhanced_portrait_1002.jpg', type: 'single', size: '1.8 MB', downloadedAt: '2026-07-08T17:45:00Z', expiryDate: '2026-07-15T17:45:00Z', secureLink: 'https://facecloud.ai/download/sec-02c3d4e' },
  { id: 'dl-3', name: 'facecloud_report_1002.pdf', type: 'report', size: '320 KB', downloadedAt: '2026-07-08T17:46:00Z', expiryDate: '2026-07-15T17:46:00Z', secureLink: 'https://facecloud.ai/download/sec-rep02c3d4' }
]

// ─── 10. MODERATOR REVIEW QUEUE ───────────────────────────────────────────────
export const mockReviewItems: ReviewItem[] = [
  {
    id: 'mod-img-001',
    thumbnail: '#7B61FF',
    filename: 'unclear_dark_portrait.jpg',
    rejectionReason: 'Too dark after enhancement',
    uploadedBy: 'Ali Hassan',
    uploadedAt: '2026-07-08T16:40:00Z',
    status: 'pending',
    qualityScore: 48,
    riskLevel: 'medium',
    blurScore: 78,
    brightnessScore: 32,
    faceSizeScore: 85,
    faceCount: 1,
    detectionConfidence: 91.2,
    enhancementScore: 52,
    allowReprocess: true
  },
  {
    id: 'mod-img-002',
    thumbnail: '#60B1FF',
    filename: 'shaky_shutter_022.jpg',
    rejectionReason: 'Image too blurry',
    uploadedBy: 'Sarah Khan',
    uploadedAt: '2026-07-08T15:30:00Z',
    status: 'pending',
    qualityScore: 35,
    riskLevel: 'high',
    blurScore: 18,
    brightnessScore: 70,
    faceSizeScore: 92,
    faceCount: 1,
    detectionConfidence: 89.5,
    enhancementScore: 40,
    allowReprocess: true
  },
  {
    id: 'mod-img-003',
    thumbnail: '#4FFFB0',
    filename: 'crowd_walking_shot.png',
    rejectionReason: 'Multiple faces detected',
    uploadedBy: 'Omar Farooq',
    uploadedAt: '2026-07-08T14:10:00Z',
    status: 'pending',
    qualityScore: 55,
    riskLevel: 'medium',
    blurScore: 84,
    brightnessScore: 74,
    faceSizeScore: 50,
    faceCount: 3,
    detectionConfidence: 94.6,
    enhancementScore: 68,
    allowReprocess: false
  },
  {
    id: 'mod-img-005',
    thumbnail: '#EF4444',
    filename: 'double_upload_face.jpg',
    rejectionReason: 'Duplicate upload flagged',
    uploadedBy: 'Ijaz Ahmad',
    uploadedAt: '2026-07-08T13:00:00Z',
    status: 'pending',
    qualityScore: 92,
    riskLevel: 'medium',
    blurScore: 95,
    brightnessScore: 90,
    faceSizeScore: 91,
    faceCount: 1,
    detectionConfidence: 98.5,
    enhancementScore: 94,
    isDuplicate: true,
    similarityScore: 94.2,
    matchedFilename: 'original_user_face_001.jpg',
    matchedThumbnail: '#0084FF',
    allowReprocess: true
  },
  {
    id: 'mod-img-006',
    thumbnail: '#F59E0B',
    filename: 'twin_match_check.jpg',
    rejectionReason: 'Duplicate upload flagged',
    uploadedBy: 'Sarah Khan',
    uploadedAt: '2026-07-08T11:45:00Z',
    status: 'pending',
    qualityScore: 88,
    riskLevel: 'low',
    blurScore: 92,
    brightnessScore: 86,
    faceSizeScore: 88,
    faceCount: 1,
    detectionConfidence: 96.8,
    enhancementScore: 90,
    isDuplicate: true,
    similarityScore: 89.8,
    matchedFilename: 'profile_face_backup.png',
    matchedThumbnail: '#A78BFA',
    allowReprocess: false
  },
  {
    id: 'mod-img-004',
    thumbnail: '#8A96AD',
    filename: 'extreme_tilt_face.jpg',
    rejectionReason: 'Face not detected',
    uploadedBy: 'Maryam Tariq',
    uploadedAt: '2026-07-07T18:00:00Z',
    status: 'approved',
    qualityScore: 65,
    riskLevel: 'low',
    blurScore: 88,
    brightnessScore: 82,
    faceSizeScore: 86,
    faceCount: 1,
    detectionConfidence: 97.2,
    enhancementScore: 80,
    allowReprocess: false
  }
]

// ─── 11. MODERATOR AUDIT ENTRIES ─────────────────────────────────────────────
export const mockModeratorAudit = [
  { id: 'ma-1', timestamp: '2026-07-08T17:30:00Z', moderatorName: 'Vaneeza Sohaib', filename: 'low_res_scan.jpg', action: 'Manual Approve', oldStatus: 'rejected', newStatus: 'approved', reason: 'Blur checks overridden by manual inspection', userNotified: true },
  { id: 'ma-2', timestamp: '2026-07-08T15:45:00Z', moderatorName: 'Vaneeza Sohaib', filename: 'no_face_image.jpg', action: 'Confirm Rejection', oldStatus: 'rejected', newStatus: 'rejected', reason: 'Confirmed AI result - zero human faces found', userNotified: true }
]

// ─── 12. POSTMAN API ENDPOINTS & TEST DOCS ────────────────────────────────────
export const mockApiEndpoints: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user and return a JWT access token.',
    requiredRole: 'Public',
    requestBody: '{\n  "email": "user@facecloud.ai",\n  "password": "password"\n}',
    responseExample: '{\n  "success": true,\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": {\n    "name": "Ali Hassan",\n    "email": "user@facecloud.ai",\n    "role": "user"\n  }\n}',
    status: 'stable'
  },
  {
    method: 'POST',
    path: '/api/images/upload',
    description: 'Ingest a single image file for enhancement and validation.',
    requiredRole: 'User',
    requestBody: 'FormData: {\n  "file": [FileObject]\n}',
    responseExample: '{\n  "success": true,\n  "jobId": "job-1002",\n  "originalFilename": "portrait.jpg",\n  "status": "uploaded"\n}',
    status: 'stable'
  },
  {
    method: 'GET',
    path: '/api/images/list',
    description: 'List all processed images associated with the authenticated session.',
    requiredRole: 'User',
    responseExample: '{\n  "success": true,\n  "images": [\n    {\n      "id": "img-1001",\n      "filename": "face_portrait_001.jpg",\n      "status": "completed",\n      "aiModel": "Zero-DCE",\n      "matchingConfidence": 98.4\n    }\n  ]\n}',
    status: 'stable'
  },
  {
    method: 'GET',
    path: '/api/admin/users',
    description: 'Retrieve users list with active statistics.',
    requiredRole: 'Admin',
    responseExample: '{\n  "success": true,\n  "users": [\n    {\n      "id": "u1",\n      "name": "Ali Hassan",\n      "email": "ali@dtm.io",\n      "role": "admin",\n      "status": "active"\n    }\n  ]\n}',
    status: 'stable'
  },
  {
    method: 'GET',
    path: '/api/admin/audit-logs',
    description: 'Retrieve full system security audit trail.',
    requiredRole: 'Admin',
    responseExample: '{\n  "success": true,\n  "logs": [\n    {\n      "id": "al-1",\n      "actor": "admin@dtm.io",\n      "action": "Modified settings",\n      "status": "success"\n    }\n  ]\n}',
    status: 'stable'
  }
]

export const mockUsers: User[] = [
  { id: 'u1', name: 'Ali Hassan', email: 'ali@dtm.io', role: 'admin', status: 'active', uploads: 248, joinedAt: '2026-01-15', avatar: 'AH' },
  { id: 'u2', name: 'Ijaz Ahmad', email: 'user@facecloud.ai', role: 'user', status: 'active', uploads: 134, joinedAt: '2026-02-10', avatar: 'IA' },
  { id: 'u3', name: 'Vaneeza Sohaib', email: 'moderator@facecloud.ai', role: 'moderator', status: 'active', uploads: 87, joinedAt: '2026-02-18', avatar: 'VS' },
  { id: 'u4', name: 'Sarah Khan', email: 'sarah@example.com', role: 'user', status: 'active', uploads: 312, joinedAt: '2026-03-05', avatar: 'SK' },
  { id: 'u5', name: 'Omar Farooq', email: 'omar@example.com', role: 'user', status: 'suspended', uploads: 56, joinedAt: '2026-03-22', avatar: 'OF' }
]

export const mockJobs: ProcessingJob[] = [
  { 
    id: 'job-001', 
    filename: 'face_portrait_001.jpg', 
    uploadType: 'Single',
    progress: 100,
    duration: '4.2s',
    createdAt: '2026-07-08T18:21:00Z',
    currentStage: 'completed',
    stages: [
      { label: 'Authentication', status: 'done', time: '0.1s' },
      { label: 'Upload Ingest', status: 'done', time: '0.4s' },
      { label: 'Original Saved', status: 'done', time: '0.2s' },
      { label: 'Zero-DCE Enhance', status: 'done', time: '1.2s' },
      { label: 'Face Validation', status: 'done', time: '0.8s' },
      { label: 'Quality Audit', status: 'done', time: '0.4s' },
      { label: 'Embedding Extraction', status: 'done', time: '0.6s' },
      { label: 'Person Folder Match', status: 'done', time: '0.5s' },
      { label: 'Secure Download', status: 'done', time: '0.2s' }
    ],
    details: {
      originalSaved: 'Yes',
      aiModel: 'Zero-DCE (V1)',
      faceCount: 1,
      blurScore: '94/100 (Pass)',
      brightnessScore: '88/100 (Pass)',
      faceSizeScore: '142x142px (Pass)',
      personFolder: 'Person Folder 001',
      notificationSent: 'Yes (Email dispatched)',
      secureDownload: 'https://facecloud.ai/download/signed-001',
      activityLog: 'Registered: user_event_384'
    }
  },
  { 
    id: 'job-002', 
    filename: 'face_underexposed_002.jpg', 
    uploadType: 'Single',
    progress: 40,
    duration: '2.1s',
    createdAt: '2026-07-08T18:22:00Z',
    currentStage: 'enhancing',
    stages: [
      { label: 'Authentication', status: 'done', time: '0.1s' },
      { label: 'Upload Ingest', status: 'done', time: '0.5s' },
      { label: 'Original Saved', status: 'done', time: '0.2s' },
      { label: 'Zero-DCE Enhance', status: 'active', time: 'Running' },
      { label: 'Face Validation', status: 'pending' },
      { label: 'Quality Audit', status: 'pending' },
      { label: 'Embedding Extraction', status: 'pending' },
      { label: 'Person Folder Match', status: 'pending' },
      { label: 'Secure Download', status: 'pending' }
    ],
    details: {
      originalSaved: 'Yes',
      aiModel: 'Zero-DCE (V1)',
      faceCount: 0,
      blurScore: 'Pending',
      brightnessScore: 'Calculating exposure maps...',
      faceSizeScore: 'Pending',
      personFolder: 'Pending matching...',
      notificationSent: 'No (Pending compilation)',
      secureDownload: 'Awaiting completion...',
      activityLog: 'Pending registration...'
    }
  },
  { 
    id: 'job-003', 
    filename: 'face_multiple_group.png', 
    uploadType: 'Multiple',
    progress: 55,
    duration: '3.0s',
    createdAt: '2026-07-08T18:23:00Z',
    currentStage: 'validating',
    stages: [
      { label: 'Authentication', status: 'done', time: '0.1s' },
      { label: 'Upload Ingest', status: 'done', time: '0.6s' },
      { label: 'Original Saved', status: 'done', time: '0.2s' },
      { label: 'Zero-DCE Enhance', status: 'done', time: '1.4s' },
      { label: 'Face Validation', status: 'active', time: 'Running' },
      { label: 'Quality Audit', status: 'pending' },
      { label: 'Embedding Extraction', status: 'pending' },
      { label: 'Person Folder Match', status: 'pending' },
      { label: 'Secure Download', status: 'pending' }
    ],
    details: {
      originalSaved: 'Yes',
      aiModel: 'Zero-DCE (V1)',
      faceCount: 2,
      blurScore: '89/100 (Pass)',
      brightnessScore: '76/100 (Pass)',
      faceSizeScore: '92x92px (Pass)',
      personFolder: 'Awaiting validation',
      notificationSent: 'No',
      secureDownload: 'Awaiting completion...',
      activityLog: 'In-progress validation run...'
    }
  },
  { 
    id: 'job-004', 
    filename: 'face_blurry_night.jpg', 
    uploadType: 'Single',
    progress: 65,
    duration: '3.6s',
    createdAt: '2026-07-08T18:24:00Z',
    currentStage: 'rejected',
    failureReason: 'Quality Audit failed due to high motion blur (Score 22/100).',
    stages: [
      { label: 'Authentication', status: 'done', time: '0.1s' },
      { label: 'Upload Ingest', status: 'done', time: '0.4s' },
      { label: 'Original Saved', status: 'done', time: '0.2s' },
      { label: 'Zero-DCE Enhance', status: 'done', time: '1.1s' },
      { label: 'Face Validation', status: 'done', time: '0.9s' },
      { label: 'Quality Audit', status: 'failed', time: 'Failed' },
      { label: 'Embedding Extraction', status: 'pending' },
      { label: 'Person Folder Match', status: 'pending' },
      { label: 'Secure Download', status: 'pending' }
    ],
    details: {
      originalSaved: 'Yes',
      aiModel: 'Zero-DCE (V1)',
      faceCount: 1,
      blurScore: '22/100 (FAILED: Motion Blur)',
      brightnessScore: '84/100 (Pass)',
      faceSizeScore: '110x110px (Pass)',
      personFolder: 'Awaiting override review',
      rejectionReason: 'Blur index below minimal system threshold (Minimum: 50).',
      notificationSent: 'Yes (Moderator queue warning dispatched)',
      secureDownload: 'N/A (Rejected)',
      activityLog: 'Audited rejection: user_event_389'
    }
  },
  { 
    id: 'job-005', 
    filename: 'employee_batch_portraits.zip', 
    uploadType: 'ZIP',
    progress: 100,
    duration: '12.8s',
    createdAt: '2026-07-08T18:25:00Z',
    currentStage: 'completed',
    stages: [
      { label: 'Authentication', status: 'done', time: '0.1s' },
      { label: 'Upload Ingest', status: 'done', time: '1.2s' },
      { label: 'Original Saved', status: 'done', time: '0.8s' },
      { label: 'Zero-DCE Enhance', status: 'done', time: '4.6s' },
      { label: 'Face Validation', status: 'done', time: '2.4s' },
      { label: 'Quality Audit', status: 'done', time: '1.5s' },
      { label: 'Embedding Extraction', status: 'done', time: '1.1s' },
      { label: 'Person Folder Match', status: 'done', time: '0.9s' },
      { label: 'Secure Download', status: 'done', time: '0.2s' }
    ],
    details: {
      originalSaved: 'Yes (ZIP unpacked successfully, 42 images)',
      aiModel: 'Zero-DCE (Batch V1)',
      faceCount: 42,
      blurScore: '40/42 images passed',
      brightnessScore: '42/42 images passed',
      faceSizeScore: '42/42 images passed',
      personFolder: 'Clustered: 6 folders generated',
      notificationSent: 'Yes (ZIP complete report dispatched)',
      secureDownload: 'https://facecloud.ai/download/signed-005',
      activityLog: 'Batch job complete: user_event_391'
    }
  },
  { 
    id: 'job-006', 
    filename: 'security_cameras_test.zip', 
    uploadType: 'ZIP',
    progress: 0,
    duration: '0.2s',
    createdAt: '2026-07-08T18:26:00Z',
    currentStage: 'uploaded',
    stages: [
      { label: 'Authentication', status: 'active', time: 'Running' },
      { label: 'Upload Ingest', status: 'pending' },
      { label: 'Original Saved', status: 'pending' },
      { label: 'Zero-DCE Enhance', status: 'pending' },
      { label: 'Face Validation', status: 'pending' },
      { label: 'Quality Audit', status: 'pending' },
      { label: 'Embedding Extraction', status: 'pending' },
      { label: 'Person Folder Match', status: 'pending' },
      { label: 'Secure Download', status: 'pending' }
    ],
    details: {
      originalSaved: 'Pending unpack...',
      aiModel: 'Zero-DCE (V1)',
      faceCount: 0,
      blurScore: 'Pending',
      brightnessScore: 'Pending',
      faceSizeScore: 'Pending',
      personFolder: 'Pending...',
      notificationSent: 'No',
      secureDownload: 'Awaiting completion...',
      activityLog: 'Job queue index created'
    }
  }
]

// ─── 13. ADDITIONAL CHART ARRAYS REQUIRED BY PORTALS ────────────────────────
export const adminStats = {
  storageUsedGB: 14.2,
  storageTotalGB: 100,
  totalUsers: 148,
  totalUploads: 48372,
  enhancedImages: 43109,
  rejectedImages: 5263,
  liveSessions: 1420,
  successRate: 89.1,
  rejectionRate: 10.9
}

export const uploadTrendData = [
  { date: 'Jul 2', uploads: 390, enhanced: 350, rejected: 40 },
  { date: 'Jul 3', uploads: 427, enhanced: 390, rejected: 37 },
  { date: 'Jul 4', uploads: 393, enhanced: 360, rejected: 33 },
  { date: 'Jul 5', uploads: 325, enhanced: 300, rejected: 25 },
  { date: 'Jul 6', uploads: 500, enhanced: 450, rejected: 50 },
  { date: 'Jul 7', uploads: 555, enhanced: 500, rejected: 55 },
  { date: 'Jul 8', uploads: 586, enhanced: 530, rejected: 56 }
]

export const rejectionReasonsData = [
  { name: 'Face too small', value: 35, color: '#FF8A02' },
  { name: 'Too dark after enhance', value: 24, color: '#EF4444' },
  { name: 'Multiple faces', value: 18, color: '#7B61FF' },
  { name: 'Face not detected', value: 13, color: '#0084FF' },
  { name: 'Image too blurry', value: 10, color: '#4FFFB0' }
]

export const liveSessionData = [
  { date: 'Jul 2', sessions: 180 },
  { date: 'Jul 3', sessions: 210 },
  { date: 'Jul 4', sessions: 195 },
  { date: 'Jul 5', sessions: 140 },
  { date: 'Jul 6', sessions: 250 },
  { date: 'Jul 7', sessions: 280 },
  { date: 'Jul 8', sessions: 295 }
]

export const storageData = [
  { name: 'Jan', gb: 2.4 },
  { name: 'Feb', gb: 4.8 },
  { name: 'Mar', gb: 6.2 },
  { name: 'Apr', gb: 8.5 },
  { name: 'May', gb: 10.1 },
  { name: 'Jun', gb: 12.4 },
  { name: 'Jul', gb: 14.2 }
]

export const enhancementSuccessData = [
  { name: 'W1', success: 88, failed: 12 },
  { name: 'W2', success: 89, failed: 11 },
  { name: 'W3', success: 91, failed: 9 },
  { name: 'W4', success: 87, failed: 13 },
  { name: 'W5', success: 92, failed: 8 },
  { name: 'W6', success: 94, failed: 6 },
  { name: 'W7', success: 90, failed: 10 }
]

export const userStats = {
  totalUploads: 142,
  enhancedImages: 120,
  rejectedImages: 22,
  identityGroups: 3,
  liveSessions: 14,
  processingInProgress: 1
}

export const recentUploads = mockImages.slice(0, 5)

export const processingOverviewData = [
  { name: 'Ingested', value: 142 },
  { name: 'Enhanced', value: 120 },
  { name: 'Grouped', value: 115 },
  { name: 'Rejected', value: 22 }
]

// ─── MODERATOR PANEL EXPANSION MOCK DATA ─────────────────────────────────────
export interface OrgMember {
  id: string
  name: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  status: 'active' | 'suspended' | 'pending'
  joinedAt: string
  createdBy: string
}

export const mockOrgMembers: OrgMember[] = [
  { id: 'm-1', name: 'Ali Hassan', email: 'ali@dtm.io', role: 'admin', status: 'active', joinedAt: '2026-01-15', createdBy: 'u1' },
  { id: 'm-2', name: 'Ijaz Ahmad', email: 'user@facecloud.ai', role: 'user', status: 'active', joinedAt: '2026-02-10', createdBy: 'u3' },
  { id: 'm-3', name: 'Sarah Khan', email: 'sarah@example.com', role: 'user', status: 'active', joinedAt: '2026-03-05', createdBy: 'u3' },
  { id: 'm-4', name: 'Omar Farooq', email: 'omar@example.com', role: 'user', status: 'suspended', joinedAt: '2026-03-22', createdBy: 'u3' },
  { id: 'm-5', name: 'Ayesha Malik', email: 'ayesha@example.com', role: 'user', status: 'active', joinedAt: '2026-04-12', createdBy: 'u99' }, // Not visible to u3
  { id: 'm-6', name: 'Zainab Bibi', email: 'zainab@example.com', role: 'user', status: 'pending', joinedAt: '2026-05-18', createdBy: 'u3' },
  { id: 'm-7', name: 'Usman Ghani', email: 'usman@example.com', role: 'moderator', status: 'active', joinedAt: '2026-02-20', createdBy: 'u3' },
]

export interface BatchRecord {
  id: string
  name: string
  type: 'ZIP' | 'Multiple'
  submittedBy: string
  submittedAt: string
  status: 'processing' | 'completed' | 'failed' | 'cancelled' | 'locked'
  progress: number
  counts: { accepted: number; rejected: number; review: number; failed: number }
  images: { id: string; filename: string; outcome: 'accepted' | 'rejected' | 'review' | 'failed'; size: string }[]
}

export const mockBatches: BatchRecord[] = [
  {
    id: 'b-101',
    name: 'staff_portraits_q3.zip',
    type: 'ZIP',
    submittedBy: 'Sarah Khan',
    submittedAt: '2026-07-16T10:00:00Z',
    status: 'completed',
    progress: 100,
    counts: { accepted: 12, rejected: 2, review: 1, failed: 0 },
    images: [
      { id: 'img-b1', filename: 'john_doe.jpg', outcome: 'accepted', size: '1.4 MB' },
      { id: 'img-b2', filename: 'jane_smith.jpg', outcome: 'accepted', size: '1.6 MB' },
      { id: 'img-b3', filename: 'blurry_face.jpg', outcome: 'rejected', size: '0.9 MB' },
      { id: 'img-b4', filename: 'side_profile.jpg', outcome: 'review', size: '1.2 MB' },
    ]
  },
  {
    id: 'b-102',
    name: 'bulk_upload_verification',
    type: 'Multiple',
    submittedBy: 'Ijaz Ahmad',
    submittedAt: '2026-07-17T11:20:00Z',
    status: 'processing',
    progress: 60,
    counts: { accepted: 8, rejected: 0, review: 2, failed: 1 },
    images: [
      { id: 'img-b5', filename: 'face1.jpg', outcome: 'accepted', size: '1.1 MB' },
      { id: 'img-b6', filename: 'face2.jpg', outcome: 'accepted', size: '1.3 MB' },
      { id: 'img-b7', filename: 'dark_face.jpg', outcome: 'review', size: '1.0 MB' },
      { id: 'img-b8', filename: 'upload_error.png', outcome: 'failed', size: '2.4 MB' },
    ]
  },
  {
    id: 'b-103',
    name: 'archived_members_v2.zip',
    type: 'ZIP',
    submittedBy: 'Sarah Khan',
    submittedAt: '2026-07-15T09:00:00Z',
    status: 'failed',
    progress: 40,
    counts: { accepted: 2, rejected: 1, review: 0, failed: 5 },
    images: [
      { id: 'img-b9', filename: 'member1.jpg', outcome: 'accepted', size: '1.5 MB' },
      { id: 'img-img-b10', filename: 'corrupt_header.jpg', outcome: 'failed', size: '0.1 MB' },
    ]
  },
  {
    id: 'b-104',
    name: 'cancelled_session_import.zip',
    type: 'ZIP',
    submittedBy: 'Ijaz Ahmad',
    submittedAt: '2026-07-14T14:30:00Z',
    status: 'cancelled',
    progress: 20,
    counts: { accepted: 1, rejected: 0, review: 0, failed: 0 },
    images: []
  },
  {
    id: 'b-105',
    name: 'locked_compliance_audit.zip',
    type: 'ZIP',
    submittedBy: 'Admin (ali@dtm.io)',
    submittedAt: '2026-07-10T08:00:00Z',
    status: 'locked',
    progress: 100,
    counts: { accepted: 45, rejected: 5, review: 0, failed: 0 },
    images: []
  }
]

export interface ModNotification {
  id: string
  type: 'Assignment' | 'Deadline' | 'Failure' | 'Escalation'
  description: string
  timestamp: string
  isRead: boolean
}

export const mockModNotifications: ModNotification[] = [
  { id: 'n-1', type: 'Assignment', description: 'New review item low_res_scan.jpg assigned to queue', timestamp: '2026-07-17T14:00:00Z', isRead: false },
  { id: 'n-2', type: 'Deadline', description: 'SLA Warning: crowd_walking_shot.png review deadline in 2 hours', timestamp: '2026-07-17T13:30:00Z', isRead: false },
  { id: 'n-3', type: 'Failure', description: 'ZIP Batch Extraction failed for archived_members_v2.zip', timestamp: '2026-07-17T11:45:00Z', isRead: true },
  { id: 'n-4', type: 'Escalation', description: 'Escalation case ESC-402 resolved by Admin (ali@dtm.io)', timestamp: '2026-07-16T16:00:00Z', isRead: true },
]

export interface GeneratedReport {
  id: string
  type: string
  dateRange: string
  format: 'CSV' | 'PDF' | 'JSON'
  generatedBy: string
  generatedAt: string
  downloadUrl: string
}

export const mockReportHistory: GeneratedReport[] = [
  { id: 'rep-1', type: 'Review activity', dateRange: '2026-07-01 to 2026-07-15', format: 'PDF', generatedBy: 'Vaneeza Sohaib', generatedAt: '2026-07-15T10:00:00Z', downloadUrl: '#' },
  { id: 'rep-2', type: 'Quality/rejection stats', dateRange: '2026-07-01 to 2026-07-10', format: 'CSV', generatedBy: 'Vaneeza Sohaib', generatedAt: '2026-07-10T11:30:00Z', downloadUrl: '#' }
]

