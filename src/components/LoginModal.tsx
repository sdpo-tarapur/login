import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Shield, Lock, User, Key, AlertCircle, Eye, EyeOff, Database, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  accounts: UserAccount[];
  onLoginSuccess: (userAccount: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, accounts = [], onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const supabaseConnected = isSupabaseConfigured();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const cleanUser = userId.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Please enter both User ID and Password.');
      return;
    }

    // Match against active accounts safely
    const match = (accounts || []).find((acc) => {
      if (!acc) return false;
      const accUserId = String(acc.userId || '').trim().toLowerCase();
      const accPass = String(acc.password || '').trim();
      const isActive = acc.isActive ?? true;

      return accUserId === cleanUser && accPass === cleanPass && isActive;
    });

    if (match) {
      onLoginSuccess(match);
    } else {
      setErrorMessage('Invalid User ID or Password. Please check your officer credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 text-center relative border-b border-slate-800">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-400/30 rounded-full flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Shield className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
            BIHAR POLICE — MUNGER DISTRICT
          </span>
          <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
            Tarapur Subdivision Police Portal
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Official Crime & Investigation Monitoring System — Secure Officer Login
          </p>
          {/* Supabase Connection Status Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-xs">
            <Database className="w-3.5 h-3.5" />
            {supabaseConnected ? (
              <span className="text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Supabase Database Connected & Syncing
              </span>
            ) : (
              <span className="text-amber-300">
                Local Storage Mode (Configure VITE_SUPABASE_URL for Cloud Sync)
              </span>
            )}
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Official User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter User ID (e.g. sdpo.tarapur, sho.tarapur)"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Authenticate & Access Portal</span>
            </button>
          </form>

          {/* Security Note */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Authorized Bihar Police personnel only. All access attempts are logged.
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          SDPO Tarapur Crime Supervision Portal — Bihar Police
        </div>
      </div>
    </div>
  );
};
