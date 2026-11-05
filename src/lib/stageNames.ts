import type { AppliedStage } from './api/enhancements'

/** What each stage does, in plain words, as a past-tense phrase and a short name. */
export const STAGES: Record<string, { name: string; done: (s: AppliedStage) => string }> = {
  low_light: { name: 'Low light', done: () => 'Lifted the light' },
  denoise: { name: 'Noise', done: () => 'Reduced the noise' },
  polish: { name: 'Polish', done: () => 'Balanced the contrast and sharpened lightly' },
  deblur: { name: 'Blur', done: () => 'Removed blur' },
  face_restore: { name: 'Face', done: () => 'Restored the face' },
  detail: { name: 'Detail', done: () => 'Brought back fine detail' },
  colourize: { name: 'Colour', done: () => 'Added colour to a black-and-white photo' },
  upscale: {
    name: 'HD',
    done: s => {
      const size = s.output_size ? ` to ${s.output_size[0]} × ${s.output_size[1]}` : ''
      return `Enlarged${s.scale ? ` ×${s.scale}` : ''}${size}`
    },
  },
}

export const ENGINES: Record<string, string> = {
  nafnet_gopro: 'NAFNet', realesrgan: 'Real-ESRGAN', codeformer: 'CodeFormer', gfpgan: 'GFPGAN',
  codeformer_or_gfpgan: 'face restoration model', zero_dce: 'Zero-DCE', retinexformer: 'Retinexformer',
  opencv_nlm: 'OpenCV noise filter', opencv_polish: 'OpenCV polish', ddcolor: 'DDColor',
  // The ids the live engine reports (backend enhancement/restoration.py AI_ENGINES and CLASSICAL_ENGINES) that were shown as the raw id: the compact Real-ESRGAN detail network, 4x-UltraSharp, the second NAFNet.
  general: 'Real-ESRGAN (compact)', ultrasharp: '4x-UltraSharp', nafnet_sidd: 'NAFNet', opencv_exposure: 'OpenCV exposure filter',
}

/** A stage the server names in a way this app does not know, or does not name at all, is still listed rather than breaking the page. */
export const stageName = (stage: string | null | undefined) => (stage ? STAGES[stage]?.name ?? stage.replace(/_/g, ' ') : 'Step')

/** An engine's everyday name; one this app does not know is shown as the server wrote it. */
export const engineName = (engine: string | null | undefined) => (engine ? ENGINES[engine] ?? engine.replace(/_/g, ' ') : 'unknown engine')
