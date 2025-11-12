import React, { useState } from "react";
import { students } from "./studentData";
import { FaEllipsisV } from "react-icons/fa";

// Export Modal for enrollments
const exportOptions = [
  {
    key: "png",
    label: "As PNG",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none">
        <path fill="#1A1A1A" fillOpacity=".8" d="M3.281 7.875h-.875a.437.437 0 0 0-.437.438v3.062a.438.438 0 0 0 .875 0v-.438h.437a1.531 1.531 0 1 0 0-3.062Zm0 2.188h-.437V8.75h.437a.656.656 0 1 1 0 1.313Zm8.969.922a.437.437 0 0 1-.121.303 1.644 1.644 0 0 1-1.191.524c-.966 0-1.75-.883-1.75-1.968 0-1.086.784-1.969 1.75-1.969.321.001.635.098.9.28a.438.438 0 1 1-.491.725.722.722 0 0 0-.41-.13c-.482 0-.874.492-.874 1.094 0 .601.392 1.094.874 1.094a.742.742 0 0 0 .438-.15V10.5a.438.438 0 0 1 0-.875h.438a.438.438 0 0 1 .437.438v.922ZM8.531 8.313v3.062a.437.437 0 0 1-.793.254L6.344 9.68v1.696a.438.438 0 0 1-.875 0V8.312a.437.437 0 0 1 .793-.254l1.394 1.95V8.313a.437.437 0 1 1 .875 0Zm-5.906-1.75a.437.437 0 0 0 .438-.438V2.187h4.812v2.626a.437.437 0 0 0 .438.437h2.624v.875a.438.438 0 0 0 .876 0V4.812a.438.438 0 0 0-.129-.309L8.623 1.44a.437.437 0 0 0-.31-.127h-5.25a.875.875 0 0 0-.874.875v3.937a.437.437 0 0 0 .437.438ZM8.75 2.805l1.569 1.569H8.75V2.806Z"/>
      </svg>
    ),
    disabled: true,
  },
  {
    key: "pdf",
    label: "As PDF",
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M4.41066 8.97684C4.08063 8.77554 3.69092 8.69512 3.30816 8.74934H2.33398V12.2493H3.10981V10.9135H3.44231C3.78676 10.9489 4.13288 10.8644 4.42231 10.6743C4.54356 10.5703 4.63964 10.4402 4.7033 10.2937C4.76695 10.1472 4.79653 9.98812 4.78981 9.82852C4.79878 9.66665 4.76908 9.50497 4.70314 9.35686C4.63721 9.20876 4.53695 9.07849 4.41066 8.97684ZM3.78648 10.2543C3.63994 10.3188 3.47883 10.343 3.31981 10.3243H3.09231V9.33269H3.31981C3.48501 9.31514 3.65167 9.34765 3.79816 9.42602C3.86525 9.47274 3.91924 9.53588 3.95498 9.6094C3.99072 9.68293 4.00702 9.7644 4.00231 9.84602C4.01093 9.92781 3.99502 10.0103 3.95658 10.083C3.91814 10.1558 3.85893 10.2154 3.78648 10.2543ZM6.45816 8.74934H5.48981V12.2493H6.41731C6.89 12.2956 7.366 12.2044 7.78816 11.9868C8.0165 11.8167 8.19675 11.5901 8.31127 11.3294C8.42579 11.0686 8.47066 10.7826 8.44148 10.4993C8.45868 10.2552 8.42447 10.0102 8.34107 9.78008C8.25767 9.54998 8.12694 9.33994 7.95731 9.16352C7.74755 8.99821 7.50691 8.87643 7.24949 8.80531C6.99206 8.73419 6.72303 8.71516 6.45816 8.74934ZM7.22816 11.456C6.98513 11.5926 6.70686 11.6536 6.42898 11.631H6.27731V9.36769H6.41731C6.90731 9.36769 7.09981 9.41434 7.29231 9.58934C7.40785 9.70964 7.49708 9.85268 7.55433 10.0093C7.61157 10.166 7.63557 10.3329 7.62481 10.4993C7.6396 10.6789 7.61132 10.8593 7.54233 11.0257C7.47334 11.1921 7.36563 11.3396 7.22816 11.456ZM9.29316 12.2493H10.0807V10.7852H11.6673V10.1668H10.0807V9.36769H11.6673V8.74934H9.29316V12.2493ZM8.75066 1.16602H2.33398V7.58269H3.50066V2.33269H8.26648L10.5007 4.56684V7.58269H11.6673V4.08269L8.75066 1.16602Z" fill="#A52424"/>
      </svg>
    ),
    disabled: true,
  },
  {
    key: "xls",
    label: "As XLS",
    svg: (
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M6.75048 0.166016H0.333805V6.58269H1.50048V1.33269H6.2663L8.50048 3.56684V6.58269H9.66713V3.08269L6.75048 0.166016ZM9.53011 9.51353C9.45577 9.45748 9.3765 9.40828 9.29329 9.36653C9.2087 9.32453 9.0372 9.24987 8.77879 9.14253C8.51861 9.03578 8.35354 8.95528 8.28529 8.90163C8.21704 8.84793 8.18261 8.77386 8.18261 8.67993C8.18261 8.57143 8.22346 8.48161 8.30396 8.41043C8.38096 8.34511 8.49471 8.31186 8.64286 8.31186C8.77296 8.31186 8.89779 8.32586 9.01736 8.35386C9.13636 8.38243 9.31546 8.43961 9.55229 8.52711L9.71096 7.88425C9.30846 7.75711 8.93571 7.69411 8.59329 7.69411C8.11846 7.69411 7.77721 7.83993 7.57011 8.13161C7.43421 8.31946 7.36711 8.53761 7.36711 8.78668C7.36711 9.07488 7.46979 9.29593 7.67571 9.44936C7.74804 9.50361 7.82796 9.55203 7.91429 9.59518C8.00121 9.63778 8.14996 9.70311 8.36053 9.79061C8.64579 9.90786 8.82486 9.99361 8.89721 10.0502C8.96954 10.1062 9.00628 10.1844 9.00628 10.2847C9.00628 10.3973 8.96896 10.4918 8.89486 10.5694C8.80911 10.658 8.67554 10.7024 8.49471 10.7024C8.21586 10.7024 7.87636 10.619 7.47621 10.4504L7.36186 11.1229C7.73634 11.2548 8.12776 11.3207 8.53611 11.3207C8.92871 11.3207 9.23321 11.239 9.45076 11.0763C9.70686 10.8832 9.83403 10.5985 9.83403 10.2234C9.83403 9.90493 9.73314 9.66868 9.53011 9.51353ZM2.9045 7.75577L2.0785 8.89791L1.263 7.75577H0.345426L1.57682 9.46144L0.28125 11.2593H1.21285L2.03943 10.0897L2.87007 11.2593H3.8215L2.53407 9.48127L3.80693 7.75577H2.9045ZM4.49998 7.75577V11.2593H6.79423V10.6409H5.28923V7.75577H4.49998Z" fill="#1A1A1A" fillOpacity="0.8"/>
      </svg>
    ),
    disabled: false,
  },
];

