import React from "react";

interface PaymentMethodProps {
  method?: {
    cardType?: string;
    last4?: string;
    expiry?: string;
    billingEmail?: string;
    image?: string;
  } | null;
}

export default function PaymentMethod({ method }: PaymentMethodProps) {
  if (!method) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <img src="/illustration.png" alt="No info" className="w-40 h-40 mb-4" />
        <div className="text-black font-semibold text-lg">No info yet</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-100 rounded-md border-b border-gray-200 px-4 py-2 mb-4">
        <span className="font-semibold text-gray-700 text-lg">Payment method</span>
      </div>
      <div className="bg-white rounded-md shadow p-6 flex items-start">
        <div className="flex justify-center items-center">
          <img src={method.image || "/users/image11.jpg"} alt="card" className="" />
        </div>
        <div>
          <div className="font-semibold text-black text-base">{method.cardType || "Card"}</div>
          <div className="font-semibold text-black text-base">
            **** **** **** {method.last4 || "----"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Expiry on {method.expiry || "--/----"}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="mr-1">
              <rect x="3" y="5" width="18" height="14" rx="2" fill="#E5E7EB"/>
              <path d="M3 7l9 6 9-6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {method.billingEmail || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}