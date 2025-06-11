import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    githubToken?: string;
    githubUsername?: string;
  };
}

const authService = new AuthService();

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const payload = await authService.validateToken(token, "access");
    req.user = { id: payload.userId };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
}