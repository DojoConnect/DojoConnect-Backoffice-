'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '../../../../../components/Dashboard/MainLayout'
import ProfileHeader from "../../../../../components/users/StudentProfile/ProfileHeader"
import ProfileTabs from "../../../../../components/users/StudentProfile/ProfileTabs"
import ProfileOverview from "../../../../../components/users/StudentProfile/ProfileOverview"
import ClassesTab from "../../../../../components/users/StudentProfile/ClassesTab"
import AttendanceSummary from "../../../../../components/users/StudentProfile/AttendanceSummary"
import SubscriptionSummary from "../../../../../components/users/StudentProfile/SubscriptionSummary"
import PaymentMethod from "../../../../../components/users/StudentProfile/PaymentMethod"
import SubscriptionTable from "../../../../../components/users/StudentProfile/SubscriptionTable"
import ActivitiesTab from "../../../../../components/users/StudentProfile/ActivitiesTab"

const tabs = [
  "Overview",
  "Classes",
  "Attendance Summary",
  "Subscription",
  "Activities"
] as const;
type Tab = typeof tabs[number];

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      let email = await getEmailById(id);
      if (!email) {
        setProfile(null);
        setLoading(false);
        return;
      }
      // Fetch detailed student profile
      const res = await fetch(`https://apis.dojoconnect.app/user_profile_detailed/${email}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) return <MainLayout><div>Loading...</div></MainLayout>;
if (!profile) return <MainLayout><div>User not found</div></MainLayout>;
if (!["student", "child"].includes((profile.role || "").toLowerCase())) {
  return <MainLayout><div>Not a Student profile</div></MainLayout>;
}
  return (
    <MainLayout>
      <div className="p-6">
        <ProfileHeader profile={profile} onBack={() => router.push('/dashboard?tab=users')} />
        <ProfileTabs tabs={[...tabs]} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "Overview" && <ProfileOverview profile={profile} />}
        {activeTab === "Classes" && <ClassesTab classes={profile.enrolled_classes || []} />}
        {activeTab === "Attendance Summary" && <AttendanceSummary summary={profile.attendance_summary || {}} />}
        {activeTab === "Subscription" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="h-full flex flex-col">
                <SubscriptionSummary summary={profile.subscription || {}} />
              </div>
              <div className="h-full flex flex-col">
                <PaymentMethod method={profile.payment_method || {}} />
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center justify-between bg-white-200 px-4 py-3 rounded-md border-b border-gray-200 mb-2">
                <span className="font-semibold text-gray-700 text-lg">Billing history</span>
                <button className="flex items-center bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h12"/>
                  </svg>
                  Download
                </button>
              </div>
              <div className="mt-4">
                <SubscriptionTable data={profile.subscription_history || []} />
              </div>
            </div>
          </>
        )}
        {activeTab === "Activities" && <ActivitiesTab activities={profile.activity_log || []} />}
      </div>
    </MainLayout>
  );
}

// Helper to get email by id
async function getEmailById(id: string | string[]) {
  const res = await fetch("https://backoffice-api.dojoconnect.app/get_users");
  const data = await res.json();
  const user = data.data.find((u: any) => String(u.id) === String(id));
  return user?.email || null;
}