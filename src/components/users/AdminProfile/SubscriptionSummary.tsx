import React from "react";

interface SubscriptionSummaryProps {
  summary?: {
    planName?: string;
    billingCycle?: string;
    planCost?: string;
    status?: string;
    nextPaymentAmount?: string;
    nextPaymentDate?: string;
    progressPercent?: number; // 0-100
  } | null;
}

export default function SubscriptionSummary({ summary }: SubscriptionSummaryProps) {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <img src="/illustration.png" alt="No info" className="w-40 h-40 mb-4" />
        <div className="text-black font-semibold text-lg">No info yet</div>
      </div>
    );
  }

  const {
    planName = "-",
    billingCycle = "-",
    planCost = "-",
    status = "-",
    nextPaymentAmount = "-",
    nextPaymentDate = "-",
    progressPercent = 0,
  } = summary;

  return (
    <div>
      <div className="bg-gray-100 rounded-md border-b border-gray-200 px-4 py-2 mb-4">
        <span className="font-semibold text-gray-700 text-lg">Current plan summary</span>
      </div>
      <div className="bg-white rounded-md shadow p-6">
        <div className="flex justify-between items-start gap-6">
          <div>
            <div className="text-gray-500 text-xs">Plan Name</div>
            <div className="text-black-300 text-lg font-bold">{planName}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Billing Cycle</div>
            <div className="text-black-300 text-lg font-bold">{billingCycle}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Plan Cost</div>
            <div className="text-black-300 text-lg font-bold">{planCost}</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="inline-block rounded px-3 py-1 text-xs font-semibold text-gray-600 mr-2">
            STATUS
          </div>
          <span className={`inline-block rounded px-3 py-1 text-xs font-semibold ml-2 ${
            status === "Active"
              ? "bg-green-100 text-green-700"
              : status === "Inactive"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}>
            {status}
          </span>
        </div>
        <div className="mt-4 text-gray-700 text-sm">
          Next Payment is <span className="font-semibold">{nextPaymentAmount}</span>, to be charged on <span className="font-semibold">{nextPaymentDate}</span>
        </div>
        <div className="relative mt-6 w-[405px] h-[19px] flex space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0" width="405" height="19" fill="none">
            <rect width="405" height="18" y=".328" fill="#EAEAEA" rx="4"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0" width={Math.round(405 * (progressPercent / 100))} height="19" fill="none">
            <path fill="#5B89FF" d={`M0 4.328a4 4 0 0 1 4-4h${Math.round(405 * (progressPercent / 100)) - 4}v18H4a4 4 0 0 1-4-4v-10Z`} />
          </svg>
        </div>
      </div>
    </div>
  );
}