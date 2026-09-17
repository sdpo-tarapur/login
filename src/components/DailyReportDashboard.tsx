import React, { useState, useMemo } from 'react';
import {
  DailyCrimeReport,
  FIRCase,
  InvestigatingOfficer,
  PoliceStationName,
  UserRole,
  RankStrengthDetails,
  LeaveLedgerEntry,
  OfficerLeaveRank,
  OfficerLeaveType,
} from '../types';
import {
  Building2,
  Shield,
  Users,
  FileText,
  Clock,
  Car,
  Wine,
  TrendingUp,
  AlertTriangle,
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Package,
  UserMinus,
  UserCheck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock4,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { calculateArrivalDate, formatIndianDate, getLeaveArrivalStatus, normalizeLeaveType } from '../utils/helpers';

interface DailyReportDashboardProps {
  reports: DailyCrimeReport[];
  cases: FIRCase[];
  ios: InvestigatingOfficer[];
  currentRole: UserRole;
  activePS?: PoliceStationName | null;
  monthlyArrestOverrides: Record<string, number>;
  onUpdateMonthlyArrestOverride: (monthKey: string, ps: string, figure: number) => void;
  leaveLedger?: LeaveLedgerEntry[];
  onUpdateLeaveStatus?: (leaveId: string, status: 'ON_LEAVE' | 'ARRIVED' | 'OVERDUE', actualArrivalDate?: string) => void;
  onAddLeaveEntry?: (entry: LeaveLedgerEntry) => void;
  onDeleteLeaveEntry?: (leaveId: string) => void;
  isReadOnly?: boolean;
}

const ALL_PS: PoliceStationName[] = ['Tarapur', 'Asarganj', 'Sangrampur', 'Harpur'];

export const DailyReportDashboard: React.FC<DailyReportDashboardProps> = ({
  reports,
  cases,
  ios,
  currentRole,
  activePS,
  monthlyArrestOverrides,
  onUpdateMonthlyArrestOverride,
  leaveLedger = [],
  onUpdateLeaveStatus,
  onAddLeaveEntry,
  onDeleteLeaveEntry,
  isReadOnly = false,
}) => {
  const isSuperUser = currentRole === 'SDPO';
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthKey = todayStr.slice(0, 7); // e.g. "2025-05"

  // View state: Subdivision Level or PS Level
  const [viewLevel, setViewLevel] = useState<'subdivision' | 'ps'>(
    activePS ? 'ps' : 'subdivision'
  );
  const [selectedPS, setSelectedPS] = useState<PoliceStationName>(activePS || 'Tarapur');

  // Modal / prompt for Super User to override monthly arresting figure
  const [isEditingArrests, setIsEditingArrests] = useState(false);
  const [customArrestInput, setCustomArrestInput] = useState<string>('');

  // Leave Ledger filters & search state
  const [leaveTab, setLeaveTab] = useState<'ALL_ACTIVE' | 'ARRIVING_TODAY' | 'UPCOMING' | 'OVERDUE' | 'ALL'>('ALL_ACTIVE');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveRankFilter, setLeaveRankFilter] = useState<'ALL' | OfficerLeaveRank>('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<'ALL' | OfficerLeaveType>('ALL');

  // Quick Add Leave Modal State
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const [newLeavePS, setNewLeavePS] = useState<PoliceStationName>(activePS || 'Tarapur');
  const [newLeaveOfficerName, setNewLeaveOfficerName] = useState('');
  const [newLeaveRank, setNewLeaveRank] = useState<OfficerLeaveRank>('Sub-Inspector (SI)');
  const [newLeaveDepartureDate, setNewLeaveDepartureDate] = useState(todayStr);
  const [newLeaveDays, setNewLeaveDays] = useState(4);
  const [newLeaveType, setNewLeaveType] = useState<OfficerLeaveType>('CL');
  const [newLeaveRemarks, setNewLeaveRemarks] = useState('');

  // Determine current context PS filter (null means all subdivision)
  const contextPS = viewLevel === 'subdivision' ? null : selectedPS;

  // Filtered reports
  const relevantReports = useMemo(() => {
    return contextPS ? reports.filter((r) => r.ps === contextPS) : reports;
  }, [reports, contextPS]);

  // Combined Leave Ledger Entries (from active ledger + all daily reports)
  const allLeaveEntries = useMemo(() => {
    const map = new Map<string, LeaveLedgerEntry>();

    // 1. External ledger
    if (leaveLedger) {
      leaveLedger.forEach((entry) => map.set(entry.id, entry));
    }

    // 2. From all daily reports
    reports.forEach((report) => {
      if (report.leaveLedgerEntries) {
        report.leaveLedgerEntries.forEach((entry) => {
          if (!map.has(entry.id)) {
            map.set(entry.id, entry);
          }
        });
      }
    });

    const list = Array.from(map.values());

    // Filter by contextPS
    const stationFiltered = contextPS ? list.filter((e) => e.ps === contextPS) : list;

    // Sort by arrival date ascending
    return stationFiltered.sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate));
  }, [leaveLedger, reports, contextPS]);

  // Derived Leave Metrics
  const activeLeaves = useMemo(() => {
    return allLeaveEntries.filter((e) => e.status !== 'ARRIVED');
  }, [allLeaveEntries]);

  const arrivingTodayEntries = useMemo(() => {
    return activeLeaves.filter((e) => e.arrivalDate === todayStr);
  }, [activeLeaves, todayStr]);

  const arrivingTomorrowEntries = useMemo(() => {
    return activeLeaves.filter((e) => {
      const status = getLeaveArrivalStatus(e.arrivalDate, e.status, todayStr);
      return status.diffDays === 1;
    });
  }, [activeLeaves, todayStr]);

  const overdueEntries = useMemo(() => {
    return activeLeaves.filter((e) => {
      const status = getLeaveArrivalStatus(e.arrivalDate, e.status, todayStr);
      return status.code === 'OVERDUE';
    });
  }, [activeLeaves, todayStr]);

  // Displayed Leave entries filtered by tabs, ranks, and search
  const displayedLeaveEntries = useMemo(() => {
    return allLeaveEntries.filter((item) => {
      const statusInfo = getLeaveArrivalStatus(item.arrivalDate, item.status, todayStr);

      // Tab filter
      if (leaveTab === 'ALL_ACTIVE' && item.status === 'ARRIVED') return false;
      if (leaveTab === 'ARRIVING_TODAY' && statusInfo.code !== 'ARRIVING_TODAY') return false;
      if (leaveTab === 'UPCOMING' && (statusInfo.diffDays <= 0 || statusInfo.diffDays > 3 || item.status === 'ARRIVED')) return false;
      if (leaveTab === 'OVERDUE' && statusInfo.code !== 'OVERDUE') return false;

      // Rank filter
      if (leaveRankFilter !== 'ALL' && item.rank !== leaveRankFilter) return false;

      // Leave Type filter (CL, CPL, OTHERS)
      if (leaveTypeFilter !== 'ALL') {
        const norm = normalizeLeaveType(item.leaveType);
        if (norm !== leaveTypeFilter) return false;
      }

      // Search query
      if (leaveSearch.trim()) {
        const q = leaveSearch.toLowerCase();
        const matchName = item.officerName.toLowerCase().includes(q);
        const matchRank = item.rank.toLowerCase().includes(q);
        const matchPS = item.ps.toLowerCase().includes(q);
        const matchType = normalizeLeaveType(item.leaveType).toLowerCase().includes(q);
        const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
        if (!matchName && !matchRank && !matchPS && !matchRemarks && !matchType) return false;
      }

      return true;
    });
  }, [allLeaveEntries, leaveTab, leaveRankFilter, leaveTypeFilter, leaveSearch, todayStr]);

  // Available officers for Quick Leave Entry Modal
  const newLeaveAvailableOfficers = useMemo(() => {
    return ios.filter((io) => io.ps === newLeavePS);
  }, [ios, newLeavePS]);

  const handleSaveQuickLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveOfficerName.trim()) return;

    const arrivalDate = calculateArrivalDate(newLeaveDepartureDate, newLeaveDays);
    const newEntry: LeaveLedgerEntry = {
      id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ps: newLeavePS,
      officerName: newLeaveOfficerName.trim(),
      rank: newLeaveRank,
      departureDate: newLeaveDepartureDate,
      daysOnLeave: newLeaveDays,
      arrivalDate,
      status: 'ON_LEAVE',
      leaveType: newLeaveType,
      remarks: newLeaveRemarks.trim() || undefined,
      recordedBy: currentRole,
      createdAt: new Date().toISOString(),
    };

    if (onAddLeaveEntry) {
      onAddLeaveEntry(newEntry);
    }

    setIsAddLeaveModalOpen(false);
    setNewLeaveOfficerName('');
    setNewLeaveRemarks('');
  };

  // Today's reports
  const todayReports = useMemo(() => {
    return relevantReports.filter((r) => r.date === todayStr);
  }, [relevantReports, todayStr]);

  // Monthly reports
  const currentMonthReports = useMemo(() => {
    return relevantReports.filter((r) => r.date.startsWith(currentMonthKey));
  }, [relevantReports, currentMonthKey]);

  // 1. Force Strength Aggregation (Rank-wise)
  const rankStrengthSummary = useMemo(() => {
    // If a specific PS is selected, take the latest reported rankStrengths for that PS, or fallback to default
    // If subdivision level, aggregate latest report of each of the 4 PS!
    const defaultRanks: Record<
      RankStrengthDetails['rank'],
      { total: number; present: number; onLeave: number; arriving: number; departing: number }
    > = {
      Inspector: { total: 0, present: 0, onLeave: 0, arriving: 0, departing: 0 },
      'Sub-Inspector (SI)': { total: 0, present: 0, onLeave: 0, arriving: 0, departing: 0 },
      'ASI & PTC': { total: 0, present: 0, onLeave: 0, arriving: 0, departing: 0 },
      Constable: { total: 0, present: 0, onLeave: 0, arriving: 0, departing: 0 },
    };

    const targetStations = contextPS ? [contextPS] : ALL_PS;

    targetStations.forEach((station) => {
      // Find latest report for this station that contains rankStrengths
      const stationReport = reports
        .filter((r) => r.ps === station && r.rankStrengths && r.rankStrengths.length > 0)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (stationReport && stationReport.rankStrengths) {
        stationReport.rankStrengths.forEach((rs) => {
          if (defaultRanks[rs.rank]) {
            defaultRanks[rs.rank].total += rs.totalStrength;
            defaultRanks[rs.rank].present += rs.present;
            defaultRanks[rs.rank].onLeave += rs.onLeave;
            defaultRanks[rs.rank].arriving += rs.arrivingToday || 0;
            defaultRanks[rs.rank].departing += rs.departingToday || 0;
          }
        });
      } else {
        // Fallback default estimates per station if not yet logged today
        defaultRanks.Inspector.total += 1;
        defaultRanks.Inspector.present += 1;
        defaultRanks['Sub-Inspector (SI)'].total += 6;
        defaultRanks['Sub-Inspector (SI)'].present += 5;
        defaultRanks['Sub-Inspector (SI)'].onLeave += 1;
        defaultRanks['ASI & PTC'].total += 10;
        defaultRanks['ASI & PTC'].present += 9;
        defaultRanks['ASI & PTC'].onLeave += 1;
        defaultRanks.Constable.total += 24;
        defaultRanks.Constable.present += 22;
        defaultRanks.Constable.onLeave += 2;
      }
    });

    return defaultRanks;
  }, [reports, contextPS]);

  // 2. Total FIR registered today
  const totalFIRToday = useMemo(() => {
    // FIRs from today's submitted daily reports
    const fromReports = todayReports.reduce((acc, r) => acc + (r.firsRegisteredCount || 0), 0);
    // FIRs from main FIR case records created today
    const fromFIRRecords = cases.filter((c) => {
      if (contextPS && c.ps !== contextPS) return false;
      return c.firDate === todayStr;
    }).length;

    return Math.max(fromReports, fromFIRRecords);
  }, [todayReports, cases, todayStr, contextPS]);

  // 3. Total FIR registered in month (From FIR records database!)
  const totalFIRInMonth = useMemo(() => {
    return cases.filter((c) => {
      if (contextPS && c.ps !== contextPS) return false;
      return c.firDate.startsWith(currentMonthKey);
    }).length;
  }, [cases, currentMonthKey, contextPS]);

  // Monthly FIR breakdown
  const monthlyFIRBreakdown = useMemo(() => {
    const monthCases = cases.filter((c) => {
      if (contextPS && c.ps !== contextPS) return false;
      return c.firDate.startsWith(currentMonthKey);
    });
    const srCount = monthCases.filter((c) => c.designation === 'SR').length;
    const nonSrCount = monthCases.filter((c) => c.designation === 'NON_SR').length;
    const punishment7Plus = monthCases.filter((c) => c.punishmentTerm === '7_years_or_more').length;
    const punishment7Less = monthCases.filter((c) => c.punishmentTerm === 'less_than_7_years').length;
    return { srCount, nonSrCount, punishment7Plus, punishment7Less };
  }, [cases, currentMonthKey, contextPS]);

  // 4. Total Arresting Today
  const totalArrestingToday = useMemo(() => {
    return todayReports.reduce((acc, r) => acc + (r.arrestsCount || 0), 0);
  }, [todayReports]);

  // Today's Liquor arrests
  const todayLiquorArrests = useMemo(() => {
    return todayReports.reduce((acc, r) => {
      if (r.arrestDetails?.liquorArrestsCount !== undefined) {
        return acc + r.arrestDetails.liquorArrestsCount;
      }
      return acc;
    }, 0);
  }, [todayReports]);

  // 5. Total Arresting in Month (Aggregated from reports + FIR records + Super User override)
  const computedMonthlyArrests = useMemo(() => {
    // Sum from monthly daily reports
    const reportArrests = currentMonthReports.reduce((acc, r) => acc + (r.arrestsCount || 0), 0);
    return reportArrests;
  }, [currentMonthReports]);

  // Check if Superuser has an override for this month & scope
  const overrideKey = `${currentMonthKey}_${contextPS || 'ALL'}`;
  const overriddenFigure = monthlyArrestOverrides[overrideKey];
  const finalMonthlyArrests =
    overriddenFigure !== undefined ? overriddenFigure : computedMonthlyArrests;

  // Handle saving Superuser arrest override
  const handleSaveArrestOverride = () => {
    const val = parseInt(customArrestInput, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateMonthlyArrestOverride(currentMonthKey, contextPS || 'ALL', val);
      setIsEditingArrests(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top View Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-900">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Daily Crime & Force Command Dashboard
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live operational metrics, force strength, daily arrests, and statutory records
            </p>
          </div>
        </div>

        {/* Level Toggle & PS selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewLevel('subdivision')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                viewLevel === 'subdivision'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Subdivision Level View
            </button>

            <button
              onClick={() => setViewLevel('ps')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                viewLevel === 'ps'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              PS Level View
            </button>
          </div>

          {viewLevel === 'ps' && (
            <select
              value={selectedPS}
              onChange={(e) => setSelectedPS(e.target.value as PoliceStationName)}
              disabled={Boolean(activePS)}
              className="p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-900 dark:text-white disabled:opacity-80"
            >
              {ALL_PS.map((ps) => (
                <option key={ps} value={ps}>
                  {ps} PS
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total FIR Registered Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              FIRs Registered Today
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalFIRToday}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Cases Logged</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Date: {todayStr}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {contextPS ? `${contextPS} PS` : 'All 4 Stations'}
            </span>
          </div>
        </div>

        {/* Metric 2: Total FIR Registered in Month (from FIR records) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total FIR in Month
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {totalFIRInMonth}
            </span>
            <span className="text-xs text-slate-500 font-semibold">From FIR Database</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>SR: <strong className="text-rose-600">{monthlyFIRBreakdown.srCount}</strong> | NSR: <strong>{monthlyFIRBreakdown.nonSrCount}</strong></span>
            <span>≥7Y: <strong className="text-purple-600">{monthlyFIRBreakdown.punishment7Plus}</strong></span>
          </div>
        </div>

        {/* Metric 3: Total Arresting Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Arresting Today
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {totalArrestingToday}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Accused</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Liquor Related:</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Wine className="w-3 h-3" />
              {todayLiquorArrests}
            </span>
          </div>
        </div>

        {/* Metric 4: Total Arresting in Month (with Super User Edit Option) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Arresting in Month
            </span>
            {isSuperUser && !isReadOnly && (
              <button
                onClick={() => {
                  setCustomArrestInput(String(finalMonthlyArrests));
                  setIsEditingArrests(true);
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition"
                title="Super User Edit Monthly Arrest Figure"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {finalMonthlyArrests}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {overriddenFigure !== undefined ? '(Superuser Verified)' : '(Calculated)'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Month: {currentMonthKey}</span>
            {isSuperUser && !isReadOnly ? (
              <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => setIsEditingArrests(true)}>
                Edit Override
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Official Portal Log</span>
            )}
          </div>
        </div>
      </div>

      {/* Force Strength Breakdown Table & Card (Rank-Wise) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Force Strength & Duty Deployment (Rank-Wise)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live availability of officers, leave management, and daily arrivals/departures
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Scope: <strong className="text-slate-900 dark:text-white">{contextPS ? `${contextPS} PS` : 'Full Tarapur Subdivision'}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="py-2.5 px-4 font-bold">Rank / Cadre</th>
                <th className="py-2.5 px-3 text-center font-bold">Total Strength</th>
                <th className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Present Today</th>
                <th className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">On Leave</th>
                <th className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">Arriving Today</th>
                <th className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">Departing Today</th>
                <th className="py-2.5 px-4 text-center font-bold text-slate-900 dark:text-white">Effective Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(Object.keys(rankStrengthSummary) as RankStrengthDetails['rank'][]).map((rank) => {
                const item = rankStrengthSummary[rank];
                const isConstable = rank === 'Constable';
                const effectiveAvailable = item.present;
                const availabilityRate = item.total > 0 ? Math.round((effectiveAvailable / item.total) * 100) : 100;

                return (
                  <tr key={rank} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      <span>{rank}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.total}
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                      {item.present}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
                      {item.onLeave}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                      {!isConstable ? item.arriving : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                      {!isConstable ? item.departing : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {effectiveAvailable}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          {availabilityRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Leave Ledger & Expected Arrival Schedule (Except Constable) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Active Leave Ledger & Expected Arrival Roster
                </h4>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-extrabold text-[10px] rounded border border-amber-300 dark:border-amber-800">
                  Except Constables (Inspector, SI, ASI)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Maintains individual departure dates, days on leave, and auto-computed arrival dates for all non-constable personnel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewLeavePS(contextPS || 'Tarapur');
                setIsAddLeaveModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Officer Leave</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total On Leave Now
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {activeLeaves.length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Officers</span>
            </div>
            <span className="text-[10px] text-slate-400">Excluding Constables</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            arrivingTodayEntries.length > 0
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
          }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Arriving Today
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-black ${
                arrivingTodayEntries.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {arrivingTodayEntries.length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Scheduled</span>
            </div>
            {arrivingTodayEntries.length > 0 ? (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 animate-pulse">
                ● Reporting to station today
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">No arrivals today</span>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Arriving Tomorrow
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {arrivingTomorrowEntries.length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Scheduled</span>
            </div>
            <span className="text-[10px] text-slate-400">Next 24 Hours</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            overdueEntries.length > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
          }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Overdue / Exceeded
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-black ${
                overdueEntries.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {overdueEntries.length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Overdue</span>
            </div>
            <span className="text-[10px] text-slate-400">Arrival date elapsed</span>
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setLeaveTab('ALL_ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                leaveTab === 'ALL_ACTIVE'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Active On Leave ({activeLeaves.length})
            </button>
            <button
              onClick={() => setLeaveTab('ARRIVING_TODAY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 flex items-center gap-1.5 ${
                leaveTab === 'ARRIVING_TODAY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Arriving Today ({arrivingTodayEntries.length})</span>
            </button>
            <button
              onClick={() => setLeaveTab('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                leaveTab === 'UPCOMING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Next 3 Days
            </button>
            <button
              onClick={() => setLeaveTab('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 flex items-center gap-1.5 ${
                leaveTab === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue ({overdueEntries.length})</span>
            </button>
            <button
              onClick={() => setLeaveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                leaveTab === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Records ({allLeaveEntries.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Rank Filter */}
            <select
              value={leaveRankFilter}
              onChange={(e) => setLeaveRankFilter(e.target.value as any)}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Ranks</option>
              <option value="Inspector">Inspector</option>
              <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
              <option value="ASI & PTC">ASI & PTC</option>
            </select>

            {/* Leave Type Filter (CL, CPL, OTHERS) */}
            <select
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value as any)}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Types</option>
              <option value="CL">CL</option>
              <option value="CPL">CPL</option>
              <option value="OTHERS">OTHERS</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search officer or station..."
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Leave Ledger Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <th className="py-2.5 px-3 font-bold">Officer Name & Rank</th>
                <th className="py-2.5 px-2.5 font-bold">Police Station</th>
                <th className="py-2.5 px-2.5 font-bold">Departure Date</th>
                <th className="py-2.5 px-2 text-center font-bold">Leave Duration</th>
                <th className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">Scheduled Arrival Date</th>
                <th className="py-2.5 px-3 font-bold">Arrival Timeline / Status</th>
                <th className="py-2.5 px-3 font-bold">Type & Remarks</th>
                <th className="py-2.5 px-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedLeaveEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No leave entries found matching current filter or search criteria.
                  </td>
                </tr>
              ) : (
                displayedLeaveEntries.map((item) => {
                  const statusInfo = getLeaveArrivalStatus(item.arrivalDate, item.status, todayStr);
                  const isTodayArrival = statusInfo.code === 'ARRIVING_TODAY';
                  const departureFormatted = formatIndianDate(item.departureDate);
                  const arrivalFormatted = formatIndianDate(item.arrivalDate);

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isTodayArrival
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Officer Name & Rank */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.officerName}</span>
                          {isTodayArrival && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          )}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-semibold">
                          {item.rank}
                        </span>
                      </td>

                      {/* Police Station */}
                      <td className="py-3 px-2.5 font-bold text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-[11px]">
                          {item.ps} PS
                        </span>
                      </td>

                      {/* Departure Date */}
                      <td className="py-3 px-2.5 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{departureFormatted}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold rounded text-[11px] border border-amber-200 dark:border-amber-800">
                          {item.daysOnLeave} Days
                        </span>
                      </td>

                      {/* Expected Arrival Date (Prominent!) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Clock4 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-black text-slate-900 dark:text-white text-xs underline decoration-emerald-500 decoration-2">
                              {arrivalFormatted}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              ({departureFormatted} + {item.daysOnLeave}d + 1d)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Timeline Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border ${statusInfo.badgeClass}`}>
                          {statusInfo.code === 'OVERDUE' && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
                          {statusInfo.code === 'ARRIVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Type & Remarks */}
                      <td className="py-3 px-3">
                        {(() => {
                          const normType = normalizeLeaveType(item.leaveType);
                          const badgeColor =
                            normType === 'CL'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : normType === 'CPL'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
                          return (
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold border ${badgeColor}`}>
                              {normType}
                            </span>
                          );
                        })()}
                        {item.remarks && (
                          <span className="block text-[10px] text-slate-400 italic truncate max-w-[140px]" title={item.remarks}>
                            {item.remarks}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        {!isReadOnly ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status !== 'ARRIVED' ? (
                              <button
                                type="button"
                                onClick={() => onUpdateLeaveStatus && onUpdateLeaveStatus(item.id, 'ARRIVED', todayStr)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Mark Officer as Returned / Arrived at Police Station"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Mark Arrived</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                  Arrived
                                </span>
                                {onUpdateLeaveStatus && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateLeaveStatus(item.id, 'ON_LEAVE')}
                                    className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                    title="Revert back to on leave"
                                  >
                                    Undo
                                  </button>
                                )}
                              </div>
                            )}

                            {onDeleteLeaveEntry && (
                              <button
                                type="button"
                                onClick={() => onDeleteLeaveEntry(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Officer on Duty (OD1, OD2, OD3) Highlights */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Today's Officer on Duty (OD) Roster
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            {(contextPS ? [contextPS] : ALL_PS).map((ps) => {
              const rep = todayReports.find((r) => r.ps === ps);
              const od = rep?.odDetails;

              return (
                <div
                  key={ps}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 w-28 shrink-0">
                    {ps} PS:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      OD1: {od?.od1IoName || 'Not Assigned'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                      OD2: {od?.od2IoName || '—'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                      OD3: {od?.od3IoName || '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GASTI (Patrol) Shifts Highlights */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Today's GASTI (Patrol) Deployment
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            {(contextPS ? [contextPS] : ALL_PS).map((ps) => {
              const rep = todayReports.find((r) => r.ps === ps);
              const gasti = rep?.gastiDetails;

              return (
                <div
                  key={ps}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 w-28 shrink-0">
                    {ps} PS:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      Morning: {gasti?.morningGastiIoName || 'On Route'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                      Day: {gasti?.dayGastiIoName || 'Scheduled'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
                      Night: {gasti?.nightGastiIoName || 'Scheduled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Super User Edit Monthly Arrest Override Modal */}
      {isEditingArrests && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <Edit3 className="w-4 h-4" />
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Super User Monthly Arrest Adjustment
                </span>
              </div>
              <button
                onClick={() => setIsEditingArrests(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              As SDPO (Super User), you can set or adjust the official monthly arresting figure for{' '}
              <strong>{contextPS ? `${contextPS} PS` : 'Subdivision'}</strong> for month{' '}
              <strong>{currentMonthKey}</strong>.
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Monthly Arrest Figure
              </label>
              <input
                type="number"
                min="0"
                value={customArrestInput}
                onChange={(e) => setCustomArrestInput(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-lg font-extrabold text-blue-700 dark:text-blue-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingArrests(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveArrestOverride}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm"
              >
                Save Official Figure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Officer Leave Modal */}
      {isAddLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Record Officer Departure on Leave</h3>
                  <p className="text-[11px] text-slate-400">Non-Constable Leave Ledger (Inspector, SI, ASI & PTC)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLeaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickLeave} className="p-5 space-y-4">
              {/* Police Station */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Police Station:
                </label>
                <select
                  value={newLeavePS}
                  onChange={(e) => {
                    const ps = e.target.value as PoliceStationName;
                    setNewLeavePS(ps);
                    setNewLeaveOfficerName('');
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                >
                  {ALL_PS.map((ps) => (
                    <option key={ps} value={ps}>
                      {ps} Police Station
                    </option>
                  ))}
                </select>
              </div>

              {/* Officer Selection & Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Officer:
                  </label>
                  {newLeaveAvailableOfficers.length > 0 ? (
                    <select
                      value={newLeaveOfficerName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setNewLeaveOfficerName(name);
                        const matchedIO = newLeaveAvailableOfficers.find((o) => o.name === name);
                        if (matchedIO) {
                          if (matchedIO.rank === 'Inspector') setNewLeaveRank('Inspector');
                          else if (matchedIO.rank === 'Sub-Inspector (SI)') setNewLeaveRank('Sub-Inspector (SI)');
                          else if (matchedIO.rank === 'Asst. Sub-Inspector (ASI)' || matchedIO.rank === 'PTC') setNewLeaveRank('ASI & PTC');
                        }
                      }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      required
                    >
                      <option value="">-- Choose Officer --</option>
                      {newLeaveAvailableOfficers.map((io) => (
                        <option key={io.id} value={io.name}>
                          {io.name} ({io.rank})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Officer Name..."
                      value={newLeaveOfficerName}
                      onChange={(e) => setNewLeaveOfficerName(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rank / Cadre:
                  </label>
                  <select
                    value={newLeaveRank}
                    onChange={(e) => setNewLeaveRank(e.target.value as OfficerLeaveRank)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="Inspector">Inspector</option>
                    <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                    <option value="ASI & PTC">ASI & PTC</option>
                  </select>
                </div>
              </div>

              {/* Departure Date & Days on Leave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departure Date:
                  </label>
                  <input
                    type="date"
                    value={newLeaveDepartureDate}
                    onChange={(e) => setNewLeaveDepartureDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Days on Leave:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={newLeaveDays}
                    onChange={(e) => setNewLeaveDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Auto-Computed Arrival Banner */}
              {newLeaveDepartureDate && newLeaveDays > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Calculated Expected Arrival Date:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                      {formatIndianDate(calculateArrivalDate(newLeaveDepartureDate, newLeaveDays))}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      (Arrival at Police Station)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Formula: Departed {formatIndianDate(newLeaveDepartureDate)} + {newLeaveDays} days on leave + 1 calendar day
                  </p>
                </div>
              )}

              {/* Leave Type & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Leave Type:
                  </label>
                  <select
                    value={newLeaveType}
                    onChange={(e) => setNewLeaveType(e.target.value as OfficerLeaveType)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="CL">CL (Casual Leave)</option>
                    <option value="CPL">CPL (Compensatory Leave)</option>
                    <option value="OTHERS">OTHERS (Other Leave)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Purpose:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Family affairs, Medical checkup"
                    value={newLeaveRemarks}
                    onChange={(e) => setNewLeaveRemarks(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Save to Leave Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
