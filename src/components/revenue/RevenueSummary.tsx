'use client';
import React, { useEffect, useState } from "react";
import { ReadMoreIcon, IconA, IconB, IconC, IconD, IconE, IconF } from './revenueData';
import { FaArrowUp } from "react-icons/fa";

type RevenueSummaryProps = {
  filter: string;
  customRange?: { start?: string; end?: string };
};

function mapApiToCards(api: any) {
  // Map API fields to your card UI
  return [
    {
      label: 'Total Revenue',
      value: api.total_revenue ? `£${api.total_revenue}` : '£0',
      status: api.revenue_change ? `${api.revenue_change}` : '',
      icon: <IconE />,
    },
    {
      label: 'Avg. Revenue per Dojo',
      value: api.avg_revenue_per_dojo ? `£${api.avg_revenue_per_dojo}` : '£0',
      status: api.avg_revenue_change ? `${api.avg_revenue_change}` : '',
      icon: <IconE />,
    },
    {
      label: 'Gross Transaction Vol.',
      value: api.gross_transaction_volume ? `£${api.gross_transaction_volume}` : '£0',
      status: api.gross_transaction_change ? `${api.gross_transaction_change}` : '',
      icon: <IconF />,
      chartImg: '/chart.svg',
    },
    {
      label: 'Total Dojo Owners',
      value: api.total_dojo_owners ?? '0',
      status: api.active_dojo_owners ? `${api.active_dojo_owners} active` : '',
      icon: <IconA />,
    },
    {
      label: 'Active Subscriptions',
      value: api.active_subscriptions ?? '0',
      status: api.active_subscriptions_percent ? `${api.active_subscriptions_percent} of total` : '',
      icon: <IconB />,
    },
    {
      label: 'Canceled Subscriptions',
      value: api.canceled_subscriptions ?? '0',
      status: api.canceled_subscriptions_percent ? `${api.canceled_subscriptions_percent} of ${api.total_dojo_owners}` : '',
      icon: <IconC />,
    },
  ];
}

export default function RevenueSummary({ filter, customRange }: RevenueSummaryProps) {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let payload: any = {};
    let period =
      filter === "all"
        ? "all"
        : filter === "today"
        ? "today"
        : filter === "week"
        ? "this_week"
        : filter === "month"
        ? "this_month"
        : "custom";
    payload.period = period;
    if (period === "custom" && customRange?.start && customRange?.end) {
      payload.start_date = customRange.start;
      payload.end_date = customRange.end;
    }
    // Defensive: Remove undefined values
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    fetch("https://apis.dojoconnect.app/metrics/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.data) {
          setStats(mapApiToCards(data.data));
        } else {
          setStats([]);
          setError(data?.error || "No data returned");
        }
      })
      .catch((err) => {
        setStats([]);
        setError(err.message || "Network error");
      })
      .finally(() => setLoading(false));
  }, [filter, customRange]);

  return (
    <div className="bg-[#FFFFFF] p-4 gap-4 rounded-xl" style={{ border: '1px solid #ECE4E4' }}>
      <h1 className="text-base font-semibold mb-4 text-[#475367]">Metrics</h1>
      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading metrics...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">
          Error loading metrics: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
          {stats.map(({ label, value, status, icon, chartImg }) => (
            <div key={label} className="bg-gray-50 flex flex-col justify-between rounded-lg p-4 h-[135px] shadow-sm relative">
              <div style={{ border: "1px solid #FCC2C3" }} className="h-8 w-8 rounded-full bg-[#FFE5E5] flex items-center justify-center">
                {icon}
              </div>
              <div>
                <div className="flex mb-1">
                  <div className="text-xl text-[#0F1828] font-semibold">{value}</div>
                </div>
                <div className="flex flex-wrap justify-between">
                  <div className="text-sm text-gray-600">{label}</div>
                  {chartImg && (
                    <img
                      src={chartImg}
                      alt="Chart"
                      className="mx-5 h-6 w-auto"
                      style={{ display: 'inline-block' }}
                    />
                  )}
                  {status && (
                    <div className="flex items-center px-2 py-0.5 rounded bg-[#E6F4EA]">
                      <span className="mr-1 text-sm font-semibold text-[#15803D]">
                        <FaArrowUp />
                      </span>
                      <span className="text-sm font-semibold text-[#15803D]">{status}</span>
                    </div>
                  )}
                </div>
                <button
                  className="absolute top-4 right-4"
                  onClick={() => setOpenModal(label)}
                  aria-label="Open details"
                >
                  <ReadMoreIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}