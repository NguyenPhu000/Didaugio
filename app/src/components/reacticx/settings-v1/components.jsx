import React, { createContext, useMemo } from "react";
import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { COLOR_SCHEME } from "./const";

const SettingsGroupContext = createContext({
  hasIcon: false,
});

function groupHasIcon(children) {
  let hasIconfound = false;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props;
    if (props?.children) {
      React.Children.forEach(props.children, (inner) => {
        if (React.isValidElement(inner) && inner.type === SettingsIcon) {
          hasIconfound = true;
        }
      });
    }
  });
  return hasIconfound;
}

function SettingsRoot({ children, style }) {
  return <View style={[styles.root, style]}>{children}</View>;
}

function SettingsSection({ children, style }) {
  return <View style={[styles.section, style]}>{children}</View>;
}

function SettingsGroup({ children, style }) {
  const hasIcon = useMemo(() => groupHasIcon(children), [children]);

  const items = React.Children.toArray(children).filter(React.isValidElement);
  const withSeparators = [];

  items.forEach((child, index) => {
    withSeparators.push(
      React.cloneElement(child, { key: `item-${index}` }),
    );
    if (index < items.length - 1) {
      withSeparators.push(
        <SettingsSeparator key={`sep-${index}`} inset={hasIcon ? 54 : 16} />,
      );
    }
  });

  return (
    <SettingsGroupContext.Provider value={{ hasIcon }}>
      <View style={[styles.group, style]}>{withSeparators}</View>
    </SettingsGroupContext.Provider>
  );
}

function SettingsLabel({ children }) {
  return <Text style={styles.label}>{children.toUpperCase()}</Text>;
}

function SettingsFooter({ children }) {
  return <Text style={styles.footer}>{children}</Text>;
}

function SettingsItem({
  children,
  onPress,
  disabled,
  style,
}) {
  const content = <View style={[styles.itemRow, style]}>{children}</View>;

  if (!onPress || disabled) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.itemPressed]}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
    >
      {content}
    </Pressable>
  );
}

function SettingsIcon({
  icon,
  color = "#8E8E93",
  size = 29,
  borderRadius = 6,
}) {
  return (
    <View
      style={[
        styles.iconBadge,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      {icon}
    </View>
  );
}

function SettingsContent({ children, style }) {
  return <View style={[styles.content, style]}>{children}</View>;
}

function SettingsTitle({ children, style }) {
  return (
    <Text style={[styles.title, style]} numberOfLines={1}>
      {children}
    </Text>
  );
}

function SettingsValue({ children }) {
  return <Text style={styles.valueText}>{children}</Text>;
}

function SettingsSwitch({
  value,
  onValueChange,
  disabled,
}) {
  return (
    <View style={{ transform: [{ scale: 0.85 }] }}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#39393D", true: "#34C759" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#39393D"
      />
    </View>
  );
}

function SettingsLargeItem({ children, onPress, style }) {
  const content = <View style={[styles.largeItemRow, style]}>{children}</View>;

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.itemPressed]}
    >
      {content}
    </Pressable>
  );
}

function SettingsAvatar({ source, size = 64 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: "#2C2C2E",
      }}
    >
      <Image
        source={source}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    </View>
  );
}

function SettingsSubtitle({ children }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

function SettingsAvatarStack({ children }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {React.Children.map(children, (child, index) => (
        <View
          style={{
            marginLeft: index === 0 ? 0 : -12,
            borderWidth: 2,
            borderColor: COLOR_SCHEME.CARD_ELEVATED,
            borderRadius: 20,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

function SettingsChevron({
  color = "#48484A",
  size = 14,
}) {
  return (
    <View style={styles.chevronContainer}>
      <View
        style={[
          styles.chevron,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

function SettingsSeparator({ inset = 16 }) {
  return (
    <View style={[styles.separatorContainer, { paddingLeft: inset }]}>
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: 28,
  },

  section: {
    width: "100%",
  },

  group: {
    backgroundColor: COLOR_SCHEME.CARD_ELEVATED,
    borderRadius: 12,
    overflow: "hidden",
  },

  label: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
    color: "#8E8E93",
    marginBottom: 8,
    paddingHorizontal: 14,
  },

  footer: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    color: "#8E8E93",
    marginTop: 8,
    paddingHorizontal: 14,
    maxWidth: "95%",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 48,
    gap: 12,
  },

  itemPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  iconBadge: {
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: 17,
    fontWeight: "400",
    color: "#FFFFFF",
  },

  valueText: {
    fontSize: 17,
    color: "#8E8E93",
    marginRight: 4,
  },

  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 12,
  },

  chevron: {
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "-45deg" }],
  },

  separatorContainer: {
    paddingLeft: 16,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#38383A",
  },

  largeItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },

  subtitle: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 2,
  },
});

export {
  SettingsRoot as Root,
  SettingsGroup as Group,
  SettingsSection as Section,
  SettingsLabel as Label,
  SettingsFooter as Footer,
  SettingsItem as Item,
  SettingsIcon as Icon,
  SettingsContent as Content,
  SettingsTitle as Title,
  SettingsValue as Value,
  SettingsSwitch as Switch,
  SettingsChevron as Chevron,
  SettingsSeparator as Separator,
  SettingsLargeItem as LargeItem,
  SettingsAvatar as Avatar,
  SettingsSubtitle as Subtitle,
  SettingsAvatarStack as AvatarStack,
};
