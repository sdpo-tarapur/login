import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Server,
  Layers,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  SUPABASE_SQL_SETUP_SCRIPT,
} from '../lib/supabase';
import { testAllSupabaseTables, seedAllDataToSupabase } from '../services/supabaseService';
import {
  UserAccount,
  FIRCase,
  InvestigatingOfficer,
  LeaveLedgerEntry,
  LandDispute,
  UDCase,
  DailyCrimeReport,
  UserMessage,
} from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAllData: () => Promise<void>;
  localData: {
    userAccounts: UserAccount[];
    cases: FIRCase[];
    ios: InvestigatingOfficer[];
    leaveLedger: LeaveLedgerEntry[];
    landDisputes: LandDispute[];
    udCases: UDCase[];
    dailyReports: DailyCrimeReport[];
    messages: UserMessage[];
  };
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshAllData,
  localData,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'tables' | 'sql'>('config');
  const [tableStatusResults, setTableStatusResults] = useState<Record<string, { status: 'ok' | 'missing' | 'error'; count?: number; error?: string }> | null>(null);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setStatusMessage(null);
      setTableStatusResults(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl) {
      setStatusMessage({ type: 'error', text: 'Please enter your Supabase Project URL.' });
      return;
    }
    if (!cleanKey) {
      setStatusMessage({ type: 'error', text: 'Please enter your Supabase Public Anon Key.' });
      return;
    }

    const res = saveSupabaseConfig(cleanUrl, cleanKey);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Supabase credentials saved successfully! Testing connection...' });
      handleTestConnection();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to save configuration.' });
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to disconnect Supabase and revert to local storage mode?')) {
      clearSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTableStatusResults(null);
      setStatusMessage({ type: 'info', text: 'Supabase disconnected. System is now running in Local Storage mode.' });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Verifying Supabase connection and checking database tables...' });
    try {
      const result = await testAllSupabaseTables();
      setTableStatusResults(result.tables);
      if (result.connected) {
        setStatusMessage({
          type: 'success',
          text: 'Supabase database is connected and responsive! You can now sync or fetch police records.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `${result.message} Please check your credentials or run the SQL setup script.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Connection test failed: ${err?.message || 'Network error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllData = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Uploading all local records, officer rosters, and cases to Supabase...' });
    try {
      const res = await seedAllDataToSupabase(localData);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Sync Complete: ${res.message} (Accounts: ${res.countSummary.userAccounts}, Cases: ${res.countSummary.cases}, IOs: ${res.countSummary.ios})`,
        });
        handleTestConnection();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message,
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Sync failed: ${e?.message || e}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchAllData = async () => {
    setIsFetching(true);
    setStatusMessage({ type: 'info', text: 'Fetching latest data from Supabase Cloud tables...' });
    try {
      await onRefreshAllData();
      setStatusMessage({
        type: 'success',
        text: 'All records, user accounts, and cases successfully fetched and synchronized from Supabase!',
      });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Fetch failed: ${e?.message || e}` });
    } finally {
      setIsFetching(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                  Cloud Persistence Layer
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isConfigured ? '🟢 Connected' : '🟡 Local Storage'}
                </span>
              </div>
              <h2 className="text-base font-black text-white">
                Supabase Database Setup & Sync Manager
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connection & Credentials</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tables');
              if (!tableStatusResults && isConfigured) handleTestConnection();
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tables'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tables & Health Check</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>SQL Schema Script</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2.5 animate-fadeIn ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* TAB 1: Config */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold mb-1">
                  Connect your Supabase Project for permanent real-time multi-device cloud storage:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Go to your project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Click <strong>Project Settings → API</strong></li>
                  <li>Copy <strong>Project URL</strong> and <strong>Project API key (anon/public)</strong> and paste below.</li>
                  <li>Run the SQL script from the <strong>SQL Schema Script</strong> tab in your Supabase SQL Editor.</li>
                </ol>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://abcdefghijklm.supabase.co"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Supabase Public Anon Key
                  </label>
                  <textarea
                    rows={2}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save & Connect</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !url || !anonKey}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Test Connection</span>
                  </button>

                  {isConfigured && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-2 rounded-lg transition ml-auto flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>
              </form>

              {/* Data Operations */}
              {isConfigured && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    Cloud Database Synchronizations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handlePushAllData}
                      disabled={isSyncing}
                      className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-left transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <UploadCloud className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                      <div>
                        <div className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          {isSyncing ? 'Uploading to Supabase...' : 'Seed / Push All Data to Supabase'}
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Writes all active officer accounts, cases, and records into Supabase cloud tables.
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleFetchAllData}
                      disabled={isFetching}
                      className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-left transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <DownloadCloud className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 ${isFetching ? 'animate-bounce' : ''}`} />
                      <div>
                        <div className="text-xs font-black text-indigo-800 dark:text-indigo-300">
                          {isFetching ? 'Fetching from Cloud...' : 'Fetch & Sync All from Supabase'}
                        </div>
                        <div className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                          Reloads the freshest FIRs, police reports, and accounts from Supabase.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Tables & Health Check */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Supabase Table Status & Row Counts
                </span>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  Re-test Tables
                </button>
              </div>

              {tableStatusResults ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(tableStatusResults).map(([tbl, info]) => (
                    <div
                      key={tbl}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        info.status === 'ok'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {tbl}
                        </div>
                        {info.error && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                            {info.error}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {info.status === 'ok' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {info.count} rows
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            Missing
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Click &quot;Test Connection&quot; on the Connection tab to verify all 9 Supabase tables.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SQL Script */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  PostgreSQL DDL Schema Script
                </span>
                <button
                  onClick={handleCopySQL}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSQL ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Execute this SQL in your <strong>Supabase Dashboard → SQL Editor</strong> to create all tables with proper permissions and initial police accounts:
              </p>
              <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed select-all">
                {SUPABASE_SQL_SETUP_SCRIPT}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tarapur Subdivision Official Police Cloud Integration</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
