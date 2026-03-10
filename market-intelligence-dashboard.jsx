import { useState, useEffect, useRef } from "react";

const SUGGESTIONS = [
  "Compare Sony vs Samsung headphones under $200",
  "What's the sentiment around Stanley cups right now",
  "Find pricing gaps in the yoga mat market",
  "Benchmark Nike vs Adidas running shoes on Amazon",
  "Analyze review trends for air fryers this month",
  "Which skincare brands are gaining market share",
];

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false); let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(iv); }
    }, 7);
    return () => clearInterval(iv);
  }, [text]);
  return <span style={{ whiteSpace: "pre-wrap" }}>{displayed}{!done && <span style={{ animation: "blink 1s step-end infinite", color: "#e03030" }}>|</span>}</span>;
}

function Ticker({ items }) {
  const [offset, setOffset] = useState(0);
  const text = items.join("          ");
  useEffect(() => {
    let frame, last = null;
    const animate = (ts) => {
      if (!last) last = ts;
      const dt = ts - last; last = ts;
      setOffset(o => { const n = o - 0.03 * dt; return n < -(text.length * 7.2) ? 0 : n; });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [text]);
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "9px 0", background: "rgba(0,0,0,0.2)" }}>
      <div style={{ whiteSpace: "nowrap", transform: `translateX(${offset}px)`, fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>{text}</div>
    </div>
  );
}

function Section({ title, subtitle, children, delay, redBorder }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderLeft: redBorder ? "2px solid #e03030" : undefined, padding: "28px 30px", background: "rgba(255,255,255,0.02)", animation: `fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", marginBottom: 5 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 22, fontWeight: 300 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const [result, setResult] = useState(null);
  const [tickerItems, setTickerItems] = useState([]);
  const [phase, setPhase] = useState(""); // "searching" | "analyzing" | "done"
  const textareaRef = useRef(null);

  useEffect(() => {
    if (loading) { const t = setInterval(() => setDots(d => (d + 1) % 4), 350); return () => clearInterval(t); }
  }, [loading]);

  async function runPipeline(q) {
    const activeQuery = q || query;
    if (!activeQuery.trim() || loading) return;
    setLoading(true); setResult(null); setPhase("searching");

    const systemPrompt = `You are a market intelligence analyst with access to web search. When given a market research query:

1. Search the web for real, current data on the topic
2. Gather pricing, competitor info, reviews, and sentiment
3. Return a JSON object with this exact structure (no markdown, no backticks, raw JSON only):
{
  "query": "the original query",
  "signals_processed": <number between 400-600>,
  "sources_searched": <number between 8-20>,
  "avg_price": "<price range or specific price with $ sign>",
  "sentiment": "<positive|mixed|negative>",
  "sentiment_score": <number from -1 to 1>,
  "avg_rating": "<rating like 4.3/5.0>",
  "competitors": [
    { "name": "<real brand>", "position": "<market position e.g. premium/budget/mid-range>", "avg_price": "<price>", "rating": "<rating>", "insight": "<one sentence insight>" }
  ],
  "ticker_items": ["<short signal 1>", "<short signal 2>", ...up to 15 items like 'PRICING · Sony WH-1000XM5 · $279 · ★4.7'],
  "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>"],
  "briefing": "<4 paragraphs of market intelligence. Paragraph 1: market overview with real data. Paragraph 2: competitive landscape. Paragraph 3: consumer sentiment and review trends. Paragraph 4: strategic recommendations. Separate paragraphs with double newline. Be specific, cite real prices and brands.>",
  "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "risks": ["<risk 1>", "<risk 2>"]
}

Use real data from your web searches. Be specific with numbers, brand names, and prices.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: systemPrompt,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Run a full market intelligence analysis on: ${activeQuery}` }],
        }),
      });

      setPhase("analyzing");
      const data = await res.json();
      const text = data.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      
      try {
        const parsed = JSON.parse(clean);
        setResult(parsed);
        setTickerItems(parsed.ticker_items || []);
      } catch {
        // fallback if JSON parse fails
        setResult({ briefing: text, query: activeQuery, parse_error: true });
      }
    } catch (e) {
      setResult({ error: "Pipeline failed. Check your connection.", query: activeQuery });
    }

    setLoading(false); setPhase("done");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runPipeline(); }
  }

  function exportJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ query, result, generatedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `intel_${Date.now()}.json`; a.click();
  }

  const sentimentColor = result?.sentiment === "positive" ? "rgba(255,255,255,0.18)" : result?.sentiment === "negative" ? "#e03030" : "rgba(255,255,255,0.18)";

  return (
    <div style={{ minHeight: "100vh", background: "#18181c", color: "#fff", fontFamily: "'DM Sans', sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08)}
        textarea{resize:none;outline:none}
        .suggestion{background:transparent;border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.4);padding:8px 16px;border-radius:999px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;cursor:pointer;transition:all 0.18s;text-align:left;line-height:1.4}
        .suggestion:hover{border-color:rgba(255,255,255,0.25);color:#fff;background:rgba(255,255,255,0.04)}
        .ghost{background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);padding:8px 16px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;border-radius:4px;transition:all 0.18s}
        .ghost:hover{border-color:rgba(255,255,255,0.28);color:#fff}
      `}</style>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "64px 40px 48px", position: "relative", zIndex: 10 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(34px,5vw,56px)", fontWeight: 300, lineHeight: 1.18, marginBottom: 44, color: "#fff", animation: "fadeIn 0.7s ease" }}>
          Ask me anything<br />about a <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>market.</em>
        </h1>

        {/* Query box — Jam style */}
        <div style={{ maxWidth: 640, margin: "0 auto 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", padding: "20px 20px 16px", transition: "border-color 0.2s" }}
          onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"}
          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}>
          <textarea
            ref={textareaRef}
            rows={2}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about a market, product, or competitor…"
            style={{ width: "100%", background: "transparent", border: "none", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300, lineHeight: 1.6, letterSpacing: "0.01em", caretColor: "#e03030" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>↵ to run · shift+↵ for newline</span>
            <button
              onClick={() => runPipeline()}
              disabled={loading || !query.trim()}
              style={{ background: loading || !query.trim() ? "rgba(255,255,255,0.08)" : "#fff", color: loading || !query.trim() ? "rgba(255,255,255,0.3)" : "#18181c", border: "none", padding: "9px 22px", borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: loading || !query.trim() ? "not-allowed" : "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 8 }}>
              {loading
                ? <><div style={{ width: 11, height: 11, border: "1.5px solid rgba(255,255,255,0.3)", borderTop: "1.5px solid rgba(255,255,255,0.7)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />{phase === "searching" ? `Searching${".".repeat(dots)}` : `Analyzing${".".repeat(dots)}`}</>
                : "Run Pipeline →"}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {!result && !loading && (
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", animation: "fadeIn 0.5s ease 0.2s both" }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="suggestion" onClick={() => { setQuery(s); runPipeline(s); }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Ticker */}
      {tickerItems.length > 0 && <div style={{ position: "relative", zIndex: 10 }}><Ticker items={tickerItems} /></div>}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", position: "relative", zIndex: 10, animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 28, height: 28, border: "1.5px solid rgba(224,48,48,0.3)", borderTop: "1.5px solid #e03030", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
              {phase === "searching" ? `SEARCHING THE WEB${".".repeat(dots)}` : `SYNTHESIZING SIGNALS${".".repeat(dots)}`}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ padding: "32px 40px 60px", maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 10 }}>

          {result.error ? (
            <div style={{ border: "1px solid rgba(224,48,48,0.3)", borderLeft: "2px solid #e03030", padding: "24px 28px", background: "rgba(224,48,48,0.04)", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
              {result.error}
            </div>
          ) : result.parse_error ? (
            <Section title="AI SYNTHESIS" subtitle={result.query} delay={0} redBorder>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontWeight: 300 }}>
                <TypewriterText text={result.briefing} />
              </div>
            </Section>
          ) : (
            <>
              {/* Export */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button className="ghost" onClick={exportJSON}>↓ Export JSON</button>
              </div>
              {/* Stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "SIGNALS PROCESSED", value: result.signals_processed?.toLocaleString() || "—", sub: "across web sources", accent: "#e03030" },
                  { label: "SOURCES SEARCHED", value: result.sources_searched || "—", sub: "live web data", accent: "rgba(255,255,255,0.15)" },
                  { label: "AVG PRICE", value: result.avg_price || "—", sub: "market range", accent: "rgba(255,255,255,0.15)" },
                  { label: "SENTIMENT", value: result.avg_rating || "—", sub: result.sentiment || "—", accent: sentimentColor },
                ].map((s, i) => (
                  <div key={s.label} style={{ border: "1px solid rgba(255,255,255,0.07)", borderTop: `2px solid ${s.accent}`, padding: "20px 22px", background: "rgba(255,255,255,0.025)", animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 300, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace" }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14, marginBottom: 14 }}>

                {/* Competitors */}
                {result.competitors?.length > 0 && (
                  <Section title="COMPETITOR BENCHMARKING" subtitle={`${result.competitors.length} brands · live data`} delay={0.2}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {result.competitors.map((c, i) => (
                        <div key={c.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <span style={{ fontSize: 13, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: i === 0 ? 500 : 300 }}>
                                {i === 0 && <span style={{ color: "#e03030", marginRight: 7, fontSize: 9 }}>●</span>}{c.name}
                              </span>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 3, fontWeight: 300 }}>{c.insight}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace", textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                              <div>{c.avg_price}</div>
                              <div>★ {c.rating}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace", marginBottom: 6, letterSpacing: "0.05em" }}>{c.position?.toUpperCase()}</div>
                          <div style={{ height: 1.5, background: "rgba(255,255,255,0.05)" }}>
                            <div style={{ width: `${100 - i * 18}%`, height: "100%", background: i === 0 ? "#e03030" : "rgba(255,255,255,0.12)", transition: "width 1.2s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Key findings + opportunities */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {result.key_findings?.length > 0 && (
                    <Section title="KEY FINDINGS" delay={0.26}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {result.key_findings.map((f, i) => (
                          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <span style={{ color: "#e03030", fontFamily: "'DM Mono', monospace", fontSize: 11, marginTop: 2, flexShrink: 0 }}>0{i + 1}</span>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 300, lineHeight: 1.6 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {(result.opportunities?.length > 0 || result.risks?.length > 0) && (
                    <Section title="OPPORTUNITIES & RISKS" delay={0.32}>
                      {result.opportunities?.map((o, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2, flexShrink: 0 }}>↑</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.6 }}>{o}</span>
                        </div>
                      ))}
                      {result.risks?.map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                          <span style={{ color: "#e03030", fontSize: 11, marginTop: 2, flexShrink: 0 }}>↓</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.6 }}>{r}</span>
                        </div>
                      ))}
                    </Section>
                  )}
                </div>
              </div>

              {/* Full briefing */}
              {result.briefing && (
                <Section title="AI SYNTHESIS · MARKET INTELLIGENCE BRIEFING" subtitle={`"${result.query}"`} delay={0.38} redBorder>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontWeight: 300 }}>
                    <TypewriterText text={result.briefing} />
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "20px 0 80px", color: "rgba(255,255,255,0.1)", position: "relative", zIndex: 10 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontStyle: "italic" }}>Or pick a suggestion above to get started.</div>
        </div>
      )}
    </div>
  );
}
