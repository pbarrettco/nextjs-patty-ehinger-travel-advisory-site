import { type SanityDocument } from "next-sanity";

import { client } from "./sanity/client";

const POSTS_QUERY = `*[
  _type == "bio"
  && defined(name)
]|order(name desc)[0...12]{_id, name, jobTitle}`;

const options = { next: {revalidate: 30 } };

export default async function IndexPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <main>
      <h1>Team Members</h1>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <h2>{post.name}</h2>
            <p>Title: {post.jobTitle}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}