import { supabase } from '../lib/supabase';

/**
 * Shared Central Audit Service
 * Used across Members 1–4 to log immutable audit events to Supabase
 */

export async function logAuditEvent({
  action,
  entityType,
  entityId,
  description,
  projectId = null,
  status = 'Verified',
  previousValue = null,
  newValue = null,
  metadata = {},
}) {
  try {
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: String(entityId || ''),
      p_description: description || `Action ${action} on ${entityType}`,
      p_project_id: projectId,
      p_status: status,
      p_prev_val: previousValue,
      p_new_val: newValue,
      p_metadata: metadata,
    });

    if (error) throw error;
    return { success: true, logId: data };
  } catch (err) {
    console.warn('Central audit logging fallback:', err);
    return { success: false, error: err.message };
  }
}

export async function getAuditLogs(filters = {}) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.action && filters.action !== 'All Actions') {
    query = query.eq('action', filters.action);
  }

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
  return data || [];
}
