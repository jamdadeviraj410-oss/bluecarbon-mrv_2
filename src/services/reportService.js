import { supabase } from '../lib/supabase';

/**
 * Reports & Analytics Service — Real Supabase Queries & Aggregations
 */

export async function getReports(filters = {}) {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.type) {
    query = query.eq('report_type', filters.type);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
  return data || [];
}

export async function getReportById(id) {
  if (!id) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase.from('reports').select('*');
  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('report_code', id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Error fetching report by ID:', error);
    throw error;
  }
  return data;
}

export async function generateReport({ title, reportType, description, parameters = {}, period = 'Q3 2023' }) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  const code = `REP-${year}-${seq}`;

  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        report_code: code,
        title,
        report_type: reportType,
        description,
        parameters,
        period,
        status: 'COMPLETED',
        generated_by: userId,
        generated_by_name: session?.user?.user_metadata?.full_name || 'Admin Lead',
        data_summary: {
          generatedAt: new Date().toISOString(),
          filterParams: parameters,
        },
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error generating report:', error);
    throw error;
  }
  return data;
}
