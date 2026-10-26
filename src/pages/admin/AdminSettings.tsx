import { PageHeader } from '../../components/layout/PageHeader'
import { AccountSettings } from '../../components/auth/AccountSettings'

/** The administrator's own account: name and password. */
export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Account Settings" subtitle="Your name and your password." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountSettings role="admin" />
      </div>
    </div>
  )
}
