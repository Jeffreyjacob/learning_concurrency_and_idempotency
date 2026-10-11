import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";
import { logger } from "../../config/logger";
import { json, ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(
      {
        err: err.toJSON(),
        path: req.path,
        method: req.method,
      },
      err.message
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    logger.warn(
      {
        validationErrors: formattedErrors,
        path: req.path,
        method: req.method,
      },
      "Validation Failed"
    );

    res.status(400).json({
      success: false,
      error: {
        code: "Validation_error",
        message: "Validation failed",
        details: formattedErrors,
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Record not found",
        },
      });

      return;
    }

    if (err.code === "P2002") {
      const field = (err.meta?.target as string[]).join(", ") || "field";
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLiCT",
          message: ` A record with this ${field} already exist`,
        },
      });

      return;
    }

    logger.error({ prismaCode: err.code, err, path: req.path }, "Prisma error");
    res.status(500).json({
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "A database error occured",
      },
    });

    return;
  }

  if (err instanceof jwt.TokenExpiredError) {
    logger.warn({
      err: err,
      path: req.path,
      method: req.method,
    });

    res.status(401).json({
      success: true,
      error: {
        code: "UNAUTHORIZED",
        message: err.message,
      },
    });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    logger.warn({
      err,
      path: req.path,
      method: req.method,
    });

    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: err.message,
      },
    });
  }

  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      requestId: req.headers["x-request-id"],
    },
    "Unhandled error"
  );

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "development"
          ? err.message
          : "An unexpected error occurred",
    },
  });
}
