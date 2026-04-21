import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Category Data ────────────────────────────────────────────
const EXPENSE_CATS = ["Housing","Food","Transport","Utilities","Subscriptions","Healthcare","Entertainment","Credit Card Payment","Shopping","Other"];
const INCOME_CATS  = ["Salary","Freelance","Investment","Bonus","Other Income"];
const CAT_META = {
  Housing:{color:"#6366F1",icon:"🏠"}, Food:{color:"#10B981",icon:"🍽️"}, Transport:{color:"#F59E0B",icon:"🚗"},
  Utilities:{color:"#3B82F6",icon:"⚡"}, Subscriptions:{color:"#EC4899",icon:"📱"}, Healthcare:{color:"#EF4444",icon:"❤️"},
  Entertainment:{color:"#06B6D4",icon:"🎬"}, "Credit Card Payment":{color:"#F97316",icon:"💳"},
  Shopping:{color:"#84CC16",icon:"🛍️"}, Other:{color:"#6B7280",icon:"📦"},
  Salary:{color:"#10B981",icon:"💰"}, Freelance:{color:"#8B5CF6",icon:"💼"},
  Investment:{color:"#3B82F6",icon:"📈"}, Bonus:{color:"#F59E0B",icon:"🎁"}, "Other Income":{color:"#06B6D4",icon:"💵"},
};
const cc = c => CAT_META[c]?.color || "#6B7280";
const ci = c => CAT_META[c]?.icon  || "💳";

// ── Themes ───────────────────────────────────────────────────
const THEMES = {
  system:   { name:"System",   icon:"⚙️", swatches:["#f8fafc","#0f172a","#10B981"], isSystem:true },
  light:    { name:"Light",    icon:"☀️", bg:"#ffffff",  bgS:"#f8fafc",  bgT:"#f1f5f9",  tP:"#0f172a",  tS:"#475569",  tT:"#94a3b8",  b:"rgba(0,0,0,0.09)",     bS:"rgba(0,0,0,0.16)",    swatches:["#ffffff","#f1f5f9","#0f172a"] },
  dark:     { name:"Dark",     icon:"🌙", bg:"#0f172a",  bgS:"#1e293b",  bgT:"#0d1526",  tP:"#f8fafc",  tS:"#94a3b8",  tT:"#64748b",  b:"rgba(255,255,255,0.09)",bS:"rgba(255,255,255,0.17)",swatches:["#0f172a","#1e293b","#94a3b8"] },
  ocean:    { name:"Ocean",    icon:"🌊", bg:"#020f1a",  bgS:"#061d2e",  bgT:"#010b15",  tP:"#e0f7ff",  tS:"#67d4f0",  tT:"#38bdf8",  b:"rgba(56,189,248,0.13)", bS:"rgba(56,189,248,0.24)",swatches:["#020f1a","#061d2e","#38bdf8"] },
  midnight: { name:"Midnight", icon:"🔮", bg:"#0d0320",  bgS:"#1a0840",  bgT:"#070118",  tP:"#f3e8ff",  tS:"#c084fc",  tT:"#7c3aed",  b:"rgba(192,132,252,0.13)",bS:"rgba(192,132,252,0.24)",swatches:["#0d0320","#1a0840","#c084fc"] },
  sunset:   { name:"Sunset",   icon:"🌅", bg:"#110600",  bgS:"#1f0d00",  bgT:"#0a0400",  tP:"#fff8f0",  tS:"#fbbf24",  tT:"#f97316",  b:"rgba(251,191,36,0.13)", bS:"rgba(251,191,36,0.24)",swatches:["#110600","#1f0d00","#fbbf24"] },
  forest:   { name:"Forest",   icon:"🌲", bg:"#031008",  bgS:"#061f10",  bgT:"#020c06",  tP:"#f0fdf4",  tS:"#86efac",  tT:"#22c55e",  b:"rgba(134,239,172,0.13)",bS:"rgba(134,239,172,0.24)",swatches:["#031008","#061f10","#86efac"] },
  rose:     { name:"Rose",     icon:"🌸", bg:"#120310",  bgS:"#210820",  bgT:"#0c020b",  tP:"#fdf2f8",  tS:"#f9a8d4",  tT:"#ec4899",  b:"rgba(249,168,212,0.13)",bS:"rgba(249,168,212,0.24)",swatches:["#120310","#210820","#f9a8d4"] },
  slate:    { name:"Slate",    icon:"🪨", bg:"#0a0a0f",  bgS:"#13131a",  bgT:"#07070c",  tP:"#e2e8f0",  tS:"#94a3b8",  tT:"#64748b",  b:"rgba(148,163,184,0.12)",bS:"rgba(148,163,184,0.22)",swatches:["#0a0a0f","#13131a","#94a3b8"] },
};

const resolveTheme = (key, sysDark) => {
  if (key === "system") return THEMES[sysDark ? "dark" : "light"];
  return THEMES[key] || THEMES.light;
};

const themeVars = (key, sysDark) => {
  const t = resolveTheme(key, sysDark);
  return {
    "--color-background-primary":   t.bg,
    "--color-background-secondary": t.bgS,
    "--color-background-tertiary":  t.bgT,
    "--color-text-primary":         t.tP,
    "--color-text-secondary":       t.tS,
    "--color-text-tertiary":        t.tT,
    "--color-border-tertiary":      t.b,
    "--color-border-secondary":     t.bS,
  };
};

// ── Helpers ──────────────────────────────────────────────────
const fmt   = n => "$" + Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK  = n => n >= 1000 ? "$"+(n/1000).toFixed(1)+"k" : "$"+Math.round(n);
const today = () => new Date().toISOString().slice(0,10);
const curMonth = () => new Date().toISOString().slice(0,7);
const TABS = [{id:"overview",label:"Overview"},{id:"transactions",label:"Transactions"},{id:"budget",label:"Budget"},{id:"credit",label:"Credit Score"},{id:"savings",label:"Savings Goals"},{id:"ai",label:"AI Advisor"}];

