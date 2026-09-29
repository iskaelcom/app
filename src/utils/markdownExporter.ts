import { Platform } from 'react-native';
import { Note } from '@/types/note';
import { saveNote } from '@/services/storage';

/**
 * Mengonversi Note menjadi string Markdown dengan YAML Frontmatter standar
 * agar dapat dibaca mulus di Obsidian, Notion, VS Code, iA Writer, dll.
 */
export function formatNoteToMarkdown(note: Note): string {
  const safeTitle = (note.title || 'Catatan Tanpa Judul').replace(/"/g, '\\"');
  const tagsYaml = note.tags && note.tags.length > 0 ? `[${note.tags.map((t) => `"${t}"`).join(', ')}]` : '[]';
  const createdDate = new Date(note.createdAt).toISOString();
  const updatedDate = new Date(note.updatedAt).toISOString();

  return `---
title: "${safeTitle}"
tags: ${tagsYaml}
pinned: ${note.isPinned}
locked: ${note.isLocked || false}
created: "${createdDate}"
updated: "${updatedDate}"
---

${note.content || ''}
`;
}

/**
 * Mengunduh file Markdown (.md) ke perangkat pengguna
 */
export function downloadMarkdownFile(filename: string, content: string) {
  const safeFilename = filename
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'catatan';
  const finalFilename = safeFilename.endsWith('.md') ? safeFilename : `${safeFilename}.md`;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Pada mobile Android (akan dihubungkan ke FileSystem / Sharing di Phase EAS)
    console.log('Download markdown pada platform native:', finalFilename);
  }
}

/**
 * Mengunduh semua catatan sekaligus dalam satu format bundle Markdown (.md)
 */
export function exportAllNotesToMarkdownBundle(notes: Note[]) {
  const activeNotes = notes.filter((n) => !n.isTrash);
  if (activeNotes.length === 0) return;

  const separator = '\n\n' + '='.repeat(60) + '\n\n';
  const fullContent = activeNotes.map((note) => formatNoteToMarkdown(note)).join(separator);
  const dateStr = new Date().toISOString().split('T')[0];

  downloadMarkdownFile(`private-note-all-export-${dateStr}.md`, fullContent);
}

/**
 * Mem-parsing isi file Markdown (.md) menjadi objek Note
 * Mendukung pembacaan YAML Frontmatter atau heading reguler
 */
export function parseMarkdownToNote(rawContent: string, filename: string = ''): Note {
  let title = filename.replace(/\.(md|markdown|txt)$/i, '').replace(/[_-]/g, ' ');
  let content = rawContent;
  let tags: string[] = [];
  let isPinned = false;
  let isLocked = false;
  let createdAt = Date.now();
  let updatedAt = Date.now();

  // 1. Periksa apakah terdapat YAML Frontmatter (antara tanda --- di awal)
  const frontmatterMatch = rawContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  if (frontmatterMatch) {
    const frontmatterText = frontmatterMatch[1];
    content = frontmatterMatch[2].trim();

    // Parse baris frontmatter sederhana
    const titleMatch = frontmatterText.match(/title:\s*["']?([^"'\n]+)["']?/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    const tagsMatch = frontmatterText.match(/tags:\s*\[(.*?)\]/i);
    if (tagsMatch && tagsMatch[1]) {
      tags = tagsMatch[1]
        .split(',')
        .map((t) => t.replace(/["'\s]/g, '').trim())
        .filter(Boolean);
    }

    const pinnedMatch = frontmatterText.match(/pinned:\s*(true|false)/i);
    if (pinnedMatch) {
      isPinned = pinnedMatch[1].toLowerCase() === 'true';
    }

    const lockedMatch = frontmatterText.match(/locked:\s*(true|false)/i);
    if (lockedMatch) {
      isLocked = lockedMatch[1].toLowerCase() === 'true';
    }

    const createdMatch = frontmatterText.match(/created:\s*["']?([^"'\n]+)["']?/i);
    if (createdMatch && createdMatch[1]) {
      const parsedTime = Date.parse(createdMatch[1]);
      if (!isNaN(parsedTime)) createdAt = parsedTime;
    }
  } else {
    // 2. Jika tidak ada frontmatter, cek apakah baris pertama diawali `# Judul`
    const firstLineMatch = rawContent.match(/^#\s+(.+)$/m);
    if (firstLineMatch) {
      title = firstLineMatch[1].trim();
      // Hapus baris # Judul dari konten agar tidak duplikat
      content = rawContent.replace(/^#\s+.+\n?/, '').trim();
    }
  }

  // Bersihkan judul jika kosong
  if (!title.trim()) {
    title = 'Catatan Impor ' + new Date().toLocaleDateString('id-ID');
  }

  return {
    id: 'note-import-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title,
    content,
    tags,
    isPinned,
    isArchived: false,
    isTrash: false,
    isLocked,
    createdAt,
    updatedAt,
    syncStatus: 'synced',
  };
}

/**
 * Membuka file picker untuk memilih file .md dan menyimpannya ke database catatan
 */
export function triggerMarkdownImport(): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt';
      input.multiple = true;
      input.style.display = 'none';

      input.onchange = async (e: any) => {
        const files: FileList = e.target.files;
        if (!files || files.length === 0) {
          resolve([]);
          return;
        }

        const importedNotes: Note[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const text = await file.text();
            const parsedNote = parseMarkdownToNote(text, file.name);
            await saveNote(parsedNote);
            importedNotes.push(parsedNote);
          } catch (err) {
            console.error(`Gagal membaca file ${file.name}:`, err);
          }
        }

        document.body.removeChild(input);
        resolve(importedNotes);
      };

      document.body.appendChild(input);
      input.click();
    } else {
      resolve([]);
    }
  });
}
