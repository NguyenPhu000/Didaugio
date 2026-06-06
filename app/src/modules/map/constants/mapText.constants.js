import i18n from "../../../i18n";

const DEFAULT_TARGET_NAME_KEY = "map.common.destinationNameLower";

/**
 * Map text constants with i18n support.
 * Uses i18n.t() for static strings and returns functions for dynamic ones.
 */
export const MAP_TEXT = Object.freeze({
  common: {
    get currentLocationName() { return i18n.t("map.common.currentLocationName"); },
    get destinationName() { return i18n.t("map.common.destinationName"); },
    get destinationMissingName() { return i18n.t("map.common.destinationMissingName"); },
    get destinationNameLower() { return i18n.t("map.common.destinationNameLower"); },
    unknownValue: "unknown",
  },
  layerSwitcher: {
    get title() { return i18n.t("map.layerSwitcher.title"); },
  },
  loading: {
    get map() { return i18n.t("map.loading.map"); },
  },
  errors: {
    get mapData() { return i18n.t("map.errors.mapData"); },
    get retry() { return i18n.t("map.errors.retry"); },
    get routeBuild() { return i18n.t("map.errors.routeBuild"); },
    get routeDirectionTitle() { return i18n.t("map.errors.routeDirectionTitle"); },
    get routeDirectionMessage() { return i18n.t("map.errors.routeDirectionMessage"); },
    get routeFallbackTitle() { return i18n.t("map.errors.routeFallbackTitle"); },
    get routeFallbackMessage() { return i18n.t("map.errors.routeFallbackMessage"); },
  },
  search: {
    get placeholder() { return i18n.t("map.search.placeholder"); },
    get cancel() { return i18n.t("map.search.cancel"); },
  },
  web: {
    get noticeTitle() { return i18n.t("map.web.noticeTitle"); },
    get noticeSubtext() { return i18n.t("map.web.noticeSubtext"); },
    get allCategories() { return i18n.t("map.web.allCategories"); },
    summaryFound: (count) => i18n.t("map.web.summaryFound", { count }),
    get loadingPlaces() { return i18n.t("map.web.loadingPlaces"); },
    get placesLoadError() { return i18n.t("map.web.placesLoadError"); },
    get noPlacesForFilters() { return i18n.t("map.web.noPlacesForFilters"); },
    get openInGoogleMaps() { return i18n.t("map.web.openInGoogleMaps"); },
  },
  mapConfig: {
    mapStyles: {
      get osm() { return i18n.t("map.mapConfig.mapStyles.osm"); },
      get hybrid() { return i18n.t("map.mapConfig.mapStyles.hybrid"); },
    },
    categoryLabels: {
      get cuisine() { return i18n.t("map.mapConfig.categoryLabels.cuisine"); },
      get lodging() { return i18n.t("map.mapConfig.categoryLabels.lodging"); },
      get sightseeing() { return i18n.t("map.mapConfig.categoryLabels.sightseeing"); },
      get shopping() { return i18n.t("map.mapConfig.categoryLabels.shopping"); },
      get ecotourism() { return i18n.t("map.mapConfig.categoryLabels.ecotourism"); },
      get cafe() { return i18n.t("map.mapConfig.categoryLabels.cafe"); },
      get homestay() { return i18n.t("map.mapConfig.categoryLabels.homestay"); },
      get ecoPark() { return i18n.t("map.mapConfig.categoryLabels.ecoPark"); },
      get place() { return i18n.t("map.mapConfig.categoryLabels.place"); },
    },
  },
  routeFormatting: {
    get minuteUnit() { return i18n.t("map.routeFormatting.minuteUnit"); },
    get hourUnit() { return i18n.t("map.routeFormatting.hourUnit"); },
    get minuteShortUnit() { return i18n.t("map.routeFormatting.minuteShortUnit"); },
    get meterUnit() { return i18n.t("map.routeFormatting.meterUnit"); },
    get kilometerUnit() { return i18n.t("map.routeFormatting.kilometerUnit"); },
  },
  accessibility: {
    get openMenu() { return i18n.t("common.close"); },
  },
  analytics: {
    routeModeCurrentLocationToPlace: "current_location_to_place",
  },
  routeBuilder: {
    get panelTitle() { return i18n.t("map.routeBuilder.panelTitle"); },
    get emptyDraftHint() { return i18n.t("map.routeBuilder.emptyDraftHint"); },
    get readyToConfirmHint() { return i18n.t("map.routeBuilder.readyToConfirmHint"); },
    minimumStopsHint: (minimumStops) => i18n.t("map.routeBuilder.minimumStopsHint", { minimumStops }),
    statusHint: ({ draftCount, canConfirm, minimumStops }) => {
      if (!draftCount) return i18n.t("map.routeBuilder.emptyDraftHint");
      return `${draftCount} ${i18n.t("common.results")} • ${
        canConfirm
          ? i18n.t("map.routeBuilder.readyToConfirmHint")
          : i18n.t("map.routeBuilder.minimumStopsHint", { minimumStops })
      }`;
    },
    stopFallbackName: (index) => i18n.t("map.routeBuilder.stopFallbackName", { index: index + 1 }),
    get noStopNotice() { return i18n.t("map.routeBuilder.noStopNotice"); },
    get updateRoute() { return i18n.t("map.routeBuilder.updateRoute"); },
    get confirmRoute() { return i18n.t("map.routeBuilder.confirmRoute"); },
    get clearAll() { return i18n.t("map.routeBuilder.clearAll"); },
    pendingArrivalNotice: (targetName) =>
      i18n.t("map.arrivalModal.body", { targetName: targetName || i18n.t(DEFAULT_TARGET_NAME_KEY) }),
    get recoveryTitle() { return i18n.t("map.routeBuilder.recoveryTitle"); },
    recoveryMessage: (targetName, distanceLabel) =>
      `${i18n.t("map.routeBuilder.recoveryTitle")} ${targetName || i18n.t(DEFAULT_TARGET_NAME_KEY)}${
        distanceLabel ? ` (${distanceLabel})` : ""
      }.`,
    progressLabel: (completedLegs, legCount) =>
      `${i18n.t("common.done")} ${Math.min(completedLegs, legCount)}/${legCount}`,
    get etaPrefix() { return i18n.t("map.routeBuilder.etaPrefix"); },
    get stateCompleted() { return i18n.t("map.routeBuilder.stateCompleted"); },
    statePendingConfirm: (targetName) =>
      `${i18n.t("map.arrivalModal.title")} ${targetName || i18n.t(DEFAULT_TARGET_NAME_KEY)} • ${i18n.t("common.confirm")}`,
    stateRecovery: (targetName) =>
      `${i18n.t("map.routeBuilder.recoveryTitle")} ${targetName || i18n.t(DEFAULT_TARGET_NAME_KEY)}`,
    get retryRoute() { return i18n.t("map.routeBuilder.retryRoute"); },
  },
  arrivalModal: {
    get title() { return i18n.t("map.arrivalModal.title"); },
    body: (targetName) =>
      i18n.t("map.arrivalModal.body", { targetName: targetName || i18n.t(DEFAULT_TARGET_NAME_KEY) }),
    get cancel() { return i18n.t("map.arrivalModal.cancel"); },
    get confirm() { return i18n.t("map.arrivalModal.confirm"); },
  },
  navigationStatusBanner: {
    get fallbackInfo() { return i18n.t("map.navigationStatusBanner.fallbackInfo"); },
    get optimizedInfo() { return i18n.t("map.navigationStatusBanner.optimizedInfo"); },
    get retryingRoute() { return i18n.t("map.navigationStatusBanner.retryingRoute"); },
    get retryRoute() { return i18n.t("map.navigationStatusBanner.retryRoute"); },
  },
  filters: {
    quickOptions: {
      get topRated() { return i18n.t("map.filters.quickOptions.topRated"); },
      get trending() { return i18n.t("map.filters.quickOptions.trending"); },
      get budget() { return i18n.t("map.filters.quickOptions.budget"); },
      get premium() { return i18n.t("map.filters.quickOptions.premium"); },
      get openNow() { return i18n.t("map.filters.quickOptions.openNow"); },
    },
    groupOptions: {
      get category() { return i18n.t("map.filters.groupOptions.category"); },
      get area() { return i18n.t("map.filters.groupOptions.area"); },
      get quick() { return i18n.t("map.filters.groupOptions.quick"); },
    },
    pickerTitle: (groupLabel) =>
      i18n.t("map.filters.pickerTitle", { groupLabel: String(groupLabel || i18n.t("map.filters.groupFallback")).toLowerCase() }),
    get allCategories() { return i18n.t("map.filters.allCategories"); },
    get categoryFallback() { return i18n.t("map.filters.categoryFallback"); },
    get allAreas() { return i18n.t("map.filters.allAreas"); },
    get areaFallback() { return i18n.t("map.filters.areaFallback"); },
    get noneApplied() { return i18n.t("map.filters.noneApplied"); },
    countApplied: (count) => i18n.t("map.filters.countApplied", { count }),
    get groupFallback() { return i18n.t("map.filters.groupFallback"); },
  },
});
