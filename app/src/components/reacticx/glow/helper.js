import { isValidElement } from "react";
import { StyleSheet } from "react-native";

const getBorderRadius = (children) => {
  if (!isValidElement(children)) return undefined;

  const child = children;
  const style = child.props?.style;

  if (!style) return undefined;

  if (Array.isArray(style)) {
    for (const s of style) {
      const flattened = StyleSheet.flatten(s);
      if (flattened?.borderRadius !== undefined) {
        return flattened.borderRadius;
      }
    }
  } else {
    const flattened = StyleSheet.flatten(style);
    if (flattened?.borderRadius !== undefined) {
      return flattened.borderRadius;
    }
  }

  return undefined;
};

export { getBorderRadius };
