import { View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AiPlannerScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-1 items-center justify-center">
        <Text variant="bold" className="text-2xl text-primary">
          AI Planner
        </Text>
        <Text className="text-gray-500 mt-2">Trip Planning with AI</Text>
      </View>
    </SafeAreaView>
  );
}
