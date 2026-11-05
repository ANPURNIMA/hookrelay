import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { demoEvents } from '../data/demo-events.js'
import { normalizeEvent } from '../utils/events.js'

const MAX_VISIBLE_EVENTS = 80

export function useDeliveryStream() {
  const [events, setEvents] = useState(demoEvents)
  const [connection, setConnection] = useState('connecting')

  useEffect(() => {
    const source = new EventSource(api.streamUrl)
    source.addEventListener('connected', () => setConnection('live'))
    source.addEventListener('delivery', ({ data }) => {
      const event = normalizeEvent(JSON.parse(data))
      setEvents((current) => [event, ...current.filter((item) => item.eventId !== event.eventId)].slice(0, MAX_VISIBLE_EVENTS))
      setConnection('live')
    })
    source.onerror = () => setConnection('reconnecting')
    return () => source.close()
  }, [])

  function replaceEvent(eventId, change) {
    setEvents((current) => current.map((event) => event.eventId === eventId ? { ...event, ...change, emittedAt: new Date().toISOString() } : event))
  }

  return { events, connection, replaceEvent }
}
