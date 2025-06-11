import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth.middleware";
import { GitHubService } from "../services/github.service";
import { YouTubePlaylistService } from "../services/youtube.service";
import { FileSystemService } from "../services/fileSystem.service";
import { OpenAIService } from "../services/openai.service";
import { db } from "../config/database";
import { activities, aiSummaries } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { config } from "../config/env";
import multer from "multer";

const router = Router();
router.use(authenticateToken);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Sync all activities
router.post("/sync", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Initialize services
    const githubService = new GitHubService(req.user!.githubToken || "");
    const youtubeService = new YouTubePlaylistService();
    const fileSystemService = new FileSystemService([
      config.CLAUDE_PROJECTS_PATH,
    ]);

    // Set YouTube credentials if available
    if (req.body.youtubeTokens) {
      youtubeService.setCredentials(req.body.youtubeTokens);
    }

    // Fetch activities in parallel
    const [githubActivities, youtubeActivities, localProjects] = await Promise.all([
      req.user!.githubToken && req.user!.githubUsername
        ? githubService.fetchUserActivities(req.user!.githubUsername, userId)
        : Promise.resolve([]),
      req.body.youtubeTokens
        ? youtubeService.syncPlaylistToDatabase(userId)
        : Promise.resolve({ count: 0 }),
      fileSystemService.scanClaudeProjects(userId),
    ]);

    res.json({
      github: githubActivities.length,
      youtube: youtubeActivities.count || 0,
      local: localProjects.length,
      message: "Activities synced successfully",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// YouTube OAuth endpoints
router.get("/youtube/auth", async (req: AuthRequest, res: Response) => {
  try {
    const youtubeService = new YouTubePlaylistService();
    const authUrl = youtubeService.getAuthUrl();
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/youtube/token", async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Authorization code required" });
    }

    const youtubeService = new YouTubePlaylistService();
    const tokens = await youtubeService.getTokens(code);
    
    res.json({ tokens });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add video to tracking playlist
router.post("/youtube/track", async (req: AuthRequest, res: Response) => {
  try {
    const { videoId, tokens } = req.body;
    if (!videoId || !tokens) {
      return res.status(400).json({ error: "Video ID and tokens required" });
    }

    const userId = req.user!.id;
    const youtubeService = new YouTubePlaylistService();
    youtubeService.setCredentials(tokens);
    
    const playlistId = await youtubeService.ensureWatchHistoryPlaylist(userId);
    await youtubeService.addVideoToWatchHistory(videoId, playlistId);
    
    res.json({ success: true, playlistId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate AI summary
router.post("/summary", async (req: AuthRequest, res: Response) => {
  try {
    const { date = new Date() } = req.body;
    const userId = req.user!.id;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch activities for the date
    const dayActivities = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.timestamp, startOfDay),
          lte(activities.timestamp, endOfDay)
        )
      );

    if (dayActivities.length === 0) {
      return res.json({
        message: "No activities found for this date",
        summary: null,
      });
    }

    // Generate summary
    const openaiService = new OpenAIService();
    const summary = await openaiService.generateDailySummary(
      dayActivities,
      new Date(date)
    );

    // Store summary
    await db.insert(aiSummaries).values({
      userId,
      date: new Date(date),
      summary: summary.text,
      insights: summary.insights,
      priorities: summary.priorities,
      modelVersion: "gpt-4.1-turbo",
    });

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get activities for a date range
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    let query = db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId));

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(activities.timestamp, new Date(startDate as string)),
          lte(activities.timestamp, new Date(endDate as string))
        )
      );
    }

    const userActivities = await query;
    res.json(userActivities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI summaries
router.get("/summaries", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summaries = await db
      .select()
      .from(aiSummaries)
      .where(eq(aiSummaries.userId, userId))
      .orderBy(aiSummaries.date);

    res.json(summaries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as activitiesRouter };