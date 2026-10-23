import { z } from "zod";
import { site } from "@/config/site";

const text = z.string().min(1);
const httpUrl = z
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "Use an HTTP URL");
const optionalHttpUrl = z
  .string()
  .refine(
    (value) =>
      !value ||
      (z.url().safeParse(value).success && /^https?:\/\//i.test(value)),
    "Use an HTTP URL",
  );
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six digit hex color");
const imageUrl = z
  .string()
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      (z.url().safeParse(value).success && /^https?:\/\//i.test(value)),
    "Use a path or an HTTP URL",
  );
export const settingSchemas = {
  name: text,
  description: text,
  url: httpUrl,
  logo: imageUrl,
  colors: z.object({
    primary: color,
    background: color,
    foreground: color,
    muted: color,
  }),
  email: z.object({
    fontFamily: text,
    backgroundColor: color,
    textColor: color,
    borderColor: color,
    headerColor: color,
    footerColor: color,
    footerMutedColor: color,
    buttonBackgroundColor: color,
    buttonTextColor: color,
    buttonRadius: z.number().min(0).max(100),
    buttonTextDecoration: z.enum(["none", "underline"]),
    bodyPadding: text,
    bodyMargin: text,
    containerWidth: text,
    containerMaxWidth: z.number().positive(),
    containerMargin: text,
    containerPadding: z.number().min(0),
    borderWidth: z.number().min(0),
    headerFontSize: z.number().positive(),
    headerFontWeight: z.number().min(100).max(900),
    footerMarginTop: z.number().min(0),
    buttonPadding: text,
    logoWidth: z.number().positive(),
    logoHeight: z.number().positive(),
  }),
  supportEmail: z.email(),
  address: text,
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
    description: text,
  }),
};
export const settingsSchema = z.object(settingSchemas);
export type SiteSettings = z.output<typeof settingsSchema>;
export const settingsDefaults: SiteSettings = site;
export type SettingKey = keyof SiteSettings;
