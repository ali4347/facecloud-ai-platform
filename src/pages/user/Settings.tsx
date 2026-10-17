import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { Avatar } from '../../components/ui/Avatar'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { User, Lock, Bell, Camera, Save, Upload, Trash2, Check, ScanFace, Download } from 'lucide-react'
import { useSessionUser, updateSessionName } from '../../lib/session'
import { useProfile, saveProfile } from '../../lib/profile'
import type { Profile } from '../../lib/profile'
import { AVATAR_PRESETS, fileToAvatarDataUrl, useAvatar } from '../../lib/avatar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useFaceConsent } from '../../lib/consent'
import { downloadMyData, getFacialDataCounts, eraseFacialData } from '../../lib/api/privacy'
import type { FacialDataCounts } from '../../lib/api/privacy'
import { USE_API } from '../../lib/api/config'
import { ApiError } from '../../lib/api/client'
import { updateProfileName, changePassword, logoutEverywhere } from '../../lib/api/auth'
import { getNotificationPreferences, updateNotificationPreferences } from '../../lib/api/notifications'
import type { NotificationPreferences } from '../../lib/api/notifications'

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

  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    setSaving(true)
    try {
      /* The name is the one profile field the account stores; the rest stays
         on this device until the backend has fields for it. */
      const savedName = USE_API ? await updateProfileName(name.trim()) : name
      saveProfile(account.email, profile)
      updateSessionName('user', savedName)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
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

      {USE_API && (
        <p className="text-[11px] text-ink-faint">
          Your name is saved to your account. Organization, job title, phone, country and your picture are kept on this device only.
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <GradientButton type="submit" disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
          {saving ? 'Saving…' : 'Save Changes'}
        </GradientButton>
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
  return USE_API ? <SecuritySettingsLive /> : <SecuritySettingsDemo />
}

function SecuritySettingsLive() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const leave = () => {
    localStorage.removeItem('facecloud_session')
    navigate('/login', { replace: true, state: { notice: 'Your password was changed. Please sign in again.' } })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!current || !next) { setError('Enter your current and new password.'); return }
    if (next !== confirm) { setError('The new passwords do not match.'); return }
    setBusy(true)
    try {
      await changePassword(current, next)
      leave()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password. Please try again.')
      setBusy(false)
    }
  }

  const signOutEverywhere = async () => {
    setSigningOut(true)
    try { await logoutEverywhere() } catch { /* tokens are cleared either way */ }
    localStorage.removeItem('facecloud_session')
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">Security Settings</h2>
      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label htmlFor="sec-cur" className="text-xs font-semibold text-ink block mb-1.5">Current Password</label>
          <PasswordInput id="sec-cur" placeholder="Enter current password" className="fc-input"
            value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label htmlFor="sec-new" className="text-xs font-semibold text-ink block mb-1.5">New Password</label>
          <PasswordInput id="sec-new" placeholder="Min. 8 characters" className="fc-input"
            value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="sec-confirm" className="text-xs font-semibold text-ink block mb-1.5">Confirm New Password</label>
          <PasswordInput id="sec-confirm" placeholder="Repeat new password" className="fc-input"
            value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <GradientButton type="submit" variant="secondary" disabled={busy}>
            {busy ? 'Updating…' : 'Update Password'}
          </GradientButton>
          {error && <span className="text-xs text-red-500" role="alert">{error}</span>}
        </div>
        <p className="text-[11px] text-ink-faint">
          Changing your password signs you out on every device, so you will be asked to sign in again.
        </p>
      </form>

      <div className="border-t border-line pt-5">
        <h3 className="text-sm font-semibold text-ink mb-1">Sign out everywhere</h3>
        <p className="text-xs text-ink-mute mb-3">
          Ends your session on this device and every other one. Use it if you signed in on a computer you no longer trust.
        </p>
        <button type="button" onClick={signOutEverywhere} disabled={signingOut}
          className="text-xs font-semibold text-error hover:underline disabled:opacity-60">
          {signingOut ? 'Signing out…' : 'Sign out of all devices'}
        </button>
      </div>
    </div>
  )
}

