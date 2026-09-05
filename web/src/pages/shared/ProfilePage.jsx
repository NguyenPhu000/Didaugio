// MAP: ProfilePage
// ├── UI: @/components/profile/{ProfileAvatarCard, ProfileBasicInfoForm, ProfileSecurityTab, ProfileNotificationsTab}
// └── API: @/apis/profileService

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/apis/profileService";
import { ChangePasswordModal } from "@/components/user/ChangePasswordModal";
import { profileSchema } from "@/schemas/user";

// Sub-Components
import { DEFAULT_NOTIFICATIONS } from "@/components/profile/profileConstants";
import ProfileAvatarCard from "@/components/profile/ProfileAvatarCard";
import ProfileBasicInfoForm from "@/components/profile/ProfileBasicInfoForm";
import ProfileSecurityTab from "@/components/profile/ProfileSecurityTab";
import ProfileNotificationsTab from "@/components/profile/ProfileNotificationsTab";

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
        toast.error(t("profile.errors.loadFailed", "Không thể tải thông tin hồ sơ"));
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
        toast.success(t("profile.success.updated", "Cập nhật hồ sơ thành công"));
        reset(data);
      }
    } catch (error) {
      toast.error(error.message || t("profile.errors.updateFailed", "Cập nhật thông tin thất bại"));
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
      toast.success(t("profile.notificationSettings.saved", "Đã lưu cài đặt thông báo"));
    } catch (err) {
      toast.error(err.message || t("profile.notificationSettings.saveFailed", "Lỗi khi lưu cài đặt"));
      setNotifSettings(previous);
    } finally {
      setNotifSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6 max-w-[1080px] mx-auto pb-16 pt-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-10 w-96 rounded-2xl" />
        <Skeleton className="h-[540px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1D1D1F] antialiased max-w-[1080px] mx-auto pb-16 pt-2">
      {/* Editorial Apple-style Header (Clean whitespace, no harsh borders) */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
          Hồ sơ tài khoản
        </h1>
        <p className="text-xs sm:text-sm text-[#86868B] font-normal">
          Quản lý thông tin định danh, tùy chọn bảo mật và thông báo hệ thống
        </p>
      </header>

      {/* Profile Overview Card */}
      <ProfileAvatarCard
        profile={profile}
        onAvatarUpdated={handleAvatarUpdated}
      />

      {/* Apple-style Segmented Control Navigation */}
      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto no-scrollbar py-0.5">
          <TabsList className="bg-[#EBEBF0]/70 p-1 rounded-2xl inline-flex w-auto border-none h-auto gap-1">
            <TabsTrigger
              value="profile"
              className="rounded-xl py-2 px-4 text-xs font-medium text-[#1D1D1F] transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:font-semibold cursor-pointer border-none"
            >
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-xl py-2 px-4 text-xs font-medium text-[#1D1D1F] transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:font-semibold cursor-pointer border-none"
            >
              Đăng nhập & Bảo mật
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-xl py-2 px-4 text-xs font-medium text-[#1D1D1F] transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:font-semibold cursor-pointer border-none"
            >
              Thông báo
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Profile Info */}
        <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
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

        {/* Tab 2: Security & Sessions */}
        <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
          <ProfileSecurityTab
            setChangePasswordOpen={setChangePasswordOpen}
          />
        </TabsContent>

        {/* Tab 3: Notifications */}
        <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none">
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
