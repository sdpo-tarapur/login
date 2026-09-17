import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserAccount,
  FIRCase,
  LandDispute,
  UDCase,
  InvestigatingOfficer,
  DailyCrimeReport,
  UserMessage,
  LeaveLedgerEntry,
} from '../types';

/**
 * Robust Supabase Service for Tarapur Police Subdivision System.
 * Supports standard PostgreSQL snake_case schema with automatic camelCase fallback.
 */

// Helper to execute upsert with graceful fallback for column casing
async function resilientUpsert(
  tableName: string,
  snakePayload: Record<string, any>,
  camelPayload: Record<string, any>,
  conflictKey: string = 'id'
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    // 1. Try standard PostgreSQL snake_case payload
    const { error: snakeError } = await supabase
      .from(tableName)
      .upsert([snakePayload], { onConflict: conflictKey });

    if (!snakeError) return true;

    // If error indicates column not found or schema mismatch, try camelPayload
    if (
      snakeError.message?.includes('column') ||
      snakeError.code === 'PGRST204' ||
      snakeError.code === '42703'
    ) {
      console.warn(`Retrying upsert on table '${tableName}' with camelCase payload...`);
      const { error: camelError } = await supabase
        .from(tableName)
        .upsert([camelPayload], { onConflict: conflictKey });

      if (!camelError) return true;

      console.error(`Supabase upsert failed on '${tableName}':`, camelError.message, camelError);
      return false;
    }

    console.error(`Supabase upsert error on '${tableName}':`, snakeError.message, snakeError);
    return false;
  } catch (err: any) {
    console.error(`Exception in resilientUpsert on '${tableName}':`, err?.message || err);
    return false;
  }
}

// --- USER ACCOUNTS ---
export async function fetchUserAccountsFromSupabase(): Promise<UserAccount[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('user_accounts').select('*');
    if (error) {
      console.warn('Error fetching user accounts from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      userId: d.user_id || d.userId || '',
      password: d.password || '',
      role: d.role,
      permissionLevel: d.permission_level || d.permissionLevel || 'ADMIN',
      officerName: d.officer_name || d.officerName || '',
      rank: d.rank || '',
      policeStation: d.police_station || d.policeStation || 'Subdivision HQ',
      contactNumber: d.contact_number || d.contactNumber,
      isActive: d.is_active !== undefined ? d.is_active : (d.isActive !== undefined ? d.isActive : true),
      lastLogin: d.last_login || d.lastLogin,
    })) as UserAccount[];
  } catch (err) {
    console.warn('Supabase exception in fetchUserAccounts:', err);
    return null;
  }
}

export async function saveUserAccountToSupabase(account: UserAccount): Promise<boolean> {
  const snakePayload = {
    id: account.id,
    user_id: account.userId,
    password: account.password,
    role: account.role,
    permission_level: account.permissionLevel,
    officer_name: account.officerName,
    rank: account.rank,
    police_station: account.policeStation,
    contact_number: account.contactNumber || null,
    is_active: account.isActive,
    last_login: account.lastLogin || null,
  };

  const camelPayload = {
    id: account.id,
    userId: account.userId,
    password: account.password,
    role: account.role,
    permissionLevel: account.permissionLevel,
    officerName: account.officerName,
    rank: account.rank,
    policeStation: account.policeStation,
    contactNumber: account.contactNumber || null,
    isActive: account.isActive,
    lastLogin: account.lastLogin || null,
  };

  return resilientUpsert('user_accounts', snakePayload, camelPayload);
}

export async function deleteUserAccountFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('user_accounts').delete().eq('id', id);
    if (error) {
      console.error('Error deleting user account from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteUserAccount:', err);
    return false;
  }
}

