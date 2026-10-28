import { z } from "zod";
import { site } from "@/config/site";

const text = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(2000);
const httpUrl = z
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value), "Use an HTTP URL");
const optionalHttpUrl = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      !value ||
      (z.url().safeParse(value).success && /^https?:\/\//i.test(value)),
    "Use an HTTP URL",
  );
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six digit hex color");
const fontStack = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9 ,'-]+$/, "Use font names separated by commas");
const spacing = z
  .string()
  .regex(
    /^(?:0|(?:\d{1,3}(?:\.\d{1,2})?)(?:px|em|rem|%))(?: (?:0|(?:\d{1,3}(?:\.\d{1,2})?)(?:px|em|rem|%))){0,3}$/,
    "Use up to four numeric CSS lengths",
  );
const width = z
  .string()
  .regex(/^(?:\d{1,3}%|\d{1,4}px)$/, "Use a percent or pixel width");
const margin = z
  .string()
  .regex(
    /^(?:0|auto|\d{1,3}(?:px|em|rem))(?: (?:0|auto|\d{1,3}(?:px|em|rem))){0,3}$/,
    "Use safe margin lengths",
  );
const imageUrl = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      (z.url().safeParse(value).success && /^https?:\/\//i.test(value)),
    "Use a path or an HTTP URL",
  );
export const settingSchemas = {
  name: text,
  description: longText,
  url: httpUrl,
  logo: imageUrl,
  colors: z.object({
    primary: color,
    background: color,
    foreground: color,
    muted: color,
  }),
  email: z.object({
    fontFamily: fontStack,
    backgroundColor: color,
    textColor: color,
    borderColor: color,
    headerColor: color,
    footerColor: color,
    footerMutedColor: color,
    buttonBackgroundColor: color,
    buttonTextColor: color,
    buttonRadius: z.number().int().min(0).max(100),
    buttonTextDecoration: z.enum(["none", "underline"]),
    bodyPadding: spacing,
    bodyMargin: spacing,
    containerWidth: width,
    containerMaxWidth: z.number().int().min(100).max(2000),
    containerMargin: margin,
    containerPadding: z.number().int().min(0).max(200),
    borderWidth: z.number().int().min(0).max(20),
    headerFontSize: z.number().int().min(8).max(72),
    headerFontWeight: z.number().int().min(100).max(900),
    footerMarginTop: z.number().int().min(0).max(200),
    buttonPadding: spacing,
    logoWidth: z.number().int().min(1).max(1000),
    logoHeight: z.number().int().min(1).max(1000),
  }),
  supportEmail: z.email(),
  address: longText,
  social: z.object({
    website: optionalHttpUrl,
    instagram: optionalHttpUrl,
    linkedin: optionalHttpUrl,
    x: optionalHttpUrl,
  }),
  seo: z.object({
    titleTemplate: text.refine(
      (value) => value.includes("%s"),
      "Include %s for the page title",
    ),
    description: longText,
  }),
};
export const settingsSchema = z.object(settingSchemas);
export type SiteSettings = z.output<typeof settingsSchema>;
export const settingsDefaults: SiteSettings = site;
export type SettingKey = keyof SiteSettings;
