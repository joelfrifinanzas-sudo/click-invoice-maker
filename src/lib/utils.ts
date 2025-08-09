import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color utilities for contrast-aware theming
// Implements WCAG contrast checks and derives overlay/border colors
export type RGB = { r: number; g: number; b: number; a?: number }

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n))
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '')
  const isShort = clean.length === 3
  const full = isShort
    ? clean.split('').map((c) => c + c).join('')
    : clean
  if (full.length !== 6) return null
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function hslToRgbObj(h: number, s: number, l: number): RGB {
  // h [0-360], s/l [0-1]
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hh = (h % 360) / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hh >= 0 && hh < 1) { r1 = c; g1 = x; b1 = 0 }
  else if (hh >= 1 && hh < 2) { r1 = x; g1 = c; b1 = 0 }
  else if (hh >= 2 && hh < 3) { r1 = 0; g1 = c; b1 = x }
  else if (hh >= 3 && hh < 4) { r1 = 0; g1 = x; b1 = c }
  else if (hh >= 4 && hh < 5) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  const m = l - c / 2
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) }
}

function parseHsl(input: string): { h: number; s: number; l: number; a?: number } | null {
  // Supports: hsl(H S% L%) or hsl(H, S%, L%) with optional / A or , A
  const str = input.trim().toLowerCase()
  if (!str.startsWith('hsl')) return null
  const inside = str.substring(str.indexOf('(') + 1, str.lastIndexOf(')'))
  const parts = inside.replace(/\s*[,/]\s*/g, ',').replace(/\s+/g, ' ').split(',')
  const [hRaw, sRaw, lRaw, aRaw] = parts
  if (!hRaw || !sRaw || !lRaw) return null
  const h = parseFloat(hRaw)
  const s = parseFloat(sRaw.replace('%', '')) / 100
  const l = parseFloat(lRaw.replace('%', '')) / 100
  const a = aRaw !== undefined ? clamp(parseFloat(aRaw)) : undefined
  return { h, s, l, a }
}

function parseRgb(input: string): RGB | null {
  const str = input.trim().toLowerCase()
  if (!str.startsWith('rgb')) return null
  const inside = str.substring(str.indexOf('(') + 1, str.lastIndexOf(')'))
  const parts = inside.replace(/\s*[,/]\s*/g, ',').split(',')
  const [rRaw, gRaw, bRaw, aRaw] = parts
  const r = parseFloat(rRaw)
  const g = parseFloat(gRaw)
  const b = parseFloat(bRaw)
  const a = aRaw !== undefined ? clamp(parseFloat(aRaw)) : undefined
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b, a }
}

function parseColor(input: string): RGB | null {
  if (!input) return null
  if (input.startsWith('#')) return hexToRgb(input)
  if (input.startsWith('hsl')) {
    const hsl = parseHsl(input)
    if (!hsl) return null
    const { h, s, l, a } = hsl
    const rgb = hslToRgbObj(h, s, l)
    return { ...rgb, a }
  }
  if (input.startsWith('rgb')) return parseRgb(input)
  return null
}

function relativeLuminance({ r, g, b }: RGB) {
  const srgb = [r, g, b].map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  const [R, G, B] = srgb
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastRatio(fg: RGB, bg: RGB) {
  const L1 = relativeLuminance(fg)
  const L2 = relativeLuminance(bg)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function toRgbaString({ r, g, b }: RGB, alpha = 1) {
  const a = clamp(alpha)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Public helpers
export function textColorFor(bgColor: string): "#000000" | "#FFFFFF" {
  const bg = parseColor(bgColor) ?? { r: 255, g: 255, b: 255 }
  const black: RGB = { r: 0, g: 0, b: 0 }
  const white: RGB = { r: 255, g: 255, b: 255 }
  const cBlack = contrastRatio(black, bg)
  const cWhite = contrastRatio(white, bg)
  // Prefer black if it meets AA (>= 4.5), otherwise white
  return cBlack >= 4.5 || cBlack >= cWhite ? "#000000" : "#FFFFFF"
}

export function borderColorFor(bgColor: string, alpha: number = 0.1): string {
  const textHex = textColorFor(bgColor)
  const rgb = textHex === '#000000' ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }
  return toRgbaString(rgb, clamp(alpha, 0.08, 0.12))
}

export function overlayColorFor(bgColor: string, alpha: number = 0.07): string {
  const textHex = textColorFor(bgColor)
  const rgb = textHex === '#000000' ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }
  return toRgbaString(rgb, clamp(alpha, 0.06, 0.12))
}

