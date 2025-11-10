import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { ArrowRight } from "lucide-react";

interface UserSummaryProps {
  adminCount: number;
  instructorCount: number;
  parentCount: number;
  studentCount: number;
  // Add backend numbers as props if needed, or fetch them in useEffect
}

const cardData = [
  {
    label: "No. of School Admins",
    valueKey: "adminCount",
    icon: (
      // SVG 1
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110547)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M21.9669 15.2998L21.0241 16.2426L19.3342 14.552L19.3337 23.3333H18.0004L18.0009 14.552L16.31 16.2426L15.3672 15.2998L18.667 12L21.9669 15.2998ZM28.6335 20.7002L25.3337 24L22.0339 20.7002L22.9767 19.7573L24.6675 21.448L24.667 12.6667H26.0003L26.0009 21.448L27.6907 19.7573L28.6335 20.7002Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110547" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110547"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110547"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110547"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110547" result="effect2_dropShadow_10818_110547"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110547" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: false,
    infoIcon: false,
  },
  {
    label: "No. of Instructors",
    valueKey: "instructorCount",
    icon: (
      // SVG 2
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110564)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M21.9669 15.2998L21.0241 16.2426L19.3342 14.552L19.3337 23.3333H18.0004L18.0009 14.552L16.31 16.2426L15.3672 15.2998L18.667 12L21.9669 15.2998ZM28.6335 20.7002L25.3337 24L22.0339 20.7002L22.9767 19.7573L24.6675 21.448L24.667 12.6667H26.0003L26.0009 21.448L27.6907 19.7573L28.6335 20.7002Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110564" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110564"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110564"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110564"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110564" result="effect2_dropShadow_10818_110564"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110564" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: false,
    infoIcon: false,
  },
  {
    label: "No. of Parents",
    valueKey: "parentCount",
    icon: (
      // SVG 3
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110564)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M21.9669 15.2998L21.0241 16.2426L19.3342 14.552L19.3337 23.3333H18.0004L18.0009 14.552L16.31 16.2426L15.3672 15.2998L18.667 12L21.9669 15.2998ZM28.6335 20.7002L25.3337 24L22.0339 20.7002L22.9767 19.7573L24.6675 21.448L24.667 12.6667H26.0003L26.0009 21.448L27.6907 19.7573L28.6335 20.7002Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110564" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110564"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110564"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110564"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110564" result="effect2_dropShadow_10818_110564"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110564" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: false,
    infoIcon: false,
  },
  {
    label: "No. of Students",
    valueKey: "studentCount",
    icon: (
      // SVG 4
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110564)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M21.9669 15.2998L21.0241 16.2426L19.3342 14.552L19.3337 23.3333H18.0004L18.0009 14.552L16.31 16.2426L15.3672 15.2998L18.667 12L21.9669 15.2998ZM28.6335 20.7002L25.3337 24L22.0339 20.7002L22.9767 19.7573L24.6675 21.448L24.667 12.6667H26.0003L26.0009 21.448L27.6907 19.7573L28.6335 20.7002Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110564" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110564"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110564"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110564"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110564" result="effect2_dropShadow_10818_110564"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110564" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: false,
    infoIcon: false,
  },
  // Next row
  {
    label: "Pending Profiles",
    valueKey: "card5",
    icon: (
      // SVG 5
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110564)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M21.9669 15.2998L21.0241 16.2426L19.3342 14.552L19.3337 23.3333H18.0004L18.0009 14.552L16.31 16.2426L15.3672 15.2998L18.667 12L21.9669 15.2998ZM28.6335 20.7002L25.3337 24L22.0339 20.7002L22.9767 19.7573L24.6675 21.448L24.667 12.6667H26.0003L26.0009 21.448L27.6907 19.7573L28.6335 20.7002Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110564" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110564"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110564"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110564"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110564" result="effect2_dropShadow_10818_110564"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110564" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: false,
    infoIcon: false,
  },
  {
    label: "Recent Profiles",
    valueKey: "card6",
    icon: (
      // SVG 6
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110581)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M17.3333 12V22.6667H28V24H16V12H17.3333ZM27.5286 14.1953L28.4714 15.1381L24.6667 18.9428L22.6667 16.9433L19.8047 19.8047L18.8619 18.8619L22.6667 15.0572L24.6667 17.0567L27.5286 14.1953Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110581" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110581"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110581"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110581"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110581" result="effect2_dropShadow_10818_110581"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110581" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: false,
    infoIcon: false,
  },
  {
    label: "User Activity Trends",
    valueKey: "card7",
    icon: (
      // SVG 7
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_10818_110564)">
          <rect x="6" y="2" width="32" height="32" rx="16" fill="#FFE5E5"/>
          <rect x="6.5" y="2.5" width="31" height="31" rx="15.5" stroke="#FCC2C3"/>
        </g>
        <path d="M21.9669 15.2998L21.0241 16.2426L19.3342 14.552L19.3337 23.3333H18.0004L18.0009 14.552L16.31 16.2426L15.3672 15.2998L18.667 12L21.9669 15.2998ZM28.6335 20.7002L25.3337 24L22.0339 20.7002L22.9767 19.7573L24.6675 21.448L24.667 12.6667H26.0003L26.0009 21.448L27.6907 19.7573L28.6335 20.7002Z" fill="#E51B1B"/>
        <defs>
          <filter id="filter0_dd_10818_110564" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_10818_110564"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10818_110564"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_dropShadow_10818_110564"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
            <feBlend mode="normal" in2="effect1_dropShadow_10818_110564" result="effect2_dropShadow_10818_110564"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10818_110564" result="shape"/>
          </filter>
        </defs>
      </svg>
    ),
    percent: "0.004%",
    chart: true,
    infoIcon: true,
  },
];

