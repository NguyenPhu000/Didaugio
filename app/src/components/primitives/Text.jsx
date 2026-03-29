import { Text as RNText } from "react-native";

export function Text({ className = "", style, children, ...props }) {
  return (
    <RNText
      className={`font-sans text-ink tracking-[0.2px] ${className}`}
      style={style}
      {...props}
    >
      {children}
    </RNText>
  );
}
