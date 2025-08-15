// Build a daily AI digest from RSS/Atom feeds and write public/api/ai-digest.json
// Run locally: `npm run build:digest`
// GitHub Action will also run this on a schedule.

import fs from "node:fs/promises";
import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";

// --- Configure sources (add your favorites) ---
const SOURCES = [
  // Research
  { type: "research", source: "arXiv cs.AI", url: "https://arxiv.org/rss/cs.AI" },
  { type: "research", source: "arXiv cs.CL", url: "https://arxiv.org/rss/cs.CL" },

  // Newsletters / Articles (RSS or Atom)
  { type: "newsletter", source: "Import AI (Substack)", url: "https://jack-clark.net/feed/" },
  { type: "article", source: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml" },
  { type: "article", source: "Google AI Blog", url: "https://ai.googleblog.com/feeds/posts/default" },

  // YouTube (presentations, talks, podcast video)
  // Use channel_id feeds: https://www.youtube.com/feeds/videos.xml?channel_id=XXXX
  { type: "presentation", source: "Stanford HAI", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCaj9u2GdLK7eL8_cJ_3z2gA" },

  // Podcasts (RSS)
  { type: "podcast", source: "TWIML AI Podcast", url: "https://twimlai.com/feed/podcast/" }
];

const KEYWORDS = ["ai", "artificial intelligence", "llm", "agent", "agents", "multimodal", "machine learning", "deep learning"];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

function hashId(input) { return crypto.createHash("sha1").update(input).digest("hex"); }
function toISO(dateStr) {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

function mapItem(raw, meta) {
  // Handle RSS (item) and Atom (entry)
  const title = raw.title?.["#text"] ?? raw.title ?? "";
  const link = raw.link?.href || raw.link?.[0]?.href || raw.link?.[0] || raw.link || raw.guid?.["#text"] || raw.guid || "";
  const url = typeof link === "string" ? link : (link?.[0] ?? "");
  const desc = raw.description || raw.summary || "";
  const author = raw.author?.name || raw["dc:creator"] || raw.author || undefined;
  const pub = raw.pubDate || raw.published || raw.updated || new Date().toISOString();
  const id = hashId(url || title + pub + meta.source);
  return {
    id,
    title: (typeof title === "string" ? title : JSON.stringify(title)).trim(),
    url: (typeof url === "string" ? url : JSON.stringify(url)),
    description: typeof desc === "string" ? stripTags(desc).slice(0, 280) : undefined,
    source: meta.source,
    author,
    published_at: toISO(pub),
    type: meta.type,
    tags: []
  };
}

function stripTags(html) { return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(); }

function matchesKeywords(item) {
  const hay = (item.title + " " + (item.description || "")).toLowerCase();
  return KEYWORDS.some(k => hay.includes(k));
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function crawl() {
  const all = [];
  for (const s of SOURCES) {
    try {
      const xml = await fetchText(s.url);
      const doc = parser.parse(xml);
      const items = (doc?.rss?.channel?.item) || (doc?.feed?.entry) || [];
      for (const raw of items) {
        const mapped = mapItem(raw, s);
        if (matchesKeywords(mapped)) all.push(mapped);
      }
    } catch (e) {
      console.warn("Failed source", s.source, s.url, e.message);
    }
  }
  // dedupe by URL
  const byUrl = new Map();
  for (const it of all) {
    const key = it.url.trim().toLowerCase();
    if (!byUrl.has(key)) byUrl.set(key, it);
  }
  const unique = Array.from(byUrl.values());
  unique.sort((a,b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  const limited = unique.slice(0, 60);
  return limited;
}

const items = await crawl();
await fs.mkdir("public/api", { recursive: true });
await fs.writeFile("public/api/ai-digest.json", JSON.stringify(items, null, 2));
console.log("Wrote public/api/ai-digest.json with", items.length, "items");
