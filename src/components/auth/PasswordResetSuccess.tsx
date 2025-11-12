"use client";
import passwordImg from "../assets/passwordImg.jpg";



export default function PasswordResetSuccess({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-1/2 bg-[#E51B1B] justify-center items-center">
        <h1 className="text-white text-4xl font-bold">DojoConnect</h1>
      </div>
      <div className="flex flex-1 justify-center items-center bg-white p-4">
        <div className="w-full max-w-md p-6 rounded-xl border border-gray-200 flex flex-col items-center">
         <img src={passwordImg.src} alt="Password Reset Success" />
          <h2 className="text-lg text-[#0F1828] font-semibold mb-2 text-center">Congratulations!</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Your account is activated now. Sign in with your new password.
          </p>
          <button
            className="w-full h-12 rounded-md bg-[#E51B1B] text-white font-semibold"
            onClick={onLogin}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}