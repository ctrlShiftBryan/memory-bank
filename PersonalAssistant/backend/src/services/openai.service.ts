import { AzureOpenAI } from "openai";
import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";
import { config } from "../config/env";

interface DailySummary {
  text: string;
  insights: {
    executiveSummary: string;
    timeAllocation: Array<{ category: string; percentage: number }>;
    productivityInsights: string[];
    keyAchievements: string[];
    areasOfConcern: string[];
  };
  priorities: string[];
}

export class OpenAIService {
  private client: AzureOpenAI;

  constructor() {
    const credential = new DefaultAzureCredential();
    const azureADTokenProvider = getBearerTokenProvider(
      credential,
      "https://cognitiveservices.azure.com/.default"
    );

    this.client = new AzureOpenAI({
      azureADTokenProvider,
      apiVersion: "2024-10-21",
      azure: {
        endpoint: config.AZURE_OPENAI_ENDPOINT,
      },
    });
  }

  async generateDailySummary(activities: any[], date: Date): Promise<DailySummary> {
    const prompt = this.buildSummaryPrompt(activities, date);

    const response = await this.client.chat.completions.create({
      model: config.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are an intelligent personal assistant that analyzes daily activities and provides actionable insights. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return this.parseSummaryResponse(content);
  }

  private buildSummaryPrompt(activities: any[], date: Date): string {
    return `
    Analyze my activities for ${date.toLocaleDateString()} and provide a JSON response with the following structure:
    
    {
      "text": "A comprehensive summary of the day's activities",
      "insights": {
        "executiveSummary": "2-3 sentences highlighting key accomplishments",
        "timeAllocation": [
          {"category": "category name", "percentage": number}
        ],
        "productivityInsights": ["insight 1", "insight 2", ...],
        "keyAchievements": ["achievement 1", "achievement 2", ...],
        "areasOfConcern": ["concern 1", "concern 2", ...]
      },
      "priorities": ["priority 1 for tomorrow", "priority 2", ...]
    }
    
    ## Activities Data
    ${JSON.stringify(activities, null, 2)}
    `;
  }

  private parseSummaryResponse(content: string): DailySummary {
    try {
      const parsed = JSON.parse(content);
      return {
        text: parsed.text || "No summary available",
        insights: {
          executiveSummary: parsed.insights?.executiveSummary || "",
          timeAllocation: parsed.insights?.timeAllocation || [],
          productivityInsights: parsed.insights?.productivityInsights || [],
          keyAchievements: parsed.insights?.keyAchievements || [],
          areasOfConcern: parsed.insights?.areasOfConcern || [],
        },
        priorities: parsed.priorities || [],
      };
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      throw new Error("Failed to parse AI summary");
    }
  }

  async generateWorkPriorities(recentActivities: any[], upcomingTasks: any[]) {
    const response = await this.client.chat.completions.create({
      model: config.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a productivity expert who helps prioritize work based on past activities and upcoming commitments.",
        },
        {
          role: "user",
          content: this.buildPriorityPrompt(recentActivities, upcomingTasks),
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  }

  private buildPriorityPrompt(recentActivities: any[], upcomingTasks: any[]): string {
    return `
    Based on recent activities and upcoming tasks, generate a prioritized work plan.
    
    Recent Activities:
    ${JSON.stringify(recentActivities, null, 2)}
    
    Upcoming Tasks:
    ${JSON.stringify(upcomingTasks, null, 2)}
    
    Return a JSON object with:
    {
      "priorities": [
        {
          "rank": 1,
          "task": "task description",
          "reason": "why this is important",
          "estimatedTime": "time estimate"
        }
      ],
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
    `;
  }
}