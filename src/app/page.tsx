"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Maximize2, Globe, Cpu, Bitcoin, TrendingUp, Zap, MessageSquare, Eye, Radio, Activity, Trophy, ChevronRight, RefreshCw, Search, X, Loader, Mic } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import posthog from 'posthog-js';
import { LiveAria } from '@/components/LiveAria';

const SECTIONS = [
  { id: "world",         label: "World",         icon: Globe,       color: "#22D3EE" },
  { id: "business",      label: "Business",       icon: TrendingUp,  color: "#FBBF24" },
  { id: "politics",      label: "Politics",       icon: Zap,         color: "#F87171" },
  { id: "stocks",        label: "Stocks",         icon: Activity,    color: "#34D399" },
  { id: "crypto",        label: "Crypto",         icon: Bitcoin,     color: "#A78BFA" },
  { id: "tech",          label: "Tech",           icon: Cpu,         color: "#38BDF8" },
  { id: "sports",        label: "Sports",         icon: Trophy,      color: "#FB923C" },
  { id: "entertainment", label: "Entertainment",  icon: Radio,       color: "#F472B6" },
];

const TAG_COLORS: Record<string, string> = {
  BREAKING:"#F87171", ALERT:"#F87171", LIVE:"#34D399", LATEST:"#94A3B8",
  DEVELOPING:"#FBBF24", ANALYSIS:"#A78BFA", EARNINGS:"#FBBF24", ELECTION:"#F87171",
  IPO:"#34D399", AI:"#38BDF8", SPACE:"#A78BFA", RESULT:"#34D399", PREVIEW:"#38BDF8",
  REVEAL:"#F472B6", F1:"#FB923C", UPSET:"#F87171", FUNDING:"#34D399",
  MILESTONE:"#38BDF8", SUMMIT:"#FBBF24", SECTOR:"#34D399", NBA:"#FB923C",
};

const NEWS: any = {
  world: {
    morning: {
      headline: "Loading Axis Global Intelligence...",
      lead: "Fetching latest real-time developments from our global news network. ARIA is curating the top stories for you now.",
      stories: []
    },
    night: {
      headline: "Loading Axis Global Intelligence...",
      lead: "Fetching latest real-time developments from our global news network. ARIA is curating the top stories for you now.",
      stories: []
    }
  }
};

const TICKER = [
  "🌐 AXIS ARIA: Real-time news curation engine active",
  "📈 Market Sentiment: Analyzing latest moves across Global Exchanges",
  "⚡ Breaking: Dynamic headlines are fetched and curated every 120 minutes",
  "🎙️ Live: ARIA interactive session available for every story",
];

const CATEGORY_VISUALS: Record<string, { img: string, video: string }> = {
  world: { 
    img: "https://images.unsplash.com/photo-1526770662015-d45296cb3643?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/370338571.sd.mp4?s=75d74116a1270c41097241805545a498a4459f0b&profile_id=139&oauth2_token_id=57447761" 
  },
  tech: { 
    img: "https://images.unsplash.com/photo-1518770666314-d8134a360655?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/517650462.sd.mp4?s=01a3577d33d5966699049449f80b1816e9f1a238&profile_id=139&oauth2_token_id=57447761"
  },
  business: { 
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/494354224.sd.mp4?s=2b1e428e370327f1c1f1f1f1f1f1f1f1f1f1f1f1&profile_id=139&oauth2_token_id=57447761"
  },
  crypto: { 
    img: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/539121344.sd.mp4?s=f50800d984719000a68d00923f5b0850c95a09b3&profile_id=139&oauth2_token_id=57447761"
  },
  politics: { 
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/370338571.sd.mp4?s=75d74116a1270c41097241805545a498a4459f0b&profile_id=139&oauth2_token_id=57447761"
  },
  stocks: { 
    img: "https://images.unsplash.com/photo-1611974714851-48206138473c?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/494354224.sd.mp4?s=2b1e428e370327f1c1f1f1f1f1f1f1f1f1f1f1f1&profile_id=139&oauth2_token_id=57447761"
  },
  sports: { 
    img: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/370338571.sd.mp4?s=75d74116a1270c41097241805545a498a4459f0b&profile_id=139&oauth2_token_id=57447761"
  },
  entertainment: { 
    img: "https://images.unsplash.com/photo-1514525253344-3ef3f946e9f1?auto=format&fit=crop&q=80&w=2000",
    video: "https://player.vimeo.com/external/517650462.sd.mp4?s=01a3577d33d5966699049449f80b1816e9f1a238&profile_id=139&oauth2_token_id=57447761"
  },
};

