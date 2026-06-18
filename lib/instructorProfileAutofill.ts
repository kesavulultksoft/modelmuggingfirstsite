import type { MeUser } from '@/lib/portalApi'

/**
 * When the instructor CRM profile has blank identity fields, prefill from the portal
 * account (registration / signup data from `/api/v1/me`).
 */
export function applySignupIdentityToProfileForm(me: MeUser, form: Record<string, string>): Record<string, string> {
  const firstName = (form.firstName ?? '').trim()
  const lastName = (form.lastName ?? '').trim()
  const emailId = (form.emailId ?? '').trim()
  return {
    ...form,
    firstName: firstName || (me.firstName ?? '').trim() || '',
    lastName: lastName || (me.lastName ?? '').trim() || '',
    emailId: emailId || (me.email ?? '').trim() || '',
  }
}
