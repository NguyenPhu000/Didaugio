import { Pressable, Text, View } from "react-native";

export function ResourcePicker({ resources = [], selectedResourceId, onSelect, theme, title, emptyLabel }) {
  if (resources.length === 0) {
    return (
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
        {emptyLabel}
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {resources.map((resource) => {
          const selected = Number(selectedResourceId) === Number(resource.id);
          return (
            <Pressable
              key={resource.id}
              onPress={() => onSelect(resource.id)}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? theme.neon : theme.glassBorder,
                backgroundColor: selected ? theme.neonGlow : theme.glass,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minWidth: 120,
              }}
            >
              <Text style={{ color: selected ? theme.neon : theme.text, fontSize: 13, fontWeight: "700" }}>
                {resource.name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                {[resource.code, resource.capacity ? `${resource.capacity}` : null].filter(Boolean).join(" • ")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
