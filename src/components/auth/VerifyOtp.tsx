import { useState, useEffect } from "react";

export default function VerifyOtp({ onVerify }: { onVerify: () => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const isFilled = otp.every(d => d !== "");

  const handleChange = (value: string, idx: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[idx] = value;
      setOtp(newOtp);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-1/2 bg-[#E51B1B] justify-center items-center">
        <h1 className="text-white text-4xl font-bold">DojoConnect</h1>
      </div>
      <div className="flex flex-1 justify-center items-center bg-white p-4">
        <div className="w-full max-w-md p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg text-[#0F1828] font-semibold mb-2 text-center">Forgot password?</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            A 6-digit OTP (ONE TIME PASSWORD) has been sent to your e-mail for verification
          </p>
          <div className="flex justify-between mb-4">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, idx)}
                className="w-10 h-12 rounded-md bg-gray-100 text-center text-lg text-gray-700"
                placeholder="-"
              />
            ))}
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Didn't get code? <button className="text-red-500 underline">Resend</button>
            </span>
            <span className="text-sm text-gray-500">{`${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}`}</span>
          </div>
          <button
            className={`w-full h-12 rounded-md text-white font-semibold ${isFilled ? "bg-[#E51B1B]" : "bg-red-200"}`}
            disabled={!isFilled}
            onClick={onVerify}
          >
            Verify code
          </button>
        </div>
      </div>
    </div>
  );
}