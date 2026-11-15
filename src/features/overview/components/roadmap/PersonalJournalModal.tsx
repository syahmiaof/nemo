import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Feather } from 'lucide-react';

interface PersonalJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  onSave: (text: string) => Promise<void>;
  lastUpdatedAt: string | null;
}

export const PersonalJournalModal: React.FC<PersonalJournalModalProps> = ({
  isOpen,
  onClose,
  initialText,
  onSave,
  lastUpdatedAt,
}) => {
  const [content, setContent] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initialText);
  }, [initialText, isOpen]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const origStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, content]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const formattedDate = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('en-MY', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />
        <div className="absolute -top-24 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.2)] shrink-0">
              <Feather size={20} />
            </div>
            <div>
              <h2
                id="journal-modal-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2"
              >
                Personal Journal & Manifesto
              </h2>
              <p className="text-xs sm:text-sm text-white/50">
                Satu lembaran diari peribadi sentiasa ada & boleh dikemaskini pada bila-bila masa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Close Journal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Spacious Text Editor */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col relative z-10">
          <div className="flex items-center justify-between text-xs text-white/40 mb-2 px-1">
            <span>Tulis siapa diri anda, apa anda inginkan, prinsip peribadi, dan refleksi hidup:</span>
            {formattedDate && <span>Last saved: {formattedDate}</span>}
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Siapa diri aku? Apa yang aku mahukan dalam hidup ini? Apa prinsip yang tidak boleh dikompromi?..."
            className="w-full flex-1 min-h-[380px] sm:min-h-[460px] p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-accent-mint/50 focus:bg-white/[0.05] focus:outline-none text-white text-base leading-relaxed placeholder:text-white/25 resize-none transition-all font-sans"
          />

          <div className="flex items-center justify-between text-xs text-white/40 mt-3 px-1">
            <span>
              {wordCount} words • {charCount} characters
            </span>
            <span className="hidden sm:inline text-white/30">Tekan Ctrl + Enter untuk simpan pantas</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-white/[0.08] bg-slate-950/40 relative z-10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tersimpan secara setempat & disegerakkan ke peranti anda</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-950 bg-accent-mint hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isSaving ? 'Menyimpan...' : 'Save Journal'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
