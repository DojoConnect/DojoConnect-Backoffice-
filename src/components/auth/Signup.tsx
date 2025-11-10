'use client';
import { useState } from 'react';

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      const res = await fetch('https://backoffice-api.qvatepro.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    }),
});
      if (!res.ok) {
        alert('Signup failed');
        return;
      }
      alert('Signup successful! You can now log in.');
      // Optionally redirect to login page
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      <input name="firstName" placeholder="First Name" className="mb-2 w-full border p-2" onChange={handleChange} />
      <input name="lastName" placeholder="Last Name" className="mb-2 w-full border p-2" onChange={handleChange} />
      <input name="email" placeholder="Email" className="mb-2 w-full border p-2" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" className="mb-2 w-full border p-2" onChange={handleChange} />
      <button onClick={handleSignup} className="w-full bg-red-500 text-white py-2 rounded">Sign Up</button>
    </div>
  );
}