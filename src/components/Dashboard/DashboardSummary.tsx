'use client';
import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp } from "react-icons/fi";
import { ArrowUpIcon, ArrowRightIcon, ReadMoreIcon, IconA, IconB, IconC, IconD, IconE, IconF, IconG, IconH, IconI } from './dashboardData.js';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = Array.from({ length: 20 }, (_, i) => 2016 + i);

const METRIC_LABELS = [
  'Total Dojos',
  'Active Subscriptions',
  'Unpaid Subscriptions',
  'Total Classes',
  'Monthly Revenue',
  'Avg. Revenue Per Dojo',
  'Gross Transaction Vol.',
  'Completed Onboarding',
  'Incomplete Onboarding',
  'Dojo Engagement Index'
];

function chunkArray<T>(arr: T[], chunkSizes: number[]) {
  let result = [];
  let i = 0;
  for (let size of chunkSizes) {
    result.push(arr.slice(i, i + size));
    i += size;
  }
  return result;
}

function getIcon(label: string) {
  switch (label) {
    case 'Total Dojos': return <IconA />;
    case 'Active Subscriptions': return <IconB />;
    case 'Unpaid Subscriptions': return <IconC />;
    case 'Total Classes': return <IconD />;
    case 'Monthly Revenue': return <IconD />;
    case 'Avg. Revenue Per Dojo': return <IconE />;
    case 'Gross Transaction Vol.': return <IconF />;
    case 'Completed Onboarding': return <IconG />;
    case 'Incomplete Onboarding': return <IconH />;
    case 'Dojo Engagement Index': return <IconI />;
    default: return <IconA />;
  }
}

// Transform API data into stats array for cards
function buildStatsFromApiData(apiData: any) {
  if (!apiData) return METRIC_LABELS.map(label => ({
    label,
    value: 0,
    icon: getIcon(label)
  }));

  return [
    { label: "Total Dojos", value: apiData.total_dojos ?? 0, icon: getIcon("Total Dojos") },
    { label: "Active Subscriptions", value: apiData.active_subscriptions ?? 0, icon: getIcon("Active Subscriptions") },
    { label: "Unpaid Subscriptions", value: apiData.unpaid_subscriptions ?? 0, icon: getIcon("Unpaid Subscriptions") },
    { label: "Total Classes", value: apiData.classes?.total_classes ?? 0, icon: getIcon("Total Classes") },
    { label: "Monthly Revenue", value: apiData.revenue?.total_revenue ?? 0, icon: getIcon("Monthly Revenue") },
    { label: "Avg. Revenue Per Dojo", value: (apiData.revenue?.total_revenue && apiData.total_dojos)
      ? (parseFloat(apiData.revenue.total_revenue) / apiData.total_dojos).toFixed(2)
      : 0, icon: getIcon("Avg. Revenue Per Dojo") },
    { label: "Gross Transaction Vol.", value: apiData.revenue?.total_revenue ?? 0, icon: getIcon("Gross Transaction Vol.") },
    { label: "Completed Onboarding", value: apiData.completed_onboarding ?? 0, icon: getIcon("Completed Onboarding") },
    { label: "Incomplete Onboarding", value: apiData.incomplete_onboarding ?? 0, icon: getIcon("Incomplete Onboarding") },
    { label: "Dojo Engagement Index", value: apiData.engagement_index ?? 0, icon: getIcon("Dojo Engagement Index") }
  ];
}

