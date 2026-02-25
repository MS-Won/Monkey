import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

/**
 * ✅ BottomSheet로 "선택 목록"을 띄우는 초간단 컴포넌트
 * - 사용법:
 *   const sheetRef = useRef<BottomSheet>(null);
 *   <BottomSheetSelect ref={sheetRef} ... />
 *   sheetRef.current?.snapToIndex(0);
 */

export type SelectItem<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  title: string;
  items: SelectItem<T>[];
  value: T | null;
  onSelect: (v: T) => void;
  onClose?: () => void;
};

export default function BottomSheetSelect<T extends string>({
  title,
  items,
  value,
  onSelect,
  onClose,
}: Props<T>) {
  const sheetRef = useRef<BottomSheet>(null);

  // ✅ 바텀시트 높이(필요하면 조절)
  const snapPoints = useMemo(() => ['45%'], []);

  // ✅ 배경(뒤 dim 처리)
  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  // ✅ 외부에서 열어야 하니까 ref를 밖으로 노출시키는 방식 대신
  // "부모에서 sheetRef를 직접 만들기"가 더 쉬운데,
  // 여기서는 최소 수정 위해 내부에서 open 함수를 노출하지 않고
  // 부모가 <BottomSheetSelect .../> 자체를 필요할 때만 렌더링하게 해도 됨.
  // 하지만 이번엔 더 간단하게: 부모에서 '보이는지' 상태로 제어할 거예요.
  // (아래 ProfileScreen 코드에서 'openKey'로 제어)

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: Colors.backgroundSecondary }}
      handleIndicatorStyle={{ backgroundColor: Colors.borderSubtle }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        {items.map((it) => {
          const active = value === it.key;
          return (
            <Pressable
              key={it.key}
              onPress={() => onSelect(it.key)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.itemText, active && styles.itemTextActive]}>
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    ...Typography.h2,
    fontSize: 16,
    marginBottom: 12,
  },
  item: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  itemActive: {
    borderColor: Colors.accentPrimary,
  },
  itemText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  itemTextActive: {
    color: Colors.accentPrimary,
  },
});
