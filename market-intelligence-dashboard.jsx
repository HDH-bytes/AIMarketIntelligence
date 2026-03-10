import { useState, useEffect, useRef } from "react";

const CATEGORIES = ["Electronics", "Home & Kitchen", "Apparel", "Beauty", "Sports & Outdoors"];
const SIGNAL_TYPES = ["listing", "pricing", "review", "trend", "competitor"];

function randomBetween(a, b) {
  return +(Math.random() * (b - a) + a).toFixed(2);
}

function generateSignals(category) {
  const count = Math.floor(Math.random() * 80) + 440;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
    category,
    price: randomBetween(9.99, 299.99),
    rating: randomBetween(2.5, 5.0),
    reviewCount: Math.floor(Math.random() * 5000),
    sentiment: randomBetween(-1, 1),
    competitor: ["BrandA", "BrandB", "BrandC", "BrandD", "BrandE"][Math.floor(Math.random() * 5)],
    timestamp: Date.now() - Math.floor(Math.random() * 86400000),
  }));
}

function aggregateSignals(signals) {
  const avgPrice = signals.reduce((s, x) => s + x.price, 0) / signals.length;
  const avgRating = signals.reduce((s, x) => s + x.rating, 0) / signals.length;
  const avgSentiment = signals.reduce((s, x) => s + x.sentiment, 0) / signals.length;
  const byCompetitor = {};
  signals.forEach((s) => {
    if (!byCompetitor[s.competitor]) byCompetitor[s.competitor] = { count: 0, totalPrice: 0, totalRating: 0 };
    byCompetitor[s.competitor].count++;
    byCompetitor[s.competitor].totalPrice += s.price;
    byCompetitor[s.competitor].totalRating += s.rating;
  });
  const competitors = Object.entries(byCompetitor).map(([name, d]) => ({
    name, listings: d.count,
    avgPrice: +(d.totalPrice / d.count).toFixed(2),
    avgRating: +(d.totalRating / d.count).toFixed(2),
  })).sort((a, b) => b.listings - a.listings);
  const byType = {};
  signals.forEach((s) => { byType[s.type] = (byType[s.type] || 0) + 1; });
  return { count: signals.length, avgPrice: +avgPrice.toFixed(2), avgRating: +avgRating.toFixed(2), avgSentiment: +avgSentiment.toFixed(3), competitors, byType };
}

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false); let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; } else { setDone(true); clearInterval(iv); }
    }, 7);
    return () => clearInterval(iv);
  }, [text]);
  return <span style={{ whiteSpace: "pre-wrap" }}>{displayed}{!done && <span style={{ animation: "blink 1s step-end infinite", color: "#e03030" }}>|</span>}</span>;
}

