import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WhatsAppFormatType } from '@/types/note';

interface WhatsAppToolbarProps {
  onInsertFormat: (type: WhatsAppFormatType) => void;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  activeColor?: string;
}

export function WhatsAppToolbar({
  onInsertFormat,
  textColor = '#E2E8F0',
  bgColor = '#161F30',
  borderColor = 'rgba(255,255,255,0.08)',
  activeColor = '#10B981',
}: WhatsAppToolbarProps) {
  const tools: {
    type: WhatsAppFormatType;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    preview: string;
  }[] = [
    { type: 'bold', label: 'B', preview: '*tebal*' },
    { type: 'italic', label: 'I', preview: '_miring_' },
    { type: 'strike', label: 'S', preview: '~coret~' },
    { type: 'monospace', label: 'Mono', icon: 'code-slash-outline', preview: '```kode```' },
    { type: 'checklist', label: 'Tugas', icon: 'checkbox-outline', preview: '[ ] item' },
    { type: 'quote', label: 'Kutipan', icon: 'chatbox-ellipses-outline', preview: '> quote' },
    { type: 'bullet', label: 'Poin', icon: 'list-outline', preview: '- poin' },
    { type: 'numbered', label: 'Angka', icon: 'reorder-four-outline', preview: '1. poin' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {tools.map((tool) => (
          <Pressable
            key={tool.type}
            onPress={() => onInsertFormat(tool.type)}
            style={({ pressed }) => [
              styles.toolBtn,
              { borderColor },
              pressed && { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
            ]}>
            {tool.icon ? (
              <Ionicons name={tool.icon} size={16} color={activeColor} />
            ) : null}
            <Text
              style={[
                styles.toolLabel,
                { color: textColor },
                tool.type === 'bold' && styles.boldLabel,
                tool.type === 'italic' && styles.italicLabel,
                tool.type === 'strike' && styles.strikeLabel,
              ]}>
              {tool.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scrollContent: {
    gap: 8,
    alignItems: 'center',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  boldLabel: {
    fontWeight: '800',
  },
  italicLabel: {
    fontStyle: 'italic',
  },
  strikeLabel: {
    textDecorationLine: 'line-through',
  },
});
