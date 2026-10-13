import type { LocalBusiness, Organization, PostalAddress, TravelAgency, WithContext } from "schema-dts";

import { getOgImageUrl, type SiteSettings } from "./siteSettings";

export type OrganizationJsonLd = WithContext<TravelAgency | LocalBusiness | Organization>;

// Drop null/undefined values so the emitted JSON-LD only contains filled fields.
function compact<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined),
  ) as Partial<T>;
}

export function buildOrganizationJsonLd(settings: SiteSettings | null): OrganizationJsonLd | null {
  if (!settings?.organizationType) return null;

  const address = settings.address
    ? (compact({ "@type": "PostalAddress", ...settings.address }) as PostalAddress)
    : undefined;

  return compact({
    "@context": "https://schema.org",
    "@type": settings.organizationType,
    name: settings.siteName,
    legalName: settings.legalName,
    url: settings.siteUrl,
    logo: settings.logo?.asset?.url,
    image: getOgImageUrl(settings),
    telephone: settings.telephone,
    email: settings.email,
    address,
    sameAs: settings.sameAs?.length ? settings.sameAs : undefined,
  }) as OrganizationJsonLd;
}

// Escape "<" so a value containing "</script>" cannot break out of the tag.
// See node_modules/next/dist/docs/01-app/02-guides/json-ld.md.
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
