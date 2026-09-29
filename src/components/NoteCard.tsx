import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '@/types/note';
import { stripWhatsAppFormatting } from '@/utils/whatsappFormatter';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onTogglePin?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
  textColor?: string;
  secondaryTextColor?: string;
  cardBg?: string;
  borderColor?: string;
  accentColor?: string;
  pinColor?: string;
}

export function NoteCard({
  note,
  onPress,
  onTogglePin,
  onToggleArchive,
  onDelete,
  textColor = '#F8FAFC',
  secondaryTextColor = '#94A3B8',
  cardBg = '#121824',
  borderColor = 'rgba(255, 255, 255, 0.08)',
  accentColor = '#10B981',
  pinColor = '#FBBF24',
}: NoteCardProps) {
  const snippet = stripWhatsAppFormatting(note.content).trim();
  const dateStr = formatNoteDate(note.updatedAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg, borderColor },
        note.isPinned && { borderColor: 'rgba(251, 191, 36, 0.35)' },
        pressed && styles.pressed,
      ]}>
      {/* Header bar kartu: Judul + Pin/Lock indicator */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {note.isLocked && (
            <Ionicons name="lock-closed" size={14} color="#A78BFA" style={{ marginRight: 5 }} />
          )}
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {note.title || 'Catatan Tanpa Judul'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {onTogglePin && (
            <Pressable
              hitSlop={8}
              onPress={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              style={styles.iconBtn}>
              <Ionicons
                name={note.isPinned ? 'pin' : 'pin-outline'}
                size={16}
                color={note.isPinned ? pinColor : secondaryTextColor}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Snippet Teks Preview */}
      <Text style={[styles.snippet, { color: secondaryTextColor }]} numberOfLines={3}>
        {snippet || 'Tidak ada teks...'}
      </Text>

      {/* Footer bar: Tag pills + Timestamp */}
      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          {note.tags.map((tag) => (
            <View key={tag} style={[styles.tagBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>#{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.dateText, { color: secondaryTextColor }]}>{dateStr}</Text>
      </View>
    </Pressable>
  );
}

function formatNoteDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  if (days < 7) return `${days}h lalu`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 4,
    borderRadius: 6,
  },
  snippet: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
