import React from 'react';
import { FIRCase, LandDispute, PoliceStationName, UserRole, FilterOptions } from '../types';
import { getDeadlineInfo, getPSFromRole } from '../utils/helpers';
import { Shield, ShieldAlert, AlertCircle, Scale, Building2, Clock, CloudUpload, ExternalLink } from 'lucide-react';

interface DashboardStatsProps {
  cases: FIRCase[];
  landDisputes: LandDispute[];
  currentRole: UserRole;
  onSelectFilterPS?: (ps: PoliceStationName | 'ALL') => void;
  onTabChange: (tab: string) => void;
  onApplyFilter: (filters: Partial<FilterOptions>) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  cases,
  landDisputes,
  currentRole,
  onSelectFilterPS,
  onTabChange,
  onApplyFilter = (_f: Partial<FilterOptions>) => {},
}) => {
  const activePS = getPSFromRole(currentRole);

  // Filter cases if user is logged in as a specific PS
  const visibleCases = activePS ? cases.filter((c) => c.ps === activePS) : cases;
  const visibleLandDisputes = activePS ? landDisputes.filter((l) => l.ps === activePS) : landDisputes;

  // Key metrics
  const totalCases = visibleCases.length;
  const pendingCases = visibleCases.filter((c) => c.status === 'Under Investigation');
  const completedCases = visibleCases.filter(
    (c) => c.status === 'Chargesheeted / Final Form Submitted'
  );

  let overdueCount = 0;
  let approachingCount = 0;
  let onTrackCount = 0;

  visibleCases.forEach((c) => {
    const info = getDeadlineInfo(c);
    if (info.code === 'OVERDUE') overdueCount++;
    else if (info.code === 'APPROACHING') approachingCount++;
    else if (info.code === 'ON_TRACK') onTrackCount++;
  });

  const srCasesCount = visibleCases.filter((c) => c.designation === 'SR').length;
  const nonSrCasesCount = visibleCases.filter((c) => c.designation === 'NON_SR').length;
  const pendingDesignationCount = visibleCases.filter((c) => c.designation === 'PENDING_DESIGNATION').length;

  const csUploadedCCTNSCount = visibleCases.filter((c) => c.chargesheetUploadedCCTNS).length;
  const cdUploadedCCTNSCount = visibleCases.filter((c) => c.caseDiaryUploadedCCTNS).length;

  const pendingLandDisputes = visibleLandDisputes.filter((l) => l.status === 'Pending').length;
  const disposedLandDisputes = visibleLandDisputes.filter((l) => l.status === 'Disposed').length;

  const psNames: PoliceStationName[] = ['Tarapur', 'Asarganj', 'Sangrampur', 'Harpur'];

  // Helper click handlers to jump to filtered view
  const handleClickTotalFIRs = () => {
    onApplyFilter({ statuses: [], designations: [], policeStations: [], deadlineStatus: 'ALL' });
    onTabChange('firs');
  };

  const handleClickPendingIO = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyFilter({ statuses: ['Under Investigation'] });
    onTabChange('firs');
  };

  const handleClickChargesheeted = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyFilter({ statuses: ['Chargesheeted / Final Form Submitted'] });
    onTabChange('firs');
  };

  const handleClickOverdue = () => {
    onApplyFilter({ deadlineStatus: 'OVERDUE' });
    onTabChange('firs');
  };

  const handleClickApproaching = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyFilter({ deadlineStatus: 'APPROACHING' });
    onTabChange('firs');
  };

  const handleClickOnTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyFilter({ deadlineStatus: 'ON_TRACK' });
    onTabChange('firs');
  };

  const handleClickSR = () => {
    onApplyFilter({ designations: ['SR'] });
    onTabChange('firs');
  };

  const handleClickNonSR = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyFilter({ designations: ['NON_SR'] });
    onTabChange('firs');
  };

  const handleClickUnassigned = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApplyFilter({ designations: ['PENDING_DESIGNATION'] });
    onTabChange('firs');
  };

  const handleClickLandDisputes = () => {
    onTabChange('land_disputes');
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-400/30 mb-2">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{activePS ? `${activePS} Police Station Overview` : 'Subdivision Executive Command'}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Crime & Investigation Compliance Dashboard
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Click on any stat card or status badge below to open and inspect matching case records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClickTotalFIRs}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              <span>View FIR Register</span>
            </button>
            <button
              onClick={() => onTabChange('deadlines')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{overdueCount} Overdue Alerts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Interactive Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cases Card */}
        <div
          onClick={handleClickTotalFIRs}
          className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-indigo-600 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Total Active FIRs
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-blue-400 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Shield className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-between tracking-tight">
              <span>{totalCases}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span
                onClick={handleClickPendingIO}
                className="text-amber-800 dark:text-amber-400 font-bold hover:underline"
              >
                {pendingCases.length} Pending IO
              </span>
              <span className="text-slate-300">•</span>
              <span
                onClick={handleClickChargesheeted}
                className="text-emerald-800 dark:text-emerald-400 font-bold hover:underline"
              >
                {completedCases.length} Chargesheeted / Final Form
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Limit Overdue Card */}
        <div
          onClick={handleClickOverdue}
          className={`p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group ${
            overdueCount > 0
              ? 'bg-white dark:bg-slate-900 border-l-rose-600 hover:border-rose-300'
              : 'bg-white dark:bg-slate-900 border-l-emerald-600 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              60/90 Statutory Limit
            </span>
            <div
              className={`p-2 rounded-lg ${
                overdueCount > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <div
                  className={`text-3xl font-black tracking-tight ${
                    overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {overdueCount}
                </div>
                <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Overdue
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span
                onClick={handleClickApproaching}
                className="text-amber-800 dark:text-amber-400 font-bold hover:underline"
              >
                {approachingCount} Urgent (&lt;15d)
              </span>
              <span className="text-slate-300">•</span>
              <span
                onClick={handleClickOnTrack}
                className="text-emerald-800 dark:text-emerald-400 font-bold hover:underline"
              >
                {onTrackCount} On Track
              </span>
            </div>
          </div>
        </div>

        {/* SR vs NON-SR Card */}
        <div
          onClick={handleClickSR}
          className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Case Classification
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-slate-800 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-amber-700 dark:text-amber-400 tracking-tight">{srCasesCount}</div>
                <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  SR Cases (SDPO)
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span
                onClick={handleClickNonSR}
                className="text-slate-800 dark:text-slate-300 font-bold hover:underline"
              >
                {nonSrCasesCount} NON-SR (CI)
              </span>
              {pendingDesignationCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span
                    onClick={handleClickUnassigned}
                    className="text-purple-700 dark:text-purple-400 font-bold hover:underline"
                  >
                    {pendingDesignationCount} Unassigned
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Land Disputes Card */}
        <div
          onClick={handleClickLandDisputes}
          className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-emerald-600 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Land Disputes
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{pendingLandDisputes}</div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Pending
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{disposedLandDisputes} Disposed in Janata Darbar</span>
            </div>
          </div>
        </div>

      </div>

      {/* CCTNS Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div
          onClick={() => {
            onApplyFilter({ chargesheetCCTNS: 'YES' });
            onTabChange('firs');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 transition"
        >
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <CloudUpload className="w-3.5 h-3.5 text-blue-500" />
              <span>Chargesheet CCTNS Sync Rate</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedCases.length > 0 ? Math.round((csUploadedCCTNSCount / completedCases.length) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-500">
                ({csUploadedCCTNSCount} of {completedCases.length} chargesheets synced)
              </span>
            </div>
          </div>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            CCTNS
          </div>
        </div>

        <div
          onClick={() => {
            onApplyFilter({ caseDiaryCCTNS: 'YES' });
            onTabChange('firs');
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
        >
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <CloudUpload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Case Diary (CD) CCTNS Upload</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalCases > 0 ? Math.round((cdUploadedCCTNSCount / totalCases) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-500">
                ({cdUploadedCCTNSCount} of {totalCases} active cases synced)
              </span>
            </div>
          </div>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            CD Sync
          </div>
        </div>

      </div>

      {/* Police Station Comparison Matrix Table */}
      {!activePS && (
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                Subdivision Police Station Comparative Matrix (4 PS)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              Click any count cell to view matching cases
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Police Station</th>
                  <th className="py-2.5 px-4 text-center">Total FIRs</th>
                  <th className="py-2.5 px-4 text-center">Pending IO</th>
                  <th className="py-2.5 px-4 text-center">Overdue (&gt;60/90d)</th>
                  <th className="py-2.5 px-4 text-center">SR Cases</th>
                  <th className="py-2.5 px-4 text-center">NON-SR Cases</th>
                  <th className="py-2.5 px-4 text-center">Land Disputes Pending</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {psNames.map((ps) => {
                  const psCases = cases.filter((c) => c.ps === ps);
                  const psPending = psCases.filter((c) => c.status === 'Under Investigation').length;
                  const psOverdue = psCases.filter((c) => getDeadlineInfo(c).code === 'OVERDUE').length;
                  const psSR = psCases.filter((c) => c.designation === 'SR').length;
                  const psNSR = psCases.filter((c) => c.designation === 'NON_SR').length;
                  const psLD = landDisputes.filter((l) => l.ps === ps && l.status === 'Pending').length;

                  return (
                    <tr key={ps} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                        <span>{ps} PS</span>
                      </td>

                      {/* Clickable Total Cell */}
                      <td
                        onClick={() => {
                          onApplyFilter({ policeStations: [ps] });
                          onTabChange('firs');
                        }}
                        className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 cursor-pointer transition"
                      >
                        {psCases.length}
                      </td>

                      {/* Clickable Pending Cell */}
                      <td
                        onClick={() => {
                          onApplyFilter({ policeStations: [ps], statuses: ['Under Investigation'] });
                          onTabChange('firs');
                        }}
                        className="py-3 px-4 text-center font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer transition"
                      >
                        {psPending}
                      </td>

                      {/* Clickable Overdue Cell */}
                      <td
                        onClick={() => {
                          onApplyFilter({ policeStations: [ps], deadlineStatus: 'OVERDUE' });
                          onTabChange('firs');
                        }}
                        className="py-3 px-4 text-center font-bold cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      >
                        {psOverdue > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 font-bold text-[10px] uppercase">
                            {psOverdue} OVERDUE
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0</span>
                        )}
                      </td>

                      {/* Clickable SR Cell */}
                      <td
                        onClick={() => {
                          onApplyFilter({ policeStations: [ps], designations: ['SR'] });
                          onTabChange('firs');
                        }}
                        className="py-3 px-4 text-center font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer transition"
                      >
                        {psSR}
                      </td>

                      {/* Clickable NON-SR Cell */}
                      <td
                        onClick={() => {
                          onApplyFilter({ policeStations: [ps], designations: ['NON_SR'] });
                          onTabChange('firs');
                        }}
                        className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      >
                        {psNSR}
                      </td>

                      {/* Clickable Land Dispute Cell */}
                      <td
                        onClick={() => {
                          onTabChange('land_disputes');
                        }}
                        className="py-3 px-4 text-center font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition"
                      >
                        {psLD}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            onApplyFilter({ policeStations: [ps] });
                            onTabChange('firs');
                          }}
                          className="text-[11px] text-blue-600 font-bold hover:underline"
                        >
                          Filter {ps}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
