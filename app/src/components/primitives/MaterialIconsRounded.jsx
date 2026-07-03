import { createIconSet } from "@expo/vector-icons";
import glyphMap from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json";

/**
 * Material Icons Rounded — Rounded variant of Google's Material Icons.
 * Uses the same icon names and codepoints as MaterialIcons, but with rounded rendering.
 * Created using createIconSet from @expo/vector-icons.
 */
const MaterialIconsRounded = createIconSet(
  glyphMap,
  "Material Icons Round",
  require("../../../assets/fonts/MaterialIconsRound-Regular.otf")
);

export { MaterialIconsRounded };
export default MaterialIconsRounded;
