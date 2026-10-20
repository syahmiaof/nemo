import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, X, ShieldCheck, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithPassword,
    updatePassword,
    user,
    signOut,
  } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // For changing password when logged in
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await signInWithPassword(password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Signed in successfully! Syncing workspace data...');
      setTimeout(() => {
        closeAuthModal();
        setPassword('');
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Incorrect password.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const res = await updatePassword(newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => {
        setIsChangingPassword(false);
        setNewPassword('');
        setSuccessMessage(null);
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Failed to update password.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-sm bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-2xl relative text-navy-50"
        tabIndex={-1}
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-navy-400 hover:text-navy-100 p-1.5 rounded-lg transition-colors focus:ring-2 focus:ring-mint-500/50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-mint-500/10 border border-mint-500/30 flex items-center justify-center text-mint-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-base font-semibold text-white tracking-tight">
              Nemo Owner Access
            </h2>
            <p className="text-xs text-navy-400">
              syahmiaof123@gmail.com
            </p>
          </div>
        </div>

        {user ? (
          // Authenticated State View
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-navy-800/60 border border-navy-700/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-navy-400 font-medium">Account Status</p>
                <p className="text-sm font-semibold text-mint-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Owner
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mint-500/15 text-mint-400 border border-mint-500/30">
                Active
              </span>
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-3 pt-1">
                <div>
                  <label htmlFor="new-pass" className="block text-xs font-medium text-navy-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-pass"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl bg-navy-950 border border-navy-700 focus:border-mint-500 text-white placeholder-navy-500"
                      placeholder="Minimum 6 characters"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-400">{errorMessage}</p>
                )}
                {successMessage && (
                  <p className="text-xs text-mint-400">{successMessage}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setErrorMessage(null);
                    }}
                    className="w-1/2 py-2 px-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-navy-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 6}
                    className="w-1/2 py-2 px-3 rounded-xl bg-mint-500 hover:bg-mint-400 text-navy-950 text-xs font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full py-2 px-3 rounded-xl bg-navy-800/80 hover:bg-navy-800 border border-navy-700 text-navy-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Change Password
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    closeAuthModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="owner-password" className="block text-xs font-medium text-navy-300 mb-1.5">
                Owner Password
              </label>
              <div className="relative">
                <input
                  id="owner-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl bg-navy-950 border border-navy-700 focus:border-mint-500 focus:ring-1 focus:ring-mint-500 text-white placeholder-navy-500 transition-colors"
                  placeholder="Enter owner password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-lg bg-mint-500/10 border border-mint-500/30 text-xs text-mint-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-mint-500 hover:bg-mint-400 text-navy-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Cloud'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
