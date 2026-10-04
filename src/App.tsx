import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/ui/Feedback'
import PublicLayout from './components/public/PublicLayout'
import HomePage from './pages/public/HomePage'

// Admin is code-split so public visitors never download it.
const LegalPage = lazy(() => import('./pages/public/LegalPage'))
const NotFound = lazy(() => import('./pages/public/NotFound'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const LeadsPage = lazy(() => import('./pages/admin/LeadsPage'))
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'))
const CustomerDetailPage = lazy(() => import('./pages/admin/CustomerDetailPage'))
const ProjectsPage = lazy(() => import('./pages/admin/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/admin/ProjectDetailPage'))
const QuotesPage = lazy(() => import('./pages/admin/QuotesPage'))
const QuoteEditorPage = lazy(() => import('./pages/admin/QuoteEditorPage'))
const TicketsPage = lazy(() => import('./pages/admin/TicketsPage'))
const FeedbackPage = lazy(() => import('./pages/admin/FeedbackPage'))
const MessagesPage = lazy(() => import('./pages/admin/MessagesPage'))
const GalleryAdminPage = lazy(() => import('./pages/admin/GalleryAdminPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))

function FullPageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="privacy" element={<LegalPage kind="privacy" />} />
            <Route path="terms" element={<LegalPage kind="terms" />} />
          </Route>

          <Route path="admin/login" element={<LoginPage />} />
          <Route path="admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="quotes" element={<QuotesPage />} />
            <Route path="quotes/new" element={<QuoteEditorPage />} />
            <Route path="quotes/:id" element={<QuoteEditorPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="gallery" element={<GalleryAdminPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