// --- FIR CASES ---
export async function fetchFIRCasesFromSupabase(): Promise<FIRCase[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('fir_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching FIR cases from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      firNumber: d.fir_number || d.firNumber || '',
      ps: d.ps || 'Tarapur',
      firDate: d.fir_date || d.firDate || '',
      sections: d.sections || '',
      punishmentTerm: d.punishment_term || d.punishmentTerm,
      complainantName: d.complainant_name || d.complainantName || '',
      complainantPhone: d.complainant_phone || d.complainantPhone,
      placeOfOccurrence: d.place_of_occurrence || d.placeOfOccurrence || '',
      ioName: d.io_name || d.ioName || '',
      designation: d.designation || 'PENDING_DESIGNATION',
      designationDate: d.designation_date || d.designationDate,
      deadlineDays: Number(d.deadline_days ?? d.deadlineDays) || 60,
      status: d.status || 'Under Investigation',
      chargesheetNumber: d.chargesheet_number || d.chargesheetNumber,
      chargesheetDate: d.chargesheet_date || d.chargesheetDate,
      chargesheetUploadedCCTNS: Boolean(d.chargesheet_uploaded_cctns ?? d.chargesheetUploadedCCTNS),
      chargesheetCCTNSDate: d.chargesheet_cctns_date || d.chargesheetCCTNSDate,
      caseDiaryUploadedCCTNS: Boolean(d.case_diary_uploaded_cctns ?? d.caseDiaryUploadedCCTNS),
      lastCaseDiaryNo: d.last_case_diary_no || d.lastCaseDiaryNo,
      lastCaseDiaryDate: d.last_case_diary_date || d.lastCaseDiaryDate,
      poVisitDate: d.po_visit_date || d.poVisitDate,
      supervisionDate: d.supervision_date || d.supervisionDate,
      prDates: Array.isArray(d.pr_dates) ? d.pr_dates : (Array.isArray(d.prDates) ? d.prDates : []),
      finalPrDate: d.final_pr_date || d.finalPrDate,
      caseReviewDates: Array.isArray(d.case_review_dates) ? d.case_review_dates : (Array.isArray(d.caseReviewDates) ? d.caseReviewDates : []),
      sdpoSupervisionNote: d.sdpo_supervision_note || d.sdpoSupervisionNote,
      ciSupervisionNote: d.ci_supervision_note || d.ciSupervisionNote,
      psProgressRemarks: d.ps_progress_remarks || d.psProgressRemarks,
      createdAt: d.created_at || d.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: d.updated_at || d.updatedAt || new Date().toISOString().split('T')[0],
    })) as FIRCase[];
  } catch (err) {
    console.warn('Supabase exception in fetchFIRCases:', err);
    return null;
  }
}

export async function saveFIRCaseToSupabase(firCase: FIRCase): Promise<boolean> {
  const snakePayload = {
    id: firCase.id,
    fir_number: firCase.firNumber,
    ps: firCase.ps,
    fir_date: firCase.firDate,
    sections: firCase.sections,
    punishment_term: firCase.punishmentTerm || null,
    complainant_name: firCase.complainantName,
    complainant_phone: firCase.complainantPhone || null,
    place_of_occurrence: firCase.placeOfOccurrence,
    io_name: firCase.ioName,
    designation: firCase.designation,
    designation_date: firCase.designationDate || null,
    deadline_days: firCase.deadlineDays,
    status: firCase.status,
    chargesheet_number: firCase.chargesheetNumber || null,
    chargesheet_date: firCase.chargesheetDate || null,
    chargesheet_uploaded_cctns: firCase.chargesheetUploadedCCTNS,
    chargesheet_cctns_date: firCase.chargesheetCCTNSDate || null,
    case_diary_uploaded_cctns: firCase.caseDiaryUploadedCCTNS,
    last_case_diary_no: firCase.lastCaseDiaryNo || null,
    last_case_diary_date: firCase.lastCaseDiaryDate || null,
    po_visit_date: firCase.poVisitDate || null,
    supervision_date: firCase.supervisionDate || null,
    pr_dates: firCase.prDates || [],
    final_pr_date: firCase.finalPrDate || null,
    case_review_dates: firCase.caseReviewDates || [],
    sdpo_supervision_note: firCase.sdpoSupervisionNote || null,
    ci_supervision_note: firCase.ciSupervisionNote || null,
    ps_progress_remarks: firCase.psProgressRemarks || null,
    created_at: firCase.createdAt,
    updated_at: firCase.updatedAt || new Date().toISOString().split('T')[0],
  };

  const camelPayload = {
    id: firCase.id,
    firNumber: firCase.firNumber,
    ps: firCase.ps,
    firDate: firCase.firDate,
    sections: firCase.sections,
    punishmentTerm: firCase.punishmentTerm || null,
    complainantName: firCase.complainantName,
    complainantPhone: firCase.complainantPhone || null,
    placeOfOccurrence: firCase.placeOfOccurrence,
    ioName: firCase.ioName,
    designation: firCase.designation,
    designationDate: firCase.designationDate || null,
    deadlineDays: firCase.deadlineDays,
    status: firCase.status,
    chargesheetNumber: firCase.chargesheetNumber || null,
    chargesheetDate: firCase.chargesheetDate || null,
    chargesheetUploadedCCTNS: firCase.chargesheetUploadedCCTNS,
    chargesheetCCTNSDate: firCase.chargesheetCCTNSDate || null,
    caseDiaryUploadedCCTNS: firCase.caseDiaryUploadedCCTNS,
    lastCaseDiaryNo: firCase.lastCaseDiaryNo || null,
    lastCaseDiaryDate: firCase.lastCaseDiaryDate || null,
    poVisitDate: firCase.poVisitDate || null,
    supervisionDate: firCase.supervisionDate || null,
    prDates: firCase.prDates || [],
    finalPrDate: firCase.finalPrDate || null,
    caseReviewDates: firCase.caseReviewDates || [],
    sdpoSupervisionNote: firCase.sdpoSupervisionNote || null,
    ciSupervisionNote: firCase.ciSupervisionNote || null,
    psProgressRemarks: firCase.psProgressRemarks || null,
    createdAt: firCase.createdAt,
    updatedAt: firCase.updatedAt || new Date().toISOString().split('T')[0],
  };

  return resilientUpsert('fir_cases', snakePayload, camelPayload);
}

