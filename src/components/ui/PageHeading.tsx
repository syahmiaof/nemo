import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { LucideIcon } from 'lucide-react';
import { useReducedMotion } from '@/design/useReducedMotion';
import { MotionTitle } from './MotionTitle';
gsap.registerPlugin(useGSAP);
export function AnimatedNumber({value}:{value:number}) {
 const ref=useRef<HTMLSpanElement>(null); const state=useRef({value});
 const reduced = useReducedMotion();
 useGSAP(()=>{const draw=()=>{if(ref.current)ref.current.textContent=Math.round(state.current.value).toLocaleString();};if(reduced){state.current.value=value;draw();return;} gsap.to(state.current,{value,duration:.5,ease:'power3.out',onUpdate:draw});},{scope:ref,dependencies:[value,reduced],revertOnUpdate:true});
 return <span ref={ref} aria-label={String(value)}>{value.toLocaleString()}</span>;
}
export function PageHeading({title,description,stats=[]}:{title:string;description?:string;stats?:{label:string;value:number;icon:LucideIcon;note?:string}[]}) {
 return <section className="page-heading" data-enter><div className="page-heading-copy"><MotionTitle text={title}/>{description&&<p>{description}</p>}</div><dl className="page-stats">{stats.map(({label,value,icon:Icon,note})=><div className="page-stat" key={label}><span className="stat-icon"><Icon size={21}/></span><div><dd><AnimatedNumber value={value}/>{note&&<span className="metric-note">{note}</span>}</dd><dt>{label}</dt></div></div>)}</dl></section>;
}
