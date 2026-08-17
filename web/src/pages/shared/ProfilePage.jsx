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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-[#F3E600] rounded-full animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
          {t("profile.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background relative">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1400px] mx-auto">
        {/* Header - T.I.M Style */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-6 gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="accent-bar h-16 shrink-0" />
            <div>
              <h1 className="tim-title">PROFILE SETTINGS</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 shrink-0">
                  SYSTEM // USER PROFILE
                </span>
                <p className="tim-meta">{t("profile.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="bg-white border-2 border-black p-3">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          {/* Tactical Tabs */}
          <TabsList className="bg-white border-2 border-black p-1 rounded-none h-auto flex flex-wrap sm:flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10 cursor-pointer"
            >
              <User className="h-4 w-4" />
              {t("profile.tabs.info")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10 cursor-pointer"
            >
              <Shield className="h-4 w-4" />
              {t("profile.tabs.security")}
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10 cursor-pointer"
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
