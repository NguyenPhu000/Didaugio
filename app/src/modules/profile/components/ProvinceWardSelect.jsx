import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BottomSheetPicker } from "../../../components/ui/BottomSheetPicker";
import { TOKENS } from "../../../constants/design-tokens";
import { logger } from "../../../lib/logger";
import { locationService } from "../../../api/locationService";

function SelectionRow({ label, enabled, onPress, bordered = false }) {
  return (
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
}

export function ProvinceWardSelect({
  provinceCode,
  wardCode,
  onProvinceChange,
  onWardChange,
}) {
  const [provinces, setProvinces] = useState(null);
  const [wardData, setWardData] = useState({ provinceCode: null, wards: [] });
  const loadingProvinces = provinces === null;
  const loadingWards = Boolean(provinceCode) && wardData.provinceCode !== provinceCode;
  const provinceSheetRef = useRef(null);
  const wardSheetRef = useRef(null);

  useEffect(() => {
    let active = true;
    locationService.getAllProvinces()
      .then((data) => active && setProvinces(data))
      .catch((error) => {
        logger.warn(error);
        if (active) setProvinces([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!provinceCode) return undefined;
    locationService.getWardsByProvince(provinceCode)
      .then((data) => active && setWardData({ provinceCode, wards: data }))
      .catch((error) => {
        logger.warn(error);
        if (active) setWardData({ provinceCode, wards: [] });
      });
    return () => { active = false; };
  }, [provinceCode]);

  const provinceOptions = useMemo(
    () => (provinces || []).map((province) => ({ label: province.fullName || province.name, value: province.code })),
    [provinces],
  );
  const wardOptions = useMemo(
    () => (wardData.provinceCode === provinceCode ? wardData.wards : []).map((ward) => ({ label: ward.fullName || ward.name, value: ward.wardCode })),
    [provinceCode, wardData],
  );
  const provinceLabel = provinceOptions.find((item) => item.value === provinceCode)?.label || "Chọn Tỉnh/Thành phố";
  const wardLabel = wardOptions.find((item) => item.value === wardCode)?.label || "Chọn Phường/Xã/Đặc khu";

  const openProvinceSheet = () => provinceSheetRef.current?.present();
  const openWardSheet = () => wardSheetRef.current?.present();

  return (
    <View className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      <SelectionRow label={provinceLabel} enabled onPress={openProvinceSheet} bordered />
      <SelectionRow label={provinceCode ? wardLabel : "Chọn tỉnh trước"} enabled={Boolean(provinceCode)} onPress={openWardSheet} />
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
