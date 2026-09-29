import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Modal,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Note, NoteFilter } from '@/types/note';
import {
  getNotes,
  saveNote,
  deleteNote,
  restoreNote,
  togglePinNote,
  toggleArchiveNote,
  subscribeNotes,
} from '@/services/storage';
import { Colors } from '@/constants/theme';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { VaultLockModal } from '@/components/VaultLockModal';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { triggerMarkdownImport } from '@/utils/markdownExporter';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const selectedNoteRef = useRef<Note | null>(selectedNote);
  selectedNoteRef.current = selectedNote;

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [lockedNotePending, setLockedNotePending] = useState<Note | null>(null);

  // Load notes on mount & subscribe to storage updates
  useEffect(() =>
  {
    let isMounted = true;
    getNotes().then((loaded) =>
    {
      if (isMounted)
      {
        setNotes(loaded);
        if (isWideScreen && loaded.length > 0 && !selectedNoteRef.current)
        {
          setSelectedNote(loaded[0]);
        }
      }
    });

    const unsubscribe = subscribeNotes((updatedNotes) =>
    {
      setNotes(updatedNotes);
      if (selectedNoteRef.current)
      {
        const refreshed = updatedNotes.find((n) => n.id === selectedNoteRef.current?.id);
        if (refreshed)
        {
          setSelectedNote(refreshed);
        }
      }
    });

    return () =>
    {
      isMounted = false;
      unsubscribe();
    };
  }, [isWideScreen]);

  // Ekstrak semua tag unik dari catatan aktif
  const allTags = useMemo(() =>
  {
    const set = new Set<string>();
    notes.forEach((n) =>
    {
      if (!n.isTrash)
      {
        n.tags?.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [notes]);

  // Filter & Search
  const filteredNotes = useMemo(() =>
  {
    return notes.filter((n) =>
    {
      // Filter status
      if (activeFilter === 'trash')
      {
        if (!n.isTrash) return false;
      }
      else
      {
        if (n.isTrash) return false;
        if (activeFilter === 'archived' && !n.isArchived) return false;
        if (activeFilter === 'pinned' && (!n.isPinned || n.isArchived)) return false;
        if (activeFilter === 'all' && n.isArchived) return false;
      }

      // Filter tag
      if (selectedTag && !n.tags?.includes(selectedTag))
      {
        return false;
      }

      // Filter query search (judul, isi, tag)
      if (searchQuery.trim())
      {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchTag) return false;
      }

      return true;
    });
  }, [notes, activeFilter, selectedTag, searchQuery]);

  // Pisahkan pinned dan other notes pada view 'all'
  const pinnedNotes = useMemo(() =>
  {
    if (activeFilter !== 'all') return [];
    return filteredNotes.filter((n) => n.isPinned);
  }, [filteredNotes, activeFilter]);

  const otherNotes = useMemo(() =>
  {
    if (activeFilter !== 'all') return filteredNotes;
    return filteredNotes.filter((n) => !n.isPinned);
  }, [filteredNotes, activeFilter]);

  const handleCreateNewNote = async () =>
  {
    const newNote: Note = {
      id: 'note-' + Date.now(),
      title: '',
      content: '',
      tags: selectedTag ? [selectedTag] : [],
      isPinned: false,
      isArchived: false,
      isTrash: false,
      isLocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'synced',
    };

    // Langsung simpan ke penyimpanan lokal agar segera terdaftar di database dan UI
    const updatedNotes = await saveNote(newNote);
    setNotes(updatedNotes);
    setSelectedNote(newNote);
    setIsEditorModalOpen(true);
  };

  const handleSelectNote = (note: Note) =>
  {
    if (note.isLocked)
    {
      setLockedNotePending(note);
    }
    else
    {
      setSelectedNote(note);
      if (!isWideScreen)
      {
        setIsEditorModalOpen(true);
      }
    }
  };

  const handleUnlockSuccess = () =>
  {
    if (lockedNotePending)
    {
      setSelectedNote(lockedNotePending);
      if (!isWideScreen)
      {
        setIsEditorModalOpen(true);
      }
      setLockedNotePending(null);
    }
  };

  const handleSaveNote = async (updated: Note) =>
  {
    const updatedNotes = await saveNote(updated);
    setNotes(updatedNotes);
  };

  const handleDeleteNote = async (id: string) =>
  {
    const target = notes.find((n) => n.id === id);
    const permanent = target?.isTrash === true;
    const updatedNotes = await deleteNote(id, permanent);
    setNotes(updatedNotes);
    if (selectedNote?.id === id)
    {
      setSelectedNote(null);
      setIsEditorModalOpen(false);
    }
  };

  const handleRestoreNote = async (id: string) =>
  {
    const updatedNotes = await restoreNote(id);
    setNotes(updatedNotes);
  };

  const handleTogglePin = async (id: string) =>
  {
    const updatedNotes = await togglePinNote(id);
    setNotes(updatedNotes);
  };

  const handleToggleArchive = async (id: string) =>
  {
    const updatedNotes = await toggleArchiveNote(id);
    setNotes(updatedNotes);
  };

  const handleImportMarkdown = async () =>
  {
    const imported = await triggerMarkdownImport();
    if (imported.length > 0)
    {
      const all = await getNotes();
      setNotes(all);
      if (imported[0])
      {
        setSelectedNote(imported[0]);
        if (!isWideScreen)
        {
          setIsEditorModalOpen(true);
        }
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.layoutWrapper}>
        {/* ================= LEFT PANE: NOTES LIST ================= */}
        <View style={[styles.listPane, isWideScreen && styles.listPaneWide, { borderRightColor: colors.cardBorder }]}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.appBrand}>
                <View style={[styles.logoBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="lock-closed" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.appTitle, { color: colors.text }]}>Private Note</Text>
              </View>

              <View style={styles.headerRightActions}>
                <Pressable
                  onPress={handleCreateNewNote}
                  style={({ pressed }) => [
                    styles.newNoteHeaderBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Ionicons name="add" size={15} color="#FFFFFF" />
                  <Text style={styles.newNoteHeaderBtnText}>Baru</Text>
                </Pressable>

                <Pressable
                  onPress={handleImportMarkdown}
                  style={({ pressed }) => [
                    styles.importBtn,
                    { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder },
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
                  <Text style={[styles.importBtnText, { color: colors.text }]}>Impor</Text>
                </Pressable>
                <SyncStatusBadge colors={colors} />
              </View>
            </View>

            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
              <Ionicons name="search" size={17} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari catatan atau #tag..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Filter Mode Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
              <Pressable
                onPress={() => setActiveFilter('all')}
                style={[
                  styles.filterTab,
                  activeFilter === 'all' && [styles.filterTabActive, { backgroundColor: colors.backgroundSelected }],
                ]}>
                <Text
                  style={[
                    styles.filterTabText,
                    { color: activeFilter === 'all' ? colors.primary : colors.textSecondary },
                  ]}>
                  Semua
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter('pinned')}
                style={[
                  styles.filterTab,
                  activeFilter === 'pinned' && [styles.filterTabActive, { backgroundColor: colors.backgroundSelected }],
                ]}>
                <Ionicons
                  name="pin"
                  size={12}
                  color={activeFilter === 'pinned' ? colors.pin : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    { color: activeFilter === 'pinned' ? colors.pin : colors.textSecondary },
                  ]}>
                  Disematkan
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter('archived')}
                style={[
                  styles.filterTab,
                  activeFilter === 'archived' && [styles.filterTabActive, { backgroundColor: colors.backgroundSelected }],
                ]}>
                <Text
                  style={[
                    styles.filterTabText,
                    { color: activeFilter === 'archived' ? colors.primary : colors.textSecondary },
                  ]}>
                  Arsip
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveFilter('trash')}
                style={[
                  styles.filterTab,
                  activeFilter === 'trash' && [styles.filterTabActive, { backgroundColor: colors.backgroundSelected }],
                ]}>
                <Text
                  style={[
                    styles.filterTabText,
                    { color: activeFilter === 'trash' ? colors.danger : colors.textSecondary },
                  ]}>
                  Sampah
                </Text>
              </Pressable>
            </ScrollView>

            {/* Tag Pills Filter */}
            {allTags.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagChips}>
                <Pressable
                  onPress={() => setSelectedTag(null)}
                  style={[
                    styles.tagChip,
                    selectedTag === null && [styles.tagChipActive, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }],
                  ]}>
                  <Text style={[styles.tagChipText, { color: selectedTag === null ? colors.primary : colors.textSecondary }]}>
                    #semua
                  </Text>
                </Pressable>

                {allTags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    style={[
                      styles.tagChip,
                      selectedTag === tag && [styles.tagChipActive, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }],
                    ]}>
                    <Text
                      style={[
                        styles.tagChipText,
                        { color: selectedTag === tag ? colors.primary : colors.textSecondary },
                      ]}>
                      #{tag}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Notes Scroll List */}
          <ScrollView
            style={styles.notesScrollView}
            contentContainerStyle={styles.notesContainer}
            showsVerticalScrollIndicator={false}>
            {/* Pinned section if in 'all' */}
            {activeFilter === 'all' && pinnedNotes.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="pin" size={13} color={colors.pin} />
                  <Text style={[styles.sectionHeaderText, { color: colors.pin }]}>DISEMATKAN</Text>
                </View>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPress={() => handleSelectNote(note)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    textColor={colors.text}
                    secondaryTextColor={colors.textSecondary}
                    cardBg={colors.card}
                    borderColor={colors.cardBorder}
                    accentColor={colors.primary}
                    pinColor={colors.pin}
                  />
                ))}
              </View>
            )}

            {/* Other / Main Notes */}
            {otherNotes.length > 0 ? (
              <View style={styles.sectionBlock}>
                {activeFilter === 'all' && pinnedNotes.length > 0 && (
                  <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>LAINNYA</Text>
                )}
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPress={() => handleSelectNote(note)}
                    onTogglePin={() => handleTogglePin(note.id)}
                    textColor={colors.text}
                    secondaryTextColor={colors.textSecondary}
                    cardBg={colors.card}
                    borderColor={colors.cardBorder}
                    accentColor={colors.primary}
                    pinColor={colors.pin}
                  />
                ))}
              </View>
            ) : filteredNotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={44} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Catatan</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? `Tidak ada catatan dengan kata kunci "${searchQuery}"`
                    : 'Mulai menulis catatan pribadimu dengan format WhatsApp.'}
                </Text>
                <Pressable
                  onPress={handleCreateNewNote}
                  style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.createFirstText}>Buat Catatan Sekarang</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Bottom spacer for FAB & Tab bar */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Floating Action Button (FAB) Mobile & Desktop */}
          <Pressable
            onPress={handleCreateNewNote}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ================= RIGHT PANE (DESKTOP / TABLET DUAL-PANE) ================= */}
        {isWideScreen && (
          <View style={styles.detailPane}>
            {selectedNote ? (
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onSave={handleSaveNote}
                onClose={() => setSelectedNote(null)}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
                colors={colors}
              />
            ) : (
              <View style={styles.noSelectedPane}>
                <Ionicons name="create-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noSelectedTitle, { color: colors.text }]}>Pilih atau Buat Catatan</Text>
                <Text style={[styles.noSelectedSub, { color: colors.textSecondary }]}>
                  Pilih catatan dari panel kiri untuk membaca dan mengedit, atau buat catatan baru.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ================= MOBILE EDITOR MODAL ================= */}
      {!isWideScreen && (
        <Modal
          visible={isEditorModalOpen && !!selectedNote}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsEditorModalOpen(false)}>
          {selectedNote && (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onSave={handleSaveNote}
                onClose={() => setIsEditorModalOpen(false)}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
                colors={colors}
              />
            </SafeAreaView>
          )}
        </Modal>
      )}

      {/* ================= VAULT / LOCK MODAL ================= */}
      <VaultLockModal
        visible={!!lockedNotePending}
        onSuccess={handleUnlockSuccess}
        onCancel={() => setLockedNotePending(null)}
        colors={colors}
        title={lockedNotePending?.title || 'Buka Catatan Rahasia'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  layoutWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  listPane: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  listPaneWide: {
    maxWidth: 420,
    borderRightWidth: 1,
  },
  detailPane: {
    flex: 1.5,
    height: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newNoteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newNoteHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  importBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      outlineWidth: 0,
    } as any),
  },
  filterTabs: {
    gap: 6,
    paddingVertical: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  tagChips: {
    gap: 6,
    paddingVertical: 2,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tagChipActive: {},
  tagChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  notesScrollView: {
    flex: 1,
  },
  notesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 99999,
  },
  noSelectedPane: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noSelectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  noSelectedSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 18,
  },
});
