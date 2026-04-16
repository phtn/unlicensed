/**
 * Canonical division and position definitions for staff records.
 *
 * These are the agreed-upon values for staff.division and staff.position.
 * Free-text is still accepted in the schema (for backward compatibility),
 * but the admin UI uses these dropdowns to enforce consistency.
 *
 * Update this file when org structure changes — the staff form picks up
 * the new options automatically.
 */

export type DivisionOption = {value: string; label: string}
export type PositionOption = {value: string; label: string; division?: string}

/**
 * Top-level divisions / departments.
 */
export const DIVISION_OPTIONS: DivisionOption[] = [
  {value: 'operations', label: 'Operations'},
  {value: 'sales', label: 'Sales'},
  {value: 'fulfillment', label: 'Fulfillment'},
  {value: 'logistics', label: 'Logistics'},
  {value: 'marketing', label: 'Marketing'},
  {value: 'technology', label: 'Technology'},
  {value: 'finance', label: 'Finance'},
  {value: 'customer_support', label: 'Customer Support'},
  {value: 'executive', label: 'Executive'},
]

/**
 * Staff positions.
 * The optional `division` field is a hint for UI filtering — positions can
 * still be used across divisions.
 */
export const POSITION_OPTIONS: PositionOption[] = [
  // Executive
  {value: 'ceo', label: 'CEO', division: 'executive'},
  {value: 'coo', label: 'COO', division: 'executive'},
  {value: 'cto', label: 'CTO', division: 'technology'},

  // Operations
  {value: 'store_manager', label: 'Store Manager', division: 'operations'},
  {value: 'operations_manager', label: 'Operations Manager', division: 'operations'},
  {value: 'operations_supervisor', label: 'Operations Supervisor', division: 'operations'},
  {value: 'operations_staff', label: 'Operations Staff', division: 'operations'},

  // Sales
  {value: 'sales_manager', label: 'Sales Manager', division: 'sales'},
  {value: 'sales_associate', label: 'Sales Associate', division: 'sales'},
  {value: 'account_manager', label: 'Account Manager', division: 'sales'},

  // Fulfillment
  {value: 'fulfillment_manager', label: 'Fulfillment Manager', division: 'fulfillment'},
  {value: 'fulfillment_staff', label: 'Fulfillment Staff', division: 'fulfillment'},
  {value: 'packer', label: 'Packer', division: 'fulfillment'},

  // Logistics
  {value: 'logistics_manager', label: 'Logistics Manager', division: 'logistics'},
  {value: 'courier', label: 'Courier', division: 'logistics'},
  {value: 'dispatcher', label: 'Dispatcher', division: 'logistics'},

  // Marketing
  {value: 'marketing_manager', label: 'Marketing Manager', division: 'marketing'},
  {value: 'content_creator', label: 'Content Creator', division: 'marketing'},
  {value: 'social_media', label: 'Social Media', division: 'marketing'},

  // Technology
  {value: 'software_engineer', label: 'Software Engineer', division: 'technology'},
  {value: 'system_admin', label: 'System Admin', division: 'technology'},
  {value: 'data_analyst', label: 'Data Analyst', division: 'technology'},

  // Finance
  {value: 'finance_manager', label: 'Finance Manager', division: 'finance'},
  {value: 'accountant', label: 'Accountant', division: 'finance'},
  {value: 'bookkeeper', label: 'Bookkeeper', division: 'finance'},

  // Customer Support
  {value: 'support_manager', label: 'Support Manager', division: 'customer_support'},
  {value: 'support_agent', label: 'Support Agent', division: 'customer_support'},

  // General
  {value: 'staff', label: 'Staff'},
  {value: 'intern', label: 'Intern'},
]

/**
 * Returns position options filtered to a given division.
 * Falls back to all positions when no division is selected.
 */
export function getPositionsForDivision(
  division: string | null | undefined,
): PositionOption[] {
  if (!division) return POSITION_OPTIONS
  return POSITION_OPTIONS.filter(
    (p) => !p.division || p.division === division,
  )
}
