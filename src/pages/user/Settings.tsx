import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { User, Lock, Bell, Camera, Save, Upload, Trash2, Check } from 'lucide-react'
import { useSessionUser, updateSessionName } from '../../lib/session'
import { useProfile, saveProfile } from '../../lib/profile'
import type { Profile } from '../../lib/profile'
import { AVATAR_PRESETS, fileToAvatarDataUrl, useAvatar } from '../../lib/avatar'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'camera', label: 'Camera & Privacy', icon: Camera },
]

export default function Settings() {
  const [tab, setTab] = useState('profile')

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, security, and preferences." />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Tab sidebar */}
        <div className="fc-card p-3 xl:col-span-1 h-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                tab === t.id ? 'bg-soft-blue text-accent font-semibold' : 'text-ink-mute hover:bg-background'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="xl:col-span-3 fc-card p-6">
          {tab === 'profile' && <ProfileSettings />}
          {tab === 'security' && <SecuritySettings />}
          {tab === 'notifications' && <NotificationSettings />}
          {tab === 'camera' && <CameraSettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const account = useSessionUser('user')
  const stored = useProfile(account.email)

  const [name, setName] = useState(account.name)
  const [profile, setProfile] = useState<Profile>(stored)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Re-sync when the account or its stored profile changes underneath us —
     for instance after signing in as someone else. */
  useEffect(() => { setName(account.name) }, [account.name])
  useEffect(() => { setProfile(stored) }, [stored])

  const field = (key: keyof Profile) => ({
    value: profile[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile(p => ({ ...p, [key]: e.target.value }))
      setSaved(false)
    },
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    try {
      saveProfile(account.email, profile)
      updateSessionName('user', name)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSave}>
      <h2 className="text-base font-bold text-ink">Profile Settings</h2>
      <AvatarSettings email={account.email} initials={account.initials} name={account.name} />

      <div>
        <label htmlFor="profile-name" className="text-xs font-semibold text-ink block mb-1.5">Full Name</label>
        <input
          id="profile-name"
          type="text"
          className="fc-input"
          value={name}
          onChange={e => { setName(e.target.value); setSaved(false) }}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="profile-email" className="text-xs font-semibold text-ink block mb-1.5">Email Address</label>
        <input id="profile-email" type="email" className="fc-input" value={account.email} readOnly disabled />
        <p className="text-[11px] text-ink-faint mt-1.5">
          Your email identifies the account and cannot be changed here.
        </p>
      </div>

      {/* Everything below is optional — FaceCloud is used by individuals as
          well as teams, so none of it is required to use the product. */}
      <div>
        <label htmlFor="profile-org" className="text-xs font-semibold text-ink block mb-1.5">
          Organization <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input id="profile-org" type="text" className="fc-input" placeholder="Company, studio or team"
               autoComplete="organization" {...field('organization')} />
      </div>

      <div>
        <label htmlFor="profile-role" className="text-xs font-semibold text-ink block mb-1.5">
          Job Title <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input id="profile-role" type="text" className="fc-input" placeholder="Photographer, HR lead, developer…"
               autoComplete="organization-title" {...field('jobTitle')} />
      </div>

      <div>
        <label htmlFor="profile-phone" className="text-xs font-semibold text-ink block mb-1.5">
          Phone <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input id="profile-phone" type="tel" className="fc-input" placeholder="+92 300 1234567"
               autoComplete="tel" {...field('phone')} />
      </div>

      <div>
        <label htmlFor="profile-country" className="text-xs font-semibold text-ink block mb-1.5">
          Country <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input id="profile-country" type="text" className="fc-input" placeholder="Pakistan"
               autoComplete="country-name" {...field('country')} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <GradientButton type="submit" leftIcon={<Save className="w-4 h-4" />}>Save Changes</GradientButton>
        {saved && (
          <span className="text-xs text-emerald-500 font-medium inline-flex items-center gap-1.5" role="status">
            <Check className="w-3.5 h-3.5" /> Profile saved
          </span>
        )}
        {error && <span className="text-xs text-red-500" role="alert">{error}</span>}
      </div>
    </form>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">Security Settings</h2>
      {[
        { label: 'Current Password', id: 'sec-cur', placeholder: 'Enter current password' },
        { label: 'New Password', id: 'sec-new', placeholder: 'Min. 8 characters' },
        { label: 'Confirm New Password', id: 'sec-confirm', placeholder: 'Repeat new password' },
      ].map(f => (
        <div key={f.id}>
          <label className="text-xs font-semibold text-ink block mb-1.5">{f.label}</label>
          <PasswordInput id={f.id} placeholder={f.placeholder} className="fc-input" />
        </div>
      ))}
      <GradientButton variant="secondary">Update Password</GradientButton>
      <div className="border-t border-line pt-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Active Sessions</h3>
        {[{ device: 'Chrome on macOS', ip: '192.168.1.1', time: 'Active now' },
          { device: 'Firefox on Windows', ip: '192.168.1.15', time: '2 days ago' }].map(s => (
          <div key={s.device} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
            <div>
              <p className="text-sm font-medium text-ink">{s.device}</p>
              <p className="text-xs text-ink-mute">{s.ip} · {s.time}</p>
            </div>
            {s.time !== 'Active now' && <button className="text-xs text-error hover:underline">Revoke</button>}
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationSettings() {
  const items = [
    {
      label: 'Photo accepted',
      desc: 'Email confirms enhancement and grouping when your photo passes all checks',
    },
    {
      label: 'Photo rejected',
      desc: 'Email includes the exact rejection reason (e.g. "Image too blurry") so you know what to fix',
    },
    {
      label: 'Batch upload finished',
      desc: 'When a multiple or ZIP upload finishes, get a summary of accepted and rejected counts',
    },
    {
      label: 'Person group created',
      desc: 'When a new person folder is created from your photos',
    },
    {
      label: 'Email notifications',
      desc: 'Receive all of the above as emails to your registered address',
    },
    {
      label: 'Live session alerts',
      desc: 'Notifications during live camera enhancement sessions',
    },
  ]
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">Notification Settings</h2>

      {/* Rejection email note */}
      <div
        className="p-4 rounded-2xl text-xs font-medium space-y-1"
        style={{
          background: 'rgba(16,185,129,0.04)',
          border: '1px solid rgba(16,185,129,0.15)',
          color: 'rgb(var(--a-ink-mute))',
        }}
      >
        <p className="font-bold" style={{ color: '#10B981' }}>Rejection emails are enabled by default</p>
        <p>When one of your photos is rejected, you'll receive an email with the specific reason — such as "Image too blurry" or "No face detected" — so you know exactly what to fix before re-uploading.</p>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-line last:border-0">
          <div>
            <p className="text-sm font-semibold text-ink">{item.label}</p>
            <p className="text-xs text-ink-mute">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" />
            <div className="w-10 h-6 bg-border peer-checked:bg-accent rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      ))}
      <GradientButton leftIcon={<Save className="w-4 h-4" />}>Save Preferences</GradientButton>
    </div>
  )
}

function CameraSettings() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">Camera & Privacy Settings</h2>
      {[
        { label: 'Allow camera access', desc: 'Required for live enhancement sessions' },
        { label: 'Auto-save snapshots', desc: 'Automatically save enhanced live snapshots' },
        { label: 'Face detection overlay', desc: 'Show face scan overlay on live feed' },
        { label: 'Save session logs', desc: 'Log live enhancement sessions for history' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-line last:border-0">
          <div>
            <p className="text-sm font-semibold text-ink">{item.label}</p>
            <p className="text-xs text-ink-mute">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
            <div className="w-10 h-6 bg-border peer-checked:bg-accent rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      ))}
      <div>
        <label className="text-xs font-semibold text-ink block mb-1.5">Default Enhancement Strength</label>
        <input type="range" min={0} max={100} defaultValue={75} className="w-full" />
        <p className="text-xs text-ink-mute mt-1">Higher values increase processing time</p>
      </div>
      <GradientButton leftIcon={<Save className="w-4 h-4" />}>Save Settings</GradientButton>
    </div>
  )
}

/* ── Avatar picker ──────────────────────────────────────────────────────
   A colour preset or an uploaded photo. There is no backend, so the choice is
   kept in this browser against the signed-in account; the photo is downscaled
   to 256px before it is stored. */
function AvatarSettings({ email, initials, name }: { email: string; initials: string; name: string }) {
  const [avatar, setAvatar] = useAvatar(email)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      setAvatar({ kind: 'photo', dataUrl: await fileToAvatarDataUrl(file) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That image could not be used.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <Avatar email={email} initials={initials} size={64} alt={`${name}'s avatar`} />
        <div>
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="text-xs text-ink-mute">{email} · User</p>
          <button
            type="button"
            onClick={() => { setOpen(o => !o); setError(null) }}
            aria-expanded={open}
            className="text-xs text-accent font-medium mt-1 hover:underline cursor-pointer"
          >
            {open ? 'Close' : 'Change avatar'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 p-4 rounded-2xl border border-line bg-surface-mute">
          <p className="text-xs font-semibold text-ink mb-3">Pick a colour</p>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_PRESETS.map(preset => {
              const selected = avatar?.kind === 'preset' && avatar.id === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => { setError(null); setAvatar({ kind: 'preset', id: preset.id }) }}
                  aria-label={preset.label}
                  aria-pressed={selected}
                  title={preset.label}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-semibold
                              transition-transform cursor-pointer hover:scale-105
                              ${selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-mute' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                >
                  {selected ? <Check className="w-4 h-4" /> : initials}
                </button>
              )
            })}
          </div>

          <p className="text-xs font-semibold text-ink mt-5 mb-2">Or use your own photo</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <GradientButton
              variant="secondary"
              size="sm"
              type="button"
              disabled={busy}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? 'Processing…' : 'Upload photo'}
            </GradientButton>
            {avatar && (
              <GradientButton
                variant="ghost"
                size="sm"
                type="button"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => { setError(null); setAvatar(null) }}
              >
                Reset
              </GradientButton>
            )}
          </div>

          <p className="text-[11px] text-ink-faint mt-2.5">
            JPG, PNG or WebP up to 8 MB. The photo is cropped square, resized to 256px and kept in this browser.
          </p>
          {error && <p className="text-[11px] text-red-500 mt-2" role="alert">{error}</p>}
        </div>
      )}
    </div>
  )
}
