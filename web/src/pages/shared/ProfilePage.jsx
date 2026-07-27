import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Save,
  Loader2,
  Camera,
  Shield,
  Bell,
  KeyRound,
  Activity,
  Lock,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Label,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Checkbox,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/apis/profileService";
import { ROLE_NAMES } from "@/constants/constants";
import { ChangePasswordModal } from "@/components/user/ChangePasswordModal";
import { profileSchema } from "@/schemas/user";
import { resolveMediaUrl } from "@/utils/mediaUrl";

// const profileSchema = z.object({...}) // Removed

const NOTIFICATION_GROUPS = [
  {
    title: "EMAIL",
    key: "email",
    toggles: [
      ["bookingConfirmed", "profile.notifications.bookingConfirmed"],
      ["bookingCancelled", "profile.notifications.bookingCancelled"],
      ["bookingPending", "profile.notifications.bookingPending"],
      ["newReview", "profile.notifications.newReview"],
      ["paymentReceived", "profile.notifications.paymentReceived"],
      ["systemAlerts", "profile.notifications.systemAlerts"],
    ],
  },
  {
    title: "PUSH",
    key: "push",
    toggles: [
      ["bookingConfirmed", "profile.notifications.bookingConfirmed"],
      ["bookingCancelled", "profile.notifications.bookingCancelled"],
      ["newReview", "profile.notifications.newReview"],
      ["systemAlerts", "profile.notifications.systemAlerts"],
    ],
  },
];

const DEFAULT_NOTIFICATIONS = {
  email: {
    bookingConfirmed: true,
    bookingCancelled: true,
    bookingPending: true,
    newReview: true,
    paymentReceived: true,
    systemAlerts: true,
  },
  push: {
    bookingConfirmed: true,
    bookingCancelled: true,
    newReview: false,
    systemAlerts: false,
  },
};

