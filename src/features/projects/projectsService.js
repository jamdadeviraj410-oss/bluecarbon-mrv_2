/**
 * Projects Service Layer
 * Connects directly to real Supabase backend with caching & fallback support
 */

import {
  getProjects as fetchProjectsFromSupabase,
  getProjectById as fetchProjectByIdFromSupabase,
  getProjectStats as fetchProjectStatsFromSupabase,
  createProject as createProjectInSupabase,
  updateProject as updateProjectInSupabase,
  updateProjectStatus as updateProjectStatusInSupabase,
  projectTypes,
  indianStates,
} from '../../services/projectService';
import { projects as fallbackProjects } from '../../data/projects';

let cachedProjects = [...fallbackProjects];

// Eagerly hydrate cache from Supabase
fetchProjectsFromSupabase()
  .then((data) => {
    if (data && data.length > 0) {
      cachedProjects = data;
    }
  })
  .catch((err) => {
    console.warn('Initial project cache hydration fallback:', err);
  });

/**
 * Get all projects asynchronously from Supabase
 */
export async function fetchProjects(filters = {}) {
  try {
    const data = await fetchProjectsFromSupabase(filters);
    if (data && data.length > 0) {
      cachedProjects = data;
    }
    return data;
  } catch (err) {
    console.error('fetchProjects error:', err);
    return getProjects(filters);
  }
}

/**
 * Synchronous getProjects (for immediate renders / filters using cache)
 */
export function getProjects(filters = {}) {
  let result = [...cachedProjects];

  if (filters.status && filters.status !== 'All') {
    result = result.filter((p) => p.status === filters.status || p.dbStatus === filters.status);
  }

  if (filters.type && filters.type !== 'All') {
    const t = filters.type.toLowerCase();
    result = result.filter((p) => p.type === filters.type || (p.type && p.type.toLowerCase().includes(t)) || (p.ecosystem && p.ecosystem.toLowerCase().includes(t)));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.organization?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
    );
  }

  return result;
}

/**
 * Get single project by ID (async with cache fallback)
 */
export async function fetchProjectById(id) {
  try {
    const data = await fetchProjectByIdFromSupabase(id);
    if (data) return data;
  } catch (err) {
    console.error('fetchProjectById error:', err);
  }
  return getProjectById(id);
}

/**
 * Synchronous getProjectById
 */
export function getProjectById(id) {
  return cachedProjects.find((p) => p.id === id || p.dbId === id || p.project_code === id);
}

/**
 * Compute summary statistics
 */
export async function fetchProjectStats() {
  try {
    return await fetchProjectStatsFromSupabase();
  } catch (err) {
    console.error('fetchProjectStats error:', err);
    return getProjectStats();
  }
}

export function getProjectStats() {
  const total = cachedProjects.length;
  const active = cachedProjects.filter((p) => p.status === 'Active' || p.status === 'ACTIVE').length;
  const verified = cachedProjects.filter((p) => p.status === 'Verified' || p.status === 'VERIFIED').length;
  const pending = cachedProjects.filter(
    (p) => p.status === 'Pending' || p.status === 'Under Review' || p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW'
  ).length;
  const totalArea = cachedProjects.reduce((sum, p) => sum + (Number(p.area) || 0), 0);
  const totalCO2e = cachedProjects.reduce((sum, p) => sum + (Number(p.estCO2e) || Number(p.est_co2e) || 0), 0);

  return { total, active, verified, pending, totalArea, totalCO2e };
}

/**
 * Create project in Supabase
 */
export async function saveProject(data) {
  const newPrj = await createProjectInSupabase(data);
  cachedProjects.unshift(newPrj);
  return newPrj;
}

export function createProject(data) {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  const localPrj = {
    id: `PRJ-${year}-${seq}`,
    status: 'Draft',
    totalCredits: 0,
    retiredCredits: 0,
    activeCredits: 0,
    verificationDate: null,
    ...data,
  };

  // Trigger real Supabase creation in background/async
  createProjectInSupabase(data)
    .then((saved) => {
      cachedProjects = [saved, ...cachedProjects.filter((p) => p.id !== localPrj.id)];
    })
    .catch((err) => {
      console.warn('Background Supabase project creation notice:', err);
    });

  cachedProjects.unshift(localPrj);
  return localPrj;
}

export {
  updateProjectInSupabase,
  updateProjectStatusInSupabase,
  projectTypes,
  indianStates,
};