export default function DashboardSummary() {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'Today' | 'This week' | 'This month' | 'All time' | 'Custom date'>('Today');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [highlightRange, setHighlightRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [monthPage, setMonthPage] = useState(0);
  const [yearPage, setYearPage] = useState(0);
  const [tempMonth, setTempMonth] = useState(calendarMonth);
  const [tempYear, setTempYear] = useState(calendarYear);

  // API-driven dashboard data
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard metrics from API
  useEffect(() => {
    let endpoint = "";
    let payload: any = {};

    if (activeFilter === "Today") {
      endpoint = "/metrics/overview";
      payload.period = "today";
    } else if (activeFilter === "This week") {
      endpoint = "/metrics/overview";
      payload.period = "this_week";
    } else if (activeFilter === "This month") {
      endpoint = "/metrics/overview";
      payload.period = "this_month";
    } else if (activeFilter === "All time") {
      endpoint = "/metrics/overview";
      payload.period = "all";
    } else if (activeFilter === "Custom date" && selectedDate) {
      endpoint = "/metrics/overview";
      payload.period = "custom";
      payload.start_date = selectedDate.toISOString().split("T")[0];
      payload.end_date = selectedDate.toISOString().split("T")[0];
    } else {
      setApiData(null);
      return;
    }

    setLoading(true);
    fetch(`https://apis.dojoconnect.app${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setApiData(data.data);
        } else {
          setApiData(null);
        }
      })
      .catch(() => setApiData(null))
      .finally(() => setLoading(false));
  }, [activeFilter, selectedDate]);

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

  // Build stats for cards from API data
  const stats = buildStatsFromApiData(apiData);
  const cardRows = chunkArray(stats, [4, 3, 3]);

  // User stats
  const userStats = apiData?.users
    ? [
        { label: "Dojo Admins", value: Number(apiData.users.admins ?? 0), color: "#F53033" },     
        { label: "Instructors", value: Number(apiData.users.instructors ?? 0), color: "#FFE5E5" }, 
        { label: "Parents", value: Number(apiData.users.parents ?? 0), color: "#A3A3A3" },         
        { label: "Students", value: Number(apiData.users.students ?? 0), color: "#E5E7EB" }  
      ]
    : [
        { label: "Dojo Admins", value: 0, color: "#F53033" },
        { label: "Instructors", value: 0, color: "#FFE5E5" },
        { label: "Parents", value: 0, color: "#A3A3A3" },
        { label: "Students", value: 0, color: "#E5E7EB" }
      ];
  // Dummy dojos for Top Dojo Revenue 
  const dojos = Array.isArray(apiData?.dojos)
    ? apiData.dojos.map(d => ({
        ...d,
        revenue: d.revenue ?? 0,
        percentage: d.percentage ?? "0%"
      }))
    : [{ name: "Dojo A" }, { name: "Dojo B" }, { name: "Dojo C" }];

  const filterOptions = [
    'Today', 'This week', 'This month', 'All time', 'Custom date'
  ] as const;

  // Month/Year modal logic
  const monthsPerPage = 4;
  const yearsPerPage = 5;
  const monthStart = monthPage * monthsPerPage;
  const monthEnd = monthStart + monthsPerPage;
  const yearStart = yearPage * yearsPerPage;
  const yearEnd = yearStart + yearsPerPage;

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <h1 className="text-2xl text-[#0F1828] font-semibold">Dashboard</h1>
        <div className="flex flex-wrap gap-2 sm:justify-end relative">
          {filterOptions.map((label) => (
            <button
              key={label}
              className={`px-4 py-1 border rounded-full whitespace-nowrap flex items-center gap-1 cursor-pointer
                ${activeFilter === label
                  ? 'bg-red-100 text-red-600 border-red-300'
                  : 'bg-white text-gray-600 border-gray-300'
                }`}
              onClick={() => {
                setActiveFilter(label);
                if (label === 'Custom date') setShowCalendar(true);
                else setShowCalendar(false);
              }}
            >
              {label}
              {label === 'Custom date' && (
                <FiChevronDown className="text-gray-500 text-lg" />
              )}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-semibold text-lg cursor-pointer"
                  onClick={() => {
                    setShowMonthYearModal(true);
                    setShowCalendar(false);
                  }}
                >
                  {MONTHS[calendarMonth]} {calendarYear}
                </span>
                <button
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setShowMonthYearModal(true);
                    setShowCalendar(false);
                  }}
                >
                  <FiChevronDown className="text-[#E51B1B] text-xl" />
                </button>
              </div>
              <div className="flex gap-4 ml-2">
                <button
                  className="cursor-pointer"
                  onClick={() => setCalendarMonth(m => m === 0 ? 11 : m - 1)}
                >
                  <FiChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setCalendarMonth(m => m === 11 ? 0 : m + 1)}
                >
                  <FiChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-xs text-gray-400 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
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
                        }
                        setSelectedDate(new Date(calendarYear, calendarMonth, day));
                        setActiveFilter('Custom date');
                        setShowCalendar(false);
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-semibold text-lg">{MONTHS[tempMonth]} {tempYear}</span>
                <FiChevronUp className="text-[#E51B1B] text-xl ml-2" />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold">Month</span>
              <div className="flex gap-4">
                <button
                  className="cursor-pointer"
                  onClick={() => setMonthPage(p => Math.max(0, p - 1))}
                  disabled={monthPage === 0}
                >
                  <FiChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setMonthPage(p => p < 2 ? p + 1 : p)}
                  disabled={monthPage >= 2}
                >
                  <FiChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {MONTHS.slice(monthStart, monthEnd).map((m, idx) => {
                const isActive = tempMonth === monthStart + idx;
                return (
                  <button
                    key={m}
                    className={`py-2 px-2 rounded-md border text-xs font-semibold cursor-pointer
                      ${isActive ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                    onClick={() => setTempMonth(monthStart + idx)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 font-semibold">Year</span>
              <div className="flex gap-4">
                <button
                  className="cursor-pointer"
                  onClick={() => setYearPage(p => Math.max(0, p - 1))}
                  disabled={yearPage === 0}
                >
                  <FiChevronLeft className="text-[#E51B1B] text-xl" />
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => setYearPage(p => yearEnd < YEARS.length ? p + 1 : p)}
                  disabled={yearEnd >= YEARS.length}
                >
                  <FiChevronRight className="text-[#E51B1B] text-xl" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {YEARS.slice(yearStart, yearEnd).map((y) => (
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

      {/* Metrics Section */}
      <div className="bg-[#FFFFFF] p-4 gap-4 rounded-xl" style={{ border: '1px solid #ECE4E4' }}>
        <h1 className="text-base font-semibold mb-4 text-[#475367]">Metrics</h1>
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading metrics...</div>
        ) : (
          <>
            {/* First row: 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {cardRows[0].map((card, idx) => (
                <div
                  key={card.label}
                  className="bg-gray-50 flex flex-col rounded-lg p-4 h-[130px] shadow-sm relative"
                >
                  <div className="flex items-center mb-2">
                    <span style={{ border: "1px solid #FCC2C3" }} className="h-8 w-8 rounded-full bg-[#FFE5E5] flex items-center justify-center">
                      {card.icon}
                    </span>
                  </div>
                  <div className="text-lg text-[#0F1828] font-semibold mb-1">{card.value ?? 0}</div>
                  <div className="flex items-center w-full">
                    <span className="text-xs text-gray-600 truncate">{card.label}</span>
                    <span className="flex-1" />
                  </div>
                  {card.viewMore ? (
                    <button
                      className="absolute top-4 right-4 flex items-center gap-1 text-gray-500 font-semibold cursor-pointer bg-transparent border-none"
                      style={{ textDecoration: 'none', fontSize: '0.75rem' }}
                      onClick={() => alert(`View more for ${card.label}`)}
                    >
                      View More <ArrowRightIcon />
                    </button>
                  ) : (
                    <>
                      <button
                        className="absolute top-4 right-4 cursor-pointer"
                        onClick={() => setOpenModal(card.label)}
                        aria-label="Open details"
                      >
                        <ReadMoreIcon />
                      </button>
                      {openModal === card.label && (
                        <div
                          className="absolute z-50 mt-2 right-0 bg-white border border-gray-300 rounded-md p-4 w-80 shadow-lg"
                          style={{ top: '48px' }}
                        >
                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
                            onClick={() => setOpenModal(null)}
                          >×</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Cards 5, 6, 7 as full width on their own rows */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
              {cardRows[1].map((card, idx) => (
                <div
                  key={card.label}
                  className="bg-gray-50 flex flex-col rounded-lg p-4 h-[130px] shadow-sm relative w-full"
                >
                  <div className="flex items-center mb-2">
                    <span style={{ border: "1px solid #FCC2C3" }} className="h-8 w-8 rounded-full bg-[#FFE5E5] flex items-center justify-center">
                      {card.icon}
                    </span>
                  </div>
                  <div className="text-lg text-[#0F1828] font-semibold mb-1">{card.value ?? 0}</div>
                  <div className="flex items-center w-full">
                    <span className="text-xs text-gray-600 truncate">{card.label}</span>
                    <span className="flex-1" />
                  </div>
                  {card.viewMore ? (
                    <button
                      className="absolute top-4 right-4 flex items-center gap-1 text-gray-500 font-semibold cursor-pointer bg-transparent border-none"
                      style={{ textDecoration: 'none', fontSize: '0.75rem' }}
                      onClick={() => alert(`View more for ${card.label}`)}
                    >
                      View More <ArrowRightIcon />
                    </button>
                  ) : (
                    <>
                      <button
                        className="absolute top-4 right-4 cursor-pointer"
                        onClick={() => setOpenModal(card.label)}
                        aria-label="Open details"
                      >
                        <ReadMoreIcon />
                      </button>
                      {openModal === card.label && (
                        <div
                          className="absolute z-50 mt-2 right-0 bg-white border border-gray-300 rounded-md p-4 w-80 shadow-lg"
                          style={{ top: '48px' }}
                        >
                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
                            onClick={() => setOpenModal(null)}
                          >×</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Third row: 3 cards, full width */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
              {cardRows[2].map(({ label, value, status, change, icon, chartImg, viewMore }) => (
                <div key={label} className="bg-gray-50 flex flex-col rounded-lg p-4 h-[130px] shadow-sm relative w-full">
                  <div className="flex items-center mb-2">
                    <span style={{ border: "1px solid #FCC2C3" }} className="h-8 w-8 rounded-full bg-[#FFE5E5] flex items-center justify-center">
                      {icon}
                    </span>
                  </div>
                  <div className="text-lg text-[#0F1828] font-semibold mb-2">{value ?? 0}</div>
                  <div className="flex items-center justify-between mt-auto w-full">
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  {viewMore ? (
                    <button
                      className="absolute top-4 right-4 flex items-center gap-1 text-gray-500 font-semibold cursor-pointer bg-transparent border-none"
                      style={{ textDecoration: 'none', fontSize: '0.75rem' }}
                      onClick={() => alert(`View more for ${label}`)}
                    >
                      View More <ArrowRightIcon />
                    </button>
                  ) : (
                    <>
                      <button
                        className="absolute top-4 right-4 cursor-pointer"
                        onClick={() => setOpenModal(label)}
                        aria-label="Open details"
                      >
                        <ReadMoreIcon />
                      </button>
                      {openModal === label && (
                        <div
                          className="absolute z-50 mt-2 right-0 bg-white border border-gray-300 rounded-md p-4 w-80 shadow-lg"
                          style={{ top: '48px' }}
                        >
                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
                            onClick={() => setOpenModal(null)}
                          >×</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Two-column container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Total Users */}
              <div className="flex flex-col justify-between bg-gray-50 rounded-lg p-6 h-full">
                <div>
                  <h2 className="text-base font-semibold text-[#475367] mb-1">Total Users</h2>
                  <div className="text-2xl font-bold text-[#0F1828] mb-8">
                    {apiData?.users?.total_users
                      ? Number(apiData.users.total_users).toLocaleString()
                      : "0"}
                  </div>
                  <div className="space-y-4">
                    {userStats.map((user) => (
                      <div key={user.label} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-3"
                            style={{ background: user.color ?? "#EEE" }}
                          ></span>
                          <span className="text-sm text-[#475367]">{user.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#0F1828]">
                          {typeof user.value === "number" ? user.value.toLocaleString() : "0"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="mt-6 text-[#E51B1B] font-semibold hover:underline focus:outline-none cursor-pointer">
                  View Details
                </button>
              </div>
              {/* Right: Top Dojo Revenue */}
              <div className="flex flex-col justify-between bg-gray-50 rounded-lg p-6 h-full">
                <div>
                  <h2 className="text-base font-semibold text-[#475367] mb-4">Top Dojo Revenue</h2>
                  <div className="space-y-4">
                    {(dojos.length > 0 ? dojos : [{ name: "Dojo A" }, { name: "Dojo B" }, { name: "Dojo C" }]).slice(0, 12).map((dojo: any) => (
                      <div key={dojo.name} className="flex items-center justify-between">
                        <span className="text-sm text-[#0F1828] font-medium">{dojo.name}</span>
                        <span className="text-sm text-[#0F1828] font-semibold">£{typeof dojo.revenue === "number" ? dojo.revenue.toLocaleString() : "0"}</span>
                        <span className="text-xs text-gray-400 font-semibold">{dojo.percentage ?? "0%"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="mt-6 text-[#E51B1B] font-semibold hover:underline focus:outline-none cursor-pointer">
                  View Details
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}