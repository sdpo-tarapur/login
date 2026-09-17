import React, { useState, useMemo } from 'react';
import {
  InvestigatingOfficer,
  FIRCase,
  PoliceStationName,
  UserRole,
  LeaveLedgerEntry,
  DailyCrimeReport,
} from '../types';
import {
  UserCheck,
  Plus,
  Phone,
  User,
  X,
  FileSpreadsheet,
  Printer,
  Shield,
  FolderOpen,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  RotateCcw,
  Plane,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  FileText,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { getPSFromRole, getDeadlineInfo, formatReadableDate } from '../utils/helpers';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface IOManagementProps {
  ios: InvestigatingOfficer[];
  cases: FIRCase[];
  leaveLedger?: LeaveLedgerEntry[];
  dailyReports?: DailyCrimeReport[];
  onAddIO: (newIO: Omit<InvestigatingOfficer, 'id'>) => void;
  onUpdateIO?: (updatedIO: InvestigatingOfficer) => void;
  onDeleteIO?: (ioId: string) => void;
  currentRole: UserRole;
  onSelectIOCasesFilter?: (ioName: string) => void;
  isReadOnly?: boolean;
}

export const IOManagement: React.FC<IOManagementProps> = ({
  ios,
  cases,
  leaveLedger = [],
  dailyReports = [],
  onAddIO,
  onUpdateIO,
  onDeleteIO,
  currentRole,
  onSelectIOCasesFilter,
  isReadOnly = false,
}) => {
  const activePS = getPSFromRole(currentRole);

  // Filters state
  const [psFilter, setPsFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRANSFERRED'>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [caseTypeFilter, setCaseTypeFilter] = useState<'ALL' | 'HAS_SR' | 'HAS_NSR' | 'SR_ONLY' | 'NSR_ONLY' | 'NO_CASES'>('ALL');
  const [deadlineLimitFilter, setDeadlineLimitFilter] = useState<'ALL' | 'HAS_60' | 'HAS_90' | 'OVERDUE'>('ALL');
  const [punishmentTermFilter, setPunishmentTermFilter] = useState<'ALL' | '7_YEARS_OR_MORE' | 'LESS_THAN_7_YEARS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIO, setSelectedIO] = useState<InvestigatingOfficer | null>(null);
  const [profileTab, setProfileTab] = useState<'cases' | 'leave'>('cases');
  const [leaveSelectedYear, setLeaveSelectedYear] = useState<string>(() => new Date().getFullYear().toString());

  // Edit status / transfer state inside profile modal
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editStatusValue, setEditStatusValue] = useState<'ACTIVE' | 'TRANSFERRED'>('ACTIVE');
  const [editTransferDestination, setEditTransferDestination] = useState('');
  const [editTransferDate, setEditTransferDate] = useState('');

  // Add IO Form state
  const [name, setName] = useState('');
  const [rank, setRank] = useState<InvestigatingOfficer['rank']>('Sub-Inspector (SI)');
  const [ps, setPs] = useState<PoliceStationName | 'Subdivision HQ'>(activePS || 'Tarapur');
  const [phone, setPhone] = useState('');

  // Reset Filters
  const handleResetFilters = () => {
    setPsFilter('ALL');
    setStatusFilter('ALL');
    setRankFilter('ALL');
    setCaseTypeFilter('ALL');
    setDeadlineLimitFilter('ALL');
    setPunishmentTermFilter('ALL');
    setSearchQuery('');
  };

  // Build unified leaves list from leaveLedger + dailyReports
  const allUnifiedLeaves = useMemo(() => {
    const list: LeaveLedgerEntry[] = [
      ...leaveLedger,
      ...dailyReports.flatMap((r) => r.leaveLedgerEntries || []),
    ];
    // De-duplicate by ID
    const map = new Map<string, LeaveLedgerEntry>();
    list.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [leaveLedger, dailyReports]);

  // Helper to normalize names for leave matching
  const matchOfficerName = (ioName: string, leaveOfficerName: string) => {
    if (!ioName || !leaveOfficerName) return false;
    const cleanA = ioName
      .toLowerCase()
      .replace(/\b(si|asi|insp|inspector|sub-inspector|sho|ptc|sdpo|ci)\b/gi, '')
      .replace(/[^a-z0-9]/gi, '')
      .trim();
    const cleanB = leaveOfficerName
      .toLowerCase()
      .replace(/\b(si|asi|insp|inspector|sub-inspector|sho|ptc|sdpo|ci)\b/gi, '')
      .replace(/[^a-z0-9]/gi, '')
      .trim();

    return cleanA.includes(cleanB) || cleanB.includes(cleanA);
  };

  // Check if an IO is on leave today
  const isIoCurrentlyOnLeave = (io: InvestigatingOfficer) => {
    const today = new Date().toISOString().split('T')[0];
    return allUnifiedLeaves.some((leave) => {
      if (!matchOfficerName(io.name, leave.officerName)) return false;
      if (leave.status === 'ARRIVED') return false;
      if (leave.status === 'ON_LEAVE' || leave.status === 'OVERDUE') return true;
      if (leave.departureDate <= today && (!leave.arrivalDate || leave.arrivalDate >= today)) return true;
      return false;
    });
  };

  // Get total leave days in current year for an IO
  const getIoCurrentYearLeaveDays = (io: InvestigatingOfficer, yearStr = new Date().getFullYear().toString()) => {
    const officerLeaves = allUnifiedLeaves.filter((leave) => {
      if (!matchOfficerName(io.name, leave.officerName)) return false;
      const leaveYear = (leave.departureDate || '').slice(0, 4);
      return leaveYear === yearStr;
    });
    return officerLeaves.reduce((acc, l) => acc + (Number(l.daysOnLeave) || 0), 0);
  };

  // Filtered IOs
  const filteredIos = useMemo(() => {
    return ios.filter((io) => {
      const ioStatus = io.status || 'ACTIVE';

      // 1. PS Filter (including Subdivision HQ)
      if (psFilter !== 'ALL' && io.ps !== psFilter) return false;

      // 2. Status Filter (Active / Transferred)
      if (statusFilter !== 'ALL' && ioStatus !== statusFilter) return false;

      // 3. Rank Filter
      if (rankFilter !== 'ALL' && io.rank !== rankFilter) return false;

      // IO's assigned cases
      const ioCases = cases.filter(
        (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
      );
      const srCount = ioCases.filter((c) => c.designation === 'SR').length;
      const nsrCount = ioCases.filter((c) => c.designation === 'NON_SR').length;

      // 4. Case Type Filter (SR / NSR)
      if (caseTypeFilter === 'HAS_SR' && srCount === 0) return false;
      if (caseTypeFilter === 'HAS_NSR' && nsrCount === 0) return false;
      if (caseTypeFilter === 'SR_ONLY' && (srCount === 0 || nsrCount > 0)) return false;
      if (caseTypeFilter === 'NSR_ONLY' && (nsrCount === 0 || srCount > 0)) return false;
      if (caseTypeFilter === 'NO_CASES' && ioCases.length > 0) return false;

      // 5. 60 / 90 Statutory Deadline Filter
      if (deadlineLimitFilter === 'HAS_60' && !ioCases.some((c) => c.deadlineDays === 60)) return false;
      if (deadlineLimitFilter === 'HAS_90' && !ioCases.some((c) => c.deadlineDays === 90)) return false;
      if (deadlineLimitFilter === 'OVERDUE') {
        const hasOverdue = ioCases.some((c) => getDeadlineInfo(c).code === 'OVERDUE');
        if (!hasOverdue) return false;
      }

      // 6. 7 Years More or Less Filter
      if (punishmentTermFilter === '7_YEARS_OR_MORE' && !ioCases.some((c) => c.punishmentTerm === '7_years_or_more')) {
        return false;
      }
      if (punishmentTermFilter === 'LESS_THAN_7_YEARS' && !ioCases.some((c) => c.punishmentTerm === 'less_than_7_years')) {
        return false;
      }

      // 7. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = io.name.toLowerCase().includes(q);
        const matchesPhone = (io.phone || '').toLowerCase().includes(q);
        const matchesPs = io.ps.toLowerCase().includes(q);
        const matchesRank = io.rank.toLowerCase().includes(q);
        const matchesTransferredTo = (io.transferredTo || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesPs && !matchesRank && !matchesTransferredTo) {
          return false;
        }
      }

      return true;
    });
  }, [
    ios,
    cases,
    psFilter,
    statusFilter,
    rankFilter,
    caseTypeFilter,
    deadlineLimitFilter,
    punishmentTermFilter,
    searchQuery,
  ]);

  // Handle Add IO
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddIO({
      name: name.trim(),
      rank,
      ps,
      phone: phone.trim() || undefined,
      status: 'ACTIVE',
    });

    setName('');
    setPhone('');
    setIsAddModalOpen(false);
  };

  // Open profile modal
  const handleOpenProfile = (io: InvestigatingOfficer) => {
    setSelectedIO(io);
    setProfileTab('cases');
    setIsEditingStatus(false);
    setEditStatusValue(io.status || 'ACTIVE');
    setEditTransferDestination(io.transferredTo || '');
    setEditTransferDate(io.transferDate || new Date().toISOString().split('T')[0]);
  };

  // Save updated status for an IO
  const handleSaveStatusChange = () => {
    if (!selectedIO || !onUpdateIO) return;
    const updated: InvestigatingOfficer = {
      ...selectedIO,
      status: editStatusValue,
      transferredTo: editStatusValue === 'TRANSFERRED' ? editTransferDestination.trim() : undefined,
      transferDate: editStatusValue === 'TRANSFERRED' ? editTransferDate : undefined,
    };
    onUpdateIO(updated);
    setSelectedIO(updated);
    setIsEditingStatus(false);
  };

  // Leaves for Selected IO
  const selectedIoLeaves = useMemo(() => {
    if (!selectedIO) return [];
    return allUnifiedLeaves.filter((leave) => {
      if (!matchOfficerName(selectedIO.name, leave.officerName)) return false;
      if (leaveSelectedYear !== 'ALL') {
        const leaveYear = (leave.departureDate || '').slice(0, 4);
        if (leaveYear !== leaveSelectedYear) return false;
      }
      return true;
    });
  }, [selectedIO, allUnifiedLeaves, leaveSelectedYear]);

  // Leave stats for Selected IO
  const selectedIoLeaveStats = useMemo(() => {
    let totalDays = 0;
    let clDays = 0;
    let cplDays = 0;
    let otherDays = 0;

    selectedIoLeaves.forEach((l) => {
      const d = Number(l.daysOnLeave) || 0;
      totalDays += d;
      const type = (l.leaveType || '').toUpperCase();
      if (type.includes('CPL') || type.includes('COMPENSATORY')) cplDays += d;
      else if (type.includes('CL') || type.includes('CASUAL')) clDays += d;
      else otherDays += d;
    });

    return { totalDays, clDays, cplDays, otherDays, count: selectedIoLeaves.length };
  }, [selectedIoLeaves]);

  // Export handlers
  const handleExportExcel = () => {
    const headers = [
      'Officer Name',
      'Rank',
      'Police Station / Unit',
      'Status',
      'Transferred To',
      'Transfer Date',
      'Phone Number',
      'SR Cases',
      'Non-SR Cases',
      '60-Day Cases',
      '90-Day Cases',
      'Pending Cases',
      'Total Assigned Cases',
      `Leave Days (${new Date().getFullYear()})`,
    ];
    const rows = filteredIos.map((io) => {
      const ioCases = cases.filter(
        (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
      );
      const pendingCount = ioCases.filter((c) => c.status === 'Under Investigation').length;
      const srCount = ioCases.filter((c) => c.designation === 'SR').length;
      const nsrCount = ioCases.filter((c) => c.designation === 'NON_SR').length;
      const d60Count = ioCases.filter((c) => c.deadlineDays === 60).length;
      const d90Count = ioCases.filter((c) => c.deadlineDays === 90).length;
      const leaveDays = getIoCurrentYearLeaveDays(io);

      return [
        io.name,
        io.rank,
        io.ps,
        io.status || 'ACTIVE',
        io.transferredTo || 'N/A',
        io.transferDate || 'N/A',
        io.phone || 'N/A',
        srCount,
        nsrCount,
        d60Count,
        d90Count,
        pendingCount,
        ioCases.length,
        leaveDays,
      ];
    });

    exportToExcel('IO_Roster_Management_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Officer Name & Rank', 'Station', 'Status', 'Pending', 'Total', 'Leave (Current Yr)'];
    const rows = filteredIos.map((io) => {
      const ioCases = cases.filter(
        (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
      );
      const pendingCount = ioCases.filter((c) => c.status === 'Under Investigation').length;
      const leaveDays = getIoCurrentYearLeaveDays(io);
      const statusLabel = io.status === 'TRANSFERRED' ? 'Transferred' : 'Active';

      return [
        `${io.name} (${io.rank})`,
        io.ps,
        statusLabel,
        `${pendingCount} Pending`,
        `${ioCases.length} Assigned`,
        `${leaveDays} Days`,
      ];
    });

    exportToPDF(
      'Investigating Officers (IO) Allocation Roster',
      `Subdivision Roster Report (${filteredIos.length} Officers matching filters)`,
      headers,
      rows,
      [{ label: 'Total Officers Displayed', value: filteredIos.length }]
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-amber-400 rounded-lg border border-slate-700 font-bold shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Investigating Officers (IO) Management Roster
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider">
                {filteredIos.length} / {ios.length} Officers
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive roster tracking PS postings, Active/Transferred status, case workload, statutory deadlines, and annual leave availed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New IO</span>
            </button>
          )}
        </div>
      </div>

      {/* Granular Filters Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>IO Management Filters & Database Search</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {/* 1. PS Filter (Including Subdivision HQ) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Police Station / HQ
            </label>
            <select
              value={psFilter}
              onChange={(e) => setPsFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Stations & HQ</option>
              <option value="Subdivision HQ">Subdivision HQ</option>
              <option value="Tarapur">Tarapur PS</option>
              <option value="Asarganj">Asarganj PS</option>
              <option value="Sangrampur">Sangrampur PS</option>
              <option value="Harpur">Harpur PS</option>
            </select>
          </div>

          {/* 2. Status Filter: Active & Transferred */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Officer Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status (Active & Transferred)</option>
              <option value="ACTIVE">🟢 Active (Currently Posted)</option>
              <option value="TRANSFERRED">🟠 Transferred</option>
            </select>
          </div>

          {/* 3. Rank Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Police Rank
            </label>
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Ranks</option>
              <option value="SDPO">SDPO</option>
              <option value="Circle Inspector">Circle Inspector (CI)</option>
              <option value="Inspector">Inspector</option>
              <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
              <option value="Asst. Sub-Inspector (ASI)">Asst. Sub-Inspector (ASI)</option>
              <option value="PTC">PTC</option>
            </select>
          </div>

          {/* 4. Case Type Filter: SR / NSR */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Case Type (SR / NSR)
            </label>
            <select
              value={caseTypeFilter}
              onChange={(e) => setCaseTypeFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Cases (SR & Non-SR)</option>
              <option value="HAS_SR">Has SR Cases (≥ 1)</option>
              <option value="HAS_NSR">Has Non-SR Cases (≥ 1)</option>
              <option value="SR_ONLY">SR Cases Only</option>
              <option value="NSR_ONLY">Non-SR Cases Only</option>
              <option value="NO_CASES">No Active Assigned Cases</option>
            </select>
          </div>

          {/* 5. 60 / 90 Days Limit Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Statutory Limit (60/90)
            </label>
            <select
              value={deadlineLimitFilter}
              onChange={(e) => setDeadlineLimitFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Limits (60 & 90 Days)</option>
              <option value="HAS_60">With 60-Day Cases</option>
              <option value="HAS_90">With 90-Day Cases</option>
              <option value="OVERDUE">⚠️ Has Overdue Cases</option>
            </select>
          </div>

          {/* 6. Punishment Term Filter: 7yrs more or less */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Term (7 Yrs More / Less)
            </label>
            <select
              value={punishmentTermFilter}
              onChange={(e) => setPunishmentTermFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Terms</option>
              <option value="7_YEARS_OR_MORE">≥ 7 Years Term Cases</option>
              <option value="LESS_THAN_7_YEARS">&lt; 7 Years Term Cases</option>
            </select>
          </div>

          {/* 7. Search Input */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Search Officer / Details
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Phone, PS..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* IO Cards Grid */}
      {filteredIos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
          <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
            No Investigating Officers Match Selected Filters
          </h3>
          <p className="text-xs text-slate-500">
            Try adjusting your station, rank, status, case type, or term filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold transition hover:bg-blue-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIos.map((io) => {
            const ioCases = cases.filter(
              (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
            );
            const pendingIoCases = ioCases.filter((c) => c.status === 'Under Investigation');
            const srCount = ioCases.filter((c) => c.designation === 'SR').length;
            const nsrCount = ioCases.filter((c) => c.designation === 'NON_SR').length;
            const term7Plus = ioCases.filter((c) => c.punishmentTerm === '7_years_or_more').length;
            const term7Less = ioCases.filter((c) => c.punishmentTerm === 'less_than_7_years').length;
            const d60Count = ioCases.filter((c) => c.deadlineDays === 60).length;
            const d90Count = ioCases.filter((c) => c.deadlineDays === 90).length;
            const overdueCases = ioCases.filter((c) => getDeadlineInfo(c).code === 'OVERDUE');

            const isTransferred = io.status === 'TRANSFERRED';
            const onLeaveToday = isIoCurrentlyOnLeave(io);
            const currentYearLeaveDays = getIoCurrentYearLeaveDays(io);

            return (
              <div
                key={io.id}
                onClick={() => handleOpenProfile(io)}
                className={`bg-white dark:bg-slate-900 rounded-xl p-4 border transition cursor-pointer group space-y-3 relative overflow-hidden shadow-xs hover:shadow-md ${
                  isTransferred
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80'
                }`}
              >
                {/* Top Officer Info & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg font-bold border transition ${
                        isTransferred
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition flex items-center gap-1.5">
                        <span>{io.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        {io.rank}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {/* Status Pill */}
                    {isTransferred ? (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5" />
                        <span>Transferred</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active</span>
                      </span>
                    )}

                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {io.ps}
                    </span>
                  </div>
                </div>

                {/* Transfer Info if Transferred */}
                {isTransferred && (
                  <div className="p-2 bg-amber-100/60 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                    <span className="font-bold">Transferred To:</span> {io.transferredTo || 'Other Unit / PS'}
                    {io.transferDate && <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">Date: {formatReadableDate(io.transferDate)}</span>}
                  </div>
                )}

                {/* Contact Phone */}
                {io.phone && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{io.phone}</span>
                  </div>
                )}

                {/* Case Load Metrics Pills */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                        Active Pending
                      </span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                        {pendingIoCases.length} Cases
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                        Total Assigned
                      </span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                        {ioCases.length} Cases
                      </span>
                    </div>
                  </div>

                  {/* Badges Breakdown: SR / NSR, 60 / 90, 7 Yrs */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      SR: {srCount}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Non-SR: {nsrCount}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      60d: {d60Count}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      90d: {d90Count}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      ≥7yr: {term7Plus}
                    </span>
                    {overdueCases.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black animate-pulse">
                        ⚠️ {overdueCases.length} Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Annual Leave Summary Strip */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      Leave in {new Date().getFullYear()}:
                    </span>
                    <strong className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                      {currentYearLeaveDays} Days
                    </strong>
                  </div>

                  {onLeaveToday ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-800">
                      On Leave Today
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ On Duty
                    </span>
                  )}
                </div>

                {/* Action hint & delete button */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Click to view cases & leave history →
                  </span>

                  {!isReadOnly && onDeleteIO && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to remove ${io.name} from the roster?`)) {
                          onDeleteIO(io.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition cursor-pointer"
                      title="Remove Officer from Roster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IO Profile Modal (Assigned Cases + Leave Availed in that Year) */}
      {selectedIO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 text-blue-500 rounded-xl border border-blue-500/30 font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                      {selectedIO.name}
                    </h3>
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/40">
                      {selectedIO.rank}
                    </span>
                    {selectedIO.status === 'TRANSFERRED' ? (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                        Transferred (to {selectedIO.transferredTo || 'Other Unit'})
                      </span>
                    ) : (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                        Active In Service
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Station / Unit: <strong className="text-slate-800 dark:text-slate-200">{selectedIO.ps}</strong>
                    {selectedIO.phone && ` • Phone: ${selectedIO.phone}`}
                    {selectedIO.transferDate && ` • Transferred on: ${formatReadableDate(selectedIO.transferDate)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isReadOnly && onUpdateIO && (
                  <button
                    onClick={() => setIsEditingStatus(!isEditingStatus)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    {isEditingStatus ? 'Cancel Status Edit' : 'Edit Status / Transfer'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedIO(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inline Status / Transfer Editor */}
            {isEditingStatus && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Update Officer Status & Transfer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editStatusValue}
                      onChange={(e) => setEditStatusValue(e.target.value as any)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    >
                      <option value="ACTIVE">ACTIVE (Currently Posted)</option>
                      <option value="TRANSFERRED">TRANSFERRED (Relieved)</option>
                    </select>
                  </div>

                  {editStatusValue === 'TRANSFERRED' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Transferred Destination / Unit
                        </label>
                        <input
                          type="text"
                          value={editTransferDestination}
                          onChange={(e) => setEditTransferDestination(e.target.value)}
                          placeholder="e.g. Jamalpur PS / Patna HQ"
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Transfer / Relieving Date
                        </label>
                        <input
                          type="date"
                          value={editTransferDate}
                          onChange={(e) => setEditTransferDate(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingStatus(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveStatusChange}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-sm"
                  >
                    Save Status Change
                  </button>
                </div>
              </div>
            )}

            {/* Profile Navigation Tabs: Assigned Cases vs Leave Availed */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setProfileTab('cases')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs transition cursor-pointer ${
                  profileTab === 'cases'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>
                  Assigned FIR Cases (
                  {
                    cases.filter(
                      (c) =>
                        c.ioName &&
                        (c.ioName.includes(selectedIO.name) || selectedIO.name.includes(c.ioName))
                    ).length
                  }
                  )
                </span>
              </button>

              <button
                onClick={() => setProfileTab('leave')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs transition cursor-pointer ${
                  profileTab === 'leave'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>
                  Leave Availed in {leaveSelectedYear === 'ALL' ? 'All Years' : leaveSelectedYear} (
                  {selectedIoLeaveStats.totalDays} Days)
                </span>
              </button>
            </div>

            {/* Tab 1 Content: Assigned Cases */}
            {profileTab === 'cases' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(() => {
                  const assignedCases = cases.filter(
                    (c) =>
                      c.ioName &&
                      (c.ioName.includes(selectedIO.name) || selectedIO.name.includes(c.ioName))
                  );

                  if (assignedCases.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-bold text-xs">No active cases assigned to this officer.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs text-slate-500 font-semibold">
                          Showing {assignedCases.length} assigned case records
                        </span>

                        {onSelectIOCasesFilter && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectIOCasesFilter(selectedIO.name);
                              setSelectedIO(null);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open in Main FIR Dashboard</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {assignedCases.map((c) => {
                        const deadlineInfo = getDeadlineInfo(c);

                        return (
                          <div
                            key={c.id}
                            className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 dark:text-white text-sm">
                                  FIR No. {c.firNumber}
                                </span>
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded">
                                  {c.ps} PS
                                </span>
                                <span
                                  className={`font-black text-[10px] px-2 py-0.5 rounded ${
                                    c.designation === 'SR'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {c.designation === 'SR' ? 'Special Report (SR)' : 'Non-SR'}
                                </span>
                              </div>

                              <span
                                className={`font-black text-[10px] px-2 py-0.5 rounded border ${deadlineInfo.badgeBg}`}
                              >
                                {deadlineInfo.label}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                              <div>
                                <span className="text-slate-400 block font-bold text-[10px]">SECTIONS</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.sections}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold text-[10px]">COMPLAINANT</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.complainantName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold text-[10px]">TERM & STATUS</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {c.punishmentTerm === '7_years_or_more' ? '≥ 7 Years' : '< 7 Years'} • {c.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tab 2 Content: Leave Availed Record in that Year */}
            {profileTab === 'leave' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Year Selection Row & Summary */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Leave Year:
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {[
                        new Date().getFullYear().toString(),
                        (new Date().getFullYear() - 1).toString(),
                        (new Date().getFullYear() - 2).toString(),
                        'ALL',
                      ].map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setLeaveSelectedYear(yr)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                            leaveSelectedYear === yr
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {yr === 'ALL' ? 'All Years' : yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Duty Status Today
                    </span>
                    {isIoCurrentlyOnLeave(selectedIO) ? (
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400 animate-pulse">
                        🚨 Currently On Approved Leave
                      </span>
                    ) : (
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ✓ On Active Duty
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Stat Metric Cards for Selected Year */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                      Total Days Availed
                    </span>
                    <span className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1 block">
                      {selectedIoLeaveStats.totalDays} <span className="text-xs font-normal">Days</span>
                    </span>
                    <span className="text-[10px] text-amber-600/80 font-semibold">
                      Across {selectedIoLeaveStats.count} approved leave(s)
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                      Casual Leave (CL)
                    </span>
                    <span className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-1 block">
                      {selectedIoLeaveStats.clDays} <span className="text-xs font-normal">Days</span>
                    </span>
                    <span className="text-[10px] text-blue-600/80 font-semibold">
                      Personal / Family Affairs
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                      Compensatory (CPL)
                    </span>
                    <span className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-1 block">
                      {selectedIoLeaveStats.cplDays} <span className="text-xs font-normal">Days</span>
                    </span>
                    <span className="text-[10px] text-purple-600/80 font-semibold">
                      Rest against festival / emergency duty
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Other Approved Leaves
                    </span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">
                      {selectedIoLeaveStats.otherDays} <span className="text-xs font-normal">Days</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Earned / Medical / Special
                    </span>
                  </div>
                </div>

                {/* Table of Leave Records */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Leave Register Entries ({selectedIoLeaves.length})
                  </h4>

                  {selectedIoLeaves.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 text-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500">
                      <Plane className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="font-bold text-xs">
                        No leaves recorded for {selectedIO.name} in{' '}
                        {leaveSelectedYear === 'ALL' ? 'the ledger' : leaveSelectedYear}.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                            <th className="p-2.5">Departure Date</th>
                            <th className="p-2.5">Expected Arrival</th>
                            <th className="p-2.5">Actual Arrival</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Station</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Reason / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {selectedIoLeaves.map((l) => (
                            <tr
                              key={l.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                            >
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                {formatReadableDate(l.departureDate)}
                              </td>
                              <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                {formatReadableDate(l.arrivalDate)}
                              </td>
                              <td className="p-2.5">
                                {l.actualArrivalDate ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    {formatReadableDate(l.actualArrivalDate)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Pending return</span>
                                )}
                              </td>
                              <td className="p-2.5 font-extrabold text-amber-600 dark:text-amber-400">
                                {l.daysOnLeave} Days
                              </td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold rounded text-[10px]">
                                  {l.leaveType || 'CL'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                {l.ps} PS
                              </td>
                              <td className="p-2.5">
                                {l.status === 'ARRIVED' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                    ✓ Resumed Duty
                                  </span>
                                ) : l.status === 'OVERDUE' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black animate-pulse">
                                    ⚠️ Overdue
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                    On Leave
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs truncate">
                                {l.remarks || 'Official approved leave'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Roster ID: <strong className="font-mono">{selectedIO.id}</strong>
              </span>

              <button
                type="button"
                onClick={() => setSelectedIO(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Officer Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add IO Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Investigating Officer to Roster
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  IO Name & Designation *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SI Rajesh Kumar"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Police Rank *
                </label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="SDPO">SDPO (Sub-Divisional Police Officer)</option>
                  <option value="Circle Inspector">Circle Inspector (CI)</option>
                  <option value="Inspector">Inspector</option>
                  <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                  <option value="Asst. Sub-Inspector (ASI)">Asst. Sub-Inspector (ASI)</option>
                  <option value="PTC">PTC (Police Trainee Constable / Officer)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Station / Unit Posting *
                </label>
                <select
                  value={ps}
                  onChange={(e) => setPs(e.target.value as any)}
                  disabled={Boolean(activePS)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Subdivision HQ">Subdivision HQ (SDPO Office)</option>
                  <option value="Tarapur">Tarapur PS</option>
                  <option value="Asarganj">Asarganj PS</option>
                  <option value="Sangrampur">Sangrampur PS</option>
                  <option value="Harpur">Harpur PS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone / Mobile Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                >
                  Save Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