function Ticker({ signals }) {
  const [offset, setOffset] = useState(0);
  const items = signals.slice(0, 30).map(s => `${s.type.toUpperCase()} · ${s.competitor} · $${s.price} · ★ ${s.rating}`);
  const text = items.join("          ");
  useEffect(() => {
    let frame, last = null;
    const animate = (ts) => {
      if (!last) last = ts;
      const dt = ts - last; last = ts;
      setOffset(o => { const n = o - 0.035 * dt; return n < -(text.length * 7.4) ? 0 : n; });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [text]);
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "9px 0", background: "rgba(0,0,0,0.2)" }}>
      <div style={{ whiteSpace: "nowrap", transform: `translateX(${offset}px)`, fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>{text}</div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, delay }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderTop: `2px solid ${accent}`, padding: "22px 24px", background: "rgba(255,255,255,0.025)", animation: `fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 300, color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
    </div>
  );
}

export default function App() {
  const [category, setCategory] = useState("Electronics");
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [dots, setDots] = useState(0);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    if (loading) { const t = setInterval(() => setDots(d => (d + 1) % 4), 350); return () => clearInterval(t); }
  }, [loading]);

  async function runPipeline() {
    setLoading(true); setSummary(""); setRan(false);
    await new Promise(r => setTimeout(r, 800));
    const s = generateSignals(category);
    setSignals(s);
    const agg = aggregateSignals(s);
    setStats(agg); setLoading(false); setRan(true);
    fetchSummary(agg, category);
  }

  async function fetchSummary(agg, cat) {
    setSummaryLoading(true); setSummary("");
    const prompt = `You are a market intelligence analyst. Analyze this dataset for the "${cat}" category and produce a concise intelligence briefing.\n\nData:\n- Total signals: ${agg.count}\n- Avg price: $${agg.avgPrice}\n- Avg rating: ${agg.avgRating}/5.0\n- Avg sentiment: ${agg.avgSentiment}\n- Signal types: ${JSON.stringify(agg.byType)}\n- Competitors: ${agg.competitors.map(c => `${c.name} (${c.listings} listings, $${c.avgPrice}, ★${c.avgRating})`).join("; ")}\n\nWrite 4 tight paragraphs: market overview, competitive landscape, consumer sentiment, strategic recommendations. Be data-driven and specific.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setSummary(data.content?.map(b => b.text || "").join("") || "No summary available.");
    } catch { setSummary("Error generating summary."); }
    setSummaryLoading(false);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ category, stats, signals: signals.slice(0, 50), generatedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `intel_${category.toLowerCase().replace(/ /g, "_")}.json`; a.click();
    setExportMsg("Exported ✓"); setTimeout(() => setExportMsg(""), 2000);
  }

  function exportCSV() {
    const rows = signals.map(s => `${s.id},${s.type},${s.category},${s.price},${s.rating},${s.reviewCount},${s.sentiment},${s.competitor}`).join("\n");
    const blob = new Blob(["id,type,category,price,rating,reviewCount,sentiment,competitor\n" + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `signals_${category.toLowerCase().replace(/ /g, "_")}.csv`; a.click();
    setExportMsg("Exported ✓"); setTimeout(() => setExportMsg(""), 2000);
  }

  const maxListings = stats ? Math.max(...stats.competitors.map(c => c.listings)) : 1;
  const typeColors = { listing: "#e03030", pricing: "rgba(255,255,255,0.7)", review: "rgba(255,255,255,0.45)", trend: "rgba(255,255,255,0.3)", competitor: "rgba(255,255,255,0.2)" };

  return (
    <div style={{ minHeight: "100vh", background: "#18181c", color: "#fff", fontFamily: "'DM Sans', sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
        select option{background:#18181c}
        .pill{background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.45);padding:7px 18px;border-radius:999px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.18s;letter-spacing:0.04em}
        .pill:hover{border-color:rgba(255,255,255,0.28);color:#fff}
        .pill.on{border-color:#e03030;color:#fff;background:rgba(224,48,48,0.1)}
        .run{background:#fff;color:#18181c;border:none;padding:12px 30px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border-radius:5px;transition:all 0.18s;letter-spacing:0.01em}
        .run:hover{background:#e8e8e8;transform:translateY(-1px)}
        .run:disabled{background:rgba(255,255,255,0.13);color:rgba(255,255,255,0.35);cursor:not-allowed;transform:none}
        .ghost{background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);padding:9px 16px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;border-radius:4px;transition:all 0.18s}
        .ghost:hover{border-color:rgba(255,255,255,0.28);color:#fff}
      `}</style>

      {/* Dot grid */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize:"26px 26px", pointerEvents:"none", zIndex:0 }} />
      {/* Top red glow */}
      <div style={{ position:"fixed", top:-250, left:"50%", transform:"translateX(-50%)", width:700, height:500, background:"radial-gradient(ellipse, rgba(224,48,48,0.07) 0%, transparent 68%)", pointerEvents:"none", zIndex:0 }} />

      {/* Nav */}
      <nav style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"15px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#e03030", boxShadow:"0 0 10px rgba(224,48,48,0.7)" }} />
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.45)", letterSpacing:"0.15em" }}>MARKET INTEL</span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.18)", letterSpacing:"0.1em" }}>
          {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase()}
        </span>
      </nav>

      {/* Hero */}
      <div style={{ textAlign:"center", padding:"68px 40px 52px", position:"relative", zIndex:10 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(255,255,255,0.09)", borderRadius:999, padding:"5px 16px", marginBottom:30, fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.07em" }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#e03030", display:"inline-block", boxShadow:"0 0 6px rgba(224,48,48,0.6)" }} />
          AI-POWERED · 500+ DAILY SIGNALS
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"clamp(34px,5vw,56px)", fontWeight:300, lineHeight:1.18, marginBottom:18, color:"#fff", animation:"fadeIn 0.7s ease" }}>
          The intelligence platform<br />built for <em style={{ fontStyle:"italic", color:"rgba(255,255,255,0.6)" }}>AI agents.</em>
        </h1>
        <p style={{ color:"rgba(255,255,255,0.32)", fontSize:14, fontWeight:300, maxWidth:380, margin:"0 auto 42px", lineHeight:1.75 }}>
          Process market signals, benchmark competitors, and synthesize insights — automatically.
        </p>

        {/* Category pills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:30 }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`pill ${category===c?"on":""}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
          <button className="run" onClick={runPipeline} disabled={loading}>
            {loading ? `Processing${".".repeat(dots)}` : "Run Pipeline →"}
          </button>
          {ran && !loading && (
            <div style={{ display:"flex", gap:8, animation:"fadeIn 0.3s ease" }}>
              <button className="ghost" onClick={exportJSON}>↓ JSON</button>
              <button className="ghost" onClick={exportCSV}>↓ CSV</button>
              {exportMsg && <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", alignSelf:"center", fontFamily:"'DM Mono',monospace" }}>{exportMsg}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Ticker */}
      {signals.length > 0 && <div style={{ position:"relative", zIndex:10 }}><Ticker signals={signals} /></div>}

      {/* Dashboard */}
      {stats && (
        <div style={{ padding:"40px 40px 60px", maxWidth:1100, margin:"0 auto", position:"relative", zIndex:10 }}>

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
            <StatCard label="Signals Processed" value={stats.count.toLocaleString()} sub="today's pipeline" accent="#e03030" delay={0} />
            <StatCard label="Avg Price Index" value={`$${stats.avgPrice}`} sub="all listings" accent="rgba(255,255,255,0.18)" delay={0.06} />
            <StatCard label="Sentiment Score" value={stats.avgSentiment>0?`+${stats.avgSentiment}`:stats.avgSentiment} sub={stats.avgSentiment>0?"net positive":"net negative"} accent={stats.avgSentiment>0?"rgba(255,255,255,0.18)":"#e03030"} delay={0.12} />
            <StatCard label="Avg Rating" value={`★ ${stats.avgRating}`} sub="consumer score" accent="rgba(255,255,255,0.18)" delay={0.18} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

            {/* Competitors */}
            <div style={{ border:"1px solid rgba(255,255,255,0.07)", padding:"28px 30px", background:"rgba(255,255,255,0.02)", animation:"fadeUp 0.5s ease 0.22s both" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", fontFamily:"'DM Mono',monospace", marginBottom:5 }}>COMPETITOR BENCHMARKING</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:26, fontWeight:300 }}>{category} · {stats.competitors.length} brands tracked</div>
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {stats.competitors.map((c, i) => (
                  <div key={c.name}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, alignItems:"center" }}>
                      <span style={{ fontSize:13, color:i===0?"#fff":"rgba(255,255,255,0.45)", fontWeight:i===0?500:300 }}>
                        {i===0 && <span style={{ color:"#e03030", marginRight:7, fontSize:9 }}>●</span>}{c.name}
                      </span>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:"'DM Mono',monospace", display:"flex", gap:16 }}>
                        <span>${c.avgPrice}</span><span>★ {c.avgRating}</span><span>{c.listings}</span>
                      </div>
                    </div>
                    <div style={{ height:1.5, background:"rgba(255,255,255,0.05)", borderRadius:1 }}>
                      <div style={{ width:`${(c.listings/maxListings)*100}%`, height:"100%", background:i===0?"#e03030":"rgba(255,255,255,0.12)", borderRadius:1, transition:"width 1.1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal types */}
            <div style={{ border:"1px solid rgba(255,255,255,0.07)", padding:"28px 30px", background:"rgba(255,255,255,0.02)", animation:"fadeUp 0.5s ease 0.28s both" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", fontFamily:"'DM Mono',monospace", marginBottom:5 }}>SIGNAL DISTRIBUTION</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:26, fontWeight:300 }}>{stats.count.toLocaleString()} signals · automated ingestion</div>
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {Object.entries(stats.byType).sort((a,b)=>b[1]-a[1]).map(([type,count])=>{
                  const pct=((count/stats.count)*100).toFixed(1);
                  return (
                    <div key={type}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                        <span style={{ fontSize:12, color:typeColors[type]||"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.04em" }}>{type}</span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.22)", fontFamily:"'DM Mono',monospace" }}>{count} · {pct}%</span>
                      </div>
                      <div style={{ height:1.5, background:"rgba(255,255,255,0.05)", borderRadius:1 }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:type==="listing"?"#e03030":"rgba(255,255,255,0.12)", borderRadius:1, transition:"width 1.1s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:26, paddingTop:22, borderTop:"1px solid rgba(255,255,255,0.05)", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[["~80%","time saved"],["5+","categories"],["3+","LLM APIs"]].map(([val,lbl])=>(
                  <div key={lbl} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:300, color:"#fff", fontFamily:"'Playfair Display',serif" }}>{val}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"'DM Mono',monospace", marginTop:4, letterSpacing:"0.06em" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LLM Summary */}
          {(summaryLoading || summary) && (
            <div style={{ border:"1px solid rgba(255,255,255,0.07)", borderLeft:"2px solid #e03030", padding:"32px 36px", background:"rgba(255,255,255,0.02)", animation:"fadeUp 0.5s ease 0.34s both" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
                <div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", fontFamily:"'DM Mono',monospace", marginBottom:5 }}>AI SYNTHESIS</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", fontWeight:300 }}>Market Intelligence Briefing · {category}</div>
                </div>
                {summaryLoading && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:"'DM Mono',monospace" }}>
                    <div style={{ width:12, height:12, border:"1px solid rgba(224,48,48,0.4)", borderTop:"1px solid #e03030", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
                    Generating{".".repeat(dots)}
                  </div>
                )}
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.9, fontWeight:300, minHeight:60 }}>
                {summaryLoading && !summary
                  ? <span style={{ color:"rgba(255,255,255,0.18)", fontFamily:"'DM Mono',monospace", fontSize:12 }}>Synthesizing {stats?.count} signals…</span>
                  : <TypewriterText text={summary} />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!ran && !loading && (
        <div style={{ textAlign:"center", padding:"32px 0 80px", color:"rgba(255,255,255,0.1)", position:"relative", zIndex:10 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontStyle:"italic" }}>Select a category and run your pipeline above.</div>
        </div>
      )}
    </div>
  );
}