function SecuritySettingsDemo() {
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
      key: 'photo_accepted' as const,
      label: 'Photo accepted',
      desc: 'Email confirms enhancement and grouping when your photo passes all checks',
    },
    {
      key: 'photo_rejected' as const,
      label: 'Photo rejected',
      desc: 'Email includes the exact rejection reason (e.g. "Image too blurry") so you know what to fix',
    },
    {
      key: 'batch_upload_finished' as const,
      label: 'Batch upload finished',
      desc: 'When a multiple or ZIP upload finishes, get a summary of accepted and rejected counts',
    },
    {
      key: 'person_group_created' as const,
      label: 'Person group created',
      desc: 'When a new person folder is created from your photos',
    },
    {
      key: 'email_notifications' as const,
      label: 'Email notifications',
      desc: 'Receive all of the above as emails to your registered address',
    },
    {
      key: 'live_session_alerts' as const,
      label: 'Live session alerts',
      desc: 'Notifications during live camera enhancement sessions',
    },
  ]

  /* Against the API the switches are the account's real preferences; in the
     demo they stay the decorative defaults they always were. */
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!USE_API) return
    const ctl = new AbortController()
    getNotificationPreferences(ctl.signal)
      .then(setPrefs)
      .catch(err => {
        if (ctl.signal.aborted) return
        setLoadError(err instanceof ApiError ? err.message : 'Could not load your notification settings.')
      })
    return () => ctl.abort()
  }, [])

  const savePrefs = async () => {
    if (!prefs) return
    setSaving(true); setSaveError(null); setSaved(false)
    try {
      setPrefs(await updateNotificationPreferences(prefs))
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save your preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">Notification Settings</h2>
      {USE_API && loadError && <p role="alert" className="text-xs text-red-500">{loadError}</p>}
      {USE_API && !prefs && !loadError && <p className="text-xs text-ink-mute">Loading your settings…</p>}

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
            {USE_API ? (
              <input type="checkbox" className="sr-only peer" aria-label={item.label}
                checked={prefs ? prefs[item.key] : false} disabled={!prefs}
                onChange={e => { setPrefs(p => p && { ...p, [item.key]: e.target.checked }); setSaved(false) }} />
            ) : (
              <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" aria-label={item.label} />
            )}
            <div className="w-10 h-6 bg-border peer-checked:bg-accent rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      ))}
      <div className="flex items-center gap-3 flex-wrap">
        <GradientButton leftIcon={<Save className="w-4 h-4" />} disabled={USE_API && (!prefs || saving)}
          onClick={USE_API ? savePrefs : undefined}>
          {saving ? 'Saving…' : 'Save Preferences'}
        </GradientButton>
        {saved && <span role="status" className="text-xs text-emerald-500 font-medium inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Preferences saved</span>}
        {saveError && <span role="alert" className="text-xs text-red-500">{saveError}</span>}
      </div>
    </div>
  )
}

function CameraSettings() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">Camera & Privacy Settings</h2>
      <FaceGroupingSettings />
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

/* Face grouping: the person's yes or no to having their photos analysed for faces,
   which is what lets Person Folders exist. Withdrawing can also delete the face
   data already held. In the demo build there is no server, so the card says so. */
function FaceGroupingSettings() {
  const consent = useFaceConsent()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  /* Deleting face data is its own action, separate from turning grouping off: it works
     whether grouping is on or off (data can outlive a "no"), and it asks first, saying how
     much will go. */
  const [erase, setErase] = useState<
    | { step: 'idle' }
    | { step: 'checking' }
    | { step: 'confirm'; counts: FacialDataCounts }
    | { step: 'empty' }
    | { step: 'deleting' }
    | { step: 'done' }
  >({ step: 'idle' })
  const [eraseError, setEraseError] = useState<string | null>(null)

  const startErase = async () => {
    setEraseError(null)
    setErase({ step: 'checking' })
    try {
      const counts = await getFacialDataCounts()
      const total = counts.faces + counts.analyses + (counts.groups ?? 0) + (counts.exports ?? 0)
      setErase(total === 0 ? { step: 'empty' } : { step: 'confirm', counts })
    } catch (error) {
      setErase({ step: 'idle' })
      setEraseError(error instanceof Error ? error.message : 'Could not check your face data.')
    }
  }

  const confirmErase = async () => {
    setEraseError(null)
    setErase({ step: 'deleting' })
    try {
      await eraseFacialData()
      setErase({ step: 'done' })
    } catch (error) {
      setErase({ step: 'idle' })
      setEraseError(error instanceof Error ? error.message : 'Could not delete your face data.')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const blob = await downloadMyData()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'facecloud-my-data.json'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not prepare your data.')
    } finally {
      setExporting(false)
    }
  }

  const ready = USE_API && !consent.loading && consent.error === null
  const required = USE_API && (consent.needsConsent || consent.active)
  const erasing = erase.step === 'checking' || erase.step === 'deleting'

  return (
    <div className="p-4 rounded-2xl border border-line bg-surface-mute space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ScanFace className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Face grouping</p>
            <p className="text-xs text-ink-mute leading-relaxed">
              Lets FaceCloud analyse the faces in the photos you upload and group photos of the same person into Person Folders.
            </p>
          </div>
        </div>
        {USE_API && ready && required && (
          <StatusBadge
            status={consent.active ? 'success' : consent.needsReconfirm ? 'warning' : 'muted'}
            label={consent.active ? 'On' : consent.needsReconfirm ? 'Needs confirming' : 'Off'}
          />
        )}
      </div>

      {!USE_API && (
        <p className="text-xs text-ink-mute">This is the demo, so nothing here is saved. Connect the live service to manage it.</p>
      )}
      {USE_API && consent.loading && <p className="text-xs text-ink-mute">Loading…</p>}
      {USE_API && consent.error && (
        <div role="alert" className="p-3 rounded-xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
          {consent.error}{' '}
          <button type="button" onClick={() => consent.reload()} className="underline font-semibold cursor-pointer">Try again</button>
        </div>
      )}
      {USE_API && ready && !required && (
        <p className="text-xs text-ink-mute">This server does not ask for consent, so face grouping is always on.</p>
      )}

      {/* Turning grouping on or off */}
      {USE_API && ready && required && !consent.active && (
        <GradientButton size="sm" disabled={consent.busy} onClick={async () => { await consent.allow() }}>
          {consent.busy ? 'Saving…' : consent.needsReconfirm ? 'Confirm face grouping' : 'Allow face grouping'}
        </GradientButton>
      )}

      {/* Two separate actions: turn grouping off, and delete what is stored. */}
      {USE_API && ready && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {consent.active && (
              <GradientButton size="sm" variant="secondary" disabled={consent.busy || erasing}
                onClick={async () => { await consent.withdraw(false) }}>
                {consent.busy ? 'Saving…' : 'Turn off face grouping'}
              </GradientButton>
            )}
            {(erase.step === 'idle' || erase.step === 'checking' || erase.step === 'done') && (
              <GradientButton size="sm" variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                disabled={erasing || consent.busy} onClick={startErase}>
                {erase.step === 'checking' ? 'Checking…' : 'Delete my face data'}
              </GradientButton>
            )}
          </div>

          {erase.step === 'confirm' && (
            <div className="p-3 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 space-y-2.5">
              <p className="text-xs text-ink-soft leading-relaxed">
                This permanently deletes {erase.counts.faces} detected face{erase.counts.faces === 1 ? '' : 's'}
                {erase.counts.groups !== undefined && <> and {erase.counts.groups} Person Folder{erase.counts.groups === 1 ? '' : 's'}</>},
                with their edit history and exports. Your photos themselves are not deleted.
                {consent.active && ' Face grouping stays on, so new photos will be grouped again.'} This cannot be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <GradientButton size="sm" variant="danger" onClick={confirmErase}>Yes, delete my face data</GradientButton>
                <GradientButton size="sm" variant="secondary" onClick={() => setErase({ step: 'idle' })}>Cancel</GradientButton>
              </div>
            </div>
          )}
          {erase.step === 'deleting' && <p className="text-xs text-ink-mute">Deleting…</p>}
          {erase.step === 'empty' && (
            <p role="status" className="text-xs text-ink-mute">
              There is no face data stored for you.{' '}
              <button type="button" onClick={() => setErase({ step: 'idle' })} className="underline font-semibold cursor-pointer">OK</button>
            </p>
          )}
          {erase.step === 'done' && (
            <p role="status" className="text-xs text-[#10B981]">Your face data was deleted.</p>
          )}
          {eraseError && <p role="alert" className="text-xs text-[#F87171]">{eraseError}</p>}
        </div>
      )}

      {USE_API && ready && (
        <div className="pt-3 border-t border-line">
          <GradientButton size="sm" variant="ghost" leftIcon={<Download className="w-3.5 h-3.5" />} disabled={exporting} onClick={handleExport}>
            {exporting ? 'Preparing…' : 'Download my data'}
          </GradientButton>
          {exportError && <p role="alert" className="text-xs text-[#F87171] mt-2">{exportError}</p>}
        </div>
      )}
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
