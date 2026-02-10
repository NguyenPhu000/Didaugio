import { View } from "react-native";
import { MapComponent } from "../../src/modules/map/components/MapComponent";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapComponent />
    </View>
  );
}
