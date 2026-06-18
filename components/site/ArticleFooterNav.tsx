import Link from 'next/link'
import { formatTitleCase } from '@/lib/formatTitleCase'

const DEFAULT_LINKS = [
  { href: '/schedule/', label: 'Class schedule' },
  { href: '/training/', label: 'Training overview' },
  { href: '/contact/', label: 'Contact' },
  { href: '/apply/trainer/', label: 'Trainer application' },
] as const

/** Shared “Next steps” footer links on marketing article pages. */
export function ArticleFooterNav({
  linkClassName = 'text-teal-700 hover:underline',
  includeTrainerApplication = true,
}: {
  linkClassName?: string
  includeTrainerApplication?: boolean
}) {
  const links = includeTrainerApplication
    ? DEFAULT_LINKS
    : DEFAULT_LINKS.filter((l) => l.href !== '/apply/trainer/')

  return (
    <nav
      className="mt-14 flex flex-wrap gap-4 border-t border-slate-200 pt-10 text-sm font-semibold"
      aria-label="Next steps"
    >
      {links.map((item) => (
        <Link key={item.href} href={item.href} className={linkClassName}>
          {formatTitleCase(item.label)}
        </Link>
      ))}
    </nav>
  )
}
