import { Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { StatusTag } from './StatusTag.jsx'

function relativeTime(date) {
  const elapsed = Math.max(0, Date.now() - new Date(date).getTime())
  return elapsed < 1000 ? `+${elapsed}ms ago` : `+${Math.round(elapsed / 1000)}s ago`
}

export function EventTable({ events, onSelect }) {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null)

  async function copyEndpoint(endpoint) {
    try {
      await navigator.clipboard.writeText(endpoint)
      setCopiedEndpoint(endpoint)
      window.setTimeout(() => setCopiedEndpoint(null), 1600)
    } catch { window.alert('Your browser did not allow copying this endpoint.') }
  }

  return <section className="overflow-hidden rounded-lg border border-[#e0e5e9] bg-white dark:border-[#2d3945] dark:bg-[#18212b]">
    <div className="flex items-center justify-between border-b border-[#e8ebee] px-5 py-4 dark:border-[#2d3945]"><div><h2 className="text-sm font-semibold text-[#263342] dark:text-[#edf3f7]">Event stream</h2><p className="mt-0.5 text-xs text-[#7a8591]">Latest delivery outcomes</p></div><span className="rounded-full bg-[#f1f4f7] px-2.5 py-1 font-mono text-[10px] text-[#6f7b89] dark:bg-[#263340]">{events.length} IN VIEW</span></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left">
      <thead className="border-b border-[#e7eaed] bg-[#fafbfc] dark:border-[#2d3945] dark:bg-[#202a35]"><tr className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#88929e]"><th className="px-5 py-3 font-medium">Result</th><th className="px-3 py-3 font-medium">Event</th><th className="px-3 py-3 font-medium">Target</th><th className="px-3 py-3 text-right font-medium">Latency</th><th className="px-5 py-3 text-right font-medium">Observed</th></tr></thead>
      <tbody>{events.map((event, index) => <tr key={`${event.eventId}-${index}`} onClick={() => onSelect(event)} className="cursor-pointer border-b border-[#edf0f2] transition-colors hover:bg-[#f7fafc] dark:border-[#26313c] dark:hover:bg-[#202a35]">
        <td className="px-4 py-3"><StatusTag {...event} /></td>
        <td className="px-3 py-3"><p className="font-mono text-xs text-[#344150] dark:text-[#dce5ec]">{event.eventId}</p><p className="mt-1 font-mono text-[10px] text-[#82909c]">{event.eventType}</p></td>
        <td className="max-w-[320px] px-3 py-3"><div className="flex items-center gap-2"><span className="truncate font-mono text-[11px] text-[#607080]">{event.endpoint}</span><button onClick={(e) => { e.stopPropagation(); copyEndpoint(event.endpoint) }} aria-label="Copy endpoint" title={copiedEndpoint === event.endpoint ? 'Copied' : 'Copy endpoint'} className="text-[#97a1ab] hover:text-[#3f5668]">{copiedEndpoint === event.endpoint ? <span className="text-[10px] font-semibold text-[#2a7d4c]">Copied</span> : <Copy size={13} />}</button><a href={event.endpoint} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open endpoint" title="Open endpoint" className="text-[#97a1ab] hover:text-[#3f5668]"><ExternalLink size={12} /></a></div></td>
        <td className="font-mono px-3 py-3 text-right text-xs text-[#465464]">{event.latencyMs ?? '—'}ms</td>
        <td className="font-mono px-5 py-3 text-right text-[11px] text-[#7d8895]">{relativeTime(event.emittedAt)}</td>
      </tr>)}</tbody>
    </table></div>
  </section>
}
