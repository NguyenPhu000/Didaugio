import { TouchableOpacity, ActivityIndicator } from "react-native";
import { styled } from "nativewind";
import { Text } from "./Text";

const StyledTouchableOpacity = styled(TouchableOpacity);

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  className,
  textClassName,
  icon,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return "bg-secondary";
      case "outline":
        return "bg-transparent border border-primary";
      case "ghost":
        return "bg-transparent";
      case "danger":
        return "bg-error";
      default:
        return "bg-primary";
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return "py-2 px-3";
      case "large":
        return "py-4 px-6";
      default:
        return "py-3 px-5";
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "outline":
      case "ghost":
        return "text-primary";
      default:
        return "text-white";
    }
  };

  return (
    <StyledTouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-full flex-row items-center justify-center ${getVariantStyle()} ${getSizeStyle()} ${disabled ? "opacity-50" : ""} ${className}`}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#0077b8" : "white"} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={`font-semibold text-center ${getTextStyle()} ${textClassName}`}
          >
            {title}
          </Text>
        </>
      )}
    </StyledTouchableOpacity>
  );
};
