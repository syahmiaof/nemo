import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { formatClockTime } from '@/lib/timeFormat';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  processAssistantQuery,
  SUGGESTED_QUESTIONS,
  type AssistantResponse,
} from './intentEngine';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';
gsap.registerPlugin(useGSAP);

interface Message {
  id: string;
  sender: 'user' | 'nemo';
  text?: string;
  response?: AssistantResponse;
  timestamp: string;
}

interface AskNemoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

export const AskNemoDrawer: React.FC<AskNemoDrawerProps> = ({
  isOpen,
  onClose,
  initialQuestion,
}) => {
  const navigate = useNavigate();
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const hourFormat = settings?.hourFormat ?? '24h';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const loadingBubbleRef = useRef<HTMLDivElement>(null);
  const animatedMessageIds = useRef(new Set<string>());
  const isClosingRef = useRef(false);
  const reduced = useReducedMotion();

  // Smooth backdrop blur & slide-in drawer entrance with spring easing
  useGSAP(() => {
    if (!isOpen) return;
    if (reduced) {
      if (backdropRef.current) gsap.set(backdropRef.current, { opacity: 1 });
      if (drawerRef.current) gsap.set(drawerRef.current, { x: '0%' });
      return;
    }

    if (backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0, backdropFilter: 'blur(0px)' },
        { opacity: 1, backdropFilter: 'blur(8px)', duration: 0.45, ease: 'power2.out' }
      );
    }

    if (drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.55, ease: 'back.out(1.18)' }
      );
    }
  }, { dependencies: [isOpen, reduced] });

  // Chat message bubbles animated on send and receive
  useEffect(() => {
    if (!isOpen || reduced) return;

    messages.forEach((m) => {
      if (!animatedMessageIds.current.has(m.id)) {
        animatedMessageIds.current.add(m.id);
        const bubble = document.querySelector<HTMLElement>(`[data-msg-id="${m.id}"]`);
        if (bubble) {
          if (m.sender === 'user') {
            gsap.fromTo(
              bubble,
              { opacity: 0, y: 16, scale: 0.92, transformOrigin: 'bottom right' },
              { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.8)' }
            );
          } else {
            gsap.fromTo(
              bubble,
              { opacity: 0, y: 22, scale: 0.94, transformOrigin: 'bottom left' },
              { opacity: 1, y: 0, scale: 1, duration: 0.46, ease: 'power3.out' }
            );

            const subItems = bubble.querySelectorAll<HTMLElement>('.nemo-item-card, .nemo-chip');
            if (subItems.length > 0) {
              gsap.fromTo(
                subItems,
                { opacity: 0, y: 8, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.035, ease: 'power2.out', delay: 0.1 }
              );
            }
          }
        }
      }
    });
  }, [messages, isOpen, reduced]);

  // Loading bubble entrance animation
  useEffect(() => {
    if (loading && loadingBubbleRef.current && !reduced) {
      gsap.fromTo(
        loadingBubbleRef.current,
        { opacity: 0, y: 12, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
      );
    }
  }, [loading, reduced]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    if (reduced || !drawerRef.current || !backdropRef.current) {
      onClose();
      return;
    }
    isClosingRef.current = true;
    const tl = gsap.timeline({
      onComplete: () => {
        isClosingRef.current = false;
        onClose();
      },
    });
    tl.to(drawerRef.current, { x: '100%', duration: 0.3, ease: 'power3.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.22, ease: 'power2.in' }, '-=0.15');
  };

  // Initialize or handle initialQuestion
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            sender: 'nemo',
            response: {
              intent: 'welcome',
              title: 'Welcome to Ask Nemo',
              summary:
                'I am your private, offline personal assistant. I run 100% in your browser and compute answers directly from your active workspace records.',
              items: [],
              suggestedFollowUps: SUGGESTED_QUESTIONS,
            },
            timestamp: formatClockTime(new Date(), hourFormat),
          },
        ]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [isOpen, initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSend = async (questionText: string) => {
    const text = questionText.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: formatClockTime(new Date(), hourFormat),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await processAssistantQuery(text);
      const nemoMsg: Message = {
        id: `n-${Date.now()}`,
        sender: 'nemo',
        response,
        timestamp: formatClockTime(new Date(), hourFormat),
      };
      setMessages((prev) => [...prev, nemoMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'nemo',
        response: {
          intent: 'error',
          title: 'Query Error',
          summary: 'An error occurred while computing workspace statistics.',
          items: [],
          suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 3),
        },
        timestamp: formatClockTime(new Date(), hourFormat),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    animatedMessageIds.current.clear();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'nemo',
        response: {
          intent: 'welcome',
          title: 'Ask Nemo',
          summary: 'Chat history cleared. How can I help you navigate your workspace commitments?',
          items: [],
          suggestedFollowUps: SUGGESTED_QUESTIONS,
        },
        timestamp: formatClockTime(new Date(), hourFormat),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-nemo-heading"
    >
      {/* Backdrop with smooth blur */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Panel with spring easing */}
      <div
        ref={drawerRef}
        className="relative w-full sm:max-w-md h-full bg-[#0B1322] border-l border-white/10 shadow-2xl flex flex-col z-10"
      >
        {/* Header */}
        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0F1A2D]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-mint/15 border border-accent-mint/30 flex items-center justify-center text-accent-mint">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ask-nemo-heading" className="text-sm font-bold text-white flex items-center gap-1.5">
                Ask Nemo
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-mint/20 text-accent-mint border border-accent-mint/30">
                  Offline
                </span>
              </h2>
              <p className="text-[11px] text-content-tertiary flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-accent-mint" />
                Deterministic · Zero Cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset conversation"
              className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Clear chat history"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Close Ask Nemo drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            if (m.sender === 'user') {
              return (
                <div key={m.id} data-msg-id={m.id} className="flex justify-end">
                  <div className="max-w-[85%] bg-accent-ember/15 border border-accent-ember/30 text-content-primary p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm">
                    <p className="font-medium text-white">{m.text}</p>
                    <span className="block text-[10px] text-content-tertiary text-right mt-1">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            }

            const res = m.response;
            if (!res) return null;

            return (
              <div key={m.id} data-msg-id={m.id} className="flex justify-start">
                <div className="max-w-[95%] w-full bg-[#132038] border border-white/10 rounded-2xl rounded-tl-sm p-4 space-y-3 text-xs shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="font-bold text-accent-mint flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {res.title}
                    </span>
                    <span className="text-[10px] text-content-tertiary">{m.timestamp}</span>
                  </div>

                  <p className="text-content-secondary leading-relaxed">{res.summary}</p>

                  {/* Record items */}
                  {res.items && res.items.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {res.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            navigate(item.route);
                            handleClose();
                          }}
                          className="nemo-item-card w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-accent-mint/30 transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-white truncate text-xs group-hover:text-accent-mint transition-colors">
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-[11px] text-content-tertiary truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {item.badge && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                  item.badgeVariant === 'danger'
                                    ? 'bg-accent-ember/20 text-accent-ember border-accent-ember/40'
                                    : item.badgeVariant === 'success'
                                    ? 'bg-accent-mint/20 text-accent-mint border-accent-mint/40'
                                    : item.badgeVariant === 'warning'
                                    ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/40'
                                    : 'bg-white/10 text-content-secondary border-white/15'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ExternalLink className="w-3.5 h-3.5 text-content-tertiary group-hover:text-accent-mint transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Follow up suggestions */}
                  {res.suggestedFollowUps && res.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-content-tertiary font-semibold mb-2">
                        Suggested questions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {res.suggestedFollowUps.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleSend(chip)}
                            className="nemo-chip text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-accent-mint/15 text-content-secondary hover:text-accent-mint border border-white/10 hover:border-accent-mint/30 hover:scale-[1.03] active:scale-[0.98] transition-all"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div ref={loadingBubbleRef} className="flex justify-start">
              <div className="bg-[#132038] border border-white/10 rounded-2xl p-3 flex items-center gap-2 text-xs text-content-secondary">
                <div className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
                <span>Computing from local workspace...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <footer className="p-3 border-t border-white/10 bg-[#0F1A2D]/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tasks, projects, deadlines..."
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-content-tertiary focus:outline-none focus:border-accent-mint/50 focus:ring-1 focus:ring-accent-mint/30 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-accent-mint text-[#0A1222] font-semibold hover:bg-accent-mint/90 disabled:opacity-40 disabled:pointer-events-none transition-all"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};