export async function deleteFIRCaseFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('fir_cases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting FIR case from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteFIRCase:', err);
    return false;
  }
}

// --- LAND DISPUTES ---
export async function fetchLandDisputesFromSupabase(): Promise<LandDispute[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('land_disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching land disputes from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      ps: d.ps || 'Tarapur',
      date: d.date || '',
      victimName: d.victim_name || d.victimName || '',
      victimAddress: d.victim_address || d.victimAddress || '',
      oppositePartyName: d.opposite_party_name || d.oppositePartyName,
      plotDetails: d.plot_details || d.plotDetails || '',
      disputeNature: d.dispute_nature || d.disputeNature || '',
      status: d.status || 'Pending',
      disposalDate: d.disposal_date || d.disposalDate,
      disposalRemarks: d.disposal_remarks || d.disposalRemarks,
      janataDarbarAction: d.janata_darbar_action || d.janataDarbarAction,
      remarks: d.remarks,
      createdAt: d.created_at || d.createdAt || new Date().toISOString().split('T')[0],
    })) as LandDispute[];
  } catch (err) {
    console.warn('Supabase exception in fetchLandDisputes:', err);
    return null;
  }
}

export async function saveLandDisputeToSupabase(dispute: LandDispute): Promise<boolean> {
  const snakePayload = {
    id: dispute.id,
    ps: dispute.ps,
    date: dispute.date,
    victim_name: dispute.victimName,
    victim_address: dispute.victimAddress,
    opposite_party_name: dispute.oppositePartyName || null,
    plot_details: dispute.plotDetails,
    dispute_nature: dispute.disputeNature,
    status: dispute.status,
    disposal_date: dispute.disposalDate || null,
    disposal_remarks: dispute.disposalRemarks || null,
    janata_darbar_action: dispute.janataDarbarAction || null,
    remarks: dispute.remarks || null,
    created_at: dispute.createdAt,
  };

  const camelPayload = {
    id: dispute.id,
    ps: dispute.ps,
    date: dispute.date,
    victimName: dispute.victimName,
    victimAddress: dispute.victimAddress,
    oppositePartyName: dispute.oppositePartyName || null,
    plotDetails: dispute.plotDetails,
    disputeNature: dispute.disputeNature,
    status: dispute.status,
    disposalDate: dispute.disposalDate || null,
    disposalRemarks: dispute.disposalRemarks || null,
    janataDarbarAction: dispute.janataDarbarAction || null,
    remarks: dispute.remarks || null,
    createdAt: dispute.createdAt,
  };

  return resilientUpsert('land_disputes', snakePayload, camelPayload);
}

export async function deleteLandDisputeFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('land_disputes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting land dispute from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteLandDispute:', err);
    return false;
  }
}

// --- UD CASES ---
export async function fetchUDCasesFromSupabase(): Promise<UDCase[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('ud_cases').select('*');
    if (error) {
      console.warn('Error fetching UD cases from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      udCaseNo: d.ud_case_no || d.udCaseNo || '',
      ps: d.ps || 'Tarapur',
      date: d.date || '',
      deceasedName: d.deceased_name || d.deceasedName || '',
      deceasedAgeGender: d.deceased_age_gender || d.deceasedAgeGender,
      placeOfOccurrence: d.place_of_occurrence || d.placeOfOccurrence || '',
      causeOfDeath: d.cause_of_death || d.causeOfDeath || '',
      postMortemReportStatus: d.post_mortem_report_status || d.postMortemReportStatus || 'Pending',
      visceralReportStatus: d.visceral_report_status || d.visceralReportStatus || 'Not Required',
      status: d.status || 'Under Investigation',
      ciSupervisionRemarks: d.ci_supervision_remarks || d.ciSupervisionRemarks,
      sdpoRemarks: d.sdpo_remarks || d.sdpoRemarks,
    })) as UDCase[];
  } catch (err) {
    console.warn('Supabase exception in fetchUDCases:', err);
    return null;
  }
}

