import { Text as RNText } from "react-native";
import { styled } from "nativewind";

const StyledText = styled(RNText);

export const Text = ({ className, style, variant = "regular", ...props }) => {
  const getFontFamily = () => {
    switch (variant) {
      case "bold":
        return "font-bold";
      case "semibold":
        return "font-semibold";
      case "medium":
        return "font-medium";
      default:
        return "font-sans";
    }
  };

  return (
    <StyledText
      className={`${getFontFamily()} text-text ${className}`}
      style={style}
      {...props}
    />
  );
};
