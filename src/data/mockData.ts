import { FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport, UserAccount, UserMessage, LeaveLedgerEntry } from '../types';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-sdpo',
    userId: 'sdpo.tarapur',
    password: 'sdpo@1234',
    role: 'SDPO',
    permissionLevel: 'ADMIN',
    officerName: 'Subdivisional Police Officer',
    rank: 'SDPO Tarapur',
    policeStation: 'Subdivision HQ',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-ci',
    userId: 'ci.tarapur',
    password: 'ci@1234',
    role: 'CI',
    permissionLevel: 'EDITOR',
    officerName: 'Circle Inspector',
    rank: 'Circle Inspector (CI)',
    policeStation: 'Subdivision HQ',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-tarapur',
    userId: 'sho.tarapur',
    password: 'ps@tarapur',
    role: 'PS_TARAPUR',
    permissionLevel: 'EDITOR',
    officerName: 'SHO Tarapur',
    rank: 'Station House Officer (SHO)',
    policeStation: 'Tarapur',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-asarganj',
    userId: 'sho.asarganj',
    password: 'ps@asarganj',
    role: 'PS_ASARGANJ',
    permissionLevel: 'EDITOR',
    officerName: 'SHO Asarganj',
    rank: 'Station House Officer (SHO)',
    policeStation: 'Asarganj',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-sangrampur',
    userId: 'sho.sangrampur',
    password: 'ps@sangrampur',
    role: 'PS_SANGRAMPUR',
    permissionLevel: 'EDITOR',
    officerName: 'SHO Sangrampur',
    rank: 'Station House Officer (SHO)',
    policeStation: 'Sangrampur',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-harpur',
    userId: 'sho.harpur',
    password: 'ps@harpur',
    role: 'PS_HARPUR',
    permissionLevel: 'EDITOR',
    officerName: 'SHO Harpur',
    rank: 'Station House Officer (SHO)',
    policeStation: 'Harpur',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-op-tarapur',
    userId: 'operator.tarapur',
    password: 'op@tarapur',
    role: 'PS_TARAPUR',
    permissionLevel: 'OPERATOR',
    officerName: 'Operator Tarapur PS',
    rank: 'Computer Operator / Munshi',
    policeStation: 'Tarapur',
    contactNumber: '',
    isActive: true,
  },
  {
    id: 'user-op-asarganj',
    userId: 'operator.asarganj',
    password: 'op@asarganj',
    role: 'PS_ASARGANJ',
    permissionLevel: 'OPERATOR',
    officerName: 'Operator Asarganj PS',
    rank: 'Computer Operator / Munshi',
    policeStation: 'Asarganj',
    contactNumber: '',
    isActive: true,
  },
];

export const INITIAL_MESSAGES: UserMessage[] = [
  {
    id: 'msg-1',
    senderUserId: 'sdpo.tarapur',
    senderName: 'Subdivisional Police Officer',
    senderRole: 'SDPO',
    recipientUserId: 'ALL',
    recipientName: 'All Police Stations & Desks',
    subject: 'Ensure Timely Daily Report Submission & Liquidation of Overdue Arrests',
    messageText: 'All SHOs and duty operators are directed to log daily crime reports before 09:00 hrs with detailed OD, Gasti, and rank-wise force strength without fail.',
    priority: 'Directive',
    createdAt: new Date().toISOString(),
    readBy: [],
  },
];

export const INITIAL_IOS: InvestigatingOfficer[] = [];

export const INITIAL_FIRS: FIRCase[] = [];

export const INITIAL_LAND_DISPUTES: LandDispute[] = [];

export const INITIAL_UD_CASES: UDCase[] = [];

export const INITIAL_CRIME_REPORTS: DailyCrimeReport[] = [];
 
export const INITIAL_LEAVE_LEDGER: LeaveLedgerEntry[] = [
  {
    id: 'leave-1',
    ps: 'Tarapur',
    officerName: 'SI Raman Kumar',
    rank: 'Sub-Inspector (SI)',
    departureDate: '2026-09-14',
    daysOnLeave: 4,
    arrivalDate: '2026-09-19',
    status: 'ON_LEAVE',
    leaveType: 'CL',
    remarks: 'Approved family affairs leave',
    recordedBy: 'SHO Tarapur PS',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'leave-2',
    ps: 'Asarganj',
    officerName: 'ASI Manoj Singh',
    rank: 'ASI & PTC',
    departureDate: '2026-09-13',
    daysOnLeave: 3,
    arrivalDate: '2026-09-17',
    status: 'ON_LEAVE',
    leaveType: 'CPL',
    remarks: 'Compensatory leave for festival duty',
    recordedBy: 'SHO Asarganj PS',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'leave-3',
    ps: 'Sangrampur',
    officerName: 'SI Alok Ranjan',
    rank: 'Sub-Inspector (SI)',
    departureDate: '2026-09-15',
    daysOnLeave: 2,
    arrivalDate: '2026-09-18',
    status: 'ON_LEAVE',
    leaveType: 'OTHERS',
    remarks: 'Medical checkup leave',
    recordedBy: 'SHO Sangrampur PS',
    createdAt: new Date().toISOString(),
  },
];


