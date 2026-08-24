import { supabase } from '../lib/supabase';

/**
 * Community Engagement & Panchayat Services
 */

export async function getCommunityProfile(userId = null) {
  const { data: { session } } = await supabase.auth.getSession();
  const activeUserId = userId || session?.user?.id;

  let query = supabase.from('community_profiles').select('*');
  if (activeUserId) {
    query = query.eq('user_id', activeUserId);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error('Error fetching community profile:', error);
    return null;
  }
  return data;
}

export async function getCommunityProjects() {
  const { data, error } = await supabase
    .from('community_projects')
    .select(`
      *,
      project:projects(*),
      community:community_profiles(*)
    `);

  if (error) {
    console.error('Error fetching community projects:', error);
    return [];
  }
  return data || [];
}

export async function getCommunityActivities() {
  const { data, error } = await supabase
    .from('community_activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching community activities:', error);
    return [];
  }
  return data || [];
}

export async function submitCommunityActivity({
  projectId,
  activityType,
  title,
  detail,
  icon = 'upload_file',
  actorName = 'Community Lead',
}) {
  const { data, error } = await supabase
    .from('community_activities')
    .insert([
      {
        project_id: projectId,
        activity_type: activityType,
        title,
        detail,
        icon,
        actor_name: actorName,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error recording community activity:', error);
    throw error;
  }
  return data;
}
