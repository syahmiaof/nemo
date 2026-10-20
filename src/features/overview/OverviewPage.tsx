import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Check, Plus, ArrowUpRight, FolderGit2, Clock, CheckCircle2, X, Target, CalendarDays } from 'lucide-react';
import { db } from '@/db/nemoDb';
import { getWorkspaceMode, switchWorkspace } from '@/db/workspace';
import { useToast } from '@/components/ui/Toast';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { PageHeading, AnimatedNumber } from '@/components/ui/PageHeading';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { QuickAddModal } from '@/app/QuickAddModal';
import { getTodayLocalDateString, formatShortDate, parseLocalDateString } from '@/lib/dates';
import type { Task } from '@/domain/types';
const localDay=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function OverviewPage() {
 const [quickAdd,setQuickAdd]=useState(false),[metric,setMetric]=useState<'tasks'|'projects'>('tasks');
 const {success,error}=useToast(); const today=getTodayLocalDateString();
 const settings=useLiveQuery(()=>db.settings.get('default'),[]);
 const tasks=useLiveQuery(()=>db.tasks.toArray(),[])||[];
 const projects=useLiveQuery(()=>db.projects.toArray(),[])||[];
 const milestones=useLiveQuery(()=>db.milestones.toArray(),[])||[];
 const assignments=useLiveQuery(()=>db.assignments.toArray(),[])||[];
 const selections=useLiveQuery(()=>db.focusSelections.where('effectiveLocalDate').equals(today).toArray(),[today])||[];
 const open=tasks.filter(t=>t.status!=='done');
 const active=projects.filter(p=>p.status==='in_progress'&&!p.archivedAt);
 const completed=tasks.filter(t=>t.status==='done');
 const overdue=open.filter(t=>t.dueDate&&t.dueDate<today);
 const focused=selections.map(s=>tasks.find(t=>t.id===s.taskId)).filter((t):t is Task=>!!t&&t.status!=='done');
 const nextTasks=[...open].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).slice(0,4);
 const academic=assignments.filter(a=>a.status!=='submitted'&&a.status!=='graded'&&a.dueDate).sort((a,b)=>a.dueDate!.localeCompare(b.dueDate!)).slice(0,3);
 const trend=useMemo(()=>{
   const records=metric==='tasks'?tasks.filter(t=>t.status==='done'):projects.filter(p=>p.status==='completed');
   const current:number[]=[],previous:number[]=[],labels:string[]=[];
   for(let i=6;i>=0;i--){const date=parseLocalDateString(today);date.setDate(date.getDate()-i);const key=localDay(date);labels.push(date.toLocaleDateString('en',{weekday:'short'}));current.push(records.filter(r=>r.completedAt&&localDay(new Date(r.completedAt))===key).length);date.setDate(date.getDate()-7);const old=localDay(date);previous.push(records.filter(r=>r.completedAt&&localDay(new Date(r.completedAt))===old).length);}
   return {current,previous,labels,total:current.reduce((a,b)=>a+b,0),last:previous.reduce((a,b)=>a+b,0)};
 },[tasks,projects,metric,today]);
 const complete=async(task:Task)=>{try{const now=new Date().toISOString();await db.transaction('rw',[db.tasks,db.focusSelections],async()=>{await db.tasks.update(task.id,{status:'done',completedAt:now,updatedAt:now});await db.focusSelections.where('taskId').equals(task.id).delete();});success('Task completed',task.title);}catch(e){error('Could not complete task',e instanceof Error?e.message:'Please retry.');}};
 const focus=async(id:string)=>{try{await db.transaction('rw',db.focusSelections,async()=>{const chosen=await db.focusSelections.where('effectiveLocalDate').equals(today).toArray();if(chosen.length>=3||chosen.some(s=>s.taskId===id))return;await db.focusSelections.add({id:`${today}_${id}`,taskId:id,effectiveLocalDate:today,chosenAt:new Date().toISOString()});});}catch{error('Could not add focus task');}};
 const hasData=tasks.length+projects.length+assignments.length>0;
 const displayName=settings?.displayName==='My Workspace'?'your workspace':settings?.displayName||'your workspace';
 return <div className="overview-page">
  <PageHeading title="Make room for progress." description={`${new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})} · ${displayName}`} stats={[{label:'Active projects',value:active.length,icon:FolderGit2},{label:'Tasks need attention',value:open.filter(t=>t.dueDate&&t.dueDate<=today).length,icon:Clock,note:overdue.length?`${overdue.length} overdue`:undefined},{label:'Tasks completed',value:completed.length,icon:CheckCircle2}]}/>
  {!hasData&&<section className="welcome-panel glass-panel" data-enter><div><h2>A clear space for your next idea.</h2><p>Start with a project or explore a fictional workspace to see how everything connects.</p></div><div className="flex flex-wrap gap-3"><button className="primary-action" onClick={()=>setQuickAdd(true)}><Plus size={18}/>Create something</button>{getWorkspaceMode()==='real'&&<button className="secondary-action" onClick={()=>{try{switchWorkspace('demo');}catch{error('Demo workspace could not open');}}}>Explore demo<ArrowUpRight size={18}/></button>}</div></section>}
  <div className="overview-primary">
   <section className="glass-panel productivity-panel" data-enter aria-labelledby="productivity-title">
    <div className="panel-heading"><h2 id="productivity-title">Your momentum</h2><div className="segmented" aria-label="Productivity metric">{(['tasks','projects'] as const).map(m=><button key={m} aria-pressed={metric===m} className={metric===m?'is-selected':''} onClick={()=>setMetric(m)}>{m==='tasks'?'Tasks':'Projects'}</button>)}</div><Link to="/insights" className="icon-button" aria-label="Open insights"><ArrowUpRight size={20}/></Link></div>
    <div className="chart-summary"><strong><AnimatedNumber value={trend.total}/></strong><div><p>{metric} finished in the last 7 days</p><span className="trend-note">{trend.total-trend.last>=0?'+':''}{trend.total-trend.last} vs previous 7 days</span></div></div>
    <div className="chart-legend"><span><i/>Last 7 days</span><span><i className="comparison"/>Previous 7 days</span></div>
    <TavolaSplineChart labels={trend.labels} values={trend.current} comparisonValues={trend.previous} seriesName="Last 7 days" comparisonName="Previous 7 days" unit={metric} height={274}/>
   </section>
   <section className="glass-panel focus-panel" data-enter><div className="panel-heading"><h2>Today's focus</h2><span className="panel-meta">{focused.length} of 3 slots</span><Link to="/tasks" className="icon-button" aria-label="Manage tasks"><ArrowUpRight size={20}/></Link></div>
    <div className="focus-stack">{focused.map((task,index)=><article className={`focus-ticket tone-${index%3}`} key={task.id}><div className="ticket-meta"><span><Target size={14}/>Focus {index+1}</span><button aria-label={`Remove ${task.title} from focus`} onClick={()=>{const s=selections.find(s=>s.taskId===task.id);if(s)void db.focusSelections.delete(s.id).catch(()=>error('Could not remove focus'));}}><X size={16}/></button></div><h3>{task.title}</h3><div className="ticket-bottom"><span>{task.estimatedMinutes?`${task.estimatedMinutes} min`:'Your next step'} · {task.priority}</span><button className="ticket-complete" onClick={()=>void complete(task)} aria-label={`Complete ${task.title}`}><Check size={20}/></button></div></article>)}
    {focused.length===0&&<div className="focus-empty"><Target size={30}/><h3>One thing at a time.</h3><p>Choose up to three tasks and give them your attention.</p></div>}
    {focused.length<3&&<div className="focus-picker"><label htmlFor="focus-choice">Add a task to focus</label><select id="focus-choice" value="" onChange={e=>{if(e.target.value)void focus(e.target.value);}}><option value="">Choose an open task…</option>{open.filter(t=>!focused.some(f=>f.id===t.id)).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></div>}</div>
   </section>
  </div>
  <section className="active-projects" data-enter><div className="section-heading"><div><h2>In the making</h2><p>Your active projects, one step closer.</p></div><Link to="/projects">All projects<ArrowUpRight size={18}/></Link></div><div className="overview-project-grid">{active.slice(0,3).map(p=><ProjectCard key={p.id} project={p} milestones={milestones} tasks={tasks}/>)}{active.length===0&&<div className="glass-panel empty-inline">No active projects yet. <Link to="/projects">Start your first project →</Link></div>}</div></section>
  <div className="overview-bottom"><section className="glass-panel" data-enter><div className="panel-heading"><h2>Coming into view</h2><Link to="/calendar" className="icon-button" aria-label="Open calendar"><CalendarDays size={20}/></Link></div>{nextTasks.map(t=><div className="commitment-row" key={t.id}><button className="completion-ring" aria-label={`Complete ${t.title}`} onClick={()=>void complete(t)}><Check size={14}/></button><Link to="/tasks">{t.title}<span>{t.dueDate?formatShortDate(t.dueDate):'No deadline'} · {t.priority} priority</span></Link><ArrowUpRight size={16}/></div>)}{nextTasks.length===0&&<p className="empty-copy">You're all clear. Capture your next task when you're ready.</p>}</section><section className="glass-panel" data-enter><div className="panel-heading"><h2>On the study desk</h2><Link to="/academics" className="icon-button" aria-label="Open academics"><ArrowUpRight size={20}/></Link></div>{academic.map(a=><Link className="academic-deadline" key={a.id} to={`/academics/assignments/${a.id}`}><span className="deadline-date">{formatShortDate(a.dueDate)}</span><div><h3>{a.title}</h3><p>{String(a.status).replace(/_/g, ' ')}</p></div><ArrowUpRight size={16}/></Link>)}{academic.length===0&&<p className="empty-copy">No outstanding coursework. Your next deadline will appear here.</p>}</section></div>
  <QuickAddModal isOpen={quickAdd} onClose={()=>setQuickAdd(false)}/>
 </div>;
}
