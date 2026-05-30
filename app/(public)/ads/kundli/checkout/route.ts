import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const HTML_PATH = path.join(
  process.cwd(),
  "app",
  "(public)",
  "ads",
  "kundli",
  "checkout",
  "checkout.html"
);

export async function GET() {
  let html = await readFile(HTML_PATH, "utf8");

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  html = html.replace("__RAZORPAY_KEY_ID__", keyId);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
