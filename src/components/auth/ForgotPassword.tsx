import { useState } from "react";

export default function ForgotPassword({ onContinue }: { onContinue: () => void }) {
  const [email, setEmail] = useState("");
  const isFilled = email.trim() !== "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const handleContinue = async () => {
  setLoading(true);
  setError(null);
  const res = await fetch("https://backoffice-api.dojoconnect.app/admin_forgot_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (data.success) {
    onContinue(); // go to OTP step
  } else {
    setError(data.message || "Error sending OTP");
  }
  setLoading(false);
};
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-1/2 bg-[#E51B1B] justify-center items-center">
        <h1 className="text-white text-4xl font-bold">DojoConnect</h1>
      </div>
      <div className="flex flex-1 justify-center items-center bg-white p-4">
        <div className="w-full max-w-md p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg text-[#0F1828] font-semibold mb-2">Forgot password?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter email address registered with this account
          </p>
          <label className="block text-[#0F1828] mb-1 text-sm font-medium">Email address</label>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-md px-3 mb-4 border border-gray-200 h-12 text-sm placeholder:text-gray-400"
          />
          <button
            className={`w-full h-12 rounded-md text-white font-semibold ${isFilled ? "bg-[#E51B1B]" : "bg-red-200"}`}
            disabled={!isFilled}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}