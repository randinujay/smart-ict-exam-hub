import type { Metadata } from "next";
import { Google_Sans_Flex, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: false,
});

const notoSansSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  display: "swap",
  variable: "--font-noto-sinhala",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Randinu Jayaratne | Smart ICT",
    template: "%s | Smart ICT",
  },
  description: "The official Smart ICT tuition and learning platform by Randinu Jayaratne.",
  applicationName: "Smart ICT LMS",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Randinu Jayaratne | Smart ICT",
    description: "Learn ICT clearly, practise intelligently and track real progress through the Smart ICT LMS.",
    type: "website",
    images: ["/rapid-revision-poster.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${googleSans.variable} ${notoSansSinhala.variable}`}><body>{children}</body></html>;
}
