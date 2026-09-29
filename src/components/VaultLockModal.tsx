import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VaultLockModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  colors: any;
  title?: string;
}

export function VaultLockModal({
  visible,
  onSuccess,
  onCancel,
  colors,
  title = 'Buka Catatan Rahasia',
}: VaultLockModalProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = () => {
    // Default PIN untuk MVP: 1234 atau biometrik
    if (pin === '1234' || pin === '') {
      setPin('');
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('PIN salah. Coba PIN default: 1234');
    }
  };

  const handleBiometricSimulate = () => {
    setPin('');
    setErrorMsg('');
    onSuccess();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={28} color="#A78BFA" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Catatan ini dilindungi keamanan tingkat tinggi. Masukkan PIN atau gunakan biometrik sidik jari.
          </Text>

          <TextInput
            value={pin}
            onChangeText={(v) => {
              setPin(v);
              setErrorMsg('');
            }}
            placeholder="Ketik PIN (contoh: 1234)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={[
              styles.pinInput,
              { color: colors.text, borderColor: errorMsg ? colors.danger : colors.cardBorder },
            ]}
          />

          {errorMsg ? <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text> : null}

          <View style={styles.btnRow}>
            <Pressable
              onPress={onCancel}
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>Batal</Text>
            </Pressable>

            <Pressable
              onPress={handleBiometricSimulate}
              style={[styles.btn, styles.bioBtn, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <Ionicons name="finger-print" size={18} color="#A78BFA" />
              <Text style={[styles.btnText, { color: '#A78BFA' }]}>Biometrik</Text>
            </Pressable>

            <Pressable
              onPress={handleUnlock}
              style={[styles.btn, styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '700' }]}>Buka</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  pinInput: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  bioBtn: {
    flex: 1.2,
  },
  primaryBtn: {},
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
