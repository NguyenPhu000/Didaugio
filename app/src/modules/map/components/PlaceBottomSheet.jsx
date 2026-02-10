import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Text } from '../../../components/ui/Text';

export const PlaceBottomSheet = () => {
  // ref
  const bottomSheetRef = useRef(null);

  // variables
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

  // callbacks
  // const handleSheetChanges = useCallback((index) => {
  //   console.log('handleSheetChanges', index);
  // }, []);

  // render
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        <Text variant="bold" style={styles.title}>Khám phá Cần Thơ</Text>
        <Text style={styles.subtitle}>
          Kéo lên để xem danh sách địa điểm nổi bật
        </Text>
        
        {/* Placeholder for list */}
        <View style={styles.placeholderItem} />
        <View style={styles.placeholderItem} />
        <View style={styles.placeholderItem} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  background: {
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  indicator: {
    backgroundColor: '#e5e5e5',
    width: 40,
  },
  title: {
    fontSize: 20,
    marginBottom: 4,
    color: '#171717',
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 16,
  },
  placeholderItem: {
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
  },
});
