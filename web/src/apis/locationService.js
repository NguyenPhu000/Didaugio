import {
  getProvinces,
  getWards,
  searchLocations,
} from "@/modules/location/locationApi";

export const locationService = {
  getAllProvinces: async () => (await getProvinces()).data,
  getWardsByProvince: async (provinceCode) => (await getWards(provinceCode)).data,
  search: async (provinceCode, query) =>
    (await searchLocations({ provinceCode, query })).data,
};
