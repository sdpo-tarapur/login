import React, { useState } from 'react';
import { UserAccount, UserRole, PoliceStationName, PermissionLevel } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Shield,
  User,
  Key,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currentUserAccount: UserAccount | null;
  onUpdateAccount: (updatedAccount: UserAccount) => void;
  onAddAccount: (newAccount: UserAccount) => void;
  onDeleteAccount?: (accountId: string) => void;
  onResetToDefaults: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentUserAccount,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount,
  onResetToDefaults,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editOfficerName, setEditOfficerName] = useState('');
  const [editRank, setEditRank] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('PS_TARAPUR');
  const [editPermissionLevel, setEditPermissionLevel] = useState<PermissionLevel>('EDITOR');
  const [editPS, setEditPS] = useState<PoliceStationName | 'Subdivision HQ'>('Tarapur');
  
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add account form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newRank, setNewRank] = useState('Station House Officer (SHO)');
  const [newRole, setNewRole] = useState<UserRole>('PS_TARAPUR');
  const [newPermissionLevel, setNewPermissionLevel] = useState<PermissionLevel>('EDITOR');
  const [newPS, setNewPS] = useState<PoliceStationName | 'Subdivision HQ'>('Tarapur');

  if (!isOpen) return null;

  const isAdmin = currentUserAccount?.permissionLevel === 'ADMIN' || (currentUserAccount?.role === 'SDPO' && currentUserAccount?.permissionLevel !== 'VIEWER');

  const displayedAccounts = isAdmin
    ? accounts
    : accounts.filter((a) => a.id === currentUserAccount?.id);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteUser = (acc: UserAccount) => {
    if (!isAdmin) {
      setErrorMsg('Permission Denied: Only Admin can delete user accounts.');
      return;
    }

    if (currentUserAccount?.id === acc.id) {
      setErrorMsg('Action Denied: You cannot delete your own active account while logged in.');
      return;
    }

    setDeletingId(acc.id);
    setErrorMsg('');
  };

  const confirmDeleteUser = (acc: UserAccount) => {
    if (onDeleteAccount) {
      onDeleteAccount(acc.id);
      setSuccessMsg(`User account (${acc.userId}) deleted successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    setDeletingId(null);
  };

  const startEdit = (acc: UserAccount) => {
    setEditingId(acc.id);
    setEditUserId(acc.userId);
    setEditPassword(acc.password);
    setEditOfficerName(acc.officerName);
    setEditRank(acc.rank);
    setEditRole(acc.role);
    setEditPermissionLevel(acc.permissionLevel || (acc.role === 'SDPO' ? 'ADMIN' : 'EDITOR'));
    setEditPS(acc.policeStation);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveEdit = (acc: UserAccount) => {
    if (!isAdmin && currentUserAccount?.id !== acc.id) {
      setErrorMsg('Permission Denied: Only Admin can modify credentials or passwords for other users.');
      return;
    }

    if (!editUserId.trim() || !editPassword.trim()) {
      setErrorMsg('User ID and Password cannot be empty.');
      return;
    }

    // Check duplicate User ID in another account
    const duplicate = accounts.find(
      (a) => a.id !== acc.id && a.userId.toLowerCase() === editUserId.trim().toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`User ID "${editUserId}" is already assigned to another account.`);
      return;
    }

    const updated: UserAccount = {
      ...acc,
      userId: editUserId.trim(),
      password: editPassword.trim(),
      officerName: editOfficerName.trim() || acc.officerName,
      rank: editRank.trim() || acc.rank,
      role: isAdmin ? editRole : acc.role,
      permissionLevel: isAdmin ? editPermissionLevel : acc.permissionLevel,
      policeStation: isAdmin ? editPS : acc.policeStation,
    };

    onUpdateAccount(updated);
    setEditingId(null);
    setSuccessMsg(`Credentials for ${updated.officerName} (${updated.userId}) updated successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Permission Denied: Only Admin can create new user accounts.');
      return;
    }

    if (!newUserId.trim() || !newPassword.trim() || !newOfficerName.trim()) {
      setErrorMsg('Please fill in User ID, Password, and Officer Name.');
      return;
    }

    const duplicate = accounts.find(
      (a) => a.userId.toLowerCase() === newUserId.trim().toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`User ID "${newUserId}" already exists.`);
      return;
    }

    const created: UserAccount = {
      id: `user-${Date.now()}`,
      userId: newUserId.trim().toLowerCase(),
      password: newPassword.trim(),
      role: newRole,
      permissionLevel: newPermissionLevel,
      officerName: newOfficerName.trim(),
      rank: newRank.trim(),
      policeStation: newPS,
      isActive: true,
    };

    onAddAccount(created);
    setIsAddingNew(false);
    setNewUserId('');
    setNewPassword('');
    setNewOfficerName('');
    setSuccessMsg(`New user account (${created.userId}) created successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleResetDefaults = () => {
    if (!isAdmin) {
      setErrorMsg('Permission Denied: Only Admin can reset credentials to defaults.');
      return;
    }
    setIsConfirmingReset(true);
  };

  const confirmResetDefaults = () => {
    onResetToDefaults();
    setIsConfirmingReset(false);
    setSuccessMsg('All user credentials have been reset to factory defaults.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-400/30">
              <Key className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                  PORTAL SECURITY & ACCESS CONTROL
                </span>
                {isAdmin ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> SDPO Admin Mode
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 uppercase">
                    Individual Officer Access
                  </span>
                )}

                {/* Supabase status badge */}
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                    isSupabaseConfigured()
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}
                >
                  <Database className="w-2.5 h-2.5" />
                  {isSupabaseConfigured() ? 'Supabase Sync Active' : 'Local Storage Mode'}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                User Credentials & Permission Level Management
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAdmin ? `Registered Users (${displayedAccounts.length} Accounts)` : 'Your Individual Credentials'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAdmin
                  ? 'As an Admin, you can add new users and change credentials/passwords for all users.'
                  : 'You can edit only your own credentials below (User ID & Password). Password changes for other users require Admin authority.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Add New User ID</span>
                  </button>

                  {isConfirmingReset ? (
                    <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950 p-1.5 rounded-lg border border-amber-300 dark:border-amber-700">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Reset all users to defaults?</span>
                      <button
                        type="button"
                        onClick={confirmResetDefaults}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded"
                      >
                        Yes, Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingReset(false)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleResetDefaults}
                      className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                      title="Reset all User IDs and Passwords to initial defaults"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Only Admin can Add Users or Change Others' Passwords</span>
                </div>
              )}
            </div>
          </div>

          {/* Create New Account Form (Admin Only) */}
          {isAddingNew && isAdmin && (
            <form onSubmit={handleCreateAccount} className="p-4 bg-blue-50/70 dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 dark:border-slate-700 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Create New Officer Account & Set Permission Level</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Officer Name *
                  </label>
                  <input
                    type="text"
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    placeholder="e.g. SI Anand Kumar"
                    required
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official User ID *
                  </label>
                  <input
                    type="text"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="e.g. sho.tarapur2"
                    required
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-blue-700 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. pass@1234"
                    required
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Rank
                  </label>
                  <input
                    type="text"
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value)}
                    placeholder="e.g. Station House Officer (SHO)"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role / Desk
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'SDPO' || r === 'CI') setNewPS('Subdivision HQ');
                      else if (r === 'PS_TARAPUR') setNewPS('Tarapur');
                      else if (r === 'PS_ASARGANJ') setNewPS('Asarganj');
                      else if (r === 'PS_SANGRAMPUR') setNewPS('Sangrampur');
                      else if (r === 'PS_HARPUR') setNewPS('Harpur');
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="SDPO">SDPO Tarapur (Super User)</option>
                    <option value="CI">Circle Inspector (CI)</option>
                    <option value="PS_TARAPUR">Tarapur Police Station</option>
                    <option value="PS_ASARGANJ">Asarganj Police Station</option>
                    <option value="PS_SANGRAMPUR">Sangrampur Police Station</option>
                    <option value="PS_HARPUR">Harpur Police Station</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Permission Level *
                  </label>
                  <select
                    value={newPermissionLevel}
                    onChange={(e) => setNewPermissionLevel(e.target.value as PermissionLevel)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg font-bold text-amber-700 dark:text-amber-400"
                  >
                    <option value="EDITOR">EDITOR — Can View, Add & Update Cases</option>
                    <option value="VIEWER">VIEWER — Read-Only Access (No Edit Rights)</option>
                    <option value="ADMIN">ADMIN — Super User (Full Control & Manage Accounts)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 pt-2 border-t border-blue-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-1.5 rounded-lg transition text-xs shadow-sm"
                  >
                    Save & Activate Officer Account
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Accounts Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
                  <th className="p-3">Police Station / Unit</th>
                  <th className="p-3">Officer Name & Rank</th>
                  <th className="p-3">Permission Level</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Password</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayedAccounts.map((acc) => {
                  const isEditing = editingId === acc.id;
                  const isVisiblePass = showPasswords[acc.id];

                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      {/* PS / Jurisdiction */}
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{acc.policeStation}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Role: {acc.role}</span>
                      </td>

                      {/* Officer Name */}
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editOfficerName}
                              onChange={(e) => setEditOfficerName(e.target.value)}
                              className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 rounded text-xs font-semibold"
                              placeholder="Officer Name"
                            />
                            <input
                              type="text"
                              value={editRank}
                              onChange={(e) => setEditRank(e.target.value)}
                              className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 rounded text-[11px]"
                              placeholder="Rank / Designation"
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {acc.officerName}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {acc.rank}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Permission Level Badge / Selector */}
                      <td className="p-3">
                        {isEditing && isAdmin ? (
                          <select
                            value={editPermissionLevel}
                            onChange={(e) => setEditPermissionLevel(e.target.value as PermissionLevel)}
                            className="p-1 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-bold text-amber-700 dark:text-amber-300"
                          >
                            <option value="ADMIN">ADMIN (Super User)</option>
                            <option value="EDITOR">EDITOR (Add/Edit)</option>
                            <option value="VIEWER">VIEWER (Read Only)</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                              acc.permissionLevel === 'ADMIN' || acc.role === 'SDPO'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : acc.permissionLevel === 'VIEWER'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                                : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            }`}
                          >
                            {acc.permissionLevel || (acc.role === 'SDPO' ? 'ADMIN' : 'EDITOR')}
                          </span>
                        )}
                      </td>

                      {/* User ID */}
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editUserId}
                            onChange={(e) => setEditUserId(e.target.value)}
                            className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 rounded text-xs font-mono font-bold text-blue-700 dark:text-blue-400"
                          />
                        ) : (
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded border border-blue-200 dark:border-blue-900 inline-block">
                            {acc.userId}
                          </span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 dark:text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {isVisiblePass ? acc.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(acc.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                              title={isVisiblePass ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisiblePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(acc)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : deletingId === acc.id ? (
                          <div className="flex items-center justify-end gap-1.5 bg-rose-50 dark:bg-rose-950/80 p-1.5 rounded-lg border border-rose-300 dark:border-rose-800 animate-fadeIn">
                            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200">Delete user?</span>
                            <button
                              type="button"
                              onClick={() => confirmDeleteUser(acc)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded transition shadow-xs"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {(isAdmin || currentUserAccount?.id === acc.id) && (
                              <button
                                onClick={() => startEdit(acc)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded border border-slate-300 dark:border-slate-700 transition inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit Credentials</span>
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteUser(acc)}
                                disabled={currentUserAccount?.id === acc.id}
                                className={`px-2 py-1 rounded border transition inline-flex items-center gap-1 ${
                                  currentUserAccount?.id === acc.id
                                    ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                    : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                }`}
                                title={currentUserAccount?.id === acc.id ? 'Cannot delete active logged in account' : 'Delete User Account'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-xs font-bold">Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 rounded-lg text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <strong>Super User Authorization Control:</strong> Permission levels (`ADMIN`, `EDITOR`, `VIEWER`) determine whether an officer can record or modify crime cases, land disputes, and daily supervision reports. Only SDPO Super User can create new accounts or elevate privileges.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 font-bold text-xs rounded-lg transition"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
