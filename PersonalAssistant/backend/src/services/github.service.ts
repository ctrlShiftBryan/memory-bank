import { Octokit } from "@octokit/rest";
import { db } from "../config/database";
import { activities } from "../db/schema";

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchUserActivities(username: string, userId: string) {
    try {
      // Fetch user events
      const { data: events } = await this.octokit.request(
        "GET /users/{username}/events",
        {
          username,
          per_page: 100,
        }
      );

      // Process and store activities
      const processedActivities = events.map((event) => ({
        userId,
        sourceId: "github-source-id",
        type: event.type || "unknown",
        title: this.generateTitle(event),
        description: this.generateDescription(event),
        metadata: {
          repo: event.repo.name,
          payload: event.payload,
        },
        timestamp: event.created_at ? new Date(event.created_at) : new Date(),
      }));

      // Batch insert activities if there are any
      if (processedActivities.length > 0) {
        await db.insert(activities).values(processedActivities);
      }

      return processedActivities;
    } catch (error) {
      console.error("GitHub fetch error:", error);
      throw error;
    }
  }

  private generateTitle(event: any): string {
    switch (event.type) {
      case "PushEvent":
        return `Pushed ${event.payload.commits?.length || 1} commits to ${
          event.repo.name
        }`;
      case "PullRequestEvent":
        return `${event.payload.action} PR #${event.payload.pull_request.number} in ${event.repo.name}`;
      case "IssuesEvent":
        return `${event.payload.action} issue #${event.payload.issue.number} in ${event.repo.name}`;
      default:
        return `${event.type} in ${event.repo.name}`;
    }
  }

  private generateDescription(event: any): string {
    switch (event.type) {
      case "PushEvent":
        const commits = event.payload.commits || [];
        return commits
          .map((c: any) => `- ${c.message}`)
          .join("\n")
          .substring(0, 500);
      case "PullRequestEvent":
        return event.payload.pull_request?.title || "";
      case "IssuesEvent":
        return event.payload.issue?.title || "";
      default:
        return "";
    }
  }
}