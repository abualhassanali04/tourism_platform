import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import GovernoratePage from './pages/GovernoratePage'
import PlacePage from './pages/PlacePage'
import GuidesPage from './pages/GuidesPage'
import GuideDetailPage from './pages/GuideDetailPage'
import TripsPage from './pages/TripsPage'
import GroupsPage from './pages/GroupsPage'
import PassportPage from './pages/PassportPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminSetupPage from './pages/AdminSetupPage'
import AdminPlacePage from './pages/AdminPlacePage'
import { useI18n } from './i18n/I18nContext'

function NotFound() {
  const { t } = useI18n()
  return <h1>{t('common.notFound')}</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/governorates/:id" element={<GovernoratePage />} />
        <Route path="/places/:id" element={<PlacePage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:id" element={<GuideDetailPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route
          path="/passport"
          element={
            <ProtectedRoute roles={['Tourist']}>
              <PassportPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/setup" element={<AdminSetupPage />} />
        <Route
          path="/admin/places/new"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminPlacePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout wide><RegisterPage /></AuthLayout>} />
    </Routes>
  )
}
