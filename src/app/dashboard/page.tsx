// app/dashboard/page.tsx
'use client'
import { Suspense } from 'react'
import MainLayout from "../../components/Dashboard/MainLayout";

export default function DashboardPage() {
  return <Suspense>
    <MainLayout />
  </Suspense>
}
