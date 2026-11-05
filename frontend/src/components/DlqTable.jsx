import { RotateCcw } from 'lucide-react'

export function DlqTable({ events, onReplay, replayingId }) {
  return <section className="overflow-hidden rounded-lg border border-[#e0e5e9] bg-white dark:border-[#2d3945] dark:bg-[#18212b]"><div className="border-b border-[#e8ebee] px-5 py-4 dark:border-[#2d3945]"><h2 className="text-sm font-semibold text-[#263342] dark:text-[#edf3f7]">Quarantined tasks</h2><p className="mt-0.5 text-xs text-[#7a8591]">Exhausted and non-retryable messages</p></div>
      <div className="divide-y divide-[#edf0f2] dark:divide-[#2a3540]">{events.filter((event) => event.status === 'failed_dlq').map((event) => <div key={event.eventId} className="flex items-center justify-between gap-3 px-5 py-4"><div><p className="font-mono text-xs text-[#334252] dark:text-[#dce5ec]">{event.eventId} <span className="text-[#87919c]">{event.eventType}</span></p><p className="mt-1 text-[11px] font-medium text-[#b34842]">HTTP {event.statusCode ?? '—'} · quarantined</p></div><button disabled={replayingId === event.eventId} onClick={() => onReplay(event.eventId)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#b7cedc] px-2.5 text-[11px] font-semibold text-[#2f617d] hover:bg-[#f2f8fb] dark:border-[#3b6079] dark:text-[#a7d4ed] dark:hover:bg-[#1f3342] disabled:cursor-wait disabled:opacity-50"><RotateCcw size={12} /> {replayingId === event.eventId ? 'Queued' : 'Replay task'}</button></div>)}
      {!events.some((event) => event.status === 'failed_dlq') && <p className="p-5 text-sm text-[#7a8591]">No quarantined deliveries.</p>}
    </div>
  </section>
}
