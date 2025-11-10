import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

export default function CreateNewPassword({
  onContinue,
  email,
  otp,
}: {
  onContinue: () => void;
  email: string;
  otp: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFilled = password && confirm && password === confirm;

const handleContinue = async () => {
  setLoading(true);
  setError(null);
  const res = await fetch("https://backoffice-api.dojoconnect.app/admin_reset_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email, // from step 1
      otp,   // from step 2
      new_password: password,
    }),
  });
  const data = await res.json();
  if (data.success) {
    onContinue(); // go to success step
  } else {
    setError(data.message || "Error resetting password");
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
          <h2 className="text-lg text-[#0F1828] font-semibold mb-2 text-center">Create new password</h2>
          <label className="block text-[#0F1828] mb-1 text-sm font-medium">Password</label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-md px-3 border border-gray-200 h-12 text-sm placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
            </button>
          </div>
          <label className="block text-[#0F1828] mb-1 text-sm font-medium">Confirm password</label>
          <div className="relative mb-4">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Enter your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-md px-3 border border-gray-200 h-12 text-sm placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showConfirm ? <LuEyeOff size={20} /> : <LuEye size={20} />}
            </button>
          </div>
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