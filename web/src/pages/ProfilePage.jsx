import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
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
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/services/profileService";
import { ROLE_NAMES } from "@/config/constants";
import { ChangePasswordModal } from "@/components/user/ChangePasswordModal";

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Ho ten phai co it nhat 2 ky tu")
    .max(100, "Ho ten qua dai")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "So dien thoai qua dai")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z.string().max(500, "Dia chi qua dai").optional().or(z.literal("")),
  bio: z.string().max(1000, "Gioi thieu qua dai").optional().or(z.literal("")),
});

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

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
        }
      } catch (error) {
        toast.error("Khong the tai thong tin profile");
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
        toast.success("Cap nhat profile thanh cong!");
        reset(data); // Reset isDirty
      }
    } catch (error) {
      toast.error(error.message || "Cap nhat that bai");
    } finally {
      setIsLoading(false);
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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Thong tin ca nhan</h1>
        <p className="text-muted-foreground">
          Quan ly thong tin tai khoan cua ban
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Thong tin
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Bao mat
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Thong bao
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {profile?.profile?.avatar ? (
                      <img
                        src={profile.profile.avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {getInitials(
                          profile?.profile?.fullName,
                          profile?.email
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90"
                    onClick={() => toast("Chuc nang dang phat trien")}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {profile?.profile?.fullName || profile?.email}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.email}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {ROLE_NAMES[profile?.roleId] || "User"}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Thong tin co ban</CardTitle>
              <CardDescription>
                Cap nhat thong tin ca nhan cua ban
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="fullName"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Ho va ten
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Nhap ho va ten"
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Email (readonly) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email khong the thay doi
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      So dien thoai
                    </Label>
                    <Input
                      id="phone"
                      placeholder="0123 456 789"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Ngay sinh
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gioi tinh</Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("gender")}
                    >
                      <option value="">Chon gioi tinh</option>
                      <option value="male">Nam</option>
                      <option value="female">Nu</option>
                      <option value="other">Khac</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Dia chi
                    </Label>
                    <Input
                      id="address"
                      placeholder="Nhap dia chi"
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Gioi thieu ban than
                  </Label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Viet vai dong ve ban than..."
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!isDirty}
                    className="min-w-[120px]"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Luu thay doi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Doi mat khau
              </CardTitle>
              <CardDescription>
                Thay doi mat khau de bao ve tai khoan cua ban
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Bao mat tai khoan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mat khau manh bao gom chu hoa, chu thuong, so va ky tu dac
                    biet. Nen doi mat khau dinh ky de tang cuong bao mat.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full sm:w-auto"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Doi mat khau
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phien dang nhap</CardTitle>
              <CardDescription>
                Quan ly cac thiet bi dang dang nhap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => toast("Chuc nang dang phat trien")}
              >
                Xem tat ca phien
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            {/* Change Password Modal */}
            <ChangePasswordModal
              open={changePasswordOpen}
              onOpenChange={setChangePasswordOpen}
            />
            <CardHeader>
              <CardTitle>Cai dat thong bao</CardTitle>
              <CardDescription>
                Tuy chinh cach ban nhan thong bao
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Chuc nang dang duoc phat trien...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
