import React from 'react'
import SubscribersSummary from './SubscribersSummary'
import SubscribersTabs from './SubscribersTab'

const SubscribersPage = () => {
  return (
    <div className="px-0 md:px-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
  <h1 className="text-2xl font-semibold text-[#0F1828]">Subscribers</h1>

  <div className="flex flex-wrap gap-2 sm:justify-end">
    {['All Users', 'School Admins', 'Parents', 'All time'].map((label) => (
      <button
        key={label}
        className={`px-4 py-1 border rounded-full whitespace-nowrap ${
          label === 'All Users'
            ? 'bg-red-100 text-red-600 border-red-300'
            : 'bg-white text-gray-600 border-gray-300'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>
<SubscribersSummary />
<SubscribersTabs />
    </div>
  )
}

export default SubscribersPage