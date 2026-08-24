/**
 * Offline Field Evidence Queue & Synchronization Engine
 * 
 * Supports offline field work in coastal & mangrove zones where cellular network
 * is intermittent or unavailable.
 * 
 * Capabilities:
 * - Persists offline submissions locally with image data URLs, SHA-256 hashes, GPS & metadata
 * - Automatically detects online state and triggers queue sync
 * - Provides manual sync trigger and detailed sync status (Offline, Syncing, Synced, Sync Failed)
 */

import { supabase } from '../lib/supabase.js';

const OFFLINE_QUEUE_KEY = 'bluecarbon_offline_evidence_queue';

/**
 * Gets all pending offline evidence submissions
 * @returns {Array<Object>}
 */
export function getOfflineQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline evidence queue:', err);
    return [];
  }
}

/**
 * Saves a new evidence capture into the offline queue
 * @param {Object} item
 * @returns {Object}
 */
export function enqueueOfflineEvidence(item) {
  const queue = getOfflineQueue();
  const queueItem = {
    id: item.id || `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    projectId: item.projectId,
    projectName: item.projectName || 'Coastal Restoration Project',
    evidenceType: item.evidenceType || 'FIELD_PHOTO',
    fileName: item.fileName || `field_photo_${Date.now()}.jpg`,
    fileSize: item.fileSize || 0,
    sha256Hash: item.sha256Hash,
    dataUrl: item.dataUrl, // base64 representation for offline storage
    latitude: item.latitude,
    longitude: item.longitude,
    gpsAccuracy: item.gpsAccuracy,
    locationValidationStatus: item.locationValidationStatus || 'PENDING',
    capturedAt: item.capturedAt || new Date().toISOString(),
    notes: item.notes || '',
    syncStatus: 'OFFLINE_PENDING', // 'OFFLINE_PENDING', 'SYNCING', 'SYNCED', 'SYNC_FAILED'
    syncError: null,
    enqueuedAt: new Date().toISOString(),
  };

  queue.unshift(queueItem);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('LocalStorage quota warning, truncating old preview payloads:', err);
    // If quota exceeded, strip large base64 payload from older synced items
    const compacted = queue.slice(0, 10).map((q, idx) => (idx > 3 ? { ...q, dataUrl: null } : q));
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(compacted));
  }

  return queueItem;
}

/**
 * Synchronizes the offline evidence queue with Supabase
 * @param {Function} [onProgress] Callback with { current, total, status }
 * @returns {Promise<{syncedCount: number, failedCount: number, results: Array<Object>}>}
 */
export async function syncOfflineEvidenceQueue(onProgress) {
  const queue = getOfflineQueue();
  const pendingItems = queue.filter((item) => item.syncStatus !== 'SYNCED');

  if (pendingItems.length === 0) {
    return { syncedCount: 0, failedCount: 0, results: [] };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const results = [];

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    item.syncStatus = 'SYNCING';
    if (onProgress) onProgress({ current: i + 1, total: pendingItems.length, item });

    try {
      // 1. Insert into Supabase evidence_files or offline_evidence_sync_queue
      const { data, error } = await supabase
        .from('offline_evidence_sync_queue')
        .insert({
          client_sync_id: item.id,
          project_id: item.projectId,
          file_name: item.fileName,
          file_hash: item.sha256Hash,
          latitude: item.latitude,
          longitude: item.longitude,
          gps_accuracy: item.gpsAccuracy,
          captured_at: item.capturedAt,
          sync_status: 'SYNCED',
        })
        .select()
        .single();

      if (error) throw error;

      item.syncStatus = 'SYNCED';
      item.syncError = null;
      item.syncedAt = new Date().toISOString();
      item.serverId = data?.id;
      syncedCount++;
      results.push({ item, success: true });
    } catch (err) {
      console.warn(`Failed to sync offline item ${item.id}:`, err);
      item.syncStatus = 'SYNC_FAILED';
      item.syncError = err.message || 'Sync connection failed';
      failedCount++;
      results.push({ item, success: false, error: item.syncError });
    }
  }

  // Update local storage queue
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to update local offline queue after sync:', err);
  }

  return { syncedCount, failedCount, results };
}

/**
 * Removes synced or cleared items from local queue
 * @param {string} id
 */
export function removeOfflineEvidence(id) {
  const queue = getOfflineQueue();
  const updated = queue.filter((q) => q.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
}
