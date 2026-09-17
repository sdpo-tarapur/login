import React, { useState } from 'react';
import { InvestigatingOfficer, FIRCase, PoliceStationName, UserRole } from '../types';
import { UserCheck, Plus, Phone, User, X, FileSpreadsheet, Printer, Shield, FolderOpen, ExternalLink, Calendar, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { getPSFromRole, getDeadlineInfo } from '../utils/helpers';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface IOManagementProps {
  ios: InvestigatingOfficer[];
  cases: FIRCase[];
  onAddIO: (newIO: Omit<InvestigatingOfficer, 'id'>) => void;
  onDeleteIO?: (ioId: string) => void;
  currentRole: UserRole;
  onSelectIOCasesFilter?: (ioName: string) => void;
  isReadOnly?: boolean;
}

export const IOManagement: React.FC<IOManagementProps> = ({
  ios,
  cases,
  onAddIO,
  onDeleteIO,
  currentRole,
  onSelectIOCasesFilter,
  isReadOnly = false,
}) => {
  const activePS = getPSFromRole(currentRole);

  // Filter IO list to only show IOs of that PS when logged in as a specific PS
  const visibleIos = activePS
    ? ios.filter((io) => io.ps === activePS || io.ps === 'Subdivision HQ')
    : ios;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIO, setSelectedIO] = useState<InvestigatingOfficer | null>(null);
  const [name, setName] = useState('');
  const [rank, setRank] = useState<InvestigatingOfficer['rank']>('Sub-Inspector (SI)');
  const [ps, setPs] = useState<PoliceStationName | 'Subdivision HQ'>(activePS || 'Tarapur');
  const [phone, setPhone] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddIO({
      name: name.trim(),
      rank,
      ps,
      phone: phone.trim() || undefined,
    });

    setName('');
    setPhone('');
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const headers = ['IO Name', 'Rank', 'Police Station', 'Phone Number', 'Pending Active Cases', 'Total Assigned Cases'];
    const rows = visibleIos.map((io) => {
      const ioCases = cases.filter((c) => c.ioName.includes(io.name) || io.name.includes(c.ioName));
      const pendingCount = ioCases.filter((c) => c.status === 'Under Investigation').length;
      return [io.name, io.rank, io.ps, io.phone || 'N/A', pendingCount, ioCases.length];
    });

    exportToExcel('IO_Allocation_Roster_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Officer Name & Rank', 'Station / Unit', 'Contact', 'Pending Cases', 'Total Cases'];
    const rows = visibleIos.map((io) => {
      const ioCases = cases.filter((c) => c.ioName.includes(io.name) || io.name.includes(c.ioName));
      const pendingCount = ioCases.filter((c) => c.status === 'Under Investigation').length;
      return [`${io.name} (${io.rank})`, io.ps, io.phone || 'N/A', `${pendingCount} Pending`, `${ioCases.length} Assigned`];
    });

    exportToPDF(
      'Investigating Officers (IO) Allocation Roster',
      `Subdivision Roster Report (${visibleIos.length} Officers)`,
      headers,
      rows,
      [{ label: 'Total Officers Listed', value: visibleIos.length }]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-amber-400 rounded border border-slate-700 font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Investigating Officers (IO) Allocation Roster {activePS ? `— ${activePS} PS` : ''}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activePS
                ? `Active IO roster and case allocation for ${activePS} Police Station.`
                : 'Subdivision IO roster across all Police Stations.'}
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
              <span>Add New IO</span>
            </button>
          )}
        </div>
      </div>

      {/* IO Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleIos.map((io) => {
          // Count active cases assigned to this IO
          const ioCases = cases.filter((c) => c.ioName.includes(io.name) || io.name.includes(c.ioName));
          const pendingIoCases = ioCases.filter((c) => c.status === 'Under Investigation');

          return (
            <div
              key={io.id}
              onClick={() => setSelectedIO(io)}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/80 dark:hover:border-amber-500/80 hover:shadow-md transition cursor-pointer group space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold border border-slate-200 dark:border-slate-700 group-hover:bg-amber-500/20 group-hover:text-amber-400 group-hover:border-amber-500/40 transition">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition flex items-center gap-1.5">
                      <span>{io.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{io.rank}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {io.ps}
                  </span>
                  {!isReadOnly && onDeleteIO && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteIO(io.id);
                      }}
                      className="p-1 bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-600 hover:text-white rounded transition"
                      title="Delete Officer Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {io.phone && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{io.phone}</span>
                </div>
              )}

              {/* Case Load Metrics */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Active Pending</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{pendingIoCases.length} Cases</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Total Assigned</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{ioCases.length} Cases</span>
                </div>
              </div>

              <div className="text-[10px] font-bold text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 py-1 rounded border border-blue-200 dark:border-blue-900/60 group-hover:bg-blue-600 group-hover:text-white transition">
                👆 Click to view assigned cases & officer record
              </div>
            </div>
          );
        })}
      </div>

      {/* IO Cases & Profile Modal */}
      {selectedIO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedIO.name}</h3>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/40">
                      {selectedIO.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Posting: <strong className="text-slate-700 dark:text-slate-200">{selectedIO.ps} Police Station</strong>
                    {selectedIO.phone && ` • Contact: ${selectedIO.phone}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedIO(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assigned Cases List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Assigned FIR Cases ({cases.filter((c) => c.ioName.includes(selectedIO.name) || selectedIO.name.includes(c.ioName)).length})</span>
                </h4>

                {onSelectIOCasesFilter && (
                  <button
                    onClick={() => {
                      onSelectIOCasesFilter(selectedIO.name);
                      setSelectedIO(null);
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Filter Main FIR Table</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {(() => {
                const ioAssignedCases = cases.filter((c) => c.ioName.includes(selectedIO.name) || selectedIO.name.includes(c.ioName));

                if (ioAssignedCases.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-slate-500 font-medium">No FIR cases currently assigned to this officer.</p>
                    </div>
                  );
                }

                return ioAssignedCases.map((c) => {
                  const deadlineInfo = getDeadlineInfo(c);
                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono text-xs">
                            FIR {c.firNumber}
                          </span>
                          <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] px-1.5 py-0.2 rounded">
                            {c.ps} PS
                          </span>
                          <span className="text-slate-400 text-[11px]">| Date: {c.firDate}</span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'Under Investigation'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        <strong>Sections:</strong> {c.sections} • <strong>Complainant:</strong> {c.complainantName}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">
                          Statutory Limit: <strong>{c.deadlineDays} Days</strong> ({deadlineInfo.label})
                        </span>
                        <div className="flex items-center gap-2 font-semibold">
                          <span className={c.chargesheetUploadedCCTNS ? 'text-emerald-400' : 'text-slate-400'}>
                            CS CCTNS: {c.chargesheetUploadedCCTNS ? '✓ Synced' : '✕ Pending'}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className={c.caseDiaryUploadedCCTNS ? 'text-emerald-400' : 'text-slate-400'}>
                            CD CCTNS: {c.caseDiaryUploadedCCTNS ? '✓ Synced' : '✕ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer Close */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIO(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Close Officer Record
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add IO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Investigating Officer to Roster</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IO Name & Designation</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SI Rajesh Kumar"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Police Rank</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Station / Unit Posting</label>
                <select
                  value={ps}
                  onChange={(e) => setPs(e.target.value as any)}
                  disabled={Boolean(activePS)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
                >
                  <option value="Subdivision HQ">Subdivision HQ (SDPO Office)</option>
                  <option value="Tarapur">Tarapur PS</option>
                  <option value="Asarganj">Asarganj PS</option>
                  <option value="Sangrampur">Sangrampur PS</option>
                  <option value="Harpur">Harpur PS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone / Mobile Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-medium"
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
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl shadow hover:bg-amber-600"
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
