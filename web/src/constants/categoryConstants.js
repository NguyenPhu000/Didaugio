import {
  mdiAirplane, mdiBabyCarriage, mdiBankOutline, mdiBasketOutline, mdiBeach, mdiBedOutline,
  mdiBeerOutline, mdiBike, mdiBinoculars, mdiBookOpenPageVariantOutline,
  mdiBriefcaseOutline, mdiBus, mdiCakeVariantOutline, mdiCameraOutline,
  mdiCarOutline, mdiCashMultiple, mdiCastle, mdiChefHat, mdiCoffeeOutline,
  mdiCompassOutline, mdiCupWater, mdiDogSide, mdiDramaMasks, mdiFerrisWheel,
  mdiFerry, mdiFish, mdiFlowerOutline, mdiFoodAppleOutline, mdiFoodSteak,
  mdiGiftOutline, mdiGlassCocktail, mdiHandHeartOutline, mdiHomeOutline,
  mdiHospitalBoxOutline, mdiIceCream, mdiImageMultipleOutline,
  mdiInformationOutline, mdiLeaf, mdiMapMarkerOutline, mdiMapSearchOutline,
  mdiMotorbike, mdiMusicNoteOutline, mdiOfficeBuildingOutline, mdiPaletteOutline,
  mdiPalmTree, mdiParking, mdiPineTree, mdiPotSteamOutline, mdiQrcode,
  mdiSailBoat, mdiShieldCheckOutline, mdiShoppingOutline, mdiShower, mdiSignDirection,
  mdiSilverwareForkKnife, mdiSproutOutline, mdiStarOutline, mdiStorefrontOutline,
  mdiTent, mdiTempleBuddhist, mdiTerrain, mdiTicketConfirmationOutline,
  mdiTrain, mdiTranslate, mdiTreeOutline, mdiWalk, mdiWarehouse, mdiWalletOutline,
  mdiWeatherNight, mdiWeatherSunset, mdiWaves, mdiWheelchairAccessibility, mdiWifi,
} from "@mdi/js";

export const DEFAULT_CATEGORY_ICON = "map-marker-outline";

export const CATEGORY_ICON_GROUPS = [
  { label: "Travel essentials", icons: ["map-marker-outline", "map-search-outline", "compass-outline", "sign-direction", "ticket-confirmation-outline", "camera-outline", "image-multiple-outline", "information-outline", "translate"] },
  { label: "Vietnam culture", icons: ["bank-outline", "temple-buddhist", "castle", "book-open-page-variant-outline", "drama-masks", "palette-outline", "music-note-outline", "gift-outline", "hand-heart-outline"] },
  { label: "Mekong nature", icons: ["waves", "ferry", "sail-boat", "palm-tree", "tree-outline", "pine-tree", "leaf", "flower-outline", "sprout-outline", "terrain", "compass-outline", "beach", "weather-sunset", "weather-night"] },
  { label: "Food and drink", icons: ["silverware-fork-knife", "chef-hat", "pot-steam-outline", "coffee-outline", "cup-water", "ice-cream", "cake-variant-outline", "fish", "food-steak", "food-apple-outline", "beer-outline", "glass-cocktail"] },
  { label: "Stay and services", icons: ["bed-outline", "home-outline", "office-building-outline", "storefront-outline", "shopping-outline", "basket-outline", "warehouse", "briefcase-outline", "hospital-box-outline", "shower", "wifi", "parking", "shield-check-outline", "cash-multiple", "wallet-outline", "qrcode"] },
  { label: "Move and activities", icons: ["airplane", "train", "bus", "car-outline", "motorbike", "bike", "walk", "tent", "ferris-wheel", "binoculars", "wheelchair-accessibility", "baby-carriage", "dog-side", "star-outline"] },
];

export const CATEGORY_ICON_PRESETS = CATEGORY_ICON_GROUPS.flatMap((group) => group.icons);

