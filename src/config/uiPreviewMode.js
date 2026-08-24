/**
 * TEMPORARY UI PREVIEW MODE
 *
 * Controlled by VITE_UI_PREVIEW_MODE environment variable.
 * When enabled (default in UI restoration phase):
 * - Bypasses authentication redirects
 * - Bypasses "Account Pending Approval"
 * - Provides preview mock user with full navigation privileges
 * - Prevents background Supabase / API network failures from breaking UI rendering
 *
 * NOTE FOR PROMPT 2:
 * Set VITE_UI_PREVIEW_MODE=false or delete this file when re-enabling production backend & auth.
 */

export const IS_UI_PREVIEW_MODE = import.meta.env.VITE_UI_PREVIEW_MODE !== 'false';

export const PREVIEW_USER = {
  id: 'usr_preview_admin_001',
  email: 'admin@nccr.gov.in',
  name: 'Admin User',
  role: 'NCCR_ADMIN',
  organization: 'National Centre for Coastal Research (NCCR)',
  organizationId: 'org_nccr_001',
  phone: '+91 44 6678 3000',
  avatar: null,
  isRoleAssigned: true,
};
