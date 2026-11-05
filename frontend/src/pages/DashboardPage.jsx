import { useState } from 'react'
import { EventDrawer } from '../components/EventDrawer.jsx'
import { EventTable } from '../components/EventTable.jsx'
import { SimulatorDock } from '../components/SimulatorDock.jsx'
import { TelemetryStrip } from '../components/TelemetryStrip.jsx'
import { api } from '../api/client.js'
import { useDeliveryStream } from '../hooks/use-delivery-stream.js'
import { normalizeEvent } from '../utils/events.js'

const subscriberId = import.meta.env.VITE_DEMO_SUBSCRIBER_ID
const endpointId = import.meta.env.VITE_DEMO_ENDPOINT_ID

export function DashboardPage() {
  const { events, connection } = useDeliveryStream()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [simulating, setSimulating] = useState(false)

  async function inspect(event) {
    setSelectedEvent(event); setDetail(null)
    if (!event.eventId || event.eventId.includes('…')) return
    setLoadingDetail(true)
    try { setDetail(normalizeEvent((await api.getEvent(event.eventId)).data)) }
    catch { /* Local sample rows do not have a persisted record. */ }
    finally { setLoadingDetail(false) }
  }

  async function simulate(scenario) {
    if (!subscriberId || !endpointId || endpointId.startsWith('replace-')) {
      window.alert('Add VITE_DEMO_SUBSCRIBER_ID and VITE_DEMO_ENDPOINT_ID to frontend/.env to enable simulations.')
      return
    }
    setSimulating(true)
    try {
      const prefix = `console-${scenario}-${Date.now()}`
      await Promise.all(Array.from({ length: 50 }, (_, index) => api.createEvent({
        subscriberId, endpointId, eventType: `console.simulation.${scenario}`,
        payload: { scenario, sequence: index + 1, emittedAt: new Date().toISOString() },
        idempotencyKey: `${prefix}-${index}`,
      })))
    } catch (error) { window.alert(`Could not enqueue test traffic: ${error.message}`) }
    finally { setSimulating(false) }
  }

  return <div className="space-y-6"><section className="flex flex-col justify-between gap-4 border-b border-[#dfe4e9] pb-6 md:flex-row md:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5e809c]">Delivery health</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">Operations at a glance</h2><p className="mt-1 text-sm text-[#6f7a88]">Watch delivery outcomes, inspect retries, and exercise an endpoint safely.</p></div><div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${connection === 'live' ? 'bg-[#eaf6ee] text-[#277448]' : 'bg-[#fff5e8] text-[#9a6517]'}`}><span className={`h-1.5 w-1.5 rounded-full ${connection === 'live' ? 'bg-[#2d8a57]' : 'bg-[#d98518]'}`} />{connection === 'live' ? 'Delivery stream connected' : 'Reconnecting to delivery stream'}</div></section>
    <TelemetryStrip events={events} />
    <SimulatorDock onSimulate={simulate} isSimulating={simulating} />
    <EventTable events={events.slice(0, 8)} onSelect={inspect} />
    <EventDrawer event={selectedEvent} detail={detail} loading={loadingDetail} onClose={() => { setSelectedEvent(null); setDetail(null) }} />
  </div>
}
