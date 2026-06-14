export const CANVAS_SIZE = 1000;
export const DEFAULT_PIXEL_COLOR = "#ffffff";
export const IS_TEST_MODE = process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS === "true" || process.env.NODE_ENV !== "production";

export function getPriceForPixel(x: number, y: number) {
  const center = (CANVAS_SIZE - 1) / 2;
  const maxDistance = Math.hypot(center, center);
  const distance = Math.hypot(x - center, y - center);
  const normalized = distance / maxDistance;

  if (normalized < 0.18) return 5;
  if (normalized < 0.32) return 4;
  if (normalized < 0.52) return 3;
  if (normalized < 0.72) return 2;
  return 1;
}

export function getZoneName(x: number, y: number) {
  const price = getPriceForPixel(x, y);
  if (price >= 4) return "Central Core";
  if (price >= 2) return "Mid Ring";
  return "Outer Rim";
}

export function isValidHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
