import { ActivityIndicator, View } from "react-native";
import { TOKENS } from "../../src/constants/design-tokens";
import MapScreen from "../../src/modules/map/MapScreen";

function MapSkeleton() {
  return (
    <View className="flex-1 bg-surface dark:bg-background-dark items-center justify-center">
      <ActivityIndicator size="large" color={TOKENS.color.primary[500]} />
    </View>
  );
}

export default function MapTab() {
  return <MapScreen />;
}
