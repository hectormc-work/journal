import { DateTime } from "luxon";

interface EntryForMarkdown {
  name: string;
  entry_date: string;
  body: string | null;
}

interface PromptResponseForMarkdown {
  prompt_text: string;
  response: string | null;
}

export const entryToMarkdown = (
  entry: EntryForMarkdown,
  responses: PromptResponseForMarkdown[],
): string => {
  const date = DateTime.fromISO(entry.entry_date, { zone: "utc" }).toFormat(
    "MMMM d, yyyy",
  );
  const sections = [`# ${entry.name}`, `*${date}*`];

  if (entry.body) sections.push(entry.body);

  if (responses.length > 0) {
    sections.push("## Prompts");
    for (const response of responses) {
      sections.push(
        `**${response.prompt_text}**\n\n${response.response ?? "_Not answered_"}`,
      );
    }
  }

  return sections.join("\n\n") + "\n";
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entry";

export const entryMarkdownFilename = (entry: EntryForMarkdown): string =>
  `${entry.entry_date}-${slugify(entry.name)}.md`;
