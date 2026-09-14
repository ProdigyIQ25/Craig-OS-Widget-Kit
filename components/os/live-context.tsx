"use client";

import { useEffect, useState } from "react";

const timeFormat=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"});
const dateFormat=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"long",month:"long",day:"numeric"});
const hourFormat=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",hourCycle:"h23"});

export function LiveContext({personal=false}:{personal?:boolean}){
  const [now,setNow]=useState<Date|null>(null);
  useEffect(()=>{const first=window.setTimeout(()=>setNow(new Date()),0);const id=window.setInterval(()=>setNow(new Date()),30_000);return()=>{window.clearTimeout(first);window.clearInterval(id)}},[]);
  const hour=now?Number(hourFormat.format(now)):12;
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  return <div className="os-live" aria-live="polite"><strong suppressHydrationWarning>{now?timeFormat.format(now):"Central Time"}</strong><span suppressHydrationWarning>{now?dateFormat.format(now):"America / Chicago"}</span>{personal?<em>{greeting}, David.</em>:null}</div>;
}
