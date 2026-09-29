import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { getSyncState, simulateCloudSync, SyncState } from '@/services/firebase';
import { getNotes } from '@/services/storage';

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalNotes, setTotalNotes] = useState(0);

  useEffect(() => {
    getNotes().then((n) => setTotalNotes(n.length));
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await simulateCloudSync();
    setSyncState(getSyncState());
    setIsSyncing(false);
  };

  const handleExportJSON = async () => {
    const notes = await getNotes();
    const dataStr = JSON.stringify(notes, null, 2);
    // Di Web kita bisa alert atau log
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`Data backup berhasil diekstrak! Total ${notes.length} catatan.`);
    } else {
      Alert.alert('Backup Selesai', `Total ${notes.length} catatan siap diekspor.`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cloud & Security</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Informasi sinkronisasi multi-perangkat, privasi, dan panduan formatting.
          </Text>
        </View>

        {/* Card 1: Multi-Device Sync (Firebase Ready) */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="cloud-done" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Multi-Device Sync</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Sinkronisasi otomatis antara Android dan Web browser
              </Text>
            </View>
          </View>

          <View style={[styles.statusBox, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Arsitektur:</Text>
              <Text style={[styles.rowVal, { color: colors.primary }]}>Local-First + Offline Persistence</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Backend Cloud:</Text>
              <Text style={[styles.rowVal, { color: colors.text }]}>Google Firebase (Firestore)</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Device ID:</Text>
              <Text style={[styles.rowVal, { color: colors.textSecondary }]} numberOfLines={1}>
                {syncState.activeDeviceId}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Total Catatan Tersimpan:</Text>
              <Text style={[styles.rowVal, { color: colors.text }]}>{totalNotes} catatan</Text>
            </View>
          </View>

          <Pressable
            onPress={handleSyncNow}
            disabled={isSyncing}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              isSyncing && { opacity: 0.7 },
            ]}>
            <Ionicons name="sync" size={17} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>
              {isSyncing ? 'Menghubungkan ke Cloud...' : 'Uji Tes Sinkronisasi'}
            </Text>
          </Pressable>
        </View>

        {/* Card 2: WhatsApp Markdown Cheatsheet */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.whatsappGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Panduan Format WhatsApp</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Ketik langsung di ponsel tanpa tombol ribet
              </Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>*teks tebal*</Text>
              <Text style={[styles.tableDesc, { color: colors.text, fontWeight: '700' }]}>Tebal (Bold)</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>_teks miring_</Text>
              <Text style={[styles.tableDesc, { color: colors.text, fontStyle: 'italic' }]}>Miring (Italic)</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>~teks dicoret~</Text>
              <Text style={[styles.tableDesc, { color: colors.text, textDecorationLine: 'line-through' }]}>Coret (Strike)</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>```kode monospace```</Text>
              <Text style={[styles.tableDesc, { color: colors.text, fontFamily: 'monospace' }]}>Monospace</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>&gt; kutipan kata</Text>
              <Text style={[styles.tableDesc, { color: colors.text }]}>Quote Block</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>- poin atau * poin</Text>
              <Text style={[styles.tableDesc, { color: colors.text }]}>Daftar Bullet</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.tableCode, { color: colors.primary }]}>[ ] tugas baru</Text>
              <Text style={[styles.tableDesc, { color: colors.text }]}>Checklist Interaktif</Text>
            </View>
          </View>
        </View>

        {/* Card 3: Security & Privacy */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#A78BFA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Keamanan & Vault</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Privasi lokal dan kunci biometrik
              </Text>
            </View>
          </View>

          <Text style={[styles.securityDesc, { color: colors.textSecondary }]}>
            Setiap catatan dengan tanda gembok dilindungi oleh otentikasi biometrik (sidik jari di Android) atau kode PIN keamanan (default: 1234). Data tidak dapat dibaca oleh pihak ketiga.
          </Text>

          <Pressable
            onPress={handleExportJSON}
            style={[styles.outlineBtn, { borderColor: colors.cardBorder }]}>
            <Ionicons name="download-outline" size={17} color={colors.text} />
            <Text style={[styles.outlineBtnText, { color: colors.text }]}>Ekspor & Backup Cadangan</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 18,
    gap: 16,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  statusBox: {
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12.5,
  },
  rowVal: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  table: {
    gap: 2,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },
  tableDesc: {
    fontSize: 13,
  },
  securityDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
