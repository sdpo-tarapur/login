import React, { useState } from 'react';
import { DailyCrimeReport, PoliceStationName, UserRole } from '../types';
import { formatReadableDate, getPSFromRole } from '../utils/helpers';
import { FileText, Plus, Calendar, Shield, Building2, CheckCircle2, X, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface DailyCrimeReportProps {
  reports: DailyCrimeReport[];
  currentRole: UserRole;
  onAddReport: (newReport: Omit<DailyCrimeReport, 'id'>) => void;
  isReadOnly?: boolean;
}

export const DailyCrimeReportSection: React.FC<DailyCrimeReportProps> = ({
  reports,
  currentRole,
  onAddReport,
  isReadOnly = false,
}) => {
  const activePS = getPSFromRole(currentRole);

  const todayStr = new Date().toISOString().split('T')[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ps, setPs] = useState<PoliceStationName>(activePS || 'Tarapur');
  const [date, setDate] = useState(todayStr);
  const [firsRegisteredCount, setFirsRegisteredCount] = useState(0);
  const [arrestsCount, setArrestsCount] = useState(0);
  const [seizuresSummary, setSeizuresSummary] = useState('');
  const [majorIncidentsNotes, setMajorIncidentsNotes] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');

  const visibleReports = activePS ? reports.filter((r) => r.ps === activePS) : reports;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAddReport({
      ps,
      date,
      firsRegisteredCount: Number(firsRegisteredCount) || 0,
      arrestsCount: Number(arrestsCount) || 0,
      seizuresSummary: seizuresSummary.trim() || undefined,
      majorIncidentsNotes: majorIncidentsNotes.trim() || undefined,
      submittedBy: submittedBy.trim() || `SHO ${ps} PS`,
    });

    setIsModalOpen(false);
    setFirsRegisteredCount(0);
    setArrestsCount(0);
    setSeizuresSummary('');
    setMajorIncidentsNotes('');
    setSubmittedBy('');
  };

  const handleExportExcel = () => {
    const headers = ['Police Station', 'Report Date', 'FIRs Registered', 'Arrests Made', 'Seizures & Recoveries', 'Patrolling & Incident Notes', 'Logged By'];
    const rows = visibleReports.map((r) => [
      `${r.ps} PS`,
      r.date,
      r.firsRegisteredCount,
      r.arrestsCount,
      r.seizuresSummary || 'None',
      r.majorIncidentsNotes || 'Routine',
      r.submittedBy,
    ]);

    exportToExcel('Daily_Crime_And_Patrol_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Station & Date', 'FIR Count', 'Arrests', 'Seizures & Recoveries', 'Patrolling Notes', 'Logged By'];
    const rows = visibleReports.map((r) => [
      `${r.ps} PS\n${r.date}`,
      r.firsRegisteredCount,
      r.arrestsCount,
      r.seizuresSummary || 'N/A',
      r.majorIncidentsNotes || 'Routine',
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
      <div className="bg-slate-900 text-white rounded p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-indigo-400 rounded border border-slate-700 font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Daily Police Station Crime & Patrol Diary {activePS ? `— ${activePS} PS` : ''}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily crime updates, arrests, property seizures, and patrolling updates logged by Police Stations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Submit Daily Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {visibleReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded border border-slate-200 dark:border-slate-800">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">No Daily Crime Reports Logged Yet</p>
          </div>
        ) : (
          visibleReports.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded">
                    {r.ps} PS Daily Report
                  </span>
                  <span className="text-slate-500 font-bold text-xs">
                    Date: {formatReadableDate(r.date)}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 italic">
                  Logged by: {r.submittedBy}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">FIRs Registered</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">{r.firsRegisteredCount}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Accused Arrests</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{r.arrestsCount}</span>
                </div>

                {r.seizuresSummary && (
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Seizures / Recoveries</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{r.seizuresSummary}</span>
                  </div>
                )}
              </div>

              {r.majorIncidentsNotes && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700">
                  <strong>Notes & Incidents:</strong> {r.majorIncidentsNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add DCR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Police Station Daily Report</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Police Station</label>
                  <select
                    value={ps}
                    onChange={(e) => setPs(e.target.value as PoliceStationName)}
                    disabled={Boolean(activePS)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  >
                    <option value="Tarapur">Tarapur PS</option>
                    <option value="Asarganj">Asarganj PS</option>
                    <option value="Sangrampur">Sangrampur PS</option>
                    <option value="Harpur">Harpur PS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Report Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">FIRs Registered</label>
                  <input
                    type="number"
                    min={0}
                    value={firsRegisteredCount}
                    onChange={(e) => setFirsRegisteredCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Accused Arrests</label>
                  <input
                    type="number"
                    min={0}
                    value={arrestsCount}
                    onChange={(e) => setArrestsCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Seizures / Recoveries Summary</label>
                <input
                  type="text"
                  value={seizuresSummary}
                  onChange={(e) => setSeizuresSummary(e.target.value)}
                  placeholder="e.g. 1 stolen vehicle recovered, 50L illicit liquor seized"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Major Incidents & Patrolling Notes</label>
                <textarea
                  rows={3}
                  value={majorIncidentsNotes}
                  onChange={(e) => setMajorIncidentsNotes(e.target.value)}
                  placeholder="Routine patrolling notes, mela security, VVIP movements..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Submitted By (SHO Name)</label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Name of submitting Officer"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700"
                >
                  Submit Daily Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
