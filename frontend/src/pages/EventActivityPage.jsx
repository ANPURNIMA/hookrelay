import { useState } from 'react'
import { EventDrawer } from '../components/EventDrawer.jsx'
import { EventTable } from '../components/EventTable.jsx'
import { api } from '../api/client.js'
import { useDeliveryStream } from '../hooks/use-delivery-stream.js'
import { normalizeEvent } from '../utils/events.js'

export function EventActivityPage() {
  const { events } = useDeliveryStream()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  async function inspect(event) {
    setSelectedEvent(event); setDetail(null)
    if (!event.eventId || event.eventId.includes('…')) return
    setLoading(true)
    try { setDetail(normalizeEvent((await api.getEvent(event.eventId)).data)) } catch { /* sample event */ } finally { setLoading(false) }
  }
  return <div className="space-y-6"><section><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5e809c]">Delivery log</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">Event activity</h2><p className="mt-1 text-sm text-[#6f7a88]">A live, inspectable record of outbound delivery attempts.</p></section><EventTable events={events} onSelect={inspect} /><EventDrawer event={selectedEvent} detail={detail} loading={loading} onClose={() => { setSelectedEvent(null); setDetail(null) }} /></div>
}
