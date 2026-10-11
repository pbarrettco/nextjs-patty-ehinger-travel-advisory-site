import { notFound } from "next/navigation";
import { PortableText, type PortableTextBlock } from "next-sanity";

import ApplicationForm from "@/components/ApplicationForm";

import { client } from "../../sanity/client";

type CareersPosting = {
    jobTitle: string;
    slug: string;
    jobDescription?: PortableTextBlock[];
};

const POSTING_QUERY = `*[_type == "careersPosting" && slug.current == $slug][0]{
  jobTitle,
  "slug": slug.current,
  jobDescription,
}`;

const SLUGS_QUERY = `*[_type == "careersPosting" && defined(slug.current)]{
  "slug": slug.current,
}`;

const options = { next: { revalidate: 30 } };

export async function generateStaticParams() {
    return client.fetch<{ slug: string }[]>(SLUGS_QUERY);
}

export async function generateMetadata(props: PageProps<"/careers/[slug]">) {
    const { slug } = await props.params;
    const post = await client.fetch<CareersPosting | null>(POSTING_QUERY, { slug }, options);
    return { title: post?.jobTitle ?? "Careers" };
}

export default async function CareersPostingPage(props: PageProps<"/careers/[slug]">) {
    const { slug } = await props.params;
    const post = await client.fetch<CareersPosting | null>(POSTING_QUERY, { slug }, options);
    if (!post) notFound();

    return (
        <main>
            <section className="careers-posting">
                <h1>{post.jobTitle}</h1>
                {post.jobDescription && <PortableText value={post.jobDescription} />}
                <ApplicationForm slug={post.slug} jobTitle={post.jobTitle} />
            </section>
        </main>
    )
}
