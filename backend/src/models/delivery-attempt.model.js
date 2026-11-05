import mongoose from 'mongoose'

const deliveryAttemptSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attemptNumber: { type: Number, required: true },
  statusCode: Number,
  responseBody: String,
  requestHeaders: { type: mongoose.Schema.Types.Mixed },
  latencyMs: Number,
  error: String,
  executedAt: { type: Date, default: Date.now },
}, { timestamps: false })

deliveryAttemptSchema.index({ eventId: 1, attemptNumber: 1 }, { unique: true })
export const DeliveryAttempt = mongoose.model('DeliveryAttempt', deliveryAttemptSchema)
