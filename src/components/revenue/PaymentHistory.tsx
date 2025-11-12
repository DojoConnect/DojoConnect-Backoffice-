'use client';
import React, { useState } from "react";
import { FaSearch, FaFilter, FaDownload } from "react-icons/fa";

// --- Export Modal ---
const exportOptions = [
  {
    key: "pdf",
    label: "As PDF",
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"></svg>
    ),
  },
  {
    key: "xlsx",
    label: "As XLSX",
    svg: (
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none"></svg>
    ),
  },
  {
    key: "csv",
    label: "As CSV",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"></svg>
    ),
  },
];

function ExportModal({ onClose, onExport }: { onClose: () => void; onExport: (format: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
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
      {exportOptions.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            className={`flex items-center w-full px-4 py-2 gap-3 text-left transition
              ${isActive ? "bg-red-50" : ""}
              rounded-md group`}
            onClick={() => {
              setSelected(opt.key);
              onExport(opt.key);
              onClose();
            }}
          >
            <span
              className={`transition ${
                isActive ? "text-red-600" : "text-gray-500"
              }`}
            >
              {React.cloneElement(opt.svg, {
                ...(isActive
                  ? { color: "#E51B1B" }
                  : { color: "#A1A1A1" }),
              })}
            </span>
            <span
              className={`font-medium transition ${
                isActive ? "text-red-600" : "text-gray-700"
              }`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// --- Payment History Component ---
type PaymentRow = {
  dojo: string;
  plan: string;
  amount: string;
  date: string;
  status: string;
  statusColor: string;
};

type PaymentHistoryProps = {
  filter: "today" | "week" | "month" | "all" | "custom";
  customRange?: { start?: string; end?: string };
};

function getStatusColor(status: string) {
  if (status.toLowerCase() === "paid") return "bg-green-500";
  return "bg-yellow-500";
}

export default function PaymentHistory({ filter, customRange }: PaymentHistoryProps) {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Fetch payment history from API
  React.useEffect(() => {
    setLoading(true);
    let payload: any = {};
    let period = filter === "all" ? "all" : filter === "today" ? "today" : filter === "week" ? "this_week" : filter === "month" ? "this_month" : "custom";
    payload.period = period;
    if (period === "custom" && customRange?.start && customRange?.end) {
      payload.start_date = customRange.start;
      payload.end_date = customRange.end;
    }
    fetch("https://apis.dojoconnect.app/metrics/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        // Try to use transactions array if available, else fallback to time_series
        if (data && data.success && data.data && Array.isArray(data.data.transactions)) {
          setRows(
            data.data.transactions.map((t: any) => ({
              dojo: t.dojo_name || t.dojo || "N/A",
              plan: t.plan || t.subscription_plan || "N/A",
              amount: t.amount ? `£${t.amount}` : "N/A",
              date: t.date ? new Date(t.date).toLocaleDateString() : (t.created_at ? new Date(t.created_at).toLocaleDateString() : "N/A"),
              status: t.status || "Paid",
              statusColor: getStatusColor(t.status || "Paid"),
            }))
          );
        } else if (data && data.success && data.data && Array.isArray(data.data.time_series)) {
          // fallback: show time_series as simple rows
          setRows(
            data.data.time_series.map((t: any) => ({
              dojo: "-",
              plan: "-",
              amount: t.revenue ? `£${t.revenue}` : "£0",
              date: t.date ? new Date(t.date).toLocaleDateString() : "N/A",
              status: "Paid",
              statusColor: getStatusColor("Paid"),
            }))
          );
        } else {
          setRows([]);
        }
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [filter, customRange]);

  // Export handler
  const handleExport = (format: string) => {
    setLoading(true);
    let filters: any = {};
    let period = filter === "all" ? "all" : filter === "today" ? "today" : filter === "week" ? "this_week" : filter === "month" ? "this_month" : "custom";
    if (period === "custom" && customRange?.start && customRange?.end) {
      filters.start_date = customRange.start;
      filters.end_date = customRange.end;
    }
    fetch("https://apis.dojoconnect.app/export/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format,
        include_all: period === "all",
        filters,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.data && data.data.file_url) {
          window.open(data.data.file_url, "_blank");
        } else {
          alert("Export failed. Please try again.");
        }
      })
      .catch(() => alert("Export failed. Please try again."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-white rounded-xl p-6 mt-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <span className="text-base font-semibold text-black">Payment History</span>
        <div className="flex gap-2 items-center relative">
          {/* Search */}
          <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 py-2">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search"
              className="outline-none bg-transparent text-gray-500 placeholder-gray-400 w-32 md:w-40"
              disabled
            />
          </div>
          {/* Filter */}
          <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 py-2">
            <FaFilter className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Filter"
              className="outline-none bg-transparent text-gray-500 placeholder-gray-400 w-16 md:w-24"
              disabled
            />
          </div>
          {/* Export */}
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-red-600 border border-gray-300 rounded-md px-4 py-2 text-white font-medium"
              onClick={() => setShowExport((v) => !v)}
              type="button"
            >
              <FaDownload className="text-white" />
              Export
            </button>
            {showExport && (
              <ExportModal
                onClose={() => setShowExport(false)}
                onExport={handleExport}
              />
            )}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-md overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left text-black font-semibold">Dojo Name</th>
              <th className="py-3 px-4 text-left text-black font-semibold">Plan</th>
              <th className="py-3 px-4 text-left text-black font-semibold">Amount</th>
              <th className="py-3 px-4 text-left text-black font-semibold">Date</th>
              <th className="py-3 px-4 text-left text-black font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No payment history found.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="py-3 px-4 text-gray-600">{row.dojo}</td>
                  <td className="py-3 px-4 text-gray-600">{row.plan}</td>
                  <td className="py-3 px-4 text-gray-600">{row.amount}</td>
                  <td className="py-3 px-4 text-gray-600">{row.date}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${row.statusColor}`}></span>
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}