export const CATEGORY_ICON_MAP = {
  "map-marker-outline": mdiMapMarkerOutline, "map-search-outline": mdiMapSearchOutline,
  "compass-outline": mdiCompassOutline, "sign-direction": mdiSignDirection,
  "ticket-confirmation-outline": mdiTicketConfirmationOutline, "camera-outline": mdiCameraOutline,
  "image-multiple-outline": mdiImageMultipleOutline, "information-outline": mdiInformationOutline,
  translate: mdiTranslate, "bank-outline": mdiBankOutline, "temple-buddhist": mdiTempleBuddhist,
  castle: mdiCastle, "book-open-page-variant-outline": mdiBookOpenPageVariantOutline,
  "drama-masks": mdiDramaMasks, "palette-outline": mdiPaletteOutline,
  "music-note-outline": mdiMusicNoteOutline, "gift-outline": mdiGiftOutline,
  "hand-heart-outline": mdiHandHeartOutline, waves: mdiWaves, ferry: mdiFerry,
  "sail-boat": mdiSailBoat, "palm-tree": mdiPalmTree, "tree-outline": mdiTreeOutline,
  "pine-tree": mdiPineTree, leaf: mdiLeaf, "flower-outline": mdiFlowerOutline,
  "sprout-outline": mdiSproutOutline, terrain: mdiTerrain, beach: mdiBeach,
  "weather-sunset": mdiWeatherSunset, "weather-night": mdiWeatherNight,
  "silverware-fork-knife": mdiSilverwareForkKnife, "chef-hat": mdiChefHat,
  "pot-steam-outline": mdiPotSteamOutline, "coffee-outline": mdiCoffeeOutline,
  "cup-water": mdiCupWater, "ice-cream": mdiIceCream, "cake-variant-outline": mdiCakeVariantOutline,
  fish: mdiFish, "food-steak": mdiFoodSteak, "food-apple-outline": mdiFoodAppleOutline,
  "beer-outline": mdiBeerOutline, "glass-cocktail": mdiGlassCocktail, "bed-outline": mdiBedOutline,
  "home-outline": mdiHomeOutline, "office-building-outline": mdiOfficeBuildingOutline,
  "storefront-outline": mdiStorefrontOutline, "shopping-outline": mdiShoppingOutline,
  "basket-outline": mdiBasketOutline, warehouse: mdiWarehouse, "briefcase-outline": mdiBriefcaseOutline,
  "hospital-box-outline": mdiHospitalBoxOutline, shower: mdiShower, wifi: mdiWifi,
  parking: mdiParking, "shield-check-outline": mdiShieldCheckOutline, "cash-multiple": mdiCashMultiple,
  "wallet-outline": mdiWalletOutline, qrcode: mdiQrcode, airplane: mdiAirplane, train: mdiTrain,
  bus: mdiBus, "car-outline": mdiCarOutline, motorbike: mdiMotorbike, bike: mdiBike, walk: mdiWalk,
  tent: mdiTent, "ferris-wheel": mdiFerrisWheel, binoculars: mdiBinoculars,
  "wheelchair-accessibility": mdiWheelchairAccessibility, "baby-carriage": mdiBabyCarriage,
  "dog-side": mdiDogSide, "star-outline": mdiStarOutline,
};

