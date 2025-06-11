import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/env";

interface TokenPayload {
  userId: string;
  type: "access" | "refresh";
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId, type: "access" } as TokenPayload,
      config.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "15m",
        issuer: "personal-assistant-api",
        audience: "personal-assistant-app",
      }
    );

    const refreshToken = jwt.sign(
      { userId, type: "refresh" } as TokenPayload,
      config.JWT_REFRESH_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "7d",
        issuer: "personal-assistant-api",
        audience: "personal-assistant-app",
      }
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string, type: "access" | "refresh"): Promise<TokenPayload> {
    const secret =
      type === "access"
        ? config.JWT_SECRET
        : config.JWT_REFRESH_SECRET;

    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        issuer: "personal-assistant-api",
        audience: "personal-assistant-app",
      }) as TokenPayload;

      if (payload.type !== type) {
        throw new Error("Invalid token type");
      }

      return payload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.validateToken(refreshToken, "refresh");
    return this.generateTokens(payload.userId);
  }
}