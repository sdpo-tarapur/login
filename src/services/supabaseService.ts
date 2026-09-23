export async function saveFIRCaseToSupabase(firCase: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: firCase.id || `fir-${Date.now()}`,
      fir_number: firCase.firNumber || firCase.fir_number,
      fir_date: firCase.firDate || firCase.fir_date,
      ps: firCase.ps,
      sections: firCase.sections,
      complainant_name: firCase.complainantName || firCase.complainant_name,
      complainant_phone: firCase.complainantPhone || firCase.complainant_phone,
      place_of_occurrence: firCase.placeOfOccurrence || firCase.place_of_occurrence,
      io_name: firCase.ioName || firCase.io_name,
      io_id: firCase.ioId || firCase.io_id || null,
      designation: firCase.designation || 'PENDING_DESIGNATION',
      designation_date: firCase.designationDate || firCase.designation_date || null,
      deadline_days: firCase.deadlineDays ?? firCase.deadline_days ?? 60,
      status: firCase.status || 'Under Investigation',
      chargesheet_number: firCase.chargesheetNumber || firCase.chargesheet_number || null,
      chargesheet_date: firCase.chargesheetDate || firCase.chargesheet_date || null,
      chargesheet_uploaded_cctns: firCase.chargesheetUploadedCctns ?? firCase.chargesheet_uploaded_cctns ?? false,
      chargesheet_cctns_date: firCase.chargesheetCctnsDate || firCase.chargesheet_cctns_date || null,
      case_diary_uploaded_cctns: firCase.caseDiaryUploadedCctns ?? firCase.case_diary_uploaded_cctns ?? false,
      last_case_diary_no: firCase.lastCaseDiaryNo || firCase.last_case_diary_no || null,
      last_case_diary_date: firCase.lastCaseDiaryDate || firCase.last_case_diary_date || null,
      po_visit_date: firCase.poVisitDate || firCase.po_visit_date || null,
      supervision_date: firCase.supervisionDate || firCase.supervision_date || null,
      pr_dates: firCase.prDates || firCase.pr_dates || null,
      final_pr_date: firCase.finalPrDate || firCase.final_pr_date || null,
      case_review_dates: firCase.caseReviewDates || firCase.case_review_dates || null,
      sdpo_supervision_note: firCase.sdpoSupervisionNote || firCase.sdpo_supervision_note || null,
      ci_supervision_note: firCase.ciSupervisionNote || firCase.ci_supervision_note || null,
      ps_progress_remarks: firCase.psProgressRemarks || firCase.ps_progress_remarks || null,
      punishment_term: firCase.punishmentTerm || firCase.punishment_term || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('fir_cases').upsert([payload], { onConflict: 'id' }).select();
    if (error) {
      console.error('Save FIR case error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Save FIR case exception:', err);
    return false;
  }
}
