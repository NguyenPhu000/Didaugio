import { TOKENS } from "../../constants/design-tokens";

export const btnVariantCls = {
  primary: "bg-primary-600 border border-primary-600",
  secondary: "bg-white border border-primary-200",
  ghost: "bg-transparent border border-transparent",
  danger: "bg-danger border border-danger",
};

export const btnTextVariantCls = {
  primary: "text-white",
  secondary: "text-primary-700",
  ghost: "text-primary-700",
  danger: "text-white",
};

export const btnSizeCls = {
  sm: "h-10 px-4 rounded-2xl",
  md: "h-12 px-5 rounded-[20px]",
  lg: "h-14 px-6 rounded-[22px]",
};

export const btnTextSizeCls = {
  sm: "text-[13px]",
  md: "text-[14px]",
  lg: "text-[15px]",
};

export const primaryShadow = TOKENS.shadow.glow;
