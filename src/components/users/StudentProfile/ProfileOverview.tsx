import { FaUser, FaRegCopy, FaEnvelope, FaCalendarAlt, FaEllipsisV } from 'react-icons/fa';

const classes = [
  {
    img: "/classImage.png",
    name: "Beginner Class",
    level: "Beginner",
    instructor: "Inspector Augustine",
    duration: "45 mins - 1 hr",
    frequency: "Tue Weekly",
    status: "Active",
    statusColor: "bg-green-500",
  },
  {
    img: "/classImage.png",
    name: "Intermediate Class",
    level: "Intermediate",
    instructor: "Inspector Augustine",
    duration: "1 hr",
    frequency: "Thu Weekly",
    status: "Payment Overdue",
    statusColor: "bg-red-400",
  },
];
const activities = [
  {
    title: "Student logged into their accounts",
    date: "Nov 2, 2024 | 09:32am",
  },
  {
    title: "Student updated name, email, phone or password",
    date: "williamson@gmail.com",
  },
  {
    title: "Student accessed attendance log of a child",
    date: "Nov 9, 2024 | 09:32am",
  },
  {
    title: "Viewed info about a class enrolled in",
    date: "Nov 12, 2024 | 09:32am",
  },
  {
    title: "Student logged into their account",
    date: "Nov 12, 2024 | 09:32am",
  },
];

export default function ProfileOverview({ profile }: { profile: any }) {
 return (
  <div>
    {/* Basic User information header */}
    <div className="flex items-center justify-between rounded-md bg-gray-100 px-6 py-4 mb-6">
      <span className="text-black font-semibold text-base">Basic User information</span>
      <button
        className="flex items-center gap-2 bg-white rounded-md px-4 py-2 border border-gray-400 text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition cursor-pointer"
        type="button"
      >
        Actions
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
    {/* Two-column info section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Column 1 */}
      <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-6">
        {/* Full Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Full Name</div>
              <div className="text-black font-medium">{profile.name || "Megan Doe"}</div>
            </div>
          </div>
          <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
        </div>
        {/* Email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Email</div>
              <div className="text-black font-medium">{profile.email || "meganwillow@gmail.com"}</div>
            </div>
          </div>
          <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
        </div>
        {/* Role */}
        <div className="flex items-center gap-3">
          <FaUser className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Role</div>
            <div className="text-black font-medium">{profile.userType || "Student"}</div>
          </div>
        </div>
        {/* Age */}
        <div className="flex items-center gap-3">
          <FaUser className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Age</div>
            <div className="text-black font-medium">{profile.age || "22"}</div>
          </div>
        </div>
        {/* Linked Dojo */}
        <div className="flex items-center gap-3">
          <FaUser className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Linked Dojo</div>
            <div className="text-black font-medium">{profile.linkedDojo || "Tigers Dojo, London"}</div>
          </div>
        </div>
        {/* Enrollment Date */}
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Enrollment Date</div>
            <div className="text-black font-medium">{profile.joinedDate || "Friday, Sep 25, 2025"}</div>
          </div>
        </div>
      </div>

      {/* Column 2 */}
      <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col gap-6">
        {/* Parent full name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUser className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Parent full name</div>
              <div className="text-black font-medium">{profile.parent?.name || "--"}</div>
            </div>
          </div>
          <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
        </div>
        {/* Parent email */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Parent email</div>
              <div className="text-black font-medium">{profile.parent?.email || "johnjoe@gmail.com"}</div>
            </div>
          </div>
          <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
        </div>
        {/* Number of Enrolled Children */}
        <div className="flex items-center gap-3">
          <FaUser className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Number of Enrolled Children</div>
            <div className="text-black font-medium">{profile.enrolledChildren || "2"}</div>
          </div>
        </div>
        {/* Subscription Status */}
        <div className="flex items-center gap-3">
          <FaUser className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Subscription status</div>
            <div className="text-black font-medium">{profile.subscriptionStatus || "Active"}</div>
          </div>
        </div>
        {/* Linked Dojo */}
        <div className="flex items-center gap-3">
          <FaUser className="text-gray-400 w-5 h-5" />
          <div>
            <div className="text-gray-500 text-xs">Linked Dojo</div>
            <div className="text-black font-medium">{profile.linkedDojo || "Tigers Dojo, London"}</div>
          </div>
        </div>
        {/* Notes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-gray-400 w-5 h-5" />
            <div>
              <div className="text-gray-500 text-xs">Notes</div>
              <div className="text-black font-medium">{profile.notes || "--"}</div>
            </div>
          </div>
          <FaRegCopy className="text-gray-400 w-4 h-4 cursor-pointer" />
        </div>
      </div>
    </div>

    {/* Section 2: Enrolled Classes & Activity Log */}
   <div className="flex flex-col md:flex-row gap-6 mt-8">
  {/* Enrolled Classes Column */}
  <div className="w-full md:w-1/2 flex flex-col">
    <div className="flex items-center justify-between bg-gray-100 rounded-md px-4 py-2 mb-2">
      <span className="text-gray-700 font-semibold">Enrolled Classes</span>
      <button className="text-red-500 font-semibold cursor-pointer">View all</button>
    </div>
    <div className="bg-white rounded-md border border-gray-200 p-4 flex-1 min-h-[320px] flex flex-col gap-4">
      <div className="flex-1 flex flex-col gap-4">
        {classes.map((cls, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-md border-b border-gray-200 last:border-b-0 flex-1 min-h-[120px]"
            style={{ minHeight: 0 }}
          >
            <img src={cls.img} alt={cls.name} className="w-16 h-16 rounded-md mr-4" />
            <div className="flex-1">
              <div className="font-semibold">{cls.name} - {cls.level}</div>
              <div className="text-xs text-gray-500">{cls.instructor}</div>
              <div className="flex mt-2 space-x-8 text-xs">
                <div className="flex flex-col items-start">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-black">{cls.duration}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-gray-500">Frequency</span>
                  <span className="text-black">{cls.frequency}</span>
                </div>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              cls.status === "Payment Overdue" ? "bg-red-600" : cls.statusColor
            } text-white`}>
              {cls.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
  {/* Activity Log Column */}
  <div className="w-full md:w-1/2 flex flex-col">
    <div className="flex items-center justify-between bg-gray-100 rounded-md px-4 py-2 mb-2">
      <span className="text-gray-700 font-semibold">Recent Activities</span>
      <button className="text-red-500 font-semibold cursor-pointer">View all</button>
    </div>
    <div className="bg-white rounded-md border border-gray-200 p-4 flex-1 min-h-[320px] flex flex-col gap-4">
      {activities.map((act, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-4"
        >
          <div>
            <div className="font-semibold text-black">{act.title}</div>
            <div className="text-xs text-gray-500">{act.date}</div>
          </div>
          <FaEllipsisV className="border border-gray-300 rounded-md p-1 text-gray-400 cursor-pointer" />
        </div>
      ))}
    </div>
  </div>
</div>
</div>
);
}