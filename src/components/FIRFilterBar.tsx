import React, { useState, useRef, useEffect } from 'react';
import { FilterOptions, PoliceStationName, CaseDesignation, CaseStatus, InvestigatingOfficer, FIRCase } from '../types';
import { Search, RotateCcw, Calendar, Check, ChevronDown, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface FIRFilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
  investigatingOfficers: InvestigatingOfficer[];
  hidePSFilter?: boolean;
  filteredCases: FIRCase[];
  activePS?: PoliceStationName | null;
}

export const FIRFilterBar: React.FC<FIRFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  investigatingOfficers,
  hidePSFilter = false,
  filteredCases,
  activePS,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const policeStations = filters.policeStations || [];
  const statuses = filters.statuses || [];
  const designations = filters.designations || [];
  const deadlineCategories = filters.deadlineCategories || [];
  const ioNames = filters.ioNames || [];

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Toggle multi-select array values
  const toggleArrayItem = <T,>(key: keyof FilterOptions, currentArray: T[] = [], item: T) => {
    const exists = currentArray.includes(item);
    const newArray = exists ? currentArray.filter((i) => i !== item) : [...currentArray, item];
    onFilterChange({ ...filters, [key]: newArray });
  };

  const allPSOptions: PoliceStationName[] = ['Tarapur', 'Asarganj', 'Sangrampur', 'Harpur'];
  const allDesignationOptions: { label: string; value: CaseDesignation }[] = [
    { label: 'SR Cases (SDPO)', value: 'SR' },
    { label: 'NON-SR Cases (CI)', value: 'NON_SR' },
    { label: 'Unassigned / Pending', value: 'PENDING_DESIGNATION' },
  ];
  const allStatusOptions: CaseStatus[] = [
    'Under Investigation',
    'Chargesheeted / Final Form Submitted',
    'False Case / Mistake of Fact',
  ];
  const allLimitOptions: { label: string; value: 60 | 90 }[] = [
    { label: '60 Days Limit', value: 60 },
    { label: '90 Days Limit', value: 90 },
  ];

  // Report Export Handlers
  const handleExportExcel = () => {
    const headers = [
      'FIR No',
      'Police Station',
      'FIR Date',
      'Sections',
      'Complainant',
      'IO Name',
      'Classification',
      'Statutory Limit',
      'Status',
      'Chargesheet No',
      'CCTNS Chargesheet Sync',
      'CCTNS Case Diary Sync',
    ];

    const rows = filteredCases.map((c) => [
      c.firNumber,
      `${c.ps} PS`,
      c.firDate,
      c.sections,
      c.complainantName,
      c.ioName,
      c.designation,
      `${c.deadlineDays} Days`,
      c.status,
      c.chargesheetNumber || 'N/A',
      c.chargesheetUploadedCCTNS ? 'YES' : 'NO',
      c.caseDiaryUploadedCCTNS ? 'YES' : 'NO',
    ]);

    exportToExcel('FIR_Records_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['FIR No & PS', 'FIR Date', 'Sections & Complainant', 'IO Name', 'Type', 'Status', 'CCTNS'];
    const rows = filteredCases.map((c) => [
      `FIR ${c.firNumber} (${c.ps} PS)`,
      c.firDate,
      `${c.sections} — ${c.complainantName}`,
      c.ioName,
      c.designation,
      c.status,
      `CS: ${c.chargesheetUploadedCCTNS ? 'Synced' : 'Pending'} | CD: ${c.caseDiaryUploadedCCTNS ? 'Synced' : 'Pending'}`,
    ]);

    exportToPDF(
      'FIR & Case Register Supervision Report',
      `Filtered Report (${filteredCases.length} Cases)`,
      headers,
      rows,
      [{ label: 'Total Cases Exported', value: filteredCases.length }]
    );
  };

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
      
      {/* Top Search Bar, Export Actions & Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleChange('searchQuery', e.target.value)}
            placeholder="Search FIR No, Sections, Complainant, PO, or IO Name..."
            className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Quick Deadline Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => handleChange('deadlineStatus', 'ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
              filters.deadlineStatus === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            All Limits
          </button>
          <button
            onClick={() => handleChange('deadlineStatus', 'OVERDUE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
              filters.deadlineStatus === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
            }`}
          >
            Overdue (&gt;60/90d)
          </button>
          <button
            onClick={() => handleChange('deadlineStatus', 'APPROACHING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
              filters.deadlineStatus === 'APPROACHING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
            }`}
          >
            Urgent (&lt;15d)
          </button>
          <button
            onClick={() => handleChange('deadlineStatus', 'ON_TRACK')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
              filters.deadlineStatus === 'ON_TRACK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
            }`}
          >
            On Track
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition flex items-center gap-1.5 shadow-sm"
            title="Export filtered records as Excel CSV (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded transition flex items-center gap-1.5 shadow-sm"
            title="Export official printable PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={onResetFilters}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

      </div>

      {/* Multi-Select Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        
        {/* Multi-Select Police Station */}
        {!hidePSFilter && (
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Police Station (Multi)
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown('ps')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 text-left text-slate-900 dark:text-white font-medium flex items-center justify-between"
            >
              <span className="truncate">
                {policeStations.length === 0
                  ? 'All 4 PS'
                  : `${policeStations.length} Selected`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {openDropdown === 'ps' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-30 p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => handleChange('policeStations', [])}
                  className="w-full text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Clear Selection (All PS)
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                {allPSOptions.map((ps) => {
                  const checked = policeStations.includes(ps);
                  return (
                    <label
                      key={ps}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArrayItem('policeStations', policeStations, ps)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{ps} PS</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Multi-Select Case Status */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Status (Multi)
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('status')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 text-left text-slate-900 dark:text-white font-medium flex items-center justify-between"
          >
            <span className="truncate">
              {statuses.length === 0
                ? 'All Statuses'
                : `${statuses.length} Selected`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-30 p-2 space-y-1">
              <button
                type="button"
                onClick={() => handleChange('statuses', [])}
                className="w-full text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Clear Selection (All Statuses)
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              {allStatusOptions.map((st) => {
                const checked = statuses.includes(st);
                return (
                  <label
                    key={st}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('statuses', statuses, st)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{st}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Multi-Select Classification */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Classification (Multi)
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('designation')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 text-left text-slate-900 dark:text-white font-medium flex items-center justify-between"
          >
            <span className="truncate">
              {designations.length === 0
                ? 'All Types'
                : `${designations.length} Selected`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {openDropdown === 'designation' && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-30 p-2 space-y-1">
              <button
                type="button"
                onClick={() => handleChange('designations', [])}
                className="w-full text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Clear Selection (All Types)
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              {allDesignationOptions.map((des) => {
                const checked = designations.includes(des.value);
                return (
                  <label
                    key={des.value}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('designations', designations, des.value)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{des.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Multi-Select Limit (60 vs 90) */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Statutory Limit
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('limit')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 text-left text-slate-900 dark:text-white font-medium flex items-center justify-between"
          >
            <span className="truncate">
              {deadlineCategories.length === 0
                ? '60d & 90d'
                : `${deadlineCategories.length} Selected`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {openDropdown === 'limit' && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-30 p-2 space-y-1">
              <button
                type="button"
                onClick={() => handleChange('deadlineCategories', [])}
                className="w-full text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Clear Selection
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              {allLimitOptions.map((lim) => {
                const checked = deadlineCategories.includes(lim.value);
                return (
                  <label
                    key={lim.value}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('deadlineCategories', deadlineCategories, lim.value)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{lim.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* CCTNS Sync Toggle */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            CCTNS Sync
          </label>
          <select
            value={filters.cctnsSyncFilter || 'ALL'}
            onChange={(e) => handleChange('cctnsSyncFilter', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 text-slate-900 dark:text-white font-semibold focus:border-blue-500"
          >
            <option value="ALL">All Sync Statuses</option>
            <option value="CD_SYNC">Only CD sync</option>
            <option value="CS_SYNC">Only CS sync</option>
            <option value="BOTH_SYNC">both sync</option>
            <option value="NONE_SYNC">None</option>
          </select>
        </div>

        {/* Multi-Select IO Filter */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Officer / IO (Multi)
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('io')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 text-left text-slate-900 dark:text-white font-medium flex items-center justify-between"
          >
            <span className="truncate">
              {ioNames.length === 0
                ? 'All IOs'
                : `${ioNames.length} Selected`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {openDropdown === 'io' && (
            <div className="absolute top-full right-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-30 p-2 space-y-1">
              <button
                type="button"
                onClick={() => handleChange('ioNames', [])}
                className="w-full text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Clear Selection (All IOs)
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              {(() => {
                const availableIOs = investigatingOfficers.filter((io) => {
                  if (activePS) {
                    return io.ps === activePS;
                  }
                  if (policeStations.length > 0) {
                    return policeStations.includes(io.ps as PoliceStationName);
                  }
                  return true;
                });

                if (availableIOs.length === 0) {
                  return (
                    <div className="text-[11px] text-slate-400 p-2 italic text-center">
                      No IOs registered for selected PS
                    </div>
                  );
                }

                return availableIOs.map((io) => {
                  const checked = ioNames.includes(io.name);
                  return (
                    <label
                      key={io.id}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArrayItem('ioNames', ioNames, io.name)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">
                        {io.name} ({io.ps})
                      </span>
                    </label>
                  );
                });
              })()}
            </div>
          )}
        </div>

      </div>

      {/* Date Range Inputs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
            FIR Date Range:
          </span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1 text-slate-900 dark:text-white"
          />
          <span className="text-slate-400 text-[11px]">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1 text-slate-900 dark:text-white"
          />
        </div>

        <div className="text-[11px] text-slate-500 font-semibold">
          Showing <strong className="text-slate-900 dark:text-white">{filteredCases.length}</strong> matching case records
        </div>
      </div>

    </div>
  );
};
