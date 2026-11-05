import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { Endpoint } from '../src/models/endpoint.model.js'

const [subscriberId, targetUrl, secretKey] = process.argv.slice(2)
if (!subscriberId || !targetUrl || !secretKey) {
  console.error('Usage: npm run seed:endpoint -- <subscriberId> <targetUrl> <secretKey>')
  process.exit(1)
}
await connectDatabase()
const endpoint = await Endpoint.findOneAndUpdate(
  { subscriberId, targetUrl }, { subscriberId, targetUrl, secretKey, isActive: true }, { new: true, upsert: true, setDefaultsOnInsert: true },
)
console.log(JSON.stringify({ id: endpoint.id, subscriberId: endpoint.subscriberId, targetUrl: endpoint.targetUrl }))
await disconnectDatabase()
