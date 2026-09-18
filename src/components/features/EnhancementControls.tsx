import { useState } from 'react'
import { Sliders, Sun, Contrast } from 'lucide-react'

interface EnhancementControlsProps {
  disabled?: boolean
}

export function EnhancementControls({ disabled }: EnhancementControlsProps) {
  const [strength, setStrength] = useState(75)
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(60)

  return (
    <div className="fc-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-ink">Enhancement Controls</span>
        {disabled && <span className="text-xs text-ink-mute ml-auto">Start camera to adjust</span>}
      </div>
      <div className={`space-y-4 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <SliderRow
          label="Enhancement Strength"
          icon={<Sliders className="w-3.5 h-3.5 text-accent" />}
          value={strength}
          onChange={setStrength}
          color="from-accent to-accent-soft"
        />
        <SliderRow
          label="Brightness Correction"
          icon={<Sun className="w-3.5 h-3.5 text-warning" />}
          value={brightness}
          onChange={setBrightness}
          color="from-warning to-amber-400"
        />
        <SliderRow
          label="Contrast Boost"
          icon={<Contrast className="w-3.5 h-3.5 text-violet-400" />}
          value={contrast}
          onChange={setContrast}
          color="from-violet-600 to-accent"
        />
      </div>
    </div>
  )
}

function SliderRow({ label, icon, value, onChange, color: _color }: {
  label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void; color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-mute">
          {icon}
          {label}
        </div>
        <span className="text-xs font-bold text-ink">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border"
        style={{
          background: `linear-gradient(to right, var(--tw-gradient-from) 0%, var(--tw-gradient-to) ${value}%, rgba(255,255,255,0.10) ${value}%)`,
        }}
      />
    </div>
  )
}