function ExportModal({ onClose, classId }: { onClose: () => void; classId: string }) {
  // No need for selected state, just handle click
  const handleExport = async () => {
    try {
      const payload = {
        format: "xlsx",
        filters: {
          class_id: classId,
        },
      };
      const res = await fetch("https://apis.dojoconnect.app/export/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enrollments_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      if (onClose) onClose();
    } catch (err: any) {
      alert("Export failed. Please try again.");
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="bg-white rounded-md shadow-lg border border-gray-200 w-56 py-2"
      style={{
        position: "absolute",
        top: "110%",
        right: 0,
        zIndex: 100,
      }}
    >
      {exportOptions.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`flex items-center w-full px-4 py-2 gap-3 text-left transition rounded-md group`}
          onClick={opt.disabled ? undefined : handleExport}
          disabled={opt.disabled}
          style={opt.disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          <span className={`transition ${opt.disabled ? "text-gray-500" : "text-gray-700"}`}>
            {React.cloneElement(opt.svg, {
              color: opt.disabled ? "#A1A1A1" : "#1A1A1A",
            })}
          </span>
          <span className={`font-medium transition ${opt.disabled ? "text-gray-700" : "text-red-600"}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function EnrolledStudentsTable({ students, classId }: { students: any[]; classId: string }) {
  const [showExport, setShowExport] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  // You can get classId from students or pass as prop if needed

  // Filter students by search and filter
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter
      ? student.status?.toLowerCase().includes(filter.toLowerCase())
      : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Search, Filter, Export Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6" style={{ position: "relative" }}>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              placeholder="Filter by status"
              className="outline-none bg-transparent text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        {/* Export Button */}
        <div style={{ position: "relative" }}>
          <button
            className="flex items-center gap-2 bg-red-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-red-700 transition"
            onClick={() => setShowExport((v) => !v)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </button>
          {showExport && (
            <ExportModal onClose={() => setShowExport(false)} classId={classId} />
          )}
        </div>
      </div>
      {/* Table */}
      <div className="rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3"><input type="checkbox" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Enrolled Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Activity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3"><input type="checkbox" /></td>
                <td className="flex items-center gap-2 px-4 py-3">
                  <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                  {student.name}
                </td>
                <td className="px-4 py-3">{student.email}</td>
                <td className="px-4 py-3">{student.enrolledDate}</td>
                <td className="px-4 py-3">{student.lastActivity}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-600">
                    {student.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="bg-white border border-gray-200 rounded p-1">
                    <FaEllipsisV className="text-gray-400 inline" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}