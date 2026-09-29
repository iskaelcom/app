import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSyncState, simulateCloudSync, SyncState } from '@/services/firebase';

interface SyncStatusBadgeProps {
  colors: any;
}

export function SyncStatusBadge({ colors }: SyncStatusBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await simulateCloudSync();
    setSyncState(getSyncState());
    setIsSyncing(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.badge,
          { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' },
          pressed && { opacity: 0.8 },
        ]}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.badgeText, { color: colors.primary }]}>Local-First Synced</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="cloud-done-outline" size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Status Multi-Device Sync</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status Storage:</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]}>Local-First (Offline-Ready)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ID Perangkat Ini:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {syncState.activeDeviceId}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Backend Cloud:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>Google Firebase (Ready)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Terakhir Sinkron:</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
                  {syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleTimeString('id-ID') : '-'}
                </Text>
              </View>
            </View>

            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              Catatan Anda langsung disimpan di penyimpanan lokal perangkat sehingga dapat dibuka instan dan bekerja tanpa internet. Pada Phase 2, Firebase Firestore akan otomatis mensinkronkan data antar ponsel Android dan browser Web secara realtime.
            </Text>

            <Pressable
              onPress={handleManualSync}
              disabled={isSyncing}
              style={[
                styles.syncBtn,
                { backgroundColor: colors.primary },
                isSyncing && { opacity: 0.7 },
              ]}>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="sync" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.syncBtnText}>
                {isSyncing ? 'Menghubungkan...' : 'Tes Sinkronisasi Sekarang'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12.5,
  },
  infoValue: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  descText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
