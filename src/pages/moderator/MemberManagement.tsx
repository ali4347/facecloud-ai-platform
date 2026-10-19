import { useState, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockOrgMembers, mockModeratorAudit } from '../../data/mock'
import type { OrgMember } from '../../data/mock'
import { USE_API } from '../../lib/api/config'
import { LiveMemberManagement } from './MemberManagementLive'
import { Search, UserPlus, Mail, Trash2, RefreshCw, X, ShieldAlert, CheckCircle } from 'lucide-react'
import { readSessionRaw } from '../../lib/session'

/** The demo build's version: local sample members, kept for the site that has no backend. */
function DemoMemberManagement() {
  const [members, setMembers] = useState<OrgMember[]>(mockOrgMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'user'>('user')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Get active session
  const sessionStr = readSessionRaw('moderator')
  const session = sessionStr ? JSON.parse(sessionStr) : { name: 'Vaneeza Sohaib', email: 'moderator@facecloud.ai', initials: 'VS' }
  // Find current moderator ID from email
  const currentModeratorId = 'u3' // Vaneeza Sohaib's user ID

  // 1. OWNERSHIP SCOPING: Only view members created by current moderator (u3)
  const scopedMembers = useMemo(() => {
    return members.filter(m => m.createdBy === currentModeratorId)
  }, [members, currentModeratorId])

  // Apply Search Filter on the scoped members list
  const filteredMembers = useMemo(() => {
    return scopedMembers.filter(m => {
      const matchName = m.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchEmail = m.email.toLowerCase().includes(searchTerm.toLowerCase())
      return matchName || matchEmail
    })
  }, [scopedMembers, searchTerm])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Audit entry helper
  const addAuditLog = (action: string, target: string) => {
    const newLog = {
      id: `ma-${Date.now()}`,
      timestamp: new Date().toISOString(),
      moderatorName: session.name,
      filename: target,
      action: action,
      oldStatus: 'active',
      newStatus: 'modified',
      reason: `Moderator Member Management: ${action} on ${target}`,
      userNotified: true
    }
    mockModeratorAudit.unshift(newLog)
  }

  // Row actions
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    // Add new member record (tagged with u3 as creator)
    const newMember: OrgMember = {
      id: `m-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: 'user',
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
      createdBy: currentModeratorId
    }

    setMembers(prev => [newMember, ...prev])
    addAuditLog('Invite Member', inviteEmail)
    setInviteEmail('')
    setInviteModalOpen(false)
    showToast(`Invitation sent successfully to ${inviteEmail}`)
  }

  const handleDeactivate = (id: string, email: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'suspended' } : m))
    addAuditLog('Deactivate Member', email)
    showToast(`Member ${email} deactivated.`)
  }

  const handleReactivate = (id: string, email: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'active' } : m))
    addAuditLog('Reactivate Member', email)
    showToast(`Member ${email} reactivated.`)
  }

  const handleRemove = (id: string, email: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    addAuditLog('Remove Member', email)
    showToast(`Member ${email} removed.`)
  }

  const handleResendInvite = (email: string) => {
    addAuditLog('Resend Invite', email)
    showToast(`Invitation resent to ${email}`)
  }

  return (
    <div className="space-y-6 page-enter relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-3xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs font-bold text-[#10B981] flex items-center gap-2 shadow-[0_4px_24px_rgba(16,185,129,0.15)] backdrop-blur-md animate-enter">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader 
        title="Member Management"
        subtitle="Invite and manage organization users. You only see members invited by you."
        action={
          <button 
            onClick={() => setInviteModalOpen(true)}
            className="fc-btn-primary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        <ChartCard title="Organization Members" subtitle="Manage accounts scope controls">
          <div className="space-y-4">
            
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-ink-faint" />
              <input 
                type="text" 
                placeholder="Search member by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="fc-input !pl-10 !py-2"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full fc-table text-left">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined/Invited</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredMembers.map(member => {
                    const isUserRole = member.role === 'user'
                    const initials = member.name.substring(0, 2).toUpperCase()

                    return (
                      <tr key={member.id} className="hover:bg-surface-mute transition-colors">
                        <td>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {initials}
                          </div>
                        </td>
                        <td className="font-bold text-ink">{member.name}</td>
                        <td className="text-ink-mute">{member.email}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            member.role === 'admin' ? 'bg-[#EA580C]/10 text-[#A78BFA]' :
                            member.role === 'moderator' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            'bg-surface-mute text-ink-mute'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            member.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            member.status === 'pending' ? 'bg-[#FB923C]/10 text-[#FB923C]' :
                            'bg-[#EF4444]/10 text-[#EF4444]'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="text-ink-faint font-mono text-[11px]">{member.joinedAt}</td>
                        <td>
                          {/* Role Restriction and Scoping Checks */}
                          {!isUserRole ? (
                            <div className="relative group inline-block">
                              <span className="text-[10px] text-ink-faint font-semibold cursor-not-allowed italic flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Locked
                              </span>
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[rgb(var(--a-surface))]/95 border border-line rounded-xl text-[9px] text-[#EF4444] font-bold shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-center leading-normal">
                                You don't have permission to manage this account.
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {member.status === 'pending' ? (
                                <>
                                  <button 
                                    onClick={() => handleResendInvite(member.email)}
                                    className="p-1.5 rounded-lg border border-line hover:border-line bg-surface-mute text-ink-soft hover:text-ink transition-all"
                                    title="Resend Invite"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleRemove(member.id, member.email)}
                                    className="p-1.5 rounded-lg border border-red-500/10 hover:border-red-500/30 bg-red-500/5 text-red-400 hover:text-red-300 transition-all"
                                    title="Cancel Invite"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {member.status === 'active' ? (
                                    <button 
                                      onClick={() => handleDeactivate(member.id, member.email)}
                                      className="fc-btn-secondary !py-1 !px-2.5 text-[10px] hover:border-red-500/30 text-ink-soft hover:text-ink"
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleReactivate(member.id, member.email)}
                                      className="fc-btn-secondary !py-1 !px-2.5 text-[10px] hover:border-[#10B981]/30 text-ink-soft hover:text-ink"
                                    >
                                      Reactivate
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleRemove(member.id, member.email)}
                                    className="p-1.5 rounded-lg border border-red-500/10 hover:border-red-500/30 bg-red-500/5 text-red-400 hover:text-red-300 transition-all"
                                    title="Remove Member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12 text-ink-faint">
                <Mail className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="text-xs font-semibold">No organization members found.</p>
                <p className="text-[10px] text-ink-faint mt-1">You only see and manage user accounts invited directly by you.</p>
              </div>
            )}

          </div>
        </ChartCard>
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="fc-panel-strong w-full max-w-md p-6 relative border border-line"
            style={{ background: 'rgba(10, 13, 20, 0.95)' }}
          >
            <button 
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 text-ink-faint hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-ink mb-2">Invite Organization Member</h3>
            <p className="text-xs text-ink-faint mb-6">Send an invite code. New members automatically inherit user workspace restrictions.</p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block">Email Address</label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="fc-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block">Access Role</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="fc-input text-ink"
                  style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}
                  disabled
                >
                  <option value="user" className="bg-[rgb(var(--a-surface))]">User (Standard workspace)</option>
                </select>
                <span className="text-[9px] text-[#FCD34D]/70 mt-1 block">Moderators can only invite standard user accounts.</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="fc-btn-secondary !py-2.5 text-xs flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="fc-btn-primary !py-2.5 text-xs flex-1 justify-center"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/** Live backend: the real, organization-scoped screen. Demo build: the sample one above. */
export default function MemberManagement() {
  return USE_API ? <LiveMemberManagement /> : <DemoMemberManagement />
}
