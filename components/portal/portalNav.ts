import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Calendar,
  Inbox,
  Heart,
  Users,
  DollarSign,
  BookOpen,
  Shield,
  Wrench,
  UserCircle,
  Home,
  History,
  Award,
  User,
  CreditCard,
  FileText,
  ShieldCheck,
  FolderOpen,
  Plane,
  Ruler,
  UserPlus,
  Users2,
  Archive,
  GraduationCap,
  ClipboardList,
  Mail,
  Layers,
  ClipboardCheck,
  IdCard,
} from 'lucide-react'

export type NavItem = { href: string; label: string; icon: LucideIcon }

export function portalNavForRole(role: string): NavItem[] {
  const common: NavItem[] = [
    { href: '/portal/account', label: 'Account', icon: UserCircle },
  ]

  switch (role) {
    case 'STUDENT':
    case 'PARENT':
      return [
        { href: '/portal/student', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/portal/student/courses', label: 'My classes', icon: BookOpen },
        { href: '/portal/student/history', label: 'Courses attended', icon: History },
        { href: '/portal/student/certificates', label: 'Certificates', icon: Award },
        { href: '/portal/student/profile', label: 'Profile', icon: User },
        { href: '/portal/student/transactions', label: 'Transactions', icon: CreditCard },
        { href: '/portal/student/documents', label: 'Forms & prep', icon: FileText },
        { href: '/portal/student/inbox', label: 'Inbox', icon: Inbox },
        { href: '/donate-to-empowerment/', label: 'Donate', icon: Heart },
        ...common,
      ]
    case 'INSTRUCTOR':
      return [
        { href: '/portal/instructor', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/portal/instructor/trainings', label: 'Course management', icon: BookOpen },
        { href: '/portal/instructor/account-workspace', label: 'Account workspace', icon: IdCard },
        { href: '/portal/instructor/onboarding-history', label: 'Onboarding timeline', icon: ClipboardCheck },
        { href: '/portal/instructor/profile', label: 'Profile', icon: User },
        { href: '/portal/instructor/verification', label: 'Background verification', icon: ShieldCheck },
        { href: '/portal/instructor/documents', label: 'Documents', icon: FolderOpen },
        { href: '/portal/instructor/travel', label: 'Travel info', icon: Plane },
        { href: '/portal/instructor/measurements', label: 'Equipment size', icon: Ruler },
        { href: '/portal/instructor/expenses', label: 'Expenses', icon: DollarSign },
        { href: '/portal/student/inbox', label: 'Inbox', icon: Inbox },
        ...common,
      ]
    case 'ADMIN':
    case 'SUPERADMIN':
      return [
        { href: '/portal/admin', label: 'Overview', icon: LayoutDashboard },
        { href: '/portal/admin/courses', label: 'Courses', icon: Calendar },
        { href: '/portal/admin/students', label: 'Students', icon: GraduationCap },
        { href: '/portal/admin/transactions', label: 'Transactions', icon: CreditCard },
        { href: '/portal/admin/group-applications', label: 'Group apps', icon: Layers },
        { href: '/portal/admin/subscribers', label: 'Subscribers', icon: Mail },
        { href: '/portal/admin/interview-questions', label: 'Interview Questions', icon: ClipboardList },
        { href: '/portal/admin/email-center', label: 'Email', icon: Inbox },
        { href: '/portal/admin/library-docs', label: 'Library & docs', icon: FolderOpen },
        { href: '/portal/admin/equipment-center', label: 'Equipment', icon: Wrench },
        { href: '/portal/admin/instructors', label: 'Instructors', icon: Users },
        { href: '/portal/admin/trainer-pipeline', label: 'Applicant pipeline', icon: UserPlus },
        { href: '/portal/admin/bg-verification', label: 'BG verification', icon: Shield },
        { href: '/portal/admin/contractors', label: 'Contractors', icon: ShieldCheck },
        { href: '/portal/admin/users', label: 'Portal users', icon: Users2 },
        { href: '/portal/admin/accounts', label: 'Class expenses', icon: DollarSign },
        { href: '/portal/admin/operations', label: 'Operations', icon: Archive },
        { href: '/portal/admin/reports', label: 'Reports', icon: ClipboardList },
        ...common,
      ]
    case 'BGAGENT':
      return [{ href: '/portal/bgagent', label: 'BG queue', icon: Shield }, ...common]
    case 'EQUIPSPECIALIST':
      return [{ href: '/portal/equip', label: 'Equipment', icon: Wrench }, ...common]
    default:
      return [
        { href: '/portal/home', label: 'Home', icon: LayoutDashboard },
        { href: '/schedule', label: 'Classes', icon: Calendar },
        { href: '/portal/student/inbox', label: 'Inbox', icon: Inbox },
        ...common,
      ]
  }
}
