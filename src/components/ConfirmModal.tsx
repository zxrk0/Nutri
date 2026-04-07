import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function ConfirmModal({ visible, message, onConfirm, onCancel, confirmLabel = 'Supprimer' }: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  message: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.card2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.red + '20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: Colors.red,
    fontSize: 15,
    fontWeight: '700',
  },
});
