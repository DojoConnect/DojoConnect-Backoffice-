import React from "react";

interface SubscriptionHistory {
  id: string | number;
  invoice: string;
  amount: string;
  date: string;
  status: string;
}

interface SubscriptionHistoryTableProps {
  data: SubscriptionHistory[];
}

export default function SubscriptionHistoryTable({ data }: SubscriptionHistoryTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <img src="/illustration.png" alt="No info" className="w-40 h-40 mb-4" />
        <div className="text-black font-semibold text-lg">No info yet</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-white-100">
            <th className="px-4 py-3 text-left text-black font-semibold">Invoice</th>
            <th className="px-4 py-3 text-left text-black font-semibold">Amount</th>
            <th className="px-4 py-3 text-left text-black font-semibold">Date</th>
            <th className="px-4 py-3 text-left text-black font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 text-gray-500">{row.invoice}</td>
              <td className="px-4 py-3 text-gray-500">{row.amount}</td>
              <td className="px-4 py-3 text-gray-500">{row.date}</td>
              <td className="px-4 py-3 flex items-center text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
                {row.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}