import type { Metadata, Viewport } from "next";
import { Anton, Inter, UnifrakturMaguntia } from "next/font/google";
import "./globals.css";
import { RESTAURANT } from "@/lib/config";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });
const gothic = UnifrakturMaguntia({ variable: "--font-gothic", subsets: ["latin"], weight: "400" });

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3300";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Chicano Burger · Cali-style burgers in Puerto Vallarta · Reserve a table",
    template: "%s · Chicano Burger",
  },
  description:
    "Ni americano, ni mexicano: ¡Chicano! Family-run Cali-style burger stand in Puerto Vallarta (Colombia y Argentina, Col. 5 de Diciembre). 150 g beef, Monterey Jack, bacon, salsa Chicana and fries. Open Mon–Sat 6:30–11 PM. Reserve your table online.",
  keywords: ["Chicano Burger", "burgers Puerto Vallarta", "hamburguesas Puerto Vallarta", "5 de Diciembre", "reservations"],
  openGraph: {
    title: "Chicano Burger · Puerto Vallarta",
    description: "Cali-style burgers with street-food soul. Reserve your table.",
    images: ["/images/burger-hand.jpg"],
    locale: "es_MX",
    alternateLocale: ["en_US"],
    type: "website",
  },
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#0b0a09" };

const schema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: RESTAURANT.name,
  servesCuisine: ["American", "Burgers"],
  priceRange: "$",
  telephone: RESTAURANT.phoneE164,
  acceptsReservations: true,
  address: {
    "@type": "PostalAddress",
    streetAddress: RESTAURANT.street,
    addressLocality: "Puerto Vallarta",
    addressRegion: "Jalisco",
    postalCode: RESTAURANT.postalCode,
    addressCountry: "MX",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "18:30",
      closes: "23:00",
    },
  ],
  sameAs: [RESTAURANT.instagramUrl, RESTAURANT.facebookUrl],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: RESTAURANT.googleReviewCount },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable} ${gothic.variable}`}>
      <body className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        {children}
      </body>
    </html>
  );
}
