import React from "react";
import { View, StyleSheet } from "react-native";

const GradientBackground = ({ children, style, variant = "light" }) => {
  const backgrounds = {
    light: "#F7F9FB",
    warm: "#F4F6F8",
    ocean: "#F7F9FB",
    blue: "#EEF2F6",
  };

  const orbSets = {
    light: {
      a: "rgba(82,96,112,0.08)",
      b: "rgba(255,255,255,0.7)",
      c: "rgba(208,225,251,0.42)",
    },
    warm: {
      a: "rgba(16,30,44,0.08)",
      b: "rgba(255,255,255,0.72)",
      c: "rgba(236,238,240,0.7)",
    },
    ocean: {
      a: "rgba(16,30,44,0.1)",
      b: "rgba(255,255,255,0.75)",
      c: "rgba(208,225,251,0.46)",
    },
    blue: {
      a: "rgba(80,95,118,0.1)",
      b: "rgba(255,255,255,0.72)",
      c: "rgba(213,228,247,0.62)",
    },
  };

  const backgroundColor = backgrounds[variant] || backgrounds.light;
  const orb = orbSets[variant] || orbSets.light;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View pointerEvents="none" style={styles.ambientWrap}>
        <View style={[styles.orbA, { backgroundColor: orb.a }]} />
        <View style={[styles.orbB, { backgroundColor: orb.b }]} />
        <View style={[styles.orbC, { backgroundColor: orb.c }]} />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  orbA: {
    position: "absolute",
    top: -42,
    right: -64,
    width: 236,
    height: 236,
    borderRadius: 999,
  },
  orbB: {
    position: "absolute",
    top: 120,
    left: -84,
    width: 248,
    height: 248,
    borderRadius: 999,
  },
  orbC: {
    position: "absolute",
    bottom: 96,
    right: 48,
    width: 172,
    height: 172,
    borderRadius: 999,
  },
});

export default GradientBackground;