export default function AxisNews() {
  const [section, setSection] = useState("world");
  const [edition, setEdition] = useState("morning");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [askOpen, setAskOpen] = useState(false);
  const [time, setTime] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [newsData, setNewsData] = useState<any>(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const active = SECTIONS.find(s => s.id === (searchMode && searchResult ? (searchResult.section || section) : section));
  const data = searchMode && searchResult && !searchResult.error 
    ? searchResult 
    : (newsData || (NEWS[section] || NEWS.world)[edition] || NEWS.world.morning);
  const accent = active?.color || "#22D3EE";

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let timer: any;
    if (playing) timer = setInterval(() => setProgress(p => { if (p >= 100) { setPlaying(false); return 0; } return p + 0.25; }), 80);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (videoRef.current) {
      if (playing) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [playing]);

  useEffect(() => { setProgress(0); setPlaying(false); setAskOpen(false); }, [section, edition]);

  // Fetch dynamic news for the section
  useEffect(() => {
    async function getNews() {
      if (searchMode) return;
      setLoadingNews(true);
      try {
        const res = await fetch(`/api/news?section=${section}`);
        const json = await res.json();
        if (!json.error) {
          setNewsData(json);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic news", e);
      } finally {
        setLoadingNews(false);
      }
    }
    getNews();

    // Auto-refresh every 2 hours
    const interval = setInterval(getNews, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [section, searchMode]);

  // Auto-set edition based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    const newEdition = (hour >= 5 && hour < 17) ? "morning" : "night";
    if (newEdition !== edition) setEdition(newEdition);
  }, []);

  const runSearch = async (overrideQuery?: string) => {
    const queryToUse = (typeof overrideQuery === 'string' ? overrideQuery : searchQuery) || "";
    if (!queryToUse.trim()) return;
    setSearching(true);
    setSearchQuery(queryToUse);
    posthog.capture('search_query', { query: queryToUse });
    setSearchResult(null);
    setSearchMode(true);
    setSearchOpen(false);
    setProgress(0); setPlaying(false);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryToUse })
      });
      const parsed = await res.json();
      setSearchResult(parsed);
    } catch (e) {
      setSearchResult({ error: true, headline: "Could not generate news", lead: "The ARIA generation pipeline encountered an error. Please try again.", stories: [], section: "world" });
    }
    setSearching(false);
  };

  const clearSearch = () => { setSearchMode(false); setSearchResult(null); setSearchQuery(""); setSearchOpen(false); };

  const fmt = (s: number) => `${Math.floor(s * 0.035)}:${String(Math.floor((s * 0.035 % 1) * 60)).padStart(2,"0")}`;

  return (
    <div style={{ background:"#050508", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", color:"#E2E8F0", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Bebas+Neue&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scan    { 0%{top:0%} 100%{top:100%} }
        @keyframes wave    { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
        @keyframes pulse   { 0%,100%{opacity:.5} 50%{opacity:.2} }
        .sc::-webkit-scrollbar{height:2px} .sc::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        .card:hover{background:rgba(255,255,255,.03)!important;transform:translateX(2px)}
        .pill:hover{opacity:1!important}
        .cta:hover{background:rgba(255,255,255,.06)!important}

        /* Responsive Styles */
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .side-panel { border-left: none !important; border-top: 1px solid rgba(255,255,255,.04) !important; }
        }
        @media (max-width: 768px) {
          header { padding: 10px 16px !important; }
          .search-container { display: none !important; }
          .search-mode-active .search-container { display: block !important; position: absolute; top: 100%; left: 0; right: 0; z-index: 100; background: #050508; padding: 10px; border-bottom: 1px solid rgba(255,255,255,.1); }
          .mobile-hide { display: none !important; }
          .player-container { padding: 12px !important; }
          .video-headline { fontSize: 18px !important; }
        }
      `}</style>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className={searchOpen ? "search-mode-active" : ""} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 24px", borderBottom:"1px solid rgba(255,255,255,.06)", background:"rgba(5,5,8,.97)", position:"sticky", top:0, zIndex:99 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <span onClick={clearSearch} style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", letterSpacing:"5px", color:accent, transition:"color .3s", cursor:"pointer" }}>AXIS</span>
          <div style={{ width:"1px", height:"18px", background:"rgba(255,255,255,.08)" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#34D399", animation:"blink 1.4s infinite" }}/>
            <span style={{ fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", color:"#34D399", letterSpacing:"2px", fontWeight:600 }}>LIVE</span>
          </div>
          {searchMode && (
            <div style={{ display:"flex", alignItems:"center", gap:"7px", padding:"3px 10px", background:"rgba(255,255,255,.04)", borderRadius:"20px", border:"1px solid rgba(255,255,255,.08)" }}>
              <Search size={10} style={{ color:"rgba(255,255,255,.4)" }}/>
              <span style={{ fontSize:"11px", color:"rgba(255,255,255,.55)", fontFamily:"'DM Sans',sans-serif", maxWidth:"160px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{searchQuery}</span>
              <X size={10} onClick={clearSearch} style={{ color:"rgba(255,255,255,.35)", cursor:"pointer" }}/>
            </div>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="search-container" style={{ flex:1, maxWidth:"420px", margin:"0 20px", position:"relative" }}>
          {searchOpen ? (
            <div style={{ display:"flex", gap:"8px", animation:"fadeUp .15s ease" }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", background:"rgba(255,255,255,.05)", border:`1px solid ${accent}40`, borderRadius:"8px", padding:"0 12px", gap:"8px" }}>
                <Search size={13} style={{ color:accent, flexShrink:0 }}/>
                <input ref={searchRef} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") runSearch(); if(e.key==="Escape") setSearchOpen(false); }} placeholder="Search any topic — ARIA generates news..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#E2E8F0", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", padding:"9px 0" }} autoFocus/>
                {searchQuery && <X size={13} onClick={()=>setSearchQuery("")} style={{ color:"rgba(255,255,255,.3)", cursor:"pointer", flexShrink:0 }}/>}
              </div>
              <button onClick={runSearch} disabled={!searchQuery.trim()} style={{ padding:"0 18px", background:searchQuery.trim()?accent:"rgba(255,255,255,.05)", border:"none", borderRadius:"8px", color:searchQuery.trim()?"#050508":"rgba(255,255,255,.2)", cursor:searchQuery.trim()?"pointer":"default", fontSize:"13px", fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:"all .2s", whiteSpace:"nowrap" }}>Generate</button>
              <button onClick={()=>{setSearchOpen(false);}} style={{ padding:"0 14px", background:"transparent", border:"1px solid rgba(255,255,255,.07)", borderRadius:"8px", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:"12px", fontFamily:"'DM Sans',sans-serif" }}>✕</button>
            </div>
          ) : (
            <button onClick={()=>{ setSearchOpen(true); setTimeout(()=>searchRef.current?.focus(),50); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"9px 14px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:"8px", cursor:"text", color:"rgba(255,255,255,.28)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", transition:"border-color .2s" }}>
              <Search size={13} style={{ flexShrink:0 }}/>
              <span>Search any topic…</span>
              <span style={{ marginLeft:"auto", fontSize:"10px", padding:"2px 7px", background:"rgba(255,255,255,.04)", borderRadius:"4px", color:"rgba(255,255,255,.2)", fontFamily:"'JetBrains Mono',monospace" }}>⌘K</span>
            </button>
          )}

          {/* Quick search chips */}
          {searchOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"rgba(10,10,18,.97)", border:"1px solid rgba(255,255,255,.07)", borderRadius:"8px", padding:"10px", zIndex:99, animation:"fadeUp .1s ease" }}>
              <div style={{ fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,.25)", letterSpacing:"2px", marginBottom:"8px" }}>QUICK SEARCH</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {["Gaza ceasefire","Bitcoin crash","AI regulation","Nvidia earnings","Champions League","SpaceX Starship","Fed rate cut","OpenAI GPT-5"].map(q=>(
                  <button key={q} onClick={()=>{ setSearchQuery(q); setTimeout(()=>{ setSearchQuery(q); },50); }} style={{ padding:"4px 11px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:"20px", color:"rgba(255,255,255,.5)", fontSize:"11px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>{q}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mobile-hide" style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"12px", color:"rgba(255,255,255,.35)" }}>{time}</span>
        </div>
      </header>

      {/* ── TICKER ────────────────────────────────────────────────────── */}
      <div style={{ background:`${accent}0e`, borderBottom:`1px solid ${accent}22`, overflow:"hidden", padding:"7px 0", display:"flex", alignItems:"center", transition:"background .3s" }}>
        <div style={{ minWidth:"110px", padding:"0 14px", display:"flex", alignItems:"center", gap:"6px", borderRight:`1px solid ${accent}28`, flexShrink:0 }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:accent, animation:"blink .9s infinite", flexShrink:0 }}/>
          <span style={{ fontSize:"9px", fontWeight:700, color:accent, letterSpacing:"2px", fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap" }}>HEADLINES</span>
        </div>
        <div style={{ overflow:"hidden", flex:1 }}>
          <div style={{ display:"flex", animation:"marquee 40s linear infinite", whiteSpace:"nowrap" }}>
            {(newsData?.stories?.length ? newsData.stories.map((s: any) => `🔴 ${s.tag}: ${s.title}`) : TICKER).concat(newsData?.stories?.length ? newsData.stories.map((s: any) => `🔴 ${s.tag}: ${s.title}`) : TICKER).map((t,i)=>(
              <span key={i} style={{ fontSize:"12px", color:"rgba(255,255,255,.65)", marginRight:"56px" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION NAV ───────────────────────────────────────────────── */}
      <div className="sc" style={{ display:"flex", overflowX:"auto", padding:"10px 24px", gap:"6px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        {SECTIONS.map(s=>{
          const Icon=s.icon; const on=s.id===section;
          return (
            <button key={s.id} onClick={()=>{
              setSection(s.id);
              posthog.capture('section_viewed', { section: s.id, edition });
            }} className="pill" style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 16px", borderRadius:"6px", border:on?`1px solid ${s.color}38`:"1px solid rgba(255,255,255,.06)", background:on?`${s.color}10`:"transparent", color:on?s.color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:"12px", fontWeight:on?600:400, whiteSpace:"nowrap", transition:"all .2s", fontFamily:"'DM Sans',sans-serif", opacity:on?1:.75 }}>
              <Icon size={12}/>{s.label}
            </button>
          );
        })}
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div className="main-grid" style={{ display:"grid", gridTemplateColumns:"1fr 360px", minHeight:"calc(100vh - 156px)", borderTop:"1px solid rgba(255,255,255,.03)" }}>

        {/* LEFT — Player + Lead */}
        <div className="player-container" style={{ padding:"24px", background:"#050508", animation:"fadeUp .3s ease" }}>

          {/* VIDEO PLAYER */}
          <div onClick={()=>{
            if(!searching) {
              const nextPlaying = !playing;
              setPlaying(nextPlaying);
              posthog.capture(nextPlaying ? 'video_played' : 'video_paused', { section, edition });
            }
          }} style={{ position:"relative", borderRadius:"10px", overflow:"hidden", background:"#08080f", aspectRatio:"16/9", border:`1px solid ${accent}1a`, marginBottom:"16px", cursor:"pointer", transition:"border-color .3s" }}>
            {/* Searching/Loading overlay */}
            {(searching || (loadingNews && !searchMode)) && (
              <div style={{ position:"absolute", inset:0, background:"rgba(5,5,8,.92)", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px" }}>
                <div style={{ position:"relative" }}>
                  <div style={{ width:"60px", height:"60px", borderRadius:"50%", border:`2px solid ${accent}20`, borderTopColor:accent, animation:"spin 1s linear infinite" }}/>
                  <div style={{ position:"absolute", inset:"8px", borderRadius:"50%", border:`2px solid ${accent}10`, borderBottomColor:`${accent}60`, animation:"spin 1.4s linear infinite reverse" }}/>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"16px", letterSpacing:"4px", color:accent, marginBottom:"4px" }}>{loadingNews ? "CURATING NEWS" : "ARIA IS GENERATING"}</div>
                  <div style={{ fontSize:"11px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,.3)", letterSpacing:"1px" }}>{loadingNews ? "Fetching Latest Stories" : "Fetching · Scripting · Rendering"}</div>
                </div>
              </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {/* Gradient bg */}
            <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 30% 50%, ${accent}0a 0%, transparent 55%), radial-gradient(ellipse at 72% 65%, rgba(167,139,250,.07) 0%, transparent 50%)` }}/>
            {/* Scan line */}
            <div style={{ position:"absolute", left:0, right:0, height:"1px", background:`linear-gradient(90deg,transparent,${accent}35,transparent)`, animation:"scan 5s linear infinite", pointerEvents:"none", zIndex:2 }}/>

            {/* Background Visual (Category Fallback) */}
            {!playing && (
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.8)), url(${CATEGORY_VISUALS[section]?.img || CATEGORY_VISUALS.world.img})`, backgroundSize:"cover", backgroundPosition:"center", zIndex:1 }} />
            )}

            {/* Real Video Element */}
            <video
              ref={videoRef}
              key={data.videoUrl || CATEGORY_VISUALS[section]?.video}
              src={data.videoUrl || CATEGORY_VISUALS[section]?.video}
              poster={CATEGORY_VISUALS[section]?.img || CATEGORY_VISUALS.world.img}
              loop
              muted={false}
              playsInline
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:1, opacity: playing ? 1 : 0, transition: "opacity 0.8s ease" }}
            />

            {/* Avatar center placeholder (only shows when not playing or video missing) */}
            {(!playing || !data.videoUrl) && (
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", zIndex:2 }}>
                <div style={{ width:"88px", height:"88px", borderRadius:"50%", background:`linear-gradient(135deg,${accent}35,rgba(167,139,250,.25))`, border:`2px solid ${accent}45`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", transition:"all .3s", boxShadow:`0 0 30px ${accent}30` }}>
                  🎙️
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,.35)", letterSpacing:"3px" }}>{searching ? "GENERATING..." : data.videoUrl ? "TAP TO WATCH" : "READY TO BROADCAST"}</span>
              </div>
            )}

            {/* Network bug */}
            <div style={{ position:"absolute", top:"12px", right:"12px", display:"flex", gap:"6px", zIndex:3 }}>
              <div style={{ padding:"3px 8px", background:"rgba(0,0,0,.75)", borderRadius:"3px", fontFamily:"'Bebas Neue',sans-serif", fontSize:"13px", letterSpacing:"3px", color:accent, transition:"color .3s" }}>AXIS</div>
              <div style={{ padding:"3px 9px", background:playing?"rgba(248,113,113,.85)":"rgba(0,0,0,.6)", borderRadius:"3px", fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", color:"#fff", display:"flex", alignItems:"center", gap:"4px", transition:"background .3s" }}>
                {playing && <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fff" }}/>}
                {playing?"LIVE":"READY"}
              </div>
            </div>

            {/* Lower thirds */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 16px 12px", background:"linear-gradient(transparent,rgba(5,5,8,.96))", zIndex:3 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px" }}>
                <div style={{ padding:"2px 8px", background:accent, borderRadius:"2px", fontSize:"8px", fontWeight:700, color:"#050508", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"1px" }}>{active?.label?.toUpperCase()}</div>
                <span style={{ fontSize:"10px", color:"rgba(255,255,255,.35)", fontFamily:"'JetBrains Mono',monospace" }}>ARIA · AI ANCHOR</span>
              </div>
              <div className="video-headline" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"21px", letterSpacing:".3px", color:"#F0EEE9", lineHeight:1.2 }}>{data.headline}</div>
            </div>

            {/* Progress bar */}
            {progress > 0 && <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"2px", background:"rgba(255,255,255,.06)", zIndex:4 }}><div style={{ height:"100%", width:`${progress}%`, background:accent, transition:"width .08s linear", borderRadius:"1px" }}/></div>}
          </div>

          {/* CONTROLS */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"18px" }}>
            <button onClick={()=>setPlaying(!playing)} style={{ width:"34px", height:"34px", borderRadius:"50%", background:accent, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#050508", flexShrink:0, transition:"transform .15s, background .3s" }}>
              {playing ? <Pause size={15}/> : <Play size={15}/>}
            </button>
            <div style={{ flex:1, height:"3px", background:"rgba(255,255,255,.07)", borderRadius:"2px", cursor:"pointer" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:accent, borderRadius:"2px", transition:"width .08s linear, background .3s" }}/>
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"rgba(255,255,255,.3)", whiteSpace:"nowrap" }}>{fmt(progress)} / 4:12</span>
            <Volume2 size={14} style={{ color:"rgba(255,255,255,.25)" }}/>
            <Maximize2 size={13} style={{ color:"rgba(255,255,255,.25)", cursor:"pointer" }}/>
          </div>

          {/* LEAD */}
          <div style={{ padding:"16px", background:"rgba(255,255,255,.015)", borderRadius:"8px", borderTop:"1px solid rgba(255,255,255,.06)", borderBottom:"1px solid rgba(255,255,255,.06)", borderRight:"1px solid rgba(255,255,255,.06)", borderLeft:`3px solid ${accent}`, borderLeftColor:accent, marginBottom:"14px", transition:"border-color .3s" }}>
            <p style={{ fontSize:"14px", lineHeight:1.75, color:"rgba(255,255,255,.6)", margin:0, fontWeight:300 }}>{data.lead}</p>
          </div>

          {/* SEARCH RESULT META */}
          {searchMode && searchResult && !searchResult.error && (
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap", animation:"fadeUp .2s ease" }}>
              {searchResult.dataSources?.map((src: string)=>(
                <div key={src} style={{ padding:"3px 10px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:"20px", fontSize:"10px", color:"rgba(255,255,255,.4)", fontFamily:"'JetBrains Mono',monospace", display:"flex", alignItems:"center", gap:"5px" }}>
                  <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:accent }}/>
                  {src}
                </div>
              ))}
              {searchResult.fal_prompt && (
                <div style={{ width:"100%", padding:"10px 14px", background:`${accent}08`, border:`1px solid ${accent}18`, borderRadius:"8px" }}>
                  <div style={{ fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", color:accent, letterSpacing:"2px", marginBottom:"4px" }}>FAL.AI B-ROLL PROMPT</div>
                  <p style={{ fontSize:"11px", color:"rgba(255,255,255,.4)", margin:0, fontStyle:"italic", lineHeight:1.6 }}>{searchResult.fal_prompt}</p>
                </div>
              )}
            </div>
          )}

          {/* ASK AXIS — LiveAria Modal trigger */}
          <button className="cta" onClick={()=>{
            const nextOpen = !askOpen;
            setAskOpen(nextOpen);
            if(nextOpen) posthog.capture('ask_aria_opened', { section });
          }} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 18px", background:"rgba(255,255,255,.03)", border:`1px solid ${accent}28`, borderRadius:"8px", color:accent, cursor:"pointer", fontSize:"13px", fontWeight:500, width:"100%", fontFamily:"'DM Sans',sans-serif", transition:"background .2s, border-color .3s" }}>
            <MessageSquare size={14}/>
            Ask ARIA about this story
            <span style={{ marginLeft:"auto", fontSize:"10px", opacity:.5, fontFamily:"'JetBrains Mono',monospace" }}>LiveAvatar ↗</span>
          </button>

          {askOpen && (
            <LiveAria
              section={searchMode && searchResult?.section ? searchResult.section : section}
              accent={accent}
              initialScript={searchMode && searchResult?.lead ? searchResult.lead : undefined}
              onClose={()=>setAskOpen(false)}
            />
          )}
        </div>

        {/* RIGHT — Story List */}
        <div className="side-panel" style={{ background:"#050508", borderLeft:"1px solid rgba(255,255,255,.04)" }}>
          <div style={{ padding:"14px 20px 12px", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"10px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,.3)", letterSpacing:"2px" }}>TOP STORIES</span>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              {data.generatedAt && (
                <span style={{ fontSize:"9px", color:"rgba(255,255,255,.2)", fontFamily:"'JetBrains Mono',monospace", marginRight:"8px" }}>
                  Curated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span style={{ fontSize:"9px", color:"rgba(255,255,255,.2)", fontFamily:"'JetBrains Mono',monospace" }}>{data.stories.length} stories</span>
              <RefreshCw size={11} style={{ color:"rgba(255,255,255,.18)", cursor:"pointer" }}/>
            </div>
          </div>

          {loadingNews && !searchMode ? (
            <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height:"80px", background:"rgba(255,255,255,.02)", borderRadius:"8px", animation:"pulse 1.5s infinite" }}/>
              ))}
            </div>
          ) : data.stories.map((s: any, i: number) => {
            const tc = TAG_COLORS[s.tag] || "#94A3B8";
            const cd = s.chart ? s.chart.map((v: number)=>({v})) : null;
            return (
              <div key={i} className="card" onClick={() => runSearch(s.title)} style={{ padding:"15px 20px", borderBottom:"1px solid rgba(255,255,255,.04)", cursor:"pointer", transition:"all .2s", animation:`fadeUp ${.05+i*.07}s ease` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                    <span style={{ padding:"2px 7px", borderRadius:"3px", background:`${tc}16`, border:`1px solid ${tc}32`, fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:tc, letterSpacing:".5px" }}>{s.tag}</span>
                    {s.hasClip && <span style={{ padding:"2px 7px", borderRadius:"3px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", fontSize:"9px", color:"rgba(255,255,255,.38)", fontFamily:"'JetBrains Mono',monospace" }}>▶ CLIP</span>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                    <Eye size={10} style={{ color:"rgba(255,255,255,.18)" }}/>
                    <span style={{ fontSize:"10px", color:"rgba(255,255,255,.22)", fontFamily:"'JetBrains Mono',monospace" }}>{s.views}</span>
                  </div>
                </div>

                <p style={{ fontSize:"12.5px", fontWeight:500, lineHeight:1.5, color:"rgba(255,255,255,.78)", margin:"0 0 8px", letterSpacing:".1px" }}>{s.title}</p>

                {cd && (
                  <div style={{ height:"32px", marginBottom:"7px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cd}><Line type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} dot={false}/></LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"10px", color:"rgba(255,255,255,.25)", fontFamily:"'JetBrains Mono',monospace" }}>{s.src} · {s.time}</span>
                  <ChevronRight size={12} style={{ color:"rgba(255,255,255,.18)" }}/>
                </div>
              </div>
            );
          })}

          {/* Pipeline Status */}
          <div style={{ padding:"16px 20px" }}>
            <div style={{ padding:"13px", background:"rgba(255,255,255,.015)", borderRadius:"8px", border:"1px solid rgba(255,255,255,.05)" }}>
              <div style={{ fontSize:"9px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,.28)", letterSpacing:"2px", marginBottom:"10px" }}>GENERATION PIPELINE</div>
              {[
                { label:"News Fetched",    done:true  },
                { label:"Script Written",  done:true  },
                { label:"Footage Sourced", done:true  },
                { label:"HeyGen Rendered", done:!!newsData || edition==="morning" },
                { label:`Next: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, done:false, scheduled:true },
              ].map(item=>(
                <div key={item.label} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
                  <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:item.scheduled?"rgba(255,255,255,.15)":item.done?"#34D399":"#FBBF24", flexShrink:0, animation:(!item.done&&!item.scheduled)?"blink 1s infinite":"none" }}/>
                  <span style={{ fontSize:"11px", color:item.scheduled?"rgba(255,255,255,.28)":item.done?"rgba(255,255,255,.5)":"#FBBF24", fontFamily:"'DM Sans',sans-serif" }}>{item.label}</span>
                  {item.done && <span style={{ marginLeft:"auto", fontSize:"10px", color:"#34D399" }}>✓</span>}
                  {!item.done && !item.scheduled && <span style={{ marginLeft:"auto", fontSize:"9px", color:"#FBBF24", fontFamily:"'JetBrains Mono',monospace" }}>RUNNING</span>}
                  {item.scheduled && <span style={{ marginLeft:"auto", fontSize:"9px", color:"rgba(255,255,255,.2)", fontFamily:"'JetBrains Mono',monospace" }}>SCHED</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
