import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import crypto from "crypto";
import { Response } from "express";

export interface ITokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (user: ITokenPayload) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      issuer: "wallet_api",
      audience: "wallet_client",
    } as jwt.SignOptions
  );
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "wallet_api",
    audience: "wallet-client",
  }) as ITokenPayload;
};

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto
    .createHmac("sha256", env.JWT_REFRESH_SECRET)
    .update(token)
    .digest("hex");
}

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(env.JWT_REFRESH_TOKEN_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: env.JWT_REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.JWT_REFRESH_TOKEN_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
