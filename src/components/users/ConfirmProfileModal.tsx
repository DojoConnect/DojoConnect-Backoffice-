import React from "react";

const ConfirmProfileModal = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <>
    <div className="fixed inset-0 z-60" style={{ background: "rgba(0,0,0,0.03)" }} onClick={onCancel} />
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="bg-white rounded-xl shadow-lg w-[350px] p-6 flex flex-col items-center border border-gray-200"
        style={{ maxWidth: 380 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center items-center gap-2 mb-4">
          <img src="/Modalimg1.png" alt="img1" className="w-12 h-12" />
          <img src="/Modalimg2.png" alt="img2" className="w-12 h-12" />
          <img src="/Modalimg3.png" alt="img3" className="w-12 h-12" />
        </div>
        <div className="text-lg font-bold text-black mb-2 text-center">New Profile Created</div>
        <div className="text-gray-500 text-sm mb-6 text-center">
          You are about to create a new profile
        </div>
        <div className="flex gap-2 w-full">
          <button className="flex-1 bg-white border border-gray-300 rounded-md text-gray-700 py-2 font-semibold cursor-pointer" onClick={onCancel} >
            Cancel
          </button>
          <button className="flex-1 bg-red-600 text-white rounded-md py-2 font-semibold cursor-pointer" onClick={onConfirm} >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </>
);

export default ConfirmProfileModal;