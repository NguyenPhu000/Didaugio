/** Merge conditional Tailwind className strings */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
