import { redirect } from 'next/navigation'

/** Legacy /mass-mail → unified email center send tab. */
export default function AdminMassMailRedirectPage() {
  redirect('/portal/admin/email-center?tab=send')
}
