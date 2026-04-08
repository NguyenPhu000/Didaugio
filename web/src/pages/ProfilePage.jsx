import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/apis/profileService";
import { ROLE_NAMES } from "@/constants/constants";
import { ChangePasswordModal } from "@/components/user/ChangePasswordModal";
import { profileSchema } from "@/schemas/user";

// const profileSchema = z.object({...}) // Removed

const ProfilePage = () => {
  const { setUser } = useAuthStore();
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
      } catch {
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-black border-t-[#F3E600] rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
          LOADING PROFILE DATA...
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
                <p className="tim-meta">QUẢN LÝ THÔNG TIN CÁ NHÂN</p>
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
              THÔNG TIN
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10"
            >
              <Shield className="h-4 w-4" />
              BẢO MẬT
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#F3E600] data-[state=active]:text-black font-bold uppercase text-xs px-6 h-10"
            >
              <Bell className="h-4 w-4" />
              THÔNG BÁO
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section - T.I.M Style */}
            <div className="bg-white border-2 border-black p-6 shadow-sm">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="h-32 w-32 border-4 border-black bg-gray-900 overflow-hidden relative group">
                    {profile?.profile?.avatar ? (
                      <img
                        src={profile.profile.avatar}
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
                    onClick={() => toast("Chức năng đang phát triển")}
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
                      CẬP NHẬT THÔNG TIN CÁ NHÂN
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
                        HỌ VÀ TÊN
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="NHẬP HỌ VÀ TÊN"
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
                        EMAIL KHÔNG THỂ THAY ĐỔI
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <Phone className="h-4 w-4" />
                        SỐ ĐIỆN THOẠI
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
                        NGÀY SINH
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
                        GIỚI TÍNH
                      </Label>
                      <select
                        id="gender"
                        className="flex h-11 w-full rounded-none border-2 border-black bg-white px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:border-[#F3E600] disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("gender")}
                      >
                        <option value="">CHỌN GIỚI TÍNH</option>
                        <option value="male">NAM</option>
                        <option value="female">NỮ</option>
                        <option value="other">KHÁC</option>
                      </select>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="address"
                        className="flex items-center gap-2 tim-meta"
                      >
                        <MapPin className="h-4 w-4" />
                        ĐỊA CHỈ
                      </Label>
                      <Input
                        id="address"
                        placeholder="NHẬP ĐỊA CHỈ"
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
                      GIỚI THIỆU BẢN THÂN
                    </Label>
                    <textarea
                      id="bio"
                      rows={4}
                      className="flex w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-mono uppercase placeholder:text-gray-400 focus:outline-none focus:border-[#F3E600] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="VIẾT VÀI DÒNG VỀ BẢN THÂN..."
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
                      HỦY
                    </Button>
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={!isDirty}
                      className="rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-11 px-8 uppercase font-black text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      LƯU THAY ĐỔI
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
                      CHANGE PASSWORD
                    </h3>
                    <p className="text-xs text-gray-400 uppercase font-mono">
                      THAY ĐỔI MẬT KHẨU BẢO VỆ TÀI KHOẢN
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-yellow-50 border-2 border-[#F3E600]">
                  <AlertCircle className="h-6 w-6 text-black mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase mb-2">
                      BẢO MẬT TÀI KHOẢN
                    </p>
                    <p className="text-xs text-gray-600 uppercase font-mono leading-relaxed">
                      MẬT KHẨU MẠNH BAO GỒM CHỮ HOA, CHỮ THƯỜNG, SỐ VÀ KÝ TỰ ĐẶC
                      BIỆT. NÊN ĐỔI MẬT KHẨU ĐỊNH KỲ ĐỂ TĂNG CƯỜNG BẢO MẬT.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setChangePasswordOpen(true)}
                  className="rounded-none border-2 border-black bg-black text-[#F3E600] hover:bg-[#F3E600] hover:text-black h-11 px-8 uppercase font-black text-xs transition-all"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  ĐỔI MẬT KHẨU
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
                      LOGIN SESSIONS
                    </h3>
                    <p className="text-xs text-gray-400 uppercase font-mono">
                      QUẢN LÝ CÁC THIẾT BỊ ĐĂNG NHẬP
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Button
                  variant="outline"
                  onClick={() => toast("Chức năng đang phát triển")}
                  className="rounded-none border-2 border-black h-11 px-6 hover:bg-gray-100 uppercase font-black text-xs"
                >
                  XEM TẤT CẢ PHIÊN
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab - T.I.M Style */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white border-2 border-black shadow-sm">
              <div className="bg-black text-white p-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-[#F3E600]"></div>
                  <div>
                    <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      NOTIFICATION SETTINGS
                    </h3>
                    <p className="text-xs text-gray-400 uppercase font-mono">
                      TÙY CHỈNH CÁCH BẠN NHẬN THÔNG BÁO
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300">
                  <Bell className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    CHỨC NĂNG ĐANG ĐƯỢC PHÁT TRIỂN...
                  </p>
                </div>
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
