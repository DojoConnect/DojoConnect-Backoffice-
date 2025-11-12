'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '../../../../../components/Dashboard/MainLayout'
import ProfileHeader from "../../../../../components/users/AdminProfile/ProfileHeader"
import ProfileTabs from "../../../../../components/users/AdminProfile/ProfileTabs"
import ProfileOverview from "../../../../../components/users/AdminProfile/Overview"
import InstructorsTab from "../../../../../components/users/AdminProfile/InstructorsTab"
import ClassesTab from "../../../../../components/users/AdminProfile/ClassesTab"
import ParentsTab from "../../../../../components/users/AdminProfile/ParentsTab"
import StudentsTab from "../../../../../components/users/AdminProfile/StudentsTab"
import SubscriptionTab from "../../../../../components/users/AdminProfile/SubscriptionTab"
import SubscriptionSummary from "../../../../../components/users/AdminProfile/SubscriptionSummary"
import PaymentMethod from "../../../../../components/users/AdminProfile/PaymentMethod";
import ActivitiesTab from "../../../../../components/users/AdminProfile/ActivitiesTab" 
import Calendar from "../../../../../components/users/AdminProfile/Calendar"

const tabs = [
  "Overview",
  "Instructors",
  "Classes",
  "Parents",
  "Students",
  "Calendar",
  "Subscription",
  "Activities"
] as const;
type Tab = typeof tabs[number];

export default function AdminProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      if (!id) {
        setProfile(null);
        setLoading(false);
        setError("No user ID provided.");
        return;
      }
      try {
        // Get email by id
        const resUsers = await fetch("https://www.backoffice-api.dojoconnect.app/get_users");
        if (!resUsers.ok) throw new Error("Failed to fetch users");
        const usersData = await resUsers.json();
        const user = usersData.data.find((u: any) => String(u.id) === String(id));
        if (!user?.email) {
          setProfile(null);
          setEmail(null);
          setLoading(false);
          setError("User not found.");
          return;
        }
        setEmail(user.email);

        // Get detailed profile (role-specific)
        const resProfile = await fetch(`https://apis.dojoconnect.app/user_profile_detailed/${user.email}`);
        if (!resProfile.ok) throw new Error("Profile not found for this email.");
        const profileData = await resProfile.json();
        setProfile(profileData.data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
        setProfile(null);
        setEmail(null);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) return <MainLayout><div>Loading...</div></MainLayout>;
  if (!profile) return <MainLayout><div>{error}</div></MainLayout>;
  if ((profile.role || profile.userType) !== "admin") {
    return <MainLayout><div>Not an Admin profile</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <ProfileHeader profile={profile} onBack={() => router.push('/dashboard?tab=users')} />
        <ProfileTabs tabs={[...tabs]} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "Overview" && <ProfileOverview profile={profile} />}
        {activeTab === "Instructors" && (
          <InstructorsTab instructors={profile.overview_metrics?.total_instructors || 0} />
        )}
        {activeTab === "Classes" && (
          <ClassesTab classes={profile.owned_classes || []} />
        )}
        {activeTab === "Parents" && (
          <ParentsTab parents={profile.overview_metrics?.total_parents || 0} />
        )}
        {activeTab === "Students" && (
          <StudentsTab students={profile.overview_metrics?.total_students || 0} />
        )}
        {activeTab === "Calendar" && (
          <Calendar events={profile.calendars || []} />
        )}
        {activeTab === "Subscription" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="h-full flex flex-col">
                <SubscriptionSummary summary={profile.subscription || null} />
              </div>
              <div className="h-full flex flex-col">
                <PaymentMethod method={profile.payment_method || null} />
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
                <SubscriptionTab data={profile.subscription_history || []} />
              </div>
            </div>
          </>
        )}
        {activeTab === "Activities" && (
          <ActivitiesTab activities={profile.activities || []} />
        )}
      </div>
    </MainLayout>
  );
}