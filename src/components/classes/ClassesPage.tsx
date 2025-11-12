// components/ClassesPage.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { FaEllipsisV } from "react-icons/fa";
import Pagination from './Pagination';
import SearchFilterExport from './SearchFilterExport';
import ClassesTable from './ClassTable'; 

 export interface Instructor {
  name: string;
  avatar: string;
}

export interface ClassRow {
  id: string | number;
  class_uid: string;
  className: string;
  classLevel: string;
  instructor: Instructor;
  enrolledStudents: number;
  dateCreated: string;
  status: string;
  classImg: string;
}

export default function ClassesPage() {
   const [classesData, setClassesData] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

   useEffect(() => {
    fetch('https://www.backoffice-api.dojoconnect.app/get_classes')
      .then(res => res.json())
     .then((data) => {
  const mapped = (data.data || []).map((item: any) => ({
    id: item.id,
    class_uid: item.class_uid,
    className: item.class_name,
    classLevel: item.level || "",
    instructor: {
      name: item.instructor || "No Instructor",
      avatar: "/instructorImage.png",
    },
    enrolledStudents: Number(item.capacity) || 0,
    dateCreated: item.created_at
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : "",
    status: item.status === "active" ? "Active" : "Deactivated",
    classImg: item.image_path
      ? (item.image_path.startsWith("http") ? item.image_path : `/${item.image_path}`)
      : "/classImg.jpg",
    // Add more fields if needed
  }));
  setClassesData(mapped);
  setLoading(false);
})
      .catch(() => setLoading(false));
  }, []);
// Slice data for current page
  const pagedClasses = classesData.slice((page - 1) * rowsPerPage, page * rowsPerPage);


  return (
    <div className="px-0 md:px-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-[#0F1828] mb-4">Classes</h1>

      {/* Controls */}
      <SearchFilterExport />

     {/* Table */}
      <div className="bg-white rounded-xl p-0 mb-6" style={{ border: "1px solid #E4E7EC" }}>
        <ClassesTable classes={pagedClasses} loading={loading} />
      </div>

      {/* Pagination */}
      <Pagination
        totalRows={classesData.length}
        rowsPerPage={rowsPerPage}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  )
}
