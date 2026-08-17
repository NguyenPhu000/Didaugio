// MAP: AppIndexRoot
// ├── UI: expo-router Redirect -> /(tabs)/map
// └── API: expo-router

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/map" />;
}
