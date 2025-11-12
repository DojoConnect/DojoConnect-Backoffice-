import React, { useState } from "react";

const ProfileFormModal = ({
  type,
  onClose,
  onConfirm,
}: {
  type: string | null;
  onClose: () => void;
  onConfirm: (payload: any) => void;
}) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dojoName: "",
    dojoLocation: "",
    instructorDojo: "",
    parentPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Map frontend form to backend payload
  const getPayload = () => {
    let name = `${form.firstName} ${form.lastName}`.trim();
    let payload: any = {
      name,
      email: form.email,
      role: type,
    };
    if (type === "admin") {
      payload.dojo_name = form.dojoName;
      payload.dojo_location = form.dojoLocation;
    }
    if (type === "instructor") {
      payload.instructor_dojo = form.instructorDojo;
    }
    if (type === "parent") {
      payload.parent_phone = form.parentPhone;
    }
    return payload;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(getPayload());
  };

  let fields;
  if (type === "admin") {
    fields = (
      <>
        <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
        <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
        <Input label="Contact Email Address" name="email" value={form.email} onChange={handleChange} />
        <Input label="Dojo Name" name="dojoName" value={form.dojoName} onChange={handleChange} />
        <Input label="Dojo Location" name="dojoLocation" value={form.dojoLocation} onChange={handleChange} />
      </>
    );
  } else if (type === "instructor") {
    fields = (
      <>
        <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
        <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
        <Input label="Email Address" name="email" value={form.email} onChange={handleChange} />
        <Select
          label="Dojo"
          name="instructorDojo"
          value={form.instructorDojo}
          onChange={handleChange}
          options={["Dojo One", "Dojo Two", "Dojo Three"]}
        />
      </>
    );
  } else if (type === "parent") {
    fields = (
      <>
        <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
        <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
        <Input label="Email Address" name="email" value={form.email} onChange={handleChange} />
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.03)" }}
        onClick={onClose}
      />
      {/* Main Modal */}
      <div className="fixed inset-0 z-60 flex items-center justify-center">
        <div
          className="bg-white rounded-xl shadow-lg w-[400px] p-6 relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-black text-lg">
              {type === "admin" && "Create New Dojo Admin"}
              {type === "instructor" && "Create New Dojo Instructor"}
              {type === "parent" && "Create New Dojo Parent"}
            </span>
            <button
              className="text-gray-400 text-2xl"
              onClick={onClose}
              type="button"
            >×</button>
          </div>
          <div className="text-gray-500 text-sm mb-4">
            {type === "admin" && "Fill the form to add a new admin"}
            {type === "instructor" && "Fill the form to add a new instructor"}
            {type === "parent" && "Fill the form to add a new parent"}
          </div>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {fields}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="border border-gray-300 rounded-md bg-white text-black py-2 px-4 font-semibold flex-1"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="border border-red-600 rounded-md bg-red-600 text-white py-2 px-4 font-semibold flex-1"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Input = ({ label, name, value, onChange }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-gray-700">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md bg-white px-3 py-2 text-sm placeholder:text-gray-400"
      placeholder={`Enter the ${label.toLowerCase()}`}
      required={label.toLowerCase().includes("email") || label.toLowerCase().includes("first name") || label.toLowerCase().includes("last name")}
    />
  </div>
);

const Select = ({ label, name, value, onChange, options }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-gray-700">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-md bg-white px-3 py-2 text-sm text-gray-700"
      required
    >
      <option value="">Select a dojo</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default ProfileFormModal;