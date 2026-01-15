/**
 * Skills loading and formatting for the standalone AI SDK.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";

/**
 * Skill definition.
 */
export type Skill = {
  name: string;
  description: string;
  content: string;
  path: string;
};

/**
 * Skill snapshot for prompt injection.
 */
export type SkillSnapshot = {
  skills: Skill[];
  timestamp: number;
};

/**
 * Load skills from a directory.
 * Skills are markdown files with frontmatter.
 */
export async function loadSkillsFromDir(dir: string): Promise<Skill[]> {
  const skills: Skill[] = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isFile() && entry.endsWith(".md")) {
        const content = await readFile(fullPath, "utf-8");
        const { name, description } = parseSkillFrontmatter(content);

        skills.push({
          name: name || basename(entry, ".md"),
          description: description || "",
          content,
          path: fullPath,
        });
      } else if (stats.isDirectory()) {
        // Recurse into subdirectories
        const subSkills = await loadSkillsFromDir(fullPath);
        skills.push(...subSkills);
      }
    }
  } catch {
    // Directory doesn't exist or isn't readable
  }

  return skills;
}

/**
 * Parse skill frontmatter from markdown content.
 */
function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = match[1];
  const result: { name?: string; description?: string } = {};

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  if (descMatch) {
    result.description = descMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  return result;
}

/**
 * Format skills for inclusion in a prompt.
 */
export function formatSkillsForPrompt(skills: Skill[]): string {
  if (skills.length === 0) return "";

  const formatted = skills.map((skill) => {
    return `### ${skill.name}\n${skill.description ? `*${skill.description}*\n\n` : ""}${skill.content}`;
  });

  return `## Available Skills\n\n${formatted.join("\n\n---\n\n")}`;
}

/**
 * Create a skill snapshot.
 */
export function createSkillSnapshot(skills: Skill[]): SkillSnapshot {
  return {
    skills,
    timestamp: Date.now(),
  };
}
