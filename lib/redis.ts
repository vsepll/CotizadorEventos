import { Redis } from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

redis.on('error', (err) => {
  console.error('Redis error:', err)
})

export default redis

