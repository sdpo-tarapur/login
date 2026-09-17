import { FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport, UserAccount, UserMessage, LeaveLedgerEntry } from '../types';

// Retained only for type references or fallback initializations if needed; real accounts are pulled from Supabase user_accounts table.
export const INITIAL_USER_ACCOUNTS: UserAccount[] = [];

export const INITIAL_MESSAGES: UserMessage[] = [];

export const INITIAL_IOS: InvestigatingOfficer[] = [];

export const INITIAL_FIRS: FIRCase[] = [];

export const INITIAL_LAND_DISPUTES: LandDispute[] = [];

export const INITIAL_UD_CASES: UDCase[] = [];

export const INITIAL_CRIME_REPORTS: DailyCrimeReport[] = [];
  
export const INITIAL_LEAVE_LEDGER: LeaveLedgerEntry[] = [];
