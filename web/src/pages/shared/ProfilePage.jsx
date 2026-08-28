// MAP: ProfilePage
// ├── UI: @/components/profile/{ProfileAvatarCard, ProfileBasicInfoForm, ProfileSecurityTab, ProfileNotificationsTab}
// └── API: @/apis/userService, @/apis/authApi

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  User,
  Shield,
  Bell,
  Activity,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/apis/profileService";
import { ChangePasswordModal } from "@/components/user/ChangePasswordModal";
import { profileSchema } from "@/schemas/user";

// Extracted Sub-Components
import { DEFAULT_NOTIFICATIONS } from "@/components/profile/profileConstants";
import ProfileAvatarCard from "@/components/profile/ProfileAvatarCard";
import ProfileBasicInfoForm from "@/components/profile/ProfileBasicInfoForm";
import ProfileSecurityTab from "@/components/profile/ProfileSecurityTab";
import ProfileNotificationsTab from "@/components/profile/ProfileNotificationsTab";

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
          const stored = response.data.profile?.notificationSettings;
          if (
            stored &&
            typeof stored === "object" &&
            Object.keys(stored).length > 0
          ) {
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
  }, [reset, t]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const updateData = {};
      Object.keys(data).forEach((key) => {
        if (data[key] && data[key] !== "") {
          updateData[key] = data[key];
        }
      });

      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth).toISOString();
      }

      const response = await profileService.updateProfile(updateData);

      if (response.success) {
        setProfile(response.data);
        setUser(response.data);
        toast.success(t("profile.success.updated"));
        reset(data);
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

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          {t("profile.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hồ sơ & Thiết lập Cá nhân
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Cài đặt Tài khoản
          </h1>
          <p className="text-xs text-slate-500 font-medium">{t("profile.subtitle")}</p>
        </div>
      </header>

      <Tabs defaultValue="profile" className="space-y-6">
        {/* Tabs */}
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-wrap sm:flex-nowrap border border-slate-200/80">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-semibold text-xs px-5 h-9 cursor-pointer transition-all text-slate-600"
          >
            <User className="h-4 w-4" />
            {t("profile.tabs.info")}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-semibold text-xs px-5 h-9 cursor-pointer transition-all text-slate-600"
          >
            <Shield className="h-4 w-4" />
            {t("profile.tabs.security")}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-semibold text-xs px-5 h-9 cursor-pointer transition-all text-slate-600"
          >
            <Bell className="h-4 w-4" />
            {t("profile.tabs.notifications")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileAvatarCard profile={profile} />
          <ProfileBasicInfoForm
            profile={profile}
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            reset={reset}
            isDirty={isDirty}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <ProfileSecurityTab
            setChangePasswordOpen={setChangePasswordOpen}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <ProfileNotificationsTab
            notifSaving={notifSaving}
            notifSettings={notifSettings}
            handleNotifToggle={handleNotifToggle}
          />
        </TabsContent>
      </Tabs>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};

export default ProfilePage;
