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
        <Sliders className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-dark">Enhancement Controls</span>
        {disabled && <span className="text-xs text-muted ml-auto">Start camera to adjust</span>}
      </div>
      <div className={`space-y-4 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <SliderRow
          label="Enhancement Strength"
          icon={<Sliders className="w-3.5 h-3.5 text-primary" />}
          value={strength}
          onChange={setStrength}
          color="from-primary-600 to-sky-400"
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
          icon={<Contrast className="w-3.5 h-3.5 text-purple-600" />}
          value={contrast}
          onChange={setContrast}
          color="from-purple-600 to-primary-600"
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
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
          {icon}
          {label}
        </div>
        <span className="text-xs font-bold text-dark">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border"
        style={{
          background: `linear-gradient(to right, var(--tw-gradient-from) 0%, var(--tw-gradient-to) ${value}%, #E2E8F0 ${value}%)`,
        }}
      />
    </div>
  )
}
