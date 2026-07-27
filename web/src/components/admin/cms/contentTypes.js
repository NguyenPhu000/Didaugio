import { Bell, Calendar, Compass, FileText, Image, Star } from "lucide-react";

export const getContentTypes = (t) => [
  { id: "events", label: t("admin.cms.tabLabels.events"), icon: Calendar, description: t("admin.cms.eventsDesc"), color: "bg-rose-500", gradient: "from-rose-500 to-pink-600" },
  { id: "trips", label: t("admin.cms.tabLabels.sampleTrips"), icon: Compass, description: t("admin.cms.sampleTripsDesc"), color: "bg-purple-500", gradient: "from-purple-500 to-indigo-600" },
  { id: "banners", label: t("admin.cms.tabLabels.banners"), icon: Image, description: t("admin.cms.bannersDesc"), color: "bg-blue-500", gradient: "from-blue-500 to-indigo-600" },
  { id: "announcements", label: t("admin.cms.tabLabels.notifications"), icon: Bell, description: t("admin.cms.notificationsDesc"), color: "bg-amber-500", gradient: "from-amber-500 to-orange-600" },
  { id: "featured", label: t("admin.cms.tabLabels.featured"), icon: Star, description: t("admin.cms.featuredDesc"), color: "bg-yellow-500", gradient: "from-yellow-500 to-amber-600" },
  { id: "pages", label: t("admin.cms.tabLabels.staticPages"), icon: FileText, description: t("admin.cms.staticPagesDesc"), color: "bg-emerald-500", gradient: "from-emerald-500 to-teal-600" },
];
