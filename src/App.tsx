import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import Booking from './pages/Booking'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/protected/ProtectedRoute'
import AuthRoute from './components/protected/AuthRoute'
import Terms from './pages/Terms'
import PrivacyPolicy from './pages/privacy-policy'
import AdminDashboard from './pages/AdminDashboard'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path='/booking'
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/login'
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            }
          />
          <Route
            path='/signup'
            element={
              <AuthRoute>
                <Signup />
              </AuthRoute>
            }
          />
          <Route path='/terms' element={<Terms />} />
          <Route path='/privacy-policy' element={<PrivacyPolicy />} />
          <Route path='/admin-dashboard' element={<AdminDashboard />} />

          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
