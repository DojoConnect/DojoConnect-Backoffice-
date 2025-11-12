'use client'
import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { usePathname } from 'next/navigation';
import Sidebar from '../Dashboard/Sidebar';
import RevenueSummary from './RevenueSummary';
import PaymentHistory from './PaymentHistory';
import Header from '../Dashboard/Header';

const FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'All time', value: 'all' },
  { label: 'Custom date', value: 'custom' },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = Array.from({ length: 20 }, (_, i) => 2016 + i);

export default function RevenueLayout() {
  const pathname = usePathname();
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeFilter, setActiveFilter] = useState('today');
  const [customRange, setCustomRange] = useState<{ start?: string, end?: string }>({});
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [monthPage, setMonthPage] = useState(0);
  const [yearPage, setYearPage] = useState(0);
  const [tempMonth, setTempMonth] = useState(calendarMonth);
  const [tempYear, setTempYear] = useState(calendarYear);
  const [highlightRange, setHighlightRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });

  // Calendar logic
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => ({
    day: new Date(calendarYear, calendarMonth, -firstDayOfWeek + i + 1).getDate(),
    isPrev: true
  }));
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isPrev: false
  }));
  const calendarDays = [...prevMonthDays, ...monthDays];

  // State for showing the Month/Year picker modal
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);

  return (
    <div className="flex flex-col gap-10 h-screen bg-[#FBFBFB]">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl text-[#0F1828] font-semibold">Revenue</h1>
        <div className="flex flex-wrap gap-2 sm:justify-end relative">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`px-4 py-1 border rounded-full whitespace-nowrap flex items-center gap-1 cursor-pointer
                ${activeFilter === f.value
                  ? 'bg-red-100 text-red-600 border-red-300'
                  : 'bg-white text-gray-600 border-gray-300'
                }`}
              onClick={() => {
                setActiveFilter(f.value);
                if (f.value === 'custom') setShowCalendar(true);
                else setShowCalendar(false);
              }}
            >
              {f.label}
              {f.value === 'custom' && <FaChevronDown className="ml-1" />}
            </button>
          ))}
        </div>
      </div>
      {/* Calendar Modal */}
      {showCalendar && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.03)' }}
            onClick={() => setShowCalendar(false)}
          />
          <div
            className="absolute z-50 mt-2 right-8 bg-white rounded-xl p-6 shadow-2xl border border-gray-300 w-[340px] h-[350px] flex flex-col"
            style={{ minWidth: 280, paddingRight: 16 }}
          >
            {/* Month/Year Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-semibold text-lg cursor-pointer"
                  onClick={() => {
                    setMonthPage(Math.floor(calendarMonth / 4));
                    setYearPage(Math.floor((calendarYear - YEARS[0]) / 5));
                    setTempMonth(calendarMonth);
                    setTempYear(calendarYear);
                    setShowCalendar(false);
                    setTimeout(() => setShowMonthYearModal(true), 10);
                  }}
                >
                  {MONTHS[calendarMonth]} {calendarYear}
                </span>
                <button
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setMonthPage(Math.floor(calendarMonth / 4));
                    setYearPage(Math.floor((calendarYear - YEARS[0]) / 5));
                    setTempMonth(calendarMonth);
                    setTempYear(calendarYear);
                    setShowCalendar(false);
                    setTimeout(() => setShowMonthYearModal(true), 10);
                  }}
                >
                  <FaChevronDown className="text-[#E51B1B] text-xl" />
                </button>
              </div>
              <div className="flex gap-4 ml-2">
                <button
                  className="cursor-pointer"
                  onClick={() => setCalendarMonth(m => m === 0 ? 11 : m - 1)}
                >
                  <FaChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setCalendarMonth(m => m === 11 ? 0 : m + 1)}
                >
                  <FaChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            {/* Days of week */}
            <div className="grid grid-cols-7 text-xs text-gray-400 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 mb-2 flex-1">
              {calendarDays.map(({ day, isPrev }, idx) => {
                let highlightClass = "";
                if (
                  !isPrev &&
                  highlightRange.start !== null &&
                  highlightRange.end !== null &&
                  day >= Math.min(highlightRange.start, highlightRange.end) &&
                  day <= Math.max(highlightRange.start, highlightRange.end)
                ) {
                  if (day === highlightRange.start || day === highlightRange.end) {
                    highlightClass = "bg-red-100 border border-red-500 text-black";
                  } else {
                    highlightClass = "bg-red-100 text-black";
                  }
                } else if (isPrev) {
                  highlightClass = "bg-gray-100 text-gray-300";
                } else {
                  highlightClass = "bg-white text-gray-700";
                }
                return (
                  <button
                    key={idx}
                    className={`py-2 rounded text-sm w-8 h-8 ${highlightClass} hover:border hover:border-red-500 cursor-pointer`}
                    disabled={isPrev}
                    onClick={() => {
                      if (!isPrev) {
                        if (highlightRange.start === null || (highlightRange.start !== null && highlightRange.end !== null)) {
                          setHighlightRange({ start: day, end: null });
                        } else {
                          setHighlightRange({ start: highlightRange.start, end: day });
                          // Set custom range and close calendar
                          const start = new Date(calendarYear, calendarMonth, highlightRange.start!);
                          const end = new Date(calendarYear, calendarMonth, day);
                          setCustomRange({
                            start: start.toISOString().slice(0, 10),
                            end: end.toISOString().slice(0, 10)
                          });
                          setActiveFilter("custom");
                          setShowCalendar(false);
                        }
                      }
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {/* Month/Year Picker Modal */}
      {showMonthYearModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.03)' }}
            onClick={() => {
              setShowMonthYearModal(false);
              setShowCalendar(true);
            }}
          />
          <div className="absolute z-50 mt-2 right-8 bg-white rounded-xl p-6 shadow-2xl border border-gray-300 w-[400px] flex flex-col" style={{ minWidth: 340 }}>
            {/* Month/Year Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-semibold text-lg">{MONTHS[tempMonth]} {tempYear}</span>
                <FaChevronUp className="text-[#E51B1B] text-xl ml-2" />
              </div>
            </div>
            {/* Month Section */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold">Month</span>
              <div className="flex gap-4">
                <button
                  className="cursor-pointer"
                  onClick={() => setMonthPage(p => Math.max(0, p - 1))}
                  disabled={monthPage === 0}
                >
                  <FaChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setMonthPage(p => p < 2 ? p + 1 : p)}
                  disabled={monthPage >= 2}
                >
                  <FaChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {MONTHS.slice(monthPage * 4, monthPage * 4 + 4).map((m, idx) => {
                const isActive = tempMonth === monthPage * 4 + idx;
                return (
                  <button
                    key={m}
                    className={`py-2 px-2 rounded-md border text-xs font-semibold cursor-pointer
                      ${isActive ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                    onClick={() => setTempMonth(monthPage * 4 + idx)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            {/* Year Section */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold">Year</span>
              <div className="flex gap-4">
                <button
                  className="cursor-pointer"
                  onClick={() => setYearPage(p => Math.max(0, p - 1))}
                  disabled={yearPage === 0}
                >
                  <FaChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setYearPage(p => (yearPage + 1) * 5 < YEARS.length ? p + 1 : p)}
                  disabled={(yearPage + 1) * 5 >= YEARS.length}
                >
                  <FaChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {YEARS.slice(yearPage * 5, yearPage * 5 + 5).map((y) => (
                <button
                  key={y}
                  className={`py-2 px-2 rounded-md border text-xs font-semibold cursor-pointer
                    ${tempYear === y ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                  onClick={() => setTempYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-4 py-1 rounded-md bg-white text-gray-600 border-none cursor-pointer"
                onClick={() => {
                  setShowMonthYearModal(false);
                  setShowCalendar(true);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded-md bg-[#F53033] text-white border-[#F53033] cursor-pointer"
                onClick={() => {
                  setCalendarMonth(tempMonth);
                  setCalendarYear(tempYear);
                  setShowMonthYearModal(false);
                  setShowCalendar(true);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pass the filter to summary/history */}
      <RevenueSummary filter={activeFilter} customRange={customRange} />
      <PaymentHistory filter={activeFilter} customRange={customRange} />
    </div>
  );
}