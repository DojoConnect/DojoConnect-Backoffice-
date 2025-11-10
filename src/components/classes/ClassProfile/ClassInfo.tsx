import { FaUser, FaRegCopy, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { FaShuffle, FaWallet, FaCreditCard } from 'react-icons/fa6';
import { MdTimer } from 'react-icons/md';
import { IoCalendarOutline } from 'react-icons/io5';

export default function ClassOverview({ profile }: { profile: any }) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-md bg-gray-100 px-6 py-4 mb-6">
        <span className="text-black font-semibold text-base">Basic Class Information</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class Name</div>
              <div className="text-black font-medium">{profile.class_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaShuffle className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class Level</div>
              <div className="text-black font-medium">{profile.level}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaShuffle className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class Age</div>
              <div className="text-black font-medium">{profile.age_group}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class Instructor</div>
              <div className="text-black font-medium">{profile.instructor}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class Capacity</div>
              <div className="text-black font-medium">{profile.capacity}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Date Created</div>
              <div className="text-black font-medium">{profile.created_at}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Location</div>
              <div className="text-black font-medium">{profile.location}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaShuffle className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Class Frequency</div>
              <div className="text-black font-medium">{profile.frequency}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MdTimer className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Subscription Type</div>
              <div className="text-black font-medium">{profile.subscription}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaCreditCard className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Subscription Fee</div>
              <div className="text-black font-medium">{profile.price}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <IoCalendarOutline className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Grading Date</div>
              <div className="text-black font-medium">{profile.grading_date}</div>
            </div>
          </div>

        </div>
      </div>
     {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        {/* Enrolled Students */}
        <div className="bg-white rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-gray-500 text-xs mb-4">
            Enrolled <br /> Students
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black font-bold text-2xl">{profile.enrollment_count ?? 0}</span>
            <button
              className="text-green-600 text-xs font-semibold cursor-pointer hover:underline-0"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.hash = "#enrolled-students";
                }
              }}
              style={{ textDecoration: "none" }}
            >
              View List
            </button>
          </div>
        </div>
        {/* Instructor Assigned */}
        <div className="bg-white rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-gray-500 text-xs mb-4">
            Instructor <br /> Assigned
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black font-bold text-2xl">
              {Array.isArray(profile.instructor) ? profile.instructor.length : profile.instructor ? 1 : 0}
            </span>
            <button
              className="text-green-600 text-xs font-semibold cursor-pointer hover:underline-0"
              onClick={() => {
                if (profile.instructor_profile_url) {
                  window.open(profile.instructor_profile_url, "_blank");
                }
              }}
              style={{ textDecoration: "none" }}
            >
              View Profile
            </button>
          </div>
        </div>
        {/* Average Attendance Rate */}
        <div className="bg-white rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-gray-500 text-xs mb-4">
            Average <br /> Attendance Rate
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black font-bold text-2xl">
              {profile.attendance_summary && profile.attendance_summary.total_records > 0
                ? `${Math.round(
                    ((profile.attendance_summary.present_count ?? 0) /
                      profile.attendance_summary.total_records) * 100
                  )}%`
                : "0%"}
            </span>
            <span />
          </div>
        </div>
        {/* Sessions Completed */}
        <div className="bg-white rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div className="text-gray-500 text-xs mb-4">
            Sessions <br /> Completed
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black font-bold text-2xl">{profile.sessions_completed ?? 0}</span>
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}