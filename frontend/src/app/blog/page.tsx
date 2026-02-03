import type { Metadata } from "next";
import Link from "next/link";
import { createTranslator } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getSiteUrl } from "@/lib/site";
import { getAllBlogPosts } from "@/content/blog";

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);
  const title = `${t("blog.title")} | Spot This Fit`;
  const description = t("blog.subtitle");

  return {
    title,
    description,
    alternates: { canonical: "/blog" },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/blog",
    },
  };
}

export default async function BlogIndexPage() {
  const locale = await getLocaleFromCookies();
  const t = createTranslator(locale);
  const posts = getAllBlogPosts(locale);
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("blog.title"),
    url: `${siteUrl}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t("blog.title")}
          </p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            {t("blog.title")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("blog.subtitle")}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex h-full flex-col justify-between rounded-2xl border border-border bg-white/70 p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(post.date, locale)}</span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{post.readingTime}</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
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
              </div>
              <div className="mt-6">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {t("blog.readArticle")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
