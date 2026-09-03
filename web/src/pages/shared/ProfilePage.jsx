// MAP: ProfilePage
// ├── UI: @/components/profile/{ProfileAvatarCard, ProfileBasicInfoForm, ProfileSecurityTab, ProfileNotificationsTab, ProfileRolesTab}
// └── API: @/apis/profileService

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  User,
  Shield,
  Bell,
  ShieldCheck,
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
import ProfileRolesTab from "@/components/profile/ProfileRolesTab";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { setUser, user: authUser } = useAuthStore();
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
        if (data[key] !== undefined) {
          updateData[key] = data[key];
        }
      });

      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth).toISOString();
      }

      const response = await profileService.updateProfile(updateData);

      if (response.success) {
        setProfile(response.data);
        if (authUser) {
          setUser({
            ...authUser,
            profile: response.data.profile,
          });
        }
        toast.success(t("profile.success.updated"));
        reset(data);
      }
    } catch (error) {
      toast.error(error.message || t("profile.errors.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdated = (newAvatarUrl) => {
    setProfile((prev) => ({
      ...prev,
      avatar: newAvatarUrl,
      profile: {
        ...prev?.profile,
        avatar: newAvatarUrl,
      },
    }));
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
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 tracking-wide font-mono">
          {t("profile.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1360px] mx-auto pb-12">
      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            HỒ SƠ ĐỊNH DANH & PHÂN QUYỀN
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Hồ sơ Quản trị viên
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý thông tin định danh, tùy chọn bảo mật và phân quyền tài khoản trên toàn hệ thống
          </p>
        </div>
      </header>

      {/* Main Avatar & Profile Banner */}
      <ProfileAvatarCard
        profile={profile}
        onAvatarUpdated={handleAvatarUpdated}
      />

      {/* Tabs Navigation */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-[#FAF9F5] p-1 rounded-2xl h-auto flex flex-wrap sm:flex-nowrap border border-black/[0.06] gap-1 shadow-2xs">
          <TabsTrigger
            value="profile"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-bold text-xs px-5 h-10 cursor-pointer transition-all text-slate-600"
          >
            <User className="h-3.5 w-3.5" />
            <span>{t("profile.tabs.info")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-bold text-xs px-5 h-10 cursor-pointer transition-all text-slate-600"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{t("profile.tabs.security")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-bold text-xs px-5 h-10 cursor-pointer transition-all text-slate-600"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>{t("profile.tabs.notifications")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm font-bold text-xs px-5 h-10 cursor-pointer transition-all text-slate-600"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Vai trò & Phân quyền</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab Content */}
        <TabsContent value="profile" className="space-y-6 focus:outline-none">
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

        {/* Security Tab Content */}
        <TabsContent value="security" className="space-y-6 focus:outline-none">
          <ProfileSecurityTab
            setChangePasswordOpen={setChangePasswordOpen}
          />
        </TabsContent>

        {/* Notifications Tab Content */}
        <TabsContent value="notifications" className="space-y-6 focus:outline-none">
          <ProfileNotificationsTab
            notifSaving={notifSaving}
            notifSettings={notifSettings}
            handleNotifToggle={handleNotifToggle}
          />
        </TabsContent>

        {/* Roles & Permissions Tab Content */}
        <TabsContent value="roles" className="space-y-6 focus:outline-none">
          <ProfileRolesTab profile={profile} />
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
