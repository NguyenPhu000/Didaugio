/**
 * BOUNDARY SERVICE
 * Xử lý logic liên quan đến ranh giới địa lý (GeoJSON, Centroids)
 */

import prisma from "../config/prismaClient.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// GEOJSON SERVICES
// =============================================================================

/**
 * Lấy GeoJSON Districts
 */
export const getDistrictsGeoJSON = async () => {
  const filePath = path.join(__dirname, "../../../data/cantho_districts.geojson");
  
  if (!fs.existsSync(filePath)) {
    throw new Error("Districts GeoJSON file not found");
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

/**
 * Lấy GeoJSON Wards
 */
export const getWardsGeoJSON = async () => {
  const filePath = path.join(__dirname, "../../../data/cantho_wards.geojson");
  
  if (!fs.existsSync(filePath)) {
    throw new Error("Wards GeoJSON file not found");
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

/**
 * Lấy MapLibre Style JSON
 */
export const getStyleJSON = async () => {
  const filePath = path.join(__dirname, "../../public/maps/cantho_style.json");
  
  if (!fs.existsSync(filePath)) {
    throw new Error("Style JSON file not found");
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

// =============================================================================
// CENTROID SERVICES
// =============================================================================

/**
 * Lấy centroid của District theo code
 */
export const getDistrictCentroid = async (code) => {
  const district = await prisma.districtCantho.findUnique({
    where: { code },
    select: {
      id: true,
      name: true,
      code: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!district) {
    throw new Error("District not found");
  }

  if (!district.latitude || !district.longitude) {
    throw new Error("District does not have centroid coordinates");
  }

  return {
    id: district.id,
    name: district.name,
    code: district.code,
    latitude: parseFloat(district.latitude),
    longitude: parseFloat(district.longitude),
  };
};

/**
 * Lấy centroid của Ward theo ID
 */
export const getWardCentroid = async (id) => {
  const ward = await prisma.wardCantho.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      wardType: true,
      latitude: true,
      longitude: true,
      district: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  if (!ward) {
    throw new Error("Ward not found");
  }

  // Logic: Nếu ward chưa có lat/lng, fallback về district
  const latitude =
    ward.latitude && parseFloat(ward.latitude) !== 0
      ? parseFloat(ward.latitude)
      : parseFloat(ward.district.latitude);

  const longitude =
    ward.longitude && parseFloat(ward.longitude) !== 0
      ? parseFloat(ward.longitude)
      : parseFloat(ward.district.longitude);

  return {
    id: ward.id,
    name: ward.name,
    code: ward.code,
    districtId: ward.district.id,
    districtName: ward.district.name,
    wardType: ward.wardType,
    latitude,
    longitude,
  };
};

export default {
  getDistrictsGeoJSON,
  getWardsGeoJSON,
  getStyleJSON,
  getDistrictCentroid,
  getWardCentroid,
};
