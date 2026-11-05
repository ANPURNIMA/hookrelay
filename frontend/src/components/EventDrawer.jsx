import { X } from 'lucide-react'
import { StatusTag } from './StatusTag.jsx'

const samplePayload = { invoiceId: 'inv_1042', organizationId: 'org_acme', amount: 4999, currency: 'USD' }

export function EventDrawer({ event, detail, loading, onClose }) {
  if (!event) return null
  const attempts = detail?.attempts ?? []
  const payload = detail?.payload ?? samplePayload
  const requestHeaders = attempts.at(-1)?.requestHeaders
  return <aside className="fixed inset-y-0 right-0 z-30 w-full max-w-xl border-l border-[#dfe4e8] bg-white shadow-[-12px_0_30px_rgba(25,39,52,.10)]">
    <header className="flex items-start justify-between border-b border-[#e6e9ed] p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8294]">Delivery inspection</p><h2 className="mt-1 font-mono text-sm text-[#263342]">{event.eventId}</h2></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md border border-[#dbe1e6] text-[#71808e] hover:bg-[#f5f7f8]"><X size={15} /></button></header>
    <div className="space-y-6 overflow-y-auto p-5" style={{ height: 'calc(100vh - 81px)' }}>
      <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#83909c]">Latest result</p><StatusTag {...event} /></section>
      <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#83909c]">Signed request headers</p><pre className="overflow-x-auto rounded-md border border-[#e1e5e8] bg-[#f8fafb] p-3 font-mono text-[11px] leading-5 text-[#506070]">{requestHeaders ? Object.entries(requestHeaders).map(([key, value]) => `${key}: ${value}`).join('\n') : `content-type: application/json\nx-hookrelay-event: ${event.eventType}\nx-hookrelay-timestamp: awaiting delivery\nx-hookrelay-signature: awaiting delivery\nx-idempotency-key: ${detail?.idempotencyKey ?? event.eventId}`}</pre></section>
      <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#83909c]">Payload {loading && <span className="text-[#357394]">LOADING</span>}</p><pre className="overflow-x-auto rounded-md border border-[#e1e5e8] bg-[#f8fafb] p-3 font-mono text-[11px] leading-5 text-[#2d6a8c]">{JSON.stringify(payload, null, 2)}</pre></section>
      <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#83909c]">Attempt timeline</p><div className="border-l border-[#d9e0e5] pl-3">{(attempts.length ? attempts : [event]).map((attempt, index) => <div key={attempt._id ?? index} className="relative pb-3 font-mono text-[11px] text-[#667483] before:absolute before:-left-[17px] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-[#3c8a5c]"><span className="text-[#2f3f4e]">Attempt {attempt.attemptNumber ?? index + 1}</span> · {attempt.statusCode ?? attempt.error ?? 'PENDING'} · {attempt.latencyMs ?? '—'}ms</div>)}</div></section>
    </div>
  </aside>
}
