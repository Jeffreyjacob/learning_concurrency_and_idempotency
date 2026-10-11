import crypto from "crypto";
import { redis } from "../../config/redis";

export function generateOtp(): string {
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
}

export function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
