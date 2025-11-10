'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import MainLayout from '../../../../components/Dashboard/MainLayout';
import Pagination from '../../../../components/classes/Pagination';
import SearchActionBar from '../../../../components/classes/ClassProfile/SearchActionBar';
import ProfileHeader from '../../../../components/classes/ClassProfile/ProfileHeader';
import ProfileTabs from '../../../../components/classes/ClassProfile/ProfileTabs';
import ClassOverview from '../../../../components/classes/ClassProfile/ClassInfo';
import EnrolledStudentsTable from '../../../../components/classes/ClassProfile/EnrolledStudentTable';
import AttendanceTab from "../../../../components/classes/ClassProfile/Attendance";
import SubscriptionTab from "../../../../components/classes/ClassProfile/Subscription";
import ActivitiesTable from "../../../../components/classes/ClassProfile/Activities";
import ClassScheduleCalendar from "../../../../components/classes/ClassProfile/Calendar";
import { transformScheduleToCalendar } from "../../../../components/classes/ClassProfile/transformScheduleToCalendar";

export default function ClassDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const tabs: string[] = [
    "Class Info",
    "Enrolled Student",
    "Class Schedule",
    "Attendance",
    "Subscription",
    "Activities"
  ];
  type Tab = (typeof tabs)[number];
  const [activeTab, setActiveTab] = useState<Tab>("Class Info");

  useEffect(() => {
    if (!id) return;

    async function fetchClassProfile() {
      setLoading(true);
      try {
        const res = await fetch(`https://apis.dojoconnect.app/class_profile/${id}`);
        const data = await res.json();
        if (data && data.success && data.data && data.data.class_info) {
          setProfile({
            ...data.data.class_info,
            enrolled_students: data.data.enrolled_students || [],
            attendance_summary: data.data.attendance_summary || {},
            attendance_rows: data.data.attendance_rows || [],
            subscription_info: data.data.subscription_info || {},
            billing_history: data.data.billing_history || [],
            recent_activities: data.data.recent_activities || [],
            class_schedule: data.data.class_schedule || [],
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        setProfile(null);
      }
      setLoading(false);
    }

    fetchClassProfile();
  }, [id]);

  if (loading) {
    return <MainLayout><div>Loading...</div></MainLayout>;
  }

  if (!profile) {
    return <MainLayout><div>Class not found</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <ProfileHeader
          profile={{
            className: profile.class_name,
            classLevel: profile.level,
            instructor: { name: profile.instructor, avatar: "/instructorImage.png" },
            classAge: profile.age_group,
            frequency: profile.frequency,
            enrolledStudents: profile.enrolled_students?.length || 0,
            location: profile.location,
            status: profile.status,
            dateCreated: profile.created_at,
            classImg: profile.image_path
              ? (profile.image_path.startsWith("http")
                  ? profile.image_path
                  : `https://backoffice-api.dojoconnect.app/${profile.image_path}`)
              : "/classImg.jpg",
            subscriptionType: profile.subscription,
            subscriptionFee: profile.price,
            gradingDate: profile.grading_date,
          }}
          onBack={() => router.push('/dashboard?tab=classes')}
        />

        <ProfileTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-8">
          {activeTab === "Class Info" && <ClassOverview profile={profile} />}
          {activeTab === "Enrolled Student" && (
            <>
              <EnrolledStudentsTable students={profile.enrolled_students} />
              <Pagination
                totalRows={profile.enrolled_students?.length || 0}
                rowsPerPage={rowsPerPage}
                currentPage={page}
                onPageChange={setPage}
              />
            </>
          )}
          {activeTab === "Class Schedule" && (
            <ClassScheduleCalendar schedule={transformScheduleToCalendar(profile.class_schedule)} />
          )}
          {activeTab === "Attendance" && (
            <>
              <AttendanceTab attendance={profile.attendance_summary} rows={profile.attendance_rows} />
              <Pagination
                totalRows={profile.attendance_rows?.length || 0}
                rowsPerPage={rowsPerPage}
                currentPage={page}
                onPageChange={setPage}
              />
            </>
          )}
          {activeTab === "Subscription" && (
            <SubscriptionTab subscription={profile.subscription_info} billing={profile.billing_history} />
          )}
          {activeTab === "Activities" && (
            <>
              <SearchActionBar />
              <ActivitiesTable activities={profile.recent_activities} />
              <Pagination
                totalRows={profile.recent_activities?.length || 0}
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