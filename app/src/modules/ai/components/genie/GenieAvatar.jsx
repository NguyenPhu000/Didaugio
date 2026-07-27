import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Glow } from "../../../../components/reacticx/glow";

export function GenieAvatar({ size = 40 }) {
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full bg-transparent"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        boxShadow: "0 6px 16px rgba(14, 165, 233, 0.16)",
      }}
    >
      <Image
        source={require("../../../../../assets/technical-support.png")}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        contentFit="cover"
        transition={120}
      />
    </View>
  );
}
