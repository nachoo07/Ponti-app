import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from '../../pages/home/ui/HomePage'
import { LoginPage } from '../../pages/login/ui/LoginPage'
import { WorkOrdersPage } from '../../pages/work-order/ui/WorkOrderPage'
import { WorkOrderDraftsPage } from '../../pages/work-order-drafts/ui/WorkOrderDraftsPage'
import { WorkOrderDraftDetailPage } from '../../pages/work-order-drafts/ui/WorkOrderDraftDetailPage'
import { Navbar } from '../../widgets/navbar/Navbar'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

function AppLayout() {
  const location = useLocation()
  const showNavbar = location.pathname !== '/' && location.pathname !== '/login'

  return (
    <>
      {showNavbar ? <Navbar /> : null}

      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-orders"
          element={
            <ProtectedRoute>
              <WorkOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order-drafts"
          element={
            <ProtectedRoute>
              <WorkOrderDraftsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order-drafts/:id"
          element={
            <ProtectedRoute>
              <WorkOrderDraftDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