export async function saveUDCaseToSupabase(udCase: UDCase): Promise<boolean> {
  const snakePayload = {
    id: udCase.id,
    ud_case_no: udCase.udCaseNo,
    ps: udCase.ps,
    date: udCase.date,
    deceased_name: udCase.deceasedName,
    deceased_age_gender: udCase.deceasedAgeGender || null,
    place_of_occurrence: udCase.placeOfOccurrence,
    cause_of_death: udCase.causeOfDeath,
    post_mortem_report_status: udCase.postMortemReportStatus,
    visceral_report_status: udCase.visceralReportStatus,
    status: udCase.status,
    ci_supervision_remarks: udCase.ciSupervisionRemarks || null,
    sdpo_remarks: udCase.sdpoRemarks || null,
  };

  const camelPayload = {
    id: udCase.id,
    udCaseNo: udCase.udCaseNo,
    ps: udCase.ps,
    date: udCase.date,
    deceasedName: udCase.deceasedName,
    deceasedAgeGender: udCase.deceasedAgeGender || null,
    placeOfOccurrence: udCase.placeOfOccurrence,
    causeOfDeath: udCase.causeOfDeath,
    postMortemReportStatus: udCase.postMortemReportStatus,
    visceralReportStatus: udCase.visceralReportStatus,
    status: udCase.status,
    ciSupervisionRemarks: udCase.ciSupervisionRemarks || null,
    sdpoRemarks: udCase.sdpoRemarks || null,
  };

  return resilientUpsert('ud_cases', snakePayload, camelPayload);
}

export async function deleteUDCaseFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('ud_cases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting UD case from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteUDCase:', err);
    return false;
  }
}

// --- INVESTIGATING OFFICERS (IOs) ---
export async function fetchIOsFromSupabase(): Promise<InvestigatingOfficer[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('investigating_officers').select('*');
    if (error) {
      console.warn('Error fetching IOs from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      name: d.name || '',
      rank: d.rank || 'Sub-Inspector (SI)',
      ps: d.ps || 'Tarapur',
      phone: d.phone || d.phone_number || undefined,
      activeCasesCount: d.active_cases_count !== undefined ? d.active_cases_count : d.activeCasesCount,
      status: d.status || 'ACTIVE',
      transferredTo: d.transferred_to || d.transferredTo || undefined,
      transferDate: d.transfer_date || d.transferDate || undefined,
    })) as InvestigatingOfficer[];
  } catch (err) {
    console.warn('Supabase exception in fetchIOs:', err);
    return null;
  }
}

export async function saveIOToSupabase(io: InvestigatingOfficer): Promise<boolean> {
  const isTransferred = io.status === 'TRANSFERRED';
  const snakePayload = {
    id: io.id,
    name: io.name,
    rank: io.rank,
    ps: io.ps,
    phone: io.phone || null,
    status: io.status || 'ACTIVE',
    transferred_to: isTransferred ? (io.transferredTo || 'Other Unit') : null,
    transfer_date: isTransferred ? (io.transferDate || new Date().toISOString().split('T')[0]) : null,
  };

  const camelPayload = {
    id: io.id,
    name: io.name,
    rank: io.rank,
    ps: io.ps,
    phone: io.phone || null,
    status: io.status || 'ACTIVE',
    transferredTo: isTransferred ? (io.transferredTo || 'Other Unit') : null,
    transferDate: isTransferred ? (io.transferDate || new Date().toISOString().split('T')[0]) : null,
  };

  return resilientUpsert('investigating_officers', snakePayload, camelPayload);
}

export async function deleteIOFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('investigating_officers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting IO from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteIO:', err);
    return false;
  }
}

