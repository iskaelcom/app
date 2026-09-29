import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note, WhatsAppFormatType } from '@/types/note';
import {
  WhatsAppViewer,
  insertWhatsAppToken,
} from '@/utils/whatsappFormatter';
import { formatNoteToMarkdown, downloadMarkdownFile } from '@/utils/markdownExporter';
import { WhatsAppToolbar } from './WhatsAppToolbar';

interface NoteEditorProps {
  note: Note;
  onSave: (updatedNote: Note) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  colors: any;
}

export function NoteEditor({
  note,
  onSave,
  onClose,
  onDelete,
  onTogglePin,
  onToggleArchive,
  colors,
}: NoteEditorProps) {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [isLocked, setIsLocked] = useState(note.isLocked || false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>(
    isWideScreen ? 'split' : 'edit'
  );
  const [savedStatus, setSavedStatus] = useState<string>('Tersimpan di perangkat');

  const contentInputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // Sinkronisasi state jika id catatan berubah
  useEffect(() =>
  {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setIsPinned(note.isPinned);
    setIsLocked(note.isLocked || false);
  }, [note.id]);

  // Debounced auto-save
  useEffect(() =>
  {
    setSavedStatus('Menyimpan...');
    const timer = setTimeout(() =>
    {
      onSave({
        ...note,
        title,
        content,
        tags,
        isPinned,
        isLocked,
        updatedAt: Date.now(),
      });
      setSavedStatus('Tersimpan di perangkat');
    }, 400);

    return () => clearTimeout(timer);
  }, [title, content, tags, isPinned, isLocked]);

  const handleManualSave = () =>
  {
    onSave({
      ...note,
      title,
      content,
      tags,
      isPinned,
      isLocked,
      updatedAt: Date.now(),
    });
    setSavedStatus('Tersimpan di perangkat');
    if (!isWideScreen)
    {
      onClose();
    }
  };

  const handleClose = () =>
  {
    onSave({
      ...note,
      title,
      content,
      tags,
      isPinned,
      isLocked,
      updatedAt: Date.now(),
    });
    onClose();
  };

  const handleExportMarkdown = () =>
  {
    const md = formatNoteToMarkdown({
      ...note,
      title,
      content,
      tags,
      isPinned,
      isLocked,
    });
    downloadMarkdownFile(title || 'catatan', md);
  };

  const handleInsertFormat = (type: WhatsAppFormatType) =>
  {
    const { text, newCursor } = insertWhatsAppToken(
      content,
      type,
      selection.start,
      selection.end
    );
    setContent(text);
    // Switch to edit if user is in preview mode
    if (viewMode === 'preview')
    {
      setViewMode('edit');
    }
  };

  const handleAddTag = () =>
  {
    const cleaned = newTagInput.trim().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned))
    {
      setTags([...tags, cleaned]);
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) =>
  {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleChecklistFromPreview = (lineIndex: number, newChecked: boolean) =>
  {
    const lines = content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length)
    {
      const line = lines[lineIndex];
      const match = line.match(/^(\s*)\[([ xX])\]\s*(.*)$/);
      if (match)
      {
        lines[lineIndex] = `${match[1]}[${newChecked ? 'x' : ' '}] ${match[3]}`;
        setContent(lines.join('\n'));
      }
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar Navigator */}
      <View style={[styles.topBar, { borderBottomColor: colors.cardBorder }]}>
        <Pressable onPress={handleClose} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Catatan</Text>
        </Pressable>

        {/* View Mode Toggle: Edit / Preview / Split (Desktop) */}
        <View style={[styles.segmentedCtrl, { backgroundColor: colors.backgroundElement }]}>
          <Pressable
            onPress={() => setViewMode('edit')}
            style={[
              styles.segmentBtn,
              viewMode === 'edit' && { backgroundColor: colors.backgroundSelected },
            ]}>
            <Ionicons
              name="create-outline"
              size={15}
              color={viewMode === 'edit' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentLabel,
                { color: viewMode === 'edit' ? colors.text : colors.textSecondary },
              ]}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('preview')}
            style={[
              styles.segmentBtn,
              viewMode === 'preview' && { backgroundColor: colors.backgroundSelected },
            ]}>
            <Ionicons
              name="eye-outline"
              size={15}
              color={viewMode === 'preview' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentLabel,
                { color: viewMode === 'preview' ? colors.text : colors.textSecondary },
              ]}>
              Preview
            </Text>
          </Pressable>

          {isWideScreen && (
            <Pressable
              onPress={() => setViewMode('split')}
              style={[
                styles.segmentBtn,
                viewMode === 'split' && { backgroundColor: colors.backgroundSelected },
              ]}>
              <Ionicons
                name="browsers-outline"
                size={15}
                color={viewMode === 'split' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  { color: viewMode === 'split' ? colors.text : colors.textSecondary },
                ]}>
                Split
              </Text>
            </Pressable>
          )}
        </View>

        {/* Action icons: Save, Export MD, Pin, Lock, Archive, Delete */}
        <View style={styles.topActions}>
          <Pressable
            onPress={handleManualSave}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Simpan</Text>
          </Pressable>
          <Pressable
            onPress={handleExportMarkdown}
            hitSlop={8}
            style={styles.actionIconBtn}>
            <Ionicons
              name="download-outline"
              size={20}
              color={colors.primary}
            />
          </Pressable>

          <Pressable
            onPress={() => setIsPinned(!isPinned)}
            hitSlop={8}
            style={styles.actionIconBtn}>
            <Ionicons
              name={isPinned ? 'pin' : 'pin-outline'}
              size={20}
              color={isPinned ? colors.pin : colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => setIsLocked(!isLocked)}
            hitSlop={8}
            style={styles.actionIconBtn}>
            <Ionicons
              name={isLocked ? 'lock-closed' : 'lock-open-outline'}
              size={20}
              color={isLocked ? '#A78BFA' : colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => onToggleArchive(note.id)}
            hitSlop={8}
            style={styles.actionIconBtn}>
            <Ionicons
              name={note.isArchived ? 'archive' : 'archive-outline'}
              size={20}
              color={note.isArchived ? colors.primary : colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => onDelete(note.id)}
            hitSlop={8}
            style={styles.actionIconBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      {/* Editor Body */}
      <View style={styles.mainContent}>
        {/* Title Input */}
        <View style={[styles.titleContainer, { borderBottomColor: colors.cardBorder }]}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Judul Catatan..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.titleInput, { color: colors.text }]}
          />
        </View>

        {/* Tags bar */}
        <View style={styles.tagsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tagItem, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.tagItemText, { color: colors.primary }]}>#{tag}</Text>
                <Pressable onPress={() => handleRemoveTag(tag)} hitSlop={6}>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </Pressable>
              </View>
            ))}

            {showTagInput ? (
              <View style={[styles.newTagBox, { borderColor: colors.cardBorder }]}>
                <TextInput
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddTag}
                  placeholder="tag..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.newTagInput, { color: colors.text }]}
                  autoFocus
                />
                <Pressable onPress={handleAddTag}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowTagInput(true)}
                style={[styles.addTagBtn, { borderColor: colors.cardBorder }]}>
                <Ionicons name="add" size={14} color={colors.textSecondary} />
                <Text style={[styles.addTagText, { color: colors.textSecondary }]}>Tambah Tag</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {/* Content Pane: Single or Split */}
        <View style={styles.editorArea}>
          {/* Edit Mode Pane */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <ScrollView
              style={[
                styles.paneScrollView,
                viewMode === 'split' && styles.splitPaneLeft,
                { borderRightColor: colors.cardBorder },
              ]}
              keyboardShouldPersistTaps="handled">
              <TextInput
                ref={contentInputRef}
                value={content}
                onChangeText={setContent}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                placeholder="Tulis catatan di sini... (Gunakan format WhatsApp: *tebal*, _miring_, ~coret~, ```kode```, > kutipan, [ ] tugas)"
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={[styles.contentInput, { color: colors.text }]}
              />
            </ScrollView>
          )}

          {/* Preview Mode Pane */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <ScrollView
              style={[styles.paneScrollView, viewMode === 'split' && styles.splitPaneRight]}
              contentContainerStyle={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <Text style={[styles.previewBadge, { color: colors.primary }]}>
                  PREVIEW (FORMAT WHATSAPP)
                </Text>
              </View>
              {content ? (
                <WhatsAppViewer
                  content={content}
                  textColor={colors.text}
                  accentColor={colors.primary}
                  cardBg={colors.backgroundElement}
                  borderColor={colors.cardBorder}
                  onToggleChecklist={handleToggleChecklistFromPreview}
                  interactive={true}
                />
              ) : (
                <Text style={[styles.emptyPreviewText, { color: colors.textSecondary }]}>
                  Pratinjau format WhatsApp akan tampil di sini saat Anda mengetik.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* WhatsApp Formatting Toolbar (Always available for quick mobile action) */}
      <WhatsAppToolbar
        onInsertFormat={handleInsertFormat}
        textColor={colors.text}
        bgColor={colors.backgroundElement}
        borderColor={colors.cardBorder}
        activeColor={colors.primary}
      />

      {/* Footer Info: Status Sync, Word count */}
      <View style={[styles.statusBar, { borderTopColor: colors.cardBorder }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{savedStatus}</Text>
        </View>

        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {wordCount} kata • {charCount} karakter
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentedCtrl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  segmentLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  actionIconBtn: {
    padding: 4,
  },
  mainContent: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    padding: 0,
  },
  tagsRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tagScroll: {
    gap: 8,
    alignItems: 'center',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newTagInput: {
    fontSize: 12,
    minWidth: 60,
    padding: 0,
  },
  editorArea: {
    flex: 1,
    flexDirection: 'row',
  },
  paneScrollView: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  splitPaneLeft: {
    borderRightWidth: 1,
  },
  splitPaneRight: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 250,
  },
  previewContainer: {
    paddingBottom: 24,
  },
  previewHeader: {
    marginBottom: 10,
  },
  previewBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyPreviewText: {
    fontStyle: 'italic',
    fontSize: 14,
    marginTop: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
