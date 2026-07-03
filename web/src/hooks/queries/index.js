// Shared utilities
export { useApiQuery } from "./useApiQuery";
export { useApiMutation, invalidateQueries } from "./useApiMutation";

// Dashboard
export { useDashboardStats, useDashboardTimeline } from "./useDashboardQuery";

// Places
export {
  usePlaces,
  usePlaceDetail,
  usePlaceBySlug,
  useFeaturedPlaces,
  useNearbyPlaces,
  useCreatePlace,
  useUpdatePlace,
  useDeletePlace,
  useUpdatePlaceStatus,
  useApprovePlace,
  useRejectPlace,
  useToggleFeature,
  useToggleVerify,
  useCheckSlugExists,
} from "./usePlaceQueries";

// Categories
export {
  useCategories,
  useCategoryTree,
  useCategoryDetail,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAssignTagsToCategory,
} from "./useCategoryQueries";

// Tags
export {
  useTags,
  usePopularTags,
  useTagDetail,
  useCreateTag,
  useBulkCreateTags,
  useUpdateTag,
  useDeleteTag,
} from "./useTagQueries";

// Business
export {
  useBusinessProfile,
  useBusinesses,
  useBusinessDetail,
  useBusinessDashboard,
  useMyPlaces,
  useRegisterBusiness,
  useUpdateBusinessProfile,
  useApproveBusiness,
  useRejectBusiness,
  useSuspendBusiness,
  useReactivateBusiness,
  useTerminateBusiness,
} from "./useBusinessQueries";

// Bookings
export {
  useBookings,
  useBookingStats,
  useBookingDetail,
  useBookingSchedule,
  useQuickApproveBooking,
  useQuickRejectBooking,
  useConfirmBooking,
  useCancelBooking,
  useCompleteBooking,
  useMarkNoShow,
  useRescheduleBooking,
  useMarkPaid,
} from "./useBookingQueries";

// Users
export {
  useUsers,
  useUserDetail,
  useUpdateUser,
  useDeleteUser,
} from "./useUserQueries";

// Reviews
export {
  useAdminReviews,
  useAdminReviewStats,
  useModerateReview,
  useModerateReviewReply,
} from "./useReviewQueries";

// Districts
export {
  useDistricts,
  useDistrictDetail,
  useCreateDistrict,
  useUpdateDistrict,
  useDeleteDistrict,
  useWards,
  useWardDetail,
} from "./useDistrictQueries";

// Staff
export {
  useStaff,
  useStaffDetail,
  useStaffStats,
  useAuditLog,
  useStaffActivity,
  useCreateStaff,
  useUpdateStaff,
  useRemoveStaff,
  useDeactivateStaff,
  useActivateStaff,
  useResetStaffPassword,
  useBulkAssignRole,
} from "./useStaffQueries";

// Vouchers
export {
  useVouchers,
  useVoucherDetail,
  useVoucherUsageStats,
  useVoucherStats,
  useVoucherAnalytics,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
  useBulkDeactivateVouchers,
  useBulkUpdateVouchers,
  useDuplicateVoucher,
} from "./useVoucherQueries";

// Earnings
export {
  useEarnings,
  useEarningsSummary,
  useCreatePayoutRequest,
} from "./useEarningsQueries";

// Notifications
export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "./useNotificationQueries";

// Roles
export {
  useRoles,
  useRoleDetail,
  useRolePermissions,
  useRoleUsers,
  useUpdateRolePermissions,
} from "./useRoleQueries";

// Permissions
export {
  usePermissions,
  usePermissionDetail,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from "./usePermissionQueries";

// Settings
export {
  useSettings,
  useUpdateSettings,
} from "./useSettingsQueries";