export default function UserSummary({
  adminCount,
  instructorCount,
  parentCount,
  studentCount,
}: UserSummaryProps) {
  // You can fetch backend values for card5, card6, card7 here if needed
  const backendValues = {
    card5: 0,
    card6: 0,
    card7: 0,
  };

  // Merge values for all cards
  const values: Record<string, number> = {
    adminCount,
    instructorCount,
    parentCount,
    studentCount,
    ...backendValues,
  };
// Modal state and ref for outside click
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!showModal) return;
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  return (
   <div className="gap-4 rounded-xl">
      {/* First row: 4 small cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {cardData.slice(0, 4).map(({ label, valueKey, icon, percent }) => (
          <div
            key={label}
            className="bg-[#FFFFFF] flex flex-col justify-between rounded-lg p-4 h-[130px] shadow-sm w-full cursor-pointer"
            onClick={() => router.push(`/dashboard/users/Summary/${valueKey}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <div>{icon}</div>
              <button
                className="flex items-center gap-1 text-xs text-gray-500 font-medium hover:underline focus:outline-none"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/dashboard/users/Summary/${valueKey}`);
                }}
              >
                View More <ArrowRight size={13} />
              </button>
            </div>
            <div>
              <div className="flex mb-1">
                <div className="text-lg text-[#0F1828] font-semibold">{values[valueKey] ?? 0}</div>
              </div>
              <div className="flex flex-wrap justify-between items-center">
                <div className="text-xs text-gray-600">{label}</div>
                <div className="flex items-center bg-[#E6F4EA] text-[#15803D] rounded px-1.5 py-0.5 ml-2 text-[11px] font-semibold">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M7 3L3 7M7 3L11 7" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="ml-1">{percent}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Second row: 3 large cards, each full width in a vertical stack */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
      {cardData.slice(4, 7).map(({ label, valueKey, icon, percent, chart, infoIcon }, idx) => (
  <div
    key={label}
    className="bg-[#FFFFFF] flex flex-col justify-between rounded-lg p-4 h-[130px] shadow-sm w-full relative cursor-pointer"
    onClick={() => router.push(`/dashboard/users/Summary/${valueKey}`)}
  >
    <div className="flex items-center justify-between mb-2">
      <div>{icon}</div>
      {infoIcon ? (
                <div className="relative">
                  <button
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setShowModal(true)}
                    ref={modalRef}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20ZM10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM9 5H11V7H9V5ZM9 9H11V15H9V9Z" fill="#737373"/>
                    </svg>
                  </button>
                  {showModal && idx === 2 && (
                    <>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-gray-300 rounded-md shadow-lg p-3 min-w-[200px] text-xs"
                      >
                        <div className="text-sm font-semibold mb-1 text-gray-800">Total logins in the last 7 days.</div>
                        <div className="text-xs text-gray-700 space-y-0.5">
                          <div>Dojo Admins: <span className="font-semibold text-gray-900">150</span></div>
                          <div>Instructors: <span className="font-semibold text-gray-900">580</span></div>
                          <div>Parents: <span className="font-semibold text-gray-900">720</span></div>
                          <div>Students: <span className="font-semibold text-gray-900">895</span></div>
                        </div>
                      </div>
                      {/* Overlay for outside click */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowModal(false)}
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </div>
              ) : (
                 <button
          className="flex items-center gap-1 text-xs text-gray-500 font-medium hover:underline focus:outline-none"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          type="button"
          onClick={e => {
            e.stopPropagation();
            router.push(`/dashboard/users/Summary/${valueKey}`);
          }}
        >
          View More <ArrowRight size={13} />
        </button>
      )}
    </div>
    <div className="flex items-center w-full mb-1">
      <div className="text-lg text-[#0F1828] font-semibold">{values[valueKey] ?? 0}</div>
    </div>
    {/* Label row: for 7th card, order is label, chart, badge. For others, label, badge, chart */}
    <div className="flex items-center w-full">
      <span className="text-xs text-gray-600 truncate">{label}</span>
      {idx === 2 && chart && (
        <img src="/chart.svg" alt="Chart" className="h-5 w-auto mx-2" />
      )}
      <span className="flex-1" />
      <div className="flex items-center bg-[#E6F4EA] text-[#15803D] rounded px-1.5 py-0.5 text-[11px] font-semibold ml-2">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M7 3L3 7M7 3L11 7" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="ml-1">{percent}</span>
      </div>
      {idx !== 2 && chart && (
        <img src="/chart.svg" alt="Chart" className="h-5 w-auto mx-2" />
      )}
    </div>
  </div>
))}
      </div>
    </div>
  );
}