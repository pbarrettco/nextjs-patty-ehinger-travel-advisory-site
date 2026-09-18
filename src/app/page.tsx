import Image from "next/image";
import { type SanityDocument } from "next-sanity";

import { client } from "./sanity/client";
import { urlFor } from "./sanity/image";

const POSTS_QUERY = `*[
  _type == "bio"
  && defined(name)
]|order(name desc)[0...12]{
  _id,
  name,
  jobTitle,
  headshot{
    asset->{_id, url, metadata{lqip, dimensions}},
    hotspot,
    crop
  }
}`;

const options = { next: {revalidate: 30 } };

export default async function IndexPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <main>
      <section id="hero">
        <hgroup>
          <h1>Luxury Travel Advisor</h1>
          <p>A considered practice <i>for the way you travel.</i></p>
        </hgroup>
        <picture>
          <source media="(min-width: 769px)" srcSet="/hero_d@2x.jpg" width="1400" height="700" />
          <img src="/hero_m@2x.jpg" alt="Image of a woman relaxing on vacation" width="390" height="702" />
        </picture>
      </section>
      <section id="about">
        <h2>About</h2>
        <p><i>We are a boutique travel advisory for a select group of families and individuals.</i> We deliver five-star experiences with honest counsel and a deep understanding of your life, helping you spend your most valuable currency, time, extraordinarily well. In association with Local Foreigner.</p>
      </section>
      <section id="our-team">
        <h2>Meet our team</h2>
        <p>“I've spent years building this practice around a simple belief: that travel is one of the most meaningful ways we spend our time, and that planning it beautifully takes real care and expertise.</p>
        <p>My team and I work with a limited number of clients so that every journey receives the attention it deserves, and everything we recommend is grounded in firsthand experience. We're constantly traveling ourselves, staying in the hotels we recommend, meeting the guides we rely on, and deepening the partner relationships that enable us to open doors for our clients, including our affiliation with Local Foreigner.” — Patty</p>
        <ul>
        {posts.map((post) => (
          <li key={post._id}>
            {post.headshot?.asset && (
              <Image
                src={urlFor(post.headshot).width(646).height(810).fit("crop").url()}
                alt={`${post.name} headshot`}
                width={323}
                height={405}
                placeholder={post.headshot.asset.metadata?.lqip ? "blur" : "empty"}
                blurDataURL={post.headshot.asset.metadata?.lqip}
              />
            )}
            <h2>{post.name}</h2>
            <p>Title: {post.jobTitle}</p>
          </li>
        ))}
      </ul>
      </section>
      <section id="contact">
        <h2>Contact us</h2>
        <a href="mailto:patty.ehinger@localforeigner.com" target="_blank" rel="noopener noreferrer">patty.ehinger@localforeigner.com</a>
      </section>
      <section id="social">
        <div>
          <h2>The latest from our feed</h2>
          <a href="#" target="_blank" rel="noopener noreferrer">@pattyehingertravel</a>
        </div>
          <ul>
            <li>&nbsp;</li>
            <li>&nbsp;</li>
            <li>&nbsp;</li>
            <li>&nbsp;</li>
            <li className="desktop">&nbsp;</li>
          </ul>
      </section>
    </main>
  );
}