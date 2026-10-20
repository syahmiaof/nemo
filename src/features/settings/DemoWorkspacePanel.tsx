import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { getWorkspaceMode, switchWorkspace, resetDemoWorkspace } from '@/db/workspace';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
export function DemoWorkspacePanel() {
 const demo = getWorkspaceMode() === 'demo';
 const [confirm,setConfirm] = useState(false), [busy,setBusy] = useState(false);
 const {error,success} = useToast();
 const switchMode = () => {try {switchWorkspace(demo ? 'real':'demo');} catch(e) {error('Could not switch workspace',e instanceof Error ? e.message : 'Please retry.');}};
 const reset = async () => {setBusy(true);try {await resetDemoWorkspace();setConfirm(false);success('Demo restored','Your personal workspace was not changed.');}catch(e){error('Reset failed',e instanceof Error ? e.message : 'Please retry.');}finally{setBusy(false);}};
 return <section className="glass-panel demo-settings"><div><FlaskConical size={24}/><h2>Try a little of everything.</h2><p>Explore 18 projects, 150 tasks, coursework, goals and a full calendar. All demo records are fictional and stored separately from your personal work.</p></div><div className="flex flex-wrap gap-3"><Button onClick={switchMode}>{demo ? 'Return to my workspace':'Enter Demo Mode'}</Button>{demo && <Button variant="secondary" onClick={() => setConfirm(true)}><RotateCcw size={16}/>Reset demo</Button>}</div><ConfirmDialog isOpen={confirm} onClose={() => setConfirm(false)} onConfirm={reset} title="Reset demo workspace?" description="This replaces only demo edits with the original fictional dataset. Your personal workspace stays untouched." confirmLabel={busy ? 'Resetting…' : 'Reset demo'}/></section>;
}