// ── SVG Credit Gauge ──────────────────────────────────────────
function CreditGauge({ score }) {
  const cx=110,cy=105,r=85, pct=Math.min(0.9999,Math.max(0.0001,(score-300)/550));
  const toR=d=>d*Math.PI/180, pt=d=>({x:+(cx+r*Math.cos(toR(d))).toFixed(2),y:+(cy-r*Math.sin(toR(d))).toFixed(2)});
  const s=pt(180),e=pt(0),tip=pt(180-pct*180);
  const col=score>=800?"#10B981":score>=740?"#34D399":score>=670?"#F59E0B":score>=580?"#F97316":"#EF4444";
  const lbl=score>=800?"Exceptional":score>=740?"Very Good":score>=670?"Good":score>=580?"Fair":"Poor";
  return (
    <svg viewBox="0 0 220 130" style={{width:"100%",maxWidth:280,display:"block",margin:"0 auto"}}>
      <defs><linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#EF4444"/><stop offset="40%" stopColor="#F97316"/><stop offset="70%" stopColor="#F59E0B"/><stop offset="100%" stopColor="#10B981"/></linearGradient></defs>
      <path d={`M ${s.x},${s.y} A ${r},${r} 0 0,0 ${e.x},${e.y}`} fill="none" stroke="#374151" strokeWidth={16} strokeLinecap="round"/>
      <path d={`M ${s.x},${s.y} A ${r},${r} 0 0,0 ${tip.x},${tip.y}`} fill="none" stroke="url(#gGrad)" strokeWidth={16} strokeLinecap="round"/>
      <circle cx={tip.x} cy={tip.y} r={7} fill={col} stroke="white" strokeWidth={3}/>
      <text x={cx} y={cy-8} textAnchor="middle" fontSize={34} fontWeight="700" fill={col} fontFamily="system-ui">{score}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize={11} fill="#9ca3af" fontFamily="system-ui">{lbl}</text>
      <text x={s.x} y={s.y+16} textAnchor="middle" fontSize={9} fill="#9ca3af" fontFamily="system-ui">300</text>
      <text x={e.x} y={e.y+16} textAnchor="middle" fontSize={9} fill="#9ca3af" fontFamily="system-ui">850</text>
    </svg>
  );
}

