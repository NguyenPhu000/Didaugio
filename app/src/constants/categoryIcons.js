export const DEFAULT_CATEGORY_ICON = "map-marker-outline";

const CATEGORY_ICON_NAMES = new Set([
  "map-marker-outline", "map-search-outline", "compass-outline", "sign-direction",
  "ticket-confirmation-outline", "camera-outline", "image-multiple-outline",
  "information-outline", "translate", "bank-outline", "temple-buddhist", "castle",
  "book-open-page-variant-outline", "drama-masks", "palette-outline", "music-note-outline",
  "gift-outline", "hand-heart-outline", "waves", "ferry", "sail-boat", "palm-tree",
  "tree-outline", "pine-tree", "leaf", "flower-outline", "sprout-outline", "terrain",
  "beach", "weather-sunset", "weather-sunny", "weather-night",
  "silverware-fork-knife", "chef-hat", "pot-steam-outline", "coffee-outline", "cup-water",
  "ice-cream", "cake-variant-outline", "fish", "food-steak", "food-apple-outline",
  "beer-outline", "glass-cocktail", "bed-outline", "home-outline",
  "office-building-outline", "storefront-outline", "shopping-outline", "basket-outline",
  "warehouse", "briefcase-outline", "hospital-box-outline", "shower", "wifi", "parking",
  "shield-check-outline", "cash-multiple", "wallet-outline", "qrcode", "airplane", "train",
  "bus", "car-outline", "motorbike", "bike", "walk", "tent", "ferris-wheel", "binoculars",
  "wheelchair-accessibility", "baby-carriage", "dog-side", "star-outline", "creation",
]);

const LEGACY_ICON_NAMES = {
  ShoppingBasket: "basket-outline", Church: "temple-buddhist", Landmark: "bank-outline",
  ShipWheel: "ferry", Waves: "waves", Trees: "tree-outline", Mountain: "terrain",
  UtensilsCrossed: "silverware-fork-knife", Coffee: "coffee-outline", Hotel: "hotel-outline",
  Route: "map-signs", Bus: "bus", Camera: "camera-outline", Ticket: "ticket-confirmation-outline",
  Baby: "baby-carriage",
};

const NAME_RULES = [
  { keywords: ["cho", "market", "shopping", "mua sam"], icon: "basket-outline" },
  { keywords: ["chua", "den", "temple", "pagoda", "nha tho"], icon: "temple-buddhist" },
  { keywords: ["di tich", "lich su", "bao tang", "van hoa"], icon: "bank-outline" },
  { keywords: ["song", "kenh", "ben", "tau", "thuyen", "floating"], icon: "ferry" },
  { keywords: ["bien", "dao", "beach"], icon: "waves" },
  { keywords: ["vuon", "sinh thai", "canh dong", "nature", "park"], icon: "tree-outline" },
  { keywords: ["nui", "mountain", "hang"], icon: "terrain" },
  { keywords: ["an", "am thuc", "food", "restaurant", "quan"], icon: "silverware-fork-knife" },
  { keywords: ["cafe", "coffee", "ca phe", "tra"], icon: "coffee-outline" },
  { keywords: ["khach san", "hotel", "resort", "homestay", "luu tru", "stay"], icon: "bed-outline" },
  { keywords: ["tour", "trip", "trail", "hanh trinh"], icon: "sign-direction" },
  { keywords: ["xe", "bus", "taxi", "di chuyen", "transport"], icon: "bus" },
  { keywords: ["anh", "checkin", "photo", "camera"], icon: "camera-outline" },
  { keywords: ["ve", "ticket", "event", "su kien"], icon: "ticket-confirmation-outline" },
  { keywords: ["tre em", "family", "gia dinh"], icon: "baby-carriage" },
];

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

export function getCategoryIconName(category) {
  const configuredIcon = typeof category === "string" ? null : category?.icon;
  if (CATEGORY_ICON_NAMES.has(configuredIcon)) return configuredIcon;
  const legacyIcon = {
    Hotel: "bed-outline",
    Route: "sign-direction",
    Shell: "compass-outline",
    Shrimp: "fish",
    Signpost: "sign-direction",
    Sunrise: "weather-sunset",
  }[configuredIcon] || LEGACY_ICON_NAMES[configuredIcon];
  if (CATEGORY_ICON_NAMES.has(legacyIcon)) return legacyIcon;

  const text = normalizeText(
    typeof category === "string"
      ? category
      : `${category?.name || ""} ${category?.slug || ""}`,
  );
  return NAME_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))?.icon || DEFAULT_CATEGORY_ICON;
}
