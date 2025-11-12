import { FaEllipsisV } from "react-icons/fa";

export default function ActivitiesTable({ activities }: { activities: any[] }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-6 py-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-white-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Activity Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Description</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date & Time Added</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-4 py-3 text-sm text-gray-500">{activity.type}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{activity.description}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{activity.dateTime}</td>
              <td className="px-4 py-3 text-right">
                <span className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white">
                  <FaEllipsisV className="text-gray-400" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}