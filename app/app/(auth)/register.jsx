import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRegister } from "../../src/modules/auth/hooks/useRegister";

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoComplete,
  autoCapitalize = "none",
  secureTextEntry = false,
  showToggle = false,
  isVisible = false,
  onToggleVisibility,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, focused && styles.fieldBoxFocused]}>
        <Feather
          name={icon}
          size={18}
          color={focused ? "#0369A1" : "#94A3B8"}
        />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={styles.fieldInput}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {showToggle ? (
          <Pressable onPress={onToggleVisibility} hitSlop={10}>
            <Feather
              name={isVisible ? "eye-off" : "eye"}
              size={18}
              color={focused ? "#0369A1" : "#94A3B8"}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, isLoading, error, successMessage } = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleRegister = () => {
    register({ fullName, email, password, confirmPassword });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Image
        source={require("../../assets/sky.jpg")}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <View style={styles.backdrop} />

      <View style={[styles.topBar, { top: insets.top + 16 }]}>
        <View style={styles.brandRow}>
          <MaterialIcons name="travel-explore" size={22} color="#fff" />
          <Text style={styles.brandText}>Đi Đâu Giờ</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}> 
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Tham gia cùng chúng tôi để bắt đầu hành trình của bạn.
            </Text>

            <Field
              label="Họ và tên"
              icon="user"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <Field
              label="Email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              inputRef={emailRef}
            />

            <Field
              label="Mật khẩu"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              placeholder="••••••••"
              showToggle
              isVisible={showPassword}
              onToggleVisibility={() => setShowPassword((v) => !v)}
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              inputRef={passwordRef}
            />

            <Field
              label="Xác nhận mật khẩu"
              icon="check-circle"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              placeholder="••••••••"
              showToggle
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              inputRef={confirmPasswordRef}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={[styles.errorBox, { borderColor: "#6EE7B7", backgroundColor: "#ECFDF5" }]}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.errorText, { color: "#047857" }]}>{successMessage}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Đăng ký tài khoản</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Đã có tài khoản?</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={10}>
                  <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#020617" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.35)",
  },
  topBar: {
    position: "absolute",
    zIndex: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  scrollContent: { flexGrow: 1, justifyContent: "flex-end" },
  card: {
    marginTop: 150,
    backgroundColor: "#fff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 28,
    paddingHorizontal: 22,
  },
  title: { fontSize: 30, fontWeight: "800", color: "#0F172A" },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    marginLeft: 4,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  fieldBox: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  fieldBoxFocused: {
    borderColor: "#0284C7",
    backgroundColor: "#fff",
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
    paddingVertical: 12,
  },
  errorBox: {
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { flex: 1, color: "#B91C1C", fontSize: 12.5, fontWeight: "600" },
  primaryButton: {
    marginTop: 6,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#0369A1",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  buttonDisabled: { opacity: 0.7 },
  footerRow: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  footerLink: { color: "#0369A1", fontSize: 14, fontWeight: "800" },
});
