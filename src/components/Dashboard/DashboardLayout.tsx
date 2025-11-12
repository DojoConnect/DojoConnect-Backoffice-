'use client'
import Sidebar from './Sidebar'
import DashboardSummary from './DashboardSummary'
import Header from './Header'

export default function DashboardLayout() {
  return (
    <div className="flex flex-col gap-10 h-screen bg-[#FBFBFB]">
      {/* Add <Sidebar /> and <Header />*/}
      <DashboardSummary />
    </div>
  );
}