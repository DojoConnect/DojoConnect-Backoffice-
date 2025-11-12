'use client';
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { FaPlus, FaDownload, FaSearch, FaFilter } from "react-icons/fa";
import MainLayout from '../../../../../components/Dashboard/MainLayout';
import Pagination from '../../../../../components/users/Pagination';
import UsersTable from '../../../../../components/users/UsersTable';

const cardMeta = {
  adminCount: { title: "Dojo Admins", breadcrumb: "Dojo Admins", role: "admin" },
  instructorCount: { title: "Instructors", breadcrumb: "Instructors", role: "instructor" },
  parentCount: { title: "Parents", breadcrumb: "Parents", role: "parent" },
  // Accept both 'student' and 'child' for Students
  studentCount: { title: "Students", breadcrumb: "Students", role: ["student", "child"] },
  card5: { title: "Pending Profiles", breadcrumb: "Pending Profiles" },
  card6: { title: "Recent Profiles", breadcrumb: "Recent Profiles" },
  card7: { title: "User Activity Trends", breadcrumb: "User Activity Trends" },
};

type CardKey = keyof typeof cardMeta;

export default function CardSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const cardKey = params.card as CardKey;
  const meta = cardMeta[cardKey] || { title: "Unknown", breadcrumb: "Unknown" };

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    setLoading(true);

    if (meta.role) {
      fetch(`https://backoffice-api.dojoconnect.app/get_users`)
        .then(res => res.json())
        .then(data => {
          // Accept both 'student' and 'child' for Students
          const roles = Array.isArray(meta.role) ? meta.role : [meta.role];
          const filtered = (data.data || [])
            .filter((u: any) => roles.includes((u.role || "").toLowerCase()))
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              avatar: u.avatar && u.avatar !== "" ? u.avatar : "/default-avatar.png",
              joinedDate: u.created_at ? u.created_at.split(" ")[0] : "",
              lastActivity: u.last_activity || "-",
              status: u.subscription_status
                ? u.subscription_status.charAt(0).toUpperCase() + u.subscription_status.slice(1)
                : "Inactive",
            }));
          setUsers(filtered);
          setLoading(false);
        })
        .catch(() => {
          setUsers([]);
          setLoading(false);
        });
    } else {
      setUsers([]);
      setLoading(false);
    }
  }, [cardKey, meta.role]);

  const pagedUsers = users.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            className="bg-white rounded-md p-2"
            onClick={() => router.back()}
          >
            {/* Arrow left with horizontal line SVG */}
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M7 12h10" stroke="#737373" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 12l4-4M7 12l4 4" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-gray-500 ml-2">Go Back</span>
          <span className="text-gray-500 ml-6">Users / User List /</span>
          <span className="text-red-600 ml-2 font-semibold">{meta.breadcrumb}</span>
        </div>

        <h2 className="text-2xl font-bold text-black mb-6">{meta.title}</h2>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between bg-white rounded-md p-4 mb-6 border border-gray-200">
          <div className="flex gap-2">
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent outline-none"
              />
            </div>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <FaFilter className="text-gray-400 mr-2" />
              <span>Filter</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-red-600 border border-red-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-red-700 transition">
              <FaPlus className="text-white" />
              <span>Create New</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-red-600 text-red-600 rounded-md px-4 py-2 font-medium shadow hover:bg-red-50 transition">
              <FaDownload className="text-red-600" />
              Export
            </button>
          </div>
        </div>

        {/* Table or Empty State */}
        <div className="bg-white rounded-xl p-0 border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-20">Loading...</div>
          ) : pagedUsers.length === 0 ? (
            <div className="flex bg-white mt-4 flex-col items-center justify-center py-20 rounded-xl " style={{border:'1px solid #E4E7EC'}}>
              <img
                src="https://res.cloudinary.com/cloud-two-tech/image/upload/v1750963970/Illustration_found_gfbbgd.png" 
                alt="No data"
                className="w-[225px] h-[188px] mb-4"
              />
              <h2 className="text-2xl font-semibold text-[#303030]">Nothing here yet...</h2>
              <p className="text-base text-[#9E9E9E] mt-3">Whoops ... there’s no information available yet</p>
            </div>
          ) : (
            <>
              <UsersTable user={pagedUsers} showUserType={false} />
              <Pagination
                totalRows={users.length}
                rowsPerPage={rowsPerPage}
                currentPage={page}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}