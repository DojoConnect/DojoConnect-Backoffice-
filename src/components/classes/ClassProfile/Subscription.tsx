import { FaEllipsisV, FaRegCreditCard, FaRegMoneyBillAlt, FaExclamationCircle, FaDownload } from "react-icons/fa";

export default function SubscriptionTab({
  subscription,
  billing,
}: {
  subscription: any;
  billing: any[];
}) {
  return (
    <div>
      <div className="rounded-md border border-gray-200 bg-white px-6 py-4 mb-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-black font-semibold text-base">Subscription Summary</span>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 rounded-md border border-gray-100 bg-white px-6 py-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FaRegMoneyBillAlt className="text-red-500" />
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaEllipsisV />
              </button>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{subscription?.price ?? "—"}</div>
            <div className="text-gray-500 text-sm">Class price</div>
          </div>
          <div className="flex-1 rounded-md border border-gray-100 bg-white px-6 py-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FaRegCreditCard className="text-red-500" />
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaEllipsisV />
              </button>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{subscription?.subscription_type ?? "—"}</div>
            <div className="text-gray-500 text-sm">Subscription type</div>
          </div>
          <div className="flex-1 rounded-md border border-gray-100 bg-white px-6 py-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                <FaExclamationCircle className="text-red-500" />
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <FaEllipsisV />
              </button>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{subscription?.current_enrollments ?? "—"}</div>
            <div className="flex items-center justify-between text-gray-500 text-sm">
              <span>Current enrollments</span>
              <span className="bg-red-100 text-red-500 rounded-md px-2 py-1 ml-2 text-xs font-semibold">
                {subscription?.capacity ?? "—"} capacity
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-gray-200 bg-white px-6 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-black font-semibold text-base">Billing History</span>
          <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md font-semibold">
            <FaDownload className="text-white" />
            Download
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-black-500">Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black-500">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black-500">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {billing?.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm text-gray-500">{bill.invoice}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{bill.amount}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{bill.date} By, {bill.by}</td>
                <td className="px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${bill.status === "Paid" ? "bg-green-500" : "bg-red-500"}`}></span>
                  <span className={`font-semibold text-xs ${bill.status === "Paid" ? "text-green-600" : "text-red-600"}`}>{bill.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}