import mongoose from 'mongoose'

const endpointSchema = new mongoose.Schema({
  subscriberId: { type: String, required: true, index: true },
  targetUrl: { type: String, required: true },
  secretKey: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true },
  // New installs use requests/second. rateLimitPerMin remains for backwards compatibility.
  rateLimitPerSecond: { type: Number, min: 0.1, default: 50 },
  burstCapacity: { type: Number, min: 1 },
  rateLimitPerMin: { type: Number, default: 60, min: 1 },
}, { timestamps: true })

endpointSchema.index({ subscriberId: 1, targetUrl: 1 }, { unique: true })
export const Endpoint = mongoose.model('Endpoint', endpointSchema)
