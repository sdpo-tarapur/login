import React, { useState } from 'react';
import { FIRCase, UserRole, CaseDesignation } from '../types';
import { getDeadlineInfo, formatReadableDate } from '../utils/helpers';
import { Shield, ShieldAlert, Eye, Edit3, CloudUpload, Clock, FileCheck, CheckCircle2, User, MapPin, Tag } from 'lucide-react';

interface FIRTableProps {
  cases: FIRCase[];
  currentRole: UserRole;
  onViewCase: (caseItem: FIRCase) => void;
  onEditCase: (caseItem: FIRCase) => void;
  onDesignateCase: (caseId: string, designation: CaseDesignation) => void;
  isReadOnly?: boolean;
}

export const FIRTable: React.FC<FIRTableProps> = ({
  cases,
  currentRole,
  onViewCase,
  onEditCase,
  onDesignateCase,
  isReadOnly = false,
}) => {
  const isSuperUser = currentRole === 'SDPO';

  if (cases.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">No FIR Cases Match Your Criteria</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Try adjusting or resetting your filters to display recorded subdivision cases.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Table Header Info */}
      <div className="p-4 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-blue-400"></span>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            FIR & Investigation Records ({cases.length} cases)
          </h3>
        </div>
        <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
          showing 60d/90d statutory compliance & CCTNS status
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-4">FIR Details</th>
              <th className="py-2.5 px-4">PS & Date</th>
              <th className="py-2.5 px-4">Sections & PO</th>
              <th className="py-2.5 px-4">Investigating Officer</th>
              <th className="py-2.5 px-4 text-center">SR / NON-SR</th>
              <th className="py-2.5 px-4 text-center">60/90 Day Limit</th>
              <th className="py-2.5 px-4 text-center">CCTNS Sync</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            {cases.map((c) => {
              const deadline = getDeadlineInfo(c);

              return (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  
                  {/* FIR Details */}
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-700 dark:text-blue-400 font-bold text-xs">
                        FIR No. {c.firNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      Comp: <strong className="text-slate-700 dark:text-slate-300">{c.complainantName}</strong>
                    </div>
                  </td>

                  {/* PS & FIR Date */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {c.ps} PS
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{formatReadableDate(c.firDate)}</span>
                    </div>
                  </td>

                  {/* Sections & PO */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={c.sections}>
                      {c.sections}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate" title={c.placeOfOccurrence}>
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.placeOfOccurrence}</span>
                    </div>
                  </td>

                  {/* IO Name */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.ioName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Limit: <strong className="text-slate-700 dark:text-slate-300">{c.deadlineDays} Days</strong>
                    </div>
                  </td>

                  {/* SR / NON-SR Designation Badge & Super User Controls */}
                  <td className="py-3 px-4 text-center">
                    {c.designation === 'SR' && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900">
                        SR Case
                      </span>
                    )}
                    {c.designation === 'NON_SR' && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        NON-SR
                      </span>
                    )}
                    {c.designation === 'PENDING_DESIGNATION' && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900">
                        Unassigned
                      </span>
                    )}

                    {/* Super User quick action to toggle or assign SR/NSR (Hidden if Read-Only) */}
                    {isSuperUser && !isReadOnly && (
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <button
                          onClick={() => onDesignateCase(c.id, 'SR')}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition ${
                            c.designation === 'SR' ? 'bg-rose-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-rose-100'
                          }`}
                          title="Designate as Special Report (SR)"
                        >
                          SR
                        </button>
                        <button
                          onClick={() => onDesignateCase(c.id, 'NON_SR')}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition ${
                            c.designation === 'NON_SR' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Designate as NON-SR Case"
                        >
                          NSR
                        </button>
                      </div>
                    )}
                  </td>

                  {/* 60 / 90 Days Deadline Compliance Pill */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${deadline.badgeBg}`}>
                      {deadline.label}
                    </span>
                  </td>

                  {/* CCTNS Sync Status */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.chargesheetUploadedCCTNS
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <CloudUpload className="w-3 h-3" />
                        <span>CS: {c.chargesheetUploadedCCTNS ? 'Synced' : 'Pending'}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        c.caseDiaryUploadedCCTNS
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                      }`}>
                        <span>CD: {c.caseDiaryUploadedCCTNS ? 'Synced' : 'Pending'}</span>
                      </span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewCase(c)}
                        className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded transition"
                        title="View Case Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!isReadOnly && (
                        <button
                          onClick={() => onEditCase(c)}
                          className="p-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-400 dark:hover:text-white rounded font-semibold transition flex items-center gap-1 text-[10px] px-2"
                          title="Edit Case / Progress"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