// --- LEAVE LEDGER ---
export async function fetchLeaveLedgerFromSupabase(): Promise<LeaveLedgerEntry[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('leave_ledger')
      .select('*')
      .order('departure_date', { ascending: false });

    if (error) {
      console.warn('Error fetching leave ledger from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      reportId: d.report_id || d.reportId,
      ps: d.ps || 'Tarapur',
      officerName: d.officer_name || d.officerName || '',
      rank: d.rank || 'Sub-Inspector (SI)',
      departureDate: d.departure_date || d.departureDate || '',
      daysOnLeave: Number(d.days_on_leave ?? d.daysOnLeave) || 1,
      arrivalDate: d.arrival_date || d.arrivalDate || '',
      actualArrivalDate: d.actual_arrival_date || d.actualArrivalDate,
      status: d.status || 'ON_LEAVE',
      leaveType: d.leave_type || d.leaveType || 'CL',
      remarks: d.remarks || '',
      recordedBy: d.recorded_by || d.recordedBy || '',
      createdAt: d.created_at || d.createdAt || new Date().toISOString(),
    })) as LeaveLedgerEntry[];
  } catch (err) {
    console.warn('Supabase exception in fetchLeaveLedger:', err);
    return null;
  }
}

export async function saveLeaveLedgerEntryToSupabase(entry: LeaveLedgerEntry): Promise<boolean> {
  const snakePayload = {
    id: entry.id,
    report_id: entry.reportId || null,
    ps: entry.ps,
    officer_name: entry.officerName,
    rank: entry.rank,
    departure_date: entry.departureDate,
    days_on_leave: entry.daysOnLeave,
    arrival_date: entry.arrivalDate,
    actual_arrival_date: entry.actualArrivalDate || null,
    status: entry.status,
    leave_type: entry.leaveType || 'CL',
    remarks: entry.remarks || null,
    recorded_by: entry.recordedBy || null,
    created_at: entry.createdAt || new Date().toISOString(),
  };

  const camelPayload = {
    id: entry.id,
    reportId: entry.reportId || null,
    ps: entry.ps,
    officerName: entry.officerName,
    rank: entry.rank,
    departureDate: entry.departureDate,
    daysOnLeave: entry.daysOnLeave,
    arrivalDate: entry.arrivalDate,
    actualArrivalDate: entry.actualArrivalDate || null,
    status: entry.status,
    leaveType: entry.leaveType || 'CL',
    remarks: entry.remarks || null,
    recordedBy: entry.recordedBy || null,
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  return resilientUpsert('leave_ledger', snakePayload, camelPayload);
}

export async function deleteLeaveLedgerEntryFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('leave_ledger').delete().eq('id', id);
    if (error) {
      console.error('Error deleting leave ledger entry from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteLeaveLedgerEntry:', err);
    return false;
  }
}

// --- DAILY CRIME REPORTS ---
export async function fetchDailyReportsFromSupabase(): Promise<DailyCrimeReport[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('daily_crime_reports')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Error fetching daily reports from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      ps: d.ps || 'Tarapur',
      date: d.date || '',
      firsRegisteredCount: Number(d.firs_registered_count ?? d.firsRegisteredCount) || 0,
      registeredFirs: d.registered_firs || d.registeredFirs || [],
      odDetails: d.od_details || d.odDetails,
      gastiDetails: d.gasti_details || d.gastiDetails,
      arrestsCount: Number(d.arrests_count ?? d.arrestsCount) || 0,
      arrestDetails: d.arrest_details || d.arrestDetails,
      rankStrengths: d.rank_strengths || d.rankStrengths || [],
      leaveLedgerEntries: d.leave_ledger_entries || d.leaveLedgerEntries || [],
      seizuresSummary: d.seizures_summary || d.seizuresSummary,
      majorIncidentsNotes: d.major_incidents_notes || d.majorIncidentsNotes,
      submittedBy: d.submitted_by || d.submittedBy || '',
      createdAt: d.created_at || d.createdAt || new Date().toISOString(),
    })) as DailyCrimeReport[];
  } catch (err) {
    console.warn('Supabase exception in fetchDailyReports:', err);
    return null;
  }
}

