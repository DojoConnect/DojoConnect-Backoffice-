import React from "react";

export default function SubscriptionSummary({ summary }: { summary: any }) {
  if (!summary) {
    return (
      <div className="bg-white rounded-md shadow p-6">
        <div className="text-gray-500">No subscription information available.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-100 rounded-md px-4 py-2 mb-4">
        <span className="font-semibold text-gray-700 text-lg">Current plan summary</span>
      </div>
      <div className="bg-white rounded-md shadow p-6">
        <div className="flex justify-between items-start gap-6">
          <div>
            <div className="text-gray-500 text-xs">Plan Name</div>
            <div className="text-black-300 text-lg font-bold">{summary.plan_name || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Billing Cycle</div>
            <div className="text-black-300 text-lg font-bold">{summary.billing_cycle || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Plan Cost</div>
            <div className="text-black-300 text-lg font-bold">{summary.plan_cost ? `$${summary.plan_cost}` : "-"}</div>
          </div>
        </div>
        <div className="mt-6">
          <div className="inline-block rounded px-3 py-1 text-xs font-semibold text-gray-600 mr-2">
            STATUS
          </div>
          <span className={`inline-block rounded px-3 py-1 text-xs font-semibold ml-2 ${
            summary.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
          }`}>
            {summary.status ? summary.status.charAt(0).toUpperCase() + summary.status.slice(1) : "Inactive"}
          </span>
        </div>
        {summary.next_payment && (
          <div className="mt-4 text-gray-700 text-sm">
            Next Payment is <span className="font-semibold">${summary.next_payment.amount}</span>, to be charged on <span className="font-semibold">{summary.next_payment.date}</span>
          </div>
        )}
      </div>
    </div>
  );
}