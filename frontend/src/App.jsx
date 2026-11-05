import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SessionProvider, useSession } from './auth/session.jsx'
import { ConsoleShell } from './components/ConsoleShell.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { DlqPage } from './pages/DlqPage.jsx'
import { EndpointsPage } from './pages/EndpointsPage.jsx'
import { EventActivityPage } from './pages/EventActivityPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { SignInPage } from './pages/SignInPage.jsx'
import { ThemeProvider } from './theme/theme.jsx'

function ProtectedConsole() {
  const { session } = useSession()
  return session ? <ConsoleShell /> : <Navigate to="/sign-in" replace />
}

export default function App() {
  return <ThemeProvider><SessionProvider><BrowserRouter><Routes>
    <Route path="/sign-in" element={<SignInPage />} />
    <Route element={<ProtectedConsole />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/events" element={<EventActivityPage />} />
      <Route path="/dead-letter" element={<DlqPage />} />
      <Route path="/endpoints" element={<EndpointsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></SessionProvider></ThemeProvider>
}
