import { Router, Request, Response } from "express";
import { db } from "../config/database";
import { users } from "../db/schema";
import { AuthService } from "../services/auth.service";
import { eq } from "drizzle-orm";

const router = Router();
const authService = new AuthService();

// Register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
      })
      .returning();

    // Generate tokens
    const tokens = authService.generateTokens(newUser.id);

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate tokens
    const tokens = authService.generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Refresh token
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

export { router as authRouter };