import { CheckCircle2, Clock3, Gauge, OctagonAlert } from 'lucide-react'

export function TelemetryStrip({ events }) {
  const delivered = events.filter((event) => event.status === 'delivered')
  const latencies = delivered.map((event) => event.latencyMs).filter(Number.isFinite).sort((a, b) => a - b)
  const p95 = latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)] ?? 0
  const metrics = [
    { label: 'Total events processed', value: events.length.toLocaleString(), suffix: 'events', icon: Gauge, tone: 'text-signal-blue' },
    { label: 'Success rate', value: events.length ? ((delivered.length / events.length) * 100).toFixed(2) : '0.00', suffix: '%', icon: CheckCircle2, tone: 'text-signal-green' },
    { label: 'P95 latency', value: p95, suffix: 'ms', icon: Clock3, tone: 'text-signal-amber', detail: 'LIVE SAMPLE WINDOW' },
    { label: 'Active DLQ', value: events.filter((event) => event.status === 'failed_dlq').length, suffix: 'tasks', icon: OctagonAlert, tone: 'text-signal-red' },
  ]
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map(({ label, value, suffix, icon: Icon, tone, detail }) => <div key={label} className="rounded-lg border border-[#e0e5e9] bg-white p-4 shadow-[0_1px_1px_rgba(16,24,40,0.02)] dark:border-[#2d3945] dark:bg-[#18212b]">
      <div className="mb-5 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f8995]">{label}</span><Icon size={16} className={tone} /></div>
      <div className="flex items-end gap-1.5"><span className="font-mono text-[26px] font-medium tracking-tight text-[#172033] dark:text-[#edf3f7]">{value}</span><span className="mb-1 font-mono text-[11px] text-[#7c8794]">{suffix}</span></div>
      {detail && <p className="mt-2 text-[10px] font-semibold tracking-[0.08em] text-[#a86d13]">{detail}</p>}
    </div>)}
  </section>
}
