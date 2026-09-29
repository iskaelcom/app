export type SyncStatus = 'synced' | 'pending' | 'offline';

export type NoteFilter = 'all' | 'pinned' | 'archived' | 'trash';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  isTrash: boolean;
  isLocked?: boolean;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export type WhatsAppFormatType =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'monospace'
  | 'quote'
  | 'bullet'
  | 'numbered'
  | 'checklist';
