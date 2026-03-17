import { redirect } from 'next/navigation'
import { isAdmin, getAllUsers, getAllBandsAdmin } from '@/lib/admin-queries'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/')

  const [users, bands] = await Promise.all([getAllUsers(), getAllBandsAdmin()])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Admin Panel</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Kelola user dan band</p>
      </div>
      <AdminDashboard users={users} bands={bands} />
    </div>
  )
}
