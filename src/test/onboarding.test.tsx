import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ApiError } from '../lib/api/client'

vi.mock('../lib/api/config', () => ({ API_URL: 'http://api.test', USE_API: true }))
let session: { email: string; role: 'user' } | null = null
vi.mock('../lib/session', async importOriginal => ({ ...(await importOriginal<object>()), getSession: () => session }))
const preview = vi.fn()
const accept = vi.fn()
vi.mock('../lib/api/organizations', async importOriginal => ({
  ...(await importOriginal<object>()),
  previewInvitation: (...a: unknown[]) => preview(...a),
  acceptInvitation: (...a: unknown[]) => accept(...a),
}))
const forget = vi.fn()
vi.mock('../lib/personCache', async importOriginal => ({ ...(await importOriginal<object>()), forgetPersonCaches: () => forget() }))
const signIn = vi.fn()
const registerInv = vi.fn()
const register = vi.fn()
vi.mock('../lib/api/auth', async importOriginal => ({
  ...(await importOriginal<object>()),
  signInToPortal: (...a: unknown[]) => signIn(...a),
  registerFromInvitation: (...a: unknown[]) => registerInv(...a),
  register: (...a: unknown[]) => register(...a),
  savePendingRegistration: vi.fn(),
}))

import InvitationAccept from '../pages/InvitationAccept'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { safeNext } from '../lib/safeNext'
import { isUploadTeam } from '../lib/useSubmitTarget'
import type { MyOrganization } from '../lib/api/organizations'

const ownerInvite = { organization_name: 'Event Planners', email: 'NewOwner@example.com', role: 'owner' as const, expires_at: '2026-12-04T13:32:14Z' }

function Where() { const l = useLocation(); return <p data-testid="where">{l.pathname + l.search}</p> }
const at = (path: string, element: React.ReactNode, routePath: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path={routePath} element={<>{element}<Where /></>} /><Route path="*" element={<Where />} /></Routes>
  </MemoryRouter>,
)

beforeEach(() => { session = null; for (const f of [preview, accept, forget, signIn, registerInv, register]) f.mockReset() })

