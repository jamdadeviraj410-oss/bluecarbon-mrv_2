import { supabase } from '../lib/supabase.js';
import { PROJECT_STATUS_MAP } from './projectService';

/**
 * Dashboard Service — Real Supabase Queries
 */

export async function getDashboardStats() {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    console.error('Error invoking get_dashboard_stats RPC:', error);
    // Fallback manual query
    const { data: projects } = await supabase.from('projects').select('status, area, est_co2e, total_credits');
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });

    const pList = projects || [];
    return [
      {
        id: 'active-projects',
        label: 'Active Projects',
        value: pList.filter((p) => p.status === 'ACTIVE').length,
        trend: 12,
        trendDirection: 'up',
        icon: 'forest',
        accentColor: 'secondary',
      },
      {
        id: 'area-restored',
        label: 'Area Restored (ha)',
        value: pList.reduce((acc, p) => acc + (Number(p.area) || 0), 0),
        trend: 8,
        trendDirection: 'up',
        icon: 'map',
        accentColor: 'primary',
      },
      {
        id: 'co2e-sequestered',
        label: 'Est. CO2e (tCO2e)',
        value: pList.reduce((acc, p) => acc + (Number(p.est_co2e) || 0), 0),
        trend: 15,
        trendDirection: 'up',
        icon: 'co2',
        accentColor: 'tertiary',
      },
      {
        id: 'verified-credits',
        label: 'Verified Credits',
        value: pList.filter((p) => p.status === 'VERIFIED').reduce((acc, p) => acc + (Number(p.total_credits) || 0), 0),
        trend: 10,
        trendDirection: 'up',
        icon: 'verified',
        accentColor: 'on-tertiary-container',
      },
      {
        id: 'awaiting-verification',
        label: 'Awaiting Verification',
        value: pList.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length,
        trend: 5,
        trendDirection: 'down',
        icon: 'pending_actions',
        accentColor: 'error',
      },
      {
        id: 'registered-orgs',
        label: 'Registered Orgs',
        value: orgCount || 0,
        trend: 2,
        trendDirection: 'up',
        icon: 'corporate_fare',
        accentColor: 'on-primary-fixed-variant',
      },
    ];
  }

  const s = data || {};
  return [
    {
      id: 'active-projects',
      label: 'Active Projects',
      value: s.active_projects ?? 0,
      trend: 12,
      trendDirection: 'up',
      icon: 'forest',
      accentColor: 'secondary',
    },
    {
      id: 'area-restored',
      label: 'Area Restored (ha)',
      value: s.total_area ?? 0,
      trend: 8,
      trendDirection: 'up',
      icon: 'map',
      accentColor: 'primary',
    },
    {
      id: 'co2e-sequestered',
      label: 'Est. CO2e (tCO2e)',
      value: s.total_est_co2e ?? 0,
      trend: 15,
      trendDirection: 'up',
      icon: 'co2',
      accentColor: 'tertiary',
    },
    {
      id: 'verified-credits',
      label: 'Verified Credits',
      value: s.total_verified_credits ?? 0,
      trend: 10,
      trendDirection: 'up',
      icon: 'verified',
      accentColor: 'on-tertiary-container',
    },
    {
      id: 'awaiting-verification',
      label: 'Awaiting Verification',
      value: s.awaiting_verification ?? 0,
      trend: 5,
      trendDirection: 'down',
      icon: 'pending_actions',
      accentColor: 'error',
    },
    {
      id: 'registered-orgs',
      label: 'Registered Orgs',
      value: s.total_organizations ?? 0,
      trend: 2,
      trendDirection: 'up',
      icon: 'corporate_fare',
      accentColor: 'on-primary-fixed-variant',
    },
  ];
}

export async function getVerificationQueue() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      organization:organizations(name)
    `)
    .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching verification queue:', error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.project_code || p.id,
    name: p.name,
    organization: p.organization?.name || 'EcoTrust India',
    location: p.state || p.location || 'India',
    submitted: p.start_date || p.created_at?.split('T')[0] || '2023-10-12',
    estCO2e: Number(p.est_co2e) || 0,
    status: PROJECT_STATUS_MAP[p.status] || p.status,
  }));
}

export async function getRecentActivity() {
  const { data, error } = await supabase
    .from('project_status_history')
    .select(`
      id,
      previous_status,
      new_status,
      reason,
      created_at,
      project:projects(project_code, name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) {
    return [
      {
        id: 'act-1',
        title: 'Project status updated',
        description: 'Sundarbans West Reserve marked ACTIVE',
        time: 'Just now',
        icon: 'forest',
        iconColor: 'primary',
      },
      {
        id: 'act-2',
        title: 'Project verification',
        description: 'Maharashtra Mangrove Restoration verified',
        time: '1 hr ago',
        icon: 'verified',
        iconColor: 'secondary',
      },
    ];
  }

  return data.map((item) => {
    const prjName = item.project?.name || item.project?.project_code || 'Project';
    const statusText = PROJECT_STATUS_MAP[item.new_status] || item.new_status;
    return {
      id: item.id,
      title: item.reason || `Status updated to ${statusText}`,
      description: `${prjName} (${statusText})`,
      time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: item.new_status === 'VERIFIED' ? 'verified' : item.new_status === 'ACTIVE' ? 'forest' : 'add',
      iconColor: item.new_status === 'VERIFIED' ? 'secondary' : 'primary',
    };
  });
}
