import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { inquiryStatusSchema } from "@/modules/contact/schemas/inquiry";
import type { InquiryStatus } from "@/modules/contact/schemas/inquiry";

const inquirySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  subject: true,
  message: true,
  source: true,
  status: true,
  notificationEmailStatus: true,
  autoReplyEmailStatus: true,
  ip: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InquirySelect;

export type InquiryDto = Omit<
  Prisma.InquiryGetPayload<{ select: typeof inquirySelect }>,
  "createdAt" | "updatedAt"
> & { createdAt: string; updatedAt: string };

function toDto(
  inquiry: Prisma.InquiryGetPayload<{ select: typeof inquirySelect }>,
): InquiryDto {
  return {
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}

export async function listInquiries(input: {
  skip: number;
  take: number;
  q: string;
  sort: { field: string; dir: "asc" | "desc" };
  status?: InquiryStatus;
}) {
  const where: Prisma.InquiryWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
            { subject: { contains: input.q, mode: "insensitive" } },
            { message: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    db.inquiry.findMany({
      where,
      select: inquirySelect,
      skip: input.skip,
      take: input.take,
      orderBy: { [input.sort.field]: input.sort.dir },
    }),
    db.inquiry.count({ where }),
  ]);
  return { data: records.map(toDto), total };
}

export async function getInquiry(id: string) {
  const record = await db.inquiry.findUnique({
    where: { id },
    select: inquirySelect,
  });
  if (!record) throw new NotFoundError();
  return toDto(record);
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const parsed = inquiryStatusSchema.parse(status);
  const existing = await db.inquiry.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) throw new NotFoundError();
  await db.inquiry.update({ where: { id }, data: { status: parsed } });
  return existing.status;
}

export async function createInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source: string;
  ip: string;
  userAgent: string | null;
}) {
  return db.inquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject || null,
      message: input.message,
      source: input.source,
      ip: input.ip === "unknown" ? null : input.ip,
      userAgent: input.userAgent,
    },
    select: inquirySelect,
  });
}

const emailStatusField = {
  notification: "notificationEmailStatus",
  autoReply: "autoReplyEmailStatus",
} as const;

export async function setInquiryEmailStatus(
  id: string,
  channel: keyof typeof emailStatusField,
  status: "sent" | "failed",
) {
  await db.inquiry.update({
    where: { id },
    data: { [emailStatusField[channel]]: status },
  });
}

export async function getInquiryForResend(id: string) {
  const record = await db.inquiry.findUnique({
    where: { id },
    select: inquirySelect,
  });
  if (!record) throw new NotFoundError();
  return record;
}

export async function claimFailedEmail(
  id: string,
  channel: keyof typeof emailStatusField,
) {
  const field = emailStatusField[channel];
  return db.inquiry.updateMany({
    where: { id, [field]: "failed" },
    data: { [field]: "pending" },
  });
}
