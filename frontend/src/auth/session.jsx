import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'hookrelay.console.session'
const SessionContext = createContext(null)

function readSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) }
  catch { return null }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const value = useMemo(() => ({
    session,
    signIn(email) {
      const nextSession = { email, name: email.split('@')[0] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
    },
    signOut() { localStorage.removeItem(STORAGE_KEY); setSession(null) },
  }), [session])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}
