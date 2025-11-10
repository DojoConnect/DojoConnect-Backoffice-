import React, { useState, useEffect } from "react";
import SearchActionBar from "../users/InstructorProfile/SearchActionBar";
import Pagination from "../users/InstructorProfile/Pagination";
import FeedbackModal from "./FeedbackModal";

export default function FeedbackPage() {
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetch("https://backoffice-api.dojoconnect.app/get_feedback")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeedbacks(
            data.map((fb: any) => ({
              id: fb.id,
              img: "/Avatars.jpg",
              name: fb.full_name,
              email: fb.user_email,
              userType: fb.role ? fb.role.charAt(0).toUpperCase() + fb.role.slice(1) : "",
              feedback: fb.message,
              date: fb.submitted_at ? fb.submitted_at.split(" ")[0] : "",
              time: fb.submitted_at ? fb.submitted_at.split(" ")[1] : "",
              status: "In-Review",
            }))
          );
        }
      });
  }, []);

  // Reset to page 1 if feedbacks change and current page is out of range
  useEffect(() => {
    const totalPages = Math.ceil(feedbacks.length / rowsPerPage);
    if (page > totalPages && totalPages > 0) setPage(1);
  }, [feedbacks, page, rowsPerPage]);

  const paginatedFeedbacks = feedbacks.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="p-8 space-y-6 relative">
      <div className="font-bold text-xl mb-2">Feedbacks</div>
      <div className="bg-white rounded-md p-4 space-y-4">
        {/* Only show SearchActionBar if there are feedbacks */}
        {feedbacks.length > 0 && <SearchActionBar />}
        <div>
          {feedbacks.length === 0 ? (
            <div className="flex bg-white mt-4 flex-col items-center justify-center py-20 rounded-xl" style={{ border: '1px solid #E4E7EC' }}>
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
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 rounded-md">
                    <th className="p-3 rounded-l-md text-left">User Full Name</th>
                    <th className="p-3 text-left">User Type</th>
                    <th className="p-3 text-left">Feedback</th>
                    <th className="p-3 text-left">Date & Time</th>
                    <th className="p-3 rounded-r-md text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFeedbacks.map((fb) => (
                    <tr key={fb.id} className="border-b cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedFeedback(fb)}
                    >
                      <td className="p-3 flex items-center gap-2">
                        <img src={fb.img} alt={fb.name} className="w-8 h-8 rounded-full" />
                        <span className="whitespace-nowrap">{fb.name}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">{fb.userType}</td>
                      <td className="p-3">{fb.feedback}</td>
                      <td className="p-3">{fb.date} {fb.time}</td>
                      <td className="p-3">
                        {fb.status === "In-Review" ? (
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-500 whitespace-nowrap">
                            In-Review
                          </span>
                        ) : (
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 whitespace-nowrap">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                totalRows={feedbacks.length}
                rowsPerPage={rowsPerPage}
                currentPage={page}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
      {/* Feedback Modal */}
      {selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </div>
  );
}