import { TOKENS } from "../constants/design-tokens";

export const useFontLoader = () => {
  const activeFont = TOKENS.font.family;

  const getFontFamily = (fontType) => {
    return TOKENS.font[fontType] || TOKENS.font.body;
  };

  return {
    fontsLoaded: true,
    activeFont,
    getFontFamily,
    isAfacadActive: activeFont === "Afacad",
  };
};
