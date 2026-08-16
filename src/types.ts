export type UserRole = 
  | 'SDPO'          // Super User - SDPO Tarapur (Full Edit, SR/NON-SR Designation, All PS View)
  | 'CI'            // Circle Inspector (Monitors UD & Non-SR cases, All PS View)
  | 'PS_TARAPUR'    // Tarapur Police Station
  | 'PS_ASARGANJ'   // Asarganj Police Station
  | 'PS_SANGRAMPUR' // Sangrampur Police Station
  | 'PS_HARPUR';    // Harpur Police Station

export type PoliceStationName = 'Tarapur' | 'Asarganj' | 'Sangrampur' | 'Harpur';

export type CaseDesignation = 'SR' | 'NON_SR' | 'PENDING_DESIGNATION';

export type CaseStatus = 
  | 'Under Investigation'
  | 'Chargesheeted / Final Form Submitted'
  | 'False Case / Mistake of Fact';

export type DeadlineCategory = 60 | 90;

export type CCTNSSyncOption = 'ALL' | 'CS_SYNC' | 'CD_SYNC' | 'BOTH_SYNC' | 'NONE_SYNC';

export interface InvestigatingOfficer {
  id: string;
  name: string;
  rank: 'SDPO' | 'Circle Inspector' | 'Inspector' | 'Sub-Inspector (SI)' | 'Asst. Sub-Inspector (ASI)' | 'PTC';
  ps: PoliceStationName | 'Subdivision HQ';
  phone?: string;
  activeCasesCount?: number;
}

export interface FIRCase {
  id: string;
  firNumber: string; // e.g. "124/2026"
  ps: PoliceStationName;
  firDate: string; // YYYY-MM-DD
  sections: string; // e.g., "Sec 302, 120B IPC" or "Sec 307, 34 BNS"
  complainantName: string;
  complainantPhone?: string;
  placeOfOccurrence: string; // Village / Landmark / Ward
  ioName: string; // Selected from IO drop-down
  designation: CaseDesignation; // Decided ONLY by Super User (SDPO)
  designationDate?: string;
  deadlineDays: DeadlineCategory; // 60 or 90 days
  
  // Status & Progress
  status: CaseStatus;
  chargesheetNumber?: string;
  chargesheetDate?: string;
  
  // CCTNS Tracking
  chargesheetUploadedCCTNS: boolean;
  chargesheetCCTNSDate?: string;
  caseDiaryUploadedCCTNS: boolean;
  lastCaseDiaryNo?: string;
  lastCaseDiaryDate?: string;
  
  // Supervision & Notes
  poVisitDate?: string;          // Place of Occurrence Visit Date (YYYY-MM-DD)
  supervisionDate?: string;       // SDPO Supervision Note Date (YYYY-MM-DD)
  prDates?: string[];            // Progress Report (PR) issue dates [YYYY-MM-DD, ...]
  finalPrDate?: string;          // Final Progress Report Date (YYYY-MM-DD)
  caseReviewDates?: string[];     // Case Review dates [YYYY-MM-DD, ...]
  sdpoSupervisionNote?: string;
  ciSupervisionNote?: string;
  psProgressRemarks?: string;
  
  createdAt: string;
  updatedAt: string;
}

// src/types.ts

export type IOStatus = 'Active' | 'Transferred';

export interface InvestigatingOfficer {
  id: string;
  name: string;
  rank: 'SDPO' | 'Circle Inspector' | 'Inspector' | 'Sub-Inspector (SI)' | 'Asst. Sub-Inspector (ASI)' | 'PTC';
  ps: PoliceStationName | 'Subdivision HQ';
  phone?: string;
  status: IOStatus; // Active or Transferred
  activeCasesCount?: number;
}

export interface CaseIOHistoryLog {
  id: string;
  caseId: string;
  ioId?: string;
  ioName: string;
  assignedDate: string;
  relievedDate?: string;
  transferReason?: string;
}

