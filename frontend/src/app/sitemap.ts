import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { getBlogPostEntries } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const lastModified = new Date();
  const blogEntries = getBlogPostEntries();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/search/frame`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/search/highlight`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/results`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogEntries.map((entry) => ({
      url: `${siteUrl}/blog/${entry.slug}`,
      lastModified: new Date(entry.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
