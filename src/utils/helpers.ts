import { FIRCase, UserRole, PoliceStationName, CaseStatus } from '../types';

export function calculateDaysElapsed(firDateStr: string): number {
  if (!firDateStr) return 0;
  const firDate = new Date(firDateStr);
  const today = new Date();
  
  // Set both to midnight for exact calendar day difference
  firDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - firDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getDeadlineInfo(caseItem: FIRCase) {
  if (caseItem.status === 'Chargesheeted / Final Form Submitted') {
    return {
      daysElapsed: calculateDaysElapsed(caseItem.firDate),
      daysRemaining: 0,
      code: 'COMPLETED' as const,
      label: 'Completed / Submitted',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    };
  }

  const daysElapsed = calculateDaysElapsed(caseItem.firDate);
  const deadline = caseItem.deadlineDays; // 60 or 90
  const daysRemaining = deadline - daysElapsed;

  if (daysRemaining < 0) {
    return {
      daysElapsed,
      daysRemaining,
      code: 'OVERDUE' as const,
      label: `OVERDUE by ${Math.abs(daysRemaining)} days (${daysElapsed}/${deadline}d)`,
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse',
    };
  } else if (daysRemaining <= 15) {
    return {
      daysElapsed,
      daysRemaining,
      code: 'APPROACHING' as const,
      label: `URGENT: ${daysRemaining} days remaining (${daysElapsed}/${deadline}d)`,
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    };
  } else {
    return {
      daysElapsed,
      daysRemaining,
      code: 'ON_TRACK' as const,
      label: `On Track: ${daysRemaining} days left (${daysElapsed}/${deadline}d)`,
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    };
  }
}

export function getPSFromRole(role: UserRole): PoliceStationName | null {
  switch (role) {
    case 'PS_TARAPUR': return 'Tarapur';
    case 'PS_ASARGANJ': return 'Asarganj';
    case 'PS_SANGRAMPUR': return 'Sangrampur';
    case 'PS_HARPUR': return 'Harpur';
    default: return null; // SDPO and CI can view all
  }
}

export function getRoleDisplayTitle(role: UserRole): string {
  switch (role) {
    case 'SDPO': return 'SDPO Tarapur (Super User)';
    case 'CI': return 'Circle Inspector (Tarapur Circle)';
    case 'PS_TARAPUR': return 'Tarapur Police Station';
    case 'PS_ASARGANJ': return 'Asarganj Police Station';
    case 'PS_SANGRAMPUR': return 'Sangrampur Police Station';
    case 'PS_HARPUR': return 'Harpur Police Station';
  }
}

export function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
