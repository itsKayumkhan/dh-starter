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
import { settingsDefaults, type SiteSettings } from "@/config/settings";

export function EmailLayout({
  preview,
  children,
  settings = settingsDefaults,
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
          margin: settings.email.bodyMargin,
          padding: settings.email.bodyPadding,
          backgroundColor: settings.email.backgroundColor,
          color: settings.email.textColor,
          fontFamily: settings.email.fontFamily,
        }}
      >
        <Container
          style={{
            width: settings.email.containerWidth,
            maxWidth: settings.email.containerMaxWidth,
            margin: settings.email.containerMargin,
            padding: settings.email.containerPadding,
            border: `${settings.email.borderWidth}px solid ${settings.email.borderColor}`,
          }}
        >
          <Section>
            <Img
              src={new URL(settings.logo, settings.url).toString()}
              alt=""
              width={settings.email.logoWidth}
              height={settings.email.logoHeight}
            />
            <Text
              style={{
                color: settings.email.headerColor,
                fontSize: settings.email.headerFontSize,
                fontWeight: settings.email.headerFontWeight,
              }}
            >
              {settings.name}
            </Text>
          </Section>
          <Section>{children}</Section>
          <Section
            style={{
              borderTop: `${settings.email.borderWidth}px solid ${settings.email.borderColor}`,
              marginTop: settings.email.footerMarginTop,
            }}
          >
            <Text style={{ color: settings.email.footerColor }}>
              {settings.name}
            </Text>
            <Text style={{ color: settings.email.footerColor }}>
              {settings.address}
            </Text>
            <Text style={{ color: settings.email.footerMutedColor }}>
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
  settings = settingsDefaults,
}: {
  href: string;
  children: ReactNode;
  settings?: SiteSettings;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: settings.email.buttonBackgroundColor,
        color: settings.email.buttonTextColor,
        borderRadius: settings.email.buttonRadius,
        padding: settings.email.buttonPadding,
        textDecoration: settings.email.buttonTextDecoration,
      }}
    >
      {children}
    </Button>
  );
}
