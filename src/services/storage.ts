import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types/note';

const STORAGE_KEY = '@private_note_data_v1';

// Seed notes default untuk demonstrasi fitur
const INITIAL_SEED_NOTES: Note[] = [
  {
    id: 'note-welcome-wa',
    title: '📖 Panduan Format WhatsApp di Private Note',
    content: `Selamat datang di *Private Note*! Aplikasi ini menggunakan aturan formatting seperti di WhatsApp yang sangat mudah diketik di HP.

*Cara Formatting Teks:*
* *Tebal*: Gunakan tanda bintang di awal dan akhir, contoh: *ini teks tebal*
* _Miring_: Gunakan underscore, contoh: _ini teks miring_
* ~Coret~: Gunakan tilde, contoh: ~ini teks dicoret~
* \`Monospace\`: Gunakan backtick tunggal atau \`\`\`tiga backtick\`\`\` untuk kode

> Tip: Anda juga bisa menggunakan kutipan dengan awalan tanda lebih besar seperti baris ini!

*Daftar Tugas (Checklist Interaktif):*
[x] Ketik *bold* untuk kata penting
[x] Coba klik checklist ini di tab preview
[ ] Buat catatan baru pertamamu
[ ] Coba fitur pencarian dan filter kategori

Semua perubahan disimpan otomatis *secara lokal di perangkatmu*!`,
    tags: ['panduan', 'tutorial'],
    isPinned: true,
    isArchived: false,
    isTrash: false,
    isLocked: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 jam lalu
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    syncStatus: 'synced',
  },
  {
    id: 'note-privacy-security',
    title: '🔒 Keamanan & Privasi Catatan',
    content: `*Private Note* mengusung filosofi *Local-First*:

1. Data catatan tersimpan di storage lokal perangkat terlebih dahulu.
2. Tidak ada *loading indicator* lambat saat membuka catatan.
3. Bisa dibaca dan ditulis 100% *secara offline* tanpa internet.
4. Mendukung penguncian biometrik di perangkat Android.

> "Catatan pribadimu adalah milikmu sepenuhnya."`,
    tags: ['keamanan', 'privasi'],
    isPinned: true,
    isArchived: false,
    isTrash: false,
    isLocked: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 hari lalu
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    syncStatus: 'synced',
  },
  {
    id: 'note-project-ideas',
    title: '💡 Ide Proyek & Catatan Harian',
    content: `Daftar rencana pengembangan fitur berikutnya:

- [x] Scaffolding Expo Universal (Android + Web)
- [x] Parser WhatsApp Formatting (*bold*, _italic_, ~strike~, code)
- [x] Auto-save & Local-First storage
- [ ] Integrasi Firebase Auth (Login Google & Email)
- [ ] Firestore Realtime Sync multi-perangkat
- [ ] Kunci Biometrik sidik jari di Android

*Catatan Cepat:*
Jangan lupa selalu review performa responsif di layar mobile dan layar laptop!`,
    tags: ['ide', 'proyek'],
    isPinned: false,
    isArchived: false,
    isTrash: false,
    isLocked: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    updatedAt: Date.now() - 1000 * 60 * 30,
    syncStatus: 'synced',
  },
];

type StorageListener = (notes: Note[]) => void;
const listeners: Set<StorageListener> = new Set();

function notifyListeners(notes: Note[]) {
  listeners.forEach((listener) => {
    try {
      listener(notes);
    } catch (e) {
      console.error('Error notifying note listener', e);
    }
  });
}

export function subscribeNotes(callback: StorageListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export async function getNotes(): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Inisialisasi dengan seed notes jika pertama kali dibuka
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_NOTES));
      return INITIAL_SEED_NOTES;
    }
    const parsed: Note[] = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error('Gagal memuat catatan dari storage:', error);
    return INITIAL_SEED_NOTES;
  }
}

export async function saveNote(note: Note): Promise<Note[]> {
  try {
    const currentNotes = await getNotes();
    const existingIndex = currentNotes.findIndex((n) => n.id === note.id);
    let updatedNotes: Note[];

    const updatedNote: Note = {
      ...note,
      updatedAt: Date.now(),
      syncStatus: 'synced',
    };

    if (existingIndex >= 0) {
      updatedNotes = [...currentNotes];
      updatedNotes[existingIndex] = updatedNote;
    } else {
      updatedNotes = [updatedNote, ...currentNotes];
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    notifyListeners(updatedNotes);
    return updatedNotes;
  } catch (error) {
    console.error('Gagal menyimpan catatan:', error);
    throw error;
  }
}

export async function deleteNote(id: string, permanent: boolean = false): Promise<Note[]> {
  try {
    const currentNotes = await getNotes();
    let updatedNotes: Note[];

    if (permanent) {
      updatedNotes = currentNotes.filter((n) => n.id !== id);
    } else {
      updatedNotes = currentNotes.map((n) =>
        n.id === id ? { ...n, isTrash: true, updatedAt: Date.now() } : n
      );
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    notifyListeners(updatedNotes);
    return updatedNotes;
  } catch (error) {
    console.error('Gagal menghapus catatan:', error);
    throw error;
  }
}

export async function restoreNote(id: string): Promise<Note[]> {
  try {
    const currentNotes = await getNotes();
    const updatedNotes = currentNotes.map((n) =>
      n.id === id ? { ...n, isTrash: false, updatedAt: Date.now() } : n
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    notifyListeners(updatedNotes);
    return updatedNotes;
  } catch (error) {
    console.error('Gagal memulihkan catatan:', error);
    throw error;
  }
}

export async function togglePinNote(id: string): Promise<Note[]> {
  try {
    const currentNotes = await getNotes();
    const updatedNotes = currentNotes.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    notifyListeners(updatedNotes);
    return updatedNotes;
  } catch (error) {
    console.error('Gagal mengubah pin catatan:', error);
    throw error;
  }
}

export async function toggleArchiveNote(id: string): Promise<Note[]> {
  try {
    const currentNotes = await getNotes();
    const updatedNotes = currentNotes.map((n) =>
      n.id === id ? { ...n, isArchived: !n.isArchived, updatedAt: Date.now() } : n
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    notifyListeners(updatedNotes);
    return updatedNotes;
  } catch (error) {
    console.error('Gagal mengarsipkan catatan:', error);
    throw error;
  }
}

export async function toggleChecklistItem(
  noteId: string,
  lineIndex: number,
  newChecked: boolean
): Promise<Note[]> {
  try {
    const currentNotes = await getNotes();
    const target = currentNotes.find((n) => n.id === noteId);
    if (!target) return currentNotes;

    const lines = target.content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return currentNotes;

    const line = lines[lineIndex];
    const match = line.match(/^(\s*)\[([ xX])\]\s*(.*)$/);
    if (!match) return currentNotes;

    const indent = match[1];
    const rest = match[3];
    lines[lineIndex] = `${indent}[${newChecked ? 'x' : ' '}] ${rest}`;

    const updatedNote: Note = {
      ...target,
      content: lines.join('\n'),
      updatedAt: Date.now(),
    };

    return await saveNote(updatedNote);
  } catch (error) {
    console.error('Gagal mengubah status checklist:', error);
    return await getNotes();
  }
}
