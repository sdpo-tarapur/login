import React, { useState, useEffect } from 'react';
import {
  UserRole,
  UserAccount,
  FIRCase,
  LandDispute,
  UDCase,
  InvestigatingOfficer,
  DailyCrimeReport,
  UserMessage,
  FilterOptions,
  CaseDesignation,
  PoliceStationName,
  LeaveLedgerEntry,
} from './types';
import {
  INITIAL_USER_ACCOUNTS,
  INITIAL_FIRS,
  INITIAL_LAND_DISPUTES,
  INITIAL_UD_CASES,
  INITIAL_IOS,
  INITIAL_CRIME_REPORTS,
  INITIAL_MESSAGES,
  INITIAL_LEAVE_LEDGER,
} from './data/mockData';
import { getDeadlineInfo, getPSFromRole, matchesCaseFullDatabaseSearch } from './utils/helpers';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { FIRFilterBar } from './components/FIRFilterBar';
import { FIRTable } from './components/FIRTable';
import { NewFIREntryModal } from './components/NewFIREntryModal';
import { EditFIRModal } from './components/EditFIRModal';
import { ViewCaseModal } from './components/ViewCaseModal';
import { LandDisputeSection } from './components/LandDisputeSection';
import { DeadlineMonitor } from './components/DeadlineMonitor';
import { UDCaseSection } from './components/UDCaseSection';
import { IOManagement } from './components/IOManagement';
import { DailyCrimeReportSection } from './components/DailyCrimeReport';
import { SupervisionStatusSection } from './components/SupervisionStatusSection';
import { AIChatbot } from './components/AIChatbot';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { isSupabaseConfigured } from './lib/supabase';
import {
  fetchUserAccountsFromSupabase,
  saveUserAccountToSupabase,
  deleteUserAccountFromSupabase,
  fetchFIRCasesFromSupabase,
  saveFIRCaseToSupabase,
  deleteFIRCaseFromSupabase,
  fetchLandDisputesFromSupabase,
  saveLandDisputeToSupabase,
  deleteLandDisputeFromSupabase,
  fetchUDCasesFromSupabase,
  saveUDCaseToSupabase,
  deleteUDCaseFromSupabase,
  fetchIOsFromSupabase,
  saveIOToSupabase,
  deleteIOFromSupabase,
  fetchLeaveLedgerFromSupabase,
  saveLeaveLedgerEntryToSupabase,
  deleteLeaveLedgerEntryFromSupabase,
  fetchDailyReportsFromSupabase,
  saveDailyReportToSupabase,
  deleteDailyReportFromSupabase,
  fetchUserMessagesFromSupabase,
  saveUserMessageToSupabase,
  deleteUserMessageFromSupabase,
  fetchMonthlyArrestOverridesFromSupabase,
  saveMonthlyArrestOverrideToSupabase,
} from './services/supabaseService';

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  policeStations: [],
  designations: [],
  deadlineStatus: 'ALL',
  statuses: [],
  cctnsSyncFilter: 'ALL',
  chargesheetCCTNS: 'ALL',
  caseDiaryCCTNS: 'ALL',
  ioNames: [],
  startDate: '',
  endDate: '',
  chargesheetStartDate: '',
  chargesheetEndDate: '',
  deadlineCategories: [],
};

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sdpo_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sdpo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // User Accounts & Security State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_user_accounts');
      return saved ? JSON.parse(saved) : INITIAL_USER_ACCOUNTS;
    } catch {
      return INITIAL_USER_ACCOUNTS;
    }
  });

  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('sdpo_current_user_account');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Persistent State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (currentUserAccount) return currentUserAccount.role;
    try {
      const saved = localStorage.getItem('sdpo_current_role');
      return (saved as UserRole) || 'SDPO';
    } catch {
      return 'SDPO';
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [cases, setCases] = useState<FIRCase[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_firs');
      return saved ? JSON.parse(saved) : INITIAL_FIRS;
    } catch {
      return INITIAL_FIRS;
    }
  });

  const [landDisputes, setLandDisputes] = useState<LandDispute[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_land_disputes');
      return saved ? JSON.parse(saved) : INITIAL_LAND_DISPUTES;
    } catch {
      return INITIAL_LAND_DISPUTES;
    }
  });

  const [udCases, setUdCases] = useState<UDCase[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_ud_cases');
      return saved ? JSON.parse(saved) : INITIAL_UD_CASES;
    } catch {
      return INITIAL_UD_CASES;
    }
  });

  const [ios, setIos] = useState<InvestigatingOfficer[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_ios');
      return saved ? JSON.parse(saved) : INITIAL_IOS;
    } catch {
      return INITIAL_IOS;
    }
  });

  const [dailyReports, setDailyReports] = useState<DailyCrimeReport[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_daily_reports');
      return saved ? JSON.parse(saved) : INITIAL_CRIME_REPORTS;
    } catch {
      return INITIAL_CRIME_REPORTS;
    }
  });

  const [messages, setMessages] = useState<UserMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [monthlyArrestOverrides, setMonthlyArrestOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('sdpo_monthly_arrest_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [leaveLedger, setLeaveLedger] = useState<LeaveLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_leave_ledger');
      return saved ? JSON.parse(saved) : INITIAL_LEAVE_LEDGER;
    } catch {
      return INITIAL_LEAVE_LEDGER;
    }
  });

  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Modals state
  const [isNewFIRModalOpen, setIsNewFIRModalOpen] = useState(false);
  const [isNewLandDisputeModalOpen, setIsNewLandDisputeModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<FIRCase | null>(null);
  const [viewingCase, setViewingCase] = useState<FIRCase | null>(null);

  // Save user accounts to LocalStorage
  useEffect(() => {
    localStorage.setItem('sdpo_user_accounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  useEffect(() => {
    if (currentUserAccount) {
      localStorage.setItem('sdpo_current_user_account', JSON.stringify(currentUserAccount));
    } else {
      localStorage.removeItem('sdpo_current_user_account');
    }
  }, [currentUserAccount]);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('sdpo_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('sdpo_firs', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem('sdpo_land_disputes', JSON.stringify(landDisputes));
  }, [landDisputes]);

  useEffect(() => {
    localStorage.setItem('sdpo_ud_cases', JSON.stringify(udCases));
  }, [udCases]);

  useEffect(() => {
    localStorage.setItem('sdpo_ios', JSON.stringify(ios));
  }, [ios]);

  useEffect(() => {
    localStorage.setItem('sdpo_daily_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem('sdpo_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('sdpo_monthly_arrest_overrides', JSON.stringify(monthlyArrestOverrides));
  }, [monthlyArrestOverrides]);

  useEffect(() => {
    localStorage.setItem('sdpo_leave_ledger', JSON.stringify(leaveLedger));
  }, [leaveLedger]);

  // Supabase Initial Sync on Mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Fetch User Accounts
      fetchUserAccountsFromSupabase().then((accounts) => {
        if (accounts && accounts.length > 0) {
          setUserAccounts(accounts);
        }
      });
      // Fetch FIR cases
      fetchFIRCasesFromSupabase().then((firList) => {
        if (firList && firList.length > 0) {
          setCases(firList);
        }
      });
      // Fetch Land disputes
      fetchLandDisputesFromSupabase().then((landList) => {
        if (landList && landList.length > 0) {
          setLandDisputes(landList);
        }
      });
      // Fetch UD cases
      fetchUDCasesFromSupabase().then((udList) => {
        if (udList && udList.length > 0) {
          setUdCases(udList);
        }
      });
      // Fetch IOs
      fetchIOsFromSupabase().then((ioList) => {
        if (ioList && ioList.length > 0) {
          setIos(ioList);
        }
      });
      // Fetch Leave Ledger
      fetchLeaveLedgerFromSupabase().then((leaveList) => {
        if (leaveList && leaveList.length > 0) {
          setLeaveLedger(leaveList);
        }
      });
      // Fetch Daily Reports
      fetchDailyReportsFromSupabase().then((reports) => {
        if (reports && reports.length > 0) {
          setDailyReports(reports);
        }
      });
      // Fetch User Messages
      fetchUserMessagesFromSupabase().then((msgs) => {
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
        }
      });
      // Fetch Monthly Arrest Overrides
      fetchMonthlyArrestOverridesFromSupabase().then((overrides) => {
        if (overrides) {
          setMonthlyArrestOverrides(overrides);
        }
      });
    }
  }, []);

  // Auth Handlers
  const handleLoginSuccess = (account: UserAccount) => {
    setCurrentUserAccount(account);
    setCurrentRole(account.role);
  };

  const handleLogout = () => {
    setCurrentUserAccount(null);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    // Find matching account or update current account role
    const matchingAccount = userAccounts.find((a) => a.role === role);
    if (matchingAccount) {
      setCurrentUserAccount(matchingAccount);
    }
  };

  const handleUpdateUserAccount = (updated: UserAccount) => {
    setUserAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (currentUserAccount?.id === updated.id) {
      setCurrentUserAccount(updated);
      setCurrentRole(updated.role);
    }
    saveUserAccountToSupabase(updated);
  };

  const handleAddUserAccount = (newAccount: UserAccount) => {
    setUserAccounts((prev) => [...prev, newAccount]);
    saveUserAccountToSupabase(newAccount);
  };

  const handleDeleteUserAccount = (accountId: string) => {
    if (currentUserAccount?.id === accountId) {
      alert('Action Denied: You cannot delete your own active account while logged in.');
      return;
    }
    setUserAccounts((prev) => prev.filter((a) => a.id !== accountId));
    deleteUserAccountFromSupabase(accountId);
  };

  const handleResetUserAccountsToDefaults = () => {
    setUserAccounts(INITIAL_USER_ACCOUNTS);
    if (currentUserAccount) {
      const match = INITIAL_USER_ACCOUNTS.find((a) => a.role === currentUserAccount.role);
      if (match) setCurrentUserAccount(match);
    }
  };

  // Active PS if user is a Police Station login
  const activePS = getPSFromRole(currentRole);

  // Permission levels check
  const isViewer = currentUserAccount?.permissionLevel === 'VIEWER';
  const isOperator = currentUserAccount?.permissionLevel === 'OPERATOR';
  // Operator is like viewer for FIRs, UD, IOs, Land Disputes
  const isReadOnly = isViewer || isOperator;
  // Operator CAN add to daily reports, only VIEWER is read-only for daily reports
  const isDailyReportReadOnly = isViewer;

  // Handlers for FIRs
  const handleCreateFIR = (newCaseData: Omit<FIRCase, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access. You cannot create new FIR records.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const newCase: FIRCase = {
      ...newCaseData,
      id: `fir-${Date.now()}`,
      createdAt: todayStr,
      updatedAt: todayStr,
    };
    setCases((prev) => [newCase, ...prev]);
    saveFIRCaseToSupabase(newCase);
  };

  const handleUpdateFIR = (updatedCase: FIRCase) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access. You cannot modify case records.');
      return;
    }
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    saveFIRCaseToSupabase(updatedCase);
  };

  const handleDeleteFIR = (caseId: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    // Permissions check: Superuser (SDPO) can delete anything. PS can delete their cases. CI can delete NON-SR cases.
    const isSuperUser = currentRole === 'SDPO';
    const isOwnPS = activePS && targetCase.ps === activePS;
    const isCI = currentRole === 'CI';

    if (!isSuperUser && !isOwnPS && !isCI) {
      alert(`Permission Denied: ${currentRole} cannot delete FIR cases belonging to ${targetCase.ps} PS.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete FIR ${targetCase.firNumber} (${targetCase.ps} PS)? This action cannot be undone.`)) {
      return;
    }

    setCases((prev) => prev.filter((c) => c.id !== caseId));
    deleteFIRCaseFromSupabase(caseId);
  };

  const handleDeleteSupervisionNote = (caseId: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    if (currentRole !== 'SDPO') {
      alert('Permission Denied: Police Stations cannot delete supervision directives. Only SDPO (Superuser) can delete or clear supervision directives.');
      return;
    }
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    if (!window.confirm(`Are you sure you want to clear/delete the SDPO Supervision directive for FIR ${targetCase.firNumber}?`)) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedCase: FIRCase = {
      ...targetCase,
      sdpoSupervisionNote: undefined,
      supervisionDate: undefined,
      updatedAt: todayStr,
    };

    setCases((prev) => prev.map((c) => (c.id === caseId ? updatedCase : c)));
    saveFIRCaseToSupabase(updatedCase);
  };

  const handleDesignateCase = (caseId: string, designation: CaseDesignation) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    if (currentRole !== 'SDPO') {
      alert('Only SDPO (Super User) has authority to classify cases as SR or NON-SR.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const targetCase = cases.find((c) => c.id === caseId);
    if (targetCase) {
      const updatedCase: FIRCase = {
        ...targetCase,
        designation,
        designationDate: todayStr,
        updatedAt: todayStr,
      };
      setCases((prev) => prev.map((c) => (c.id === caseId ? updatedCase : c)));
      saveFIRCaseToSupabase(updatedCase);
    }
  };

  // Handlers for Land Disputes
  const handleAddLandDispute = (newDisputeData: Omit<LandDispute, 'id' | 'createdAt'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const newDispute: LandDispute = {
      ...newDisputeData,
      id: `ld-${Date.now()}`,
      createdAt: todayStr,
    };
    setLandDisputes((prev) => [newDispute, ...prev]);
    saveLandDisputeToSupabase(newDispute);
  };

  const handleUpdateLandDisputeStatus = (
    id: string,
    status: 'Pending' | 'Disposed',
    disposalRemarks?: string
  ) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const target = landDisputes.find((l) => l.id === id);
    if (target) {
      const updated: LandDispute = {
        ...target,
        status,
        disposalDate: status === 'Disposed' ? todayStr : undefined,
        disposalRemarks: status === 'Disposed' ? disposalRemarks || target.disposalRemarks : undefined,
      };
      setLandDisputes((prev) => prev.map((l) => (l.id === id ? updated : l)));
      saveLandDisputeToSupabase(updated);
    }
  };

  const handleDeleteLandDispute = (id: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const target = landDisputes.find((l) => l.id === id);
    if (!target) return;

    const isSuperUser = currentRole === 'SDPO';
    const isOwnPS = activePS && target.ps === activePS;

    if (!isSuperUser && !isOwnPS) {
      alert(`Permission Denied: ${currentRole} cannot delete Land Disputes belonging to ${target.ps} PS.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this Land Dispute record for ${target.victimName}?`)) {
      return;
    }

    setLandDisputes((prev) => prev.filter((l) => l.id !== id));
    deleteLandDisputeFromSupabase(id);
  };

  // Handlers for UD Cases
  const handleAddUDCase = (newUDData: Omit<UDCase, 'id'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const newUD: UDCase = {
      ...newUDData,
      id: `ud-${Date.now()}`,
    };
    setUdCases((prev) => [newUD, ...prev]);
    saveUDCaseToSupabase(newUD);
  };

  const handleUpdateUDCase = (updatedUD: UDCase) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    setUdCases((prev) => prev.map((u) => (u.id === updatedUD.id ? updatedUD : u)));
    saveUDCaseToSupabase(updatedUD);
  };

  const handleDeleteUDCase = (id: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const target = udCases.find((u) => u.id === id);
    if (!target) return;

    const isSuperUser = currentRole === 'SDPO';
    const isOwnPS = activePS && target.ps === activePS;

    if (!isSuperUser && !isOwnPS) {
      alert(`Permission Denied: ${currentRole} cannot delete UD cases belonging to ${target.ps} PS.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete UD Case ${target.udCaseNo} (${target.ps} PS)?`)) {
      return;
    }

    setUdCases((prev) => prev.filter((u) => u.id !== id));
    deleteUDCaseFromSupabase(id);
  };

  // Handlers for IOs
  const handleAddIO = (newIOData: Omit<InvestigatingOfficer, 'id'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const newIO: InvestigatingOfficer = {
      ...newIOData,
      id: `io-${Date.now()}`,
    };
    setIos((prev) => [...prev, newIO]);
    saveIOToSupabase(newIO);
  };

  const handleUpdateIO = (updatedIO: InvestigatingOfficer) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    setIos((prev) => prev.map((io) => (io.id === updatedIO.id ? updatedIO : io)));
    saveIOToSupabase(updatedIO);
  };

  const handleDeleteIO = (ioId: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const targetIO = ios.find((i) => i.id === ioId);
    if (!targetIO) return;

    const isSuperUser = currentRole === 'SDPO';
    const isOwnPS = activePS && targetIO.ps === activePS;
    const isCI = currentRole === 'CI';

    if (!isSuperUser && !isOwnPS && !isCI) {
      alert(`Permission Denied: ${currentRole} cannot delete IO assigned to ${targetIO.ps} PS.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete IO ${targetIO.name} (${targetIO.ps} PS)?`)) {
      return;
    }

    setIos((prev) => prev.filter((i) => i.id !== ioId));
    deleteIOFromSupabase(ioId);
  };

  // Handlers for Daily Crime Reports
  const handleAddDailyReport = (newReportData: Omit<DailyCrimeReport, 'id'>) => {
    if (isViewer) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) access.');
      return;
    }
    const newReport: DailyCrimeReport = {
      ...newReportData,
      id: `dcr-${Date.now()}`,
    };
    setDailyReports((prev) => [newReport, ...prev]);
    saveDailyReportToSupabase(newReport);

    // Auto-sync newly recorded departing officers to leave ledger
    if (newReport.leaveLedgerEntries && newReport.leaveLedgerEntries.length > 0) {
      setLeaveLedger((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const toAdd = (newReport.leaveLedgerEntries || []).filter((e) => !existingIds.has(e.id));
        toAdd.forEach((entry) => saveLeaveLedgerEntryToSupabase(entry));
        return [...toAdd, ...prev];
      });
    }
  };

  const handleUpdateLeaveStatus = (leaveId: string, status: 'ON_LEAVE' | 'ARRIVED' | 'OVERDUE', actualArrivalDate?: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has view-only access to the leave ledger.');
      return;
    }
    setLeaveLedger((prev) =>
      prev.map((item) => {
        if (item.id === leaveId) {
          const updated: LeaveLedgerEntry = {
            ...item,
            status,
            actualArrivalDate: status === 'ARRIVED' ? (actualArrivalDate || new Date().toISOString().split('T')[0]) : undefined,
          };
          saveLeaveLedgerEntryToSupabase(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddLeaveEntry = (entry: LeaveLedgerEntry) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has view-only access to the leave ledger.');
      return;
    }
    setLeaveLedger((prev) => [entry, ...prev]);
    saveLeaveLedgerEntryToSupabase(entry);
  };

  const handleDeleteLeaveEntry = (leaveId: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has view-only access to the leave ledger.');
      return;
    }
    setLeaveLedger((prev) => prev.filter((item) => item.id !== leaveId));
    deleteLeaveLedgerEntryFromSupabase(leaveId);
  };

  const handleDeleteDailyReport = (id: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account does not have permission to delete reports.');
      return;
    }
    const target = dailyReports.find((r) => r.id === id);
    if (!target) return;

    const isSuperUser = currentRole === 'SDPO';
    const isOwnPS = activePS && target.ps === activePS;

    if (!isSuperUser && !isOwnPS) {
      alert(`Permission Denied: ${currentRole} cannot delete daily reports belonging to ${target.ps} PS.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this daily crime report entry?`)) {
      return;
    }

    setDailyReports((prev) => prev.filter((r) => r.id !== id));
    deleteDailyReportFromSupabase(id);
  };

  // Handlers for Inter-Desk Messages
  const handleSendMessage = (msgData: Omit<UserMessage, 'id' | 'createdAt'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has view-only access to the messages desk.');
      return;
    }
    const newMsg: UserMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [newMsg, ...prev]);
    saveUserMessageToSupabase(newMsg);
  };

  const handleDeleteMessage = (msgId: string) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account has view-only access to messages.');
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    deleteUserMessageFromSupabase(msgId);
  };

  const handleMarkMessageAsRead = (msgId: string) => {
    const currentUserId = currentUserAccount?.userId || currentRole;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const currentRead = m.readBy || [];
          if (!currentRead.includes(currentUserId)) {
            const updated = { ...m, readBy: [...currentRead, currentUserId] };
            saveUserMessageToSupabase(updated);
            return updated;
          }
        }
        return m;
      })
    );
  };

  // Handler for Super User Monthly Arrest Override
  const handleUpdateMonthlyArrestOverride = (monthKey: string, ps: string, figure: number) => {
    if (isReadOnly) {
      alert('Permission Denied: Your account cannot modify arrest overrides.');
      return;
    }
    const key = `${monthKey}_${ps || 'ALL'}`;
    setMonthlyArrestOverrides((prev) => ({ ...prev, [key]: figure }));
    saveMonthlyArrestOverrideToSupabase(
      monthKey,
      ps,
      figure,
      currentUserAccount?.officerName || currentRole
    );
  };

  // Calculate filtered FIR cases
  const visibleCases = cases.filter((c) => {
    // Role-based PS restriction
    if (activePS && c.ps !== activePS) return false;

    // Filters
    if (filters.policeStations && filters.policeStations.length > 0 && !filters.policeStations.includes(c.ps)) {
      return false;
    }
    if (filters.designations && filters.designations.length > 0 && !filters.designations.includes(c.designation)) {
      return false;
    }
    if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(c.status)) {
      return false;
    }
    if (
      filters.deadlineCategories &&
      filters.deadlineCategories.length > 0 &&
      !filters.deadlineCategories.includes(c.deadlineDays)
    ) {
      return false;
    }
    if (filters.ioNames && filters.ioNames.length > 0 && !filters.ioNames.includes(c.ioName)) {
      return false;
    }

    // Punishment Term Filter
    if (filters.punishmentFilter && filters.punishmentFilter !== 'ALL') {
      if (c.punishmentTerm !== filters.punishmentFilter) return false;
    }

    // CCTNS Sync Filter
    if (filters.cctnsSyncFilter === 'CS_SYNC' && (!c.chargesheetUploadedCCTNS || c.caseDiaryUploadedCCTNS)) return false;
    if (filters.cctnsSyncFilter === 'CD_SYNC' && (!c.caseDiaryUploadedCCTNS || c.chargesheetUploadedCCTNS)) return false;
    if (filters.cctnsSyncFilter === 'BOTH_SYNC' && (!c.chargesheetUploadedCCTNS || !c.caseDiaryUploadedCCTNS)) return false;
    if (filters.cctnsSyncFilter === 'NONE_SYNC' && (c.chargesheetUploadedCCTNS || c.caseDiaryUploadedCCTNS)) return false;

    if (filters.chargesheetCCTNS === 'YES' && !c.chargesheetUploadedCCTNS) return false;
    if (filters.chargesheetCCTNS === 'NO' && c.chargesheetUploadedCCTNS) return false;

    if (filters.caseDiaryCCTNS === 'YES' && !c.caseDiaryUploadedCCTNS) return false;
    if (filters.caseDiaryCCTNS === 'NO' && c.caseDiaryUploadedCCTNS) return false;

    // Deadline Status filter
    const deadlineInfo = getDeadlineInfo(c);
    if (filters.deadlineStatus !== 'ALL' && deadlineInfo.code !== filters.deadlineStatus) return false;

    // Search Query - Full database search across all fields (FIR, SDPO Orders, CI Remarks, IO Progress Updates, Sections, Dates, Accused, etc.)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      if (!matchesCaseFullDatabaseSearch(c, filters.searchQuery)) {
        return false;
      }
    }

    // FIR Date range
    if (filters.startDate && c.firDate < filters.startDate) return false;
    if (filters.endDate && c.firDate > filters.endDate) return false;

    // Chargesheet Date range
    if (filters.chargesheetStartDate) {
      if (!c.chargesheetDate || c.chargesheetDate < filters.chargesheetStartDate) return false;
    }
    if (filters.chargesheetEndDate) {
      if (!c.chargesheetDate || c.chargesheetDate > filters.chargesheetEndDate) return false;
    }

    return true;
  });

  const handleApplyFilter = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Global overdue count
  const overdueCount = cases.filter((c) => {
    if (activePS && c.ps !== activePS) return false;
    return getDeadlineInfo(c).code === 'OVERDUE';
  }).length;

  const pendingSRCount = cases.filter((c) => {
    if (activePS && c.ps !== activePS) return false;
    return c.designation === 'SR' && c.status === 'Under Investigation';
  }).length;

  const pendingLandDisputesCount = landDisputes.filter((l) => {
    if (activePS && l.ps !== activePS) return false;
    return l.status === 'Pending';
  }).length;

  if (!currentUserAccount) {
    return (
      <LoginModal
        isOpen={true}
        accounts={userAccounts}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Count unread messages for current user
  const currentUserId = currentUserAccount?.userId || currentRole;
  const unreadMessagesCount = messages.filter(
    (m) =>
      (m.recipientUserId === 'ALL' ||
        m.recipientUserId === currentUserId ||
        m.recipientUserId === currentRole) &&
      !m.readBy?.includes(currentUserId)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Primary Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUserAccount={currentUserAccount}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewFIR={() => setIsNewFIRModalOpen(true)}
        onOpenNewLandDispute={() => setIsNewLandDisputeModalOpen(true)}
        overdueCount={overdueCount}
        pendingSRCount={pendingSRCount}
        pendingLandDisputesCount={pendingLandDisputesCount}
        unreadMessagesCount={unreadMessagesCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        isReadOnly={isReadOnly}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab 1: Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <DashboardStats
            cases={cases}
            landDisputes={landDisputes}
            currentRole={currentRole}
            onSelectFilterPS={(ps) => {
              setFilters((prev) => ({ ...prev, policeStations: ps === 'ALL' ? [] : [ps] }));
              setActiveTab('firs');
            }}
            onTabChange={setActiveTab}
            onApplyFilter={handleApplyFilter}
          />
        )}

        {/* Tab 2: FIR & Case Register */}
        {activeTab === 'firs' && (
          <div className="space-y-4">
            <FIRFilterBar
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              investigatingOfficers={ios}
              hidePSFilter={currentRole !== 'SDPO'}
              activePS={activePS}
              filteredCases={visibleCases}
            />

            <FIRTable
              cases={visibleCases}
              currentRole={currentRole}
              onViewCase={(c) => setViewingCase(c)}
              onEditCase={(c) => setEditingCase(c)}
              onDeleteCase={handleDeleteFIR}
              onDesignateCase={handleDesignateCase}
              isReadOnly={isReadOnly}
            />
          </div>
        )}

        {/* Tab 3: 60/90 Days Deadline Monitor */}
        {activeTab === 'deadlines' && (
          <DeadlineMonitor
            cases={activePS ? cases.filter((c) => c.ps === activePS) : cases}
            onViewCase={(c) => setViewingCase(c)}
            onEditCase={(c) => setEditingCase(c)}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Tab 4: Land Dispute Register */}
        {activeTab === 'land_disputes' && (
          <LandDisputeSection
            landDisputes={landDisputes}
            currentRole={currentRole}
            onAddLandDispute={handleAddLandDispute}
            onUpdateLandDisputeStatus={handleUpdateLandDisputeStatus}
            onDeleteLandDispute={handleDeleteLandDispute}
            isNewModalOpen={isNewLandDisputeModalOpen}
            setIsNewModalOpen={setIsNewLandDisputeModalOpen}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Tab 5: UD & NON-SR Desk */}
        {activeTab === 'ud_cases' && (
          <UDCaseSection
            udCases={udCases}
            nonSrCases={cases.filter((c) => c.designation === 'NON_SR')}
            currentRole={currentRole}
            onAddUDCase={handleAddUDCase}
            onUpdateUDCase={handleUpdateUDCase}
            onDeleteUDCase={handleDeleteUDCase}
            onViewFIR={(c) => setViewingCase(c)}
            onEditFIR={(c) => setEditingCase(c)}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Supervision Status Tab (Super User / SDPO Only) */}
        {activeTab === 'supervision' && currentRole === 'SDPO' && (
          <SupervisionStatusSection
            cases={cases}
            onEditCase={(c) => setEditingCase(c)}
            onViewCase={(c) => setViewingCase(c)}
            onDeleteSupervisionNote={handleDeleteSupervisionNote}
            onDeleteCase={handleDeleteFIR}
            currentRole={currentRole}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Tab 6: IO List & Allocation */}
        {activeTab === 'ios' && (
          <IOManagement
            ios={ios}
            cases={cases}
            leaveLedger={leaveLedger}
            dailyReports={dailyReports}
            onAddIO={handleAddIO}
            onUpdateIO={handleUpdateIO}
            onDeleteIO={handleDeleteIO}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onAddLeaveEntry={handleAddLeaveEntry}
            onDeleteLeaveEntry={handleDeleteLeaveEntry}
            currentRole={currentRole}
            onSelectIOCasesFilter={(ioName) => {
              setFilters((prev) => ({ ...prev, ioNames: [ioName] }));
              setActiveTab('firs');
            }}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Tab 7: Daily PS Crime Reports */}
        {activeTab === 'daily_reports' && (
          <DailyCrimeReportSection
            reports={dailyReports}
            cases={cases}
            ios={ios}
            userAccounts={userAccounts}
            currentUserAccount={currentUserAccount}
            currentRole={currentRole}
            onAddReport={handleAddDailyReport}
            onDeleteReport={handleDeleteDailyReport}
            isReadOnly={isReadOnly}
            canSubmitReport={!isViewer}
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onMarkMessageAsRead={handleMarkMessageAsRead}
            monthlyArrestOverrides={monthlyArrestOverrides}
            onUpdateMonthlyArrestOverride={handleUpdateMonthlyArrestOverride}
            leaveLedger={leaveLedger}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onAddLeaveEntry={handleAddLeaveEntry}
            onDeleteLeaveEntry={handleDeleteLeaveEntry}
          />
        )}

        {/* Tab 8: Embedded AI Assistant */}
        {activeTab === 'ai_assistant' && (
          <AIChatbot
            cases={cases}
            landDisputes={landDisputes}
            udCases={udCases}
            ios={ios}
            dailyReports={dailyReports}
            currentRole={currentRole}
            activePS={activePS}
            onViewCase={(c) => setViewingCase(c)}
            isEmbeddedTab={true}
          />
        )}

      </main>

      {/* Floating AI Chatbot Widget (active on other tabs) */}
      {activeTab !== 'ai_assistant' && (
        <AIChatbot
          cases={cases}
          landDisputes={landDisputes}
          udCases={udCases}
          ios={ios}
          dailyReports={dailyReports}
          currentRole={currentRole}
          activePS={activePS}
          onViewCase={(c) => setViewingCase(c)}
          isEmbeddedTab={false}
        />
      )}

      {/* Modals */}
      <NewFIREntryModal
        isOpen={isNewFIRModalOpen}
        onClose={() => setIsNewFIRModalOpen(false)}
        onSubmit={handleCreateFIR}
        currentRole={currentRole}
        investigatingOfficers={ios}
      />

      <EditFIRModal
        caseItem={editingCase}
        isOpen={Boolean(editingCase)}
        onClose={() => setEditingCase(null)}
        onUpdate={handleUpdateFIR}
        onDeleteSupervisionNote={handleDeleteSupervisionNote}
        onDeleteCase={handleDeleteFIR}
        currentRole={currentRole}
        investigatingOfficers={ios}
        isSupervisionMode={activeTab === 'supervision'}
        isReadOnly={isReadOnly}
      />

      <ViewCaseModal
        caseItem={viewingCase}
        isOpen={Boolean(viewingCase)}
        onClose={() => setViewingCase(null)}
        onEdit={(c) => setEditingCase(c)}
        onDeleteCase={handleDeleteFIR}
        isReadOnly={isReadOnly}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        accounts={userAccounts}
        currentUserAccount={currentUserAccount}
        onUpdateAccount={handleUpdateUserAccount}
        onAddAccount={handleAddUserAccount}
        onDeleteAccount={handleDeleteUserAccount}
        onResetToDefaults={handleResetUserAccountsToDefaults}
      />

      <LoginModal
        isOpen={!currentUserAccount}
        accounts={userAccounts}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">
            Official Crime Supervision & CCTNS Progress Portal — SDPO Tarapur Subdivision (Bihar Police)
          </p>
          <p className="text-slate-500 text-[11px]">
            Tarapur PS • Asarganj PS • Sangrampur PS • Harpur PS • Munger Police District
          </p>
        </div>
      </footer>

    </div>
  );
}