const LEGACY_ICON_TO_MDI = {
  Accessibility: "wheelchair-accessibility", Baby: "baby-carriage", BadgeInfo: "information-outline", Bath: "shower", BedDouble: "bed-outline", Beef: "food-steak", Beer: "beer-outline", Bike: "bike", Binoculars: "binoculars", BookOpen: "book-open-page-variant-outline", BriefcaseBusiness: "briefcase-outline", Building2: "office-building-outline", Building: "office-building-outline", Bus: "bus", Camera: "camera-outline", Car: "car-outline", CakeSlice: "cake-variant-outline", Castle: "castle", ChefHat: "chef-hat", Church: "temple-buddhist", CircleDollarSign: "cash-multiple", Coffee: "coffee-outline", Compass: "compass-outline", Dog: "dog-side", Drama: "drama-masks", FerrisWheel: "ferris-wheel", Fish: "fish", Flower2: "flower-outline", Footprints: "walk", Gift: "gift-outline", GlassWater: "cup-water", HeartHandshake: "hand-heart-outline", Home: "home-outline", Hospital: "hospital-box-outline", Hotel: "bed-outline", House: "home-outline", IceCreamBowl: "ice-cream", Images: "image-multiple-outline", Landmark: "bank-outline", Languages: "translate", Leaf: "leaf", Map: "map-search-outline", MapPinned: "map-marker-outline", Martini: "glass-cocktail", Moon: "weather-night", Motorbike: "motorbike", Mountain: "terrain", MountainSnow: "terrain", Music: "music-note-outline", Palette: "palette-outline", Palmtree: "palm-tree", ParkingCircle: "parking", Plane: "airplane", QrCode: "qrcode", Route: "sign-direction", Sailboat: "sail-boat", Shell: "compass-outline", ShieldCheck: "shield-check-outline", Ship: "ferry", ShipWheel: "ferry", ShoppingBag: "shopping-outline", ShoppingBasket: "basket-outline", Shrimp: "fish", Signpost: "sign-direction", Soup: "pot-steam-outline", Sparkles: "map-search-outline", Sprout: "sprout-outline", Star: "star-outline", Store: "storefront-outline", Sun: "weather-sunset", Sunrise: "weather-sunset", Sunset: "weather-sunset", TentTree: "tent", Ticket: "ticket-confirmation-outline", Train: "train", TreePine: "pine-tree", Trees: "tree-outline", Umbrella: "beach", University: "bank-outline", UtensilsCrossed: "silverware-fork-knife", Vegan: "food-apple-outline", WalletCards: "wallet-outline", Warehouse: "warehouse", Waves: "waves", Wifi: "wifi",
};

const CATEGORY_NAME_ICON_RULES = [
  { keywords: ["cho", "market", "shopping", "mua sam"], icon: "basket-outline" },
  { keywords: ["chua", "den", "temple", "pagoda", "nha tho"], icon: "temple-buddhist" },
  { keywords: ["di tich", "lich su", "bao tang", "van hoa"], icon: "bank-outline" },
  { keywords: ["song", "kenh", "ben", "tau", "thuyen", "floating"], icon: "ferry" },
  { keywords: ["bien", "dao", "beach"], icon: "waves" },
  { keywords: ["vuon", "sinh thai", "canh dong", "nature", "park"], icon: "tree-outline" },
  { keywords: ["nui", "mountain", "hang"], icon: "terrain" },
  { keywords: ["an", "am thuc", "food", "restaurant", "quan"], icon: "silverware-fork-knife" },
  { keywords: ["cafe", "coffee", "ca phe", "tra"], icon: "coffee-outline" },
  { keywords: ["khach san", "hotel", "resort", "homestay", "stay"], icon: "bed-outline" },
  { keywords: ["tour", "trip", "trail", "hanh trinh"], icon: "sign-direction" },
  { keywords: ["xe", "bus", "taxi", "di chuyen", "transport"], icon: "bus" },
  { keywords: ["anh", "checkin", "photo", "camera"], icon: "camera-outline" },
  { keywords: ["ve", "ticket", "event", "su kien"], icon: "ticket-confirmation-outline" },
  { keywords: ["tre em", "family", "gia dinh"], icon: "baby-carriage" },
];

const normalizeCategoryText = (value = "") => String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

export const getCategoryIconName = (category) => {
  const configuredIcon = typeof category === "string" ? category : category?.icon;
  if (CATEGORY_ICON_MAP[configuredIcon]) return configuredIcon;
  if (LEGACY_ICON_TO_MDI[configuredIcon]) return LEGACY_ICON_TO_MDI[configuredIcon];
  const text = normalizeCategoryText(typeof category === "string" ? category : `${category?.name || ""} ${category?.slug || ""}`);
  return CATEGORY_NAME_ICON_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))?.icon || DEFAULT_CATEGORY_ICON;
};

export const CATEGORY_COLOR_PRESETS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"];