const ProfilePage = () => {
  const { t } = useTranslation();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIFICATIONS);
  const [notifSaving, setNotifSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getProfile();
        if (response.success) {
          setProfile(response.data);
          // Reset form với data từ server
          reset({
            fullName: response.data.profile?.fullName || "",
            phone: response.data.profile?.phone || "",
            dateOfBirth: response.data.profile?.dateOfBirth
              ? new Date(response.data.profile.dateOfBirth)
                  .toISOString()
                  .split("T")[0]
              : "",
            gender: response.data.profile?.gender || "",
            address: response.data.profile?.address || "",
            bio: response.data.profile?.bio || "",
          });
          // Load notification settings
          const stored = response.data.profile?.notificationSettings;
          if (stored && typeof stored === "object" && Object.keys(stored).length > 0) {
            setNotifSettings({
              email: { ...DEFAULT_NOTIFICATIONS.email, ...stored.email },
              push: { ...DEFAULT_NOTIFICATIONS.push, ...stored.push },
            });
          }
        }
      } catch {
        toast.error(t("profile.errors.loadFailed"));
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Lọc bỏ các field rỗng
      const updateData = {};
      Object.keys(data).forEach((key) => {
        if (data[key] && data[key] !== "") {
          updateData[key] = data[key];
        }
      });

      // Xử lý dateOfBirth
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth).toISOString();
      }

      const response = await profileService.updateProfile(updateData);

      if (response.success) {
        setProfile(response.data);
        setUser(response.data);
        toast.success(t("profile.success.updated"));
        reset(data); // Reset isDirty
      }
    } catch (error) {
      toast.error(error.message || t("profile.errors.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotifToggle = async (group, key, value) => {
    const previous = notifSettings;
    const updated = {
      ...previous,
      [group]: { ...previous[group], [key]: value },
    };
    setNotifSettings(updated);
    setNotifSaving(true);
    try {
      await profileService.updateNotificationSettings(updated);
      toast.success(t("profile.notificationSettings.saved"));
    } catch (err) {
      toast.error(err.message || t("profile.notificationSettings.saveFailed"));
      setNotifSettings(previous);
    } finally {
      setNotifSaving(false);
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  const avatarSrc = resolveMediaUrl(
    profile?.profile?.avatar || profile?.avatar,
  );

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-[#F3E600] rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
          {t("profile.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1400px] mx-auto">
        {/* Header - T.I.M Style */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">PROFILE SETTINGS</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // USER PROFILE
                </span>
                <p className="tim-meta">{t("profile.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white border-2 border-black p-3">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          {/* Tactical Tabs */}
          <TabsList className="bg-white border-2 border-black p-1 rounded-none h-auto">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10"
            >
              <User className="h-4 w-4" />
              {t("profile.tabs.info")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10"
            >
              <Shield className="h-4 w-4" />
              {t("profile.tabs.security")}
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10"
            >
              <Bell className="h-4 w-4" />
              {t("profile.tabs.notifications")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section - T.I.M Style */}
            <div className="bg-white border-2 border-black p-6 shadow-sm">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="h-32 w-32 border-4 border-black bg-gray-900 overflow-hidden relative group">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-black text-[#F3E600] text-4xl font-black font-mono">
                        {getInitials(
                          profile?.profile?.fullName,
                          profile?.email,
                        )}
                      </div>
                    )}
                    {/* Accent corner */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#F3E600] border-t-2 border-l-2 border-black"></div>
                  </div>
                  <button
                    className="absolute -bottom-2 -right-2 p-2 bg-black border-2 border-white text-[#F3E600] hover:bg-[#F3E600] hover:text-black transition-all"
                    onClick={() => toast(t("common.featureInDevelopment"))}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
                    {profile?.profile?.fullName || profile?.email}
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="font-mono text-sm text-gray-600">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#F3E600] border-2 border-black px-3 py-1">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-black uppercase font-mono">
                      {ROLE_NAMES[profile?.roleId] || "USER"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form - T.I.M Style */}
            <div className="bg-white border-2 border-black shadow-sm">
              <div className="bg-black text-white p-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-[#F3E600]"></div>
                  <div>
                    <h3 className="tim-meta text-white mb-1">
                      BASIC INFORMATION
                    </h3>
                    <p className="text-xs text-gray-400 uppercase font-mono">
                      {t("profile.form.basicInfoDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <User className="h-4 w-4" />
                        {t("profile.fields.fullName")}
                      </Label>
                      <Input
                        id="fullName"
                        placeholder={t("profile.placeholders.fullName")}
                        className="rounded-none border-2 border-black h-11 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                        {...register("fullName")}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-600 font-mono uppercase">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* Email (readonly) */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <Mail className="h-4 w-4" />
                        EMAIL
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          value={profile?.email || ""}
                          disabled
                          className="rounded-none border-2 border-gray-300 h-11 font-mono text-sm bg-gray-100 text-gray-600"
                        />
                        <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 uppercase font-mono">
                        {t("profile.emailCannotChange")}
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <Phone className="h-4 w-4" />
                        {t("profile.fields.phone")}
                      </Label>
                      <Input
                        id="phone"
                        placeholder="0123 456 789"
                        className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-600 font-mono uppercase">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="dateOfBirth"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <Calendar className="h-4 w-4" />
                        {t("profile.fields.birthday")}
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                        {...register("dateOfBirth")}
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="tim-meta">
                        {t("profile.fields.gender")}
                      </Label>
                      <select
                        id="gender"
                        className="flex h-11 w-full rounded-none border-2 border-black bg-white px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:border-[#F3E600] disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("gender")}
                      >
                        <option value="">{t("profile.placeholders.selectGender")}</option>
                        <option value="male">{t("profile.gender.male")}</option>
                        <option value="female">{t("profile.gender.female")}</option>
                        <option value="other">{t("profile.gender.other")}</option>
                      </select>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="address"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <MapPin className="h-4 w-4" />
                        {t("profile.fields.address")}
                      </Label>
                      <Input
                        id="address"
                        placeholder={t("profile.placeholders.address")}
                        className="rounded-none border-2 border-black h-11 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                        {...register("address")}
                      />
                      {errors.address && (
                        <p className="text-xs text-red-600 font-mono uppercase">
                          {errors.address.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="bio"
                      className="flex items-center gap-2 tim-meta"
                    >
                      <FileText className="h-4 w-4" />
                      {t("profile.fields.bio")}
                    </Label>
                    <textarea
                      id="bio"
                      rows={4}
                      className="flex w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-mono uppercase placeholder:text-gray-400 focus:outline-none focus:border-[#F3E600] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder={t("profile.placeholders.bio")}
                      {...register("bio")}
                    />
                    {errors.bio && (
                      <p className="text-xs text-red-600 font-mono uppercase">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 border-t-2 border-black pt-6 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => reset()}
                      disabled={!isDirty}
                      className="rounded-none border-2 border-black h-11 px-6 hover:bg-gray-100 uppercase font-black text-xs"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={!isDirty}
                      className="rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-11 px-8 uppercase font-black text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {t("profile.form.saveChanges")}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab - T.I.M Style */}
          <TabsContent value="security" className="space-y-6">
            {/* Change Password Section */}
            <div className="bg-white border-2 border-black shadow-sm">
              <div className="bg-black text-white p-4 border-b-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-[#F3E600]"></div>
                  <div>
                    <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      {t("profile.security.changePassword")}
                    </h3>
                    <p className="text-xs text-gray-400 uppercase font-mono">
                      {t("profile.security.changePasswordDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-yellow-50 border-2 border-[#F3E600]">
                  <AlertCircle className="h-6 w-6 text-black mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase mb-2">
                      {t("profile.security.accountSecurity")}
                    </p>
                    <p className="text-xs text-gray-600 uppercase font-mono leading-relaxed">
                      {t("profile.security.passwordTips")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setChangePasswordOpen(true)}
                  className="rounded-none border-2 border-black bg-black text-[#F3E600] hover:bg-[#F3E600] hover:text-black h-11 px-8 uppercase font-black text-xs transition-all"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t("profile.security.changePasswordBtn")}
                </Button>
              </div>
            </div>

            {/* Login Sessions Section */}
            <div className="bg-white border-2 border-black shadow-sm">
              <div className="bg-black text-white p-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-[#F3E600]"></div>
                  <div>
                    <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {t("profile.security.loginSessions")}
                    </h3>
                    <p className="text-xs text-gray-400 uppercase font-mono">
                      {t("profile.security.loginSessionsDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Button
                  variant="outline"
                  onClick={() => toast(t("common.featureInDevelopment"))}
                  className="rounded-none border-2 border-black h-11 px-6 hover:bg-gray-100 uppercase font-black text-xs"
                >
                  {t("profile.security.viewAllSessions")}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white border-2 border-black shadow-sm">
              <div className="bg-black text-white p-4 border-b-2 border-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-[#F3E600]"></div>
                    <div>
                      <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        {t("profile.notificationSettings.title")}
                      </h3>
                      <p className="text-xs text-gray-400 uppercase font-mono">
                        {t("profile.notificationSettings.desc")}
                      </p>
                    </div>
                  </div>
                  {notifSaving && (
                    <Loader2 className="h-4 w-4 text-[#F3E600] animate-spin" />
                  )}
                </div>
              </div>
              <div className="p-6 space-y-6">
                {NOTIFICATION_GROUPS.map((group) => (
                  <div key={group.key}>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-3 text-gray-600">
                      {group.title}
                    </h4>
                    <div className="space-y-2">
                      {group.toggles.map(([key, labelKey]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between border border-black px-3 py-2"
                        >
                          <span className="font-mono text-[11px] uppercase">
                            {t(labelKey)}
                          </span>
                          <Checkbox
                            checked={!!notifSettings[group.key]?.[key]}
                            onCheckedChange={(c) =>
                              handleNotifToggle(group.key, key, c === true)
                            }
                            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};

export default ProfilePage;