export interface FIRCase {
  id: string;
  firNumber: string;
  ps: PoliceStationName;
  firDate: string;
  sections: string;
  complainantName: string;
  complainantPhone?: string;
  placeOfOccurrence: string;
  ioName: string;
  ioId?: string; // Current IO Reference ID
  ioHistory?: CaseIOHistoryLog[]; // Complete history of previous IOs
  designation: CaseDesignation;
  designationDate?: string;
  deadlineDays: DeadlineCategory;
  status: CaseStatus;
  chargesheetNumber?: string;
  chargesheetDate?: string;
  chargesheetUploadedCCTNS: boolean;
  chargesheetCCTNSDate?: string;
  caseDiaryUploadedCCTNS: boolean;
  lastCaseDiaryNo?: string;
  lastCaseDiaryDate?: string;
  poVisitDate?: string;
  supervisionDate?: string;
  prDates?: string[];
  finalPrDate?: string;
  caseReviewDates?: string[];
  sdpoSupervisionNote?: string;
  ciSupervisionNote?: string;
  psProgressRemarks?: string;
  createdAt: string;
  updatedAt: string;
}
export interface LandDispute {
  id: string;
  ps: PoliceStationName;
  date: string; // Auto-fetched date (YYYY-MM-DD)
  victimName: string;
  victimAddress: string; // Full address with village / panchayat
  oppositePartyName?: string;
  plotDetails: string; // Khata/Khesra/Plot No, Mauza
  disputeNature: string; // Boundary / Encroachment / Illegal Possession / Pathway
  status: 'Pending' | 'Disposed';
  disposalDate?: string;
  disposalRemarks?: string;
  janataDarbarAction?: string;
  createdAt: string;
}

export interface UDCase {
  id: string;
  udCaseNo: string; // e.g., "UD 05/2026"
  ps: PoliceStationName;
  date: string;
  deceasedName: string;
  deceasedAgeGender?: string;
  placeOfOccurrence: string;
  causeOfDeath: string;
  postMortemReportStatus: 'Pending' | 'Received';
  visceralReportStatus: 'Not Required' | 'Sent for Testing' | 'Report Received';
  status: 'Under Investigation' | 'Final Report Submitted' | 'Closed';
  ciSupervisionRemarks?: string;
  sdpoRemarks?: string;
}

export interface DailyCrimeReport {
  id: string;
  ps: PoliceStationName;
  date: string;
  firsRegisteredCount: number;
  arrestsCount: number;
  seizuresSummary?: string;
  majorIncidentsNotes?: string;
  submittedBy: string;
}

export interface FilterOptions {
  searchQuery: string;
  policeStations: PoliceStationName[]; // Empty array means ALL
  designations: CaseDesignation[];     // Empty array means ALL
  deadlineStatus: 'ALL' | 'ON_TRACK' | 'APPROACHING' | 'OVERDUE' | 'COMPLETED';
  statuses: CaseStatus[];               // Empty array means ALL
  cctnsSyncFilter: CCTNSSyncOption;
  chargesheetCCTNS?: 'ALL' | 'YES' | 'NO';
  caseDiaryCCTNS?: 'ALL' | 'YES' | 'NO';
  ioNames: string[];                   // Empty array means ALL
  startDate: string;
  endDate: string;
  deadlineCategories: DeadlineCategory[]; // Empty array means ALL (both 60 & 90)
}
export interface FIRFilters {
  search: string;
  ps: string;
  status: string;
  designation: string;
  ioName: string;
  startDate: string;
  endDate: string;
  // Add Chargesheet Date Range filters:
  chargesheetStartDate: string;
  chargesheetEndDate: string;
}

export type PermissionLevel = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface UserAccount {
  id: string;
  userId: string;
  password: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  officerName: string;
  rank: string;
  policeStation: PoliceStationName | 'Subdivision HQ';
  contactNumber?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface UserAuthSession {
  role: UserRole;
  userId: string;
  loginTime: string;
}

