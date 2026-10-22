import { Text } from "react-email";
import { site } from "@/config/site";
import {
  EmailLayout,
  PrimaryButton,
} from "@/lib/email/templates/components/layout";
import { CONTACT_ROUTES } from "@/modules/contact/routes";

export type InquiryEmailData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  status: string;
  emailStatus: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const previewInquiry = {
  id: "inquiry-preview",
  name: "Alex",
  email: "alex@example.com",
  phone: null,
  subject: "Project inquiry",
  message: "I would like to discuss a project.",
  source: CONTACT_ROUTES.contact,
  status: "NEW",
  emailStatus: "PENDING",
  ip: null,
  userAgent: null,
  createdAt: new Date("2026-10-22T10:00:00.000Z"),
  updatedAt: new Date("2026-10-22T10:00:00.000Z"),
} satisfies InquiryEmailData;

export function InquiryNotification({
  inquiry,
}: {
  inquiry: InquiryEmailData;
}) {
  const rows = [
    ["Reference", inquiry.id],
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone ?? "Not provided"],
    ["Subject", inquiry.subject ?? "Not provided"],
    ["Message", inquiry.message],
    ["Page", inquiry.source ?? "Not provided"],
    ["Status", inquiry.status],
    ["Email status", inquiry.emailStatus],
    ["IP", inquiry.ip ?? "Unavailable"],
    ["Browser", inquiry.userAgent ?? "Unavailable"],
    ["Received", inquiry.createdAt.toISOString()],
    ["Updated", inquiry.updatedAt.toISOString()],
  ];
  return (
    <EmailLayout preview={`New inquiry from ${inquiry.name}`}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>New contact inquiry</Text>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th
                scope="row"
                style={{
                  width: 110,
                  padding: "10px 8px",
                  textAlign: "left",
                  verticalAlign: "top",
                  borderBottom: `1px solid ${site.colors.muted}`,
                }}
              >
                {label}
              </th>
              <td
                style={{
                  padding: "10px 8px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  borderBottom: `1px solid ${site.colors.muted}`,
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Text>
        <PrimaryButton
          href={new URL(
            CONTACT_ROUTES.inquiry(inquiry.id),
            site.url,
          ).toString()}
        >
          Open in admin
        </PrimaryButton>
      </Text>
    </EmailLayout>
  );
}
InquiryNotification.PreviewProps = { inquiry: previewInquiry };
