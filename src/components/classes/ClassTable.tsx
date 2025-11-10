import React from 'react';
import { FaEllipsisV } from "react-icons/fa";
import { useRouter } from 'next/navigation';
interface Instructor {
  name: string;
  avatar: string;
}

interface ClassRow {
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

interface ClassesTableProps {
  classes: ClassRow[];
  onClassClick?: (id: string | number) => void;
}

export default function ClassesTable({ classes, onClassClick }: ClassesTableProps) {
  const router = useRouter();
  return (
    <div className="rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-3"><input type="checkbox" /></th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Class Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Class Level</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Instructor</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Enrolled Students</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date Created</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {classes.map((c) => (
            <tr
              key={c.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick= {() => {
                if (onClassClick) {
                  onClassClick(c.class_uid);
                } else {
                  router.push(`/dashboard/classes/${c.class_uid}`);
                }
              }}
            >
              <td className="px-4 py-3"><input type="checkbox" /></td>
              <td className="flex items-center gap-2 px-4 py-3">
                <img src={c.classImg} alt={c.className} className="w-8 h-8 rounded-full" />
                {c.className}
              </td>
              <td className="px-4 py-3">{c.classLevel}</td>
              <td className="flex items-center gap-2 px-4 py-3">
                <img src={c.instructor.avatar} alt={c.instructor.name} className="w-8 h-8 rounded-full" />
                {c.instructor.name}
              </td>
              <td className="px-4 py-3">{c.enrolledStudents}</td>
              <td className="px-4 py-3">{c.dateCreated}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold
                  ${c.status === "Active"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="bg-white border border-gray-200 rounded p-1">
                  <FaEllipsisV className="text-gray-400 inline" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}