import { redirect } from 'next/navigation'

export default function AdminPayrollPage() {
  redirect('/portal/admin/instructors?tab=payments')
}
