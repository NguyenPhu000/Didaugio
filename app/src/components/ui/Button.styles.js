/**
 * Button.styles.js — variant & size class strings + native-only shadow values.
 * Keep shadow as plain objects (not StyleSheet) since RN shadows require native props.
 */

/** Tailwind class strings per variant */
export const btnVariantCls = {
  primary: "bg-primary",
  secondary: "bg-white border-[1.5px] border-primary",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

export const btnTextVariantCls = {
  primary: "text-white",
  secondary: "text-primary",
  ghost: "text-primary",
  danger: "text-white",
};

/** Tailwind class strings per size */
export const btnSizeCls = {
  sm: "h-9 px-3.5",
  md: "h-12 px-5",
  lg: "h-14 px-6",
};

export const btnTextSizeCls = {
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-base",
};

/**
 * Native shadow for primary variant.
 * Tailwind cannot express shadowColor on React Native — must stay as plain style object.
 */
export const primaryShadow = {
  shadowColor: "#0077b8",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
};
