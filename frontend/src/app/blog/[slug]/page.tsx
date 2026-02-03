import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getSiteUrl } from "@/lib/site";
import { getBlogPostByLocale } from "@/content/blog";

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleFromCookies();
  const post = getBlogPostByLocale(slug, locale);
  if (!post) {
    return {};
  }
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const title = `${post.title} | Spot This Fit`;
  const description = post.description;
  const url = `${siteUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocaleFromCookies();
  const post = getBlogPostByLocale(slug, locale);
  if (!post) {
    notFound();
  }

  const t = createTranslator(locale);
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: articleUrl,
    author: {
      "@type": "Organization",
      name: "Spot This Fit",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Spot This Fit",
      url: siteUrl,
    },
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <Link
          href="/blog"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          {t("blog.back")}
        </Link>
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(post.date, locale)}</span>
            <span className="text-muted-foreground/60">•</span>
            <span>{post.readingTime}</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <p className="text-base text-muted-foreground">{post.description}</p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <section className="flex flex-col gap-4 text-base leading-relaxed text-foreground">
          {post.blocks.map((block, index) => {
            const text = "text" in block ? block.text[locale] ?? block.text.en : undefined;
            const items =
              "items" in block ? block.items[locale] ?? block.items.en : undefined;
            if (block.type === "h2") {
              return (
                <h2
                  key={`${block.type}-${index}`}
                  className="pt-4 text-2xl font-semibold text-foreground"
                >
                  {text}
                </h2>
              );
            }
            if (block.type === "h3") {
              return (
                <h3
                  key={`${block.type}-${index}`}
                  className="pt-2 text-xl font-semibold text-foreground"
                >
                  {text}
                </h3>
              );
            }
            if (block.type === "ul") {
              return (
                <ul
                  key={`${block.type}-${index}`}
                  className="list-disc space-y-2 pl-5 text-muted-foreground"
                >
                  {(items ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote
                  key={`${block.type}-${index}`}
                  className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground"
                >
                  {text}
                </blockquote>
              );
            }
            return (
              <p key={`${block.type}-${index}`} className="text-muted-foreground">
                {text}
              </p>
            );
          })}
        </section>
      </article>
    </div>
  );
}
