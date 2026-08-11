import React, { useState } from 'react';
import { UDCase, FIRCase, PoliceStationName, UserRole } from '../types';
import { formatReadableDate, getPSFromRole } from '../utils/helpers';
import { Shield, Plus, FileText, CheckCircle2, Clock, AlertCircle, Eye, Edit3, X, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface UDCaseSectionProps {
  udCases: UDCase[];
  nonSrCases: FIRCase[];
  currentRole: UserRole;
  onAddUDCase: (newUD: Omit<UDCase, 'id'>) => void;
  onUpdateUDCase: (updatedUD: UDCase) => void;
  onViewFIR: (caseItem: FIRCase) => void;
  onEditFIR: (caseItem: FIRCase) => void;
  isReadOnly?: boolean;
}

export const UDCaseSection: React.FC<UDCaseSectionProps> = ({
  udCases,
  nonSrCases,
  currentRole,
  onAddUDCase,
  onUpdateUDCase,
  onViewFIR,
  onEditFIR,
  isReadOnly = false,
}) => {
  const activePS = getPSFromRole(currentRole);
  const isSuperUser = currentRole === 'SDPO';
  const isCI = currentRole === 'CI';

  const [activeSubTab, setActiveSubTab] = useState<'UD' | 'NON_SR'>('UD');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUD, setEditingUD] = useState<UDCase | null>(null);

  // New UD State
  const todayStr = new Date().toISOString().split('T')[0];
  const [ps, setPs] = useState<PoliceStationName>(activePS || 'Tarapur');
  const [udCaseNo, setUdCaseNo] = useState('');
  const [date, setDate] = useState(todayStr);
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedAgeGender, setDeceasedAgeGender] = useState('');
  const [placeOfOccurrence, setPlaceOfOccurrence] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [pmStatus, setPmStatus] = useState<'Pending' | 'Received'>('Pending');
  const [visceraStatus, setVisceraStatus] = useState<'Not Required' | 'Sent for Testing' | 'Report Received'>('Not Required');

  // Filtered UD cases
  const visibleUDCases = activePS ? udCases.filter((u) => u.ps === activePS) : udCases;
  const visibleNonSrCases = activePS ? nonSrCases.filter((c) => c.ps === activePS) : nonSrCases;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!udCaseNo.trim() || !deceasedName.trim() || !placeOfOccurrence.trim() || !causeOfDeath.trim()) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    onAddUDCase({
      udCaseNo: udCaseNo.trim(),
      ps,
      date,
      deceasedName: deceasedName.trim(),
      deceasedAgeGender: deceasedAgeGender.trim() || undefined,
      placeOfOccurrence: placeOfOccurrence.trim(),
      causeOfDeath: causeOfDeath.trim(),
      postMortemReportStatus: pmStatus,
      visceralReportStatus: visceraStatus,
      status: 'Under Investigation',
      ciSupervisionRemarks: isCI || isSuperUser ? 'Reviewed by Circle Inspector.' : undefined,
    });

    setIsAddModalOpen(false);
    setUdCaseNo('');
    setDeceasedName('');
    setDeceasedAgeGender('');
    setPlaceOfOccurrence('');
    setCauseOfDeath('');
  };

  const handleUpdateUDSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUD) return;
    onUpdateUDCase(editingUD);
    setEditingUD(null);
  };

  const handleExportExcel = () => {
    if (activeSubTab === 'UD') {
      const headers = ['UD Case No', 'Police Station', 'Date', 'Deceased Name', 'Age / Gender', 'Place of Occurrence', 'Cause of Death', 'Post Mortem Report', 'Viscera Report', 'CI Remarks'];
      const rows = visibleUDCases.map((u) => [
        u.udCaseNo,
        `${u.ps} PS`,
        u.date,
        u.deceasedName,
        u.deceasedAgeGender || 'N/A',
        u.placeOfOccurrence,
        u.causeOfDeath,
        u.postMortemReportStatus,
        u.visceralReportStatus,
        u.ciSupervisionRemarks || 'N/A',
      ]);
      exportToExcel('UD_Cases_Register_Report', headers, rows);
    } else {
      const headers = ['FIR No', 'Police Station', 'FIR Date', 'Sections', 'IO Name', 'Status', 'CI Supervision Remark'];
      const rows = visibleNonSrCases.map((c) => [
        c.firNumber,
        `${c.ps} PS`,
        c.firDate,
        c.sections,
        c.ioName,
        c.status,
        c.ciSupervisionNote || 'N/A',
      ]);
      exportToExcel('NON_SR_Cases_Supervision_Report', headers, rows);
    }
  };

  const handleExportPDF = () => {
    if (activeSubTab === 'UD') {
      const headers = ['UD Case & Station', 'Deceased Particulars', 'Occurrence & Cause', 'Post Mortem', 'Viscera', 'CI Remarks'];
      const rows = visibleUDCases.map((u) => [
        `${u.udCaseNo}\n${u.ps} PS (${u.date})`,
        `${u.deceasedName}\n${u.deceasedAgeGender || ''}`,
        `Cause: ${u.causeOfDeath}\nPO: ${u.placeOfOccurrence}`,
        u.postMortemReportStatus,
        u.visceralReportStatus,
        u.ciSupervisionRemarks || 'N/A',
      ]);
      exportToPDF(
        'Unnatural Death (UD) Cases Register Report',
        `Circle Inspector Supervision Audit (${visibleUDCases.length} Records)`,
        headers,
        rows,
        [{ label: 'Total UD Cases', value: visibleUDCases.length }]
      );
    } else {
      const headers = ['FIR No & PS', 'FIR Date', 'Sections & Offence', 'IO Name', 'Status', 'CI Supervision Directive'];
      const rows = visibleNonSrCases.map((c) => [
        `FIR ${c.firNumber} (${c.ps} PS)`,
        c.firDate,
        c.sections,
        c.ioName,
        c.status,
        c.ciSupervisionNote || 'Pending CI Directive',
      ]);
      exportToPDF(
        'NON-SR Cases Circle Inspector Supervision Report',
        `Subdivision NON-SR Case Audit (${visibleNonSrCases.length} Cases)`,
        headers,
        rows,
        [{ label: 'Total NON-SR Cases', value: visibleNonSrCases.length }]
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-blue-400 rounded border border-slate-700 font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Circle Inspector (CI) & SDPO Supervision Desk {activePS ? `— ${activePS} PS` : ''}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervision desk for Unnatural Death (UD) Cases & NON-SR Criminal Cases across Tarapur Subdivision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
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
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New UD Case Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded w-fit">
        <button
          onClick={() => setActiveSubTab('UD')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'UD'
              ? 'bg-slate-900 text-white dark:bg-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>UD Cases Register ({visibleUDCases.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('NON_SR')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'NON_SR'
              ? 'bg-slate-900 text-white dark:bg-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>NON-SR Cases Supervision ({visibleNonSrCases.length})</span>
        </button>
      </div>

      {/* UD Cases View */}
      {activeSubTab === 'UD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleUDCases.length === 0 ? (
            <div className="col-span-2 bg-white dark:bg-slate-900 p-12 text-center rounded border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">No Unnatural Death (UD) Cases Found</p>
            </div>
          ) : (
            visibleUDCases.map((u) => (
              <div key={u.id} className="bg-white dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded">
                      {u.udCaseNo}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {u.ps} PS
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    {formatReadableDate(u.date)}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Deceased: {u.deceasedName}
                  </div>
                  {u.deceasedAgeGender && (
                    <div className="text-slate-500 text-[11px]">Age/Gender: {u.deceasedAgeGender}</div>
                  )}
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Cause of Death:</strong> {u.causeOfDeath}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    <strong>PO:</strong> {u.placeOfOccurrence}
                  </p>
                </div>

                {/* Medical & FSL Status */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Post Mortem:</span>
                    <span className={`font-bold ${u.postMortemReportStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {u.postMortemReportStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Viscera Testing:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{u.visceralReportStatus}</span>
                  </div>
                </div>

                {/* Supervision Remarks */}
                {u.ciSupervisionRemarks && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs">
                    <strong>CI Directive:</strong> {u.ciSupervisionRemarks}
                  </div>
                )}

                {!isReadOnly && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setEditingUD(u)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-1.5 rounded transition"
                    >
                      Edit Status & Remarks
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* NON-SR Cases View */}
      {activeSubTab === 'NON_SR' && (
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
              NON-SR Criminal Cases Assigned to Circle Inspector / SDPO
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">FIR No & PS</th>
                  <th className="py-2.5 px-4">FIR Date</th>
                  <th className="py-2.5 px-4">Sections</th>
                  <th className="py-2.5 px-4">IO Name</th>
                  <th className="py-2.5 px-4">CI Supervision Remark</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {visibleNonSrCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      FIR {c.firNumber} ({c.ps} PS)
                    </td>
                    <td className="py-3 px-4">{formatReadableDate(c.firDate)}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={c.sections}>{c.sections}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{c.ioName}</td>
                    <td className="py-3 px-4 italic text-slate-600 dark:text-slate-300">
                      {c.ciSupervisionNote || 'No CI memo entered yet'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewFIR(c)}
                          className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => onEditFIR(c)}
                            className="px-2.5 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-[10px] uppercase rounded hover:bg-blue-600"
                          >
                            Supervise
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New UD Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">New Unnatural Death (UD) Case Entry</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Police Station</label>
                  <select
                    value={ps}
                    onChange={(e) => setPs(e.target.value as PoliceStationName)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  >
                    <option value="Tarapur">Tarapur PS</option>
                    <option value="Asarganj">Asarganj PS</option>
                    <option value="Sangrampur">Sangrampur PS</option>
                    <option value="Harpur">Harpur PS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">UD Case Number</label>
                  <input
                    type="text"
                    value={udCaseNo}
                    onChange={(e) => setUdCaseNo(e.target.value)}
                    placeholder="e.g. UD 14/2026"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deceased Name & Particulars</label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="Full Name of Deceased"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Age / Gender</label>
                  <input
                    type="text"
                    value={deceasedAgeGender}
                    onChange={(e) => setDeceasedAgeGender(e.target.value)}
                    placeholder="e.g. 30 Yrs / Male"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Occurrence Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Place of Occurrence</label>
                <input
                  type="text"
                  value={placeOfOccurrence}
                  onChange={(e) => setPlaceOfOccurrence(e.target.value)}
                  placeholder="Village, River bank, Railway track..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Suspected Cause of Death</label>
                <input
                  type="text"
                  value={causeOfDeath}
                  onChange={(e) => setCauseOfDeath(e.target.value)}
                  placeholder="Drowning, Electrocution, Poisoning, Traffic Accident..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700"
                >
                  Register UD Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit UD Modal */}
      {editingUD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Update UD Case {editingUD.udCaseNo}</h3>
              <button onClick={() => setEditingUD(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUDSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Post Mortem Report</label>
                  <select
                    value={editingUD.postMortemReportStatus}
                    onChange={(e) => setEditingUD({ ...editingUD, postMortemReportStatus: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Viscera Testing</label>
                  <select
                    value={editingUD.visceralReportStatus}
                    onChange={(e) => setEditingUD({ ...editingUD, visceralReportStatus: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  >
                    <option value="Not Required">Not Required</option>
                    <option value="Sent for Testing">Sent for Testing</option>
                    <option value="Report Received">Report Received</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Circle Inspector (CI) Remarks</label>
                <textarea
                  rows={3}
                  value={editingUD.ciSupervisionRemarks || ''}
                  onChange={(e) => setEditingUD({ ...editingUD, ciSupervisionRemarks: e.target.value })}
                  placeholder="Enter CI supervision order or final closure directive..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUD(null)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700"
                >
                  Save UD Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
