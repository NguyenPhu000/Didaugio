import { View } from "react-native";

/**
 * Primitive Box — semantic View wrapper.
 * Always use className for styling.
 */
export function Box({ className = "", style, children, ...props }) {
  return (
    <View className={className} style={style} {...props}>
      {children}
    </View>
  );
}
