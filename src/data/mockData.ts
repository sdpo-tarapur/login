import { FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport, UserAccount } from '../types';

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
];

export const INITIAL_IOS: InvestigatingOfficer[] = [];

export const INITIAL_FIRS: FIRCase[] = [];

export const INITIAL_LAND_DISPUTES: LandDispute[] = [];

export const INITIAL_UD_CASES: UDCase[] = [];

export const INITIAL_CRIME_REPORTS: DailyCrimeReport[] = [];

