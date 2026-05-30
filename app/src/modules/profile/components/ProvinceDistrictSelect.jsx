import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
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
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const provinceSheetRef = useRef(null);
  const districtSheetRef = useRef(null);

  useEffect(() => {
    setIsLoadingProvinces(true);
    locationService
      .getAllProvinces()
      .then((data) => setProvinces(data))
      .catch((err) => console.log(err))
      .finally(() => setIsLoadingProvinces(false));
  }, []);

  useEffect(() => {
    if (provinceCode) {
      setIsLoadingDistricts(true);
      locationService
        .getWardsByProvince(provinceCode)
        .then((data) => setDistricts(data))
        .catch((err) => console.log(err))
        .finally(() => setIsLoadingDistricts(false));
    } else {
      setDistricts([]);
      setIsLoadingDistricts(false);
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
    <View
      className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl overflow-hidden"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.015,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* Chọn Tỉnh/Thành */}
      <Pressable
        className="flex-row items-center min-h-[52px] px-4 border-b border-[#F1F5F9] active:bg-[#F8FAFC]"
        onPress={() => provinceSheetRef.current?.present()}
      >
        <MaterialIcons name="location-city" size={18} color="#64748B" style={{ marginRight: 10 }} />
        <Text
          style={{ fontFamily: TOKENS.font.body }}
          className={`text-[14.5px] flex-1 ${provinceCode ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
        >
          {selectedProvinceLabel}
        </Text>
        <MaterialIcons name="keyboard-arrow-right" size={20} color="#94A3B8" />
      </Pressable>

      {/* Chọn Quận/Huyện */}
      <Pressable
        className={`flex-row items-center min-h-[52px] px-4 ${provinceCode ? "active:bg-[#F8FAFC]" : ""}`}
        onPress={() => {
          if (!provinceCode) return;
          districtSheetRef.current?.present();
        }}
      >
        <MaterialIcons
          name="location-city"
          size={18}
          color={provinceCode ? "#64748B" : "#CBD5E1"}
          style={{ marginRight: 10 }}
        />
        <Text
          style={{ fontFamily: TOKENS.font.body }}
          className={`text-[14.5px] flex-1 ${
            districtCode && provinceCode ? "text-[#1E293B]" : "text-[#94A3B8]"
          }`}
        >
          {provinceCode ? selectedDistrictLabel : "Chọn Quận / Huyện / Phường / Xã"}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-right"
          size={20}
          color={provinceCode ? "#94A3B8" : "#E2E8F0"}
        />
      </Pressable>

      {/* Sheets chọn */}
      <BottomSheetPicker
        ref={provinceSheetRef}
        title="Tỉnh / Thành Phố"
        data={provinceOptions}
        selectedValue={provinceCode}
        snapPoints={["60%", "90%"]}
        isLoading={isLoadingProvinces}
        onSelect={(val) => {
          onProvinceChange(val);
          onDistrictChange("");
        }}
      />

      <BottomSheetPicker
        ref={districtSheetRef}
        title="Quận / Huyện"
        data={districtOptions}
        selectedValue={districtCode}
        snapPoints={["60%", "90%"]}
        isLoading={isLoadingDistricts}
        onSelect={(val) => onDistrictChange(val)}
      />
    </View>
  );
}
