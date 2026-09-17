import React, { useState, useMemo } from 'react';
import {
  DailyCrimeReport,
  InvestigatingOfficer,
  PoliceStationName,
  UserRole,
} from '../types';
import {
  formatReadableDate,
  formatIndianDate,
} from '../utils/helpers';
import {
  extractAllDutyRecords,
  filterDutyRecords,
  categorizeDutyTime,
  DutyRosterEntry,
  DutyTimeCategory,
} from '../utils/dutyHelpers';
import {
  Calendar,
  Clock,
  Car,
  Shield,
  Search,
  Filter,
  Users,
  FileSpreadsheet,
  Printer,
  Eye,
  RotateCcw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Wine,
  FileText,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShieldAlert,
  Moon,
  Sun,
  Sunset,
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface DailyReportHistoricalRegisterProps {
  reports: DailyCrimeReport[];
  investigatingOfficers: InvestigatingOfficer[];
  currentRole: UserRole;
  activePS?: PoliceStationName | null;
  onViewReport: (report: DailyCrimeReport) => void;
  onSelectIOForProfile?: (ioName: string) => void;
}

export const DailyReportHistoricalRegister: React.FC<DailyReportHistoricalRegisterProps> = ({
  reports,
  investigatingOfficers,
  currentRole,
  activePS,
  onViewReport,
  onSelectIOForProfile,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Primary Mode: 'date-lookup' (particular date across all PS) OR 'io-duty-range' (IO-wise OD & Gasti duty search)
  const [viewMode, setViewMode] = useState<'date-lookup' | 'io-duty-range'>('date-lookup');

  // --- 1. SINGLE DATE LOOKUP STATE ---
  const [selectedSingleDate, setSelectedSingleDate] = useState<string>(todayStr);

  // --- 2. DATE RANGE & IO DUTY FILTER STATE ---
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedStation, setSelectedStation] = useState<string>(activePS || 'ALL');
  const [selectedIoName, setSelectedIoName] = useState<string>('ALL');
  const [selectedDutyType, setSelectedDutyType] = useState<'ALL' | 'OD' | 'GASTI'>('ALL');
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<DutyTimeCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all unified duty records from all daily reports
  const allDutyRecords = useMemo(() => {
    return extractAllDutyRecords(reports);
  }, [reports]);

  // Filtered duty records based on selected date range & parameters
  const filteredDutyRecords = useMemo(() => {
    return filterDutyRecords(allDutyRecords, {
      startDate,
      endDate,
      policeStation: selectedStation,
      ioName: selectedIoName,
      dutyType: selectedDutyType,
      timeCategory: selectedTimeCategory,
      searchQuery,
    });
  }, [allDutyRecords, startDate, endDate, selectedStation, selectedIoName, selectedDutyType, selectedTimeCategory, searchQuery]);

  // Statistics for Duty Register
  const dutyStats = useMemo(() => {
    const total = filteredDutyRecords.length;
    const odCount = filteredDutyRecords.filter((d) => d.dutyType === 'OD').length;
    const gastiCount = filteredDutyRecords.filter((d) => d.dutyType === 'GASTI').length;
    const nightCount = filteredDutyRecords.filter((d) => categorizeDutyTime(d.timeSlot, d.shiftName) === 'NIGHT').length;
    const uniqueOfficers = new Set(filteredDutyRecords.map((d) => d.ioName.toLowerCase())).size;

    return { total, odCount, gastiCount, nightCount, uniqueOfficers };
  }, [filteredDutyRecords]);

  // Reports matching the Single Date Lookup
  const singleDateReports = useMemo(() => {
    const matched = reports.filter((r) => r.date === selectedSingleDate);
    if (activePS) {
      return matched.filter((r) => r.ps === activePS);
    }
    return matched;
  }, [reports, selectedSingleDate, activePS]);

  // Single date summary stats
  const singleDateStats = useMemo(() => {
    const totalReports = singleDateReports.length;
    const totalFirs = singleDateReports.reduce((acc, curr) => acc + curr.firsRegisteredCount, 0);
    const totalArrests = singleDateReports.reduce((acc, curr) => acc + curr.arrestsCount, 0);
    const totalLiquorArrests = singleDateReports.reduce(
      (acc, curr) => acc + (curr.arrestDetails?.liquorArrestsCount || 0),
      0
    );
    const stationsReported = singleDateReports.map((r) => r.ps);
    const missingStations: PoliceStationName[] = (['Tarapur', 'Asarganj', 'Sangrampur', 'Harpur'] as PoliceStationName[]).filter(
      (ps) => !stationsReported.includes(ps)
    );

    return { totalReports, totalFirs, totalArrests, totalLiquorArrests, stationsReported, missingStations };
  }, [singleDateReports]);

  // Quick date jump helpers
  const handleJumpDate = (offsetDays: number) => {
    const d = new Date(selectedSingleDate);
    d.setDate(d.getDate() + offsetDays);
    setSelectedSingleDate(d.toISOString().split('T')[0]);
  };

  // Quick Preset Date Ranges
  const handleSetPresetRange = (preset: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'last30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(startOfMonth);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('2025-01-01');
      setEndDate('2027-12-31');
    }
  };

  const handleResetFilters = () => {
    setStartDate(() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    });
    setEndDate(todayStr);
    setSelectedStation(activePS || 'ALL');
    setSelectedIoName('ALL');
    setSelectedDutyType('ALL');
    setSelectedTimeCategory('ALL');
    setSearchQuery('');
  };

  // Export IO Duty Register to Excel
  const handleExportDutyExcel = () => {
    const headers = [
      'Report Date',
      'Police Station',
      'Officer Name',
      'Duty Type (OD / GASTI)',
      'Shift / Role',
      'Time Slot',
      'Time Category',
      'Sector / Area',
      'Vehicle Number',
      'Force Count',
      'Remarks',
      'Submitted By',
    ];

    const rows = filteredDutyRecords.map((r) => [
      r.date,
      `${r.ps} PS`,
      r.ioName,
      r.dutyType,
      r.shiftName,
      r.timeSlot,
      categorizeDutyTime(r.timeSlot, r.shiftName),
      r.sectorArea || 'N/A',
      r.vehicleNumber || 'N/A',
      r.forceCount || 0,
      r.remarks || 'None',
      r.submittedBy,
    ]);

    exportToExcel(`IO_Duty_And_Gasti_Register_${startDate}_to_${endDate}`, headers, rows);
  };

  // Export IO Duty Register to PDF
  const handleExportDutyPDF = () => {
    const headers = ['Date & Station', 'Officer Name', 'Duty Type & Shift', 'Time Slot', 'Sector / Vehicle', 'Remarks'];
    const rows = filteredDutyRecords.map((r) => [
      `${formatReadableDate(r.date)}\n${r.ps} PS`,
      r.ioName,
      `${r.dutyType === 'OD' ? '🛡️ OD' : '🚓 GASTI'}: ${r.shiftName}`,
      r.timeSlot,
      `${r.sectorArea ? `Sector: ${r.sectorArea}` : ''}${r.vehicleNumber ? ` (Veh: ${r.vehicleNumber})` : 'Station Base'}`,
      r.remarks || 'Routine Duty',
    ]);

    exportToPDF(
      'Subdivision IO Duty & Gasti Historical Register',
      `Period: ${formatReadableDate(startDate)} to ${formatReadableDate(endDate)} | Total Shifts: ${filteredDutyRecords.length}`,
      headers,
      rows,
      [
        { label: 'Total Shifts', value: dutyStats.total },
        { label: 'OD Shifts', value: dutyStats.odCount },
        { label: 'Gasti Patrols', value: dutyStats.gastiCount },
        { label: 'Night Shifts', value: dutyStats.nightCount },
      ]
    );
  };

  // Export Single Date Consolidated Register to PDF
  const handleExportSingleDatePDF = () => {
    const headers = ['Police Station', 'FIRs Registered', 'Officer on Duty (OD)', 'Gasti Patrols', 'Arrests', 'Seizures & Remarks'];
    const rows = singleDateReports.map((r) => {
      const firDetails = r.registeredFirs && r.registeredFirs.length > 0
        ? r.registeredFirs.map((f) => `FIR ${f.firNumber} (${f.sections})`).join('\n')
        : 'Nil';

      const odText = r.odDetails?.odShifts && r.odDetails.odShifts.length > 0
        ? r.odDetails.odShifts.map((s) => `${s.shiftName} (${s.timeSlot}): ${s.ioName}`).join('\n')
        : `OD1: ${r.odDetails?.od1IoName || '—'}\nOD2: ${r.odDetails?.od2IoName || '—'}`;

      const gastiText = r.gastiDetails?.gastiShifts && r.gastiDetails.gastiShifts.length > 0
        ? r.gastiDetails.gastiShifts.map((s) => `${s.shiftName} (${s.timeSlot}): ${s.ioName}`).join('\n')
        : `M: ${r.gastiDetails?.morningGastiIoName || '—'}\nN: ${r.gastiDetails?.nightGastiIoName || '—'}`;

      return [
        `${r.ps} PS\n(By: ${r.submittedBy})`,
        `${r.firsRegisteredCount} FIRs\n${firDetails}`,
        odText,
        gastiText,
        `Total: ${r.arrestsCount} (Liquor: ${r.arrestDetails?.liquorArrestsCount || 0})`,
        `${r.seizuresSummary ? `Seiz: ${r.seizuresSummary}\n` : ''}${r.majorIncidentsNotes || 'Routine'}`,
      ];
    });

    exportToPDF(
      `Subdivision Daily Police Register — ${formatReadableDate(selectedSingleDate)}`,
      `Consolidated Daily Reports from ${singleDateReports.length} Police Stations`,
      headers,
      rows,
      [
        { label: 'Report Date', value: formatIndianDate(selectedSingleDate) },
        { label: 'Stations Logged', value: singleDateStats.stationsReported.join(', ') || 'None' },
        { label: 'Total FIRs', value: singleDateStats.totalFirs },
        { label: 'Total Arrests', value: singleDateStats.totalArrests },
      ]
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900 text-white rounded-xl p-4.5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Subdivision Historical Register & IO Duty Search
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                Date Wise & IO Linked
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant date lookup across all police stations and cross-sectional IO duty and patrol time analysis
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setViewMode('date-lookup')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-bold text-xs transition cursor-pointer ${
              viewMode === 'date-lookup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Particular Date Lookup</span>
          </button>

          <button
            onClick={() => setViewMode('io-duty-range')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-bold text-xs transition cursor-pointer ${
              viewMode === 'io-duty-range'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>IO-Wise OD & Gasti Roster ({allDutyRecords.length} Shifts)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PARTICULAR DATE LOOKUP                                            */}
      {/* ========================================================================= */}
      {viewMode === 'date-lookup' && (
        <div className="space-y-5">
          {/* Date Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Select Any Particular Date:
              </span>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleJumpDate(-1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <input
                  type="date"
                  value={selectedSingleDate}
                  onChange={(e) => setSelectedSingleDate(e.target.value)}
                  className="bg-transparent font-extrabold text-sm text-slate-900 dark:text-white px-2 py-0.5 outline-none cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleJumpDate(1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedSingleDate(todayStr)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    selectedSingleDate === todayStr
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setSelectedSingleDate(y.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md text-[11px] font-bold cursor-pointer"
                >
                  Yesterday
                </button>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportSingleDatePDF}
                disabled={singleDateReports.length === 0}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Daily Register</span>
              </button>
            </div>
          </div>

          {/* Date Summary Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Stations Logged on Date
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center justify-between">
                <span>{singleDateStats.totalReports} / 4 PS</span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {singleDateStats.totalReports === 4 ? '100% Complete' : `${singleDateStats.totalReports * 25}%`}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {singleDateStats.stationsReported.length > 0
                  ? `Reported: ${singleDateStats.stationsReported.join(', ')}`
                  : 'No station reports submitted'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Total FIRs Registered
              </span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {singleDateStats.totalFirs}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Across all reporting police stations
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Total Arrests Made
              </span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 flex items-baseline gap-2">
                <span>{singleDateStats.totalArrests}</span>
                {singleDateStats.totalLiquorArrests > 0 && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    ({singleDateStats.totalLiquorArrests} Liquor)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Liquor & non-liquor arrests recorded
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Selected Date
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{formatIndianDate(selectedSingleDate)}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {formatReadableDate(selectedSingleDate)}
              </div>
            </div>
          </div>

          {/* Missing Station Alert */}
          {singleDateStats.missingStations.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Pending Daily Report Submissions ({singleDateStats.missingStations.length} PS):</strong>{' '}
                  {singleDateStats.missingStations.map((ps) => `${ps} PS`).join(', ')} did not submit a report for {formatIndianDate(selectedSingleDate)}.
                </span>
              </div>
            </div>
          )}

          {/* Side-by-side or Stacked Station Reports on this Date */}
          {singleDateReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                No Police Station Reports Logged for {formatIndianDate(selectedSingleDate)}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Use the date selector above to jump to another date, or submit a new daily report for this date via the "Submit Daily Report" button.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {singleDateReports.map((r) => {
                const liquorArrests = r.arrestDetails?.liquorArrestsCount || 0;

                // Extract OD list
                const odList = r.odDetails?.odShifts && r.odDetails.odShifts.length > 0
                  ? r.odDetails.odShifts
                  : [
                      { shiftName: 'OD 1 (Day Shift)', timeSlot: '06:00 - 14:00', ioName: r.odDetails?.od1IoName || '' },
                      { shiftName: 'OD 2 (Evening Shift)', timeSlot: '14:00 - 22:00', ioName: r.odDetails?.od2IoName || '' },
                      { shiftName: 'OD 3 (Night Shift)', timeSlot: '22:00 - 06:00', ioName: r.odDetails?.od3IoName || '' },
                    ].filter((s) => s.ioName);

                // Extract Gasti list
                const gastiList = r.gastiDetails?.gastiShifts && r.gastiDetails.gastiShifts.length > 0
                  ? r.gastiDetails.gastiShifts
                  : [
                      { shiftName: 'Morning Gasti', timeSlot: '06:00 - 14:00', ioName: r.gastiDetails?.morningGastiIoName || '', sectorArea: '', vehicleNumber: '' },
                      { shiftName: 'Day / Mobile Gasti', timeSlot: '14:00 - 22:00', ioName: r.gastiDetails?.dayGastiIoName || '', sectorArea: '', vehicleNumber: '' },
                      { shiftName: 'Night Gasti / Nakabandi', timeSlot: '22:00 - 06:00', ioName: r.gastiDetails?.nightGastiIoName || '', sectorArea: '', vehicleNumber: '' },
                    ].filter((s) => s.ioName);

                return (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-300 dark:hover:border-blue-800 transition"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white font-black text-xs rounded-md shadow-xs">
                          {r.ps} PS Daily Record
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Logged by: {r.submittedBy}
                        </span>
                      </div>

                      <button
                        onClick={() => onViewReport(r)}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-900 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Breakdown</span>
                      </button>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">FIRs Logged</span>
                        <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {r.firsRegisteredCount} FIR{r.firsRegisteredCount === 1 ? '' : 's'}
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Arrests (Last 24h)</span>
                        <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                          {r.arrestsCount} {liquorArrests > 0 ? `(${liquorArrests} Liq)` : ''}
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Force Present</span>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {r.rankStrengths && r.rankStrengths.length > 0
                            ? `${r.rankStrengths.reduce((acc, s) => acc + s.present, 0)} Officers`
                            : 'Standard'}
                        </div>
                      </div>
                    </div>

                    {/* FIR Details snippet */}
                    {r.registeredFirs && r.registeredFirs.length > 0 && (
                      <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/60 text-xs">
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>FIRs Registered on this Date:</span>
                        </div>
                        <div className="space-y-1">
                          {r.registeredFirs.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-indigo-950 dark:text-indigo-200 font-medium">
                              <span>
                                <strong>FIR {f.firNumber}</strong> — {f.sections}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                IO: {f.ioName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OD (Officer on Duty) Schedule */}
                    <div className="space-y-1.5 text-xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Officer on Duty (OD) Shift Roster:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {odList.map((od, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-md"
                          >
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block uppercase">
                              {od.shiftName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {od.timeSlot}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white text-[11px] truncate block mt-0.5">
                              {od.ioName || 'Not Assigned'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GASTI (Patrol) Schedule */}
                    <div className="space-y-1.5 text-xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        <span>Gasti (Patrol) Shift & Sector Roster:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {gastiList.map((g, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-md"
                          >
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                              {g.shiftName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {g.timeSlot}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white text-[11px] truncate block mt-0.5">
                              {g.ioName || 'Routine'}
                            </span>
                            {g.sectorArea && (
                              <span className="text-[9px] text-slate-500 truncate block">
                                Zone: {g.sectorArea}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes and Seizures */}
                    {(r.seizuresSummary || r.majorIncidentsNotes) && (
                      <div className="text-[11px] space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {r.seizuresSummary && (
                          <div>
                            <strong className="text-emerald-700 dark:text-emerald-400">Seizures:</strong> {r.seizuresSummary}
                          </div>
                        )}
                        {r.majorIncidentsNotes && (
                          <div>
                            <strong className="text-amber-700 dark:text-amber-400">Notes:</strong> {r.majorIncidentsNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: IO-WISE OD & GASTI DUTY REGISTER (WITH DATE RANGE & FILTERS)       */}
      {/* ========================================================================= */}
      {viewMode === 'io-duty-range' && (
        <div className="space-y-5">
          {/* Multi-Parameter Filter Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            {/* Row 1: Date Range & Quick Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Date Range:
                </span>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Quick Preset Range Pills */}
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('today')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md font-bold cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('yesterday')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md font-bold cursor-pointer"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('last7')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md font-bold cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('last30')}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-md font-bold cursor-pointer"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('thisMonth')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md font-bold cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('all')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-md font-bold cursor-pointer"
                >
                  All Records
                </button>
              </div>
            </div>

            {/* Row 2: PS, IO, Duty Type, Time Slot, and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              
              {/* 1. Police Station */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Police Station:
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Police Stations</option>
                  <option value="Tarapur">Tarapur PS</option>
                  <option value="Asarganj">Asarganj PS</option>
                  <option value="Sangrampur">Sangrampur PS</option>
                  <option value="Harpur">Harpur PS</option>
                </select>
              </div>

              {/* 2. IO Name (Linked with IO Management) */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Investigating Officer (IO):</span>
                </label>
                <select
                  value={selectedIoName}
                  onChange={(e) => setSelectedIoName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Investigating Officers ({investigatingOfficers.length})</option>
                  {investigatingOfficers.map((io) => (
                    <option key={io.id} value={io.name}>
                      {io.name} ({io.rank} - {io.ps})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Duty Type */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Duty Type:
                </label>
                <select
                  value={selectedDutyType}
                  onChange={(e) => setSelectedDutyType(e.target.value as 'ALL' | 'OD' | 'GASTI')}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Duty Types (OD & Gasti)</option>
                  <option value="OD">🛡️ Officer on Duty (OD / Station)</option>
                  <option value="GASTI">🚓 Gasti (Patrol / Mobile / Naka)</option>
                </select>
              </div>

              {/* 4. Time Slot / Shift Category */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Time Slot / Shift Category:
                </label>
                <select
                  value={selectedTimeCategory}
                  onChange={(e) => setSelectedTimeCategory(e.target.value as DutyTimeCategory)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Shift Times</option>
                  <option value="MORNING">🌅 Morning (06:00 - 14:00)</option>
                  <option value="DAY_EVENING">☀️ Day / Evening (14:00 - 22:00)</option>
                  <option value="NIGHT">🌙 Night / Nakabandi (22:00 - 06:00)</option>
                </select>
              </div>

              {/* 5. Search Bar */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Keyword / Sector Search:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search officer, sector, vehicle..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Actions: Reset & Export */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  Showing <strong>{filteredDutyRecords.length}</strong> duty records from{' '}
                  <strong>{formatReadableDate(startDate)}</strong> to <strong>{formatReadableDate(endDate)}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportDutyExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDutyPDF}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Analytical Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Total Duty Shifts
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {dutyStats.total}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                In selected date range
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>OD (Station Duty)</span>
              </span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {dutyStats.odCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Officer on Duty shifts
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                <Car className="w-3 h-3" />
                <span>Gasti (Patrol)</span>
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {dutyStats.gastiCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Mobile & sector patrols
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block flex items-center gap-1">
                <Moon className="w-3 h-3" />
                <span>Night / Naka Duties</span>
              </span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {dutyStats.nightCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                22:00 to 06:00 window
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Unique Officers</span>
              </span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {dutyStats.uniqueOfficers}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Active on duty rosters
              </div>
            </div>
          </div>

          {/* Chronological Detailed Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Police Station</th>
                    <th className="p-3">Investigating Officer (IO)</th>
                    <th className="p-3">Duty Type</th>
                    <th className="p-3">Shift & Role</th>
                    <th className="p-3">Time Slot</th>
                    <th className="p-3">Sector / Vehicle</th>
                    <th className="p-3">Remarks / Force</th>
                    <th className="p-3 text-right">Daily Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {filteredDutyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-xs">
                          No duty records found matching the selected date range and filter criteria.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDutyRecords.map((d) => {
                      const isOD = d.dutyType === 'OD';
                      const timeCat = categorizeDutyTime(d.timeSlot, d.shiftName);
                      const parentReport = reports.find((r) => r.id === d.reportId);

                      return (
                        <tr
                          key={d.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                        >
                          {/* Date */}
                          <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatIndianDate(d.date)}
                            </span>
                          </td>

                          {/* Police Station */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                              {d.ps} PS
                            </span>
                          </td>

                          {/* IO Name (Clickable link to IO Management) */}
                          <td className="p-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{d.ioName}</span>
                              {onSelectIOForProfile && (
                                <button
                                  type="button"
                                  onClick={() => onSelectIOForProfile(d.ioName)}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                                  title="View IO Profile in IO Management"
                                >
                                  [Profile]
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Duty Type Badge */}
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase inline-flex items-center gap-1 ${
                                isOD
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {isOD ? <Clock className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                              <span>{d.dutyType}</span>
                            </span>
                          </td>

                          {/* Shift Name */}
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {d.shiftName}
                          </td>

                          {/* Time Slot */}
                          <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 ${
                                timeCat === 'NIGHT'
                                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                                  : timeCat === 'MORNING'
                                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {timeCat === 'NIGHT' ? (
                                <Moon className="w-3 h-3" />
                              ) : timeCat === 'MORNING' ? (
                                <Sun className="w-3 h-3" />
                              ) : (
                                <Sunset className="w-3 h-3" />
                              )}
                              <span>{d.timeSlot}</span>
                            </span>
                          </td>

                          {/* Sector / Vehicle */}
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {d.sectorArea || d.vehicleNumber ? (
                              <div className="space-y-0.5">
                                {d.sectorArea && <div>Zone: <strong>{d.sectorArea}</strong></div>}
                                {d.vehicleNumber && <div className="text-[10px] font-mono">Veh: {d.vehicleNumber}</div>}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Station Base</span>
                            )}
                          </td>

                          {/* Remarks / Force */}
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {d.remarks ? (
                              <span>{d.remarks}</span>
                            ) : d.forceCount ? (
                              <span>With {d.forceCount} force personnel</span>
                            ) : (
                              <span className="text-slate-400 italic">Routine Shift</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="p-3 text-right whitespace-nowrap">
                            {parentReport ? (
                              <button
                                type="button"
                                onClick={() => onViewReport(parentReport)}
                                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded text-[11px] font-bold border border-blue-200 dark:border-blue-900 cursor-pointer"
                              >
                                View PS Report
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
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
        </div>
      )}
    </div>
  );
};