export async function saveDailyReportToSupabase(report: DailyCrimeReport): Promise<boolean> {
  const snakePayload = {
    id: report.id,
    ps: report.ps,
    date: report.date,
    firs_registered_count: report.firsRegisteredCount,
    registered_firs: report.registeredFirs || [],
    od_details: report.odDetails || null,
    gasti_details: report.gastiDetails || null,
    arrests_count: report.arrestsCount,
    arrest_details: report.arrestDetails || null,
    rank_strengths: report.rankStrengths || [],
    leave_ledger_entries: report.leaveLedgerEntries || [],
    seizures_summary: report.seizuresSummary || null,
    major_incidents_notes: report.majorIncidentsNotes || null,
    submitted_by: report.submittedBy,
    created_at: report.createdAt || new Date().toISOString(),
  };

  const camelPayload = {
    id: report.id,
    ps: report.ps,
    date: report.date,
    firsRegisteredCount: report.firsRegisteredCount,
    registeredFirs: report.registeredFirs || [],
    odDetails: report.odDetails || null,
    gastiDetails: report.gastiDetails || null,
    arrestsCount: report.arrestsCount,
    arrestDetails: report.arrestDetails || null,
    rankStrengths: report.rankStrengths || [],
    leaveLedgerEntries: report.leaveLedgerEntries || [],
    seizuresSummary: report.seizuresSummary || null,
    majorIncidentsNotes: report.majorIncidentsNotes || null,
    submittedBy: report.submittedBy,
    createdAt: report.createdAt || new Date().toISOString(),
  };

  return resilientUpsert('daily_crime_reports', snakePayload, camelPayload);
}

export async function deleteDailyReportFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('daily_crime_reports').delete().eq('id', id);
    if (error) {
      console.error('Error deleting daily report from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteDailyReport:', err);
    return false;
  }
}

// --- USER MESSAGES & POLICE DIRECTIVES ---
export async function fetchUserMessagesFromSupabase(): Promise<UserMessage[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user messages from Supabase:', error.message);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      senderUserId: d.sender_user_id || d.senderUserId,
      senderName: d.sender_name || d.senderName,
      senderRole: d.sender_role || d.senderRole,
      recipientUserId: d.recipient_user_id || d.recipientUserId,
      recipientName: d.recipient_name || d.recipientName,
      subject: d.subject,
      messageText: d.message_text || d.messageText,
      priority: d.priority || 'Routine',
      createdAt: d.created_at || d.createdAt || new Date().toISOString(),
      readBy: d.read_by || d.readBy || [],
    })) as UserMessage[];
  } catch (err) {
    console.warn('Supabase exception in fetchUserMessages:', err);
    return null;
  }
}

export async function saveUserMessageToSupabase(msg: UserMessage): Promise<boolean> {
  const snakePayload = {
    id: msg.id,
    sender_user_id: msg.senderUserId,
    sender_name: msg.senderName,
    sender_role: msg.senderRole,
    recipient_user_id: msg.recipientUserId,
    recipient_name: msg.recipientName,
    subject: msg.subject,
    message_text: msg.messageText,
    priority: msg.priority,
    read_by: msg.readBy || [],
    created_at: msg.createdAt,
  };

  const camelPayload = {
    id: msg.id,
    senderUserId: msg.senderUserId,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    recipientUserId: msg.recipientUserId,
    recipientName: msg.recipientName,
    subject: msg.subject,
    messageText: msg.messageText,
    priority: msg.priority,
    readBy: msg.readBy || [],
    createdAt: msg.createdAt,
  };

  return resilientUpsert('user_messages', snakePayload, camelPayload);
}

export async function deleteUserMessageFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('user_messages').delete().eq('id', id);
    if (error) {
      console.error('Error deleting user message from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception in deleteUserMessage:', err);
    return false;
  }
}

// --- MONTHLY ARREST ADJUSTMENTS ---
export async function fetchMonthlyArrestOverridesFromSupabase(): Promise<Record<string, number> | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('monthly_arrest_adjustments').select('*');
    if (error) {
      console.warn('Could not fetch monthly arrest adjustments from Supabase:', error.message);
      return null;
    }
    const map: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const key = `${row.month_key || row.monthKey}_${row.ps || 'ALL'}`;
      map[key] = row.adjusted_figure !== undefined ? row.adjusted_figure : row.adjustedFigure;
    });
    return map;
  } catch (err) {
    console.warn('Supabase monthly arrest exception:', err);
    return null;
  }
}

export async function saveMonthlyArrestOverrideToSupabase(
  monthKey: string,
  ps: string,
  figure: number,
  updatedBy: string
): Promise<boolean> {
  const snakePayload = {
    month_key: monthKey,
    ps: ps || 'ALL',
    adjusted_figure: figure,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };

  const camelPayload = {
    monthKey: monthKey,
    ps: ps || 'ALL',
    adjustedFigure: figure,
    updatedBy: updatedBy,
    updatedAt: new Date().toISOString(),
  };

  return resilientUpsert('monthly_arrest_adjustments', snakePayload, camelPayload, 'month_key');
}
