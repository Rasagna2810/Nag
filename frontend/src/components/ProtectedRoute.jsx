import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import Layout from './Layout'

 function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}
export default ProtectedRoute