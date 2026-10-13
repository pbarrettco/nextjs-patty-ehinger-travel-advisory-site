import { client } from "./client";
import { urlFor } from "./image";

export const SITE_SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  siteName,
  title,
  description,
  siteUrl,
  ogImage{ asset->{ _id, url, metadata{ dimensions } }, hotspot, crop, alt },
  "noIndex": noIndex == true,
  favicon{ asset->{ url, mimeType } },
  appleTouchIcon{ asset->{ url } },
  themeColor,
  googleSiteVerification,
  bingSiteVerification,
  organizationType,
  legalName,
  logo{ asset->{ url } },
  telephone,
  email,
  address,
  sameAs
}`;

export type OrganizationType = "TravelAgency" | "LocalBusiness" | "Organization";

export type SiteSettingsImage = {
  asset: {
    _id: string;
    url: string;
    metadata: { dimensions: { width: number; height: number; aspectRatio: number } | null } | null;
  } | null;
  hotspot: { x: number; y: number; height: number; width: number } | null;
  crop: { top: number; bottom: number; left: number; right: number } | null;
  alt: string | null;
};

export type SiteSettingsAddress = {
  streetAddress: string | null;
  addressLocality: string | null;
  addressRegion: string | null;
  postalCode: string | null;
  addressCountry: string | null;
};

// Every field is nullable: the Studio only requires siteName/title/description/
// siteUrl, and the whole document may be unpublished (the fetch returns null).
export type SiteSettings = {
  siteName: string | null;
  title: string | null;
  description: string | null;
  siteUrl: string | null;
  ogImage: SiteSettingsImage | null;
  noIndex: boolean;
  favicon: { asset: { url: string; mimeType: string | null } | null } | null;
  appleTouchIcon: { asset: { url: string } | null } | null;
  themeColor: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  organizationType: OrganizationType | null;
  legalName: string | null;
  logo: { asset: { url: string } | null } | null;
  telephone: string | null;
  email: string | null;
  address: SiteSettingsAddress | null;
  sameAs: string[] | null;
};

// Shared by generateMetadata, generateViewport and the root layout body;
// identical fetches are memoized, so a render makes one request.
// Never throws: a failed or missing document resolves to null so the site
// still renders with fallbacks.
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await client.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 30 } });
  } catch (error) {
    console.error("Failed to fetch siteSettings from Sanity:", error);
    return null;
  }
}

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// 1200x630 social-sharing crop, shared by Open Graph metadata and JSON-LD.
export function getOgImageUrl(settings: SiteSettings | null): string | undefined {
  if (!settings?.ogImage?.asset) return undefined;
  return urlFor(settings.ogImage).width(OG_IMAGE_WIDTH).height(OG_IMAGE_HEIGHT).fit("crop").url();
}
