import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Glow } from "../../../../components/reacticx/glow";

export function GenieAvatar({ size = 40 }) {
  return (
    <Glow
      size={Math.max(2, size * 0.08)}
      radius={size / 2}
      color="#2563EB"
      secondaryColor="#DB2777"
      intensity={0.72}
      style="breathe"
      speed={0.72}
    >
      <View
        className="items-center justify-center rounded-full bg-white"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          boxShadow: "0 12px 30px rgba(14, 165, 233, 0.22)",
        }}
      >
        <LinearGradient
          colors={["#2563EB", "#7C3AED", "#DB2777"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            padding: Math.max(2, size * 0.07),
          }}
        >
          <View
            className="items-center justify-center overflow-hidden rounded-full bg-white"
            style={{
              width: size * 0.86,
              height: size * 0.86,
              borderRadius: (size * 0.86) / 2,
            }}
          >
            <Image
              source={require("../../../../../assets/technical-support.png")}
              style={{
                width: size * 0.82,
                height: size * 0.82,
                borderRadius: (size * 0.82) / 2,
              }}
              contentFit="contain"
              transition={120}
            />
          </View>
        </LinearGradient>
      </View>
    </Glow>
  );
}
