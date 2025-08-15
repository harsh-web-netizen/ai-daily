"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Link as LinkIcon, ExternalLink, BookmarkPlus, BookmarkCheck, RefreshCcw, Info, Calendar, Headphones, Newspaper, Presentation, GraduationCap, Github, Copy } from "lucide-react";

type ContentType = "podcast" | "newsletter" | "presentation" | "research" | "article";
type Item = {
  id: string; title: string; url: string; description?: string; source: string; author?: string; published_at: string; type: ContentType; tags?: string[];
};
const ENDPOINT = "/api/ai-digest.json";
const TYPE_META: Record<ContentType, { label: string; icon: React.ReactNode }> = {
  podcast: { label: "Podcast", icon: <Headphones className="h-4 w-4" /> },
  newsletter: { label: "Newsletter", icon: <Newspaper className="h-4 w-4" /> },
  presentation: { label: "Presentation", icon: <Presentation className="h-4 w-4" /> },
  research: { label: "Research", icon: <GraduationCap className="h-4 w-4" /> },
  article: { label: "Article", icon: <Newspaper className="h-4 w-4" /> },
};
function clsx(...xs: (string | false | undefined)[]) { return xs.filter(Boolean).join(" "); }
function timeAgo(iso: string) { const d = new Date(iso).getTime(); const now = Date.now(); const diff = Math.max(0, now - d); const mins = Math.floor(diff/60000); if (mins<60) return `${mins}m ago`; const hrs = Math.floor(mins/60); if (hrs<24) return `${hrs}h ago`; const days = Math.floor(hrs/24); return `${days}d ago`; }

