"use client";

import { useEffect, useRef, useState } from "react";
import { ClientWidgetPage } from "./client-page";

const centralTime = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", second: "2-digit" });
const centralDate = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" });

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { const first = window.setTimeout(() => setNow(new Date()), 0); const id = window.setInterval(() => setNow(new Date()), 1000); return () => { window.clearTimeout(first); window.clearInterval(id); }; }, []);
  return now;
}

export function ClockWidget() {
  return <ClientWidgetPage code="CW-01 · LIVE CLOCK" title="Central Time">{(config) => <ClockFace compact={config.compact} mode={config.mode} />}</ClientWidgetPage>;
}

function ClockFace({ compact, mode }: { compact: boolean; mode?: string }) {
  const now = useClock();
  if (!now) return <section className="clock-face" aria-busy="true"><span className="skeleton skeleton-wide" /></section>;
  const value = centralTime.format(now);
  const display = compact ? value.replace(/:\d{2}(?=\s)/, "") : value;
  return <section className="clock-face" aria-live="polite"><p className="clock-time">{display}</p><p className="clock-date">{centralDate.format(now)}</p>{mode && <span className="mode-chip">{mode}</span>}</section>;
}

type TimerState = "IDLE" | "ACTIVE" | "PAUSED" | "COMPLETE";
const presets = [25, 50, 90];

function useTimer() {
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [state, setState] = useState<TimerState>("IDLE");
  const endRef = useRef<number | null>(null);
  useEffect(() => {
    if (state !== "ACTIVE") return;
    endRef.current = Date.now() + remaining * 1000;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil(((endRef.current ?? Date.now()) - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) setState("COMPLETE");
    }, 250);
    return () => window.clearInterval(id);
  }, [state, remaining]);
  const choose = (minutes: number) => { const seconds = Math.max(60, Math.min(240 * 60, Math.round(minutes * 60))); setDuration(seconds); setRemaining(seconds); setState("IDLE"); };
  const reset = () => { setRemaining(duration); setState("IDLE"); };
  return { duration, remaining, state, choose, reset, start: () => remaining > 0 && setState("ACTIVE"), pause: () => setState("PAUSED"), end: () => { setRemaining(0); setState("COMPLETE"); } };
}

function TimeReadout({ seconds }: { seconds: number }) {
  return <>{String(Math.floor(seconds / 60)).padStart(2,"0")}:{String(seconds % 60).padStart(2,"0")}</>;
}

export function FocusWidget() {
  const timer = useTimer(); const [custom, setCustom] = useState("40");
  return <ClientWidgetPage code="CW-02 · FOCUS TIMER" title="Protected Focus" footer="Ephemeral browser state · P12 writes: 0">{(config) => <>
    <section className="timer-panel"><p className="timer-readout" aria-live="polite"><TimeReadout seconds={timer.remaining} /></p><span className="mode-chip">{config.mode ?? timer.state}</span></section>
    <div className="segmented" aria-label="Timer presets">{presets.map(p => <button key={p} onClick={() => timer.choose(p)}>{p} min</button>)}</div>
    <div className="input-row"><label htmlFor="custom-minutes">Custom minutes</label><input id="custom-minutes" inputMode="numeric" value={custom} onChange={e=>setCustom(e.target.value.replace(/\D/g,"").slice(0,3))}/><button onClick={()=>timer.choose(Number(custom)||1)}>Set</button></div>
    <div className="action-row"><button onClick={timer.start}>{timer.state === "PAUSED" ? "Resume" : "Start"}</button><button onClick={timer.pause} disabled={timer.state !== "ACTIVE"}>Pause</button><button onClick={timer.end} disabled={timer.state === "IDLE" || timer.state === "COMPLETE"}>End</button><button onClick={timer.reset}>Reset</button></div>
  </>}</ClientWidgetPage>;
}

export function SessionWidget() {
  const timer = useTimer(); const [objective, setObjective] = useState("");
  const progress = Math.round((1 - timer.remaining / timer.duration) * 100);
  return <ClientWidgetPage code="CW-04 · SESSION CONTROLLER" title="Session Control" footer="Local state only · persistent records: 0">{(config) => <>
    <div className="input-row stacked"><label htmlFor="objective">Objective</label><input id="objective" placeholder="Define this session" value={objective} onChange={e=>setObjective(e.target.value.slice(0,120))}/></div>
    <section className="session-grid"><article><p className="eyebrow">MODE</p><strong>{config.mode ?? "FOCUS"}</strong></article><article><p className="eyebrow">STATE</p><strong>{timer.state}</strong></article><article><p className="eyebrow">PROGRESS</p><strong>{progress}%</strong></article><article><p className="eyebrow">TIME</p><strong><TimeReadout seconds={timer.remaining}/></strong></article></section>
    <div className="action-row"><button onClick={timer.start}>{timer.state === "PAUSED" ? "Resume" : "Begin"}</button><button onClick={timer.pause} disabled={timer.state!=="ACTIVE"}>Pause</button><button onClick={timer.end} disabled={timer.state==="IDLE"}>Complete</button><button onClick={timer.reset}>Reset</button></div>
  </>}</ClientWidgetPage>;
}

