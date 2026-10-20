import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { getWorkspaceMode, switchWorkspace } from '@/db/workspace';
import { TavolaTabs } from '@/components/ui/TavolaTabs';
import { TavolaDock } from '@/components/ui/TavolaDock';
import { MobileNav } from './MobileNav';
import { QuickAddModal } from './QuickAddModal';
import { OnboardingModal } from './OnboardingModal';
import { ToastProvider } from '@/components/ui/Toast';
import { Plus, Sun, Moon, HardDrive, WifiOff, FlaskConical } from 'lucide-react';
import { RouteTransition } from './RouteTransition';
const navTabs = [
  {to:'/overview',label:'Overview'},{to:'/projects',label:'Projects'},{to:'/tasks',label:'Tasks'},
  {to:'/calendar',label:'Calendar'},{to:'/academics',label:'Academics'},{to:'/goals',label:'Goals'},{to:'/insights',label:'Insights'},
];
export function AppShell() {
  const [quickAdd,setQuickAdd] = useState(false);
  const [online,setOnline] = useState(navigator.onLine);
  const [modeError,setModeError] = useState('');
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const demo = getWorkspaceMode() === 'demo';
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || 'dark';
    document.documentElement.dataset.reduceMotion = String(settings?.reduceMotion || false);
  }, [settings?.theme,settings?.reduceMotion]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online',update); window.addEventListener('offline',update);
    return () => {window.removeEventListener('online',update);window.removeEventListener('offline',update);};
  }, []);
  const changeMode = () => {try {switchWorkspace(demo ? 'real' : 'demo');} catch(e) {setModeError(e instanceof Error ? e.message : 'Workspace could not switch.');}};
  return <ToastProvider><div className="nemo-app">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <div className="mesh" aria-hidden="true"><i className="mesh__a"/><i className="mesh__b"/></div>
    <TavolaDock onOpenQuickAdd={() => setQuickAdd(true)} settings={settings}/>
    <div className="app-shell">
      <header className="app-header">
        <Link to="/overview" className="wordmark" aria-label="Nemo overview"><span className="brand-mark"><svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 25V7L25 25V7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="25" cy="7" r="3" fill="currentColor"/></svg></span><span>nemo.</span></Link>
        <div className="header-navigation"><TavolaTabs tabs={navTabs}/></div>
        <div className="header-tools">
          <button type="button" className="icon-button" onClick={() => setQuickAdd(true)} aria-label="Quick Add"><Plus size={21}/></button>
          <button type="button" className="icon-button theme-tool" onClick={() => {void db.settings.update('default',{theme:settings?.theme === 'light' ? 'dark':'light'}).catch(() => setModeError('Theme could not be saved.'));}} aria-label="Toggle theme">{settings?.theme === 'light' ? <Moon size={19}/>:<Sun size={19}/>}</button>
          <Link to="/settings" className="profile-button" aria-label="Profile and settings">{(settings?.displayName || 'N').slice(0,1).toUpperCase()}</Link>
        </div>
      </header>
      <div className="workspace-strip"><span className="workspace-status">{online ? <HardDrive size={13}/>:<WifiOff size={13}/>}<span>{demo ? 'DEMO WORKSPACE · Fictional data' : online ? 'Personal workspace · Saved on this device' : 'Offline · Saved on this device'}</span></span><button onClick={changeMode} className="workspace-switch"><FlaskConical size={14}/>{demo ? 'Return to my workspace' : 'Explore demo'}</button></div>
      {modeError && <p role="alert" className="text-accent-ember mb-4">{modeError}</p>}
      <main id="main-content" tabIndex={-1}><RouteTransition/></main>
    </div>
    <MobileNav/>
    <QuickAddModal isOpen={quickAdd} onClose={() => setQuickAdd(false)}/>
    {settings && !settings.onboardingCompleted && <OnboardingModal isOpen onComplete={() => {}} settings={settings}/>}
  </div></ToastProvider>;
}
