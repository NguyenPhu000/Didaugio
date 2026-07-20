import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BottomSheetPicker } from "../../../components/ui/BottomSheetPicker";
import { TOKENS } from "../../../constants/design-tokens";
import { logger } from "../../../lib/logger";
import { locationService } from "../../../api/locationService";

export function ProvinceWardSelect({
  provinceCode,
  wardCode,
  onProvinceChange,
  onWardChange,
}) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const provinceSheetRef = useRef(null);
  const wardSheetRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoadingProvinces(true);
    locationService.getAllProvinces()
      .then((data) => active && setProvinces(data))
      .catch((error) => logger.warn(error))
      .finally(() => active && setLoadingProvinces(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!provinceCode) {
      setWards([]);
      return () => { active = false; };
    }
    setLoadingWards(true);
    locationService.getWardsByProvince(provinceCode)
      .then((data) => active && setWards(data))
      .catch((error) => logger.warn(error))
      .finally(() => active && setLoadingWards(false));
    return () => { active = false; };
  }, [provinceCode]);

  const provinceOptions = useMemo(
    () => provinces.map((province) => ({ label: province.fullName || province.name, value: province.code })),
    [provinces],
  );
  const wardOptions = useMemo(
    () => wards.map((ward) => ({ label: ward.fullName || ward.name, value: ward.wardCode })),
    [wards],
  );
  const provinceLabel = provinceOptions.find((item) => item.value === provinceCode)?.label || "Chọn Tỉnh/Thành phố";
  const wardLabel = wardOptions.find((item) => item.value === wardCode)?.label || "Chọn Phường/Xã/Đặc khu";

  const row = (label, enabled, onPress, bordered = false) => (
    <Pressable
      className={`flex-row items-center min-h-[52px] px-4 ${bordered ? "border-b border-[#F1F5F9]" : ""}`}
      disabled={!enabled}
      onPress={onPress}
    >
      <MaterialIconsRounded name="location-city" size={18} color={enabled ? "#64748B" : "#CBD5E1"} style={{ marginRight: 10 }} />
      <Text style={{ fontFamily: TOKENS.font.body }} className={`text-[14.5px] flex-1 ${enabled ? "text-[#1E293B]" : "text-[#94A3B8]"}`}>
        {label}
      </Text>
      <MaterialIconsRounded name="keyboard-arrow-right" size={20} color={enabled ? "#94A3B8" : "#E2E8F0"} />
    </Pressable>
  );

  return (
    <View className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      {row(provinceLabel, true, () => provinceSheetRef.current?.present(), true)}
      {row(provinceCode ? wardLabel : "Chọn tỉnh trước", Boolean(provinceCode), () => wardSheetRef.current?.present())}
      <BottomSheetPicker
        ref={provinceSheetRef}
        title="Tỉnh / Thành phố"
        data={provinceOptions}
        selectedValue={provinceCode}
        snapPoints={["60%", "90%"]}
        isLoading={loadingProvinces}
        onSelect={(code) => { onProvinceChange(code); onWardChange(""); }}
      />
      <BottomSheetPicker
        ref={wardSheetRef}
        title="Phường / Xã / Đặc khu"
        data={wardOptions}
        selectedValue={wardCode}
        snapPoints={["60%", "90%"]}
        isLoading={loadingWards}
        onSelect={onWardChange}
      />
    </View>
  );
}
