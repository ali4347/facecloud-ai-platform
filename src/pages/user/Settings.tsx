import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { User, Lock, Bell, Camera, Save } from 'lucide-react'

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
                tab === t.id ? 'bg-soft-blue text-primary font-semibold' : 'text-muted hover:bg-background'
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
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-dark">Profile Settings</h2>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">AH</div>
        <div>
          <p className="text-sm font-semibold text-dark">Ali Hassan</p>
          <p className="text-xs text-muted">ali@facecloud.io · User</p>
          <button className="text-xs text-primary font-medium mt-1 hover:underline">Change avatar</button>
        </div>
      </div>
      {[
        { label: 'Full Name', value: 'Ali Hassan', id: 'profile-name' },
        { label: 'Email Address', value: 'ali@facecloud.io', id: 'profile-email' },
        { label: 'University', value: 'Bahria University Lahore Campus', id: 'profile-uni' },
        { label: 'Department', value: 'Department of Computer Sciences', id: 'profile-dept' },
      ].map(f => (
        <div key={f.id}>
          <label className="text-xs font-semibold text-dark block mb-1.5">{f.label}</label>
          <input id={f.id} type="text" defaultValue={f.value} className="fc-input" />
        </div>
      ))}
      <GradientButton leftIcon={<Save className="w-4 h-4" />}>Save Changes</GradientButton>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-dark">Security Settings</h2>
      {[
        { label: 'Current Password', id: 'sec-cur', placeholder: 'Enter current password' },
        { label: 'New Password', id: 'sec-new', placeholder: 'Min. 8 characters' },
        { label: 'Confirm New Password', id: 'sec-confirm', placeholder: 'Repeat new password' },
      ].map(f => (
        <div key={f.id}>
          <label className="text-xs font-semibold text-dark block mb-1.5">{f.label}</label>
          <input id={f.id} type="password" placeholder={f.placeholder} className="fc-input" />
        </div>
      ))}
      <GradientButton variant="secondary">Update Password</GradientButton>
      <div className="border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-dark mb-3">Active Sessions</h3>
        {[{ device: 'Chrome on macOS', ip: '192.168.1.1', time: 'Active now' },
          { device: 'Firefox on Windows', ip: '192.168.1.15', time: '2 days ago' }].map(s => (
          <div key={s.device} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-dark">{s.device}</p>
              <p className="text-xs text-muted">{s.ip} · {s.time}</p>
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
    { label: 'Upload completed', desc: 'When your images finish processing' },
    { label: 'Enhancement done', desc: 'When AI enhancement completes' },
    { label: 'Validation failed', desc: 'When an image is rejected' },
    { label: 'Identity grouped', desc: 'When new identity groups are created' },
    { label: 'Email notifications', desc: 'Receive summaries via email' },
    { label: 'Live session alerts', desc: 'Notifications during live enhancement' },
  ]
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-dark">Notification Settings</h2>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div>
            <p className="text-sm font-semibold text-dark">{item.label}</p>
            <p className="text-xs text-muted">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" />
            <div className="w-10 h-6 bg-border peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
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
      <h2 className="text-base font-bold text-dark">Camera & Privacy Settings</h2>
      {[
        { label: 'Allow camera access', desc: 'Required for live enhancement sessions' },
        { label: 'Auto-save snapshots', desc: 'Automatically save enhanced live snapshots' },
        { label: 'Face detection overlay', desc: 'Show face scan overlay on live feed' },
        { label: 'Save session logs', desc: 'Log live enhancement sessions for history' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div>
            <p className="text-sm font-semibold text-dark">{item.label}</p>
            <p className="text-xs text-muted">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
            <div className="w-10 h-6 bg-border peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      ))}
      <div>
        <label className="text-xs font-semibold text-dark block mb-1.5">Default Enhancement Strength</label>
        <input type="range" min={0} max={100} defaultValue={75} className="w-full" />
        <p className="text-xs text-muted mt-1">Higher values increase processing time</p>
      </div>
      <GradientButton leftIcon={<Save className="w-4 h-4" />}>Save Settings</GradientButton>
    </div>
  )
}
