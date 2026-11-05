import { Send, TestTube2 } from 'lucide-react'
import { useState } from 'react'

export function SimulatorDock({ onSimulate, isSimulating }) {
  const [scenario, setScenario] = useState('normal')
  return <section className="flex flex-col gap-4 rounded-lg border border-[#d7e3ec] bg-[#f9fbfd] p-4 dark:border-[#2d4353] dark:bg-[#17232e] lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-md bg-[#e9f0f6] text-[#3a6c8e] dark:bg-[#213a4c] dark:text-[#9ecbe6]"><TestTube2 size={17} /></div><div><p className="text-sm font-semibold text-[#253447] dark:text-[#edf3f7]">Traffic simulator</p><p className="mt-0.5 text-xs text-[#728090]">Enqueue 50 test events and observe queueing behavior.</p></div></div>
    <div className="flex flex-wrap items-center gap-2"><select value={scenario} onChange={(event) => setScenario(event.target.value)} className="h-9 rounded-md border border-[#d8dee5] bg-white px-3 text-xs text-[#43505e] dark:border-[#405160] dark:bg-[#1a2631] dark:text-[#d9e3eb]"><option value="normal">Normal deliveries</option><option value="flaky">Flaky destination (throws 500s)</option><option value="outage">Complete outage (forces to DLQ)</option></select><button disabled={isSimulating} onClick={() => onSimulate(scenario)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1c526f] px-3 text-xs font-semibold text-white hover:bg-[#17445d] disabled:cursor-wait disabled:opacity-50"><Send size={13} /> {isSimulating ? 'Queueing traffic…' : 'Simulate traffic'}</button></div>
  </section>
}
