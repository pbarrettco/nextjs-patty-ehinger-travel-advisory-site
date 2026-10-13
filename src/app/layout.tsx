import type { Metadata, Viewport } from "next";
import "@/sass/index.scss";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCareers } from "./sanity/careers";
import { buildOrganizationJsonLd, serializeJsonLd } from "./sanity/jsonLd";
import { getOgImageUrl, getSiteSettings, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "./sanity/siteSettings";

const FALLBACK_TITLE = "Patty Ehinger Luxury Travel Advisory";

function parseSiteUrl(siteUrl: string | null): URL | undefined {
  if (!siteUrl) return undefined;
  try {
    return new URL(siteUrl);
  } catch {
    console.error(`siteSettings.siteUrl is not a valid URL: ${siteUrl}`);
    return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  if (!s) return { title: FALLBACK_TITLE };

  const metadataBase = parseSiteUrl(s.siteUrl);
  const siteName = s.siteName ?? s.title ?? FALLBACK_TITLE;
  const ogImageUrl = getOgImageUrl(s);

  return {
    metadataBase,
    title: {
      default: s.title ?? siteName,
      template: `%s | ${siteName}`,
    },
    description: s.description ?? undefined,
    // Relative URLs only resolve when metadataBase is set; without it they
    // would be a build error.
    alternates: metadataBase ? { canonical: "/" } : undefined,
    openGraph: {
      type: "website",
      siteName: s.siteName ?? undefined,
      title: s.title ?? undefined,
      description: s.description ?? undefined,
      url: metadataBase ? "/" : undefined,
      images: ogImageUrl
        ? [{ url: ogImageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: s.ogImage?.alt ?? "" }]
        : undefined,
    },
    robots: s.noIndex ? { index: false, follow: false } : undefined,
    icons: {
      icon: s.favicon?.asset?.url
        ? [{ url: s.favicon.asset.url, type: s.favicon.asset.mimeType ?? undefined }]
        : undefined,
      apple: s.appleTouchIcon?.asset?.url ?? undefined,
    },
    verification: {
      google: s.googleSiteVerification ?? undefined,
      other: s.bingSiteVerification ? { "msvalidate.01": s.bingSiteVerification } : undefined,
    },
  };
}

// themeColor lives in viewport, not metadata (moved in Next 15).
export async function generateViewport(): Promise<Viewport> {
  const s = await getSiteSettings();
  return { themeColor: s?.themeColor ?? undefined };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [careers, siteSettings] = await Promise.all([getCareers(), getSiteSettings()]);
  const organizationJsonLd = buildOrganizationJsonLd(siteSettings);

  return (
    <html
      lang="en"
    >
      <body>
        {organizationJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
          />
        )}
        <Header showCareers={careers.length > 0} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
