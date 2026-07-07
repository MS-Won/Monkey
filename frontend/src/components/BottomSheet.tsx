import React from 'react';
import { Modal, Pressable, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

type SelectSheetItem<T> = {
  label: string;
  value: T;
};

type BottomSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  items: SelectSheetItem<T>[];
  selectedValue: T | undefined | null;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export default function BottomSheet<T extends string>({
  visible,
  title,
  items,
  selectedValue,
  onSelect,
  onClose,
}: BottomSheetProps<T>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          {items.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => onSelect(item.value)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemText}>
                {item.label} {selectedValue === item.value ? '✓' : ''}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 14,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