// ── SVG Ring Progress ─────────────────────────────────────────
function Ring({ pct, color, size=84 }) {
  const r=(size-12)/2, c=2*Math.PI*r, fill=Math.min(pct/100,1)*c;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#374151" strokeWidth={9}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={9} strokeDasharray={`${fill} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:13,fontWeight:700,color}}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Gradient Stat Card ────────────────────────────────────────
function StatCard({ label, value, sub, g1, g2, icon }) {
  return (
    <div style={{borderRadius:16,padding:"1.1rem 1.25rem",background:`linear-gradient(135deg,${g1},${g2})`,color:"white",position:"relative",overflow:"hidden",minWidth:0}}>
      <div style={{position:"absolute",top:-10,right:-10,fontSize:44,opacity:0.18,lineHeight:1}}>{icon}</div>
      <p style={{margin:"0 0 2px",fontSize:11,fontWeight:600,opacity:0.8,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</p>
      <p style={{margin:"0 0 4px",fontSize:26,fontWeight:700,lineHeight:1.1}}>{value}</p>
      {sub && <p style={{margin:0,fontSize:11,opacity:0.75}}>{sub}</p>}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:16,padding:"1.1rem 1.25rem",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",...style}}>{children}</div>;
}
function STitle({ children }) {
  return <p style={{margin:"0 0 0.875rem",fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>{children}</p>;
}
function PBar({ pct, color }) {
  const p=Math.min(100,Math.max(0,pct)), c=p>90?"#EF4444":p>70?"#F59E0B":color||"#10B981";
  return <div style={{background:"var(--color-background-tertiary)",borderRadius:8,height:8,overflow:"hidden"}}><div style={{width:p+"%",background:c,height:"100%",borderRadius:8,transition:"width 0.4s"}}/></div>;
}
const INP = {padding:"7px 10px",fontSize:13,borderRadius:10,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",width:"100%",outline:"none",boxSizing:"border-box"};

// ── Theme Picker ──────────────────────────────────────────────
function ThemePicker({ current, onSelect }) {
  return (
    <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:999,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:16,padding:"1rem",width:310,boxShadow:"0 12px 40px rgba(0,0,0,0.25)"}}>
      <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"var(--color-text-primary)"}}>Choose Theme</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {Object.entries(THEMES).map(([key,t]) => {
          const active = current === key;
          const bg = key==="system" ? "linear-gradient(135deg,#f8fafc 50%,#0f172a 50%)" : t.bg;
          return (
            <button key={key} onClick={()=>onSelect(key)} style={{
              borderRadius:12,padding:"10px 6px",cursor:"pointer",background:bg,
              border:active?"2.5px solid #10B981":"1.5px solid rgba(255,255,255,0.1)",
              outline:"none",transition:"all 0.15s",position:"relative",overflow:"hidden"
            }}>
              {active && <div style={{position:"absolute",top:4,right:4,width:12,height:12,borderRadius:"50%",background:"#10B981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"white"}}>✓</div>}
              <div style={{display:"flex",gap:4,marginBottom:6,justifyContent:"center"}}>
                {t.swatches.map((s,i)=><span key={i} style={{width:13,height:13,borderRadius:"50%",background:s,border:"1px solid rgba(255,255,255,0.25)",display:"inline-block"}}/>)}
              </div>
              <p style={{margin:0,fontSize:10,fontWeight:600,color:key==="system"?"#475569":key==="light"?t.tP:"rgba(255,255,255,0.9)",letterSpacing:"0.2px"}}>{t.icon} {t.name}</p>
            </button>
          );
        })}
      </div>
      <p style={{margin:"10px 0 0",fontSize:10,color:"var(--color-text-tertiary)",textAlign:"center"}}>Theme is saved across sessions</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("overview");
  const [txns, setTxns] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [scores, setScores] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [themeKey, setThemeKey] = useState("system");
  const [sysDark, setSysDark] = useState(false);
  const [showTP, setShowTP] = useState(false);
  const tpRef = useRef();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSysDark(mq.matches);
    const h = e => setSysDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const h = e => { if (tpRef.current && !tpRef.current.contains(e.target)) setShowTP(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    (async () => {
      const ld = async (k,set) => { try { const r=await window.storage.get(k); if(r) set(JSON.parse(r.value)); } catch {} };
      await Promise.all([ld("ft_txns",setTxns),ld("ft_budgets",setBudgets),ld("ft_scores",setScores),ld("ft_goals",setGoals)]);
      try { const r=await window.storage.get("ft_theme"); if(r) setThemeKey(r.value); } catch {}
      setLoaded(true);
    })();
  }, []);

  const sv = async (k,data,setter) => { setter(data); try { await window.storage.set(k,JSON.stringify(data)); } catch {} };
  const setT = d => sv("ft_txns",d,setTxns);
  const setB = d => sv("ft_budgets",d,setBudgets);
  const setS = d => sv("ft_scores",d,setScores);
  const setG = d => sv("ft_goals",d,setGoals);

  const selectTheme = async key => {
    setThemeKey(key); setShowTP(false);
    try { await window.storage.set("ft_theme",key); } catch {}
  };

  const month = curMonth();
  const monthTxns = txns.filter(t=>t.date.startsWith(month));
  const income   = monthTxns.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses = monthTxns.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const net = income - expenses;
  const lastScore  = scores.length ? scores[scores.length-1].score : null;
  const ccBal      = txns.filter(t=>t.category==="Credit Card Payment"&&t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const creditUtil = Math.min(100,Math.round(ccBal/5000*100));
  const vars = themeVars(themeKey, sysDark);
  const activeTk = themeKey==="system" ? (sysDark?"dark":"light") : themeKey;
  const activeTheme = THEMES[activeTk] || THEMES.light;

  const loadingEl = (
    <div style={{...vars,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:14,background:activeTheme.bgT||"#f1f5f9"}}>
      <div style={{width:38,height:38,border:"3px solid #10B981",borderTop:"3px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
      <p style={{color:"#64748b",fontSize:14,margin:0}}>Loading FinTrack…</p>
    </div>
  );

  if (!loaded) return loadingEl;

  const p = {txns,setTxns:setT,budgets,setBudgets:setB,scores,setScores:setS,goals,setGoals:setG,monthTxns,income,expenses,net,lastScore,creditUtil,month};

  return (
    <div style={{...vars,minHeight:"100vh",background:"var(--color-background-tertiary)",fontFamily:"system-ui,-apple-system,sans-serif",transition:"background 0.3s,color 0.3s"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
      {/* Header */}
      <div style={{background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",padding:"0.875rem 1.25rem 0",position:"relative",zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#10B981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 2px 8px rgba(16,185,129,0.35)"}}>💰</div>
            <div>
              <h1 style={{margin:0,fontSize:16,fontWeight:700,color:"var(--color-text-primary)",letterSpacing:"-0.3px"}}>FinTrack</h1>
              <p style={{margin:0,fontSize:10,color:"var(--color-text-tertiary)",letterSpacing:"0.3px"}}>PERSONAL FINANCE DASHBOARD</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"linear-gradient(135deg,#10B981,#059669)",borderRadius:8,padding:"4px 10px"}}>
              <p style={{margin:0,fontSize:11,color:"white",fontWeight:600}}>{new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
            </div>
            {/* Theme Button */}
            <div ref={tpRef} style={{position:"relative"}}>
              <button onClick={()=>setShowTP(!showTP)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 11px",borderRadius:10,
                border:`1.5px solid ${showTP?"#10B981":"var(--color-border-secondary)"}`,
                background:showTP?"rgba(16,185,129,0.1)":"var(--color-background-secondary)",
                cursor:"pointer",fontSize:13,color:"var(--color-text-primary)",fontWeight:500,transition:"all 0.15s"
              }}>
                <span style={{fontSize:14}}>{THEMES[themeKey]?.icon||"⚙️"}</span>
                <span style={{fontSize:12}}>{THEMES[themeKey]?.name||"System"}</span>
                <span style={{fontSize:10,opacity:0.6,marginLeft:2}}>{showTP?"▲":"▼"}</span>
              </button>
              {showTP && <ThemePicker current={themeKey} onSelect={selectTheme}/>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"8px 14px",fontSize:13,border:"none",background:"none",cursor:"pointer",whiteSpace:"nowrap",
              color:tab===t.id?"#10B981":"var(--color-text-secondary)",
              borderBottom:tab===t.id?"2.5px solid #10B981":"2.5px solid transparent",
              fontWeight:tab===t.id?700:400,transition:"all 0.15s"
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Theme banner */}
      {themeKey!=="system"&&themeKey!=="light"&&themeKey!=="dark" && (
        <div style={{padding:"6px 1.25rem",background:`linear-gradient(90deg,${activeTheme.bgS}dd,${activeTheme.bg}dd)`,borderBottom:`0.5px solid ${activeTheme.b}`,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13}}>{activeTheme.icon}</span>
          <span style={{fontSize:11,color:activeTheme.tS,fontWeight:500}}>{activeTheme.name} theme active</span>
        </div>
      )}

      <div style={{padding:"1.25rem",maxWidth:780,margin:"0 auto"}}>
        {tab==="overview"&&<Overview {...p}/>}
        {tab==="transactions"&&<Transactions {...p}/>}
        {tab==="budget"&&<Budget {...p}/>}
        {tab==="credit"&&<CreditTab {...p}/>}
        {tab==="savings"&&<SavingsTab {...p}/>}
        {tab==="ai"&&<AIAdvisor {...p}/>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════
function Overview({ income, expenses, net, lastScore, txns, monthTxns, goals, creditUtil }) {
  const byCategory = {};
  monthTxns.filter(t=>t.type==="expense").forEach(t=>{byCategory[t.category]=(byCategory[t.category]||0)+t.amount;});
  const pieData=Object.entries(byCategory).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const last6=Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-(5-i));
    const m=d.toISOString().slice(0,7),label=d.toLocaleDateString("en-US",{month:"short"});
    const inc=txns.filter(t=>t.date.startsWith(m)&&t.type==="income").reduce((s,t)=>s+t.amount,0);
    const exp=txns.filter(t=>t.date.startsWith(m)&&t.type==="expense").reduce((s,t)=>s+t.amount,0);
    return {month:label,Income:Math.round(inc),Expenses:Math.round(exp)};
  });
  const savRate=income>0?Math.round((net/income)*100):0;
  const totalSaved=goals.reduce((s,g)=>s+g.saved,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
        <StatCard label="Monthly Income" value={fmtK(income)} sub="This month" g1="#10B981" g2="#059669" icon="💰"/>
        <StatCard label="Monthly Expenses" value={fmtK(expenses)} sub="This month" g1="#EF4444" g2="#DC2626" icon="💸"/>
        <StatCard label="Net Savings" value={fmtK(Math.abs(net))} sub={net>=0?"Saved this month":"Deficit"} g1={net>=0?"#3B82F6":"#9333EA"} g2={net>=0?"#2563EB":"#7C3AED"} icon={net>=0?"📈":"📉"}/>
        <StatCard label="Credit Score" value={lastScore||"—"} sub={lastScore?(lastScore>=750?"Great standing":lastScore>=670?"Fair standing":"Needs work"):"Not logged yet"} g1="#8B5CF6" g2="#7C3AED" icon="⭐"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[{label:"Savings Rate",value:savRate+"%",sub:income>0?(savRate>=20?"On track":"Aim for 20%"):"Add income",col:savRate>=20?"#10B981":"#F59E0B"},{label:"Credit Utilization",value:creditUtil+"%",sub:creditUtil<30?"Healthy (<30%)":"High — reduce",col:creditUtil<30?"#10B981":"#EF4444"},{label:"Total Goals Saved",value:fmtK(totalSaved),sub:goals.length+" active goal"+(goals.length!==1?"s":""),col:"#6366F1"}].map((m,i)=>(
          <div key={i} style={{background:"var(--color-background-primary)",borderRadius:12,padding:"0.875rem",border:"0.5px solid var(--color-border-tertiary)",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <p style={{margin:"0 0 2px",fontSize:11,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:600}}>{m.label}</p>
            <p style={{margin:"0 0 2px",fontSize:20,fontWeight:700,color:m.col}}>{m.value}</p>
            <p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{m.sub}</p>
          </div>
        ))}
      </div>
      <Card>
        <STitle>Cash Flow — Last 6 Months</STitle>
        <div style={{width:"100%",height:210}}>
          <ResponsiveContainer>
            <AreaChart data={last6}>
              <defs>
                <linearGradient id="iG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                <linearGradient id="eG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+(v>=1000?(v/1000).toFixed(1)+"k":v)}/>
              <Tooltip contentStyle={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,fontSize:12}} formatter={v=>fmt(v)}/>
              <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2.5} fill="url(#iG)" dot={{fill:"#10B981",r:3}} activeDot={{r:5}}/>
              <Area type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2.5} fill="url(#eG)" dot={{fill:"#EF4444",r:3}} activeDot={{r:5}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:6,fontSize:12}}>
          <span style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-text-secondary)"}}><span style={{width:10,height:10,borderRadius:3,background:"#10B981",display:"inline-block"}}/>Income</span>
          <span style={{display:"flex",alignItems:"center",gap:6,color:"var(--color-text-secondary)"}}><span style={{width:10,height:10,borderRadius:3,background:"#EF4444",display:"inline-block"}}/>Expenses</span>
        </div>
      </Card>
      {pieData.length>0&&(
        <Card>
          <STitle>Spending Breakdown — This Month</STitle>
          <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{width:160,height:160,flexShrink:0}}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>{pieData.map((d,i)=><Cell key={i} fill={cc(d.name)} strokeWidth={0}/>)}</Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,fontSize:12}}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1,minWidth:140}}>
              {pieData.slice(0,7).map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:15}}>{ci(d.name)}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"var(--color-text-primary)",fontWeight:500}}>{d.name}</span><span style={{color:"var(--color-text-secondary)"}}>{fmtK(d.value)}</span></div>
                    <div style={{background:"var(--color-background-tertiary)",borderRadius:4,height:5}}><div style={{width:Math.round((d.value/expenses)*100)+"%",background:cc(d.name),height:"100%",borderRadius:4}}/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      {txns.length>0&&(
        <Card>
          <STitle>Recent Transactions</STitle>
          {txns.slice(0,5).map((t,i)=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?"0.5px solid var(--color-border-tertiary)":"none"}}>
              <div style={{width:36,height:36,borderRadius:10,background:cc(t.category)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{ci(t.category)}</div>
              <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--color-text-primary)"}}>{t.description||t.category}</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{t.category} · {t.date}</p></div>
              <span style={{fontWeight:700,fontSize:14,color:t.type==="income"?"#10B981":"#EF4444",flexShrink:0}}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════
function Transactions({ txns, setTxns, monthTxns }) {
  const blank={date:today(),type:"expense",category:EXPENSE_CATS[0],amount:"",description:""};
  const [form,setForm]=useState(blank),[filter,setFilter]=useState("all"),[search,setSearch]=useState(""),[showForm,setShowForm]=useState(false),[editId,setEditId]=useState(null);
  const cats=form.type==="income"?INCOME_CATS:EXPENSE_CATS;
  const add=()=>{
    if(!form.amount||isNaN(form.amount)||+form.amount<=0) return;
    if(editId) setTxns(txns.map(t=>t.id===editId?{...form,amount:+form.amount,id:editId}:t));
    else setTxns([{...form,amount:+form.amount,id:Date.now()},...txns]);
    setForm(blank);setShowForm(false);setEditId(null);
  };
  const startEdit=t=>{setForm({date:t.date,type:t.type,category:t.category,amount:t.amount.toString(),description:t.description});setEditId(t.id);setShowForm(true);};
  const cancel=()=>{setForm(blank);setEditId(null);setShowForm(false);};
  const del=id=>setTxns(txns.filter(t=>t.id!==id));
  const visible=txns.filter(t=>{
    if(filter==="income"&&t.type!=="income") return false;
    if(filter==="expense"&&t.type!=="expense") return false;
    if(search&&!t.description.toLowerCase().includes(search.toLowerCase())&&!t.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).slice(0,80);
  const mInc=monthTxns.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const mExp=monthTxns.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{borderRadius:12,padding:"0.875rem 1rem",background:"linear-gradient(135deg,#10B981,#059669)",color:"white"}}><p style={{margin:"0 0 2px",fontSize:11,opacity:0.8,fontWeight:600}}>INCOME THIS MONTH</p><p style={{margin:0,fontSize:22,fontWeight:700}}>{fmtK(mInc)}</p></div>
        <div style={{borderRadius:12,padding:"0.875rem 1rem",background:"linear-gradient(135deg,#EF4444,#DC2626)",color:"white"}}><p style={{margin:"0 0 2px",fontSize:11,opacity:0.8,fontWeight:600}}>EXPENSES THIS MONTH</p><p style={{margin:0,fontSize:22,fontWeight:700}}>{fmtK(mExp)}</p></div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="Search transactions…" value={search} onChange={e=>setSearch(e.target.value)} style={{...INP,flex:1,minWidth:140}}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{...INP,width:"auto",padding:"7px 10px"}}><option value="all">All</option><option value="income">Income</option><option value="expense">Expenses</option></select>
        <button onClick={()=>{if(showForm)cancel();else setShowForm(true);}} style={{padding:"7px 16px",fontSize:13,borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"white",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>{showForm?"Cancel":"+ Add"}</button>
      </div>
      {showForm&&(
        <Card>
          <STitle>{editId?"Edit Transaction":"New Transaction"}</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{...INP,marginTop:4}}/></div>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value,category:(e.target.value==="income"?INCOME_CATS:EXPENSE_CATS)[0]})} style={{...INP,marginTop:4}}><option value="expense">Expense</option><option value="income">Income</option></select></div>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...INP,marginTop:4}}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Amount ($)</label><input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={{...INP,marginTop:4}}/></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Description</label><input placeholder="e.g. Grocery run, Netflix, Paycheck…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...INP,marginTop:4}}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={add} style={{padding:"8px 22px",fontSize:13,fontWeight:600,borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",cursor:"pointer"}}>{editId?"Update":"Save"} Transaction</button>
            <button onClick={cancel} style={{padding:"8px 16px",fontSize:13,borderRadius:10,border:"0.5px solid var(--color-border-secondary)",background:"none",color:"var(--color-text-secondary)",cursor:"pointer"}}>Cancel</button>
          </div>
        </Card>
      )}
      <Card style={{padding:0,overflow:"hidden"}}>
        {visible.length===0?(
          <div style={{padding:"3rem",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📊</div><p style={{color:"var(--color-text-tertiary)",fontSize:14,margin:0}}>No transactions yet. Add your first one!</p></div>
        ):visible.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 1.1rem",borderBottom:i<visible.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
            <div style={{width:38,height:38,borderRadius:10,background:cc(t.category)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ci(t.category)}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--color-text-primary)"}}>{t.description||t.category}</p>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:cc(t.category)+"22",color:cc(t.category),fontWeight:600}}>{t.category}</span>
                <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{t.date}</span>
              </div>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:t.type==="income"?"#10B981":"#EF4444",flexShrink:0}}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</span>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              <button onClick={()=>startEdit(t)} style={{fontSize:11,padding:"3px 8px",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,background:"none",cursor:"pointer",color:"var(--color-text-secondary)"}}>Edit</button>
              <button onClick={()=>del(t.id)} style={{fontSize:16,padding:"0 5px",border:"none",background:"none",cursor:"pointer",color:"var(--color-text-tertiary)"}}>×</button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════════════════════════════
function Budget({ budgets, setBudgets, monthTxns }) {
  const [form,setForm]=useState({category:EXPENSE_CATS[0],limit:""}),[showForm,setShowForm]=useState(false);
  const addB=()=>{if(!form.limit||isNaN(form.limit)||+form.limit<=0) return;setBudgets([...budgets.filter(b=>b.category!==form.category),{...form,limit:+form.limit}]);setForm({category:EXPENSE_CATS[0],limit:""});setShowForm(false);};
  const getSpent=cat=>monthTxns.filter(t=>t.type==="expense"&&t.category===cat).reduce((s,t)=>s+t.amount,0);
  const totB=budgets.reduce((s,b)=>s+b.limit,0),totS=budgets.reduce((s,b)=>s+getSpent(b.category),0),over=budgets.filter(b=>getSpent(b.category)>b.limit).length;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      {budgets.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[{label:"Total Budgeted",value:fmtK(totB),g1:"#6366F1",g2:"#4F46E5",icon:"📋"},{label:"Total Spent",value:fmtK(totS),g1:"#F59E0B",g2:"#D97706",icon:"💸"},{label:"Over Budget",value:over+" cat.",g1:over>0?"#EF4444":"#10B981",g2:over>0?"#DC2626":"#059669",icon:over>0?"⚠️":"✅"}].map((m,i)=>(
            <div key={i} style={{borderRadius:12,padding:"0.875rem",background:`linear-gradient(135deg,${m.g1},${m.g2})`,color:"white",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-8,right:-8,fontSize:36,opacity:0.2}}>{m.icon}</div><p style={{margin:"0 0 2px",fontSize:10,opacity:0.8,fontWeight:600,textTransform:"uppercase"}}>{m.label}</p><p style={{margin:0,fontSize:18,fontWeight:700}}>{m.value}</p></div>
          ))}
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={()=>setShowForm(!showForm)} style={{padding:"7px 16px",fontSize:13,borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"white",cursor:"pointer",fontWeight:600}}>{showForm?"Cancel":"+ Set Budget"}</button></div>
      {showForm&&(
        <Card>
          <STitle>Set Monthly Budget</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...INP,marginTop:4}}>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Monthly Limit ($)</label><input type="number" min="0" placeholder="500" value={form.limit} onChange={e=>setForm({...form,limit:e.target.value})} style={{...INP,marginTop:4}}/></div>
          </div>
          <button onClick={addB} style={{marginTop:12,padding:"8px 22px",fontSize:13,fontWeight:600,borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",cursor:"pointer"}}>Save Budget</button>
        </Card>
      )}
      {budgets.length===0?(
        <Card><div style={{padding:"2rem",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📆</div><p style={{color:"var(--color-text-tertiary)",fontSize:14,margin:0}}>No budgets yet. Set spending limits to start tracking.</p></div></Card>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
          {budgets.map(b=>{
            const spent=getSpent(b.category),pct=Math.round((spent/b.limit)*100),rem=b.limit-spent,barCol=pct>90?"#EF4444":pct>70?"#F59E0B":cc(b.category);
            return (
              <div key={b.category} style={{background:"var(--color-background-primary)",border:`1.5px solid ${cc(b.category)}28`,borderRadius:14,padding:"1rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:34,height:34,borderRadius:9,background:cc(b.category)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{ci(b.category)}</div>
                    <div><p style={{margin:0,fontSize:13,fontWeight:600,color:"var(--color-text-primary)"}}>{b.category}</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>Limit: {fmt(b.limit)}/mo</p></div>
                  </div>
                  <button onClick={()=>setBudgets(budgets.filter(x=>x.category!==b.category))} style={{border:"none",background:"none",color:"var(--color-text-tertiary)",cursor:"pointer",fontSize:16}}>×</button>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:"var(--color-text-secondary)"}}>{fmt(spent)} spent</span><span style={{fontWeight:600,color:rem>=0?"#10B981":"#EF4444"}}>{rem>=0?fmt(rem)+" left":fmt(Math.abs(rem))+" over"}</span></div>
                <div style={{background:"var(--color-background-tertiary)",borderRadius:8,height:10,overflow:"hidden"}}><div style={{width:Math.min(100,pct)+"%",background:barCol,height:"100%",borderRadius:8,transition:"width 0.4s"}}/></div>
                <p style={{margin:"6px 0 0",fontSize:11,color:barCol,fontWeight:600,textAlign:"right"}}>{pct}% used</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREDIT SCORE
// ═══════════════════════════════════════════════════════════════
function CreditTab({ scores, setScores, creditUtil }) {
  const [form,setForm]=useState({date:today(),score:"",bureau:"Experian"}),[showForm,setShowForm]=useState(false);
  const add=()=>{if(!form.score||isNaN(form.score)||+form.score<300||+form.score>850) return;setScores([...scores,{...form,score:+form.score,id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date)));setForm({date:today(),score:"",bureau:"Experian"});setShowForm(false);};
  const latest=scores.length?scores[scores.length-1].score:null,prev=scores.length>1?scores[scores.length-2].score:null,change=latest&&prev?latest-prev:null;
  const chartData=scores.map(s=>({date:s.date.slice(0,7),score:s.score}));
  const tips=[{tip:"Pay every bill on time — payment history counts for 35% of your score",ok:latest&&latest>=700},{tip:"Keep credit card utilization below 30% of your limit",ok:creditUtil<30},{tip:"Avoid closing old credit accounts — length of history matters",ok:true},{tip:"Don't apply for multiple credit cards in a short period",ok:true},{tip:"Dispute any errors on your credit report immediately",ok:true},{tip:"Aim for a healthy mix of credit types (cards + loans)",ok:true}];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
        <StatCard label="Latest Score" value={latest||"—"} sub={latest?(latest>=800?"Exceptional":latest>=740?"Very Good":latest>=670?"Good":latest>=580?"Fair":"Poor"):"Not logged"} g1="#8B5CF6" g2="#7C3AED" icon="⭐"/>
        <StatCard label="Score Change" value={change!=null?(change>=0?"▲ +"+change:"▼ "+change):"—"} sub={change!=null?(change>=0?"Improving!":"Declined"):"Log 2+ scores"} g1={change>=0?"#10B981":"#EF4444"} g2={change>=0?"#059669":"#DC2626"} icon={change>=0?"📈":"📉"}/>
        <StatCard label="Utilization" value={creditUtil+"%"} sub={creditUtil<30?"Healthy (< 30%)":"Reduce credit use"} g1={creditUtil<30?"#3B82F6":"#EF4444"} g2={creditUtil<30?"#2563EB":"#DC2626"} icon="💳"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:latest?"1fr 1fr":"1fr",gap:10}}>
        {latest&&(
          <Card style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <STitle>Score Gauge</STitle>
            <CreditGauge score={latest}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginTop:10}}>
              {[{r:"300–579",c:"#EF4444"},{r:"580–669",c:"#F97316"},{r:"670–739",c:"#F59E0B"},{r:"740–799",c:"#34D399"},{r:"800–850",c:"#10B981"}].map((z,i)=>(
                <span key={i} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:z.c+"22",color:z.c,fontWeight:600}}>{z.r}</span>
              ))}
            </div>
          </Card>
        )}
        <Card>
          <STitle>Log a Score</STitle>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{...INP,marginTop:4}}/></div>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Score (300–850)</label><input type="number" min="300" max="850" placeholder="720" value={form.score} onChange={e=>setForm({...form,score:e.target.value})} style={{...INP,marginTop:4}}/></div>
            <div><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Bureau</label><select value={form.bureau} onChange={e=>setForm({...form,bureau:e.target.value})} style={{...INP,marginTop:4}}><option>Experian</option><option>TransUnion</option><option>Equifax</option></select></div>
            <button onClick={add} style={{padding:"8px",fontSize:13,fontWeight:600,borderRadius:10,border:"none",background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",color:"#fff",cursor:"pointer"}}>Save Score</button>
          </div>
        </Card>
      </div>
      {chartData.length>=2&&(
        <Card>
          <STitle>Score History</STitle>
          <div style={{width:"100%",height:200}}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs><linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:11,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false}/>
                <YAxis domain={[550,850]} tick={{fontSize:11,fill:"var(--color-text-secondary)"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,fontSize:12}}/>
                <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#sGrad)" dot={{fill:"#8B5CF6",r:4}} activeDot={{r:6}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Card>
        <STitle>Credit Building Tips</STitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
          {tips.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",borderRadius:10,background:t.ok?"#10B98110":"#F59E0B10",border:`0.5px solid ${t.ok?"#10B98128":"#F59E0B28"}`}}>
              <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{t.ok?"✅":"⚠️"}</span>
              <span style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.5}}>{t.tip}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SAVINGS GOALS
// ═══════════════════════════════════════════════════════════════
function SavingsTab({ goals, setGoals, net }) {
  const blank={name:"",target:"",saved:"",deadline:"",id:null};
  const [form,setForm]=useState(blank),[showForm,setShowForm]=useState(false),[editId,setEditId]=useState(null);
  const save=()=>{
    if(!form.name||!form.target||isNaN(form.target)||+form.target<=0) return;
    if(editId) setGoals(goals.map(g=>g.id===editId?{...form,target:+form.target,saved:+form.saved||0,id:editId}:g));
    else setGoals([...goals,{...form,target:+form.target,saved:+form.saved||0,id:Date.now()}]);
    setForm(blank);setShowForm(false);setEditId(null);
  };
  const edit=g=>{setForm({...g,target:g.target.toString(),saved:g.saved.toString()});setEditId(g.id);setShowForm(true);};
  const del=id=>setGoals(goals.filter(g=>g.id!==id));
  const addSaved=(id,amt)=>setGoals(goals.map(g=>g.id===id?{...g,saved:Math.min(g.target,g.saved+amt)}:g));
  const gCols=["#10B981","#3B82F6","#8B5CF6","#F59E0B","#EF4444","#EC4899","#06B6D4"];
  const totT=goals.reduce((s,g)=>s+g.target,0),totS=goals.reduce((s,g)=>s+g.saved,0);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      {goals.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          <StatCard label="Total Target" value={fmtK(totT)} g1="#6366F1" g2="#4F46E5" icon="🎯"/>
          <StatCard label="Total Saved" value={fmtK(totS)} g1="#10B981" g2="#059669" icon="💰"/>
          <StatCard label="Overall Progress" value={totT>0?Math.round((totS/totT)*100)+"%":"0%"} g1="#F59E0B" g2="#D97706" icon="📊"/>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={()=>{if(showForm){setForm(blank);setEditId(null);}setShowForm(!showForm);}} style={{padding:"7px 16px",fontSize:13,borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"white",cursor:"pointer",fontWeight:600}}>{showForm?"Cancel":"+ New Goal"}</button></div>
      {showForm&&(
        <Card>
          <STitle>{editId?"Edit Goal":"New Savings Goal"}</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{label:"Goal Name",key:"name",placeholder:"Emergency Fund",type:"text"},{label:"Target Amount ($)",key:"target",placeholder:"5000",type:"number"},{label:"Amount Saved ($)",key:"saved",placeholder:"0",type:"number"},{label:"Target Date",key:"deadline",type:"date"}].map(f=>(
              <div key={f.key}><label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>{f.label}</label><input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{...INP,marginTop:4}}/></div>
            ))}
          </div>
          <button onClick={save} style={{marginTop:12,padding:"8px 22px",fontSize:13,fontWeight:600,borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",cursor:"pointer"}}>Save Goal</button>
        </Card>
      )}
      {goals.length===0?(
        <Card><div style={{padding:"3rem",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>🎯</div><p style={{color:"var(--color-text-tertiary)",fontSize:14,margin:0}}>No savings goals yet. Create your first one!</p></div></Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {goals.map((g,idx)=>{
            const pct=Math.round((g.saved/g.target)*100),rem=g.target-g.saved,col=gCols[idx%gCols.length];
            const days=g.deadline?Math.max(0,Math.round((new Date(g.deadline)-new Date())/86400000)):null;
            const months=days?(days/30).toFixed(1):null,mNeeded=months>0?rem/months:null;
            return (
              <div key={g.id} style={{background:"var(--color-background-primary)",border:`1.5px solid ${col}30`,borderRadius:16,padding:"1.1rem",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <Ring pct={pct} color={col} size={84}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"var(--color-text-primary)"}}>{g.name}</h3>
                      <div style={{display:"flex",gap:6}}><button onClick={()=>edit(g)} style={{fontSize:12,padding:"3px 8px",border:"0.5px solid var(--color-border-secondary)",borderRadius:8,background:"none",cursor:"pointer",color:"var(--color-text-secondary)"}}>Edit</button><button onClick={()=>del(g.id)} style={{border:"none",background:"none",color:"var(--color-text-tertiary)",cursor:"pointer",fontSize:16}}>×</button></div>
                    </div>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,marginBottom:8}}>
                      <span style={{color:"#10B981",fontWeight:600}}>Saved: {fmt(g.saved)}</span>
                      <span style={{color:"var(--color-text-secondary)"}}>Target: {fmt(g.target)}</span>
                      {g.deadline&&<span style={{color:"var(--color-text-tertiary)"}}>📅 {days} days left</span>}
                    </div>
                    {pct>=100?(
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:"#10B98120",color:"#10B981",fontSize:12,fontWeight:600}}>✅ Goal Complete!</div>
                    ):(
                      <>
                        {mNeeded&&<p style={{margin:"0 0 8px",fontSize:11,color:"var(--color-text-tertiary)"}}>Save {fmt(mNeeded)}/mo to reach goal{net>0&&mNeeded<=net?" · ✅ Your savings cover this!":""}</p>}
                        <div style={{display:"flex",gap:6}}>{[50,100,250,500].map(a=><button key={a} onClick={()=>addSaved(g.id,a)} style={{fontSize:11,padding:"4px 10px",borderRadius:8,border:`0.5px solid ${col}44`,background:`${col}12`,cursor:"pointer",color:col,fontWeight:600}}>+{fmtK(a)}</button>)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AI ADVISOR
// ═══════════════════════════════════════════════════════════════
function AIAdvisor({ txns, budgets, scores, goals, income, expenses, net, creditUtil }) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Hi! I'm your AI financial advisor with full visibility into your financial data — transactions, budgets, credit scores, and savings goals. Ask me anything about your money!"}]);
  const [input,setInput]=useState(""),[loading,setLoading]=useState(false);
  const endRef=useRef();
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const sys=`You are an expert personal financial advisor embedded in a dashboard.
Monthly Income: $${income.toFixed(2)} | Expenses: $${expenses.toFixed(2)} | Net: $${net.toFixed(2)}
Credit Score: ${scores.length?scores[scores.length-1].score+" ("+scores[scores.length-1].bureau+")":"Not logged"} | Utilization: ${creditUtil}%
Recent Transactions: ${txns.slice(0,20).map(t=>`${t.date}|${t.type}|${t.category}|$${t.amount.toFixed(2)}|${t.description}`).join("; ")||"None"}
Budgets: ${budgets.map(b=>`${b.category}:$${b.limit}/mo`).join(", ")||"None"}
Savings Goals: ${goals.map(g=>`${g.name}:$${g.saved}/$${g.target}`).join(", ")||"None"}
Give specific, actionable, warm advice using exact numbers from the data.`;
  const send=async()=>{
    const q=input.trim(); if(!q||loading) return;
    const nm=[...msgs,{role:"user",content:q}]; setMsgs(nm); setInput(""); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:nm.map(m=>({role:m.role,content:m.content}))})});
      const data=await res.json();
      setMsgs([...nm,{role:"assistant",content:data.content?.[0]?.text||"Sorry, try again."}]);
    } catch { setMsgs([...nm,{role:"assistant",content:"Something went wrong. Please try again."}]); }
    setLoading(false);
  };
  const sugg=["Where am I overspending?","How do I improve my credit score?","Am I on track with my savings goals?","Give me a 3-month financial plan"];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={{borderRadius:16,padding:"1rem 1.25rem",background:"linear-gradient(135deg,#6366F1,#4F46E5)",color:"white"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
          <div><p style={{margin:0,fontSize:14,fontWeight:700}}>AI Financial Advisor</p><p style={{margin:0,fontSize:11,opacity:0.8}}>Powered by Claude · Sees all your data</p></div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {sugg.map((s,i)=><button key={i} onClick={()=>setInput(s)} style={{fontSize:11,padding:"5px 11px",borderRadius:20,border:"none",background:"rgba(255,255,255,0.18)",cursor:"pointer",color:"white",fontWeight:500}}>{s}</button>)}
        </div>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{height:400,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:12}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginBottom:2}}>🤖</div>}
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#10B981,#059669)":"var(--color-background-secondary)",color:m.role==="user"?"white":"var(--color-text-primary)",fontSize:13,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          ))}
          {loading&&(
            <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
              <div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🤖</div>
              <div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:"var(--color-background-secondary)",display:"flex",gap:4,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#9ca3af",animation:`bounce 1s ${i*0.15}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",padding:"0.875rem 1rem",display:"flex",gap:8,background:"var(--color-background-primary)"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask your financial advisor…" style={{...INP,flex:1}}/>
          <button onClick={send} disabled={loading||!input.trim()} style={{padding:"8px 18px",fontSize:13,fontWeight:600,borderRadius:10,border:"none",background:input.trim()&&!loading?"linear-gradient(135deg,#10B981,#059669)":"var(--color-background-secondary)",color:input.trim()&&!loading?"white":"var(--color-text-tertiary)",cursor:input.trim()&&!loading?"pointer":"default",transition:"all 0.2s"}}>Send</button>
        </div>
      </Card>
    </div>
  );
}
