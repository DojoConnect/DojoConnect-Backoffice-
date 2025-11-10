'use client'
import { useSearchParams } from 'next/navigation'
import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import DashboardLayout from './DashboardLayout'
import UserLayout from '../users/UserLayout'
import SubscriberLayout from '../subscribers/SubscriberLayout'
import FeedbackLayout from '../feedback/FeedbackLayout';
import RevenueLayout from '../revenue/RevenueLayout';

import ClassLayout from '../classes/ClassLayout'
import { Menu } from 'lucide-react'

interface MainLayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`
          fixed z-40 md:static top-0 left-0 h-full w-full md:w-[272px] bg-white shadow-md transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <Sidebar setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white shadow md:px-6">
          {/* Menu Icon (only on mobile) */}
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6 text-[#0F1828]" />
          </button>
          <Header />
        </div>

        {/* Section */}
       <section className="bg-[#FBFBFB] p-4 md:p-10 flex-1 overflow-auto">
  {children ? (
    children
  ) : (
    <>
      {tab === 'dashboard' && <DashboardLayout />}
      {tab === 'users' && <UserLayout />}
      {tab === 'classes' && <ClassLayout />}
      {tab === 'feedback' && <FeedbackLayout />}
      {tab === 'revenue' && <RevenueLayout />}
    </>
  )}
</section>
      </main>
    </div>
  )
}
