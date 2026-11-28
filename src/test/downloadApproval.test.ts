import { describe, expect, it } from 'vitest'
import {
  buildDecision, countsLine, denialLabel, downloadable, grantState, planDecision, reasonProblem, refusalCanBeRequested, refusalSentence,
} from '../lib/downloadApproval'
import { resolveNotificationPath } from '../lib/api/notifications'
import { notificationKind } from '../lib/notificationKinds'
import type { DownloadGrant, DownloadRequestItem } from '../lib/api/downloads'

const grant = (over: Partial<DownloadGrant> = {}): DownloadGrant => ({
  id: 1, expires_at: new Date(Date.now() + 3_600_000).toISOString(), revoked_at: null, revoke_reason: '', max_uses: 0, use_count: 0, active: true, expired: false, ...over,
})
const item = (over: Partial<DownloadRequestItem> = {}): DownloadRequestItem => ({
  id: 1, image_id: 1, image_name: 'a.jpg', artifact_type: 'enhanced', artifact_id: null, status: 'approved', denial_reason_code: '', denial_reason_text: '',
  reviewed_at: null, grant: grant(), file_url: '/x', ...over,
})

describe('moderator decision', () => {
  const pending = [11, 12, 13]

  it('approve_all approves every undecided image and needs no reason', () => {
    expect(planDecision('approve_all', pending, [])).toEqual({ approve: pending, deny: [], untouched: [] })
    expect(buildDecision('approve_all', pending, [], undefined, {}, 4)).toEqual({ body: { action: 'approve_all', expected_version: 4 } })
  })

  it('approve_selected denies the others with the reason and sends the selection', () => {
    expect(planDecision('approve_selected', pending, [11])).toEqual({ approve: [11], deny: [12, 13], untouched: [] })
    const built = buildDecision('approve_selected', pending, [11], { code: 'client_restriction', text: '' }, {}, 2)
    expect(built).toEqual({ body: { action: 'approve_selected', item_ids: [11], reason: { code: 'client_restriction', text: '' }, expected_version: 2 } })
  })

  it('deny_selected leaves the rest undecided', () => {
    expect(planDecision('deny_selected', pending, [12])).toEqual({ approve: [], deny: [12], untouched: [11, 13] })
    const built = buildDecision('deny_selected', pending, [12], { code: 'privacy_or_consent', text: ' x ' }, {}, 0)
    expect(built).toEqual({ body: { action: 'deny_selected', item_ids: [12], reason: { code: 'privacy_or_consent', text: 'x' }, expected_version: 0 } })
  })

  it('deny_all needs a reason', () => {
    expect(buildDecision('deny_all', pending, [], undefined, {}, 1)).toEqual({ error: 'Choose a reason for the photos you deny.' })
    expect(buildDecision('deny_all', pending, [], { code: 'policy_restriction', text: '' }, {}, 1))
      .toEqual({ body: { action: 'deny_all', reason: { code: 'policy_restriction', text: '' }, expected_version: 1 } })
  })

  it('"other" needs an explanation, for the general reason and for a photo’s own reason', () => {
    expect(reasonProblem({ code: 'other', text: '  ' })).toMatch(/Explain/)
    expect(buildDecision('deny_all', pending, [], { code: 'other', text: '' }, {}, 1)).toEqual({ error: 'Explain the reason when you choose “Other”.' })
    const own = buildDecision('deny_all', pending, [], { code: 'policy_restriction', text: '' }, { 12: { code: 'other', text: '' } }, 1)
    expect('error' in own && own.error).toMatch(/own reason/)
  })

  it('a per-photo reason is sent only for photos this decision denies', () => {
    const built = buildDecision('deny_selected', pending, [12], { code: 'policy_restriction', text: '' },
      { 12: { code: 'other', text: 'Wrong person' }, 13: { code: 'other', text: 'not denied now' } }, 3)
    expect(built).toEqual({ body: { action: 'deny_selected', item_ids: [12], item_reasons: { 12: { code: 'other', text: 'Wrong person' } }, expected_version: 3 } })
  })

  it('a selection-based action needs a selection, and nothing can be decided twice', () => {
    expect(buildDecision('approve_selected', pending, [], undefined, {}, 0)).toEqual({ error: 'Select at least one undecided photo first.' })
    expect(buildDecision('approve_all', [], [], undefined, {}, 0)).toEqual({ error: 'Every photo in this request is already decided.' })
  })
})

describe('grants and refusals', () => {
  it('reads a grant as active, expired, withdrawn or used up', () => {
    expect(grantState(grant())).toBe('active')
    expect(grantState(grant({ expires_at: new Date(Date.now() - 1000).toISOString() }))).toBe('expired')
    expect(grantState(grant({ expired: true }))).toBe('expired')
    expect(grantState(grant({ revoked_at: new Date().toISOString() }))).toBe('revoked')
    expect(grantState(grant({ max_uses: 2, use_count: 2 }))).toBe('used_up')
  })

  it('only an approved item with a working approval is downloadable', () => {
    expect(downloadable(item())).toBe(true)
    expect(downloadable(item({ status: 'denied', grant: null }))).toBe(false)
    expect(downloadable(item({ grant: grant({ revoked_at: '2026-01-01T00:00:00Z' }) }))).toBe(false)
  })

  it('explains each refusal reason and says when asking again can help', () => {
    expect(refusalSentence('expired')).toMatch(/expired/)
    expect(refusalSentence('bulk_not_allowed')).toMatch(/photo by photo/)
    expect(refusalSentence('weird', 'server says so')).toBe('server says so')
    expect(refusalCanBeRequested('no_grant')).toBe(true)
    expect(refusalCanBeRequested('organization_suspended')).toBe(false)
  })

  it('labels denial codes and counts', () => {
    expect(denialLabel('privacy_or_consent')).toBe('Privacy or consent')
    expect(denialLabel('no_longer_eligible')).toBe('No longer eligible')
    expect(countsLine({ counts: { total: 12, approved: 10, denied: 2, pending: 0 } })).toBe('12 photos · 10 approved · 2 denied')
  })
})

describe('notifications', () => {
  it('opens the requester’s and the reviewer’s request pages', () => {
    expect(resolveNotificationPath('/dashboard/download-requests/7')).toBe('/dashboard/download-requests/7')
    expect(resolveNotificationPath('/moderator/download-requests/7?organization=3')).toBe('/moderator/download-requests/7?organization=3')
    expect(resolveNotificationPath('/dashboard/download-requestsX/7')).toBeNull()
  })

  it('gives the three new events a kind and an icon', () => {
    for (const type of ['download_request_submitted', 'download_request_received', 'download_request_decided']) {
      expect(notificationKind(type).label).toBe('Download request')
    }
  })
})
