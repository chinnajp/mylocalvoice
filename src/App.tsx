import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from '@/contexts/AppContext'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { WelcomePage } from '@/pages/WelcomePage'
import { CitizenLoginPage } from '@/pages/CitizenLoginPage'
import { HomePage } from '@/pages/HomePage'
import { MyReportsPage } from '@/pages/MyReportsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ReportPage } from '@/pages/ReportPage'
import { TrackPage } from '@/pages/TrackPage'
import { MapPage } from '@/pages/MapPage'
import { ComplaintsListPage } from '@/pages/ComplaintsListPage'
import { ComplaintDetailPage } from '@/pages/ComplaintDetailPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminStatisticsPage } from '@/pages/admin/AdminStatisticsPage'
import { AdminComplaintsPage } from '@/pages/admin/AdminComplaintsPage'
import { AdminComplaintManagePage } from '@/pages/admin/AdminComplaintManagePage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminActivityPage } from '@/pages/admin/AdminActivityPage'
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

/** Gate: language → login → public site */
function RequireCitizen() {
  const { languageChosen, citizen } = useApp()
  if (!languageChosen) return <Navigate to="/welcome" replace />
  if (!citizen) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="login" element={<CitizenLoginPage />} />

          <Route element={<RequireCitizen />}>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="my-reports" element={<MyReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="track" element={<TrackPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="complaints" element={<ComplaintsListPage />} />
              <Route path="complaints/:id" element={<ComplaintDetailPage />} />
            </Route>
          </Route>

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="statistics" element={<AdminStatisticsPage />} />
            <Route path="complaints" element={<AdminComplaintsPage />} />
            <Route path="complaints/:id" element={<AdminComplaintManagePage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
