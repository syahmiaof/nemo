import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { syncEngine } from '@/sync/syncEngine';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithEmailOtp,
    verifyEmailOtp,
    user,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState('syahmiaof123@gmail.com');
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await signInWithEmailOtp(email);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setResendCooldown(60);
      setSuccessMessage('Kod OTP 6-digit telah dihantar ke emel anda. Sila semak peti masuk anda.');
    } else {
      setErrorMessage(res.error || 'Gagal menghantar kod OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await verifyEmailOtp(email, otpToken);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Log masuk berjaya! Memulakan sinkronisasi...');
      setTimeout(() => {
        closeAuthModal();
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Kod OTP tidak sah.');
    }
  };

  const handleInitialUpload = async () => {
    if (!user) return;
    setLoading(true);
    const res = await syncEngine.uploadAllLocalData(user.id);
    setLoading(false);
    if (res.success) {
      setSuccessMessage(`Berjaya memuat naik ${res.count} rekod tempatan ke awan!`);
      setTimeout(() => closeAuthModal(), 1500);
    } else {
      setErrorMessage(res.error || 'Gagal memuat naik data tempatan.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-md bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-2xl relative text-navy-50"
        tabIndex={-1}
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-navy-400 hover:text-navy-100 p-2 rounded-lg transition-colors focus:ring-2 focus:ring-mint-500/50"
          aria-label="Tutup modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-mint-500/10 border border-mint-500/30 flex items-center justify-center text-mint-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-lg font-semibold tracking-tight text-white">
              Nemo Private Cloud Sync
            </h2>
            <p className="text-xs text-navy-400">
              Akaun peribadi bersambung selamat dengan Supabase
            </p>
          </div>
        </div>

        {user ? (
          // Signed-in view
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-navy-800/60 border border-navy-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-navy-400 font-medium">Log Masuk Sebagai</p>
                <p className="text-sm font-semibold text-mint-400">{user.email}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-mint-500/15 text-mint-400 border border-mint-500/30">
                Pemilik Sah
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleInitialUpload}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-mint-500 hover:bg-mint-400 text-navy-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sedang memuat naik...' : 'Muat Naik Semua Data Tempatan ke Awan'}
              </button>

              <button
                onClick={async () => {
                  await signOut();
                  closeAuthModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-red-400 border border-navy-700/70 font-medium text-sm transition-colors"
              >
                Log Keluar dari Cloud
              </button>
            </div>
          </div>
        ) : (
          // Sign in flow
          <div>
            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="owner-email" className="block text-xs font-medium text-navy-300 mb-1.5">
                    Emel Pemilik
                  </label>
                  <input
                    id="owner-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 focus:border-mint-500 focus:ring-1 focus:ring-mint-500 text-sm text-white placeholder-navy-500 transition-colors"
                    placeholder="syahmiaof123@gmail.com"
                  />
                  <p className="text-[11px] text-navy-400 mt-1">
                    Hanya emel berdaftar pemilik dibenarkan untuk keselamatan peribadi.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-mint-500 hover:bg-mint-400 text-navy-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Menghantar Kod...' : 'Hantar Kod OTP ke Emel'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-token" className="block text-xs font-medium text-navy-300 mb-1.5">
                    Kod OTP 6-Digit
                  </label>
                  <input
                    id="otp-token"
                    type="text"
                    required
                    maxLength={8}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-center tracking-widest text-lg font-mono rounded-xl bg-navy-950 border border-navy-700 focus:border-mint-500 focus:ring-1 focus:ring-mint-500 text-white placeholder-navy-600 transition-colors"
                    placeholder="123456"
                    autoFocus
                  />
                  <p className="text-[11px] text-navy-400 mt-1">
                    Masukkan kod 6-digit ATAU klik pautan dalam emel untuk log masuk terus ke <strong>{email}</strong>
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-lg bg-mint-500/10 border border-mint-500/30 text-xs text-mint-400">
                    {successMessage}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-1/3 py-2.5 px-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-navy-300 text-sm font-medium transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-mint-500 hover:bg-mint-400 text-navy-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Mengesahkan...' : 'Sahkan & Log Masuk'}
                  </button>
                </div>

                {resendCooldown > 0 ? (
                  <p className="text-center text-xs text-navy-400">
                    Hantar semula dalam {resendCooldown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full text-center text-xs text-mint-400 hover:underline"
                  >
                    Hantar semula kod OTP
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

