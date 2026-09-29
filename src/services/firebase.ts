/**
 * Layanan integrasi Firebase untuk Private Note.
 * Siap dikoneksikan dengan Firebase Console (Auth, Firestore, Storage) pada Phase 2.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Placeholder konfigurasi Firebase (diisi saat pengguna menghubungkan project Firebase)
export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoKeyForScaffoldingOnly',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'private-note-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'private-note-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'private-note-app.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

export interface SyncState {
  isConfigured: boolean;
  status: 'synced' | 'syncing' | 'offline';
  lastSyncedAt: number | null;
  activeDeviceId: string;
  userEmail: string | null;
}

// Default state sync untuk MVP (Local-first offline mode)
let currentSyncState: SyncState = {
  isConfigured: false,
  status: 'synced',
  lastSyncedAt: Date.now(),
  activeDeviceId: 'device-' + Math.random().toString(36).substring(2, 9),
  userEmail: null,
};

export function getSyncState(): SyncState {
  return { ...currentSyncState };
}

export function simulateCloudSync(): Promise<{ success: boolean; timestamp: number }> {
  return new Promise((resolve) => {
    currentSyncState.status = 'syncing';
    setTimeout(() => {
      currentSyncState.status = 'synced';
      currentSyncState.lastSyncedAt = Date.now();
      resolve({ success: true, timestamp: currentSyncState.lastSyncedAt });
    }, 800);
  });
}
