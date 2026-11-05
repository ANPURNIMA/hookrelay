import { LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../auth/session.jsx'

export function SettingsPage() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  function leaveConsole() { signOut(); navigate('/sign-in') }
  return <div className="max-w-3xl space-y-6"><section><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5e809c]">Console preferences</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">Workspace settings</h2><p className="mt-1 text-sm text-[#6f7a88]">Manage the local developer session used by this dashboard.</p></section><section className="rounded-lg border border-[#e0e5e9] bg-white"><div className="flex items-center gap-4 p-5"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf0f6] text-[#355b78]"><UserRound size={18} /></div><div><p className="text-sm font-semibold">{session?.name}</p><p className="text-sm text-[#798491]">{session?.email}</p></div></div><div className="flex items-center justify-between border-t border-[#e8ebee] px-5 py-4"><div><p className="text-sm font-medium">Sign out of this console</p><p className="mt-0.5 text-xs text-[#7e8792]">This clears the browser-only development session.</p></div><button onClick={leaveConsole} className="inline-flex items-center gap-2 rounded-md border border-[#e4c4c1] bg-[#fffafa] px-3 py-2 text-xs font-semibold text-[#ad3e36] hover:bg-[#fff0ef]"><LogOut size={14} />Sign out</button></div></section></div>
}
