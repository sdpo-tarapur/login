import React, { useState } from 'react';
import { FIRCase, PoliceStationName, InvestigatingOfficer, UserRole } from '../types';
import { getPSFromRole } from '../utils/helpers';
import { X, Shield, Plus, Calendar, MapPin, User, FileText, Clock } from 'lucide-react';

interface NewFIREntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newCase: Omit<FIRCase, 'id' | 'createdAt' | 'updatedAt'>) => void;
  currentRole: UserRole;
  investigatingOfficers: InvestigatingOfficer[];
}

export const NewFIREntryModal: React.FC<NewFIREntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentRole,
  investigatingOfficers,
}) => {
  const activePS = getPSFromRole(currentRole);

  // Filter IO list to only show IOs for the logged in PS (or all if SDPO/CI)
  const availableIOs = activePS
    ? investigatingOfficers.filter((io) => io.ps === activePS || io.ps === 'Subdivision HQ')
    : investigatingOfficers;

  const todayStr = new Date().toISOString().split('T')[0];

  const [ps, setPs] = useState<PoliceStationName>(activePS || 'Tarapur');
  const [firNumber, setFirNumber] = useState('');
  const [firDate, setFirDate] = useState(todayStr);
  const [sections, setSections] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [placeOfOccurrence, setPlaceOfOccurrence] = useState('');
  const [ioName, setIoName] = useState(availableIOs[0]?.name || 'SDPO Tarapur (Self / Super User)');
  const [deadlineDays, setDeadlineDays] = useState<60 | 90>(60);
  const [psProgressRemarks, setPsProgressRemarks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firNumber.trim() || !sections.trim() || !complainantName.trim() || !placeOfOccurrence.trim()) {
      alert('Please fill in all mandatory fields (FIR Number, Sections, Complainant, Place of Occurrence).');
      return;
    }

    onSubmit({
      firNumber: firNumber.trim(),
      ps,
      firDate,
      sections: sections.trim(),
      complainantName: complainantName.trim(),
      complainantPhone: complainantPhone.trim(),
      placeOfOccurrence: placeOfOccurrence.trim(),
      ioName,
      designation: 'PENDING_DESIGNATION', // Super User will classify later
      deadlineDays,
      status: 'Under Investigation',
      chargesheetUploadedCCTNS: false,
      caseDiaryUploadedCCTNS: false,
      psProgressRemarks: psProgressRemarks.trim() || 'FIR registered and investigation initiated.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New FIR Entry Registration</h2>
              <p className="text-xs text-slate-400">Add official crime report for Tarapur Subdivision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* PS Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Police Station <span className="text-rose-500">*</span>
              </label>
              <select
                value={ps}
                onChange={(e) => setPs(e.target.value as PoliceStationName)}
                disabled={Boolean(activePS)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
              >
                <option value="Tarapur">Tarapur PS</option>
                <option value="Asarganj">Asarganj PS</option>
                <option value="Sangrampur">Sangrampur PS</option>
                <option value="Harpur">Harpur PS</option>
              </select>
            </div>

            {/* FIR Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                FIR Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                placeholder="e.g. 145/2026"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* FIR Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                FIR Registration Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={firDate}
                onChange={(e) => setFirDate(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Statutory Investigation Deadline */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Statutory Deadline Limit <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeadlineDays(60)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    deadlineDays === 60
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>60 Days</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeadlineDays(90)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    deadlineDays === 90
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>90 Days</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">90 days for major offences (death/life/&gt;10y), 60 days for standard cases.</p>
            </div>

          </div>

          {/* Legal Sections */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              IPC / BNS & Special Acts Sections <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={sections}
              onChange={(e) => setSections(e.target.value)}
              placeholder="e.g. Sec 302, 120B IPC / BNS Sec 103, 61 & Arms Act"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Complainant Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Complainant Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                placeholder="Full Complainant Name"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Complainant Phone */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Complainant Phone / Mobile
              </label>
              <input
                type="text"
                value={complainantPhone}
                onChange={(e) => setComplainantPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

          </div>

          {/* Place of Occurrence */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Place of Occurrence (PO) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={placeOfOccurrence}
              onChange={(e) => setPlaceOfOccurrence(e.target.value)}
              placeholder="Village, Landmark, Ward No., Panchayat"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Investigating Officer Dropdown */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Investigating Officer (IO) <span className="text-rose-500">*</span>
            </label>
            <select
              value={ioName}
              onChange={(e) => setIoName(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
            >
              {availableIOs.map((io) => (
                <option key={io.id} value={io.name}>
                  {io.name} — ({io.rank}, {io.ps})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">SDPO Tarapur can be designated IO for any PS case in the subdivision.</p>
          </div>

          {/* Initial Remarks */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Investigation Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={psProgressRemarks}
              onChange={(e) => setPsProgressRemarks(e.target.value)}
              placeholder="Brief details of initial action taken by PS IO..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register FIR Case</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
