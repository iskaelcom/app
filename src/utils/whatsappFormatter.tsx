import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WhatsAppFormatType } from '@/types/note';

/**
 * Memformat teks inline mengikuti aturan WhatsApp:
 * - *tebal* -> Bold
 * - _miring_ -> Italic
 * - ~coret~ -> Strikethrough
 * - ```monospace``` -> Monospace
 * - `code` -> Monospace
 */
export function renderInlineFormattedText(
  text: string,
  baseStyle?: any,
  colors?: { text: string; codeBg: string; codeText: string }
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let keyIndex = 0;

  // Regex tokenizer untuk WhatsApp inline formatting
  // 1. Triple backticks: ```code```
  // 2. Single backticks: `code`
  // 3. Bold: *text* (tidak boleh spasi di awal/akhir dalam tanda bintang)
  // 4. Italic: _text_
  // 5. Strikethrough: ~text~
  const pattern = /(```[\s\S]*?```|`[^`]+`|\*[^\s*][^*]*[^\s*]\*|\*[^\s*]\*|_[^\s_][^_]*[^\s_]_|_[^\s_]_|~[^\s~][^~]*[^\s~]~|~[^\s~]~)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Teks biasa sebelum match
    if (match.index > lastIndex) {
      result.push(
        <Text key={`plain-${keyIndex++}`} style={baseStyle}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }

    const token = match[0];

    if (token.startsWith('```') && token.endsWith('```')) {
      const codeContent = token.slice(3, -3);
      result.push(
        <Text
          key={`code-block-${keyIndex++}`}
          style={[
            baseStyle,
            styles.inlineCode,
            colors && { backgroundColor: colors.codeBg, color: colors.codeText },
          ]}>
          {codeContent}
        </Text>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      result.push(
        <Text
          key={`code-${keyIndex++}`}
          style={[
            baseStyle,
            styles.inlineCode,
            colors && { backgroundColor: colors.codeBg, color: colors.codeText },
          ]}>
          {codeContent}
        </Text>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const boldContent = token.slice(1, -1);
      result.push(
        <Text key={`bold-${keyIndex++}`} style={[baseStyle, styles.bold]}>
          {boldContent}
        </Text>
      );
    } else if (token.startsWith('_') && token.endsWith('_')) {
      const italicContent = token.slice(1, -1);
      result.push(
        <Text key={`italic-${keyIndex++}`} style={[baseStyle, styles.italic]}>
          {italicContent}
        </Text>
      );
    } else if (token.startsWith('~') && token.endsWith('~')) {
      const strikeContent = token.slice(1, -1);
      result.push(
        <Text key={`strike-${keyIndex++}`} style={[baseStyle, styles.strikethrough]}>
          {strikeContent}
        </Text>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Sisa teks setelah match terakhir
  if (lastIndex < text.length) {
    result.push(
      <Text key={`plain-end-${keyIndex++}`} style={baseStyle}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return result.length > 0 ? result : [<Text key="empty" style={baseStyle}>{text}</Text>];
}

interface WhatsAppViewerProps {
  content: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  cardBg?: string;
  onToggleChecklist?: (lineIndex: number, newChecked: boolean) => void;
  interactive?: boolean;
}

/**
 * Komponen viewer untuk merender baris per baris dengan format WhatsApp:
 * Quote (>), Bullet (- / *), Numbered (1.), Checklist ([ ] / [x])
 */
export function WhatsAppViewer({
  content,
  textColor = '#E2E8F0',
  accentColor = '#10B981',
  borderColor = 'rgba(255,255,255,0.12)',
  cardBg = 'rgba(255,255,255,0.06)',
  onToggleChecklist,
  interactive = true,
}: WhatsAppViewerProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const codeColors = {
    text: textColor,
    codeBg: cardBg,
    codeText: accentColor,
  };

  return (
    <View style={styles.viewerContainer}>
      {lines.map((line, index) => {
        // 1. Checklist item: [ ] teks atau [x] teks
        const checklistMatch = line.match(/^(\s*)\[([ xX])\]\s*(.*)$/);
        if (checklistMatch) {
          const isChecked = checklistMatch[2].toLowerCase() === 'x';
          const itemText = checklistMatch[3];
          return (
            <Pressable
              key={`line-${index}`}
              disabled={!interactive || !onToggleChecklist}
              onPress={() => onToggleChecklist && onToggleChecklist(index, !isChecked)}
              style={styles.checklistRow}>
              <Ionicons
                name={isChecked ? 'checkbox' : 'square-outline'}
                size={20}
                color={isChecked ? accentColor : textColor}
                style={styles.checkIcon}
              />
              <Text
                style={[
                  styles.lineText,
                  { color: textColor },
                  isChecked && styles.strikethroughCheck,
                ]}>
                {renderInlineFormattedText(
                  itemText,
                  {
                    color: textColor,
                    fontSize: 15,
                    lineHeight: 22,
                  },
                  codeColors
                )}
              </Text>
            </Pressable>
          );
        }

        // 2. Blockquote: > kutipan
        if (line.startsWith('>')) {
          const quoteText = line.replace(/^>\s*/, '');
          return (
            <View
              key={`line-${index}`}
              style={[
                styles.quoteBlock,
                { borderLeftColor: accentColor, backgroundColor: cardBg },
              ]}>
              <Text style={[styles.lineText, { color: textColor }]}>
                {renderInlineFormattedText(
                  quoteText,
                  { color: textColor, fontSize: 14, fontStyle: 'italic', lineHeight: 21 },
                  codeColors
                )}
              </Text>
            </View>
          );
        }

        // 3. Bullet list: - item atau * item
        const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
        if (bulletMatch) {
          const bulletText = bulletMatch[3];
          return (
            <View key={`line-${index}`} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.lineText, { color: textColor }]}>
                {renderInlineFormattedText(
                  bulletText,
                  { color: textColor, fontSize: 15, lineHeight: 22 },
                  codeColors
                )}
              </Text>
            </View>
          );
        }

        // 4. Numbered list: 1. item
        const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (numberMatch) {
          const num = numberMatch[2];
          const numText = numberMatch[3];
          return (
            <View key={`line-${index}`} style={styles.numberedRow}>
              <Text style={[styles.numberLabel, { color: accentColor }]}>{num}.</Text>
              <Text style={[styles.lineText, { color: textColor }]}>
                {renderInlineFormattedText(
                  numText,
                  { color: textColor, fontSize: 15, lineHeight: 22 },
                  codeColors
                )}
              </Text>
            </View>
          );
        }

        // 5. Normal Line
        return (
          <View key={`line-${index}`} style={styles.normalRow}>
            {line.trim().length === 0 ? (
              <View style={{ height: 10 }} />
            ) : (
              <Text style={[styles.lineText, { color: textColor }]}>
                {renderInlineFormattedText(
                  line,
                  { color: textColor, fontSize: 15, lineHeight: 22 },
                  codeColors
                )}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Membersihkan token WhatsApp formatting untuk keperluan snippet preview
 */
export function stripWhatsAppFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/^>\s*/gm, '') // hapus quote
    .replace(/^(\s*)\[[ xX]\]\s*/gm, '☐ ') // to-do icon
    .replace(/^(\s*)[-*]\s+/gm, '• ') // bullet
    .replace(/^(\s*)(\d+)\.\s+/gm, '$2. ') // numbered
    .replace(/```([\s\S]*?)```/g, '$1') // monospace multi
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\*([^*]+)\*/g, '$1') // bold
    .replace(/_([^_]+)_/g, '$1') // italic
    .replace(/~([^~]+)~/g, '$1'); // strike
}

/**
 * Membantu menyisipkan format WhatsApp ke dalam teks editor
 */
export function insertWhatsAppToken(
  currentText: string,
  type: WhatsAppFormatType,
  selectionStart: number = 0,
  selectionEnd: number = 0
): { text: string; newCursor: number } {
  const isSelected = selectionEnd > selectionStart;
  const selectedText = isSelected ? currentText.substring(selectionStart, selectionEnd) : '';

  let prefix = '';
  let suffix = '';

  switch (type) {
    case 'bold':
      prefix = '*';
      suffix = '*';
      break;
    case 'italic':
      prefix = '_';
      suffix = '_';
      break;
    case 'strike':
      prefix = '~';
      suffix = '~';
      break;
    case 'monospace':
      prefix = '```';
      suffix = '```';
      break;
    case 'quote':
      prefix = '\n> ';
      suffix = '';
      break;
    case 'bullet':
      prefix = '\n- ';
      suffix = '';
      break;
    case 'numbered':
      prefix = '\n1. ';
      suffix = '';
      break;
    case 'checklist':
      prefix = '\n[ ] ';
      suffix = '';
      break;
  }

  if (isSelected) {
    const newText =
      currentText.substring(0, selectionStart) +
      prefix +
      selectedText +
      suffix +
      currentText.substring(selectionEnd);
    return {
      text: newText,
      newCursor: selectionEnd + prefix.length + suffix.length,
    };
  } else {
    // Jika tidak ada teks yang diseleksi, sisipkan token kosong
    const placeholder = type === 'quote' || type === 'bullet' || type === 'checklist' || type === 'numbered'
      ? ''
      : 'teks';
    const newText =
      currentText.substring(0, selectionStart) +
      prefix +
      placeholder +
      suffix +
      currentText.substring(selectionStart);
    return {
      text: newText,
      newCursor: selectionStart + prefix.length + placeholder.length + suffix.length,
    };
  }
}

const styles = StyleSheet.create({
  viewerContainer: {
    gap: 4,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.75,
  },
  strikethroughCheck: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  inlineCode: {
    fontFamily: 'monospace',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 14,
  },
  lineText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  normalRow: {
    flexDirection: 'row',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  checkIcon: {
    marginTop: 2,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 6,
    paddingRight: 8,
    marginVertical: 4,
    borderRadius: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 2,
  },
  numberLabel: {
    fontWeight: '700',
    fontSize: 15,
    minWidth: 18,
  },
});
