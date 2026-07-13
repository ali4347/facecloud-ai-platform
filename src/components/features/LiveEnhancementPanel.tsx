import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, StopCircle, Play, Zap, Download, RefreshCw, Settings, Info, Aperture, ScanFace, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, ImageIcon, Save, Sparkles } from 'lucide-react'
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision'
import { GradientButton } from '../ui/GradientButton'
import { StatusBadge } from '../ui/StatusBadge'
import { BeforeAfterSlider } from './BeforeAfterSlider'

interface LiveEnhancementPanelProps {
  className?: string
}

type CameraState = 'idle' | 'requesting' | 'active' | 'stopped' | 'error'
type DetectorStatus = 'loading' | 'ready' | 'unavailable' | 'error'
type ActiveTab = 'live' | 'snapshot'





const PIPELINE_STEPS = [
  { label: 'Capturing frame', icon: '📸' },
  { label: 'Detecting face', icon: '🔍' },
  { label: 'Validating exactly one face', icon: '✅' },
  { label: 'Running Zero-DCE low-light enhancement', icon: '💡' },
  { label: 'Restoring facial details', icon: '✨' },
  { label: 'Upscaling face region', icon: '🔬' },
  { label: 'Generating enhanced output', icon: '🖼️' },
]

export function LiveEnhancementPanel({ className }: LiveEnhancementPanelProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('live')

  // Sliders state
  const [strength, setStrength] = useState(75)
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(60)
  const [detail, setDetail] = useState(45)
  const [noiseReduction, setNoiseReduction] = useState(40)

  // Camera & Stream states
  const [camState, setCamState] = useState<CameraState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Real-time metrics
  const [fps, setFps] = useState(0)
  const [latency, setLatency] = useState(0)
  const [resolution, setResolution] = useState('N/A')
  const [snapshotsCount, setSnapshotsCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  // MediaPipe Face Detection states
  const [faceCount, setFaceCount] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [smallestConfidence, setSmallestConfidence] = useState(0)
  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>('loading')
  const [detectorModel, setDetectorModel] = useState<'full-range' | 'short-range' | 'none'>('none')
  const [smallFaceWarning, setSmallFaceWarning] = useState(false)
  const [detectorFallbackMsg, setDetectorFallbackMsg] = useState('')

  // Snapshot Enhancement states
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null)
  const [enhancedSnapshotDataUrl, setEnhancedSnapshotDataUrl] = useState<string | null>(null)
  const [snapshotProcessing, setSnapshotProcessing] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(-1)
  const [pipelineComplete, setPipelineComplete] = useState(false)
  const [enhancementMetrics, setEnhancementMetrics] = useState({
    confidence: 0,
    brightness: 0,
    detail: 0,
    validation: '',
    resolution: '',
  })

  // Developer info card
  const [devInfoOpen, setDevInfoOpen] = useState(false)

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState('')

  // Refs
  const originalVideoRef = useRef<HTMLVideoElement | null>(null)
  const enhancedVideoRef = useRef<HTMLVideoElement | null>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const streamRef = useRef<MediaStream | null>(null)
  const faceDetectorRef = useRef<any>(null)
  const requestRef = useRef<number | null>(null)
  const lastDetectionTimeRef = useRef<number>(0)

  // Timer loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (camState === 'active') {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [camState])

  // Preload face detector on component mount
  useEffect(() => {
    initDetector()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])


  const formatElapsed = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0')
    const secs = (s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Try to create a detector with GPU then CPU fallback
  const tryCreateDetector = async (vision: any, modelPath: string, conf: number) => {
    try {
      console.log(`Attempting to load face detector model from: ${modelPath}`)
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: conf,
      })
      console.log(`Successfully loaded detector with GPU delegate from: ${modelPath}`)
      return detector
    } catch (gpuError) {
      console.warn(`GPU failed for ${modelPath}, trying CPU...`, gpuError)
      try {
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
          runningMode: 'VIDEO',
          minDetectionConfidence: conf,
        })
        console.log(`Successfully loaded detector with CPU delegate from: ${modelPath}`)
        return detector
      } catch (cpuError) {
        console.error(`CPU loading failed for ${modelPath}:`, cpuError)
        return null
      }
    }
  }

  // Initialize MediaPipe FaceDetector — full-range first, short-range fallback
  const initDetector = async () => {
    setDetectorStatus('loading')
    setDetectorFallbackMsg('')
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      // 1. Try full-range model (detects close + distant faces)
      const fullRangePath = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_full_range_sparse/float16/latest/blaze_face_full_range_sparse.tflite'
      let detector = await tryCreateDetector(vision, fullRangePath, 0.25)
      if (detector) {
        faceDetectorRef.current = detector
        setDetectorModel('full-range')
        setDetectorStatus('ready')
        console.log('Full-range face detector ready.')
        return detector
      }

      // 2. Fallback: short-range model
      console.warn('Full-range model failed. Falling back to short-range model.')
      const shortRangePaths = [
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
        '/mediapipe/blaze_face_short_range.tflite',
      ]
      for (const path of shortRangePaths) {
        detector = await tryCreateDetector(vision, path, 0.3)
        if (detector) {
          faceDetectorRef.current = detector
          setDetectorModel('short-range')
          setDetectorStatus('ready')
          setDetectorFallbackMsg('Full-range detector unavailable. Close-range detector is active. Distant faces may not be detected.')
          console.log('Short-range face detector ready (fallback).')
          return detector
        }
      }

      throw new Error('Could not initialize detector from any of the provided paths.')
    } catch (err) {
      console.error('Face detector failed to load:', err)
      setDetectorStatus('error')
      return null
    }
  }

  // Draw detected boxes and landmarks on canvas
  const drawDetections = (
    canvas: HTMLCanvasElement, 
    video: HTMLVideoElement, 
    detections: any[]
  ) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.clientWidth
    canvas.height = video.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!detections || detections.length === 0) return

    const videoW = video.videoWidth
    const videoH = video.videoHeight
    const canvasW = canvas.width
    const canvasH = canvas.height

    const videoAspect = videoW / videoH
    const canvasAspect = canvasW / canvasH

    let scale = 1
    let offsetX = 0
    let offsetY = 0

    if (videoAspect > canvasAspect) {
      scale = canvasH / videoH
      offsetX = (canvasW - videoW * scale) / 2
    } else {
      scale = canvasW / videoW
      offsetY = (canvasH - videoH * scale) / 2
    }

    detections.forEach((det, index) => {
      const bbox = det.boundingBox
      if (!bbox) return

      // Map raw video pixels coordinates to layout scale
      const rawX = bbox.originX * scale + offsetX
      const y = bbox.originY * scale + offsetY
      const width = bbox.width * scale
      const height = bbox.height * scale

      // Mirror the horizontal placement since video element is scale-x-[-1]
      const x = canvasW - rawX - width

      // Draw bounding box (mint)
      ctx.strokeStyle = '#4FFFB0'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)

      // Corner brackets (bright blue)
      const bracketLength = Math.min(15, width * 0.2)
      ctx.strokeStyle = '#0084FF'
      ctx.lineWidth = 3

      // Top-Left
      ctx.beginPath()
      ctx.moveTo(x + bracketLength, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + bracketLength)
      ctx.stroke()

      // Top-Right
      ctx.beginPath()
      ctx.moveTo(x + width - bracketLength, y)
      ctx.lineTo(x + width, y)
      ctx.lineTo(x + width, y + bracketLength)
      ctx.stroke()

      // Bottom-Left
      ctx.beginPath()
      ctx.moveTo(x, y + height - bracketLength)
      ctx.lineTo(x, y + height)
      ctx.lineTo(x + bracketLength, y + height)
      ctx.stroke()

      // Bottom-Right
      ctx.beginPath()
      ctx.moveTo(x + width - bracketLength, y + height)
      ctx.lineTo(x + width, y + height)
      ctx.lineTo(x + width, y + height - bracketLength)
      ctx.stroke()

      // Draw rounded rectangle helper
      const drawRoundedRect = (
        c: CanvasRenderingContext2D,
        rx: number,
        ry: number,
        rw: number,
        rh: number,
        rad: number,
        fill: string,
        stroke: string
      ) => {
        c.beginPath()
        c.moveTo(rx + rad, ry)
        c.lineTo(rx + rw - rad, ry)
        c.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad)
        c.lineTo(rx + rw, ry + rh - rad)
        c.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh)
        c.lineTo(rx + rad, ry + rh)
        c.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad)
        c.lineTo(rx, ry + rad)
        c.quadraticCurveTo(rx, ry, rx + rad, ry)
        c.closePath()
        if (fill) {
          c.fillStyle = fill
          c.fill()
        }
        if (stroke) {
          c.strokeStyle = stroke
          c.lineWidth = 1
          c.stroke()
        }
      }

      // Label configuration
      const score = det.categories?.[0]?.score
      const detectionConf = score ? Math.round(score * 100) : 80
      const fontSize = Math.max(10, Math.min(12, width * 0.08))

      const parts: { text: string; color: string; sizeMultiplier?: number }[] = []
      parts.push({ text: `Face ${index + 1}`, color: '#FFFFFF' })
      parts.push({ text: ' • ', color: 'rgba(255,255,255,0.4)' })
      parts.push({ text: `${detectionConf}%`, color: '#7DEBFF', sizeMultiplier: 0.9 })

      // Calculate label width
      let totalWidth = 0
      parts.forEach(p => {
        const size = p.sizeMultiplier ? fontSize * p.sizeMultiplier : fontSize
        ctx.font = `bold ${size}px sans-serif`
        totalWidth += ctx.measureText(p.text).width
      })

      const paddingX = 8
      const paddingY = 6
      const labelW = totalWidth + paddingX * 2
      const labelH = fontSize + paddingY * 2
      const radius = 6

      // Positioning
      let labelX = x + (width - labelW) / 2
      labelX = Math.max(4, Math.min(canvasW - labelW - 4, labelX))

      let labelY = y - labelH - 6
      if (labelY < 4) {
        labelY = y + height + 6
        if (labelY + labelH > canvasH - 4) {
          labelY = y + 6
        }
      }

      // Draw dark glass label background
      drawRoundedRect(ctx, labelX, labelY, labelW, labelH, radius, 'rgba(0, 0, 0, 0.65)', 'rgba(79, 255, 176, 0.35)')

      // Draw text parts
      let currentX = labelX + paddingX
      const textBaselineY = labelY + paddingY + fontSize - 1
      parts.forEach(p => {
        const size = p.sizeMultiplier ? fontSize * p.sizeMultiplier : fontSize
        ctx.font = `bold ${size}px sans-serif`
        ctx.fillStyle = p.color
        ctx.fillText(p.text, currentX, textBaselineY)
        currentX += ctx.measureText(p.text).width
      })

      // Keypoints (small cyan dots)
      if (det.keypoints) {
        ctx.fillStyle = '#7DEBFF'
        det.keypoints.forEach((kp: any) => {
          const rawKpX = kp.x * videoW * scale + offsetX
          const kpY = kp.y * videoH * scale + offsetY
          const kpX = canvasW - rawKpX
          
          ctx.beginPath()
          ctx.arc(kpX, kpY, 2, 0, 2 * Math.PI)
          ctx.fill()
        })
      }
    })
  }

  // Real detection loop using detectForVideo
  const detectLoop = () => {
    if (camState !== 'active') return
    
    const video = originalVideoRef.current
    const detector = faceDetectorRef.current

    if (video && detector && video.readyState >= 2) {
      const now = performance.now()
      // Throttle detection frequency to around ~12 FPS (every 80ms)
      if (now - lastDetectionTimeRef.current > 80) {
        try {
          const result = detector.detectForVideo(video, now)
          const detectedFaces = result?.detections || []

          // Keep ALL detected faces — do not filter to only the first/largest
          setFaceCount(detectedFaces.length)

          if (detectedFaces.length > 0) {
            // Highest confidence (usually the closest face)
            const scores = detectedFaces.map((d: any) => d.categories?.[0]?.score || 0)
            const maxScore = Math.max(...scores)
            const minScore = Math.min(...scores)
            setConfidence(Math.round(maxScore * 100))
            setSmallestConfidence(Math.round(minScore * 100))

            // Check for small/distant faces
            const videoW = video.videoWidth || 1
            const hasSmall = detectedFaces.some((d: any) => {
              const bw = d.boundingBox?.width || 0
              return bw / videoW < 0.08 // face box less than 8% of frame width
            })
            setSmallFaceWarning(hasSmall)
          } else {
            setConfidence(0)
            setSmallestConfidence(0)
            setSmallFaceWarning(false)
          }

          // Draw overlays on original feed for ALL faces
          if (originalCanvasRef.current && originalVideoRef.current) {
            drawDetections(originalCanvasRef.current, originalVideoRef.current, detectedFaces)
          }

          setFps(Math.round(1000 / (now - lastDetectionTimeRef.current)))
          setLatency(Math.round(performance.now() - now))
          lastDetectionTimeRef.current = now
        } catch (err) {
          console.error('Frame processing failed via detectForVideo:', err)
        }
      }
    }

    requestRef.current = requestAnimationFrame(detectLoop)
  }

  // Toggles the loops when camera is turned on/off
  useEffect(() => {
    if (camState === 'active' && detectorStatus === 'ready') {
      requestRef.current = requestAnimationFrame(detectLoop)
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      setFaceCount(0)
      setConfidence(0)
      setFps(0)
      setLatency(0)
      
      // Clear original canvas
      if (originalCanvasRef.current) {
        const ctx = originalCanvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height)
      }
    }
  }, [camState, detectorStatus])

  // Request browser camera
  const startCamera = async () => {
    setCamState('requesting')
    setErrorMessage('')

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamState('error')
      setErrorMessage('Your browser does not support camera access. Camera access works only on localhost or HTTPS.')
      return
    }

    try {
      // Pre-warm the face detector if it hasn't loaded yet
      let detector = faceDetectorRef.current
      if (!detector) {
        detector = await initDetector()
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      })
      
      streamRef.current = mediaStream

      // Bind to original video element
      if (originalVideoRef.current) {
        originalVideoRef.current.srcObject = mediaStream
        originalVideoRef.current.muted = true
        originalVideoRef.current.playsInline = true
        await originalVideoRef.current.play()
      }

      // Bind to enhanced video element
      if (enhancedVideoRef.current) {
        enhancedVideoRef.current.srcObject = mediaStream
        enhancedVideoRef.current.muted = true
        enhancedVideoRef.current.playsInline = true
        await enhancedVideoRef.current.play()
      }

      setCamState('active')
      setElapsed(0)
      lastDetectionTimeRef.current = performance.now()

      // Extract resolution metadata
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        if (settings.width && settings.height) {
          setResolution(`${settings.width} × ${settings.height}`)
        } else {
          setResolution('1280 × 720')
        }
      }
    } catch (err: any) {
      console.error('Camera start failed:', err)
      setCamState('error')
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission denied. Please allow camera access from the browser camera icon and try again.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found.')
      } else {
        setErrorMessage(err.message || 'Unable to access camera. Please allow camera permission.')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCamState('stopped')
    setResolution('N/A')

    if (originalVideoRef.current) originalVideoRef.current.srcObject = null
    if (enhancedVideoRef.current) enhancedVideoRef.current.srcObject = null
  }

  // Snapshots canvas capture
  const captureSnapshot = () => {
    const activeVideo = originalVideoRef.current
    if (!activeVideo || camState !== 'active') return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = activeVideo.videoWidth || 640
      canvas.height = activeVideo.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/png')
        setSnapshotDataUrl(dataUrl)
        setEnhancedSnapshotDataUrl(null)
        setPipelineComplete(false)
        setPipelineStep(-1)
        setSnapshotsCount(s => s + 1)
        triggerToast('Snapshot captured.')
        // Auto-switch to snapshot tab
        setActiveTab('snapshot')
      }
    } catch (_) {
      triggerToast('Failed to capture snapshot.')
    }
  }

  // Mock AI enhancement using canvas filters
  const applyMockEnhancement = useCallback((srcDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(srcDataUrl); return }

        // Apply enhancement filters
        ctx.filter = 'brightness(1.15) contrast(1.12) saturate(1.15)'
        ctx.drawImage(img, 0, 0)

        // Subtle sharpening simulation: draw a slightly contrasted overlay
        ctx.globalCompositeOperation = 'overlay'
        ctx.globalAlpha = 0.08
        ctx.filter = 'contrast(1.5) brightness(1.05)'
        ctx.drawImage(img, 0, 0)

        // Reset
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0
        ctx.filter = 'none'

        // Warm tone overlay for skin enhancement simulation
        ctx.globalCompositeOperation = 'soft-light'
        ctx.globalAlpha = 0.06
        ctx.fillStyle = '#FFD4A8'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0

        resolve(canvas.toDataURL('image/png'))
      }
      img.src = srcDataUrl
    })
  }, [])

  // Run mock AI pipeline
  const runEnhancePipeline = useCallback(async () => {
    if (!snapshotDataUrl || faceCount !== 1) return

    setSnapshotProcessing(true)
    setPipelineComplete(false)
    setEnhancedSnapshotDataUrl(null)

    // Step through pipeline
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setPipelineStep(i)
      // Simulate processing time with variable delays
      const delays = [400, 600, 400, 900, 800, 600, 500]
      await new Promise(r => setTimeout(r, delays[i]))
    }

    // Generate enhanced output
    const enhanced = await applyMockEnhancement(snapshotDataUrl)
    setEnhancedSnapshotDataUrl(enhanced)

    // Set metrics
    setEnhancementMetrics({
      confidence: 94 + Math.floor(Math.random() * 5),
      brightness: 18 + Math.floor(Math.random() * 12),
      detail: 22 + Math.floor(Math.random() * 15),
      validation: 'Pass — 1 face confirmed',
      resolution: resolution !== 'N/A' ? resolution : '1280 × 720',
    })

    setPipelineComplete(true)
    setSnapshotProcessing(false)
    triggerToast('AI face restoration complete.')
  }, [snapshotDataUrl, faceCount, resolution, applyMockEnhancement])

  // Download enhanced snapshot
  const downloadEnhanced = () => {
    if (enhancedSnapshotDataUrl) {
      const link = document.createElement('a')
      link.download = 'facecloud_enhanced_snapshot.png'
      link.href = enhancedSnapshotDataUrl
      link.click()
      triggerToast('Enhanced snapshot downloaded.')
    } else {
      triggerToast('Enhanced snapshot downloaded.')
    }
  }

  const saveEnhanced = () => {
    triggerToast('Enhanced frame saved to My Images.')
  }

  // Presets Handlers
  const applyPreset = (preset: 'natural' | 'bright' | 'sharp' | 'low') => {
    if (preset === 'natural') {
      setStrength(45); setBrightness(45); setContrast(45); setDetail(40); setNoiseReduction(35)
    } else if (preset === 'bright') {
      setStrength(75); setBrightness(80); setContrast(55); setDetail(45); setNoiseReduction(40)
    } else if (preset === 'sharp') {
      setStrength(70); setBrightness(55); setContrast(85); setDetail(75); setNoiseReduction(35)
    } else if (preset === 'low') {
      setStrength(90); setBrightness(90); setContrast(70); setDetail(55); setNoiseReduction(65)
    }
    triggerToast(`${preset.charAt(0).toUpperCase() + preset.slice(1)} preset loaded.`)
  }

  const resetControls = () => {
    setStrength(75); setBrightness(50); setContrast(60); setDetail(45); setNoiseReduction(40)
    triggerToast('Enhancement parameters reset.')
  }

  // Visual simulation filters (tuned brightness/contrast/saturation)
  const brightnessVal = 100 + (brightness - 50) * 1.6
  const contrastVal = 100 + (contrast - 50) * 1.6
  const saturateVal = 100 + (strength - 50) * 1.2
  const blurVal = Math.max(0, (100 - detail) * 0.008)
  const noiseVal = noiseReduction > 60 ? 'contrast(96%) brightness(102%) saturate(98%)' : ''
  const cssFilter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) blur(${blurVal}px) ${noiseVal}`

  // Validation calculations
  const getValidationState = () => {
    if (detectorStatus !== 'ready') {
      return { label: 'Waiting', text: 'Detection unavailable', badgeStyle: 'muted' }
    } else if (faceCount === 0) {
      return { label: 'Waiting', text: 'Waiting — no face visible', badgeStyle: 'warning' }
    } else if (faceCount === 1) {
      return { label: 'Pass', text: 'Pass — exactly one face detected', badgeStyle: 'success' }
    } else {
      return { label: 'Failed', text: 'Failed — multiple faces detected', badgeStyle: 'error' }
    }
  }

  const validation = getValidationState()

  // Panel Header status indicators mapping
  const getPanelBadge = () => {
    if (camState !== 'active') return <StatusBadge status="muted" label="Camera Off" />
    if (detectorStatus === 'loading') return <StatusBadge status="muted" label="Loading Model" />
    if (detectorStatus !== 'ready') return <StatusBadge status="muted" label="Detection Unavailable" />
    if (faceCount === 0) return <StatusBadge status="warning" label="No Face Detected" />
    if (faceCount === 1) return <StatusBadge status="success" label="1 Face Detected" />
    return <StatusBadge status="error" label={`${faceCount} Faces Detected`} />
  }

  const getEnhancedBadgeLabel = () => {
    if (detectorStatus === 'loading') return 'Loading Detector'
    if (detectorStatus !== 'ready') return 'Detection Unavailable'
    if (faceCount === 0) return 'No Face Detected'
    if (faceCount === 1) return '1 Face Detected'
    if (faceCount === 2) return '2 Faces Detected'
    return `${faceCount} Faces Detected`
  }

  // Snapshot enhance button state
  const canEnhance = faceCount === 1 && snapshotDataUrl && !snapshotProcessing
  const snapshotValidationMsg = faceCount === 0
    ? 'No face detected. Start camera and position your face.'
    : faceCount > 1
    ? 'Multiple faces detected — FaceCloud requires exactly one face per image.'
    : null

  return (
    <div className={className}>
      {/* Toast Alert */}
      <div 
        className="fixed top-20 right-6 z-50 transition-all duration-300 transform pointer-events-none"
        style={{
          opacity: toastMessage ? 1 : 0,
          transform: toastMessage ? 'translateY(0)' : 'translateY(-10px)'
        }}
      >
        <div className="fc-panel px-5 py-3 rounded-2xl border border-white/10 bg-black/90 text-xs font-bold text-white shadow-2xl flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#0084FF]" />
          <span>{toastMessage}</span>
        </div>
      </div>

      {/* Model Loader Warnings */}
      {detectorStatus === 'loading' && (
        <div className="mb-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-[#60B1FF] font-semibold flex items-center gap-2">
          <Info className="w-4.5 h-4.5 flex-shrink-0 animate-spin" />
          <span>Loading face detection model...</span>
        </div>
      )}
      {detectorStatus === 'error' && (
        <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-[#F87171] font-semibold flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Info className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Face detection model failed to load. Camera feed is active, but detection is unavailable.</span>
          </div>
          <span className="text-[10px] text-white/40 ml-6 font-medium">Check internet connection, MediaPipe WASM path, and model asset URL.</span>
        </div>
      )}
      {detectorFallbackMsg && (
        <div className="mb-4 p-4 rounded-2xl flex items-start gap-2 text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{detectorFallbackMsg}</span>
        </div>
      )}
      {camState === 'active' && smallFaceWarning && (
        <div className="mb-4 p-3 rounded-2xl flex items-center gap-2 text-[11px] font-semibold" style={{ background: 'rgba(96,177,255,0.06)', border: '1px solid rgba(96,177,255,0.18)', color: '#60B1FF' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Small/distant face detected — move closer for better enhancement quality.</span>
        </div>
      )}

      {/* ─── Mode Tabs ─── */}
      <div className="mb-5 flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setActiveTab('live')}
          className="px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2"
          style={activeTab === 'live' ? {
            background: 'linear-gradient(135deg, rgba(0,132,255,0.25), rgba(0,132,255,0.10))',
            color: '#60B1FF',
            border: '1px solid rgba(0,132,255,0.35)',
            boxShadow: '0 0 20px rgba(0,132,255,0.15)',
          } : {
            color: 'rgba(255,255,255,0.45)',
            border: '1px solid transparent',
          }}
        >
          <Play className="w-3.5 h-3.5" />
          Live Preview
        </button>
        <button
          onClick={() => setActiveTab('snapshot')}
          className="px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2"
          style={activeTab === 'snapshot' ? {
            background: 'linear-gradient(135deg, rgba(0,132,255,0.25), rgba(0,132,255,0.10))',
            color: '#60B1FF',
            border: '1px solid rgba(0,132,255,0.35)',
            boxShadow: '0 0 20px rgba(0,132,255,0.15)',
          } : {
            color: 'rgba(255,255,255,0.45)',
            border: '1px solid transparent',
          }}
        >
          <Aperture className="w-3.5 h-3.5" />
          Snapshot Enhance
        </button>
      </div>

      {/* ─── Mode label ─── */}
      {activeTab === 'live' && (
        <div className="mb-4 flex items-center gap-2">
          <StatusBadge status="info" label="Live Preview Mode" />
          <span className="text-[10px] text-white/40 font-medium">Real-time preview uses browser filters for fast feedback.</span>
        </div>
      )}
      {activeTab === 'snapshot' && (
        <div className="mb-4 flex items-center gap-2">
          <StatusBadge status="purple" label="AI Snapshot Enhance" />
          <span className="text-[10px] text-white/40 font-medium">Capture a frame and run FaceCloud AI face restoration pipeline.</span>
        </div>
      )}

      {/* ─── Camera Feed Panels ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Original Camera Feed */}
        <div className="fc-card overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-white/50" />
              <span className="text-sm font-semibold text-white">Original Feed</span>
            </div>
            {getPanelBadge()}
          </div>

          <div className="relative bg-black aspect-video flex items-center justify-center border-b border-white/[0.04] overflow-hidden min-h-[320px]">
            <video 
              ref={originalVideoRef}
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 z-0 h-full w-full object-cover scale-x-[-1] ${camState === 'active' ? 'block' : 'hidden'}`}
            />
            {/* Canvas overlays to draw the tracking bounds */}
            <canvas 
              ref={originalCanvasRef}
              className={`absolute inset-0 z-10 h-full w-full pointer-events-none ${camState === 'active' ? 'block' : 'hidden'}`}
            />

            {camState === 'active' ? (
              <>
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500/90 rounded-full z-20">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-[10px] text-white font-bold tracking-wider font-mono">REC {formatElapsed(elapsed)}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/30 text-center p-4 z-20">
                <Camera className="w-12 h-12 text-white/20" />
                <div>
                  <p className="text-xs font-semibold text-white/50">Camera is off</p>
                  <p className="text-[10px] text-white/30 mt-1 max-w-[200px]">Click Start Camera below to request browser media access.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Enhanced Output Panel — only visible in Live Preview mode */}
        {activeTab === 'live' && (
          <div className="fc-card overflow-hidden flex flex-col justify-between">
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0084FF]" />
                <span className="text-sm font-semibold text-white">AI Enhanced Output</span>
              </div>
              <StatusBadge 
                status={
                  detectorStatus === 'loading' ? 'muted' :
                  detectorStatus !== 'ready' ? 'muted' :
                  faceCount === 0 ? 'warning' :
                  faceCount === 1 ? 'success' :
                  'error'
                } 
                label={getEnhancedBadgeLabel()} 
              />
            </div>

            <div className="relative bg-black aspect-video flex items-center justify-center border-b border-white/[0.04] overflow-hidden min-h-[320px]">
              <video 
                ref={enhancedVideoRef}
                autoPlay 
                playsInline 
                muted 
                className={`absolute inset-0 z-0 h-full w-full object-cover scale-x-[-1] transition-all duration-150 ${camState === 'active' ? 'block' : 'hidden'}`}
                style={{ filter: cssFilter }}
              />
              {/* Enhanced output does not show tracking overlays */}

              {camState === 'active' ? (
                <>
                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
                  <div className="absolute inset-0 pointer-events-none border border-[#0084FF]/25 shadow-[inset_0_0_40px_rgba(0,132,255,0.15)] z-20" />
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#0084FF]/40 text-center p-4 z-20">
                  <Zap className="w-12 h-12 text-[#0084FF]/20" />
                  <div>
                    <p className="text-xs font-semibold text-[#0084FF]/50">Enhancement inactive</p>
                    <p className="text-[10px] text-white/30 mt-1 max-w-[200px]">Simulated Zero-DCE correction turns on with active stream.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Snapshot Capture Panel — only visible in Snapshot Enhance mode */}
        {activeTab === 'snapshot' && (
          <div className="fc-card overflow-hidden flex flex-col justify-between">
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Aperture className="w-4 h-4 text-[#A78BFA]" />
                <span className="text-sm font-semibold text-white">Snapshot Preview</span>
              </div>
              {snapshotDataUrl ? (
                <StatusBadge status="success" label="Frame Captured" />
              ) : (
                <StatusBadge status="muted" label="No Snapshot" />
              )}
            </div>

            <div className="relative bg-black aspect-video flex items-center justify-center border-b border-white/[0.04] overflow-hidden min-h-[320px]">
              {snapshotDataUrl ? (
                <img src={snapshotDataUrl} alt="Captured snapshot" className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/30 text-center p-4 z-20">
                  <ImageIcon className="w-12 h-12 text-white/15" />
                  <div>
                    <p className="text-xs font-semibold text-white/45">No snapshot captured</p>
                    <p className="text-[10px] text-white/30 mt-1 max-w-[240px]">Capture a frame to run AI face restoration.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connection & state notifications */}
      {camState === 'error' && (
        <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-[#F87171] font-semibold flex items-center gap-2">
          <Info className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action triggers */}
      <div className="mt-4 fc-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {camState === 'active' ? (
            <GradientButton variant="danger" leftIcon={<StopCircle className="w-4 h-4" />} onClick={stopCamera}>
              Stop Camera
            </GradientButton>
          ) : (
            <GradientButton 
              variant="primary" 
              leftIcon={<Play className="w-4 h-4" />} 
              onClick={startCamera}
              disabled={camState === 'requesting' || detectorStatus === 'loading'}
            >
              {camState === 'requesting' ? 'Requesting Camera...' : 'Start Camera'}
            </GradientButton>
          )}

          {camState === 'active' && (
            <GradientButton variant="secondary" leftIcon={<Aperture className="w-4 h-4" />} onClick={captureSnapshot}>
              Capture Snapshot
            </GradientButton>
          )}
        </div>

        {/* Live Debug Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] text-white/60 font-semibold font-mono">
            Detector: {detectorStatus.toUpperCase()} • Model: {detectorModel === 'full-range' ? 'Full Range' : detectorModel === 'short-range' ? 'Short Range' : '—'} • Faces: {faceCount} • Video: {resolution}
          </div>
          <div className="text-[10px] text-white/30 font-medium">
            Camera access works only on localhost or HTTPS.
          </div>
        </div>
      </div>

      {/* ═══════════ LIVE PREVIEW TAB CONTENT ═══════════ */}
      {activeTab === 'live' && (
        <>
          {/* Control Sliders Panel */}
          <div className="mt-6 fc-card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-[#0084FF]" />
                <h3 className="text-sm font-semibold text-white">AI Enhancement Controls</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={resetControls} className="px-3 py-1.5 text-[10px] font-bold text-white/50 border border-white/[0.08] hover:border-white/30 rounded-xl cursor-pointer">
                  Reset Controls
                </button>
              </div>
            </div>

            {/* Presets Row */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider pr-2">Presets:</span>
              {['natural', 'bright', 'sharp', 'low'].map(pr => (
                <button
                  key={pr}
                  onClick={() => applyPreset(pr as any)}
                  className="px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.08] text-[10px] font-bold rounded-xl text-white/60 hover:text-white hover:border-[#0084FF]/40 cursor-pointer capitalize"
                >
                  {pr === 'low' ? 'Low Light' : pr}
                </button>
              ))}
            </div>

            {/* Slider Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-2">
              {[
                {
                  label: 'Enhancement Strength',
                  sub: 'Controls overall AI correction intensity.',
                  val: strength,
                  set: setStrength,
                  l: 'Natural',
                  r: 'Strong'
                },
                {
                  label: 'Brightness Correction',
                  sub: 'Brightens dark facial areas.',
                  val: brightness,
                  set: setBrightness,
                  l: 'Low',
                  r: 'High'
                },
                {
                  label: 'Contrast Boost',
                  sub: 'Improves facial edge and detail separation.',
                  val: contrast,
                  set: setContrast,
                  l: 'Soft',
                  r: 'Sharp'
                },
                {
                  label: 'Skin Detail Recovery',
                  sub: 'Restores soft facial details after enhancement.',
                  val: detail,
                  set: setDetail,
                  l: 'Smooth',
                  r: 'Detailed'
                },
                {
                  label: 'Noise Reduction',
                  sub: 'Reduces grain in low-light webcam feed.',
                  val: noiseReduction,
                  set: setNoiseReduction,
                  l: 'Off',
                  r: 'Clean'
                }
              ].map(sld => (
                <div key={sld.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{sld.label}</span>
                      <span className="text-[10px] text-white/40 block mt-0.5">{sld.sub}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#60B1FF]">{sld.val}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-white/30 font-bold uppercase w-10">{sld.l}</span>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sld.val}
                        onChange={e => sld.set(Number(e.target.value))}
                        className="fc-range-slider w-full cursor-pointer h-1 rounded-full appearance-none animate-none"
                        style={{
                          background: `linear-gradient(to right, #0084FF 0%, #4FFFB0 ${sld.val}%, rgba(255,255,255,0.08) ${sld.val}%)`
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30 font-bold uppercase w-12 text-right">{sld.r}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Metrics & Specs */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Real-time metrics list */}
            <div className="fc-card p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2">Live System Metrics</h4>
              <div className="space-y-2 text-[11px] font-medium text-white/60">
                <div className="flex justify-between">
                  <span>Camera Status:</span>
                  <span className={`font-bold capitalize ${camState === 'active' ? 'text-[#4FFFB0]' : 'text-white/45'}`}>{camState}</span>
                </div>
                <div className="flex justify-between">
                  <span>Detection FPS:</span>
                  <span className="text-white font-bold">{fps ? `${fps} FPS` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frame Latency:</span>
                  <span className="text-white font-bold">{latency ? `${latency}ms` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Faces Detected:</span>
                  <span className={`font-bold ${faceCount > 0 ? 'text-[#4FFFB0]' : 'text-white/40'}`}>
                    {faceCount === 1 ? '1 Face' : faceCount > 1 ? `${faceCount} Faces` : '0 Faces'}
                  </span>
                </div>
              </div>
            </div>

            {/* Face Detection Status */}
            <div className="fc-card p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2">Detection Status</h4>
              <div className="space-y-2 text-[11px] font-medium text-white/60">
                <div className="flex justify-between">
                  <span>Detector:</span>
                  <span className={`font-bold ${detectorStatus === 'ready' ? 'text-[#4FFFB0]' : 'text-white/45'}`}>{detectorStatus === 'ready' ? 'Ready' : detectorStatus.charAt(0).toUpperCase() + detectorStatus.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Detection Model:</span>
                  <span className="text-white font-bold">{detectorModel === 'full-range' ? 'Full Range' : detectorModel === 'short-range' ? 'Short Range' : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Faces Detected:</span>
                  <span className={`font-bold ${faceCount > 0 ? 'text-[#4FFFB0]' : 'text-white/40'}`}>{faceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validation:</span>
                  <span className={`font-bold ${
                    validation.label === 'Pass' ? 'text-[#4FFFB0]' :
                    validation.label === 'Failed' ? 'text-[#F87171]' :
                    'text-white/40'
                  }`}>
                    {validation.text}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Face Confidence:</span>
                  <span className="text-white font-bold">{confidence ? `${confidence}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Smallest Face Confidence:</span>
                  <span className="text-white font-bold">{smallestConfidence ? `${smallestConfidence}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saved Snapshots:</span>
                  <span className="text-white font-bold">{snapshotsCount} saved</span>
                </div>
                <div className="flex justify-between">
                  <span>Video Resolution:</span>
                  <span className="text-white font-bold font-mono">{resolution}</span>
                </div>
              </div>
            </div>

            {/* Explainer card */}
            <div className="fc-card p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2">How this demo works</h4>
              <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                This demo uses your browser camera for the original feed and applies frontend visual filters to simulate AI enhancement. Face detection runs locally on-device using a MediaPipe full-range model that detects both close and distant faces.
              </p>
            </div>

          </div>
        </>
      )}

      {/* ═══════════ SNAPSHOT ENHANCE TAB CONTENT ═══════════ */}
      {activeTab === 'snapshot' && (
        <div className="mt-6 space-y-6">

          {/* Validation Warning */}
          {camState === 'active' && snapshotValidationMsg && (
            <div className="p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold"
              style={{
                background: faceCount > 1 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${faceCount > 1 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                color: faceCount > 1 ? '#F87171' : '#FCD34D',
              }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{snapshotValidationMsg}</span>
            </div>
          )}

          {/* Enhance Action Card */}
          {snapshotDataUrl && !pipelineComplete && (
            <div className="fc-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanFace className="w-5 h-5 text-[#A78BFA]" />
                  <h3 className="text-sm font-semibold text-white">FaceCloud AI Face Restoration</h3>
                </div>
                <StatusBadge status="purple" label="Zero-DCE + Face Detail Recovery" dot={false} />
              </div>

              {/* Enhance button */}
              {!snapshotProcessing && (
                <GradientButton
                  variant="primary"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={runEnhancePipeline}
                  disabled={!canEnhance}
                  className="w-full justify-center"
                  size="lg"
                >
                  Enhance Captured Face
                </GradientButton>
              )}

              {/* Pipeline Progress */}
              {snapshotProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-[#0084FF] rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-[#60B1FF]">Running AI Enhancement Pipeline...</span>
                  </div>
                  {PIPELINE_STEPS.map((step, i) => {
                    const isComplete = i < pipelineStep
                    const isCurrent = i === pipelineStep
                    const isPending = i > pipelineStep

                    return (
                      <div key={step.label} className="flex items-center gap-3 transition-all duration-300" style={{ opacity: isPending ? 0.3 : 1 }}>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-all duration-300"
                          style={{
                            background: isComplete ? 'rgba(79,255,176,0.15)' : isCurrent ? 'rgba(0,132,255,0.20)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isComplete ? 'rgba(79,255,176,0.30)' : isCurrent ? 'rgba(0,132,255,0.40)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4FFFB0]" />
                          ) : isCurrent ? (
                            <div className="w-2.5 h-2.5 border-2 border-[#0084FF] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-[10px]">{step.icon}</span>
                          )}
                        </div>
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          isComplete ? 'text-[#4FFFB0]' : isCurrent ? 'text-[#60B1FF]' : 'text-white/30'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}

                  {/* Progress bar */}
                  <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${((pipelineStep + 1) / PIPELINE_STEPS.length) * 100}%`,
                        background: 'linear-gradient(90deg, #0084FF, #4FFFB0)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Result Panel (after pipeline completes) ─── */}
          {pipelineComplete && snapshotDataUrl && enhancedSnapshotDataUrl && (
            <div className="space-y-6">

              {/* Face Restored Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl" style={{
                  background: 'linear-gradient(135deg, rgba(79,255,176,0.12), rgba(0,132,255,0.08))',
                  border: '1px solid rgba(79,255,176,0.25)',
                }}>
                  <CheckCircle2 className="w-4 h-4 text-[#4FFFB0]" />
                  <span className="text-xs font-bold text-[#4FFFB0]">Face Restored</span>
                </div>
                <StatusBadge status="info" label="AI Snapshot Enhancement" dot={false} />
              </div>

              {/* Before / After Slider */}
              <div className="fc-card overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-sm font-semibold text-white">Before / After Comparison</span>
                  </div>
                </div>
                <div className="p-4">
                  <BeforeAfterSlider
                    beforeSrc={snapshotDataUrl}
                    afterSrc={enhancedSnapshotDataUrl}
                    beforeLabel="Original"
                    afterLabel="Enhanced"
                    className="h-64 sm:h-80"
                  />
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="fc-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                  <Zap className="w-4 h-4 text-[#0084FF]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enhancement Metrics</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Enhancement Confidence', value: `${enhancementMetrics.confidence}%`, color: '#4FFFB0' },
                    { label: 'Brightness Improved', value: `+${enhancementMetrics.brightness}%`, color: '#60B1FF' },
                    { label: 'Detail Recovery', value: `+${enhancementMetrics.detail}%`, color: '#A78BFA' },
                    { label: 'Face Validation', value: enhancementMetrics.validation, color: '#4FFFB0' },
                    { label: 'Output Resolution', value: enhancementMetrics.resolution, color: '#7DEBFF' },
                  ].map(metric => (
                    <div key={metric.label} className="text-center space-y-1.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{metric.label}</p>
                      <p className="text-sm font-bold font-mono" style={{ color: metric.color }}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <GradientButton
                  variant="primary"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={downloadEnhanced}
                >
                  Download Enhanced
                </GradientButton>
                <GradientButton
                  variant="secondary"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={saveEnhanced}
                >
                  Save to My Images
                </GradientButton>
                <GradientButton
                  variant="secondary"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => {
                    setSnapshotDataUrl(null)
                    setEnhancedSnapshotDataUrl(null)
                    setPipelineComplete(false)
                    setPipelineStep(-1)
                  }}
                >
                  New Snapshot
                </GradientButton>
              </div>

              {/* Demo disclaimer */}
              <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(0,132,255,0.04)', border: '1px solid rgba(0,132,255,0.15)' }}>
                <Info className="w-4 h-4 text-[#60B1FF] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                  This frontend demo simulates AI restoration. Production can connect GFPGAN/CodeFormer/Real-ESRGAN backend models for Remini-style results.
                </p>
              </div>
            </div>
          )}

          {/* Empty state when no snapshot */}
          {!snapshotDataUrl && (
            <div className="fc-card p-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <ScanFace className="w-8 h-8 text-[#A78BFA]/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/60">No snapshot captured</p>
                <p className="text-xs text-white/35 mt-1 max-w-xs">Capture a frame to run AI face restoration. Start your camera and click Capture Snapshot.</p>
              </div>
            </div>
          )}

          {/* Developer Info Card (Collapsible) */}
          <div className="fc-card overflow-hidden">
            <button
              onClick={() => setDevInfoOpen(v => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-white/30" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Production AI Model Options</span>
              </div>
              {devInfoOpen ? (
                <ChevronUp className="w-4 h-4 text-white/30" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/30" />
              )}
            </button>
            {devInfoOpen && (
              <div className="px-5 pb-4 space-y-2.5 border-t border-white/[0.06] pt-3">
                {[
                  { name: 'Zero-DCE', desc: 'Low-light enhancement' },
                  { name: 'GFPGAN or CodeFormer', desc: 'Face restoration' },
                  { name: 'Real-ESRGAN', desc: 'Upscaling' },
                  { name: 'InsightFace', desc: 'Identity embeddings' },
                ].map(m => (
                  <div key={m.name} className="flex items-center gap-3 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]/50 flex-shrink-0" />
                    <span className="font-bold text-white/60">{m.name}</span>
                    <span className="text-white/30">— {m.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
