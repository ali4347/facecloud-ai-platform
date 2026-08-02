import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { GradientButton } from '../../components/ui/GradientButton'
import { mockUsers } from '../../data/mock'
import { formatDate } from '../../lib/utils'
import type { Role } from '../../data/mock'

const roleBadge = (role: Role) => {
  const map = { user: 'info', admin: 'purple', moderator: 'warning' } as const
  return <StatusBadge status={map[role]} label={role.charAt(0).toUpperCase() + role.slice(1)} dot={false} />
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const filtered = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-enter">
      <PageHeader
        title="Users"
        subtitle={`${mockUsers.length} registered users`}
        action={<GradientButton leftIcon={<UserPlus className="w-4 h-4" />}>Add User</GradientButton>}
      />
      <div className="flex items-center gap-3 mb-5">
        <SearchInput placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
      </div>
      <div className="fc-card overflow-hidden">
        <DataTable
          data={filtered as unknown[] as Record<string, unknown>[]}
          getKey={row => String(row.id)}
          columns={[
            { key: 'name', label: 'User', render: row => (
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #EA580C, #F97316)',
                    boxShadow: '0 0 10px rgba(249, 115, 22,0.15)',
                  }}
                >
                  {String(row.avatar)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{String(row.name)}</p>
                  <p className="text-xs text-white/50">{String(row.email)}</p>
                </div>
              </div>
            )},
            { key: 'role', label: 'Role', render: row => roleBadge(row.role as Role) },
            { key: 'status', label: 'Status', render: row => (
              <StatusBadge status={row.status === 'active' ? 'success' : 'error'} label={String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1)} />
            )},
            { key: 'uploads', label: 'Uploads', render: row => <span className="text-sm font-semibold text-white/90">{String(row.uploads)}</span> },
            { key: 'joinedAt', label: 'Joined', render: row => <span className="text-sm text-white/50">{formatDate(String(row.joinedAt))}</span> },
            { key: 'actions', label: 'Actions', render: row => (
              <div className="flex gap-2">
                <button className="text-xs text-[#FB923C] font-medium hover:underline cursor-pointer">View</button>
                <button className={`text-xs font-medium hover:underline cursor-pointer ${row.status === 'active' ? 'text-[#F87171]' : 'text-[#4FFFB0]'}`}>
                  {row.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            )},
          ]}
        />
      </div>
    </div>
  )
}
