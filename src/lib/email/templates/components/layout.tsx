import type { ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";
import { emailBrand } from "@/lib/email/brand-context";

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  const site = emailBrand();
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 12px",
          backgroundColor: site.colors.background,
          color: site.colors.foreground,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: 600,
            margin: "0 auto",
            padding: 24,
            border: `1px solid ${site.colors.muted}`,
          }}
        >
          <Section>
            <Img
              src={new URL(site.logo, site.url).toString()}
              alt=""
              width="32"
              height="32"
            />
            <Text style={{ fontSize: 20, fontWeight: 700 }}>{site.name}</Text>
          </Section>
          <Section>{children}</Section>
          <Section
            style={{
              borderTop: `1px solid ${site.colors.muted}`,
              marginTop: 32,
            }}
          >
            <Text>{site.name}</Text>
            <Text>{site.address}</Text>
            <Text style={{ color: site.colors.muted }}>
              You received this email because you use {site.name}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const site = emailBrand();
  return (
    <Button
      href={href}
      style={{
        backgroundColor: site.colors.primary,
        color: site.colors.background,
        borderRadius: 6,
        padding: "12px 20px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
