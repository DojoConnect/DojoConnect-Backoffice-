import React from "react";

interface SubscriptionSummaryProps {
  summary?: {
    planName?: string;
    billingCycle?: string;
    planCost?: string;
    status?: string;
    nextPaymentAmount?: string;
    nextPaymentDate?: string;
    progressPercent?: number;
  };
}

export default function SubscriptionSummary({ summary }: SubscriptionSummaryProps) {
  if (!summary || !summary.planName) {
    return (
      <div className="bg-white rounded-md shadow p-6 text-center text-gray-400">
        No subscription summary found.
      </div>
    );
  }
  return (
    <div>
      <div className="bg-gray-100 rounded-md border-b border-gray-200 px-4 py-2 mb-4">
        <span className="font-semibold text-gray-700 text-lg">Current plan summary</span>
      </div>
      <div className="bg-white rounded-md shadow p-6">
        <div className="flex justify-between items-start gap-6">
          <div>
            <div className="text-gray-500 text-xs">Plan Name</div>
            <div className="text-black-300 text-lg font-bold">{summary.planName}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Billing Cycle</div>
            <div className="text-black-300 text-lg font-bold">{summary.billingCycle}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Plan Cost</div>
            <div className="text-black-300 text-lg font-bold">{summary.planCost}</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="inline-block rounded px-3 py-1 text-xs font-semibold text-gray-600 mr-2">
            STATUS
          </div>
          <span className="inline-block bg-green-100 text-green-700 rounded px-3 py-1 text-xs font-semibold ml-2">
            {summary.status}
          </span>
        </div>
        <div className="mt-4 text-gray-700 text-sm">
          Next Payment is <span className="font-semibold">{summary.nextPaymentAmount}</span>, to be charged on <span className="font-semibold">{summary.nextPaymentDate}</span>
        </div>
        <div className="relative mt-6 w-[405px] h-[19px] flex space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0" width="405" height="19" fill="none">
            <rect width="405" height="18" y=".328" fill="#EAEAEA" rx="4"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0" width={summary.progressPercent ? Math.round(405 * (summary.progressPercent / 100)) : 0} height="19" fill="none">
            <path fill="#5B89FF" d="M0 4.328a4 4 0 0 1 4-4h357v18H4a4 4 0 0 1-4-4v-10Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}