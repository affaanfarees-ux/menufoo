import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Navbar from './components/Navbar'
import PhysicsCube from './components/PhysicsCube'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Lunches from './pages/Lunches'
import Calendar from './pages/Calendar'
import Recommendations from './pages/Recommendations'
import WeeklyPlanner from './pages/WeeklyPlanner'
import ShoppingList from './pages/ShoppingList'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
}

function ParentRoute({ children }) {
  const { userProfile } = useAuth()
  if (!userProfile) return null
  return userProfile.role === 'parent' ? children : <Navigate to="/lunches" replace />
}

function AppRoutes() {
  const { currentUser } = useAuth()
  const { cubeEnabled } = useTheme()

  return (
    <>
      {cubeEnabled && <PhysicsCube />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/lunches" /> : <Login />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/lunches" /> : <Signup />} />

        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/lunches" element={<Lunches />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/recommend" element={<Recommendations />} />
                    <Route path="/planner" element={<ParentRoute><WeeklyPlanner /></ParentRoute>} />
                    <Route path="/shopping" element={<ParentRoute><ShoppingList /></ParentRoute>} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/lunches" replace />} />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/lunches" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
