import React, { useState } from "react";

interface PaginationProps {
  totalRows: number;
  rowsPerPage?: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  totalRows,
  rowsPerPage = 5,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  // Generate page numbers (show first, last, current, and neighbors)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 mt-6 gap-4 md:gap-0"
      style={{ borderTop: '1px solid #ECE4E4' }}
    >
      {/* Page info */}
      <p className="text-sm font-semibold text-[#70707A]">
        Page {currentPage} of {totalPages}
      </p>

      {/* Page numbers */}
      <div className="flex flex-wrap items-center gap-2">
        {getPageNumbers().map((num, i) =>
          typeof num === "number" ? (
            <button
              key={i}
              onClick={() => onPageChange(num)}
              className={`px-2 py-1 h-8 w-8 rounded-md text-sm font-normal transition ${
                num === currentPage
                  ? 'bg-[#FFE5E5] text-[#EB5017]'
                  : 'text-[#70707A] hover:bg-gray-100'
              }`}
            >
              {num}
            </button>
          ) : (
            <span key={i} className="px-2 text-[#70707A]">...</span>
          )
        )}
      </div>

      {/* Prev/Next buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            border: '1px solid #ECE4E4',
            boxShadow: '0 2px 4px -2px #0000000A',
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
          className="px-3 gap-2 flex items-center py-1 rounded-lg text-[#101928] h-[36px] font-semibold text-sm"
        >
          <svg
            className="my-auto"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.91076 10.5899C1.58533 10.2645 1.58533 9.73683 1.91076 9.4114L5.2441 6.07806C5.56954 5.75263 6.09717 5.75263 6.42261 6.07806C6.74805 6.4035 6.74805 6.93114 6.42261 7.25657L4.51186 9.16732L17.5 9.16732C17.9603 9.16732 18.3334 9.54041 18.3334 10.0007C18.3334 10.4609 17.9603 10.834 17.5 10.834L4.51186 10.834L6.42261 12.7447C6.74805 13.0702 6.74805 13.5978 6.42261 13.9232C6.09717 14.2487 5.56954 14.2487 5.2441 13.9232L1.91076 10.5899Z"
              fill="#101928"
            />
          </svg>
          Previous
        </button>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            border: '1px solid #ECE4E4',
            boxShadow: '0 2px 4px -2px #0000000A',
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
          className="px-3 gap-2 flex items-center py-1 rounded-lg text-[#101928] h-[36px] font-semibold text-sm"
        >
          Next
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.0893 10.5899C18.4147 10.2645 18.4147 9.73683 18.0893 9.4114L14.7559 6.07806C14.4305 5.75263 13.9029 5.75263 13.5774 6.07806C13.252 6.4035 13.252 6.93114 13.5774 7.25657L15.4882 9.16732L2.50002 9.16732C2.03978 9.16732 1.66669 9.54041 1.66669 10.0007C1.66669 10.4609 2.03978 10.834 2.50002 10.834L15.4882 10.834L13.5774 12.7447C13.252 13.0702 13.252 13.5978 13.5774 13.9232C13.9029 14.2487 14.4305 14.2487 14.7559 13.9232L18.0893 10.5899Z"
              fill="#101928"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}