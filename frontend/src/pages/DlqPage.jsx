import { useState } from 'react'
import { DlqTable } from '../components/DlqTable.jsx'
import { api } from '../api/client.js'
import { useDeliveryStream } from '../hooks/use-delivery-stream.js'

export function DlqPage() {
  const { events, replaceEvent } = useDeliveryStream()
  const [replayingId, setReplayingId] = useState(null)
  async function replay(eventId) {
    if (eventId.includes('…')) return window.alert('This is a visual sample row. Replay a delivery created through the API to use this action.')
    setReplayingId(eventId)
    try { await api.replayEvent(eventId); replaceEvent(eventId, { status: 'queued', attemptNumber: 0, statusCode: undefined }) }
    catch (error) { window.alert(`Replay could not be started: ${error.message}`) }
    finally { setReplayingId(null) }
  }
  return <div className="space-y-6"><section><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#aa5a43]">Failure handling</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">Dead letter queue</h2><p className="mt-1 text-sm text-[#6f7a88]">Messages that exhausted retries or failed permanently. Replaying resets the delivery lifecycle.</p></section><DlqTable events={events} onReplay={replay} replayingId={replayingId} /></div>
}
