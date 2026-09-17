import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  InvestigatingOfficer,
  FIRCase,
  PoliceStationName,
  UserRole,
  LeaveLedgerEntry,
  DailyCrimeReport,
  OfficerLeaveRank,
  OfficerLeaveType,
} from '../types';
import {
  UserCheck,
  Plus,
  Phone,
  User,
  X,
  FileSpreadsheet,
  Printer,
  FolderOpen,
  ExternalLink,
  Calendar,
  AlertCircle,
  Trash2,
  Search,
  Filter,
  RotateCcw,
  Plane,
  Briefcase,
  Edit2,
  ChevronDown,
  Check,
  Table,
  LayoutGrid,
  Clock,
  Shield,
  Car,
} from 'lucide-react';
import { getPSFromRole, getDeadlineInfo, formatReadableDate } from '../utils/helpers';
import { exportToExcel, exportToPDF } from '../utils/reportExport';
import { DailyReportHistoricalRegister } from './DailyReportHistoricalRegister';
import { extractAllDutyRecords, categorizeDutyTime } from '../utils/dutyHelpers';

interface IOManagementProps {
  ios: InvestigatingOfficer[];
  cases: FIRCase[];
  leaveLedger?: LeaveLedgerEntry[];
  dailyReports?: DailyCrimeReport[];
  onAddIO: (newIO: Omit<InvestigatingOfficer, 'id'>) => void;
  onUpdateIO?: (updatedIO: InvestigatingOfficer) => void;
  onDeleteIO?: (ioId: string) => void;
  onUpdateLeaveStatus?: (leaveId: string, status: 'ON_LEAVE' | 'ARRIVED' | 'OVERDUE', actualArrivalDate?: string) => void;
  onAddLeaveEntry?: (entry: LeaveLedgerEntry) => void;
  onDeleteLeaveEntry?: (leaveId: string) => void;
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
  onUpdateLeaveStatus,
  onAddLeaveEntry,
  onDeleteLeaveEntry,
  currentRole,
  onSelectIOCasesFilter,
  isReadOnly = false,
}) => {
  const activePS = getPSFromRole(currentRole);

  // View Mode: 'roster' (cards) vs 'ledger' (leave ledger table) vs 'duties' (duty register)
  const [viewMode, setViewMode] = useState<'roster' | 'ledger' | 'duties'>('roster');

  // Multi-select filters
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [selectedCaseStatuses, setSelectedCaseStatuses] = useState<string[]>([]);
  const [selectedCaseTypes, setSelectedCaseTypes] = useState<string[]>([]);
  const [selectedLimits, setSelectedLimits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIO, setEditingIO] = useState<InvestigatingOfficer | null>(null);
  const [selectedIO, setSelectedIO] = useState<InvestigatingOfficer | null>(null);
  const [profileTab, setProfileTab] = useState<'cases' | 'leave' | 'duties'>('cases');
  const [leaveSelectedYear, setLeaveSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const [targetOfficerForLeave, setTargetOfficerForLeave] = useState<InvestigatingOfficer | null>(null);

  // Add IO Form state
  const [addName, setAddName] = useState('');
  const [addRank, setAddRank] = useState<InvestigatingOfficer['rank']>('Sub-Inspector (SI)');
  const [addPs, setAddPs] = useState<PoliceStationName | 'Subdivision HQ'>(activePS || 'Tarapur');
  const [addPhone, setAddPhone] = useState('');

  // Edit IO Form state
  const [editName, setEditName] = useState('');
  const [editRank, setEditRank] = useState<InvestigatingOfficer['rank']>('Sub-Inspector (SI)');
  const [editPs, setEditPs] = useState<PoliceStationName | 'Subdivision HQ'>('Tarapur');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'TRANSFERRED'>('ACTIVE');
  const [editTransferredTo, setEditTransferredTo] = useState('');
  const [editTransferDate, setEditTransferDate] = useState('');

  // Add Leave Form state
  const [newLeaveOfficerName, setNewLeaveOfficerName] = useState('');
  const [newLeavePs, setNewLeavePs] = useState<PoliceStationName>('Tarapur');
  const [newLeaveDepDate, setNewLeaveDepDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newLeaveDays, setNewLeaveDays] = useState<number>(3);
  const [newLeaveType, setNewLeaveType] = useState<OfficerLeaveType>('CL');
  const [newLeaveRemarks, setNewLeaveRemarks] = useState('');

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStations([]);
    setSelectedStatuses([]);
    setSelectedRanks([]);
    setSelectedCaseStatuses([]);
    setSelectedCaseTypes([]);
    setSelectedLimits([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedStations.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedRanks.length > 0 ||
    selectedCaseStatuses.length > 0 ||
    selectedCaseTypes.length > 0 ||
    selectedLimits.length > 0 ||
    searchQuery.trim().length > 0;

  // Build unified leaves list from leaveLedger + dailyReports
  const allUnifiedLeaves = useMemo(() => {
    const list: LeaveLedgerEntry[] = [
      ...leaveLedger,
      ...dailyReports.flatMap((r) => r.leaveLedgerEntries || []),
    ];
    const map = new Map<string, LeaveLedgerEntry>();
    list.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values()).sort((a, b) => (b.departureDate || '').localeCompare(a.departureDate || ''));
  }, [leaveLedger, dailyReports]);

  // Match officer names safely
  const matchOfficerName = (ioName: string, leaveOfficerName: string) => {
    if (!ioName || !leaveOfficerName) return false;
    const cleanA = (ioName || '')
      .toLowerCase()
      .replace(/\b(si|asi|insp|inspector|sub-inspector|sho|ptc|sdpo|ci|shri|mr|dr)\b/gi, '')
      .replace(/[^a-z0-9]/gi, '')
      .trim();
    const cleanB = (leaveOfficerName || '')
      .toLowerCase()
      .replace(/\b(si|asi|insp|inspector|sub-inspector|sho|ptc|sdpo|ci|shri|mr|dr)\b/gi, '')
      .replace(/[^a-z0-9]/gi, '')
      .trim();

    if (!cleanA || !cleanB) return false;
    return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
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

  // Get total leave days in a year for an IO
  const getIoCurrentYearLeaveDays = (io: InvestigatingOfficer, yearStr = new Date().getFullYear().toString()) => {
    const officerLeaves = allUnifiedLeaves.filter((leave) => {
      if (!matchOfficerName(io.name, leave.officerName)) return false;
      const leaveYear = (leave.departureDate || '').slice(0, 4);
      return leaveYear === yearStr;
    });
    return officerLeaves.reduce((acc, l) => acc + (Number(l.daysOnLeave) || 0), 0);
  };

  // Options
  const stationOptions = [
    { label: 'Subdivision HQ', value: 'Subdivision HQ' },
    { label: 'Tarapur PS', value: 'Tarapur' },
    { label: 'Asarganj PS', value: 'Asarganj' },
    { label: 'Sangrampur PS', value: 'Sangrampur' },
    { label: 'Harpur PS', value: 'Harpur' },
  ];

  const statusOptions = [
    { label: '🟢 Active (Posted)', value: 'ACTIVE' },
    { label: '🟠 Transferred', value: 'TRANSFERRED' },
    { label: '🏖️ On Leave Today', value: 'ON_LEAVE' },
    { label: '⚠️ Overdue Cases', value: 'OVERDUE_CASES' },
  ];

  const caseStatusOptions = [
    { label: '🔍 Under Investigation', value: 'Under Investigation' },
    { label: '📄 Chargesheeted / Final Form', value: 'Chargesheeted / Final Form Submitted' },
    { label: '❌ False Case / Mistake of Fact', value: 'False Case / Mistake of Fact' },
    { label: '🚫 No Assigned Cases', value: 'NO_CASES' },
  ];

  const rankOptions = [
    { label: 'SDPO', value: 'SDPO' },
    { label: 'Circle Inspector (CI)', value: 'Circle Inspector' },
    { label: 'Inspector', value: 'Inspector' },
    { label: 'Sub-Inspector (SI)', value: 'Sub-Inspector (SI)' },
    { label: 'Asst. Sub-Inspector (ASI)', value: 'Asst. Sub-Inspector (ASI)' },
    { label: 'PTC', value: 'PTC' },
  ];

  const caseTypeOptions = [
    { label: 'Has SR Cases (≥1)', value: 'HAS_SR' },
    { label: 'Has Non-SR Cases (≥1)', value: 'HAS_NSR' },
    { label: 'SR Cases Only', value: 'SR_ONLY' },
    { label: 'Non-SR Cases Only', value: 'NSR_ONLY' },
  ];

  const limitOptions = [
    { label: '60 Days Limit', value: '60' },
    { label: '90 Days Limit', value: '90' },
    { label: 'Overdue Deadline', value: 'OVERDUE' },
  ];

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  // Filtered IOs calculation
  const filteredIos = useMemo(() => {
    return ios.filter((io) => {
      const ioStatus = io.status || 'ACTIVE';
      const onLeave = isIoCurrentlyOnLeave(io);

      const ioCases = cases.filter(
        (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
      );
      const srCount = ioCases.filter((c) => c.designation === 'SR').length;
      const nsrCount = ioCases.filter((c) => c.designation === 'NON_SR').length;
      const hasOverdue = ioCases.some((c) => getDeadlineInfo(c).code === 'OVERDUE');

      // 1. Station
      if (selectedStations.length > 0 && !selectedStations.includes(io.ps)) return false;

      // 2. Status
      if (selectedStatuses.length > 0) {
        const matchesStatus = selectedStatuses.some((statusKey) => {
          if (statusKey === 'ACTIVE') return ioStatus === 'ACTIVE';
          if (statusKey === 'TRANSFERRED') return ioStatus === 'TRANSFERRED';
          if (statusKey === 'ON_LEAVE') return onLeave;
          if (statusKey === 'OVERDUE_CASES') return hasOverdue;
          return false;
        });
        if (!matchesStatus) return false;
      }

      // 3. Rank
      if (selectedRanks.length > 0 && !selectedRanks.includes(io.rank)) return false;

      // 4. Case Status Filter (Under Investigation, Chargesheeted, Mistake of Fact)
      if (selectedCaseStatuses.length > 0) {
        const matchesCaseStatus = selectedCaseStatuses.some((st) => {
          if (st === 'NO_CASES') return ioCases.length === 0;
          return ioCases.some((c) => c.status === st);
        });
        if (!matchesCaseStatus) return false;
      }

      // 5. Case Classification
      if (selectedCaseTypes.length > 0) {
        const matchesType = selectedCaseTypes.some((type) => {
          if (type === 'HAS_SR') return srCount > 0;
          if (type === 'HAS_NSR') return nsrCount > 0;
          if (type === 'SR_ONLY') return srCount > 0 && nsrCount === 0;
          if (type === 'NSR_ONLY') return nsrCount > 0 && srCount === 0;
          return false;
        });
        if (!matchesType) return false;
      }

      // 6. Limits
      if (selectedLimits.length > 0) {
        const matchesLimit = selectedLimits.some((lim) => {
          if (lim === '60') return ioCases.some((c) => c.deadlineDays === 60);
          if (lim === '90') return ioCases.some((c) => c.deadlineDays === 90);
          if (lim === 'OVERDUE') return hasOverdue;
          return false;
        });
        if (!matchesLimit) return false;
      }

      // 7. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (io.name || '').toLowerCase().includes(q);
        const matchesPhone = (io.phone || '').toLowerCase().includes(q);
        const matchesPs = (io.ps || '').toLowerCase().includes(q);
        const matchesRank = (io.rank || '').toLowerCase().includes(q);
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
    selectedStations,
    selectedStatuses,
    selectedRanks,
    selectedCaseStatuses,
    selectedCaseTypes,
    selectedLimits,
    searchQuery,
    allUnifiedLeaves,
  ]);

  // Open Edit Modal for IO
  const handleOpenEditModal = (io: InvestigatingOfficer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingIO(io);
    setEditName(io.name || '');
    setEditRank(io.rank || 'Sub-Inspector (SI)');
    setEditPs(io.ps || 'Tarapur');
    setEditPhone(io.phone || '');
    setEditStatus(io.status || 'ACTIVE');
    setEditTransferredTo(io.transferredTo || '');
    setEditTransferDate(io.transferDate || new Date().toISOString().split('T')[0]);
  };

  // Submit Edit IO
  const handleSaveEditIO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIO || !onUpdateIO) return;

    const updated: InvestigatingOfficer = {
      ...editingIO,
      name: editName.trim(),
      rank: editRank,
      ps: editPs,
      phone: editPhone.trim() || undefined,
      status: editStatus,
      transferredTo: editStatus === 'TRANSFERRED' ? editTransferredTo.trim() || 'Other Police Station/Unit' : undefined,
      transferDate: editStatus === 'TRANSFERRED' ? editTransferDate : undefined,
    };

    onUpdateIO(updated);
    if (selectedIO && selectedIO.id === updated.id) setSelectedIO(updated);
    setEditingIO(null);
  };

  // Handle Add IO
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    onAddIO({
      name: addName.trim(),
      rank: addRank,
      ps: addPs,
      phone: addPhone.trim() || undefined,
      status: 'ACTIVE',
    });

    setAddName('');
    setAddPhone('');
    setIsAddModalOpen(false);
  };

  // Open Log Leave Modal
  const handleOpenLogLeave = (io?: InvestigatingOfficer) => {
    if (io) {
      setTargetOfficerForLeave(io);
      setNewLeaveOfficerName(io.name);
      setNewLeavePs(io.ps === 'Subdivision HQ' ? 'Tarapur' : io.ps);
    } else {
      setTargetOfficerForLeave(null);
      setNewLeaveOfficerName('');
      setNewLeavePs('Tarapur');
    }
    setNewLeaveDepDate(new Date().toISOString().split('T')[0]);
    setNewLeaveDays(3);
    setNewLeaveType('CL');
    setNewLeaveRemarks('');
    setIsAddLeaveModalOpen(true);
  };

  // Save Leave Entry
  const handleSaveLeaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveOfficerName.trim() || !onAddLeaveEntry) return;

    const dep = new Date(newLeaveDepDate);
    const arr = new Date(dep);
    arr.setDate(arr.getDate() + Number(newLeaveDays) + 1);
    const arrivalDateStr = arr.toISOString().split('T')[0];

    let leaveRank: OfficerLeaveRank = 'Sub-Inspector (SI)';
    if (targetOfficerForLeave) {
      if (targetOfficerForLeave.rank === 'Inspector' || targetOfficerForLeave.rank === 'Circle Inspector' || targetOfficerForLeave.rank === 'SDPO') {
        leaveRank = 'Inspector';
      } else if (targetOfficerForLeave.rank === 'Asst. Sub-Inspector (ASI)' || targetOfficerForLeave.rank === 'PTC') {
        leaveRank = 'ASI & PTC';
      }
    }

    const newEntry: LeaveLedgerEntry = {
      id: `leave-${Date.now()}`,
      ps: newLeavePs,
      officerName: newLeaveOfficerName.trim(),
      rank: leaveRank,
      departureDate: newLeaveDepDate,
      daysOnLeave: Number(newLeaveDays),
      arrivalDate: arrivalDateStr,
      status: 'ON_LEAVE',
      leaveType: newLeaveType,
      remarks: newLeaveRemarks.trim() || undefined,
      recordedBy: currentRole,
      createdAt: new Date().toISOString(),
    };

    onAddLeaveEntry(newEntry);
    setIsAddLeaveModalOpen(false);
  };

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
      'Under Investigation Cases',
      'Chargesheeted Cases',
      'False/Mistake of Fact Cases',
      'SR Cases',
      'Non-SR Cases',
      `Leave Days (${new Date().getFullYear()})`,
    ];
    const rows = filteredIos.map((io) => {
      const ioCases = cases.filter(
        (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
      );
      const underInv = ioCases.filter((c) => c.status === 'Under Investigation').length;
      const csCount = ioCases.filter((c) => c.status === 'Chargesheeted / Final Form Submitted').length;
      const mofCount = ioCases.filter((c) => c.status === 'False Case / Mistake of Fact').length;
      const srCount = ioCases.filter((c) => c.designation === 'SR').length;
      const nsrCount = ioCases.filter((c) => c.designation === 'NON_SR').length;
      const leaveDays = getIoCurrentYearLeaveDays(io);

      return [
        io.name,
        io.rank,
        io.ps,
        io.status || 'ACTIVE',
        io.transferredTo || 'N/A',
        io.transferDate || 'N/A',
        io.phone || 'N/A',
        underInv,
        csCount,
        mofCount,
        srCount,
        nsrCount,
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
      {/* Header Banner & Mode Selector */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-amber-400 rounded-lg border border-slate-700 font-bold shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                IO Management & Leave Ledger
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider">
                {filteredIos.length} / {ios.length} Officers
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage officers, filter by Case Status (Under Inv / Chargesheet / Mistake of Fact), update active/transferred status & track leave register.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('roster')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'roster'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Officers Roster</span>
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Leave Ledger ({allUnifiedLeaves.length})</span>
            </button>
            <button
              onClick={() => setViewMode('duties')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'duties'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Duty & Gasti Register</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add IO</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Select Filters Section */}
      <div ref={filterRef} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Multi-Criteria Filters</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {/* 1. Case Status (Under Inv, Chargesheet, Mistake of Fact) */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Case Status ({selectedCaseStatuses.length > 0 ? selectedCaseStatuses.length : 'All'})
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'casestatus' ? null : 'casestatus')}
              className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold cursor-pointer transition ${
                selectedCaseStatuses.length > 0
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="truncate">
                {selectedCaseStatuses.length === 0
                  ? 'All Case Statuses'
                  : `${selectedCaseStatuses.length} Case Statuses`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {openDropdown === 'casestatus' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 min-w-[220px]">
                {caseStatusOptions.map((opt) => {
                  const checked = selectedCaseStatuses.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedCaseStatuses, opt.value)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Officer Posting Status (Active / Transferred / On Leave) */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Officer Status ({selectedStatuses.length > 0 ? selectedStatuses.length : 'All'})
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold cursor-pointer transition ${
                selectedStatuses.length > 0
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="truncate">
                {selectedStatuses.length === 0
                  ? 'All Statuses'
                  : `${selectedStatuses.length} Statuses`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 min-w-[200px]">
                {statusOptions.map((opt) => {
                  const checked = selectedStatuses.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedStatuses, opt.value)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Station */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Station ({selectedStations.length > 0 ? selectedStations.length : 'All'})
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'station' ? null : 'station')}
              className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold cursor-pointer transition ${
                selectedStations.length > 0
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="truncate">
                {selectedStations.length === 0
                  ? 'All Stations'
                  : `${selectedStations.length} Stations`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {openDropdown === 'station' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 min-w-[200px]">
                {stationOptions.map((opt) => {
                  const checked = selectedStations.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedStations, opt.value)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Rank */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Rank ({selectedRanks.length > 0 ? selectedRanks.length : 'All'})
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'rank' ? null : 'rank')}
              className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold cursor-pointer transition ${
                selectedRanks.length > 0
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="truncate">
                {selectedRanks.length === 0
                  ? 'All Ranks'
                  : `${selectedRanks.length} Ranks`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {openDropdown === 'rank' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 min-w-[200px]">
                {rankOptions.map((opt) => {
                  const checked = selectedRanks.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedRanks, opt.value)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. SR / Non-SR */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              SR/NSR ({selectedCaseTypes.length > 0 ? selectedCaseTypes.length : 'All'})
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'casetype' ? null : 'casetype')}
              className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold cursor-pointer transition ${
                selectedCaseTypes.length > 0
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="truncate">
                {selectedCaseTypes.length === 0
                  ? 'All Classifications'
                  : `${selectedCaseTypes.length} Types`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {openDropdown === 'casetype' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 min-w-[200px]">
                {caseTypeOptions.map((opt) => {
                  const checked = selectedCaseTypes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedCaseTypes, opt.value)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Limits */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Limits ({selectedLimits.length > 0 ? selectedLimits.length : 'All'})
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'limit' ? null : 'limit')}
              className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs p-2 text-slate-900 dark:text-white font-semibold cursor-pointer transition ${
                selectedLimits.length > 0
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="truncate">
                {selectedLimits.length === 0
                  ? 'All Limits'
                  : `${selectedLimits.length} Limits`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {openDropdown === 'limit' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1 min-w-[200px]">
                {limitOptions.map((opt) => {
                  const checked = selectedLimits.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedLimits, opt.value)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Search Input */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Search Officers
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, phone..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Filter Tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Active:</span>

            {selectedCaseStatuses.map((cs) => (
              <span
                key={cs}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800"
              >
                <span>{caseStatusOptions.find((o) => o.value === cs)?.label || cs}</span>
                <button onClick={() => toggleArrayItem(setSelectedCaseStatuses, cs)} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedStatuses.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-bold"
              >
                <span>{statusOptions.find((o) => o.value === s)?.label || s}</span>
                <button onClick={() => toggleArrayItem(setSelectedStatuses, s)} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedStations.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700"
              >
                <span>{st}</span>
                <button onClick={() => toggleArrayItem(setSelectedStations, st)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedRanks.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[11px] font-bold"
              >
                <span>{r}</span>
                <button onClick={() => toggleArrayItem(setSelectedRanks, r)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedCaseTypes.map((ct) => (
              <span
                key={ct}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-bold"
              >
                <span>{caseTypeOptions.find((o) => o.value === ct)?.label || ct}</span>
                <button onClick={() => toggleArrayItem(setSelectedCaseTypes, ct)} className="hover:text-amber-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedLimits.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[11px] font-bold"
              >
                <span>{limitOptions.find((o) => o.value === l)?.label || l}</span>
                <button onClick={() => toggleArrayItem(setSelectedLimits, l)} className="hover:text-rose-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* VIEW MODE 1: ROSTER CARDS */}
      {viewMode === 'roster' && (
        <>
          {filteredIos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
              <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                No Investigating Officers Match Selected Filters
              </h3>
              <p className="text-xs text-slate-500">
                Try adjusting your Case Status (Under Inv / Chargesheet / Mistake of Fact) or Station filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold transition hover:bg-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIos.map((io) => {
                const ioCases = cases.filter(
                  (c) => c.ioName && (c.ioName.includes(io.name) || io.name.includes(c.ioName))
                );
                const pendingCount = ioCases.filter((c) => c.status === 'Under Investigation').length;
                const csCount = ioCases.filter((c) => c.status === 'Chargesheeted / Final Form Submitted').length;
                const mofCount = ioCases.filter((c) => c.status === 'False Case / Mistake of Fact').length;
                const srCount = ioCases.filter((c) => c.designation === 'SR').length;
                const nsrCount = ioCases.filter((c) => c.designation === 'NON_SR').length;
                const overdueCases = ioCases.filter((c) => getDeadlineInfo(c).code === 'OVERDUE');

                const isTransferred = io.status === 'TRANSFERRED';
                const onLeaveToday = isIoCurrentlyOnLeave(io);
                const currentYearLeaveDays = getIoCurrentYearLeaveDays(io);

                return (
                  <div
                    key={io.id}
                    onClick={() => {
                      setSelectedIO(io);
                      setProfileTab('cases');
                    }}
                    className={`bg-white dark:bg-slate-900 rounded-xl p-4 border transition cursor-pointer group space-y-3 relative overflow-hidden shadow-xs hover:shadow-md ${
                      isTransferred
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-500'
                    }`}
                  >
                    {/* Top Officer Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg font-bold border transition ${
                            isTransferred
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600'
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
                        {isTransferred ? (
                          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5" />
                            <span>Transferred</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        )}

                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {io.ps}
                        </span>
                      </div>
                    </div>

                    {/* Transfer banner if transferred */}
                    {isTransferred && (
                      <div className="p-2 bg-amber-100/60 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                        <span className="font-bold">Transferred To:</span> {io.transferredTo || 'Other Unit'}
                        {io.transferDate && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">
                            Date: {formatReadableDate(io.transferDate)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Phone */}
                    {io.phone && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{io.phone}</span>
                      </div>
                    )}

                    {/* Case Status Breakdown */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] uppercase block">
                            Under Investigation
                          </span>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                            {pendingCount} Cases
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-bold text-[10px] uppercase block">
                            Total Assigned
                          </span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                            {ioCases.length} Cases
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Pending: {pendingCount}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Chargesheet: {csCount}
                        </span>
                        {mofCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            Mistake of Fact: {mofCount}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                          SR: {srCount} | Non-SR: {nsrCount}
                        </span>
                        {overdueCases.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black animate-pulse">
                            ⚠️ {overdueCases.length} Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Leave status */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          Leave ({new Date().getFullYear()}):
                        </span>
                        <strong className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                          {currentYearLeaveDays} Days
                        </strong>
                      </div>

                      {onLeaveToday ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-800 animate-pulse">
                          On Leave Today
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ On Duty
                        </span>
                      )}
                    </div>

                    {/* Card Actions */}
                    {!isReadOnly && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(io, e)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit / Transfer</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLogLeave(io);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800"
                        >
                          <Plane className="w-3 h-3" />
                          <span>Log Leave</span>
                        </button>

                        {onDeleteIO && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteIO(io.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition rounded cursor-pointer"
                            title="Delete IO"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: CENTRAL LEAVE LEDGER TABLE */}
      {viewMode === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-amber-500" />
                <span>All Officers Leave Register & Duty Status</span>
              </h3>
              <p className="text-xs text-slate-500">
                Unified record of all approved casual, compensatory, and special leaves across Tarapur Subdivision.
              </p>
            </div>

            {!isReadOnly && onAddLeaveEntry && (
              <button
                onClick={() => handleOpenLogLeave()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Log New Leave Entry</span>
              </button>
            )}
          </div>

          {allUnifiedLeaves.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Plane className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="font-bold text-sm">No leave records registered in the ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Officer Name & Rank</th>
                    <th className="p-3">Station</th>
                    <th className="p-3">Departure Date</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Expected Arrival</th>
                    <th className="p-3">Actual Arrival</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                    {!isReadOnly && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {allUnifiedLeaves.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                    >
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {l.officerName}
                        </span>
                        <span className="text-[10px] text-slate-500">{l.rank}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {l.ps} PS
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {formatReadableDate(l.departureDate)}
                      </td>
                      <td className="p-3 font-extrabold text-amber-600 dark:text-amber-400">
                        {l.daysOnLeave} Days
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {formatReadableDate(l.arrivalDate)}
                      </td>
                      <td className="p-3">
                        {l.actualArrivalDate ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatReadableDate(l.actualArrivalDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending return</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold rounded text-[10px]">
                          {l.leaveType || 'CL'}
                        </span>
                      </td>
                      <td className="p-3">
                        {l.status === 'ARRIVED' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            ✓ Resumed Duty
                          </span>
                        ) : l.status === 'OVERDUE' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black animate-pulse">
                            ⚠️ Overdue
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            On Leave
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs truncate">
                        {l.remarks || 'Sanctioned leave'}
                      </td>

                      {!isReadOnly && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {l.status !== 'ARRIVED' && onUpdateLeaveStatus && (
                              <button
                                onClick={() =>
                                  onUpdateLeaveStatus(
                                    l.id,
                                    'ARRIVED',
                                    new Date().toISOString().split('T')[0]
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                title="Mark as returned to duty today"
                              >
                                Mark Resumed
                              </button>
                            )}

                            {onDeleteLeaveEntry && (
                              <button
                                onClick={() => onDeleteLeaveEntry(l.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition rounded cursor-pointer"
                                title="Delete leave entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View Mode 3: Daily Duties & Gasti Patrols Register */}
      {viewMode === 'duties' && (
        <DailyReportHistoricalRegister
          reports={dailyReports}
          investigatingOfficers={ios}
          currentRole={currentRole}
          activePS={activePS}
          onViewReport={() => {}}
          onSelectIOForProfile={(ioName) => {
            const found = ios.find(
              (i) =>
                i.name.toLowerCase() === ioName.toLowerCase() ||
                i.name.toLowerCase().includes(ioName.toLowerCase()) ||
                ioName.toLowerCase().includes(i.name.toLowerCase())
            );
            if (found) {
              setSelectedIO(found);
              setProfileTab('duties');
            }
          }}
        />
      )}

      {/* Selected IO Profile Modal */}
      {selectedIO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl font-bold">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                      {selectedIO.name}
                    </h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded">
                      {selectedIO.rank}
                    </span>
                    {selectedIO.status === 'TRANSFERRED' ? (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-300">
                        Transferred ({selectedIO.transferredTo || 'Other Unit'})
                      </span>
                    ) : (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Station: <strong className="text-slate-800 dark:text-slate-200">{selectedIO.ps}</strong>
                    {selectedIO.phone && ` • Phone: ${selectedIO.phone}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isReadOnly && onUpdateIO && (
                  <button
                    onClick={() => handleOpenEditModal(selectedIO)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile / Transfer</span>
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

            {/* Profile Navigation Tabs */}
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
                <span>Leave Register</span>
              </button>

              <button
                onClick={() => setProfileTab('duties')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs transition cursor-pointer ${
                  profileTab === 'duties'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Duty & Patrol Register</span>
              </button>
            </div>

            {/* Profile Tab 1: Assigned Cases */}
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
                                    c.status === 'Chargesheeted / Final Form Submitted'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : c.status === 'False Case / Mistake of Fact'
                                      ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
                                  {c.status}
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
                                <span className="text-slate-400 block font-bold text-[10px]">CLASSIFICATION</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {c.designation === 'SR' ? 'SR Case' : 'Non-SR Case'}
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

            {/* Profile Tab 2: Leave Register */}
            {profileTab === 'leave' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Year:
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {[
                        new Date().getFullYear().toString(),
                        (new Date().getFullYear() - 1).toString(),
                        'ALL',
                      ].map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setLeaveSelectedYear(yr)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                            leaveSelectedYear === yr
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {yr === 'ALL' ? 'All Years' : yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isReadOnly && onAddLeaveEntry && (
                    <button
                      onClick={() => handleOpenLogLeave(selectedIO)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Log Leave</span>
                    </button>
                  )}
                </div>

                {/* Table of leaves for this IO */}
                {(() => {
                  const officerLeaves = allUnifiedLeaves.filter((l) => {
                    if (!matchOfficerName(selectedIO.name, l.officerName)) return false;
                    if (leaveSelectedYear !== 'ALL') {
                      return (l.departureDate || '').slice(0, 4) === leaveSelectedYear;
                    }
                    return true;
                  });

                  if (officerLeaves.length === 0) {
                    return (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 text-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500">
                        <Plane className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-bold text-xs">No leave records registered for {selectedIO.name}.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                            <th className="p-2.5">Departure</th>
                            <th className="p-2.5">Expected Arrival</th>
                            <th className="p-2.5">Actual Arrival</th>
                            <th className="p-2.5">Days</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Status</th>
                            {!isReadOnly && <th className="p-2.5 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {officerLeaves.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium">
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">{formatReadableDate(l.departureDate)}</td>
                              <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{formatReadableDate(l.arrivalDate)}</td>
                              <td className="p-2.5">
                                {l.actualArrivalDate ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatReadableDate(l.actualArrivalDate)}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Pending</span>
                                )}
                              </td>
                              <td className="p-2.5 font-extrabold text-amber-600 dark:text-amber-400">{l.daysOnLeave} Days</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-bold">{l.leaveType || 'CL'}</span>
                              </td>
                              <td className="p-2.5">
                                {l.status === 'ARRIVED' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">Resumed</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">On Leave</span>
                                )}
                              </td>
                              {!isReadOnly && (
                                <td className="p-2.5 text-right">
                                  {l.status !== 'ARRIVED' && onUpdateLeaveStatus && (
                                    <button
                                      onClick={() => onUpdateLeaveStatus(l.id, 'ARRIVED', new Date().toISOString().split('T')[0])}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                                    >
                                      Mark Resumed
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Profile Tab 3: Duties & Patrol Register */}
            {profileTab === 'duties' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {(() => {
                  const allDuties = extractAllDutyRecords(dailyReports);
                  const officerDuties = allDuties.filter((d) => {
                    const normDutyIO = d.ioName.toLowerCase().trim();
                    const normSelected = selectedIO.name.toLowerCase().trim();
                    return normDutyIO.includes(normSelected) || normSelected.includes(normDutyIO);
                  });

                  const odDuties = officerDuties.filter((d) => d.dutyType === 'OD');
                  const gastiDuties = officerDuties.filter((d) => d.dutyType === 'GASTI');
                  const nightCount = officerDuties.filter((d) => d.timeCategory === 'NIGHT').length;

                  if (officerDuties.length === 0) {
                    return (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 text-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 space-y-2">
                        <Clock className="w-8 h-8 mx-auto text-slate-400" />
                        <p className="font-bold text-xs">
                          No daily OD or Gasti patrol shifts logged yet for {selectedIO.name}.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Shifts appear here automatically whenever police stations submit their Daily Crime Reports.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Metric Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Shifts
                          </span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            {officerDuties.length}
                          </span>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                            Officer on Duty (OD)
                          </span>
                          <span className="text-lg font-black text-amber-800 dark:text-amber-300">
                            {odDuties.length}
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                            Patrols (Gasti)
                          </span>
                          <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                            {gastiDuties.length}
                          </span>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60">
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                            Night Shifts
                          </span>
                          <span className="text-lg font-black text-indigo-800 dark:text-indigo-300">
                            {nightCount}
                          </span>
                        </div>
                      </div>

                      {/* Chronological Shifts Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">PS</th>
                              <th className="p-2.5">Duty Type</th>
                              <th className="p-2.5">Shift Name & Timing</th>
                              <th className="p-2.5">Patrol Area / Vehicle</th>
                              <th className="p-2.5">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {officerDuties.map((duty) => (
                              <tr
                                key={duty.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                              >
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {formatReadableDate(duty.date)}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-extrabold">
                                    {duty.ps}
                                  </span>
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  {duty.dutyType === 'OD' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                                      OD
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                                      Gasti
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">
                                    {duty.shiftName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {duty.timeSlot}
                                  </div>
                                </td>
                                <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                  {duty.sectorArea && (
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                      {duty.sectorArea}
                                    </div>
                                  )}
                                  {duty.vehicleNumber && (
                                    <div className="text-[10px] text-slate-500">
                                      Veh: {duty.vehicleNumber}
                                    </div>
                                  )}
                                  {!duty.sectorArea && !duty.vehicleNumber && (
                                    <span className="text-slate-400 italic">—</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                  {duty.remarks || <span className="text-slate-400 italic">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIO(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit IO Modal */}
      {editingIO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Investigating Officer & Transfer Status</span>
              </h3>
              <button onClick={() => setEditingIO(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditIO} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IO Name & Designation *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. SI Rajesh Kumar"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Police Rank *</label>
                  <select
                    value={editRank}
                    onChange={(e) => setEditRank(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="SDPO">SDPO</option>
                    <option value="Circle Inspector">Circle Inspector (CI)</option>
                    <option value="Inspector">Inspector</option>
                    <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                    <option value="Asst. Sub-Inspector (ASI)">Asst. Sub-Inspector (ASI)</option>
                    <option value="PTC">PTC</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Station / Unit *</label>
                  <select
                    value={editPs}
                    onChange={(e) => setEditPs(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Subdivision HQ">Subdivision HQ</option>
                    <option value="Tarapur">Tarapur PS</option>
                    <option value="Asarganj">Asarganj PS</option>
                    <option value="Sangrampur">Sangrampur PS</option>
                    <option value="Harpur">Harpur PS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-medium text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Status Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Posting Status *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('ACTIVE')}
                    className={`p-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      editStatus === 'ACTIVE'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                    <span>Active (Posted)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('TRANSFERRED')}
                    className={`p-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      editStatus === 'TRANSFERRED'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Transferred</span>
                  </button>
                </div>

                {editStatus === 'TRANSFERRED' && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transferred To *</label>
                      <input
                        type="text"
                        value={editTransferredTo}
                        onChange={(e) => setEditTransferredTo(e.target.value)}
                        placeholder="e.g. Jamalpur PS / Munger Police Line"
                        required
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transfer Date</label>
                      <input
                        type="date"
                        value={editTransferDate}
                        onChange={(e) => setEditTransferDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIO(null)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add IO Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Investigating Officer
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IO Name & Designation *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. SI Rajesh Kumar"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Police Rank *</label>
                <select
                  value={addRank}
                  onChange={(e) => setAddRank(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="SDPO">SDPO</option>
                  <option value="Circle Inspector">Circle Inspector (CI)</option>
                  <option value="Inspector">Inspector</option>
                  <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                  <option value="Asst. Sub-Inspector (ASI)">Asst. Sub-Inspector (ASI)</option>
                  <option value="PTC">PTC</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Station / Unit Posting *</label>
                <select
                  value={addPs}
                  onChange={(e) => setAddPs(e.target.value as any)}
                  disabled={Boolean(activePS)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Subdivision HQ">Subdivision HQ</option>
                  <option value="Tarapur">Tarapur PS</option>
                  <option value="Asarganj">Asarganj PS</option>
                  <option value="Sangrampur">Sangrampur PS</option>
                  <option value="Harpur">Harpur PS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
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

      {/* Log Leave Modal */}
      {isAddLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-amber-500" />
                <span>Log Leave in Ledger</span>
              </h3>
              <button onClick={() => setIsAddLeaveModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveEntry} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Officer Name *</label>
                <input
                  type="text"
                  value={newLeaveOfficerName}
                  onChange={(e) => setNewLeaveOfficerName(e.target.value)}
                  placeholder="e.g. SI Rajesh Kumar"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Police Station *</label>
                <select
                  value={newLeavePs}
                  onChange={(e) => setNewLeavePs(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Tarapur">Tarapur PS</option>
                  <option value="Asarganj">Asarganj PS</option>
                  <option value="Sangrampur">Sangrampur PS</option>
                  <option value="Harpur">Harpur PS</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    value={newLeaveDepDate}
                    onChange={(e) => setNewLeaveDepDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Days on Leave *</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={newLeaveDays}
                    onChange={(e) => setNewLeaveDays(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Leave Type *</label>
                <select
                  value={newLeaveType}
                  onChange={(e) => setNewLeaveType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="CL">Casual Leave (CL)</option>
                  <option value="CPL">Compensatory (CPL)</option>
                  <option value="OTHERS">Other Approved (Medical / Earned)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sanction Remarks</label>
                <textarea
                  value={newLeaveRemarks}
                  onChange={(e) => setNewLeaveRemarks(e.target.value)}
                  placeholder="e.g. Sanctioned by SDPO for personal work"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeaveModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                >
                  Save to Leave Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
