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
import { site } from "@/config/site";
import type { SiteSettings } from "@/config/settings";

export function EmailLayout({
  preview,
  children,
  settings = site,
}: {
  preview: string;
  children: ReactNode;
  settings?: SiteSettings;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 12px",
          backgroundColor: settings.colors.background,
          color: settings.colors.foreground,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: 600,
            margin: "0 auto",
            padding: 24,
            border: `1px solid ${settings.colors.muted}`,
          }}
        >
          <Section>
            <Img
              src={new URL(settings.logo, settings.url).toString()}
              alt=""
              width="32"
              height="32"
            />
            <Text style={{ fontSize: 20, fontWeight: 700 }}>
              {settings.name}
            </Text>
          </Section>
          <Section>{children}</Section>
          <Section
            style={{
              borderTop: `1px solid ${settings.colors.muted}`,
              marginTop: 32,
            }}
          >
            <Text>{settings.name}</Text>
            <Text>{settings.address}</Text>
            <Text style={{ color: settings.colors.muted }}>
              You received this email because you use {settings.name}.
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
  settings = site,
}: {
  href: string;
  children: ReactNode;
  settings?: SiteSettings;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: settings.colors.primary,
        color: settings.colors.background,
        borderRadius: 6,
        padding: "12px 20px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
