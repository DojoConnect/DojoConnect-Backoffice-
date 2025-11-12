import React, { useState } from "react";
import { FaFileCsv, FaFileExcel, FaFilePdf } from "react-icons/fa";

const exportOptions = [
  {
    key: "csv",
    label: "As CSV",
    ext: "csv",
    svg: <FaFileCsv size={20} />,
  },
  {
    key: "xls",
    label: "As XLS",
    ext: "xlsx",
    svg: <FaFileExcel size={20} />,
  },
  {
    key: "pdf",
    label: "As PDF",
    ext: "pdf",
    svg: <FaFilePdf size={20} />,
  },
];

const ExportModal = ({
  onClose,
  filters = {},
  includeAll = true,
}: {
  onClose: () => void;
  filters?: Record<string, any>;
  includeAll?: boolean;
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format: string) => {
    setDownloading(true);
    try {
      const res = await fetch("https://apis.dojoconnect.app/export/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          include_all: includeAll,
          filters: includeAll ? undefined : filters,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      alert("Failed to export users.");
    }
    setDownloading(false);
  };

  return (
    <div
      className="bg-white rounded-md shadow-lg border border-gray-200 w-56 py-2"
      style={{
        position: "absolute",
        top: "110%",
        right: 0,
        zIndex: 100,
      }}
    >
      {exportOptions.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            className={`flex items-center w-full px-4 py-2 gap-3 text-left transition
              ${isActive ? "bg-red-50" : ""}
              rounded-md group`}
            disabled={downloading}
            onClick={() => {
              setSelected(opt.key);
              handleExport(opt.ext);
            }}
          >
            <span
              className={`transition ${
                isActive ? "text-red-600" : "text-gray-500"
              }`}
            >
              {React.cloneElement(opt.svg as any, {
                color: isActive ? "#E51B1B" : "#A1A1A1",
              })}
            </span>
            <span
              className={`font-medium transition ${
                isActive ? "text-red-600" : "text-gray-700"
              }`}
            >
              {downloading && isActive ? "Exporting..." : opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ExportModal;