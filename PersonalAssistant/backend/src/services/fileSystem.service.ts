import * as path from "path";
import * as fs from "fs/promises";
import { db } from "../config/database";
import { activities } from "../db/schema";

interface ProjectInfo {
  name: string;
  description: string;
  lastModified: Date;
  files: string[];
  languages: string[];
}

export class FileSystemService {
  private readonly allowedPaths: string[];

  constructor(allowedPaths: string[]) {
    this.allowedPaths = allowedPaths.map((p) => path.resolve(p));
  }

  async scanClaudeProjects(userId: string) {
    const projects = [];

    for (const basePath of this.allowedPaths) {
      try {
        const files = await this.recursiveScan(basePath);
        const claudeProjects = files.filter(
          (f) => f.includes(".claude") || f.includes("claude.json")
        );

        for (const projectPath of claudeProjects) {
          const projectInfo = await this.analyzeProject(projectPath);
          projects.push({
            userId,
            sourceId: "local-source-id",
            type: "code_project",
            title: projectInfo.name,
            description: `Claude project: ${projectInfo.description}`,
            metadata: {
              path: projectPath,
              lastModified: projectInfo.lastModified,
              files: projectInfo.files,
              languages: projectInfo.languages,
            },
            timestamp: projectInfo.lastModified,
          });
        }
      } catch (error) {
        console.error(`Error scanning ${basePath}:`, error);
      }
    }

    if (projects.length > 0) {
      await db.insert(activities).values(projects);
    }
    return projects;
  }

  private async analyzeProject(projectPath: string): Promise<ProjectInfo> {
    const projectDir = path.dirname(projectPath);
    const projectName = path.basename(projectDir);
    
    let description = "Local development project";
    let lastModified = new Date();
    
    try {
      const stats = await fs.stat(projectPath);
      lastModified = stats.mtime;
      
      // Try to read project description from claude.json or package.json
      const claudeConfigPath = path.join(projectDir, "claude.json");
      const packageJsonPath = path.join(projectDir, "package.json");
      
      try {
        const claudeConfig = await fs.readFile(claudeConfigPath, "utf-8");
        const config = JSON.parse(claudeConfig);
        description = config.description || description;
      } catch {
        try {
          const packageJson = await fs.readFile(packageJsonPath, "utf-8");
          const pkg = JSON.parse(packageJson);
          description = pkg.description || description;
        } catch {
          // Use default description
        }
      }
    } catch (error) {
      console.error(`Error analyzing project ${projectPath}:`, error);
    }
    
    const files = await this.getProjectFiles(projectDir);
    const languages = this.detectLanguages(files);
    
    return {
      name: projectName,
      description,
      lastModified,
      files: files.slice(0, 100), // Limit to first 100 files
      languages,
    };
  }

  private async getProjectFiles(dir: string): Promise<string[]> {
    try {
      const files = await this.recursiveScan(dir, 0, 3);
      return files.map(f => path.relative(dir, f));
    } catch (error) {
      console.error(`Error getting project files:`, error);
      return [];
    }
  }

  private detectLanguages(files: string[]): string[] {
    const languageMap: { [key: string]: string } = {
      ".js": "JavaScript",
      ".jsx": "JavaScript",
      ".ts": "TypeScript",
      ".tsx": "TypeScript",
      ".py": "Python",
      ".java": "Java",
      ".cpp": "C++",
      ".c": "C",
      ".cs": "C#",
      ".go": "Go",
      ".rs": "Rust",
      ".swift": "Swift",
      ".kt": "Kotlin",
      ".rb": "Ruby",
      ".php": "PHP",
    };
    
    const languages = new Set<string>();
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (languageMap[ext]) {
        languages.add(languageMap[ext]);
      }
    }
    
    return Array.from(languages);
  }

  private async recursiveScan(
    dir: string,
    depth = 0,
    maxDepth = 5
  ): Promise<string[]> {
    if (depth > maxDepth) return [];

    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Security: Ensure we stay within allowed paths
      if (!this.isPathAllowed(fullPath)) continue;

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        files.push(
          ...(await this.recursiveScan(fullPath, depth + 1, maxDepth))
        );
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private isPathAllowed(testPath: string): boolean {
    const resolved = path.resolve(testPath);
    return this.allowedPaths.some((allowed) => resolved.startsWith(allowed));
  }
}