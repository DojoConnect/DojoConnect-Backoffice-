import React, { useState, useEffect } from 'react'
import { Search } from "lucide-react";

// API-driven notifications
const Header = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from backend API
  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        // Replace with logged-in user's email if available
        const userEmail = "admin@example.com";
        const res = await fetch(`https://apis.dojoconnect.app/notifications/${userEmail}?limit=10`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
      setLoading(false);
    }
    if (showModal) fetchNotifications();
  }, [showModal]);

  const hasNotifications = notifications.length > 0;

  return (
    <div className='bg-white h-[64px] w-full flex justify-between px-10 relative'>
      {/* LEFT SECTION —  search */}
      <div className='flex items-center'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4' />
          <input
            type='text'
            placeholder='Search here'
            className='pl-10 pr-3 py-2 rounded-md text-sm text-[#0F1828] placeholder:text-[#667185] font-montserrat outline-none'
          />
        </div>
      </div>
      <div className='my-auto flex gap-4'>
        <div
          className='w-[40px] h-[40px] bg-[#F0F2F5] rounded-full flex items-center justify-center cursor-pointer'
          onClick={() => setShowModal(true)}
          tabIndex={0}
          role="button"
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* ...svg path... */}
            <path fillRule="evenodd" clipRule="evenodd" d="M10.8336 2.50008C10.8336 2.03984 10.4606 1.66675 10.0003 1.66675C9.54008 1.66675 9.16698 2.03984 9.16698 2.50008V2.9758C6.34021 3.38002 4.16698 5.81028 4.16698 8.74917L4.16698 12.0828C4.16698 12.0828 4.16699 12.0827 4.16698 12.0828C4.1669 12.0844 4.16633 12.0956 4.16272 12.1175C4.15838 12.1437 4.15068 12.1794 4.13797 12.2253C4.11219 12.3184 4.07117 12.4343 4.01387 12.5713C3.89899 12.846 3.73702 13.1623 3.55789 13.4814C3.2211 14.0813 3.05134 14.7963 3.17879 15.4761C3.31319 16.1931 3.77468 16.8183 4.56286 17.1184C5.26695 17.3865 6.20417 17.6317 7.44186 17.7776C7.47131 17.8031 7.50614 17.8323 7.54614 17.8643C7.67138 17.9645 7.85031 18.0944 8.07645 18.2236C8.52525 18.4801 9.18883 18.7501 10.0003 18.7501C10.8118 18.7501 11.4754 18.4801 11.9242 18.2236C12.1503 18.0944 12.3292 17.9645 12.4545 17.8643C12.4945 17.8323 12.5293 17.8031 12.5588 17.7776C13.7965 17.6317 14.7337 17.3865 15.4378 17.1184C16.2259 16.8183 16.6874 16.1931 16.8218 15.4761C16.9493 14.7963 16.7795 14.0813 16.4427 13.4814C16.2636 13.1623 16.1016 12.846 15.9868 12.5713C15.9295 12.4343 15.8884 12.3184 15.8627 12.2253C15.8499 12.1794 15.8422 12.1437 15.8379 12.1175C15.8343 12.0956 15.8337 12.0846 15.8337 12.083C15.8337 12.0829 15.8337 12.083 15.8337 12.083L15.8336 12.076V8.74957C15.8336 5.81075 13.6605 3.38009 10.8336 2.97581V2.50008ZM5.83365 8.74917C5.83365 6.44818 7.69893 4.58341 10.0003 4.58341C12.3016 4.58341 14.167 6.44849 14.167 8.74957V12.0834C14.167 12.4692 14.3115 12.8853 14.4491 13.2143C14.5986 13.5718 14.7945 13.9501 14.9894 14.2972C15.1789 14.6348 15.2241 14.9537 15.1837 15.169C15.1503 15.3472 15.0612 15.4784 14.8447 15.5609C13.949 15.9019 12.4369 16.2501 10.0003 16.2501C7.56371 16.2501 6.05165 15.9019 5.15593 15.5609C4.93939 15.4784 4.85032 15.3472 4.81692 15.169C4.77656 14.9537 4.82174 14.6348 5.01122 14.2972C5.20609 13.9501 5.402 13.5718 5.5515 13.2143C5.6891 12.8853 5.83365 12.4692 5.83365 12.0834V8.74917Z" fill="#0F1828" />
          </svg>
        </div>
        {/* AO Avatar */}
        <div className='w-[40px] h-[40px] bg-[#FFE5E5] rounded-full flex items-center justify-center'>
          <h2 className='text-[#F53033] text-sm font-semibold'>A0</h2>
        </div>
      </div>
      {/* Notification Modal */}
      {showModal && (
        <div className="absolute right-6 top-[72px] w-[400px] bg-white shadow-[0px_4px_9px_rgba(90,82,74,0.06)] rounded-[8px] z-[100] flex flex-col p-0"
          style={{ marginRight: 24 }}>
          {/* Header */}
          <div className="w-full h-[52px] bg-white border-b border-[#F0F2F5] flex items-center justify-center relative">
            <p className="text-gray-900 text-lg font-bold m-0">Notifications</p>
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowModal(false)}
              style={{ background: 'none', border: 'none' }}
            >
              ×
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {loading ? (
              <div className="py-12 text-gray-500">Loading notifications...</div>
            ) : !hasNotifications ? (
              <>
                <img
                  src="/Illustration.png"
                  alt="Notification"
                  className="w-[320px] h-[320px] object-contain mb-6"
                />
                <p className="font-bold text-lg text-center mb-2">No Notifications yet</p>
                <p className="text-gray-400 text-center">All notifications will appear here</p>
              </>
            ) : (
              <>
                <div className={`w-full flex flex-col gap-4 px-6 py-8 ${!showAll ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                  {(showAll ? notifications : notifications.slice(0, 2)).map((n, idx) => (
                    <div
                      key={n.id || idx}
                      className={`flex flex-col justify-between rounded-md p-4 w-full min-h-[120px] ${n.bg || "bg-white"} border border-gray-200`}
                      style={{ marginBottom: '12px' }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-black text-base">{n.title || n.message || "Notification"}</span>
                         <span className="text-xs text-gray-400">{n.time || n.created_at || ""}</span>
                      </div>
                      <div className="text-xs text-gray-500">{n.description || n.message || ""}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="border border-red-600 rounded-md cursor-pointer bg-white text-red-600 font-semibold py-2 w-[80%] mx-auto mt-2"
                  style={{ display: 'block' }}
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll ? "Show Less" : "See All"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Header;