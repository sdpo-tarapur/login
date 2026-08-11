import React from 'react';
import { UserRole, UserAccount } from '../types';
import { getRoleDisplayTitle } from '../utils/helpers';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  FileText,
  UserCheck,
  Scale,
  AlertTriangle,
  Sun,
  Moon,
  Key,
  LogOut,
  User,
  Lock,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUserAccount: UserAccount | null;
  onOpenUserManagement: () => void;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewFIR: () => void;
  onOpenNewLandDispute: () => void;
  overdueCount: number;
  pendingSRCount: number;
  pendingLandDisputesCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isReadOnly?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUserAccount,
  onOpenUserManagement,
  onLogout,
  activeTab,
  onTabChange,
  onOpenNewFIR,
  onOpenNewLandDispute,
  overdueCount,
  pendingSRCount,
  pendingLandDisputesCount,
  theme = 'light',
  onToggleTheme,
  isReadOnly = false,
}) => {
  const isSuperUser = currentRole === 'SDPO';

  return (
    <header className="bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800/80 shadow-sm">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title & Organization Sub-heading */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Shield className="w-7 h-7 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  POLICE HQ • MUNGER DISTRICT
                </span>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  • TARAPUR SUBDIVISION
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                SDPO Tarapur — Crime & Investigation Command
              </h1>
              <p className="text-[11px] text-slate-300">
                Tarapur • Asarganj • Sangrampur • Harpur Police Stations
              </p>
            </div>
          </div>

          {/* User Profile, User ID & Role Actions */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/90 dark:bg-slate-900 p-2 rounded-xl border border-slate-700/80 shadow-xs">
            
            {/* Supabase Status Pill */}
            <div
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 border ${
                isSupabaseConfigured()
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950/70 text-amber-300 border-amber-800'
              }`}
              title={
                isSupabaseConfigured()
                  ? 'Supabase Cloud Database connected and active'
                  : 'Local Storage Mode. Add VITE_SUPABASE_URL to .env for Cloud Sync'
              }
            >
              <Database className="w-3 h-3 shrink-0" />
              <span>{isSupabaseConfigured() ? 'Supabase Connected' : 'Local Storage'}</span>
            </div>

            {/* Authenticated Officer Info Badge */}
            {currentUserAccount ? (
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/90">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{currentUserAccount.officerName}</span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800">
                      ID: {currentUserAccount.userId}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                      currentUserAccount.permissionLevel === 'ADMIN' || currentUserAccount.role === 'SDPO'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : currentUserAccount.permissionLevel === 'VIEWER'
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-blue-900/80 text-blue-300 border-blue-700'
                    }`}>
                      {currentUserAccount.permissionLevel || (currentUserAccount.role === 'SDPO' ? 'ADMIN' : 'EDITOR')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {currentUserAccount.rank} • {currentUserAccount.policeStation}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-1">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300 font-semibold">Role:</span>
              </div>
            )}

            {/* Active Role Badge (Select Dropdown Removed for Security) */}
            <div className="bg-slate-900 border border-slate-700/90 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-200 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{getRoleDisplayTitle(currentRole)}</span>
            </div>

            {/* User ID & Password Management Button */}
            <button
              onClick={onOpenUserManagement}
              title="Manage Officer User IDs & Passwords"
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Set IDs & Passwords</span>
            </button>

            {/* Logout / Lock Button */}
            <button
              onClick={onLogout}
              title="Logout from portal"
              className="bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
                className="p-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-lg transition flex items-center gap-1.5 text-xs font-bold"
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-300 fill-indigo-300/20" />
                  </>
                )}
              </button>
            )}

            {/* Quick Action Buttons (Hidden if Read-Only) */}
            {!isReadOnly ? (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onOpenNewFIR}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ New FIR Entry</span>
                </button>
                <button
                  onClick={onOpenNewLandDispute}
                  className="border border-slate-600 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-300" />
                  <span>Land Dispute</span>
                </button>
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Read-Only (Viewer Rights)</span>
              </div>
            )}
          </div>
        </div>

        {/* Operational Status Ticker */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          {isReadOnly && (
            <div className="flex items-center gap-1.5 bg-amber-950/80 text-amber-300 font-extrabold px-2.5 py-0.5 rounded border border-amber-800 text-[11px] animate-pulse">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>VIEW-ONLY PERMISSION ACTIVE</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Authenticated Officer:</span>
            <strong className="text-white font-bold">{currentUserAccount?.officerName || getRoleDisplayTitle(currentRole)}</strong>
          </div>

          <div className="h-3 w-px bg-slate-800 hidden sm:block"></div>

          {overdueCount > 0 ? (
            <div className="flex items-center gap-1.5 text-rose-300 font-extrabold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span><strong>{overdueCount}</strong> OVERDUE (&gt;60/90 Days)</span>
            </div>
          ) : (
            <span className="text-emerald-400 text-[11px] font-bold">✓ Statutory Deadlines Compliant</span>
          )}

          <div className="h-3 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <span className="text-slate-400">Special Reports (SR):</span>
            <strong className="text-amber-400 font-bold">{pendingSRCount}</strong>
          </div>

          <div className="h-3 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <span className="text-slate-400">Open Land Disputes:</span>
            <strong className="text-emerald-400 font-bold">{pendingLandDisputesCount}</strong>
          </div>

          {isSuperUser && (
            <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
              Super User Active
            </span>
          )}
        </div>
      </div>

      {/* Clean Navigation Tab Links */}
      <div className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto scrollbar-none gap-1.5 py-1.5">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('firs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'firs'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>FIR Records</span>
          </button>

          <button
            onClick={() => onTabChange('deadlines')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 relative ${
              activeTab === 'deadlines'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Deadline Monitor</span>
            {overdueCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 rounded-full">
                {overdueCount}
              </span>
            )}
          </button>

          {/* Supervision Status Tab - Super User (SDPO Only) */}
          {isSuperUser && (
            <button
              onClick={() => onTabChange('supervision')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'supervision'
                  ? 'bg-purple-950 text-white dark:bg-purple-900/80 border-b-2 border-purple-400 shadow-xs'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Supervision Status</span>
              <span className="bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                SR
              </span>
            </button>
          )}

          <button
            onClick={() => onTabChange('land_disputes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'land_disputes'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Land Disputes</span>
          </button>

          <button
            onClick={() => onTabChange('ud_cases')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ud_cases'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>UD & NON-SR Desk</span>
          </button>

          <button
            onClick={() => onTabChange('ios')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ios'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>IO Management</span>
          </button>

          <button
            onClick={() => onTabChange('daily_reports')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'daily_reports'
                ? 'bg-indigo-900 text-white dark:bg-slate-800 border-b-2 border-amber-400 shadow-xs'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-300" />
            <span>Daily Reports</span>
          </button>
        </div>
      </div>
    </header>
  );
};
