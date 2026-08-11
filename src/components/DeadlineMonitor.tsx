import React, { useState } from 'react';
import { FIRCase, PoliceStationName } from '../types';
import { getDeadlineInfo, formatReadableDate } from '../utils/helpers';
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2, User, Building2, Eye, Edit3, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface DeadlineMonitorProps {
  cases: FIRCase[];
  onViewCase: (caseItem: FIRCase) => void;
  onEditCase: (caseItem: FIRCase) => void;
  isReadOnly?: boolean;
}

export const DeadlineMonitor: React.FC<DeadlineMonitorProps> = ({
  cases,
  onViewCase,
  onEditCase,
  isReadOnly = false,
}) => {
  const [limitFilter, setLimitFilter] = useState<'ALL' | '60' | '90'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'APPROACHING' | 'ON_TRACK' | 'COMPLETED'>('ALL');
  const [psFilter, setPsFilter] = useState<'ALL' | PoliceStationName>('ALL');

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (limitFilter !== 'ALL' && c.deadlineDays.toString() !== limitFilter) return false;
    if (psFilter !== 'ALL' && c.ps !== psFilter) return false;

    const info = getDeadlineInfo(c);
    if (statusFilter !== 'ALL' && info.code !== statusFilter) return false;

    return true;
  });

  // Calculate statistics
  let countOverdue = 0;
  let countApproaching = 0;
  let countOnTrack = 0;
  let countCompleted = 0;

  cases.forEach((c) => {
    const info = getDeadlineInfo(c);
    if (info.code === 'OVERDUE') countOverdue++;
    else if (info.code === 'APPROACHING') countApproaching++;
    else if (info.code === 'ON_TRACK') countOnTrack++;
    else if (info.code === 'COMPLETED') countCompleted++;
  });

  const handleExportExcel = () => {
    const headers = ['FIR No', 'Police Station', 'FIR Date', 'Sections', 'IO Name', 'Limit', 'Elapsed Days', 'Status'];
    const rows = filteredCases.map((c) => {
      const info = getDeadlineInfo(c);
      return [c.firNumber, `${c.ps} PS`, c.firDate, c.sections, c.ioName, `${c.deadlineDays} Days`, info.daysElapsed, info.label];
    });

    exportToExcel('60_90_Deadline_Monitor_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['FIR No & PS', 'FIR Date', 'Sections & Complainant', 'IO Name', 'Limit', 'Deadline Status'];
    const rows = filteredCases.map((c) => {
      const info = getDeadlineInfo(c);
      return [
        `FIR ${c.firNumber} (${c.ps} PS)`,
        c.firDate,
        `${c.sections} — ${c.complainantName}`,
        c.ioName,
        `${c.deadlineDays} Days`,
        info.label,
      ];
    });

    exportToPDF(
      '60 & 90 Days Statutory Deadline Monitoring Report',
      `Subdivision Investigation Deadline Audit (${filteredCases.length} Cases)`,
      headers,
      rows,
      [
        { label: 'Overdue Cases', value: countOverdue },
        { label: 'Urgent (<15d)', value: countApproaching },
        { label: 'On Track', value: countOnTrack },
      ]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded p-5 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-red-400 rounded border border-slate-700 font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">60 & 90 Days Statutory Deadline Monitor</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict CrPC / BNSS statutory investigation timeline tracking across Tarapur Subdivision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xls)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>

            <span className="bg-red-950/80 text-red-400 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded border border-red-900/60">
              {countOverdue} Overdue
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Left Border Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setStatusFilter('OVERDUE')}
          className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-500 shadow-sm cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
            <span>Overdue (&gt;60/90 Days)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{countOverdue}</div>
          <p className="text-[11px] text-slate-500 mt-1">Requires IO explanation & CS submission</p>
        </div>

        <div 
          onClick={() => setStatusFilter('APPROACHING')}
          className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-400 shadow-sm cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            <span>Approaching (&lt;15 Days Left)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{countApproaching}</div>
          <p className="text-[11px] text-slate-500 mt-1">Draft chargesheet requested</p>
        </div>

        <div 
          onClick={() => setStatusFilter('ON_TRACK')}
          className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            <span>On Track</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{countOnTrack}</div>
          <p className="text-[11px] text-slate-500 mt-1">Within normal timeline window</p>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 shadow-sm cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span>Chargesheeted / Submitted</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{countCompleted}</div>
          <p className="text-[11px] text-slate-500 mt-1">Court chargesheeted / Closed</p>
        </div>

      </div>

      {/* Filter Tabs & Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Statutory Category Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded">
          <button
            onClick={() => setLimitFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded transition ${
              limitFilter === 'ALL' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            All Limits
          </button>
          <button
            onClick={() => setLimitFilter('60')}
            className={`px-3 py-1 text-xs font-bold rounded transition ${
              limitFilter === '60' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            60 Days Only
          </button>
          <button
            onClick={() => setLimitFilter('90')}
            className={`px-3 py-1 text-xs font-bold rounded transition ${
              limitFilter === '90' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            90 Days Only
          </button>
        </div>

        {/* PS Dropdown */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Police Station:</span>
          <select
            value={psFilter}
            onChange={(e) => setPsFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 font-semibold text-xs"
          >
            <option value="ALL">All 4 Police Stations</option>
            <option value="Tarapur">Tarapur PS</option>
            <option value="Asarganj">Asarganj PS</option>
            <option value="Sangrampur">Sangrampur PS</option>
            <option value="Harpur">Harpur PS</option>
          </select>
        </div>

        {/* Clear Filter */}
        <button
          onClick={() => {
            setLimitFilter('ALL');
            setStatusFilter('ALL');
            setPsFilter('ALL');
          }}
          className="text-xs text-blue-600 hover:underline font-semibold"
        >
          Reset Filters
        </button>

      </div>

      {/* Deadline Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCases.map((c) => {
          const deadline = getDeadlineInfo(c);
          const percentElapsed = Math.min(100, Math.round((deadline.daysElapsed / c.deadlineDays) * 100));

          return (
            <div
              key={c.id}
              className={`bg-white dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-800 border-l-4 shadow-sm flex flex-col justify-between gap-3 ${
                deadline.code === 'OVERDUE'
                  ? 'border-l-red-500'
                  : deadline.code === 'APPROACHING'
                  ? 'border-l-amber-400'
                  : 'border-l-emerald-500'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded">
                      FIR {c.firNumber}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {c.ps} PS
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${deadline.badgeBg}`}>
                    {deadline.label}
                  </span>
                </div>

                {/* Sections & IO */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{c.sections}</p>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                    <span>Complainant: <strong>{c.complainantName}</strong></span>
                    <span>FIR Date: <strong>{formatReadableDate(c.firDate)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>IO: {c.ioName}</span>
                  </div>
                </div>

                {/* Days Progress Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500">
                      Elapsed: <strong className="text-slate-900 dark:text-white">{deadline.daysElapsed}</strong> / {c.deadlineDays} Days
                    </span>
                    <span className={deadline.code === 'OVERDUE' ? 'text-red-600 font-extrabold' : 'text-slate-700 dark:text-slate-300'}>
                      {percentElapsed}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded overflow-hidden">
                    <div
                      style={{ width: `${percentElapsed}%` }}
                      className={`h-full transition-all ${
                        deadline.code === 'OVERDUE'
                          ? 'bg-red-600'
                          : deadline.code === 'APPROACHING'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Supervision Directive */}
                {c.sdpoSupervisionNote && (
                  <p className="mt-2 text-[11px] bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium">
                    <strong>SDPO Order:</strong> {c.sdpoSupervisionNote}
                  </p>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onViewCase(c)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded hover:bg-slate-200 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => onEditCase(c)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Update Progress</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
