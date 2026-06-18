export type ExpenseRow = Record<string, unknown>

export type ExpenseStatusSection = {
  id: string
  label: string
  description: string
  rows: ExpenseRow[]
}

function statusOf(e: ExpenseRow): string {
  return String(e.status || '').trim().toUpperCase()
}

/** Group course expenses for admin accounts / class expense hubs (legacy pending / approved / rejected tabs). */
export function groupExpensesForAdminSections(expenses: ExpenseRow[]): ExpenseStatusSection[] {
  const pending: ExpenseRow[] = []
  const approved: ExpenseRow[] = []
  const rejected: ExpenseRow[] = []
  const paid: ExpenseRow[] = []

  for (const e of expenses) {
    const st = statusOf(e)
    if (st === 'PAID') {
      paid.push(e)
    } else if (st === 'ADMIN_REJECTED' || st === 'INSTRUCTOR_REJECTED') {
      rejected.push(e)
    } else if (st === 'ADMIN_APPROVED') {
      approved.push(e)
    } else if (st === 'INSTRUCTOR_APPROVED') {
      approved.push(e)
    } else {
      pending.push(e)
    }
  }

  const sortNewest = (a: ExpenseRow, b: ExpenseRow) =>
    String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''))

  return [
    {
      id: 'pending',
      label: 'Pending expenses',
      description: 'Submitted and awaiting admin review.',
      rows: pending.sort(sortNewest),
    },
    {
      id: 'approved',
      label: 'Approved expenses',
      description: 'Admin-approved; mark paid when reimbursed.',
      rows: approved.sort(sortNewest),
    },
    {
      id: 'rejected',
      label: 'Rejected expenses',
      description: 'Rejected by admin or instructor.',
      rows: rejected.sort(sortNewest),
    },
    {
      id: 'paid',
      label: 'Paid expenses',
      description: 'Reimbursed and closed.',
      rows: paid.sort(sortNewest),
    },
  ]
}

export function adminCanApproveExpense(e: ExpenseRow): boolean {
  const st = statusOf(e)
  return (
    st === 'SUBMITTED' ||
    st === 'INSTRUCTOR_REVIEW' ||
    st === 'INSTRUCTOR_APPROVED'
  )
}

export function adminCanRejectExpense(e: ExpenseRow): boolean {
  const st = statusOf(e)
  return st !== 'PAID' && st !== 'ADMIN_REJECTED' && st !== 'INSTRUCTOR_REJECTED'
}

export function adminCanMarkPaid(e: ExpenseRow): boolean {
  return statusOf(e) === 'ADMIN_APPROVED'
}

export function expenseRowId(e: ExpenseRow, index = 0): string {
  const id = String(e.id ?? e._id ?? '').trim()
  return id || `__row-${index}`
}
