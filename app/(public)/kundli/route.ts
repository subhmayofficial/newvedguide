import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const HTML_PATH = path.join(process.cwd(), "app", "(public)", "kundli", "kundli.html");

export async function GET() {
  const html = await readFile(HTML_PATH, "utf8");

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
