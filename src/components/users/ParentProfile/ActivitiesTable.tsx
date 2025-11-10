import React from 'react';
import { FaEllipsisV } from "react-icons/fa";
import Pagination from '../Pagination';

interface Activity {
  id?: string | number;
  type: string;
  reference?: string;
  created_at: string;
}

interface ActivitiesTableProps {
  activitiesData: Activity[];
}

export default function ActivitiesTable({ activitiesData }: ActivitiesTableProps) {
  return (
    <div className="rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Activity Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Reference</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date &amp; Time</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {activitiesData && activitiesData.length > 0 ? (
            activitiesData.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">{row.reference || "-"}</td>
                <td className="px-4 py-3">{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button className="bg-white rounded-md p-1 shadow">
                    <FaEllipsisV className="text-gray-400 inline" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-400">No activities found.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4">
        <Pagination
          totalRows={activitiesData.length}
          currentPage={1}
          onPageChange={() => {}}
        />
      </div>
    </div>
  );
}