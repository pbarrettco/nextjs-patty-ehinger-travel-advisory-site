// Feedframer exposes a single endpoint keyed by api_key — the key itself
// identifies the connected Instagram account (hence /me), so there is no
// connection id to configure here.
const FEEDFRAMER_ME = "https://feedframer.com/api/v1/me";

// The free tier caps a page at 6. Asking for all 6 and trimming after
// filtering means one unrenderable post costs a spare, not a visible tile.
const PAGE_SIZE = 6;

// Media must come from a host allowlisted in next.config.ts, or <Image> throws
// and takes the whole page down with it. Keep this in sync with that config.
const ALLOWED_MEDIA_HOSTS = new Set(["cdn.feedframer.com"]);

// The feed is decoration, not content — it never holds the homepage's TTFB
// hostage.
const TIMEOUT_MS = 5000;

type FeedframerMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";

type FeedframerPost = {
  id: string;
  caption: string | null;
  altText: string | null;
  mediaType: FeedframerMediaType;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
};

type FeedframerMe = {
  username: string;
  posts: FeedframerPost[];
};

// Flattened to plain props the way page.tsx already flattens Sanity documents,
// so the component stays free of upstream response shape.
export type SocialTile = {
  id: string;
  src: string;
  permalink: string;
  alt: string;
};

// For VIDEO/REELS the mediaUrl is the raw mp4, so only the poster frame is
// usable and there is deliberately no fallback to mediaUrl. CAROUSEL_ALBUM
// already reports its first child image as mediaUrl.
function stillImageUrl(post: FeedframerPost): string | null {
  const isVideo = post.mediaType === "VIDEO" || post.mediaType === "REELS";
  const url = isVideo ? post.thumbnailUrl : (post.mediaUrl ?? post.thumbnailUrl);
  if (!url) return null;

  try {
    if (!ALLOWED_MEDIA_HOSTS.has(new URL(url).hostname)) return null;
  } catch {
    return null;
  }

  return url;
}

// The image is the link's only content, so an empty alt would leave the link
// with no accessible name. Free-tier posts report altText: null and an empty
// caption, hence the handle-based last resort.
function altFor(post: FeedframerPost, username: string): string {
  const caption = post.caption?.replace(/\s+/g, " ").trim();

  return (
    post.altText?.trim() ||
    (caption ? caption.slice(0, 120) : `Instagram post from @${username}`)
  );
}

export async function getSocialTiles(limit: number): Promise<SocialTile[]> {
  const apiKey = process.env.FEEDFRAMER_API_KEY;

  if (!apiKey) {
    // An empty feed is indistinguishable from an upstream outage, so say why
    // while developing.
    if (process.env.NODE_ENV === "development") {
      console.warn("FEEDFRAMER_API_KEY is not set — the social feed will be empty.");
    }
    return [];
  }

  try {
    const response = await fetch(
      `${FEEDFRAMER_ME}?api_key=${encodeURIComponent(apiKey)}&page[size]=${PAGE_SIZE}`,
      {
        // Matches Feedframer's own recommendation and their 1 hour edge cache;
        // the feed only refreshes daily on the free tier anyway.
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!response.ok) return [];

    const data = (await response.json()) as FeedframerMe;
    if (!Array.isArray(data?.posts)) return [];

    return data.posts
      .map((post) => {
        const src = stillImageUrl(post);
        if (!src || !post.permalink) return null;

        return {
          id: post.id,
          src,
          permalink: post.permalink,
          alt: altFor(post, data.username),
        };
      })
      .filter((tile): tile is SocialTile => tile !== null)
      .slice(0, limit);
  } catch {
    // Network error, timeout, or malformed JSON — the caller drops the grid
    // rather than failing the page.
    return [];
  }
}
