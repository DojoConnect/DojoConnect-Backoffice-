// components/FilterMenu.tsx
'use client'

import { useState } from 'react'


export default function FilterMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block text-left" >
      <button
      style={{border:"1px solid #ECE4E4"}}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-center items-center gap-2 rounded h-10  px-4 py-2 bg-white text-sm text-gray-700 hover:bg-gray-50"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.3333 2.5H1.66667L8.33334 10.3833V15.8333L11.6667 17.5V10.3833L18.3333 2.5Z" stroke="#70707A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

        Filter
        
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white border shadow-lg z-10">
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <select className="mt-1 block w-full border border-gray-300 rounded p-2">
                <option>All</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructor</label>
              <input
                type="text"
                placeholder="e.g. Lisa Simpson"
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <button className="w-full mt-2 bg-red-500 text-white py-2 px-4 rounded text-sm">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