export default function Page() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<ContentType[]>(["podcast","newsletter","presentation","research","article"]);
  const [showInfo, setShowInfo] = useState(false);
  const [pinned, setPinned] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("aidaily:pins") || "[]"); } catch { return []; } });

  useEffect(() => { (async () => {
      try { const res = await fetch(ENDPOINT, { cache: "no-store" }); if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Item[] = await res.json(); setItems(data); setError(null);
      } catch (e:any) { console.warn("Falling back to sample:", e?.message); setItems(SAMPLE_DATA); setError("Live feed unavailable — showing sample data."); }
      finally { setLoading(false); }
  })(); }, []);
  useEffect(() => { localStorage.setItem("aidaily:pins", JSON.stringify(pinned)); }, [pinned]);

  const toggleType = (t: ContentType) => setTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);
  const filtered = useMemo(() => {
    if (!items) return [] as Item[];
    const q = query.trim().toLowerCase();
    const list = items.filter(it => types.includes(it.type));
    const queried = q ? list.filter(it => (it.title + " " + (it.description||"") + " " + (it.source||"") + " " + (it.author||"") + " " + (it.tags||[]).join(" ")).toLowerCase().includes(q)) : list;
    return queried.slice().sort((a,b)=> new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [items, query, types]);
  const lastUpdated = useMemo(() => { const newest = filtered[0]?.published_at || items?.[0]?.published_at; return newest ? new Date(newest).toLocaleString() : "—"; }, [filtered, items]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-black text-white grid place-items-center shadow-sm"><span className="font-bold">AI</span></div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">AI Daily</h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Fresh links to podcasts, newsletters, research, and talks.</p>
          </motion.div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 active:scale-[0.99]">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={() => setShowInfo(true)} className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
              <Info className="h-4 w-4" /> How it works
            </button>
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
              <Github className="h-4 w-4" /> Star
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search titles, tags, authors…" className="w-full rounded-2xl border border-neutral-200 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"/>
            </div>
          </div>
          <div className="md:col-span-6 flex flex-wrap gap-2 items-center justify-start md:justify-end">
            <TypeToggle t="podcast" onClick={toggleType} active={types.includes("podcast")} />
            <TypeToggle t="newsletter" onClick={toggleType} active={types.includes("newsletter")} />
            <TypeToggle t="presentation" onClick={toggleType} active={types.includes("presentation")} />
            <TypeToggle t="research" onClick={toggleType} active={types.includes("research")} />
            <TypeToggle t="article" onClick={toggleType} active={types.includes("article")} />
          </div>
        </div>
        <div className="mt-3 text-xs text-neutral-500 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Last update: <span className="font-medium text-neutral-700">{lastUpdated}</span>
          {error && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{error}</span>}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        {loading ? (<SkeletonGrid />) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map(item => (
                <motion.div key={item.id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                  <Card item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>Built with ❤️ for AI enthusiasts.</div>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} AI Daily</span>
            <a href="#" onClick={(e)=>{e.preventDefault(); setShowInfo(true);}} className="underline decoration-dotted underline-offset-4">Setup guide</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showInfo && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-3xl rounded-3xl bg-white shadow-xl border border-neutral-200 overflow-hidden" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-lg font-semibold">Make it update daily</h2>
                    <p className="mt-1 text-sm text-neutral-600">This UI reads a JSON feed built by a GitHub Action. Schema:</p>
                  </div>
                  <button onClick={()=>setShowInfo(false)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50">Close</button>
                </div>
                <pre className="mt-4 text-xs bg-neutral-50 border border-neutral-200 rounded-xl p-4 overflow-auto">{`GET ${ENDPOINT} -> Item[] with keys: id, title, url, description, source, author, published_at (ISO), type, tags[]`}</pre>
                <h3 className="mt-6 font-medium">Backend: GitHub Actions (cron) + Static JSON</h3>
                <pre className="mt-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl p-4 overflow-auto">{`# .github/workflows/build-digest.yml
name: Build AI Digest
on:
  schedule:
    - cron: "0 23 * * *" # 05:30 IST (UTC+5:30)
  workflow_dispatch: {}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:digest
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update ai-digest.json"`}</pre>
                <p className="mt-4 text-sm text-neutral-600">Update <code>scripts/build-digest.mjs</code> to add/remove sources.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypeToggle({ t, onClick, active }: { t: ContentType; onClick: (t: ContentType) => void; active: boolean }) {
  const meta = TYPE_META[t];
  return (
    <button onClick={()=>onClick(t)} className={clsx("inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm", active ? "border-black bg-black text-white" : "border-neutral-200 hover:bg-neutral-50")}>
      {meta.icon}{meta.label}
    </button>
  );
}

function Card({ item }: { item: Item }) {
  const Icon = TYPE_META[item.type].icon as any;
  const [copied, setCopied] = useState(false);
  const [pinned, setPinned] = useState<boolean>(() => {
    try { return (JSON.parse(localStorage.getItem("aidaily:pins")||"[]") as string[]).includes(item.id) } catch { return false }
  });
  const copy = async () => { try { await navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(()=>setCopied(false), 1200);} catch {} };
  const togglePin = () => {
    try {
      const pins: string[] = JSON.parse(localStorage.getItem("aidaily:pins")||"[]");
      const next = pins.includes(item.id) ? pins.filter(x=>x!==item.id) : [...pins, item.id];
      localStorage.setItem("aidaily:pins", JSON.stringify(next));
      setPinned(next.includes(item.id));
    } catch {}
  };
  return (
    <div className="group rounded-3xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-900 text-white grid place-items-center">{Icon}</div>
          <div className="min-w-0">
            <a href={item.url} target="_blank" rel="noreferrer" className="font-medium line-clamp-2 hover:underline decoration-dotted underline-offset-4">{item.title}</a>
            <div className="mt-1 text-xs text-neutral-500 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1"><LinkIcon className="h-3 w-3" /> {new URL(item.url).hostname.replace("www.","")}</span>
              <span>•</span><span>{item.source}{item.author ? ` — ${item.author}` : ""}</span>
              <span>•</span><span title={new Date(item.published_at).toLocaleString()}>{timeAgo(item.published_at)}</span>
            </div>
          </div>
        </div>
        {item.description && (<p className="mt-3 text-sm text-neutral-700 line-clamp-3">{item.description}</p>)}
        {item.tags && item.tags.length>0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">{item.tags.map(tag => (<span key={tag} className="rounded-full bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5">#{tag}</span>))}</div>
        )}
        <div className="mt-4 flex items-center gap-2">
          <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50">
            <ExternalLink className="h-4 w-4" /> Open
          </a>
          <button onClick={copy} className={"inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm " + (copied ? "border-emerald-600 text-emerald-700" : "border-neutral-200 hover:bg-neutral-50") }>
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
          </button>
          <button onClick={togglePin} className={"ml-auto inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm " + (pinned ? "border-amber-600 text-amber-700" : "border-neutral-200 hover:bg-neutral-50")}>
            {pinned ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />} {pinned ? "Pinned" : "Pin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-4">
          <div className="h-5 w-1/2 rounded bg-neutral-200 animate-pulse" />
          <div className="mt-2 h-3 w-1/3 rounded bg-neutral-200 animate-pulse" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-neutral-200 animate-pulse" />
          </div>
          <div className="mt-4 h-8 w-24 rounded-2xl bg-neutral-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Sample fallback data
const SAMPLE_DATA: Item[] = [
  { id: "arxiv-2508-001", title: "Advances in Multimodal Reasoning", url: "https://arxiv.org/abs/2508.00001", description: "Survey of techniques combining vision, text and audio reasoning with agentic workflows.", source: "arXiv", author: "Various", published_at: new Date().toISOString(), type: "research", tags: ["multimodal","reasoning","agents"] },
  { id: "substack-aisurge-2508-001", title: "Why Open-Source Models Are Surging in 2025", url: "https://example.substack.com/p/open-source-surge", description: "Ecosystem shifts, licensing, and benchmarks driving open-source adoption.", source: "Substack", author: "AI Surge Weekly", published_at: new Date(Date.now()-2*24*3600*1000).toISOString(), type: "newsletter", tags: ["open-source","benchmarks"] },
  { id: "lex-420", title: "The Future of AI Agents — with Jane Doe", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Deep dive into autonomous agents, safety rails, and real products.", source: "YouTube", author: "Lex Fridman Podcast", published_at: new Date(Date.now()-1*24*3600*1000).toISOString(), type: "podcast", tags: ["agents","safety","product"] },
  { id: "slides-aisocialimpact-2508", title: "AI for Social Impact: Practical Playbook", url: "https://speakerdeck.com/example/ai-for-social-impact", description: "Tactics and case studies for deploying AI in the impact sector.", source: "SpeakerDeck", author: "Impact Lab", published_at: new Date(Date.now()-3*24*3600*1000).toISOString(), type: "presentation", tags: ["impact","case-studies"] },
  { id: "blog-mlops-guardrails-2508", title: "Guardrails for LLM Apps at Scale", url: "https://blog.example.com/guardrails-llm", description: "Patterns for evals, red-teaming, and policy engines in production.", source: "Tech Blog", author: "ACME AI", published_at: new Date(Date.now()-4*24*3600*1000).toISOString(), type: "article", tags: ["mlops","safety","evals"] }
];
