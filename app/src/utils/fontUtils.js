import { Platform } from "react-native";
import { TOKENS } from "../constants/design-tokens";

export const checkFontAvailability = async (fontName) => {
  try {
    return !!fontName;
  } catch (error) {
    console.warn(`Font ${fontName} not available:`, error);
    return false;
  }
};

export const getBestFontForVietnamese = (fontType = "body") => {
  return TOKENS.getFont(fontType);
};

export const getSafeFontFamily = (preferredFont, fallbackFont) => {
  if (Platform.OS === "ios") {
    return preferredFont || fallbackFont || "System";
  }

  return preferredFont || fallbackFont || "Roboto";
};
