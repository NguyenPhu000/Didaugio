import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { locationService } from "../../../apis/locationService";
import { BottomSheetPicker } from "../../../components/ui/BottomSheetPicker";
import { TOKENS } from "../../../constants/design-tokens";
import { MaterialIcons } from "@expo/vector-icons";

export function ProvinceDistrictSelect({
  provinceCode,
  districtCode,
  onProvinceChange,
  onDistrictChange,
}) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);

  const provinceSheetRef = useRef(null);
  const districtSheetRef = useRef(null);

  useEffect(() => {
    locationService
      .getAllProvinces()
      .then((data) => setProvinces(data))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (provinceCode) {
      locationService
        .getWardsByProvince(provinceCode)
        .then((data) => setDistricts(data))
        .catch((err) => console.log(err));
    } else {
      setDistricts([]);
    }
  }, [provinceCode]);

  const provinceOptions = useMemo(() => {
    if (!Array.isArray(provinces)) return [];
    return provinces.map((p) => ({ label: p.name, value: p.province_code }));
  }, [provinces]);

  const districtOptions = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    return districts.map((d) => ({ label: d.ward_name, value: d.ward_code }));
  }, [districts]);

  const selectedProvinceLabel =
    provinceOptions.find((p) => p.value === provinceCode)?.label || "Chọn Tỉnh/Thành phố";
  
  const selectedDistrictLabel =
    districtOptions.find((d) => d.value === districtCode)?.label || "Chọn Quận/Huyện/Phường/Xã";

  return (
    <View style={styles.container}>
      <Pressable style={styles.pickerTrigger} onPress={() => provinceSheetRef.current?.present()}>
        <Text style={[styles.triggerText, !provinceCode && styles.placeholder]}>
          {selectedProvinceLabel}
        </Text>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </Pressable>

      <Pressable
        style={styles.pickerTrigger}
        onPress={() => {
          if (!provinceCode) return;
          districtSheetRef.current?.present();
        }}
      >
        <Text
          style={[
            styles.triggerText,
            (!districtCode || !provinceCode) && styles.placeholder,
          ]}
        >
          {provinceCode ? selectedDistrictLabel : "Vui lòng chọn Tỉnh/Thành trước"}
        </Text>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </Pressable>

      <BottomSheetPicker
        ref={provinceSheetRef}
        title="Tỉnh/Thành Phố"
        data={provinceOptions}
        selectedValue={provinceCode}
        snapPoints={["60%", "90%"]}
        onSelect={(val) => {
          onProvinceChange(val);
          onDistrictChange("");
        }}
      />

      <BottomSheetPicker
        ref={districtSheetRef}
        title="Quận/Huyện"
        data={districtOptions}
        selectedValue={districtCode}
        snapPoints={["60%", "90%"]}
        onSelect={(val) => onDistrictChange(val)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  triggerText: {
    fontFamily: TOKENS.font.body,
    fontSize: 16,
    color: "#111111",
    flex: 1,
  },
  placeholder: {
    color: "#9CA3AF",
  },
});
