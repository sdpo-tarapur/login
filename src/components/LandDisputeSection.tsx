import React, { useState } from 'react';
import { LandDispute, PoliceStationName, UserRole } from '../types';
import { formatReadableDate, getPSFromRole } from '../utils/helpers';
import { Scale, Plus, Search, RotateCcw, CheckCircle2, AlertCircle, Calendar, MapPin, Check, X, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface LandDisputeSectionProps {
  landDisputes: LandDispute[];
  currentRole: UserRole;
  onAddLandDispute: (dispute: Omit<LandDispute, 'id' | 'createdAt'>) => void;
  onUpdateLandDisputeStatus: (id: string, status: 'Pending' | 'Disposed', disposalRemarks?: string) => void;
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
  isReadOnly?: boolean;
}

export const LandDisputeSection: React.FC<LandDisputeSectionProps> = ({
  landDisputes,
  currentRole,
  onAddLandDispute,
  onUpdateLandDisputeStatus,
  isNewModalOpen,
  setIsNewModalOpen,
  isReadOnly = false,
}) => {
  const activePS = getPSFromRole(currentRole);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [psFilter, setPsFilter] = useState<'ALL' | PoliceStationName>(activePS || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Disposed'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Disposal modal state
  const [disposingId, setDisposingId] = useState<string | null>(null);
  const [disposalRemarks, setDisposalRemarks] = useState('');

  // New Form state
  const [newPs, setNewPs] = useState<PoliceStationName>(activePS || 'Tarapur');
  const [newDate, setNewDate] = useState(todayStr); // Auto-fetches current date
  const [victimName, setVictimName] = useState('');
  const [victimAddress, setVictimAddress] = useState('');
  const [oppositePartyName, setOppositePartyName] = useState('');
  const [plotDetails, setPlotDetails] = useState('');
  const [disputeNature, setDisputeNature] = useState('');
  const [janataDarbarAction, setJanataDarbarAction] = useState('');

  // Filter logic
  const filteredDisputes = landDisputes.filter((item) => {
    // PS Filter
    if (activePS && item.ps !== activePS) return false;
    if (!activePS && psFilter !== 'ALL' && item.ps !== psFilter) return false;

    // Status Filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.victimName.toLowerCase().includes(q) ||
        item.victimAddress.toLowerCase().includes(q) ||
        (item.oppositePartyName && item.oppositePartyName.toLowerCase().includes(q)) ||
        item.plotDetails.toLowerCase().includes(q) ||
        item.disputeNature.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Date Range
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;

    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!victimName.trim() || !victimAddress.trim() || !plotDetails.trim() || !disputeNature.trim()) {
      alert('Please fill in Victim Name, Victim Address, Plot Details, and Dispute Nature.');
      return;
    }

    onAddLandDispute({
      ps: newPs,
      date: newDate || todayStr,
      victimName: victimName.trim(),
      victimAddress: victimAddress.trim(),
      oppositePartyName: oppositePartyName.trim() || undefined,
      plotDetails: plotDetails.trim(),
      disputeNature: disputeNature.trim(),
      status: 'Pending',
      janataDarbarAction: janataDarbarAction.trim() || 'Listed for upcoming Saturday Janata Darbar',
    });

    // Reset form
    setVictimName('');
    setVictimAddress('');
    setOppositePartyName('');
    setPlotDetails('');
    setDisputeNature('');
    setJanataDarbarAction('');
    setIsNewModalOpen(false);
  };

  const handleConfirmDisposal = () => {
    if (!disposingId) return;
    onUpdateLandDisputeStatus(disposingId, 'Disposed', disposalRemarks.trim() || 'Disposed in Janata Darbar joint meeting.');
    setDisposingId(null);
    setDisposalRemarks('');
  };

  const handleExportExcel = () => {
    const headers = ['Police Station', 'Reported Date', 'Victim Name & Address', 'Opposite Party', 'Plot Details', 'Dispute Nature', 'Janata Darbar Action', 'Status'];
    const rows = filteredDisputes.map((item) => [
      `${item.ps} PS`,
      item.date,
      `${item.victimName} (${item.victimAddress})`,
      item.oppositePartyName || 'N/A',
      item.plotDetails,
      item.disputeNature,
      item.janataDarbarAction || 'N/A',
      item.status,
    ]);

    exportToExcel('Land_Disputes_Janata_Darbar_Report', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Station & Date', 'First Party (Victim)', 'Second Party', 'Plot / Mouza', 'Dispute Nature', 'Status & Action'];
    const rows = filteredDisputes.map((item) => [
      `${item.ps} PS\n${item.date}`,
      `${item.victimName}\n${item.victimAddress}`,
      item.oppositePartyName || 'N/A',
      item.plotDetails,
      item.disputeNature,
      `${item.status.toUpperCase()}\n${item.janataDarbarAction || ''}`,
    ]);

    const pendingCount = filteredDisputes.filter((d) => d.status === 'Pending').length;
    const disposedCount = filteredDisputes.filter((d) => d.status === 'Disposed').length;

    exportToPDF(
      'Land Dispute & Janata Darbar Register Report',
      `Subdivision Land Dispute Tracking (${filteredDisputes.length} Records)`,
      headers,
      rows,
      [
        { label: 'Total Disputes', value: filteredDisputes.length },
        { label: 'Pending Resolution', value: pendingCount },
        { label: 'Disposed / Resolved', value: disposedCount },
      ]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 font-bold shadow-xs">
            <Scale className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Land Dispute Monitoring & Janata Darbar Register {activePS ? `— ${activePS} PS` : ''}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Track land disputes across Tarapur Subdivision till joint disposal by Police & Revenue Officers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Land Dispute Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Victim Name, Address, Opposite Party, Plot/Khata..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1 text-xs font-bold rounded transition ${
                statusFilter === 'Pending'
                  ? 'bg-red-600 text-white'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('Disposed')}
              className={`px-3 py-1 text-xs font-bold rounded transition ${
                statusFilter === 'Disposed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
              }`}
            >
              Disposed
            </button>
          </div>

        </div>

        {/* PS and Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
          
          {!activePS && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Police Station:</span>
              <select
                value={psFilter}
                onChange={(e) => setPsFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs p-1.5 font-medium"
              >
                <option value="ALL">All 4 Police Stations</option>
                <option value="Tarapur">Tarapur PS</option>
                <option value="Asarganj">Asarganj PS</option>
                <option value="Sangrampur">Sangrampur PS</option>
                <option value="Harpur">Harpur PS</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1"
            />
            <span className="text-slate-400 text-[11px]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1"
            />
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setPsFilter('ALL');
              setStatusFilter('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

      </div>

      {/* Disputes Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDisputes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded border border-slate-200 dark:border-slate-800 shadow-sm">
            <Scale className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">No Land Disputes Found</h3>
            <p className="text-xs text-slate-500 mt-1">Adjust your filters or add a new land dispute entry.</p>
          </div>
        ) : (
          filteredDisputes.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              
              <div className="space-y-2 flex-1">
                
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {item.ps} PS
                  </span>
                  
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reported: <strong>{formatReadableDate(item.date)}</strong></span>
                  </span>

                  {item.status === 'Pending' ? (
                    <span className="bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>PENDING RESOLUTION</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>DISPOSED on {formatReadableDate(item.disposalDate)}</span>
                    </span>
                  )}
                </div>

                {/* Victim Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Victim / First Party:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.victimName}</p>
                    <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{item.victimAddress}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Opposite Party:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {item.oppositePartyName || 'N/A / Unspecified'}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Nature: <strong className="text-slate-700 dark:text-slate-300">{item.disputeNature}</strong></p>
                  </div>
                </div>

                {/* Plot / Land details */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Plot & Mouza Details: </span>
                  <span className="font-medium text-slate-900 dark:text-white">{item.plotDetails}</span>
                </div>

                {/* Action Taken / Remarks */}
                {item.janataDarbarAction && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>Janata Darbar Action:</strong> {item.janataDarbarAction}
                  </p>
                )}

                {item.status === 'Disposed' && item.disposalRemarks && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                    <strong>Disposal Remarks:</strong> {item.disposalRemarks}
                  </p>
                )}

              </div>

              {/* Status Action Buttons */}
              {!isReadOnly && (
                <div className="flex md:flex-col items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
                  {item.status === 'Pending' ? (
                    <button
                      onClick={() => {
                        setDisposingId(item.id);
                        setDisposalRemarks('');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Disposed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateLandDisputeStatus(item.id, 'Pending')}
                      className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs px-3 py-1.5 rounded transition"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* New Land Dispute Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">New Land Dispute Entry</h3>
                  <p className="text-xs text-slate-400">Auto-fetches current date ({todayStr})</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Police Station <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newPs}
                    onChange={(e) => setNewPs(e.target.value as PoliceStationName)}
                    disabled={Boolean(activePS)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Tarapur">Tarapur PS</option>
                    <option value="Asarganj">Asarganj PS</option>
                    <option value="Sangrampur">Sangrampur PS</option>
                    <option value="Harpur">Harpur PS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entry Date (Auto-fetched)
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Victim Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  placeholder="Full Name of Victim / First Party"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Victim Complete Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={victimAddress}
                  onChange={(e) => setVictimAddress(e.target.value)}
                  placeholder="Village, Ward No., Panchayat, Post Office"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Opposite Party Name
                  </label>
                  <input
                    type="text"
                    value={oppositePartyName}
                    onChange={(e) => setOppositePartyName(e.target.value)}
                    placeholder="Name of second party / encroacher"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nature of Land Dispute <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={disputeNature}
                    onChange={(e) => setDisputeNature(e.target.value)}
                    placeholder="Boundary / Pathway / Possession / Water channel"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Plot, Khata, Khesra & Mouza Details <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={plotDetails}
                  onChange={(e) => setPlotDetails(e.target.value)}
                  placeholder="Khata No., Khesra No., Area in Decimal/Katha, Mouza name"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Janata Darbar Action / Preventative Action Taken
                </label>
                <input
                  type="text"
                  value={janataDarbarAction}
                  onChange={(e) => setJanataDarbarAction(e.target.value)}
                  placeholder="e.g. Scheduled for Saturday Janata Darbar / Sec 126 BNSS notice issued"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Submit Land Dispute</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Disposal Remarks Modal */}
      {disposingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Mark Land Dispute Disposed</span>
            </h3>

            <p className="text-slate-600 dark:text-slate-300">
              Please enter the disposal summary or settlement agreement details from Janata Darbar / CO joint meeting.
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Disposal Remarks & Resolution Method
              </label>
              <textarea
                rows={3}
                value={disposalRemarks}
                onChange={(e) => setDisposalRemarks(e.target.value)}
                placeholder="e.g. Resolved in Janata Darbar by CO & SHO. Boundary pillars demarcated peacefully."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDisposingId(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisposal}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700"
              >
                Confirm Disposal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
