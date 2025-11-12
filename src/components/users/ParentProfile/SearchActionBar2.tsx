import React, { useState } from "react";

export default function SearchActionsBar() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex items-center border border-gray-200 rounded-md px-3 py-2 bg-white">
            <span className="text-gray-400 mr-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search"
              className="outline-none bg-transparent text-sm"
            />
          </div>
          {/* Filter */}
          <div className="flex items-center border border-gray-200 rounded-md px-3 py-2 bg-white">
            <span className="text-gray-400 mr-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707l-6.414 6.414A1 1 0 0 0 14 14.414V19a1 1 0 0 1-1.447.894l-4-2A1 1 0 0 1 8 17V14.414a1 1 0 0 0-.293-.707L1.293 6.707A1 1 0 0 1 1 6V4z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Filter"
              className="outline-none bg-transparent text-sm"
            />
          </div>
        </div>
        {/* Right Buttons */}
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 bg-red-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-red-700 transition"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </button>
          <button className="flex items-center gap-2 bg-white border border-red-600 rounded-md px-4 py-2 font-medium text-red-600 shadow hover:bg-red-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h12"/>
            </svg>
            Export
          </button>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="bg-white rounded-md shadow-lg w-[400px] p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="flex items-center gap-2">
                  {/* Flag Icon */}
                  <span className="bg-white border border-gray-300 rounded-md p-2">
                    <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.0914 5.22222H19.0451C19.5173 5.22222 19.7534 5.22222 19.8914 5.32149C20.0119 5.4081 20.0903 5.54141 20.1075 5.68877C20.1272 5.85767 20.0126 6.06403 19.7833 6.47677L18.3624 9.03435C18.2793 9.18403 18.2377 9.25887 18.2214 9.33812C18.207 9.40827 18.207 9.48062 18.2214 9.55077C18.2377 9.63002 18.2793 9.70486 18.3624 9.85454L19.7833 12.4121C20.0126 12.8248 20.1272 13.0312 20.1075 13.2001C20.0903 13.3475 20.0119 13.4808 19.8914 13.5674C19.7534 13.6667 19.5173 13.6667 19.0451 13.6667H11.6136C11.0224 13.6667 10.7269 13.6667 10.5011 13.5516C10.3024 13.4504 10.141 13.2889 10.0398 13.0903C9.92472 12.8645 9.92472 12.5689 9.92472 11.9778V9.44444M6.23027 20L2.00805 3.11111M3.59143 9.44444H11.4025C11.9937 9.44444 12.2892 9.44444 12.515 9.3294C12.7137 9.2282 12.8751 9.06672 12.9763 8.8681C13.0914 8.64231 13.0914 8.34672 13.0914 7.75556V2.68889C13.0914 2.09772 13.0914 1.80214 12.9763 1.57634C12.8751 1.37773 12.7137 1.21625 12.515 1.11505C12.2892 1 11.9937 1 11.4025 1H3.64335C2.90602 1 2.53735 1 2.2852 1.15278C2.0642 1.28668 1.89999 1.49699 1.82369 1.74387C1.73663 2.02555 1.82605 2.38321 2.00489 3.09852L3.59143 9.44444Z" stroke="#414651" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="font-bold text-black text-lg">Create New Child's Profile</span>
                </span>
                <button
                  className="text-gray-400 text-2xl"
                  onClick={() => setShowModal(false)}
                >×</button>
              </div>
              {/* Subtext */}
              <div className="text-gray-500 text-sm mb-4">Fill the form to add a new child</div>
              {/* Form */}
              <form className="flex flex-col gap-3">
                <Input label="First Name" name="firstName" placeholder="Enter the user's first name" />
                <Input label="Last Name" name="lastName" placeholder="Enter the user's last name" />
                <Input label="Email Address" name="email" placeholder="Enter the user's email address" />
                {/* Date of Birth */}
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Date of Birth</label>
                  <div className="flex gap-2">
                    <DropdownBox label="Day" value="30" options={["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"]} />
                    <DropdownBox label="Month" value="May" options={["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]} />
                    <DropdownBox label="Year" value="2000" options={["2000","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010"]} />
                  </div>
                </div>
                {/* Experience */}
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Experience (optional)</label>
                  <select className="border border-gray-300 rounded-md bg-white px-3 py-2 text-sm text-gray-700 w-full">
                    <option value="">Select experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                {/* Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    className="border border-gray-300 rounded-md bg-white text-black py-2 px-4 font-semibold flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-red-600 rounded-md bg-red-600 text-white py-2 px-4 font-semibold flex-1"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Input component
function Input({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        name={name}
        className="border border-gray-300 rounded-md bg-white px-3 py-2 text-sm placeholder:text-gray-400"
        placeholder={placeholder}
      />
    </div>
  );
}

// DropdownBox component for Day/Month/Year
function DropdownBox({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (
    <div className="flex flex-col items-center border border-gray-300 rounded-md px-3 py-2 bg-white min-w-[80px]">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-700 font-semibold">{value}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}