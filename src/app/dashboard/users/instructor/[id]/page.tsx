
"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../../../components/Dashboard/MainLayout';
import Overview from '../../../../../components/users/InstructorProfile/Overview';
import ProfileHeader from "../../../../../components/users/InstructorProfile/ProfileHeader";
import ProfileTabs from "../../../../../components/users/InstructorProfile/ProfileTabs";
import AssignedClassesTable from "../../../../../components/users/InstructorProfile/AssignedClassesTable";
import ActivitiesTable from "../../../../../components/users/InstructorProfile/ActivitiesTable";

const tabs = [
  "Overview",
  "Assigned Classes",
  "Activites",
] as const;
type Tab = typeof tabs[number];

export default function InstructorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     async function fetchProfile() {
      setLoading(true);
      setError(null);
      if (typeof id === "undefined") {
        setProfile(null);
        setEmail(null);
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

        

        // Get detailed profile
       const resProfile = await fetch(`https://apis.dojoconnect.app/user_profile_detailed/${user.email}`);
if (!resProfile.ok) throw new Error("Profile not found for this email.");
const profileData = await resProfile.json();
setProfile(profileData.data); 
console.log("Fetched profile:", profileData.data);
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
if ((profile.role || profile.userType) !== "instructor") {
  return <MainLayout><div>Not an Instructor profile</div></MainLayout>;
}
  return (
   <MainLayout>
      <div className="p-6">
        <ProfileHeader profile={profile} onBack={() => router.push('/dashboard?tab=users')} />
        <ProfileTabs tabs={[...tabs]} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "Overview" && email && <Overview profile={profile} email={email} />}
        {activeTab === "Assigned Classes" && (
          <div className="mt-6">
            <AssignedClassesTable assignedClasses={profile.assigned_classes || []} />
          </div>
        )}
        {activeTab === "Activites" && (
          <div className="mt-6">
            <ActivitiesTable activitiesList={profile.activity_log || []} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}