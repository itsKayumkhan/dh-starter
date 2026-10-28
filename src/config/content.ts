import { z } from "zod";
import { ROUTES } from "@/lib/constants/routes";
import { site } from "@/config/site";

export type ContentField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "image" | "boolean" | "list";
  fields?: readonly ContentField[];
};

const safeLink = z
  .string()
  .refine(
    (value) =>
      !value ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      (z.url().safeParse(value).success && /^https?:\/\//i.test(value)),
    "Use a path or an HTTP URL",
  );
const imageUrl = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      !value ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      (z.url().safeParse(value).success && /^https?:\/\//i.test(value)),
    "Use a path or an HTTP URL",
  );
const short = z.string().min(1).max(160);
const paragraph = z.string().min(1).max(2000);
const link = z.object({ label: z.string().max(160), href: safeLink.max(2048) });
const requiredLink = z.object({
  label: short,
  href: safeLink.max(2048).refine(Boolean, "Link is required"),
});
const feature = z.object({
  title: short,
  description: paragraph,
  icon: short,
});
const faq = z.object({
  question: short,
  answer: paragraph,
});
const testimonial = z.object({
  quote: paragraph,
  name: short,
  role: z.string().max(160),
  avatar: imageUrl,
});

export const contentRegistry = {
  "home.hero": {
    key: "home.hero",
    label: "Hero",
    group: "Home",
    schema: z.object({
      eyebrow: short,
      title: short,
      subtitle: paragraph,
      primary: requiredLink,
      secondary: link,
    }),
    defaultValue: {
      eyebrow: site.name,
      title: "A solid start for your next project.",
      subtitle: site.description,
      primary: { label: "Get started", href: ROUTES.signup },
      secondary: { label: "", href: "" },
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "primary.label", label: "Primary CTA label", type: "text" },
      { name: "primary.href", label: "Primary CTA link", type: "url" },
      { name: "secondary.label", label: "Secondary CTA label", type: "text" },
      { name: "secondary.href", label: "Secondary CTA link", type: "url" },
    ] satisfies ContentField[],
  },
  "home.features": {
    key: "home.features",
    label: "Features",
    group: "Home",
    schema: z.object({ heading: short, items: z.array(feature).max(12) }),
    defaultValue: {
      heading: "Features",
      items: [] as z.infer<typeof feature>[],
    },
    fields: [
      { name: "heading", label: "Section heading", type: "text" },
      {
        name: "items",
        label: "Features",
        type: "list",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "icon", label: "Icon name", type: "text" },
        ],
      },
    ] satisfies ContentField[],
  },
  "home.faq": {
    key: "home.faq",
    label: "FAQ",
    group: "Home",
    schema: z.object({ heading: short, items: z.array(faq).max(30) }),
    defaultValue: {
      heading: "Frequently asked questions",
      items: [] as z.infer<typeof faq>[],
    },
    fields: [
      { name: "heading", label: "Section heading", type: "text" },
      {
        name: "items",
        label: "Questions",
        type: "list",
        fields: [
          { name: "question", label: "Question", type: "text" },
          { name: "answer", label: "Answer", type: "textarea" },
        ],
      },
    ] satisfies ContentField[],
  },
  "home.testimonials": {
    key: "home.testimonials",
    label: "Testimonials",
    group: "Home",
    schema: z.object({
      heading: short,
      items: z.array(testimonial).max(12),
    }),
    defaultValue: {
      heading: "Testimonials",
      items: [] as z.infer<typeof testimonial>[],
    },
    fields: [
      { name: "heading", label: "Section heading", type: "text" },
      {
        name: "items",
        label: "Testimonials",
        type: "list",
        fields: [
          { name: "quote", label: "Quote", type: "textarea" },
          { name: "name", label: "Name", type: "text" },
          { name: "role", label: "Role", type: "text" },
          { name: "avatar", label: "Avatar image URL", type: "image" },
        ],
      },
    ] satisfies ContentField[],
  },
  "contact.intro": {
    key: "contact.intro",
    label: "Contact intro",
    group: "Contact",
    schema: z.object({
      title: short,
      subtitle: paragraph,
      formTitle: short,
      detailsTitle: short,
    }),
    defaultValue: {
      title: "Contact us",
      subtitle:
        "Have a question or a project in mind? Send a message and we will get back to you.",
      formTitle: "Send an inquiry",
      detailsTitle: "Business details",
    },
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "formTitle", label: "Form title", type: "text" },
      { name: "detailsTitle", label: "Details title", type: "text" },
    ] satisfies ContentField[],
  },
  "pricing.intro": {
    key: "pricing.intro",
    label: "Pricing intro",
    group: "Pricing",
    schema: z.object({
      eyebrow: short,
      title: short,
      subtitle: paragraph,
      servicesTitle: short,
    }),
    defaultValue: {
      eyebrow: "Simple pricing",
      title: "Choose your plan",
      subtitle: "Start with what you need. Manage your subscription any time.",
      servicesTitle: "One-time services",
    },
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "servicesTitle", label: "Services title", type: "text" },
    ] satisfies ContentField[],
  },
} as const;

export type ContentKey = keyof typeof contentRegistry;
export type ContentValue<K extends ContentKey> = z.output<
  (typeof contentRegistry)[K]["schema"]
>;
export const contentKeys = Object.keys(contentRegistry) as ContentKey[];
