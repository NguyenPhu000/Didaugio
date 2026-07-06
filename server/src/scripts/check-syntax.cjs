const fs = require("fs");
const { execSync } = require("child_process");
const files = [
  "d:/didaugio/app/src/utils/dateFormat.js",
  "d:/didaugio/app/src/modules/booking/components/OrderSummary.jsx",
  "d:/didaugio/app/src/modules/booking/components/ServiceCard.jsx",
  "d:/didaugio/app/src/modules/booking/components/RefundPolicyModal.jsx",
  "d:/didaugio/app/app/profile/booking/[id].jsx",
  "d:/didaugio/app/app/profile/bookings.jsx",
  "d:/didaugio/app/app/payment/result.jsx",
  "d:/didaugio/app/app/payment/checkout.jsx",
  "d:/didaugio/app/app/payment/sepay-qr.jsx",
  "d:/didaugio/app/app/booking/[placeId].jsx",
  "d:/didaugio/app/src/modules/trips/components/trip-detail/ItineraryTab.jsx",
  "d:/didaugio/app/src/modules/trips/components/trip-detail/ShareTripModal.jsx",
  "d:/didaugio/app/src/modules/explore/components/EventCard.jsx",
  "d:/didaugio/app/src/modules/explore/components/AnnouncementBanner.jsx",
  "d:/didaugio/app/src/modules/place/components/AllReviewsSheet.jsx",
  "d:/didaugio/app/src/modules/profile/components/MemoriesSection.jsx",
  "d:/didaugio/app/app/event/[id].jsx",
];
for (const f of files) {
  try {
    const content = fs.readFileSync(f, "utf8");
    // Check for basic bracket balance
    let parens = 0, braces = 0, brackets = 0;
    for (const ch of content) {
      if (ch === "(") parens++;
      if (ch === ")") parens--;
      if (ch === "{") braces++;
      if (ch === "}") braces--;
      if (ch === "[") brackets++;
      if (ch === "]") brackets--;
    }
    if (parens !== 0 || braces !== 0 || brackets !== 0) {
      console.log(`BRACKET MISMATCH: ${f} (parens=${parens}, braces=${braces}, brackets=${brackets})`);
    } else {
      console.log(`OK: ${f}`);
    }
  } catch (e) {
    console.log(`ERROR reading: ${f}: ${e.message}`);
  }
}
