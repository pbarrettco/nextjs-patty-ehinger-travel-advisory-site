import { client } from "./client";

const CAREERS_QUERY = `*[
  _type == "careersPosting"
  && defined(slug.current)
]|order(jobTitle asc){
  _id,
  jobTitle,
  "slug": slug.current,
}`;

export type CareersListing = { _id: string; jobTitle: string; slug: string };

// Shared by the root layout (nav link) and the homepage (careers section);
// identical fetches are memoized, so a render makes one request.
export function getCareers() {
  return client.fetch<CareersListing[]>(CAREERS_QUERY, {}, { next: { revalidate: 30 } });
}
