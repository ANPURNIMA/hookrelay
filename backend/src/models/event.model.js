import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endpoint', required: true, index: true },
  eventType: { type: String, required: true, trim: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  idempotencyKey: { type: String, required: true },
  status: { type: String, enum: ['queued', 'delivered', 'retrying', 'failed_dlq'], default: 'queued', index: true },
  attemptCount: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 5, min: 1, max: 20 },
  lastError: String,
  lastStatusCode: Number,
  nextAttemptAt: Date,
  deliveredAt: Date,
  failedAt: Date,
}, { timestamps: true })

eventSchema.index({ endpointId: 1, idempotencyKey: 1 }, { unique: true })
eventSchema.index({ status: 1, createdAt: -1 })
export const Event = mongoose.model('Event', eventSchema)
