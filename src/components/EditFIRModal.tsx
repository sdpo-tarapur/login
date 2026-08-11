import React, { useState, useEffect } from 'react';
import { FIRCase, CaseStatus, CaseDesignation, UserRole, InvestigatingOfficer, PoliceStationName } from '../types';
import { getDeadlineInfo, formatReadableDate, getPSFromRole } from '../utils/helpers';
import { X, Shield, Save, CloudUpload, Clock, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

interface EditFIRModalProps {
  caseItem: FIRCase | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCase: FIRCase) => void;
  currentRole: UserRole;
  investigatingOfficers: InvestigatingOfficer[];
  isSupervisionMode?: boolean;
  isReadOnly?: boolean;
}

export const EditFIRModal: React.FC<EditFIRModalProps> = ({
  caseItem,
  isOpen,
  onClose,
  onUpdate,
  currentRole,
  investigatingOfficers,
  isSupervisionMode = false,
  isReadOnly = false,
}) => {
  if (!isOpen || !caseItem) return null;

  const isSuperUser = currentRole === 'SDPO';
  const isCircleInspector = currentRole === 'CI';
  const activePS = getPSFromRole(currentRole);

  // Filter IOs to match current PS context or all if SDPO
  const availableIOs = isSuperUser || isCircleInspector
    ? investigatingOfficers
    : investigatingOfficers.filter((io) => io.ps === (activePS || caseItem.ps) || io.ps === 'Subdivision HQ');

  // Form Fields State
  const [ps, setPs] = useState<PoliceStationName>(caseItem.ps);
  const [firNumber, setFirNumber] = useState(caseItem.firNumber);
  const [firDate, setFirDate] = useState(caseItem.firDate);
  const [deadlineDays, setDeadlineDays] = useState<60 | 90>(caseItem.deadlineDays);
  const [sections, setSections] = useState(caseItem.sections);
  const [complainantName, setComplainantName] = useState(caseItem.complainantName);
  const [complainantPhone, setComplainantPhone] = useState(caseItem.complainantPhone || '');
  const [placeOfOccurrence, setPlaceOfOccurrence] = useState(caseItem.placeOfOccurrence);

  const [status, setStatus] = useState<CaseStatus>(caseItem.status);
  const [designation, setDesignation] = useState<CaseDesignation>(caseItem.designation);
  const [ioName, setIoName] = useState(caseItem.ioName);
  const [chargesheetNumber, setChargesheetNumber] = useState(caseItem.chargesheetNumber || '');
  const [chargesheetDate, setChargesheetDate] = useState(caseItem.chargesheetDate || '');
  const [chargesheetUploadedCCTNS, setChargesheetUploadedCCTNS] = useState(caseItem.chargesheetUploadedCCTNS);
  
  const [caseDiaryUploadedCCTNS, setCaseDiaryUploadedCCTNS] = useState(caseItem.caseDiaryUploadedCCTNS);
  const [lastCaseDiaryNo, setLastCaseDiaryNo] = useState(caseItem.lastCaseDiaryNo || '');
  const [lastCaseDiaryDate, setLastCaseDiaryDate] = useState(caseItem.lastCaseDiaryDate || '');

  const [sdpoNote, setSdpoNote] = useState(caseItem.sdpoSupervisionNote || '');
  const [ciNote, setCiNote] = useState(caseItem.ciSupervisionNote || '');
  const [psProgressRemarks, setPsProgressRemarks] = useState(caseItem.psProgressRemarks || '');

  // Supervision Dates State
  const [poVisitDate, setPoVisitDate] = useState(caseItem.poVisitDate || '');
  const [supervisionDate, setSupervisionDate] = useState(caseItem.supervisionDate || '');
  const [prDates, setPrDates] = useState<string[]>(caseItem.prDates || []);
  const [finalPrDate, setFinalPrDate] = useState(caseItem.finalPrDate || '');
  const [caseReviewDates, setCaseReviewDates] = useState<string[]>(caseItem.caseReviewDates || []);

  const [newPrDateInput, setNewPrDateInput] = useState('');
  const [newReviewDateInput, setNewReviewDateInput] = useState('');

  // Sync state whenever caseItem or isOpen changes
  useEffect(() => {
    if (caseItem) {
      setPs(caseItem.ps);
      setFirNumber(caseItem.firNumber);
      setFirDate(caseItem.firDate);
      setDeadlineDays(caseItem.deadlineDays);
      setSections(caseItem.sections);
      setComplainantName(caseItem.complainantName);
      setComplainantPhone(caseItem.complainantPhone || '');
      setPlaceOfOccurrence(caseItem.placeOfOccurrence);
      setStatus(caseItem.status);
      setDesignation(caseItem.designation);
      setIoName(caseItem.ioName);
      setChargesheetNumber(caseItem.chargesheetNumber || '');
      setChargesheetDate(caseItem.chargesheetDate || '');
      setChargesheetUploadedCCTNS(caseItem.chargesheetUploadedCCTNS);
      setCaseDiaryUploadedCCTNS(caseItem.caseDiaryUploadedCCTNS);
      setLastCaseDiaryNo(caseItem.lastCaseDiaryNo || '');
      setLastCaseDiaryDate(caseItem.lastCaseDiaryDate || '');
      setPsProgressRemarks(caseItem.psProgressRemarks || '');
      setSdpoNote(caseItem.sdpoSupervisionNote || '');
      setCiNote(caseItem.ciSupervisionNote || '');
      setPoVisitDate(caseItem.poVisitDate || '');
      setSupervisionDate(caseItem.supervisionDate || '');
      setPrDates(caseItem.prDates || []);
      setFinalPrDate(caseItem.finalPrDate || '');
      setCaseReviewDates(caseItem.caseReviewDates || []);
    }
  }, [caseItem, isOpen]);

  const deadline = getDeadlineInfo({ ...caseItem, firDate, deadlineDays, status });

  const handleAddPrDate = () => {
    if (!newPrDateInput) return;
    if (!prDates.includes(newPrDateInput)) {
      setPrDates([...prDates, newPrDateInput].sort());
    }
    setNewPrDateInput('');
  };

  const handleRemovePrDate = (dateToRemove: string) => {
    setPrDates(prDates.filter((d) => d !== dateToRemove));
  };

  const handleAddReviewDate = () => {
    if (!newReviewDateInput) return;
    if (!caseReviewDates.includes(newReviewDateInput)) {
      setCaseReviewDates([...caseReviewDates, newReviewDateInput].sort());
    }
    setNewReviewDateInput('');
  };

  const handleRemoveReviewDate = (dateToRemove: string) => {
    setCaseReviewDates(caseReviewDates.filter((d) => d !== dateToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      alert('Permission Denied: Your account has Read-Only (VIEWER) permissions. You cannot edit case records.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const updated: FIRCase = {
      ...caseItem,
      ps,
      firNumber: firNumber.trim(),
      firDate,
      deadlineDays,
      sections: sections.trim(),
      complainantName: complainantName.trim(),
      complainantPhone: complainantPhone.trim() || undefined,
      placeOfOccurrence: placeOfOccurrence.trim(),
      status,
      designation: isSuperUser ? designation : caseItem.designation,
      ioName,
      chargesheetNumber: chargesheetNumber.trim() || undefined,
      chargesheetDate: chargesheetDate || undefined,
      chargesheetUploadedCCTNS,
      chargesheetCCTNSDate: chargesheetUploadedCCTNS ? (caseItem.chargesheetCCTNSDate || todayStr) : undefined,
      caseDiaryUploadedCCTNS,
      lastCaseDiaryNo: lastCaseDiaryNo.trim() || undefined,
      lastCaseDiaryDate: lastCaseDiaryDate || undefined,
      poVisitDate: poVisitDate || undefined,
      supervisionDate: supervisionDate || undefined,
      prDates: prDates.length > 0 ? prDates : undefined,
      finalPrDate: finalPrDate || undefined,
      caseReviewDates: caseReviewDates.length > 0 ? caseReviewDates : undefined,
      sdpoSupervisionNote: sdpoNote.trim() || undefined,
      ciSupervisionNote: ciNote.trim() || undefined,
      psProgressRemarks: psProgressRemarks.trim() || undefined,
      updatedAt: todayStr,
    };

    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {isSupervisionMode ? 'Update Supervision Milestone Dates & Notes' : 'Edit FIR Record & CCTNS Status'}
                </h2>
                <span className="bg-amber-400/20 text-amber-300 font-mono text-xs px-2 py-0.5 rounded border border-amber-400/30">
                  {ps} PS • FIR {firNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">Date: {formatReadableDate(firDate)} | Complainant: {complainantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">

          {/* Deadline Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${deadline.badgeBg}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px]">Statutory {deadlineDays}-Day Limit Status:</span>
                <div className="font-extrabold text-sm mt-0.5">{deadline.label}</div>
              </div>
            </div>
            <div className="text-right text-[11px] font-medium">
              FIR Registration Date: {formatReadableDate(firDate)}
            </div>
          </div>

          {/* Fields when editing from FIR Records (isSupervisionMode === false) */}
          {!isSupervisionMode && (
            <>
              {/* Police Station & FIR Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Police Station <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ps}
                    onChange={(e) => setPs(e.target.value as PoliceStationName)}
                    disabled={!isSuperUser && Boolean(activePS)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Tarapur">Tarapur PS</option>
                    <option value="Asarganj">Asarganj PS</option>
                    <option value="Sangrampur">Sangrampur PS</option>
                    <option value="Harpur">Harpur PS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    FIR Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firNumber}
                    onChange={(e) => setFirNumber(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* FIR Registration Date & Statutory Deadline Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* IPC / BNS & Special Acts Sections */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  IPC / BNS & Special Acts Sections <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sections}
                  onChange={(e) => setSections(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Complainant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Complainant Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Complainant Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={complainantPhone}
                    onChange={(e) => setComplainantPhone(e.target.value)}
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
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          )}

          {/* Super User SR / NON-SR Classification Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Super User (SDPO) Designation Control</span>
              </span>
              {!isSuperUser && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                  Only Super User (SDPO) can alter SR/NON-SR
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!isSuperUser}
                onClick={() => setDesignation('SR')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  designation === 'SR'
                    ? 'bg-purple-600 text-white border-purple-600 shadow'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                } ${!isSuperUser ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>⭐ Special Report (SR)</span>
              </button>

              <button
                type="button"
                disabled={!isSuperUser}
                onClick={() => setDesignation('NON_SR')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  designation === 'NON_SR'
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                } ${!isSuperUser ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>👮 NON-SR Case</span>
              </button>

              <button
                type="button"
                disabled={!isSuperUser}
                onClick={() => setDesignation('PENDING_DESIGNATION')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  designation === 'PENDING_DESIGNATION'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                } ${!isSuperUser ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>❓ Pending Designation</span>
              </button>
            </div>
          </div>

          {/* Investigation Stage Status & IO Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Investigation Stage Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CaseStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
              >
                <option value="Under Investigation">Under Investigation</option>
                <option value="Chargesheeted / Final Form Submitted">Chargesheeted / Final Form Submitted</option>
                <option value="False Case / Mistake of Fact">False Case / Mistake of Fact</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Investigating Officer (IO)
              </label>
              <select
                value={ioName}
                onChange={(e) => setIoName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amber-500"
              >
                {availableIOs.map((io) => (
                  <option key={io.id} value={io.name}>
                    {io.name} ({io.ps})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {!isSupervisionMode && (
            <>
              {/* Chargesheet & Final Form Submission Details */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Chargesheet / Final Form & CCTNS Upload Status</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Chargesheet / Final Form Number
                    </label>
                    <input
                      type="text"
                      value={chargesheetNumber}
                      onChange={(e) => setChargesheetNumber(e.target.value)}
                      placeholder="e.g. CS No. 112/2026"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Chargesheet Submission Date
                    </label>
                    <input
                      type="date"
                      value={chargesheetDate}
                      onChange={(e) => setChargesheetDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* CCTNS Checkbox */}
                <div className="pt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={chargesheetUploadedCCTNS}
                      onChange={(e) => setChargesheetUploadedCCTNS(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Chargesheet Successfully Uploaded to CCTNS Portal</span>
                  </label>
                </div>
              </div>

              {/* Case Diary (CD) Upload to CCTNS Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CloudUpload className="w-4 h-4 text-blue-500" />
                  <span>Case Diary (CD) & CCTNS Portal Synchronization</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Last Case Diary (CD) Number
                    </label>
                    <input
                      type="text"
                      value={lastCaseDiaryNo}
                      onChange={(e) => setLastCaseDiaryNo(e.target.value)}
                      placeholder="e.g. CD No. 04"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      CD Submission / Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={lastCaseDiaryDate}
                      onChange={(e) => setLastCaseDiaryDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={caseDiaryUploadedCCTNS}
                      onChange={(e) => setCaseDiaryUploadedCCTNS(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span>Latest Case Diary Uploaded & Synced on CCTNS</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Supervision Dates Tracking (Shown ONLY in Supervision Mode) */}
          {isSupervisionMode && (
            <>
              <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span>SDPO Supervision Timeline & Milestone Dates</span>
                  </span>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                    Special Report (SR) Tracking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PO Visit Date */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Place of Occurrence (PO) Visit Date
                    </label>
                    <input
                      type="date"
                      value={poVisitDate}
                      onChange={(e) => setPoVisitDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  {/* Supervision Date */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Supervision Note Date
                    </label>
                    <input
                      type="date"
                      value={supervisionDate}
                      onChange={(e) => setSupervisionDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>

                  {/* Final PR Date */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Final PR Date
                    </label>
                    <input
                      type="date"
                      value={finalPrDate}
                      onChange={(e) => setFinalPrDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-medium text-xs"
                    />
                  </div>
                </div>

                {/* PR Dates (Multiple) */}
                <div className="pt-1 border-t border-purple-200/60 dark:border-purple-800/40">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Progress Report (PR) Dates (Multiple PRs)
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {prDates.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px]">No PR dates added yet.</span>
                    ) : (
                      prDates.map((date, idx) => (
                        <span
                          key={date}
                          className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-xs font-bold px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-700"
                        >
                          <span>PR #{idx + 1}: {date}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePrDate(date)}
                            className="text-purple-400 hover:text-rose-600 font-extrabold ml-1"
                            title="Remove PR date"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="date"
                      value={newPrDateInput}
                      onChange={(e) => setNewPrDateInput(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddPrDate}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                    >
                      + Add PR Date
                    </button>
                  </div>
                </div>

                {/* Case Review Dates (Multiple) */}
                <div className="pt-1 border-t border-purple-200/60 dark:border-purple-800/40">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Case Review Dates (Multiple Reviews)
                  </label>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {caseReviewDates.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px]">No case review dates added yet.</span>
                    ) : (
                      caseReviewDates.map((date, idx) => (
                        <span
                          key={date}
                          className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-700"
                        >
                          <span>Review #{idx + 1}: {date}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReviewDate(date)}
                            className="text-blue-400 hover:text-rose-600 font-extrabold ml-1"
                            title="Remove review date"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="date"
                      value={newReviewDateInput}
                      onChange={(e) => setNewReviewDateInput(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddReviewDate}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                    >
                      + Add Review Date
                    </button>
                  </div>
                </div>
              </div>

              {/* Supervision Notes */}
              <div className="space-y-3">
                {/* SDPO Supervision Note */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-purple-500" />
                    <span>SDPO Tarapur Supervision Orders / Directives</span>
                  </label>
                  <textarea
                    rows={2}
                    value={sdpoNote}
                    onChange={(e) => setSdpoNote(e.target.value)}
                    disabled={!isSuperUser}
                    placeholder={isSuperUser ? "Enter SDPO Supervision Memo / Instructions..." : "SDPO Supervision directive..."}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium ${
                      !isSuperUser ? 'opacity-80' : ''
                    }`}
                  />
                </div>

                {/* Circle Inspector Supervision Note */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>Circle Inspector (CI) Supervision Remarks (For NON-SR & UD Cases)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={ciNote}
                    onChange={(e) => setCiNote(e.target.value)}
                    disabled={!isCircleInspector && !isSuperUser}
                    placeholder="Circle Inspector Supervision Note..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </>
          )}

          {/* PS IO Progress Remarks */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Police Station IO Investigation Progress Updates
            </label>
            <textarea
              rows={2}
              value={psProgressRemarks}
              onChange={(e) => setPsProgressRemarks(e.target.value)}
              placeholder="Update ongoing witness statements, arrests, property recovery, FSL reports..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {isReadOnly ? (
              <div className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Read-Only Mode: You cannot modify case records.</span>
              </div>
            ) : <div />}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Case Updates</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
