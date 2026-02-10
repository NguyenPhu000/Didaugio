import { View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 items-center justify-center">
        <Text variant="bold" className="text-2xl text-error">
          Đã lưu
        </Text>
        <Text className="text-gray-500 mt-2">Saved Places</Text>
      </View>
    </SafeAreaView>
  );
}
