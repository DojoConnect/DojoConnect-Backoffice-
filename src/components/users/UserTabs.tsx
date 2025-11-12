// components/UserTabs.tsx
'use client'

import { useState } from 'react'
import notFound from "./Illustration found.png"
import Image from 'next/image'

const tabs = [
  { name: 'All Users', count: 0 },
  { name: 'School Admins' },
  { name: 'Instructors' },
  { name: 'Parents' },
  { name: 'Students' },
]

export default function UserTabs() {
  const [activeTab, setActiveTab] = useState('All Users')

  return (
    <div className="p-4 px-0 mt-16">
      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`pb-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.name
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-[#70707A] hover:text-red-600'
            }`}
          >
            {tab.name}
            {'count' in tab && (
              <span className="text-white bg-red-600 text-xs rounded-full px-1.5 py-0.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex bg-white mt-4 flex-col items-center justify-center py-20 rounded-xl " style={{border:'1px solid #E4E7EC'}}>
        
        <img
          src="https://res.cloudinary.com/cloud-two-tech/image/upload/v1750963970/Illustration_found_gfbbgd.png" 
          alt="No data"
          className="w-[225px] h-[188px] mb-4"
        />
        <h2 className="text-2xl font-semibold text-[#303030]">Nothing here yet...</h2>
        <p className="text-base text-[#9E9E9E] mt-3">Whoops ... there’s no information available yet</p>
      </div>
    </div>
  )
}
