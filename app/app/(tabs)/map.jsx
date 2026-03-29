import { Suspense, lazy } from "react";
import { ActivityIndicator, View } from "react-native";
import { TOKENS } from "../../src/constants/design-tokens";

const HeavyMapContent = lazy(() =>
  import("../../src/modules/map/MapScreen"),
);

function MapSkeleton() {
  return (
    <View className="flex-1 bg-surface dark:bg-background-dark items-center justify-center">
      <ActivityIndicator size="large" color={TOKENS.color.primary[500]} />
    </View>
  );
}

export default function MapTab() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <HeavyMapContent />
    </Suspense>
  );
}
