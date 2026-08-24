/**
 * Mock audit trail data — from Stitch Audit Trail screen
 * Replace with Supabase queries later
 */

export const auditEntries = [
  {
    id: 'audit-001',
    action: 'Project Registered',
    description: 'Maharashtra Mangrove Restoration (PRJ-2023-089) was registered by EcoTrust India.',
    user: 'Priya Sharma',
    role: 'NGO',
    timestamp: '2023-10-05T10:30:00Z',
    category: 'Project',
    severity: 'info',
    ipAddress: '203.115.xx.xx',
    blockchainHash: '0x7a3f...8b2e',
  },
  {
    id: 'audit-002',
    action: 'MRV Submitted',
    description: 'Quarterly MRV report submitted for Godavari Estuary Restore.',
    user: 'Vikram Reddy',
    role: 'NGO',
    timestamp: '2023-10-18T14:15:00Z',
    category: 'MRV',
    severity: 'info',
    ipAddress: '203.115.xx.xx',
    blockchainHash: null,
  },
  {
    id: 'audit-003',
    action: 'Verification Completed',
    description: 'Maharashtra Mangrove Restoration verified by NCCR Admin.',
    user: 'Admin User',
    role: 'NCCR_ADMIN',
    timestamp: '2023-10-12T16:00:00Z',
    category: 'Verification',
    severity: 'success',
    ipAddress: '103.21.xx.xx',
    blockchainHash: '0x3c1d...9f4a',
  },
  {
    id: 'audit-004',
    action: 'Credits Minted',
    description: '14,200 tCO2e carbon credits minted for Maharashtra project.',
    user: 'System',
    role: 'SYSTEM',
    timestamp: '2023-11-01T09:00:00Z',
    category: 'Blockchain',
    severity: 'success',
    ipAddress: null,
    blockchainHash: '0x9e2b...4d7c',
  },
  {
    id: 'audit-005',
    action: 'Project Rejected',
    description: 'Chilika Lake Margins MRV report rejected — insufficient evidence.',
    user: 'Admin User',
    role: 'NCCR_ADMIN',
    timestamp: '2023-10-10T11:30:00Z',
    category: 'Verification',
    severity: 'error',
    ipAddress: '103.21.xx.xx',
    blockchainHash: null,
  },
  {
    id: 'audit-006',
    action: 'Organization Registered',
    description: 'Kerala Coastal Authority registered as new organization.',
    user: 'Admin User',
    role: 'NCCR_ADMIN',
    timestamp: '2024-01-10T08:45:00Z',
    category: 'Organization',
    severity: 'info',
    ipAddress: '103.21.xx.xx',
    blockchainHash: null,
  },
];

export const auditCategories = [
  'All', 'Project', 'MRV', 'Verification', 'Blockchain', 'Organization', 'System',
];
