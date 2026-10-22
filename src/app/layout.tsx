import { Geist, Geist_Mono } from "next/font/google";
import { buildMetadata } from "@/lib/seo";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

const geistSans = Geist({
  // globals.css (shadcn) reads --font-sans; a different name falls back to the browser serif font.
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = buildMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