describe('owner invitation page', () => {
  it('not signed in: owner wording, sign in comes back here, or create the account from the invitation', async () => {
    preview.mockResolvedValue(ownerInvite)
    at('/invitations/tok123', <InvitationAccept />, '/invitations/:token')
    expect(await screen.findByText('Become the owner of Event Planners')).toBeTruthy()
    expect(screen.getByText(/you become the owner as soon as it is created/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/login?next=%2Finvitations%2Ftok123')
    expect(screen.getByRole('link', { name: 'Create account' }).getAttribute('href')).toBe('/register?invitation=tok123')
    expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull()
  })

  it('signed in with the invited address (any case): accepting is an explicit step, then My Organization', async () => {
    session = { email: 'newowner@example.com', role: 'user' }
    preview.mockResolvedValue(ownerInvite)
    accept.mockResolvedValue({ id: 1, role: 'owner', status: 'active' })
    at('/invitations/tok123', <InvitationAccept />, '/invitations/:token')
    fireEvent.click(await screen.findByRole('button', { name: 'Accept and become the owner' }))
    expect(await screen.findByText('You are now the owner of Event Planners')).toBeTruthy()
    expect(accept).toHaveBeenCalledWith('tok123')
    expect(forget).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Open My Organization' }).getAttribute('href')).toBe('/dashboard/organization')
  })

  it('signed in with another address: no accept button, sign in with the invited one', async () => {
    session = { email: 'someone@else.com', role: 'user' }
    preview.mockResolvedValue(ownerInvite)
    at('/invitations/tok123', <InvitationAccept />, '/invitations/:token')
    expect(await screen.findByText(/but this invitation is for/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Create account' })).toBeNull()
  })

  it.each([
    [403, /Sign in with the invited e-mail address/],
    [409, /already used, cancelled or has expired/],
  ])('accept refused with %s is explained', async (status, text) => {
    session = { email: 'newowner@example.com', role: 'user' }
    preview.mockResolvedValue(ownerInvite)
    accept.mockRejectedValue(new ApiError(status, 'x'))
    at('/invitations/tok123', <InvitationAccept />, '/invitations/:token')
    fireEvent.click(await screen.findByRole('button', { name: 'Accept and become the owner' }))
    expect(await screen.findByText(text)).toBeTruthy()
    expect(forget).not.toHaveBeenCalled()
  })

  it('an invalid, used or expired link shows the server’s sentence', async () => {
    preview.mockRejectedValue(new ApiError(404, 'This invitation is invalid, used or expired.'))
    at('/invitations/bad', <InvitationAccept />, '/invitations/:token')
    expect(await screen.findByText('This invitation is invalid, used or expired.')).toBeTruthy()
  })

  it('a member invitation keeps its wording', async () => {
    preview.mockResolvedValue({ ...ownerInvite, role: 'member' })
    at('/invitations/t', <InvitationAccept />, '/invitations/:token')
    expect(await screen.findByText('Join Event Planners')).toBeTruthy()
  })
})

describe('signing in and coming back', () => {
  it('safeNext allows only an invitation link or the user dashboard', () => {
    expect(safeNext('/invitations/abc')).toBe('/invitations/abc')
    expect(safeNext('/dashboard/organization')).toBe('/dashboard/organization')
    for (const bad of ['https://evil.example', '//evil.example', '/admin', '/moderator/queue', 'javascript:alert(1)', '/invitations/a/b', '/\\evil', null, '']) {
      expect(safeNext(bad as string)).toBeNull()
    }
  })

  it('Login returns to the invitation after signing in', async () => {
    signIn.mockResolvedValue({ kind: 'signed-in', role: 'user', dashboard: 'user', user: { email: 'a@b.c' } })
    at('/login?next=%2Finvitations%2Ftok123', <Login />, '/login')
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'newowner@example.com' } })
    fireEvent.change(document.querySelector('input[type=password]') as HTMLInputElement, { target: { value: 'pw-123456' } })
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/invitations/tok123'))
  })

  it('Login ignores an unsafe next and goes to the dashboard', async () => {
    signIn.mockResolvedValue({ kind: 'signed-in', role: 'user', dashboard: 'user', user: { email: 'a@b.c' } })
    at('/login?next=https%3A%2F%2Fevil.example', <Login />, '/login')
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@y.z' } })
    fireEvent.change(document.querySelector('input[type=password]') as HTMLInputElement, { target: { value: 'pw-123456' } })
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/dashboard'))
  })
})

describe('registration', () => {
  it('a new owner registers from the invitation and lands on My Organization', async () => {
    preview.mockResolvedValue(ownerInvite)
    registerInv.mockResolvedValue({ kind: 'signed-in', role: 'user', dashboard: 'user', user: { email: ownerInvite.email } })
    at('/register?invitation=tok123', <Register />, '/register')
    expect(await screen.findByText(/You were invited to be the owner of/)).toBeTruthy()
    const inputs = [...document.querySelectorAll('form input')] as HTMLInputElement[]
    const byType = (t: string) => inputs.filter(i => i.type === t)
    fireEvent.change(byType('text')[0], { target: { value: 'New Owner' } })
    for (const p of byType('password')) fireEvent.change(p, { target: { value: 'Strong-Pass-2026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account and become the owner' }))
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/dashboard/organization'))
    expect(registerInv.mock.calls[0][0]).toMatchObject({ invitationToken: 'tok123', email: ownerInvite.email })
    expect(register).not.toHaveBeenCalled()
  })

  it('public sign-up says it is a personal account and never sends an invitation', async () => {
    register.mockResolvedValue({ registrationId: 'r1', maskedEmail: 'a***@b.c' })
    at('/register', <Register />, '/register')
    expect(screen.getByText(/This creates a personal account/)).toBeTruthy()
    const inputs = [...document.querySelectorAll('form input')] as HTMLInputElement[]
    fireEvent.change(inputs.find(i => i.type === 'text') as HTMLInputElement, { target: { value: 'Pat' } })
    fireEvent.change(inputs.find(i => i.type === 'email') as HTMLInputElement, { target: { value: 'pat@example.com' } })
    for (const p of inputs.filter(i => i.type === 'password')) fireEvent.change(p, { target: { value: 'Strong-Pass-2026' } })
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)
    await waitFor(() => expect(register).toHaveBeenCalledOnce())
    expect(registerInv).not.toHaveBeenCalled()
    expect(JSON.stringify(register.mock.calls[0][0])).not.toMatch(/invitation|organization/)
  })
})

describe('organization navigation needs an active membership', () => {
  const o = (over: Partial<MyOrganization>): MyOrganization => ({
    id: 1, name: 'T', slug: 't', status: 'active', plan: 'team', is_personal: false, created_at: '', updated_at: '',
    membership: { id: 1, role: 'member', status: 'active' }, capabilities: {}, ...over,
  })
  it('only active memberships of active shared organizations are upload targets', () => {
    expect(isUploadTeam(o({}))).toBe(true)
    expect(isUploadTeam(o({ is_personal: true }))).toBe(false)
    expect(isUploadTeam(o({ status: 'pending_owner' }))).toBe(false)
    expect(isUploadTeam(o({ status: 'suspended' }))).toBe(false)
    expect(isUploadTeam(o({ membership: { id: 1, role: 'member', status: 'invited' } }))).toBe(false)
    expect(isUploadTeam(o({ membership: null }))).toBe(false)
  })
})
