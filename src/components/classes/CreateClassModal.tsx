import React, { useState, useRef } from "react";
import { FaTimes, FaTrash, FaChevronDown, FaCalendarAlt } from "react-icons/fa";

export default function CreateClassModal({
  open,
  onClose,
  dojoName,
  ownerEmail,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  dojoName: string;
  ownerEmail: string;
  onCreated?: () => void;
}) {
  const [form, setForm] = useState({
    class_name: "",
    level: "",
    age_group: "",
    instructor: "",
    capacity: "",
    subscription: "",
    location: "",
    grading_date: "",
    description: "",
    frequency: "",
    price: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      owner_email: ownerEmail,
      class_name: form.class_name,
      description: form.description,
      instructor: form.instructor,
      level: form.level,
      age_group: form.age_group,
      frequency: form.frequency,
      capacity: Number(form.capacity),
      location: form.location,
      subscription: form.subscription,
      price: Number(form.price),
      grading_date: form.grading_date,
      schedule: [
        {
          day: "Thu",
          start_time: "09:00:00",
          end_time: "10:00:00",
        },
      ],
    };
    const res = await fetch("https://apis.dojoconnect.app/admin/classes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowSuccess(true);
      onCreated && onCreated();
    } else {
      setError("Class creation failed. Please check your input and try again.");
    }
  };

  if (!open) return null;

  // Success Modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 relative">
          {/* Header row: green icon and X */}
          <div className="flex items-center justify-between mb-6">
            <span className="bg-green-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 22 22"><path stroke="#039855" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6.5 11 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S1 16.523 1 11 5.477 1 11 1s10 4.477 10 10"/></svg>
            </span>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => { setShowSuccess(false); onClose(); }}>
              <FaTimes size={20} />
            </button>
          </div>
          {/* Text */}
          <div className="text-black font-semibold text-lg mb-2">Class Created</div>
          <div className="text-gray-500 mb-6">
            You are about to create a new class under <span className="font-semibold text-black">{dojoName}</span>
          </div>
          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-8">
            <button className="bg-white border border-gray-300 text-gray-700 rounded-md px-6 py-2" onClick={() => { setShowSuccess(false); onClose(); }}>
              Cancel
            </button>
            <button className="bg-red-600 text-white rounded-md px-6 py-2" onClick={() => { setShowSuccess(false); onClose(); }}>
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-8 relative">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              <div className="text-black font-semibold text-lg mb-1">Create new class</div>
              <div className="text-gray-500 text-sm mb-6">Fill the form to add a new class</div>
              {/* Class Name */}
              <label className="block text-xs text-gray-500 mb-1">Class Name</label>
              <input name="class_name" value={form.class_name} onChange={handleChange} placeholder="Taekwondo" className="w-full mb-4 bg-white border border-gray-300 rounded-md px-3 py-2" required />
              {/* Class Level */}
              <label className="block text-xs text-gray-500 mb-1">Class Level</label>
              <div className="relative mb-4">
                <select name="level" value={form.level} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 appearance-none pr-8" required>
                  <option value="">Select level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Class Age */}
              <label className="block text-xs text-gray-500 mb-1">Class Age</label>
              <div className="relative mb-4">
                <select name="age_group" value={form.age_group} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 appearance-none pr-8" required>
                  <option value="">Select age group</option>
                  <option value="6-12 Years">6-12 Years</option>
                  <option value="13-19 Years">13-19 Years</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Class Instructor */}
              <label className="block text-xs text-gray-500 mb-1">Class Instructor</label>
              <input name="instructor" value={form.instructor} onChange={handleChange} placeholder="John Doe" className="w-full mb-4 bg-white border border-gray-300 rounded-md px-3 py-2" required />
              {/* Class Capacity */}
              <label className="block text-xs text-gray-500 mb-1">Class Capacity</label>
              <input name="capacity" value={form.capacity} onChange={handleChange} placeholder="20" type="number" min={1} className="w-full mb-4 bg-white border border-gray-300 rounded-md px-3 py-2" required />
              {/* Class Subscription */}
              <label className="block text-xs text-gray-500 mb-1">Class Subscription</label>
              <div className="relative mb-4">
                <select name="subscription" value={form.subscription} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 appearance-none pr-8" required>
                  <option value="">Select subscription</option>
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Class Location */}
              <label className="block text-xs text-gray-500 mb-1">Class Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="234 Oxford Road, Manchester, UK" className="w-full mb-4 bg-white border border-gray-300 rounded-md px-3 py-2" required />
              {/* Grading Date */}
      <label className="block text-xs text-gray-500 mb-1">Grading Date</label>
      <div className="relative mb-4">
        <input
          name="grading_date"
          value={form.grading_date}
          onChange={handleChange}
          placeholder="DD/MM/YYYY"
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-8"
          type="date"
          required
        />
      </div>
    </div>
            {/* Right Column */}
            <div>
               {/* Image Upload */}
              <div className="flex flex-col items-center justify-center bg-white rounded-lg h-40 mb-4 mt-20 relative border border-gray-200">
                {imageUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img src={imageUrl} alt="Preview" className="object-contain h-32 w-full rounded bg-white" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white text-red-600 rounded-full p-1 shadow"
                      onClick={removeImage}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="bg-gray-200 rounded-full p-3 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 28 28"><path stroke="#535862" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.667" d="M14 2.667H7.735c-2.24 0-3.36 0-4.216.436A4 4 0 0 0 1.77 4.851c-.436.856-.436 1.976-.436 4.216v11.2c0 2.24 0 3.36.436 4.216a4 4 0 0 0 1.748 1.748c.856.436 1.976.436 4.216.436h12.267c1.24 0 1.86 0 2.368-.136a4 4 0 0 0 2.829-2.828c.136-.51.136-1.13.136-2.369m-2.667-12v-8m-4 4h8m-15.333 4.667a2.667 2.667 0 1 1-5.333 0 2.667 2.667 0 0 1 5.333 0m5.987 4.557L6.042 24.811c-.634.577-.951.865-.98 1.115a.67.67 0 0 0 .223.575c.189.166.617.166 1.475.166h12.515c1.92 0 2.879 0 3.632-.322a4 4 0 0 0 2.105-2.104c.322-.754.322-1.713.322-3.632 0-.646 0-.969-.07-1.27a2.7 2.7 0 0 0-.499-1.037c-.19-.242-.443-.444-.947-.847l-3.73-2.984c-.504-.404-.757-.606-1.034-.677a1.33 1.33 0 0 0-.743.024c-.273.088-.512.306-.99.74"/></svg>
                      </span>
                      <p className="text-gray-400 text-xs text-center block">
                      <span className="text-red-500 text-xs mb-0.5 block">Click to upload</span>
                      or drag and drop SVG, PNG, or GIF (max 800x400px)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                    />
                  </>
                )}
              </div>
              {/* Description */}
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full mb-4 bg-white border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Describe the class"
                required
              />
              {/* Class Frequency */}
              <label className="block text-xs text-gray-500 mb-1">Class Frequency</label>
              <div className="relative mb-1">
                <select name="frequency" value={form.frequency} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 appearance-none pr-8" required>
                  <option value="">Select frequency</option>
                  <option value="One-time session">One-time session</option>
                  <option value="Multiple sessions">Multiple sessions</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="text-gray-400 text-xs mb-2">The class frequency determines the class schedule format.</div>
              {/* Class Schedule (display only) */}
              <label className="block text-xs text-gray-500 mb-1">Class Schedule</label>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex gap-2">
                  <span className="bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-700">Thu Jul 25, 2025</span>
                  <span className="bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-700">2:00pm</span>
                  <span className="text-gray-700 text-xs">to</span>
                  <span className="bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-700">3:00pm</span>
                </div>
              </div>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 mt-8">
            <button type="button" className="bg-white border border-gray-300 text-gray-700 rounded-md px-6 py-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bg-red-600 text-white rounded-md px-6 py-2">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}