import RedisStore from "rate-limit-redis";
import { logger } from "../../config/logger";
import { redis } from "../../config/redis";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../../config/env";

function createStore(prefix: string): RedisStore {
  try {
    return new RedisStore({
      sendCommand: async (...args: string[]) => {
        const result = await redis.call(args[0], ...args.slice(1));
        return result as string;
      },
      prefix: `ratelimit:${prefix}`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create Redis rate limit store");
    throw err;
  }
}

export const globalRateLimit = () => {
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore("global"),
    message: {
      success: false,
      error: "Too many requests. Please try again later.",
    },
  });
};

export const authRateLimit = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore("auth"),
    message: {
      success: false,
      error: {
        message:
          "Too many authentication attempts. Please try again in 15 minutes",
      },
    },
  });

export const loginRateLimit = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore("login"),
    message: {
      success: true,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many login attempts. Please try again in 15 minutes.",
      },
    },
  });
