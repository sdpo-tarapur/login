import React, { useState, useMemo } from 'react';
import { FIRCase, PoliceStationName, CaseStatus, UserRole } from '../types';
import { formatReadableDate, getDeadlineInfo } from '../utils/helpers';
import { exportToExcel, exportToPDF } from '../utils/reportExport';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Edit3,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  FileText,
  MapPin,
  FolderOpen,
  FileSpreadsheet,
  Download,
  UserCheck,
  Hourglass,
} from 'lucide-react';

interface SupervisionStatusSectionProps {
  cases: FIRCase[];
  onEditCase: (c: FIRCase) => void;
  onViewCase: (c: FIRCase) => void;
  currentRole: UserRole;
  isReadOnly?: boolean;
}

export const SupervisionStatusSection: React.FC<SupervisionStatusSectionProps> = ({
  cases,
  onEditCase,
  onViewCase,
  currentRole,
  isReadOnly = false,
}) => {
  // Only SR Cases are supervised by SDPO
  const srCases = useMemo(() => cases.filter((c) => c.designation === 'SR'), [cases]);

  // Extract unique IO names for IO-wise filter
  const uniqueIOs = useMemo(() => {
    const set = new Set<string>();
    srCases.forEach((c) => {
      if (c.ioName) set.add(c.ioName);
    });
    return Array.from(set).sort();
  }, [srCases]);

  // Local Filter States
  const [psFilter, setPsFilter] = useState<PoliceStationName | 'ALL'>('ALL');
  const [deadlineLimitFilter, setDeadlineLimitFilter] = useState<'ALL' | '60' | '90'>('ALL');
  const [ioFilter, setIoFilter] = useState<string>('ALL');

  const [poVisitFilter, setPoVisitFilter] = useState<'ALL' | 'VISITED' | 'PENDING'>('ALL');
  const [supervisionFilter, setSupervisionFilter] = useState<'ALL' | 'ISSUED' | 'PENDING'>('ALL');
  const [prFilter, setPrFilter] = useState<'ALL' | 'ISSUED' | 'PENDING'>('ALL');
  const [finalPrFilter, setFinalPrFilter] = useState<'ALL' | 'ISSUED' | 'PENDING'>('ALL');
  const [caseReviewFilter, setCaseReviewFilter] = useState<'ALL' | 'REVIEWED' | 'PENDING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');

  // Date Range Filters
  const [firStartDate, setFirStartDate] = useState('');
  const [firEndDate, setFirEndDate] = useState('');

  const [supervisionStartDate, setSupervisionStartDate] = useState('');
  const [supervisionEndDate, setSupervisionEndDate] = useState('');
  
  const [finalPrStartDate, setFinalPrStartDate] = useState('');
  const [finalPrEndDate, setFinalPrEndDate] = useState('');

  const [prStartDate, setPrStartDate] = useState('');
  const [prEndDate, setPrEndDate] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Reset Filters
  const handleReset = () => {
    setPsFilter('ALL');
    setDeadlineLimitFilter('ALL');
    setIoFilter('ALL');
    setPoVisitFilter('ALL');
    setSupervisionFilter('ALL');
    setPrFilter('ALL');
    setFinalPrFilter('ALL');
    setCaseReviewFilter('ALL');
    setStatusFilter('ALL');
    setFirStartDate('');
    setFirEndDate('');
    setSupervisionStartDate('');
    setSupervisionEndDate('');
    setFinalPrStartDate('');
    setFinalPrEndDate('');
    setPrStartDate('');
    setPrEndDate('');
    setSearchQuery('');
  };

  // Filter Logic
  const filteredCases = useMemo(() => {
    return srCases.filter((c) => {
      // PS Filter
      if (psFilter !== 'ALL' && c.ps !== psFilter) return false;

      // 60/90 Days Limit Filter
      if (deadlineLimitFilter === '60' && c.deadlineDays !== 60) return false;
      if (deadlineLimitFilter === '90' && c.deadlineDays !== 90) return false;

      // IO Wise Filter
      if (ioFilter !== 'ALL' && c.ioName !== ioFilter) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      // FIR Registration Date Range
      if (firStartDate && c.firDate < firStartDate) return false;
      if (firEndDate && c.firDate > firEndDate) return false;

      // PO Visit Filter
      if (poVisitFilter === 'VISITED' && !c.poVisitDate) return false;
      if (poVisitFilter === 'PENDING' && c.poVisitDate) return false;

      // Supervision Note Status Filter
      if (supervisionFilter === 'ISSUED' && !c.supervisionDate) return false;
      if (supervisionFilter === 'PENDING' && c.supervisionDate) return false;

      // Supervision Note Date Range
      if (supervisionStartDate && (!c.supervisionDate || c.supervisionDate < supervisionStartDate)) return false;
      if (supervisionEndDate && (!c.supervisionDate || c.supervisionDate > supervisionEndDate)) return false;

      // PR Issued Status Filter
      const hasPr = Boolean(c.prDates && c.prDates.length > 0);
      if (prFilter === 'ISSUED' && !hasPr) return false;
      if (prFilter === 'PENDING' && hasPr) return false;

      // PR Date Range Filter (checks if any PR date falls in range)
      if (prStartDate || prEndDate) {
        if (!c.prDates || c.prDates.length === 0) return false;
        const inRange = c.prDates.some((d) => {
          if (prStartDate && d < prStartDate) return false;
          if (prEndDate && d > prEndDate) return false;
          return true;
        });
        if (!inRange) return false;
      }

      // Final PR Status Filter
      if (finalPrFilter === 'ISSUED' && !c.finalPrDate) return false;
      if (finalPrFilter === 'PENDING' && c.finalPrDate) return false;

      // Final PR Date Range
      if (finalPrStartDate && (!c.finalPrDate || c.finalPrDate < finalPrStartDate)) return false;
      if (finalPrEndDate && (!c.finalPrDate || c.finalPrDate > finalPrEndDate)) return false;

      // Case Review Filter
      const hasReview = Boolean(c.caseReviewDates && c.caseReviewDates.length > 0);
      if (caseReviewFilter === 'REVIEWED' && !hasReview) return false;
      if (caseReviewFilter === 'PENDING' && hasReview) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = c.firNumber.toLowerCase().includes(query);
        const matchesSections = c.sections.toLowerCase().includes(query);
        const matchesComplainant = c.complainantName.toLowerCase().includes(query);
        const matchesIO = c.ioName.toLowerCase().includes(query);
        const matchesPO = c.placeOfOccurrence.toLowerCase().includes(query);
        if (!matchesNumber && !matchesSections && !matchesComplainant && !matchesIO && !matchesPO) {
          return false;
        }
      }

      return true;
    });
  }, [
    srCases,
    psFilter,
    deadlineLimitFilter,
    ioFilter,
    statusFilter,
    firStartDate,
    firEndDate,
    poVisitFilter,
    supervisionFilter,
    supervisionStartDate,
    supervisionEndDate,
    prFilter,
    prStartDate,
    prEndDate,
    finalPrFilter,
    finalPrStartDate,
    finalPrEndDate,
    caseReviewFilter,
    searchQuery,
  ]);

  // Statistics Metrics
  const stats = useMemo(() => {
    const total = srCases.length;
    const poVisited = srCases.filter((c) => Boolean(c.poVisitDate)).length;
    const poPending = total - poVisited;

    const supervisionIssued = srCases.filter((c) => Boolean(c.supervisionDate)).length;
    const supervisionPending = total - supervisionIssued;

    const prIssuedCount = srCases.filter((c) => c.prDates && c.prDates.length > 0).length;
    const totalPrsCount = srCases.reduce((acc, c) => acc + (c.prDates?.length || 0), 0);

    const finalPrIssued = srCases.filter((c) => Boolean(c.finalPrDate)).length;
    
    const reviewedCount = srCases.filter((c) => c.caseReviewDates && c.caseReviewDates.length > 0).length;
    const totalReviewsCount = srCases.reduce((acc, c) => acc + (c.caseReviewDates?.length || 0), 0);

    return {
      total,
      poVisited,
      poPending,
      supervisionIssued,
      supervisionPending,
      prIssuedCount,
      totalPrsCount,
      finalPrIssued,
      reviewedCount,
      totalReviewsCount,
    };
  }, [srCases]);

  // Export Handlers
  const handleExportExcel = () => {
    const headers = [
      'FIR Number',
      'Police Station',
      'FIR Date',
      'Sections',
      'Complainant',
      'IO Name',
      'Limit',
      'PO Visit Date',
      'Supervision Date',
      'PR Dates',
      'Final PR Date',
      'Case Review Dates',
      'Status',
      'SDPO Supervision Note',
    ];

    const rows = filteredCases.map((c) => [
      c.firNumber,
      c.ps,
      c.firDate,
      c.sections,
      c.complainantName,
      c.ioName,
      `${c.deadlineDays} Days`,
      c.poVisitDate || 'Pending',
      c.supervisionDate || 'Pending',
      c.prDates && c.prDates.length > 0 ? c.prDates.join('; ') : 'None',
      c.finalPrDate || 'Pending',
      c.caseReviewDates && c.caseReviewDates.length > 0 ? c.caseReviewDates.join('; ') : 'None',
      c.status,
      c.sdpoSupervisionNote || 'N/A',
    ]);

    exportToExcel('SDPO_Supervision_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = [
      'FIR #',
      'PS',
      'FIR Date',
      'IO Name',
      'Limit',
      'PO Visit',
      'Supervision',
      'PR Dates',
      'Final PR',
      'Status',
    ];

    const rows = filteredCases.map((c) => [
      c.firNumber,
      c.ps,
      c.firDate,
      c.ioName,
      `${c.deadlineDays}d`,
      c.poVisitDate || 'Pending',
      c.supervisionDate || 'Pending',
      c.prDates && c.prDates.length > 0 ? c.prDates.join(', ') : '-',
      c.finalPrDate || 'Pending',
      c.status,
    ]);

    const badges = [
      { label: 'Supervised SR Cases', value: filteredCases.length },
      { label: 'PO Visited', value: filteredCases.filter((c) => c.poVisitDate).length },
      { label: 'Supervision Issued', value: filteredCases.filter((c) => c.supervisionDate).length },
      { label: 'Final PR Issued', value: filteredCases.filter((c) => c.finalPrDate).length },
    ];

    exportToPDF(
      'SPECIAL REPORT (SR) CASES SUPERVISION DOSSIER',
      'Official SDPO Supervision & Progress Monitoring Report',
      headers,
      rows,
      badges
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border border-purple-800/60 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-purple-600/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600/30 text-purple-300 rounded-2xl border border-purple-500/40 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  Super User Only
                </span>
                <span className="text-purple-300 text-xs font-mono font-bold">
                  SDPO Tarapur Command
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Special Report (SR) Cases Supervision Dashboard
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Comprehensive supervision tracking for all Special Report (SR) cases across Tarapur, Asarganj, Sangrampur, and Harpur Police Stations. Monitor PO Visit Dates, Supervision Notes, Progress Reports (PRs), Final PRs, and Case Reviews.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-purple-800/60 text-center">
              <div>
                <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">Supervised SR Cases</span>
                <span className="text-2xl font-black text-white">{stats.total}</span>
              </div>
            </div>

            {/* Export Buttons in Header */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                title="Export Filtered SR Supervision Cases to Excel / CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Export</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                title="Generate Printable PDF Supervision Report"
              >
                <Download className="w-4 h-4" />
                <span>Printable PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supervision KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Total SR */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total SR</span>
            <FolderOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Cases Under SDPO</span>
        </div>

        {/* PO Visit */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">PO Visit</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.poVisited}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.poPending > 0 ? `${stats.poPending} Pending Visit` : '100% Visited'}
          </span>
        </div>

        {/* Supervision Note */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Supervision</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.supervisionIssued}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.supervisionPending > 0 ? `${stats.supervisionPending} Pending Memo` : 'All Memos Issued'}
          </span>
        </div>

        {/* Progress Reports (PR) */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">PR Issued</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.prIssuedCount}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.totalPrsCount} Total PRs Logged
          </span>
        </div>

        {/* Final PR */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Final PR</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.finalPrIssued}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.total - stats.finalPrIssued} Pending Final PR
          </span>
        </div>

        {/* Case Reviews */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Case Reviews</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{stats.reviewedCount}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {stats.totalReviewsCount} Review Sessions
          </span>
        </div>
      </div>

      {/* Advanced Supervision Filter Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 text-purple-500" />
            <span>Advanced Supervision Case Filters</span>
            <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-purple-200 dark:border-purple-800">
              Showing {filteredCases.length} of {srCases.length} SR Cases
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Export</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-bold flex items-center gap-1 transition ml-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        </div>

        {/* Primary Filter Row 1: Search, PS, IO Wise, Statutory Limit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* Search Query */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FIR #, Section, Complainant, IO..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Police Station Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Police Station</label>
            <select
              value={psFilter}
              onChange={(e) => setPsFilter(e.target.value as PoliceStationName | 'ALL')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All Police Stations</option>
              <option value="Tarapur">Tarapur PS</option>
              <option value="Asarganj">Asarganj PS</option>
              <option value="Sangrampur">Sangrampur PS</option>
              <option value="Harpur">Harpur PS</option>
            </select>
          </div>

          {/* IO Wise Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">IO Wise Filter</label>
            <select
              value={ioFilter}
              onChange={(e) => setIoFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All Investigating Officers</option>
              {uniqueIOs.map((io) => (
                <option key={io} value={io}>
                  {io}
                </option>
              ))}
            </select>
          </div>

          {/* Statutory Limit (60 / 90 Days) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Statutory Limit</label>
            <select
              value={deadlineLimitFilter}
              onChange={(e) => setDeadlineLimitFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All Statutory Limits (60 & 90 Days)</option>
              <option value="60">60 Days Limit Cases</option>
              <option value="90">90 Days Limit Cases</option>
            </select>
          </div>

          {/* PO Visit Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">PO Visit Status</label>
            <select
              value={poVisitFilter}
              onChange={(e) => setPoVisitFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All PO Visit Status</option>
              <option value="VISITED">✓ PO Visited</option>
              <option value="PENDING">✕ Pending PO Visit</option>
            </select>
          </div>
        </div>

        {/* Primary Filter Row 2: Statuses */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Supervision Note Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Supervision Note Status</label>
            <select
              value={supervisionFilter}
              onChange={(e) => setSupervisionFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All Supervision Notes</option>
              <option value="ISSUED">✓ Note Issued</option>
              <option value="PENDING">✕ Pending Note</option>
            </select>
          </div>

          {/* PR Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Progress Report (PR) Status</label>
            <select
              value={prFilter}
              onChange={(e) => setPrFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All PR Status</option>
              <option value="ISSUED">✓ PR Issued</option>
              <option value="PENDING">✕ Pending PR</option>
            </select>
          </div>

          {/* Final PR Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Final PR Status</label>
            <select
              value={finalPrFilter}
              onChange={(e) => setFinalPrFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-1.5 text-slate-900 dark:text-white font-semibold"
            >
              <option value="ALL">All Final PR Status</option>
              <option value="ISSUED">✓ Final PR Issued</option>
              <option value="PENDING">✕ Pending Final PR</option>
            </select>
          </div>
        </div>

        {/* Date Range Filters Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
          
          {/* FIR Registration Date Range */}
          <div>
            <span className="font-bold text-[11px] text-amber-900 dark:text-amber-300 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>FIR Registration Date Range</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={firStartDate}
                onChange={(e) => setFirStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="Start"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={firEndDate}
                onChange={(e) => setFirEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="End"
              />
            </div>
          </div>

          {/* Supervision Note Date Range */}
          <div>
            <span className="font-bold text-[11px] text-purple-900 dark:text-purple-300 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>Supervision Note Date Range</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={supervisionStartDate}
                onChange={(e) => setSupervisionStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="Start"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={supervisionEndDate}
                onChange={(e) => setSupervisionEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="End"
              />
            </div>
          </div>

          {/* PR Date Range */}
          <div>
            <span className="font-bold text-[11px] text-blue-900 dark:text-blue-300 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>PR Date Range (Any PR)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={prStartDate}
                onChange={(e) => setPrStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="Start"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={prEndDate}
                onChange={(e) => setPrEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="End"
              />
            </div>
          </div>

          {/* Final PR Date Range */}
          <div>
            <span className="font-bold text-[11px] text-emerald-900 dark:text-emerald-300 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Final PR Date Range</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={finalPrStartDate}
                onChange={(e) => setFinalPrStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="Start"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={finalPrEndDate}
                onChange={(e) => setFinalPrEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-[11px] text-slate-900 dark:text-white"
                placeholder="End"
              />
            </div>
          </div>

        </div>

        {/* Quick Toggles: Case Review & Stage */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="font-bold text-slate-500">Case Review Status:</span>
          <button
            onClick={() => setCaseReviewFilter('ALL')}
            className={`px-2.5 py-0.5 rounded-full font-bold transition ${
              caseReviewFilter === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCaseReviewFilter('REVIEWED')}
            className={`px-2.5 py-0.5 rounded-full font-bold transition ${
              caseReviewFilter === 'REVIEWED'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ✓ Reviewed
          </button>
          <button
            onClick={() => setCaseReviewFilter('PENDING')}
            className={`px-2.5 py-0.5 rounded-full font-bold transition ${
              caseReviewFilter === 'PENDING'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ✕ Review Pending
          </button>

          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-2 hidden sm:block"></div>

          <span className="font-bold text-slate-500">Stage:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-0.5 rounded-full font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('Under Investigation')}
            className={`px-2.5 py-0.5 rounded-full font-bold transition ${
              statusFilter === 'Under Investigation'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Under Investigation
          </button>
          <button
            onClick={() => setStatusFilter('Chargesheeted / Final Form Submitted')}
            className={`px-2.5 py-0.5 rounded-full font-bold transition ${
              statusFilter === 'Chargesheeted / Final Form Submitted'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Chargesheeted
          </button>
        </div>
      </div>

      {/* Supervision SR Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Special Report (SR) Cases Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No SR cases match the current filter criteria. Try clearing or adjusting your supervision filters.
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow hover:bg-purple-700 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredCases.map((c) => {
            const deadline = getDeadlineInfo(c);

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">
                      FIR {c.firNumber}
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-2.5 py-0.5 rounded border border-amber-500/40">
                      {c.ps} PS
                    </span>
                    <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      ⭐ Special Report (SR)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      FIR Date: <strong>{formatReadableDate(c.firDate)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${deadline.badgeBg}`}>
                      {deadline.label} ({c.deadlineDays} Days Limit)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'Under Investigation'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                {/* Primary Case Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sections</span>
                    <p className="font-bold text-slate-900 dark:text-white">{c.sections}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Complainant</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {c.complainantName} {c.complainantPhone && `(${c.complainantPhone})`}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Investigating Officer (IO)</span>
                    <p className="font-extrabold text-amber-600 dark:text-amber-400">{c.ioName}</p>
                  </div>
                </div>

                {/* Supervision Dates & Milestone Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                  {/* PO Visit Date */}
                  <div className={`p-2.5 rounded-xl border ${
                    c.poVisitDate
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                  }`}>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 block">
                      PO Visit Date
                    </span>
                    <div className="font-extrabold mt-0.5 flex items-center gap-1">
                      {c.poVisitDate ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-900 dark:text-emerald-300">{formatReadableDate(c.poVisitDate)}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-rose-700 dark:text-rose-400">✕ Pending Visit</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Supervision Date */}
                  <div className={`p-2.5 rounded-xl border ${
                    c.supervisionDate
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                  }`}>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 block">
                      Supervision Date
                    </span>
                    <div className="font-extrabold mt-0.5 flex items-center gap-1">
                      {c.supervisionDate ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="text-purple-900 dark:text-purple-300">{formatReadableDate(c.supervisionDate)}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-amber-700 dark:text-amber-400">✕ Pending Note</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PR Dates */}
                  <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 block">
                      Progress Reports (PR)
                    </span>
                    <div className="font-bold mt-0.5">
                      {c.prDates && c.prDates.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.prDates.map((d, idx) => (
                            <span key={d} className="bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 font-extrabold text-[10px] px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-700">
                              PR#{idx+1}: {formatReadableDate(d)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No PR issued</span>
                      )}
                    </div>
                  </div>

                  {/* Final PR Date */}
                  <div className={`p-2.5 rounded-xl border ${
                    c.finalPrDate
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 block">
                      Final PR Date
                    </span>
                    <div className="font-extrabold mt-0.5">
                      {c.finalPrDate ? (
                        <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{formatReadableDate(c.finalPrDate)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pending Final PR</span>
                      )}
                    </div>
                  </div>

                  {/* Case Review Dates */}
                  <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 block">
                      Case Reviews
                    </span>
                    <div className="font-bold mt-0.5">
                      {c.caseReviewDates && c.caseReviewDates.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.caseReviewDates.map((d, idx) => (
                            <span key={d} className="bg-blue-100 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200 font-extrabold text-[10px] px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-700">
                              Rev#{idx+1}: {formatReadableDate(d)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No review dates</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SDPO Note Preview */}
                {c.sdpoSupervisionNote && (
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block mb-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                      <span>SDPO Directive Memo:</span>
                    </span>
                    <p className="text-slate-800 dark:text-purple-100 font-medium italic">
                      "{c.sdpoSupervisionNote}"
                    </p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    CCTNS Sync: <strong>{c.chargesheetUploadedCCTNS ? 'CS Uploaded' : 'CS Pending'}</strong> •{' '}
                    <strong>{c.caseDiaryUploadedCCTNS ? 'CD Synced' : 'CD Pending'}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewCase(c)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Dossier</span>
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => onEditCase(c)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Case & Dates</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
