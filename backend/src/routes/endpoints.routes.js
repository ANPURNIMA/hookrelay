import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler.js'
import { Endpoint } from '../models/endpoint.model.js'
import { getCircuitState } from '../services/circuit-breaker.service.js'

const router = Router()
const schema = z.object({
  subscriberId: z.string().min(1), targetUrl: z.string().url(), secretKey: z.string().min(32),
  rateLimitPerSecond: z.number().positive().default(50),
  burstCapacity: z.number().positive().default(10),
  rateLimitPerMin: z.number().int().positive().max(100_000).default(60),
})

// This route is normally protected by subscriber-management auth; it is included to make the core runnable.
router.post('/', asyncHandler(async (req, res) => {
  const endpoint = await Endpoint.create(schema.parse(req.body))
  res.status(201).json({ data: { id: endpoint.id, subscriberId: endpoint.subscriberId, targetUrl: endpoint.targetUrl } })
}))

// Dashboard polling route. The state is shared by every worker through Redis.
router.get('/:id/circuit', asyncHandler(async (req, res) => {
  const endpoint = await Endpoint.findById(req.params.id).select('_id').lean()
  if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' })
  res.json({ endpointId: String(endpoint._id), data: await getCircuitState(endpoint._id) })
}))
export default router
