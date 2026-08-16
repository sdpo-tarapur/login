import React, { useState, useEffect } from 'react';
import {
  UserRole,
  UserAccount,
  FIRCase,
  LandDispute,
  UDCase,
  InvestigatingOfficer,
  DailyCrimeReport,
  FilterOptions,
  CaseDesignation,
  IOStatus,
} from './types';
import {
  INITIAL_USER_ACCOUNTS,
  INITIAL_FIRS,
  INITIAL_LAND_DISPUTES,
  INITIAL_UD_CASES,
  INITIAL_IOS,
  INITIAL_CRIME_REPORTS,
} from './data/mockData';
import { getDeadlineInfo, getPSFromRole } from './utils/helpers';
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
  fetchUDCasesFromSupabase,
  saveUDCaseToSupabase,
  fetchIOsFromSupabase,
  saveIOToSupabase,
  fetchDailyReportsFromSupabase,
  saveDailyReportToSupabase,
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
  deadlineCategories: [],
  chargesheetStartDate: '',
  chargesheetEndDate: '',
};

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sdpo_theme');
      return (saved as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
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
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Application Data States
  const [cases, setCases] = useState<FIRCase[]>(() => {
    try {
      const saved = localStorage.getItem('sdpo_firs');
      return saved ? JSON.parse(saved) : INITIAL_FIRS;
    } catch {
      return INITIAL_FIRS;
    }
  });

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

  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Modals state
  const [isNewFIRModalOpen, setIsNewFIRModalOpen] = useState(false);
  const [isNewLandDisputeModalOpen, setIsNewLandDisputeModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<FIRCase | null>(null);
  const [viewingCase, setViewingCase] = useState<FIRCase | null>(null);

  // LocalStorage Persistence Sync
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

  // Supabase Initial Sync on Mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchUserAccountsFromSupabase().then((accounts) => {
        if (accounts && accounts.length > 0) setUserAccounts(accounts);
      });
      fetchFIRCasesFromSupabase().then((firList) => {
        if (firList && firList.length > 0) setCases(firList);
      });
      fetchLandDisputesFromSupabase().then((landList) => {
        if (landList && landList.length > 0) setLandDisputes(landList);
      });
      fetchUDCasesFromSupabase().then((udList) => {
        if (udList && udList.length > 0) setUdCases(udList);
      });
      fetchIOsFromSupabase().then((ioList) => {
        if (ioList && ioList.length > 0) setIos(ioList);
      });
      fetchDailyReportsFromSupabase().then((reports) => {
        if (reports && reports.length > 0) setDailyReports(reports);
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

  const activePS = getPSFromRole(currentRole);
  const isReadOnly = currentUserAccount?.permissionLevel === 'VIEWER';

  // Handlers for FIRs
  const handleCreateFIR = (newCaseData: Omit<FIRCase, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Read-Only mode.');
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
      alert('Permission Denied: Read-Only mode.');
      return;
    }
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    saveFIRCaseToSupabase(updatedCase);
  };

  const handleDesignateCase = (caseId: string, designation: CaseDesignation) => {
    if (isReadOnly) return;
    if (currentRole !== 'SDPO') {
      alert('Only SDPO has authority to classify cases as SR or NON-SR.');
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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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

  // Handlers for UD Cases
  const handleAddUDCase = (newUDData: Omit<UDCase, 'id'>) => {
    if (isReadOnly) return;
    const newUD: UDCase = {
      ...newUDData,
      id: `ud-${Date.now()}`,
    };
    setUdCases((prev) => [newUD, ...prev]);
    saveUDCaseToSupabase(newUD);
  };

  const handleUpdateUDCase = (updatedUD: UDCase) => {
    if (isReadOnly) return;
    setUdCases((prev) => prev.map((u) => (u.id === updatedUD.id ? updatedUD : u)));
    saveUDCaseToSupabase(updatedUD);
  };

  // Handlers for IOs
  const handleAddIO = (newIOData: Omit<InvestigatingOfficer, 'id'>) => {
    if (isReadOnly) {
      alert('Permission Denied: Read-Only access.');
      return;
    }
    const newIO: InvestigatingOfficer = {
      ...newIOData,
      id: `io-${Date.now()}`,
      status: newIOData.status || 'Active',
    };
    setIos((prev) => [...prev, newIO]);
    saveIOToSupabase(newIO);
  };

  const handleUpdateIOStatus = (ioId: string, status: IOStatus, phone?: string) => {
    if (isReadOnly) return;
    setIos((prev) =>
      prev.map((io) => {
        if (io.id === ioId) {
          const updated = { ...io, status, phone: phone || io.phone };
          saveIOToSupabase(updated);
          return updated;
        }
        return io;
      })
    );
  };

  // Handlers for Daily Crime Reports
  const handleAddDailyReport = (newReportData: Omit<DailyCrimeReport, 'id'>) => {
    if (isReadOnly) return;
    const newReport: DailyCrimeReport = {
      ...newReportData,
      id: `dcr-${Date.now()}`,
    };
    setDailyReports((prev) => [newReport, ...prev]);
    saveDailyReportToSupabase(newReport);
  };

  // Filtered FIR cases calculation
  const visibleCases = cases.filter((c) => {
    if (activePS && c.ps !== activePS) return false;

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

    if (filters.cctnsSyncFilter === 'CS_SYNC' && (!c.chargesheetUploadedCCTNS || c.caseDiaryUploadedCCTNS)) return false;
    if (filters.cctnsSyncFilter === 'CD_SYNC' && (!c.caseDiaryUploadedCCTNS || c.chargesheetUploadedCCTNS)) return false;
    if (filters.cctnsSyncFilter === 'BOTH_SYNC' && (!c.chargesheetUploadedCCTNS || !c.caseDiaryUploadedCCTNS)) return false;
    if (filters.cctnsSyncFilter === 'NONE_SYNC' && (c.chargesheetUploadedCCTNS || c.caseDiaryUploadedCCTNS)) return false;

    if (filters.chargesheetCCTNS === 'YES' && !c.chargesheetUploadedCCTNS) return false;
    if (filters.chargesheetCCTNS === 'NO' && c.chargesheetUploadedCCTNS) return false;

    if (filters.caseDiaryCCTNS === 'YES' && !c.caseDiaryUploadedCCTNS) return false;
    if (filters.caseDiaryCCTNS === 'NO' && c.caseDiaryUploadedCCTNS) return false;

    const deadlineInfo = getDeadlineInfo(c);
    if (filters.deadlineStatus !== 'ALL' && deadlineInfo.code !== filters.deadlineStatus) return false;

    // Multi-Keyword Robust Search across all FIR, IO, and Supervision fields
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const keywords = filters.searchQuery
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const searchableCorpus = [
        c.firNumber,
        c.ps,
        c.sections,
        c.complainantName,
        c.complainantPhone || '',
        c.placeOfOccurrence,
        c.ioName,
        c.designation,
        c.status,
        c.chargesheetNumber || '',
        c.chargesheetDate || '',
        c.lastCaseDiaryNo || '',
        c.sdpoSupervisionNote || '',
        c.ciSupervisionNote || '',
        c.psProgressRemarks || '',
        ...(c.prDates || []),
        ...(c.caseReviewDates || []),
      ]
        .join(' ')
        .toLowerCase();

      const matchesAllKeywords = keywords.every((kw) => searchableCorpus.includes(kw));
      if (!matchesAllKeywords) return false;
    }

    // FIR Registration Date Range Filter
    if (filters.startDate && c.firDate < filters.startDate) return false;
    if (filters.endDate && c.firDate > filters.endDate) return false;

    // Chargesheet Submission Date Range Filter
    if (filters.chargesheetStartDate) {
      if (!c.chargesheetDate || c.chargesheetDate < filters.chargesheetStartDate) {
        return false;
      }
    }
    if (filters.chargesheetEndDate) {
      if (!c.chargesheetDate || c.chargesheetDate > filters.chargesheetEndDate) {
        return false;
      }
    }

    return true;
  });

  const handleApplyFilter = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

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
            currentRole={currentRole}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Tab 6: IO List & Allocation */}
        {activeTab === 'ios' && (
          <IOManagement
            ios={ios}
            cases={cases}
            onAddIO={handleAddIO}
            onUpdateIOStatus={handleUpdateIOStatus}
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
            currentRole={currentRole}
            onAddReport={handleAddDailyReport}
            isReadOnly={isReadOnly}
          />
        )}
      </main>

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
            Official Crime Supervision &amp; CCTNS Progress Portal — SDPO Tarapur Subdivision (Bihar Police)
          </p>
          <p className="text-slate-500 text-[11px]">
            Tarapur PS • Asarganj PS • Sangrampur PS • Harpur PS • Munger Police District
          </p>
        </div>
      </footer>
    </div>
  );
}
