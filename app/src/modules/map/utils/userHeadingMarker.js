export function getUserHeadingMarkerRotation({
  heading,
  courseUpEnabled = false,
} = {}) {
  if (courseUpEnabled) return 0;
  return Number.isFinite(heading) ? heading : 0;
}
