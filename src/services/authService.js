import { supabase } from '../lib/supabase.js';

/**
 * Maps Supabase and network errors to clean, user-friendly messages.
 */
export function formatAuthErrorMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message = error.message || String(error);

  if (message.includes('Invalid login credentials') || message.includes('invalid_grant')) {
    return 'Invalid email or password.';
  }
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Please verify your email before signing in.';
  }
  if (message.includes('User already registered') || message.includes('already_registered')) {
    return 'An account with this email already exists.';
  }
  if (message.includes('Password should be at least') || message.includes('weak_password')) {
    return 'Password must be at least 6 characters.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('network')) {
    return 'Unable to connect to the registry. Please check your connection and try again.';
  }
  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  return message;
}

/**
 * Real Supabase Authentication & Profile Service
 */

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(formatAuthErrorMessage(error));
  }

  // Fetch corresponding profile
  const profile = await getUserProfile(data.user.id);

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

export async function signUpUser({ email, password, fullName, phone = null }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: 'COMMUNITY',
        organization_id: null,
        phone: phone ? phone.trim() : null,
      },
    },
  });

  if (error) {
    throw new Error(formatAuthErrorMessage(error));
  }

  let profile = null;
  if (data.user) {
    profile = await getUserProfile(data.user.id);
  }

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(formatAuthErrorMessage(error));
  }
  return { success: true };
}

export async function resetPassword(email) {
  const redirectTo = `${window.location.origin}/status`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) {
    throw new Error(formatAuthErrorMessage(error));
  }

  return { success: true, data, message: `Reset instructions sent to ${email}` };
}

export async function getCurrentUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return null;
  }

  const profile = await getUserProfile(session.user.id);
  return {
    ...session.user,
    profile,
  };
}

export async function getUserProfile(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(id, org_code, name, type, status, location, state)
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Unable to load user profile from database:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Profile fetch exception:', err);
    return null;
  }
}

export async function updateUserProfile(userId, updates) {
  // Security Whitelist: Users may only update their personal profile info, never role or org
  const safeUpdates = {};
  if (updates.full_name !== undefined) safeUpdates.full_name = updates.full_name;
  if (updates.phone !== undefined) safeUpdates.phone = updates.phone;
  if (updates.avatar_url !== undefined) safeUpdates.avatar_url = updates.avatar_url;

  const { data, error } = await supabase
    .from('profiles')
    .update(safeUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(formatAuthErrorMessage(error));
  }

  return data;
}

export function subscribeToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    let profile = null;
    if (session?.user) {
      profile = await getUserProfile(session.user.id);
    }
    callback(event, session, profile);
  });
}

/**
 * Checks real connection to Supabase database.
 */
export async function checkRegistryHealth() {
  const start = Date.now();
  try {
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      return { online: false, latencyMs: Date.now() - start, error: error.message };
    }
    return { online: true, latencyMs: Date.now() - start, error: null };
  } catch (err) {
    return { online: false, latencyMs: Date.now() - start, error: err.message };
  }
}
