'use client';

import { useState } from 'react';
import { LuEye, LuEyeOff } from "react-icons/lu";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const isFormFilled = email.trim() !== '' && password.trim() !== '';

  const handleLogin = async () => {
  if (!isFormFilled) return;
  try {
    const res = await fetch('https://www.backoffice-api.dojoconnect.app/login_admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
});
const data = await res.json();
    console.log('Login response:', res.status, data);

    if (!res.ok) {
      // Handle error (show message)
      alert('Login failed');
      return;
    }
    // Optionally handle token or user data
    router.push('/dashboard?tab=dashboard');
  } catch (error) {
    alert('An error occurred');
  }
};

  return (
    <div className="flex min-h-screen">
      {/* Left section - hidden on mobile */}
      <div className="hidden md:flex w-1/2 bg-[#E51B1B] justify-center items-center">
        <h1 className="text-white text-4xl font-bold">DojoConnect</h1>
      </div>

      {/* Right section - form */}
      <div className="flex flex-1 justify-center items-center bg-white p-4">
        <div
          className="w-full max-w-md p-6 rounded-xl"
          style={{
            boxShadow: '1px 1px 12px 0 #6D6E711A',
          }}
        >
          <h2 className="text-lg text-[#0F1828] font-semibold mb-6 text-center">
            Log in with your email to gain access
          </h2>

          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-[#0F1828] mb-1 text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md px-3 placeholder:text-[#0F1828]"
              style={{
                border: '1px solid #ECE4E4',
                height: '48px',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-[#0F1828] mb-1 text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md px-3 placeholder:text-[#0F1828]"
                style={{
                  border: '1px solid #ECE4E4',
                  height: '48px',
                  fontSize: '12px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
              >
                {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
              </button>
            </div>
          </div>
             {/* Forgot password button */}
      <div className="flex justify-end mt-4 mb-2">
    <button
      type="button"
      className="text-red-700 text-sm cursor-pointer"
      onClick={() => router.push('/forgot-password')}
    >
      Forgot password?
    </button>
  </div>
          {/* Login Button */}
          <button
            onClick={handleLogin}
            className={`w-full h-[55px] text-white font-semibold py-2 rounded-md ${
              isFormFilled ? '' : 'bg-red-300'
            }`}
            style={{
              backgroundColor: isFormFilled ? '#E51B1B' : '#FCA5A5',
            }}
            disabled={!isFormFilled}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
