/**
 * Shared Redis connection for BullMQ queues and workers.
 *
 * Supports both Upstash Redis (cloud, TLS required) and local Redis.
 * Upstash requires TLS and `rediss://` protocol.
 * BullMQ requires `maxRetriesPerRequest: null`.
 */

import IORedis from "ioredis";

const REDIS_URL =
  process.env.UPSTASH_REDIS_URL ||
  process.env.REDIS_URL ||
  "redis://localhost:6379";

// Detect Upstash (requires TLS) or rediss:// protocol
const isUpstash = REDIS_URL.includes("upstash.io");
const isTLS = REDIS_URL.startsWith("rediss://");

// Single shared Redis connection — reused by queues and workers
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Recommended for Upstash compatibility
  tls: isUpstash || isTLS ? {} : undefined, // Upstash enforces TLS
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});

redisConnection.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redisConnection.on("connect", () => {
  console.log(
    `[Redis] Connected to ${isUpstash ? "Upstash" : "local"} Redis`
  );
});
