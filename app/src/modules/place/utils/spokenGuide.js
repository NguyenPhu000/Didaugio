const clean = (value) => (typeof value === "string" ? value.trim() : "");

export function hasSpokenGuide(guide) {
  if (!guide) return false;
  if (clean(guide.text)) return true;
  return (guide.faqs || []).some(
    (faq) => clean(faq?.question) && clean(faq?.answer),
  );
}

export function getSpeechText(guide, faqIndex) {
  if (!guide) return null;
  if (Number.isInteger(faqIndex)) {
    return clean(guide.faqs?.[faqIndex]?.answer) || null;
  }
  return clean(guide.text) || null;
}

export function shouldShowBookingCta(place) {
  return (
    String(place?.priceRange || "").toUpperCase() !== "FREE" &&
    place?.bookingEnabled === true
  );
}
