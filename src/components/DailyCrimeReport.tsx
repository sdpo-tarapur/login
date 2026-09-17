import React, { useState } from 'react';
import {
  DailyCrimeReport,
  PoliceStationName,
  UserRole,
  FIRCase,
  InvestigatingOfficer,
  UserAccount,
  UserMessage,
  LeaveLedgerEntry,
} from '../types';
import { formatIndianDate, formatReadableDate, getPSFromRole, normalizeLeaveType } from '../utils/helpers';
import {
  FileText,
  Plus,
  Calendar,
  Shield,
  Building2,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Printer,
  Trash2,
  LayoutDashboard,
  Mail,
  Clock,
  Car,
  Wine,
  Users,
  Eye,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';
import { DailyReportDashboard } from './DailyReportDashboard';
import { DailyReportSubmitModal } from './DailyReportSubmitModal';
import { DailyReportMessages } from './DailyReportMessages';

interface DailyCrimeReportProps {
  reports: DailyCrimeReport[];
  cases: FIRCase[];
  ios: InvestigatingOfficer[];
  userAccounts: UserAccount[];
  currentUserAccount: UserAccount | null;
  currentRole: UserRole;
  onAddReport: (newReport: Omit<DailyCrimeReport, 'id'>) => void;
  onDeleteReport?: (id: string) => void;
  isReadOnly?: boolean;
  messages: UserMessage[];
  onSendMessage: (msg: Omit<UserMessage, 'id' | 'createdAt'>) => void;
  onDeleteMessage?: (id: string) => void;
  onMarkMessageAsRead?: (id: string) => void;
  monthlyArrestOverrides: Record<string, number>;
  onUpdateMonthlyArrestOverride: (monthKey: string, ps: string, figure: number) => void;
  leaveLedger?: LeaveLedgerEntry[];
  onUpdateLeaveStatus?: (leaveId: string, status: 'ON_LEAVE' | 'ARRIVED' | 'OVERDUE', actualArrivalDate?: string) => void;
  onAddLeaveEntry?: (entry: LeaveLedgerEntry) => void;
  onDeleteLeaveEntry?: (leaveId: string) => void;
}

export const DailyCrimeReportSection: React.FC<DailyCrimeReportProps> = ({
  reports,
  cases,
  ios,
  userAccounts,
  currentUserAccount,
  currentRole,
  onAddReport,
  onDeleteReport,
  isReadOnly = false,
  messages,
  onSendMessage,
  onDeleteMessage,
  onMarkMessageAsRead,
  monthlyArrestOverrides,
  onUpdateMonthlyArrestOverride,
  leaveLedger = [],
  onUpdateLeaveStatus,
  onAddLeaveEntry,
  onDeleteLeaveEntry,
}) => {
  const activePS = getPSFromRole(currentRole);
  const isSuperUser = currentRole === 'SDPO';

  // Sub-tab inside Daily Reports: Dashboard, Diary Log, or Messages
  const [subTab, setSubTab] = useState<'dashboard' | 'logs' | 'messages'>('dashboard');

  // New Report Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // View Report Details Modal
  const [viewingReport, setViewingReport] = useState<DailyCrimeReport | null>(null);

  const visibleReports = activePS ? reports.filter((r) => r.ps === activePS) : reports;

  // Unread messages count for badge
  const currentUserId = currentUserAccount?.userId || currentRole;
  const unreadMessagesCount = messages.filter(
    (m) =>
      (m.recipientUserId === 'ALL' ||
        m.recipientUserId === currentUserId ||
        m.recipientUserId === currentRole) &&
      !m.readBy?.includes(currentUserId)
  ).length;

  const handleExportExcel = () => {
    const headers = [
      'Police Station',
      'Report Date',
      'FIRs Registered Count',
      'FIR Details',
      'OD1 Officer',
      'OD2 Officer',
      'OD3 Officer',
      'Morning Gasti',
      'Day Gasti',
      'Night Gasti',
      'Total Arrests',
      'Liquor Arrests',
      'Other Arrests',
      'Seizures & Recoveries',
      'Incident & Law & Order Notes',
      'Logged By',
    ];

    const rows = visibleReports.map((r) => {
      const firDetailsStr = r.registeredFirs
        ? r.registeredFirs.map((f) => `FIR ${f.firNumber} (${f.sections})`).join('; ')
        : 'None';

      const liquorArrests = r.arrestDetails?.liquorArrestsCount || 0;
      const otherArrests = r.arrestDetails?.otherArrestsCount || 0;

      return [
        `${r.ps} PS`,
        r.date,
        r.firsRegisteredCount,
        firDetailsStr,
        r.odDetails?.od1IoName || 'N/A',
        r.odDetails?.od2IoName || 'N/A',
        r.odDetails?.od3IoName || 'N/A',
        r.gastiDetails?.morningGastiIoName || 'N/A',
        r.gastiDetails?.dayGastiIoName || 'N/A',
        r.gastiDetails?.nightGastiIoName || 'N/A',
        r.arrestsCount,
        liquorArrests,
        otherArrests,
        r.seizuresSummary || 'None',
        r.majorIncidentsNotes || 'Routine',
        r.submittedBy,
      ];
    });

    exportToExcel('Daily_Crime_And_Patrol_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = [
      'Station & Date',
      'FIRs Logged',
      'OD Officers',
      'Gasti Shifts',
      'Arrests (Liquor/Total)',
      'Seizures & Incidents',
      'Logged By',
    ];

    const rows = visibleReports.map((r) => [
      `${r.ps} PS\n${r.date}`,
      `${r.firsRegisteredCount} FIRs`,
      `OD1: ${r.odDetails?.od1IoName || '—'}\nOD2: ${r.odDetails?.od2IoName || '—'}`,
      `M: ${r.gastiDetails?.morningGastiIoName || '—'}\nN: ${r.gastiDetails?.nightGastiIoName || '—'}`,
      `Total: ${r.arrestsCount} (Liq: ${r.arrestDetails?.liquorArrestsCount || 0})`,
      `${r.seizuresSummary ? `Seiz: ${r.seizuresSummary}` : ''}\n${r.majorIncidentsNotes || 'Routine'}`,
      r.submittedBy,
    ]);

    const totalFirs = visibleReports.reduce((acc, curr) => acc + curr.firsRegisteredCount, 0);
    const totalArrests = visibleReports.reduce((acc, curr) => acc + curr.arrestsCount, 0);

    exportToPDF(
      'Daily Police Station Crime & Patrol Diary Report',
      `Subdivision Daily Activity Log (${visibleReports.length} Reports)`,
      headers,
      rows,
      [
        { label: 'Total Reports', value: visibleReports.length },
        { label: 'Total FIRs Logged', value: totalFirs },
        { label: 'Total Arrests', value: totalArrests },
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-blue-400 rounded-lg border border-slate-700 font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Daily Police Station Crime & Patrol Diary {activePS ? `— ${activePS} PS` : ''}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrated Subdivision Command: Daily Reports, Live Force Strengths, Arrests, and Messaging Desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Submit Daily Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs transition ${
            subTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Command Dashboard</span>
        </button>

        <button
          onClick={() => setSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs transition ${
            subTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daily Diary Log Entries ({visibleReports.length})</span>
        </button>

        <button
          onClick={() => setSubTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs transition ${
            subTab === 'messages'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Directives & Messages</span>
          {unreadMessagesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-black">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>

      {/* Sub-Tab 1: Command Dashboard */}
      {subTab === 'dashboard' && (
        <DailyReportDashboard
          reports={reports}
          cases={cases}
          ios={ios}
          currentRole={currentRole}
          activePS={activePS}
          monthlyArrestOverrides={monthlyArrestOverrides}
          onUpdateMonthlyArrestOverride={onUpdateMonthlyArrestOverride}
          leaveLedger={leaveLedger}
          onUpdateLeaveStatus={onUpdateLeaveStatus}
          onAddLeaveEntry={onAddLeaveEntry}
          onDeleteLeaveEntry={onDeleteLeaveEntry}
        />
      )}

      {/* Sub-Tab 2: Daily Diary Log Entries */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          {visibleReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                No Daily Crime Reports Logged Yet
              </p>
            </div>
          ) : (
            visibleReports.map((r) => {
              const liquorArrests = r.arrestDetails?.liquorArrestsCount || 0;

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white font-extrabold text-xs px-2.5 py-1 rounded-md">
                        {r.ps} PS Daily Report
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatReadableDate(r.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingReport(r)}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-900"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Breakdown</span>
                      </button>

                      <span className="text-[11px] text-slate-400 italic">
                        Logged by: {r.submittedBy}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                        FIRs Registered
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          {r.firsRegisteredCount}
                        </span>
                        {r.registeredFirs && r.registeredFirs.length > 0 && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                            ({r.registeredFirs.map((f) => f.firNumber).join(', ')})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                        Total Arrests
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-base">
                          {r.arrestsCount}
                        </span>
                        {liquorArrests > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                            <Wine className="w-3 h-3" />
                            {liquorArrests} Liquor
                          </span>
                        )}
                      </div>
                    </div>

                    {/* OD Officers summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                        Officer on Duty (OD)
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        OD1: {r.odDetails?.od1IoName || 'Not recorded'}
                      </div>
                    </div>

                    {/* GASTI summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                        Gasti (Patrol)
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        Morning: {r.gastiDetails?.morningGastiIoName || 'Routine'}
                      </div>
                    </div>
                  </div>

                  {/* Seizures & Incident Notes */}
                  {(r.seizuresSummary || r.majorIncidentsNotes) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {r.seizuresSummary && (
                        <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900 text-slate-800 dark:text-slate-200">
                          <strong className="text-emerald-800 dark:text-emerald-400 block text-[10px] uppercase tracking-wider mb-0.5">
                            Major Seizure Last Day:
                          </strong>
                          <span>{r.seizuresSummary}</span>
                        </div>
                      )}

                      {r.majorIncidentsNotes && (
                        <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900 text-slate-800 dark:text-slate-200">
                          <strong className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase tracking-wider mb-0.5">
                            Major Incident / Accident:
                          </strong>
                          <span>{r.majorIncidentsNotes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Departing Officers Leave Ribbon */}
                  {r.leaveLedgerEntries && r.leaveLedgerEntries.length > 0 && (
                    <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <strong className="text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          Departed On Leave ({r.leaveLedgerEntries.length} Officers):
                        </strong>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                          Auto-Computed Arrival Dates
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.leaveLedgerEntries.map((le) => (
                          <div
                            key={le.id}
                            className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-md border border-amber-200 dark:border-amber-800 text-[11px] flex items-center gap-2"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200">{le.officerName}</span>
                            <span className="text-[10px] text-slate-500">({le.rank})</span>
                            <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black rounded text-[10px]">
                              {le.daysOnLeave} Days
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                              → Arrives: {formatIndianDate(le.arrivalDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isReadOnly && onDeleteReport && (isSuperUser || activePS === r.ps) && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onDeleteReport(r.id)}
                        className="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Report</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sub-Tab 3: Messages Desk */}
      {subTab === 'messages' && (
        <DailyReportMessages
          messages={messages}
          currentUserAccount={currentUserAccount}
          currentRole={currentRole}
          userAccounts={userAccounts}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          onMarkAsRead={onMarkMessageAsRead}
        />
      )}

      {/* Modal 1: Submit Daily Report Form */}
      <DailyReportSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={onAddReport}
        investigatingOfficers={ios}
        defaultPS={activePS}
        isSuperUser={isSuperUser}
      />

      {/* Modal 2: View Report Full Breakdown */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Daily Crime & Patrol Diary — {viewingReport.ps} PS ({viewingReport.date})
                </h3>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 text-xs">
              {/* Registered FIRs Table */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Total FIR Registered Last Day ({viewingReport.firsRegisteredCount})</span>
                </h4>

                {viewingReport.registeredFirs && viewingReport.registeredFirs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px] uppercase font-bold">
                          <th className="py-1 px-2">FIR No.</th>
                          <th className="py-1 px-2">Date</th>
                          <th className="py-1 px-2">Sections</th>
                          <th className="py-1 px-2">Assigned IO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                        {viewingReport.registeredFirs.map((f, i) => (
                          <tr key={i}>
                            <td className="py-1.5 px-2 font-bold text-blue-600 dark:text-blue-400">
                              {f.firNumber}
                            </td>
                            <td className="py-1.5 px-2 text-slate-600 dark:text-slate-300">{f.date}</td>
                            <td className="py-1.5 px-2 font-mono text-slate-800 dark:text-slate-200">
                              {f.sections}
                            </td>
                            <td className="py-1.5 px-2 font-semibold text-slate-700 dark:text-slate-300">
                              {f.ioName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No individual FIRs logged.</p>
                )}
              </div>

              {/* OD & GASTI Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Officer on Duty (3 ODs)</span>
                  </h4>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                    <li>OD 1: <strong>{viewingReport.odDetails?.od1IoName || '—'}</strong></li>
                    <li>OD 2: <strong>{viewingReport.odDetails?.od2IoName || '—'}</strong></li>
                    <li>OD 3: <strong>{viewingReport.odDetails?.od3IoName || '—'}</strong></li>
                  </ul>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-500" />
                    <span>GASTI (Patrol) Shifts</span>
                  </h4>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Morning Gasti: <strong>{viewingReport.gastiDetails?.morningGastiIoName || '—'}</strong></li>
                    <li>Day Gasti: <strong>{viewingReport.gastiDetails?.dayGastiIoName || '—'}</strong></li>
                    <li>Night Gasti: <strong>{viewingReport.gastiDetails?.nightGastiIoName || '—'}</strong></li>
                  </ul>
                </div>
              </div>

              {/* Arresting Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span>Arresting Details Last Day (Total: {viewingReport.arrestsCount})</span>
                </h4>

                {viewingReport.arrestDetails?.caseArrests &&
                viewingReport.arrestDetails.caseArrests.length > 0 ? (
                  <div className="space-y-1.5">
                    {viewingReport.arrestDetails.caseArrests.map((ca, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {ca.caseNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-rose-600">{ca.arrestCount} Arrested</span>
                          {ca.isLiquorRelated && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                              Liquor Case
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No case-specific arrests.</p>
                )}

                <div className="text-[11px] text-slate-500 pt-1">
                  Other Arrests: <strong>{viewingReport.arrestDetails?.otherArrestsCount || 0}</strong>
                </div>
              </div>

              {/* Leave Management Rank-Wise */}
              {viewingReport.rankStrengths && viewingReport.rankStrengths.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-500" />
                    <span>Force Strength & Leave Management</span>
                  </h4>
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-1">Rank</th>
                        <th className="py-1 text-center">Total</th>
                        <th className="py-1 text-center">Present</th>
                        <th className="py-1 text-center">On Leave</th>
                        <th className="py-1 text-center">Arriving</th>
                        <th className="py-1 text-center">Departing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {viewingReport.rankStrengths.map((rs) => (
                        <tr key={rs.rank}>
                          <td className="py-1 font-bold">{rs.rank}</td>
                          <td className="py-1 text-center">{rs.totalStrength}</td>
                          <td className="py-1 text-center font-extrabold text-emerald-600">{rs.present}</td>
                          <td className="py-1 text-center text-amber-600">{rs.onLeave}</td>
                          <td className="py-1 text-center">{rs.arrivingToday || '—'}</td>
                          <td className="py-1 text-center">{rs.departingToday || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Non-Constable Leave Ledger Entries in this Report */}
              {viewingReport.leaveLedgerEntries && viewingReport.leaveLedgerEntries.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>Departing Officers Leave Registry ({viewingReport.leaveLedgerEntries.length})</span>
                    </h4>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
                      Except Constables
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-1">Officer</th>
                          <th className="py-1">Rank</th>
                          <th className="py-1">Departure</th>
                          <th className="py-1 text-center">Days</th>
                          <th className="py-1 font-bold text-emerald-600">Expected Arrival</th>
                          <th className="py-1">Type / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {viewingReport.leaveLedgerEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-1.5 font-bold text-slate-800 dark:text-slate-200">{entry.officerName}</td>
                            <td className="py-1.5 text-slate-600 dark:text-slate-400">{entry.rank}</td>
                            <td className="py-1.5">{formatIndianDate(entry.departureDate)}</td>
                            <td className="py-1.5 text-center font-bold text-amber-600">{entry.daysOnLeave}d</td>
                            <td className="py-1.5 font-black text-emerald-600 dark:text-emerald-400">
                              {formatIndianDate(entry.arrivalDate)}
                            </td>
                            <td className="py-1.5 text-slate-600 dark:text-slate-300">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] mr-1 border border-slate-200 dark:border-slate-700">
                                {normalizeLeaveType(entry.leaveType)}
                              </span>
                              {entry.remarks ? <span className="text-slate-500 italic text-xs">{entry.remarks}</span> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Seizures and Incidents */}
              {viewingReport.seizuresSummary && (
                <div>
                  <strong className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Major Seizures:
                  </strong>
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {viewingReport.seizuresSummary}
                  </p>
                </div>
              )}

              {viewingReport.majorIncidentsNotes && (
                <div>
                  <strong className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Major Incidents / Accidents:
                  </strong>
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {viewingReport.majorIncidentsNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
