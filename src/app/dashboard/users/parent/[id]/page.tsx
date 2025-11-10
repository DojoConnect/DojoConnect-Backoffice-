"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../../../components/Dashboard/MainLayout';
import ProfileHeader from '../../../../../components/users/ParentProfile/ProfileHeader';
import ProfileTabs from '../../../../../components/users/ParentProfile/ProfileTabs';
import ProfileOverview from '../../../../../components/users/ParentProfile/ProfileOverview';
import EnrolledChildren from '../../../../../components/users/ParentProfile/EnrolledChildren';
import EnrolledClasses from '../../../../../components/users/ParentProfile/EnrolledClasses';
import ChildrenTable from '../../../../../components/users/ParentProfile/ChildrenTable';
import ClassesTable from '../../../../../components/users/ParentProfile/ClassTable'; // <-- FIXED
import ActivitiesTable from '../../../../../components/users/ParentProfile/ActivitiesTable';
import SubscriptionTable from "../../../../../components/users/ParentProfile/SubscriptionTable";
import SubscriptionSummary from "../../../../../components/users/ParentProfile/SubscriptionSummary";
import PaymentMethod from "../../../../../components/users/ParentProfile/PaymentMethod";import SearchActionBar from '../../../../../components/users/ParentProfile/SearchActionBar';
import SearchActionBarCreateNew from '../../../../../components/users/ParentProfile/SearchActionBarCreateNew';
import Pagination from '../../../../../components/users/Pagination';

const tabs = [
  "Overview",
  "Children",
  "Classes",
  "Subscription",
  "Activities"
] as const;
type Tab = typeof tabs[number];

export default function ParentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string | string[] | undefined;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const reUsers = await fetch("https://www.backoffice-api.dojoconnect.app/get_users");
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
  if ((profile.role || profile.userType) !== "parent") {
    return <MainLayout><div>Not a Parent profile</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <ProfileHeader profile={profile} onBack={() => router.push('/dashboard?tab=users')} />
        <ProfileTabs tabs={[...tabs]} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-8">
          {activeTab === "Overview" && (
            <>
              <ProfileOverview profile={profile} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                <EnrolledChildren childrenData={profile.enrolled_children || []} />
                <EnrolledClasses classesData={profile.enrolled_classes || []} />
              </div>
            </>
          )}
          {activeTab === "Children" && (
            <div>
              <ChildrenTable childrenData={profile.enrolled_children || []} />
            </div>
          )}
          {activeTab === "Classes" && (
            <div>
              <ClassesTable classesData={profile.enrolled_classes || []} />
            </div>
          )}
          {activeTab === "Subscription" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SubscriptionSummary summary={profile.subscription_status} />
                <PaymentMethod method={profile.payment_method} />
              </div>
              <div className="mt-8">
                <div className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md mb-2">
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
          {activeTab === "Activities" && (
            <div>
              <ActivitiesTable activitiesData={profile.activities || []} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}