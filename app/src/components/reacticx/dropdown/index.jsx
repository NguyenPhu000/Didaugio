import React, {
  useState,
  createContext,
  useContext,
  useRef,
  Children,
  useCallback,
} from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { SCREEN_WIDTH, SCREEN_HEIGHT, SPACING } from "./const";
import { scheduleOnRN } from "react-native-worklets";

const DropdownContext = createContext(undefined);

const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context)
    throw new Error("Dropdown components must be used within a Dropdown");
  return context;
};

const Dropdown = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState(null);
  const flipAnim = useSharedValue(0);
  const activeItemIndex = useSharedValue(-1);

  const open = () => {
    setVisible(true);
    flipAnim.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  };

  const close = () => {
    flipAnim.value = withTiming(0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.6, 1),
    });
    activeItemIndex.value = -1;
    setTimeout(() => setVisible(false), 200);
  };

  return (
    <DropdownContext.Provider
      value={{
        visible,
        open,
        close,
        triggerLayout,
        setTriggerLayout,
        flipAnim,
        activeItemIndex,
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
};

const Trigger = ({ children, style }) => {
  const { open, setTriggerLayout } = useDropdownContext();
  const triggerRef = useRef(null);

  const handlePress = () => {
    triggerRef.current?.measure(
      (_x, _y, width, height, pageX, pageY) => {
        setTriggerLayout({ x: pageX, y: pageY, width, height });
        open();
      },
    );
  };

  return (
    <TouchableOpacity
      ref={triggerRef}
      onPress={handlePress}
      style={style}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

const Content = ({
  children,
  style,
  position = "auto",
}) => {
  const { visible, close, triggerLayout, flipAnim, activeItemIndex } =
    useDropdownContext();
  const itemCount = Children.count(children);
  const lastHapticIndex = useSharedValue(-1);
  const contentRef = useRef(null);
  const [contentDimensions, setContentDimensions] = useState(null);

  const triggerHaptic = useCallback(
    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    [],
  );

  const calculatePosition = useCallback(() => {
    if (!triggerLayout || !contentDimensions) return { top: 0, left: 0 };

    const { x, y, width, height } = triggerLayout;
    const { width: contentWidth, height: contentHeight } = contentDimensions;

    let top = y + height + SPACING;
    let left = x;

    if (position === "auto") {
      const spaceBelow = SCREEN_HEIGHT - (y + height);
      const spaceAbove = y;

      if (spaceBelow >= contentHeight + SPACING) {
        top = y + height + SPACING;
      } else if (spaceAbove >= contentHeight + SPACING) {
        top = y - contentHeight - SPACING;
      } else {
        top =
          spaceBelow > spaceAbove
            ? y + height + SPACING
            : Math.max(SPACING, y - contentHeight - SPACING);
      }

      if (x + contentWidth > SCREEN_WIDTH - SPACING) {
        left = Math.max(SPACING, x + width - contentWidth);
      }

      if (left < SPACING) left = SPACING;

      if (left + contentWidth > SCREEN_WIDTH - SPACING) {
        left = SCREEN_WIDTH - contentWidth - SPACING;
      }
    } else if (position === "top") {
      top = y - contentHeight - SPACING;
    } else if (position === "bottom") {
      top = y + height + SPACING;
    } else if (position === "left") {
      left = x - contentWidth - SPACING;
      top = y;
    } else if (position === "right") {
      left = x + width + SPACING;
      top = y;
    }

    top = Math.max(
      SPACING,
      Math.min(top, SCREEN_HEIGHT - contentHeight - SPACING),
    );
    left = Math.max(
      SPACING,
      Math.min(left, SCREEN_WIDTH - contentWidth - SPACING),
    );

    return { top, left };
  }, [triggerLayout, contentDimensions, position]);

  const { top, left } = calculatePosition();

  const calculateActiveIndex = useCallback(
    (y) => {
      "worklet";
      const ITEM_HEIGHT = 44;
      const CONTAINER_PADDING = 8;
      const relativeY = y - CONTAINER_PADDING;
      const index = Math.floor(relativeY / ITEM_HEIGHT);
      if (index < 0) return 0;
      if (index >= itemCount) return itemCount - 1;
      return index;
    },
    [itemCount],
  );

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      "worklet";
      const index = calculateActiveIndex(event.y);
      activeItemIndex.value = index;
      lastHapticIndex.value = index;
      scheduleOnRN(triggerHaptic);
    })
    .onUpdate((event) => {
      "worklet";
      const index = calculateActiveIndex(event.y);
      if (index !== activeItemIndex.value) {
        activeItemIndex.value = index;
        if (index !== lastHapticIndex.value) {
          lastHapticIndex.value = index;
          scheduleOnRN(triggerHaptic);
        }
      }
    })
    .onEnd(() => {
      "worklet";
      activeItemIndex.value = -1;
      lastHapticIndex.value = -1;
    })
    .onFinalize(() => {
      "worklet";
      activeItemIndex.value = -1;
      lastHapticIndex.value = -1;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const progress = flipAnim.value;

    return {
      opacity: interpolate(progress, [0, 0.5, 1], [0, 0.5, 1]),
      transform: [
        { perspective: 900 },
        {
          scale: interpolate(progress, [0, 1], [0.9, 1]),
        },
      ],
      transformOrigin: "top center",
    };
  });

  if (!visible || !triggerLayout) return null;

  const childrenWithIndex = Children.map(children, (child, index) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { ...child.props, index })
      : child,
  );

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={close}
      animationType="none"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={close}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            ref={contentRef}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setContentDimensions({ width, height });
            }}
            style={[
              styles.content,
              style,
              {
                top: contentDimensions
                  ? top
                  : triggerLayout.y + triggerLayout.height + SPACING,
                left: contentDimensions ? left : triggerLayout.x,
                minWidth: triggerLayout.width,
              },
              animatedStyle,
            ]}
          >
            {childrenWithIndex}
          </Animated.View>
        </GestureDetector>
      </TouchableOpacity>
    </Modal>
  );
};

const Item = ({
  children,
  onPress,
  style,
  index = 0,
}) => {
  const { close, activeItemIndex } = useDropdownContext();

  const handlePress = () => {
    onPress?.();
    close();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeItemIndex.value === index;
    const SCALE_UP = 1.02;

    return {
      transform: [
        {
          scale: withTiming(isActive ? SCALE_UP : 1, {
            duration: 120,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
      zIndex: isActive ? 100 : 1,
      backgroundColor: withTiming(isActive ? "#f3f4f6" : "transparent", {
        duration: 120,
      }),
    };
  });

  const tap = Gesture.Tap().onEnd(() => scheduleOnRN(handlePress));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.item, style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Item = Item;

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  content: {
    position: "absolute",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});

export default Dropdown;
