import { KeyRound, Link2, ShieldCheck } from 'lucide-react'

const endpointFacts = [
  ['Signing', 'HMAC SHA-256'], ['Timeout', '5 seconds'], ['Retries', '5 attempts'], ['Delivery mode', 'POST / JSON'],
]

export function EndpointsPage() {
  return <div className="space-y-6"><section><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5e809c]">Subscriber registry</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">Endpoints</h2><p className="mt-1 text-sm text-[#6f7a88]">Registered receiver configuration belongs to the delivery service.</p></section>
    <section className="overflow-hidden rounded-lg border border-[#e0e5e9] bg-white"><div className="flex items-center justify-between border-b border-[#e8ebee] px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-md bg-[#edf3f8] text-[#346382]"><Link2 size={17} /></div><div><h3 className="text-sm font-semibold">Endpoint registry</h3><p className="text-xs text-[#7d8794]">Create endpoints with the backend API or seed script.</p></div></div><span className="rounded-full bg-[#eff8f1] px-2.5 py-1 text-[11px] font-medium text-[#2c7c4b]">SECURE DELIVERY</span></div><div className="grid divide-y divide-[#edf0f2] md:grid-cols-2 md:divide-x md:divide-y-0">{endpointFacts.map(([label, value], index) => <div key={label} className="p-5"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#89939f]">{label}</p><p className="mt-1.5 font-mono text-sm text-[#344150]">{value}</p></div>)}</div></section>
    <div className="grid gap-4 md:grid-cols-2"><article className="rounded-lg border border-[#e0e5e9] bg-white p-5"><KeyRound size={18} className="text-[#b08030]" /><h3 className="mt-3 text-sm font-semibold">Secrets stay server-side</h3><p className="mt-1.5 text-sm leading-6 text-[#707b88]">The dashboard never receives subscriber signing keys. It only exposes the signed request metadata saved with an attempt.</p></article><article className="rounded-lg border border-[#e0e5e9] bg-white p-5"><ShieldCheck size={18} className="text-[#2b8050]" /><h3 className="mt-3 text-sm font-semibold">Verify every delivery</h3><p className="mt-1.5 text-sm leading-6 text-[#707b88]">Use the timestamp and HMAC signature in the request drawer to validate receiver-side webhook handling.</p></article></div>
  </div>
}