const personalModes = [["COMMAND","https://www.notion.so/3da42c9f9e5f8107a4b7d4056fa6d8ff"],["FOCUS","https://www.notion.so/3da42c9f9e5f8174a46be4bbf198497d"],["SPIRITUAL","https://www.notion.so/3da42c9f9e5f81b681e2ea1b47674c1b"],["BRAND","https://www.notion.so/3da42c9f9e5f81e7aad9ef24244b6c82"],["LEARNING","https://www.notion.so/3da42c9f9e5f8109af40eadf8e1aa35a"],["RESET","https://www.notion.so/3da42c9f9e5f819ca5a6ec72b0cd2c1c"]] as const;
const businessModes = [["EXECUTIVE","https://www.notion.so/3da42c9f9e5f81ca95c2c17aa2470cca"],["REVENUE","https://www.notion.so/3da42c9f9e5f81569dfeeb41ea185a5c"],["WORKTELLI","https://www.notion.so/3da42c9f9e5f81ff9582cbc1edc7d00e"],["ENGINEERING","https://www.notion.so/3da42c9f9e5f811ab596d16e08496ec8"],["CLIENTS","https://www.notion.so/3da42c9f9e5f819fbadec40c7e9fd976"],["WORKFORCE","https://www.notion.so/3da42c9f9e5f8155b6abebca2bc35536"]] as const;

export function ModeWidget() {
  const [scope,setScope]=useState<"personal"|"business">("personal"); const [selected,setSelected]=useState("COMMAND"); const modes=scope==="personal"?personalModes:businessModes;
  return <ClientWidgetPage code="CW-07 · OPERATING MODE" title="Choose the operating surface">{()=><>
    <div className="segmented"><button aria-pressed={scope==="personal"} onClick={()=>{setScope("personal");setSelected("COMMAND")}}>Personal</button><button aria-pressed={scope==="business"} onClick={()=>{setScope("business");setSelected("EXECUTIVE")}}>Business</button></div>
    <nav className="mode-grid" aria-label={`${scope} modes`}>{modes.map(([label,href])=><a key={label} href={href} target="_blank" rel="noreferrer" aria-current={selected===label?"page":undefined} onClick={()=>setSelected(label)}><span>{label}</span><small>Open in Notion ↗</small></a>)}</nav>
  </>}</ClientWidgetPage>;
}

const mediaTypes=["Music","Playlist","Video","Podcast","Audio"];
export function MediaWidget(){const [active,setActive]=useState("Music");return <ClientWidgetPage code="CW-08 · MEDIA CONTROLLER" title="Media Context" footer="No autoplay · no media account access">{(config)=><>
  <div className="segmented">{mediaTypes.map(x=><button key={x} aria-pressed={active===x} onClick={()=>setActive(x)}>{x}</button>)}</div>
  <section className="media-card"><div className="media-art" aria-hidden="true">{active.slice(0,1)}</div><div><p className="eyebrow">{active.toUpperCase()}</p><h2>{config.context || "No source selected"}</h2><p className="muted">Add an approved provider URL to open media. Playback state is never simulated.</p></div></section>
  <button className="primary-button" disabled>Open provider</button>
  </>}</ClientWidgetPage>}

const captures={personal:[["Prayer","a2e100b81b534d9daf930c442c00281c"],["Commitment","fc64e6a23d2a4065a28a6da487f23a67"],["Brand Idea","fc7b4765360e47b48d6063f3837038ee"],["Decision","4c11a712c39a4176ba7a41a8a96c236c"],["Signal","b37baae9772d4581b39149217c142050"],["Knowledge","e7075ed9959141d89382b515a0c09397"]],business:[["Opportunity","4955ac345ac748e3b54128019a0a716a"],["Signal","3ce532354e3b4dd2891608083f988005"],["Decision","bbbee0957be8415ca52332df564bd85d"],["Exception","87983ed749614694ba6bd0f0dfc6b586"],["Initiative","2d3d81c2e6544444a8ae92ee4a6590bd"]]} as const;
export function QuickCaptureWidget(){const [scope,setScope]=useState<keyof typeof captures>("personal");return <ClientWidgetPage code="CW-10 · QUICK CAPTURE" title="Capture Dock" footer="Deep links only · Notion write API calls: 0">{()=><>
  <div className="segmented"><button aria-pressed={scope==="personal"} onClick={()=>setScope("personal")}>Personal</button><button aria-pressed={scope==="business"} onClick={()=>setScope("business")}>Business</button></div>
  <div className="capture-grid">{captures[scope].map(([label,id])=><a key={label} href={`https://www.notion.so/${id}`} target="_blank" rel="noreferrer">+ {label}<small>Open canonical database ↗</small></a>)}</div>
  </>}</ClientWidgetPage>}

const headerCopy:Record<string,string>={personal:"Move with intention.",business:"Make the next clear decision.",focus:"Protect the work that matters.",spiritual:"Be still. Listen well.",brand:"Create with conviction.",learning:"Turn insight into practice.",reset:"Close loops. Begin clean.",worktelli:"Govern the system. Prove the state.",workforce:"Direct capacity toward outcomes."};
export function HeaderWidget(){const now=useClock();return <ClientWidgetPage code="CW-20 · AMBIENT HEADER" title="Craig OS">{(config)=>{const hour=now?Number(new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",hourCycle:"h23"}).format(now)):12;const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";const mode=(config.mode||"business").toLowerCase();return <section className="ambient"><p className="greeting">{greeting}, David.</p><p>{headerCopy[mode]??headerCopy.business}</p><span>{now?centralDate.format(now):"Central Time"}</span></section>}}</ClientWidgetPage>}
