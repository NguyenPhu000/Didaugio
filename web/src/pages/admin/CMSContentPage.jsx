import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, Doughnut } from "react-chartjs-2";
import "@/lib/chartSetup";
import {
  FileText,
  Image as ImageIcon,
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Globe,
  RefreshCw,
  MapPin,
  Users,
  Star,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
  Link,
  Upload,
  X,
  Compass,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import * as eventService from "@/apis/eventService";
import * as bannerService from "@/apis/bannerService";
import * as announcementService from "@/apis/announcementService";
import * as placeService from "@/apis/placeService";
import * as categoryService from "@/apis/categoryService";
import * as districtService from "@/apis/districtService";
import { useAuthStore } from "@/stores/authStore";
import {
  TripContentCard as SampleTripContentCard,
  TripEditModal as SampleTripEditModal,
} from "./cms/sample-trips";
import { compressBannerImage } from "./cms/banners/imageCompression";
import { getContentTypes } from "./cms/contentTypes";
import { getMockData } from "./cms/mockData";
import { EventEditModal } from "./cms/events/EventEditModal";
import { EventTabContent } from "./cms/events/EventTabContent";
import { ContentCard } from "./cms/content/ContentCard";
import { EditModal } from "./cms/content/EditModal";
import { ImageUploadArea } from "./cms/shared/ImageUploadArea";
import { StatCard } from "./cms/shared/StatCard";
import { StatusBadge } from "./cms/shared/StatusBadge";
import { CmsFilterBar } from "./cms/dashboard/CmsFilterBar";
import { CmsPageHeader } from "./cms/dashboard/CmsPageHeader";
import { CmsTypeTabs } from "./cms/dashboard/CmsTypeTabs";
import { CmsContentLayout } from "./cms/dashboard/CmsContentLayout";

// ─── Image Compression ───────────────────────────────────────────────────────

// ─── Content Types ─────────────────────────────────────────────────────────────

// ─── Status Badge ─────────────────────────────────────────────────────────────

const CMSContentPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("events");
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const user = useAuthStore((state) => state.user);
  const userRole = user?.roleId || 5;

  const CONTENT_TYPES = useMemo(() => getContentTypes(t), [t]);

  const allowedContentTypes = CONTENT_TYPES.filter((type) => {
    if (type.id === "trips" || type.id === "events" || type.id === "banners" || type.id === "announcements") {
      // Chỉ cho phép admin (2), super admin (1) và staff hệ thống (4)
      return userRole === 1 || userRole === 2 || userRole === 4;
    }
    return true;
  });

  const selectedType = allowedContentTypes.find((t) => t.id === activeTab);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "events") {
        const res = await eventService.getEvents({ limit: 50 });
        setItems(res.data || []);
      } else if (activeTab === "trips") {
        const res = await eventService.getAdminTrips();
        setItems(res.data || []);
      } else if (activeTab === "banners") {
        const res = await bannerService.getBanners({ limit: 50 });
        setItems(res.data || []);
      } else if (activeTab === "announcements") {
        const res = await announcementService.getAnnouncements({ limit: 50 });
        setItems(res.data || []);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setItems(getMockData(t)[activeTab] || []);
      }
    } catch (error) {
      logger.error("Failed to fetch CMS items", error, { activeTab });
      toast.error(t("admin.cms.cannotLoadContent"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, t]);

  useEffect(() => {
    // Nếu activeTab hiện tại bị loại bỏ do phân quyền, tự động đổi về tab hợp lệ đầu tiên
    const isValidTab = allowedContentTypes.some(t => t.id === activeTab);
    if (!isValidTab && allowedContentTypes.length > 0) {
      setActiveTab(allowedContentTypes[0].id);
      return;
    }

    if (activeTab === "events" || activeTab === "trips" || activeTab === "banners" || activeTab === "announcements") {
      fetchItems();
    } else if (!initialized) {
      setItems(getMockData(t)[activeTab] || []);
      setInitialized(true);
    } else {
      fetchItems();
    }
  }, [activeTab, initialized, fetchItems, userRole]);

  const filteredItems = items.filter((item) => {
    const titleMatch = item.title?.toLowerCase().includes(search.toLowerCase());
    const descMatch = item.description?.toLowerCase().includes(search.toLowerCase());
    const locMatch = item.location?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = !search || titleMatch || descMatch || locMatch;

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (activeTab === "events") {
        matchesStatus = statusFilter === item.status;
      } else if (activeTab === "trips") {
        // trips lọc theo status nếu cần (planned, upcoming...)
        matchesStatus = statusFilter === item.status;
      } else {
        const isActive = item.active ?? item.isActive;
        matchesStatus =
          (statusFilter === "active" && isActive) ||
          (statusFilter === "inactive" && !isActive);
      }
    }
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item) => {
    setEditModal({ open: true, item });
  };

  const handleTripDetail = (item) => {
    setEditModal({ open: true, item: { ...item, __mode: "detail" } });
  };

  const handleToggle = async (item) => {
    if (activeTab === "events") {
      setIsLoading(true);
      try {
        const newStatus = item.status === "active" ? "inactive" : "active";
        await eventService.updateEvent(item.id, { status: newStatus });
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
        );
        toast.success(t(newStatus === "active" ? "admin.cms.activated" : "admin.cms.hiddenItem", { title: item.title }));
      } catch (err) {
        logger.error("Failed to update event status", err, { eventId: item.id });
        toast.error(t("common.operationFailed"));
      } finally {
        setIsLoading(false);
      }
    } else if (activeTab === "banners") {
      setIsLoading(true);
      try {
        const newIsActive = !item.isActive;
        await bannerService.updateBanner(item.id, { isActive: newIsActive });
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: newIsActive } : i))
        );
        toast.success(t(newIsActive ? "admin.cms.activated" : "admin.cms.hiddenItem", { title: item.title }));
      } catch (err) {
        logger.error("Failed to update banner status", err, { bannerId: item.id });
        toast.error(t("common.operationFailed"));
      } finally {
        setIsLoading(false);
      }
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
      );
      toast.success(t(item.active ? "admin.cms.hiddenItem" : "admin.cms.activated", { title: item.title }));
    }
  };

  const handleDelete = async (item) => {
    const itemType = activeTab === "events" ? t("admin.cms.events") : activeTab === "trips" ? t("admin.cms.sampleTrips") : activeTab === "banners" ? "banner" : activeTab === "announcements" ? "thông báo" : t("admin.cms.events");
    if (!window.confirm(t("admin.cms.deleteConfirmItem", { type: itemType, title: item.title }))) return;

    setIsLoading(true);
    try {
      if (activeTab === "events") {
        await eventService.deleteEvent(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else if (activeTab === "trips") {
        await eventService.deleteTrip(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else if (activeTab === "banners") {
        await bannerService.deleteBanner(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else if (activeTab === "announcements") {
        await announcementService.deleteAnnouncement(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      }
    } catch (err) {
      logger.error("Failed to delete CMS content", err, { activeTab, itemId: item.id });
      toast.error(err.response?.data?.message || t("admin.cms.cannotDeleteContent"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (form) => {
    setIsLoading(true);
    try {
      if (activeTab === "events") {
        if (editModal.item?.id) {
          const res = await eventService.updateEvent(editModal.item.id, form);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await eventService.createEvent(form);
          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else if (activeTab === "trips") {
        const { draftDestinations = [], ...tripForm } = form;
        if (editModal.item?.id) {
          const res = await eventService.updateTrip(editModal.item.id, tripForm);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await eventService.createTrip(tripForm);
          const createdTrip = res.data;

          if (createdTrip?.id && draftDestinations.length > 0) {
            for (const [index, destination] of draftDestinations.entries()) {
              await eventService.addDestination(createdTrip.id, {
                placeId: parseInt(destination.placeId, 10),
                dayNumber: parseInt(destination.dayNumber, 10) || 1,
                order: destination.order || index + 1,
                startTime: destination.startTime || null,
                endTime: destination.endTime || null,
                note: destination.note || null,
                transportToNext: destination.transportToNext || null,
              });
            }
          }

          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else if (activeTab === "banners") {
        // Banner modal không có field ngày → set default: now → 1 năm sau
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        const payload = {
          title: form.title,
          description: form.description || null,
          image: form.image || undefined,
          linkType: form.linkType || "none",
          linkValue: form.link || null,
          position: form.position || "home",
          priority: form.order || 0,
          startDate: form.startDate
            ? new Date(form.startDate).toISOString()
            : now.toISOString(),
          endDate: form.endDate
            ? new Date(form.endDate).toISOString()
            : oneYearLater.toISOString(),
          isActive: form.active !== false,
        };

        if (editModal.item?.id) {
          const res = await bannerService.updateBanner(editModal.item.id, payload);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await bannerService.createBanner(payload);
          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else if (activeTab === "announcements") {
        const payload = {
          title: form.title,
          body: form.description || form.subtitle || form.title,
          imageUrl: form.image || null,
        };

        if (editModal.item?.id) {
          const res = await announcementService.updateAnnouncement(editModal.item.id, payload);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success("Đã cập nhật thông báo");
        } else {
          const res = await announcementService.createAnnouncement(payload);
          setItems((prev) => [res.data, ...prev]);
          toast.success("Đã gửi thông báo đến tất cả người dùng");
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else {
        if (editModal.item?.id) {
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? { ...i, ...form } : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const newItem = {
            ...form,
            id: Math.max(...items.map((i) => i.id), 0) + 1,
            views: 0,
          };
          setItems((prev) => [newItem, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
      }
    } catch (err) {
      logger.error("Failed to save CMS content", err, { activeTab, itemId: editModal.item?.id });
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message;
      toast.error(msg || t("admin.cms.cannotSaveContent"));
    } finally {
      setIsLoading(false);
    }
  };

  const getContentCount = (typeId) => {
    if (typeId === "events" || typeId === "trips" || typeId === "banners" || typeId === "announcements") {
      return activeTab === typeId ? items.length : "...";
    }
    return getMockData(t)[typeId]?.length || 0;
  };

  const activeEventCount = items.filter((i) => i.status === "active").length;
  const featuredBannerCount = items.filter((i) => i.isFeaturedBanner && i.status === "active").length;
  const totalTrips = items.length;
  const totalClones = items.reduce((acc, curr) => acc + (curr.cloneCount || 0), 0);

  const eventsChartData = useMemo(() => {
    if (activeTab !== "events") return null;
    const topEvents = [...items]
      .sort((a, b) => (b.totalCheckIns || 0) - (a.totalCheckIns || 0))
      .slice(0, 5);

    if (topEvents.length === 0) return null;

    return {
      labels: topEvents.map((e) => e.title.substring(0, 15) + (e.title.length > 15 ? "..." : "")),
      datasets: [
        {
          label: "Lượt check-in",
          data: topEvents.map((e) => e.totalCheckIns || 0),
          backgroundColor: "hsl(var(--primary))",
          borderRadius: 6,
        },
      ],
    };
  }, [items, activeTab]);

  const tripsChartData = useMemo(() => {
    if (activeTab !== "trips") return null;
    const topTrips = [...items]
      .sort((a, b) => (b.cloneCount || 0) - (a.cloneCount || 0))
      .slice(0, 5);

    if (topTrips.length === 0) return null;

    return {
      labels: topTrips.map((t) => t.title.substring(0, 15) + (t.title.length > 15 ? "..." : "")),
      datasets: [
        {
          label: "Lượt clone",
          data: topTrips.map((t) => t.cloneCount || 0),
          backgroundColor: "#a855f7",
          borderRadius: 6,
        },
      ],
    };
  }, [items, activeTab]);

  const bannersChartData = useMemo(() => {
    if (activeTab !== "banners") return null;
    const positions = {};
    items.forEach((b) => {
      const pos = b.position || "Home";
      positions[pos] = (positions[pos] || 0) + 1;
    });

    if (Object.keys(positions).length === 0) return null;

    return {
      labels: Object.keys(positions),
      datasets: [
        {
          data: Object.values(positions),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
        },
      ],
    };
  }, [items, activeTab]);

  const announcementsChartData = useMemo(() => {
    if (activeTab !== "announcements") return null;
    const withImage = items.filter((a) => a.imageUrl || a.image).length;
    const noImage = items.length - withImage;

    if (items.length === 0) return null;

    return {
      labels: ["Có ảnh minh họa", "Không có ảnh"],
      datasets: [
        {
          data: [withImage, noImage],
          backgroundColor: ["#10b981", "#ef4444"],
        },
      ],
    };
  }, [items, activeTab]);

  const featuredChartData = useMemo(() => {
    if (activeTab !== "featured" && activeTab !== "pages") return null;
    const topItems = [...items]
      .sort((a, b) => (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0))
      .slice(0, 5);

    if (topItems.length === 0) return null;

    return {
      labels: topItems.map((i) => i.title.substring(0, 15) + (i.title.length > 15 ? "..." : "")),
      datasets: [
        {
          label: "Lượt xem",
          data: topItems.map((i) => i.views || i.viewCount || 0),
          backgroundColor: "#10b981",
          borderRadius: 6,
        },
      ],
    };
  }, [items, activeTab]);

  return <CmsContentLayout t={t} activeTab={activeTab} loading={loading} items={items} activeEventCount={activeEventCount} featuredBannerCount={featuredBannerCount} totalTrips={totalTrips} totalClones={totalClones} eventsChartData={eventsChartData} tripsChartData={tripsChartData} bannersChartData={bannersChartData} announcementsChartData={announcementsChartData} featuredChartData={featuredChartData} allowedContentTypes={allowedContentTypes} getContentCount={getContentCount} setActiveTab={setActiveTab} setSearch={setSearch} setStatusFilter={setStatusFilter} search={search} selectedType={selectedType} statusFilter={statusFilter} filteredItems={filteredItems} handleEdit={handleEdit} handleToggle={handleToggle} handleDelete={handleDelete} handleTripDetail={handleTripDetail} editModal={editModal} setEditModal={setEditModal} handleSave={handleSave} isLoading={isLoading} fetchItems={fetchItems} />;
};

export default CMSContentPage;
