import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';
import { prefersReducedMotion } from '@/design/motion';
export function AnimatedNumber({value}:{value:number}) {
 const ref=useRef<HTMLSpanElement>(null); const state=useRef({value});
 useLayoutEffect(()=>{const draw=()=>{if(ref.current)ref.current.textContent=Math.round(state.current.value).toLocaleString();};if(prefersReducedMotion()){state.current.value=value;draw();return;} const tween=gsap.to(state.current,{value,duration:.5,ease:'power3.out',onUpdate:draw});return()=>{tween.kill();};},[value]);
 return <span ref={ref} aria-label={String(value)}>{value.toLocaleString()}</span>;
}
export function PageHeading({title,description,stats=[]}:{title:string;description?:string;stats?:{label:string;value:number;icon:LucideIcon;note?:string}[]}) {
 return <section className="page-heading" data-enter><div className="page-heading-copy"><h1>{title}</h1>{description&&<p>{description}</p>}</div><dl className="page-stats">{stats.map(({label,value,icon:Icon,note})=><div className="page-stat" key={label}><span className="stat-icon"><Icon size={21}/></span><div><dd><AnimatedNumber value={value}/>{note&&<span className="metric-note">{note}</span>}</dd><dt>{label}</dt></div></div>)}</dl></section>;
}
