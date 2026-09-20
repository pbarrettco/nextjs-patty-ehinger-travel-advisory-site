import Image from "next/image";

import { getSocialTiles } from "@/app/feedframer/client";

// The design is a fixed strip: 4 tiles on mobile, 5 on desktop, where the 5th
// carries .desktop.
const TILE_COUNT = 5;

export default async function SocialFeed() {
  const tiles = await getSocialTiles(TILE_COUNT);

  // No feed, no grid — the section keeps its heading and handle link rather
  // than showing empty tiles or erroring the page.
  if (tiles.length === 0) return null;

  // Bare <ul> so section#social ul li in index.scss still matches.
  return (
    <ul>
      {tiles.map((tile, index) => (
        <li
          key={tile.id}
          className={index === TILE_COUNT - 1 ? "desktop" : undefined}
        >
          <a href={tile.permalink} target="_blank" rel="noopener noreferrer">
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              // Tiles are 1:1.25 portrait and crop square posts with
              // object-fit: cover, so the browser needs roughly 1.25x the
              // tile's width in source pixels to stay sharp. Tile width is
              // (100vw - 46px) / 2 on mobile and (100vw - 124px) / 5 above
              // 769px, once padding and gaps are subtracted.
              sizes="(max-width: 768px) 63vw, 25vw"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
