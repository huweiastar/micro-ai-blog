import { getSiteUrl } from "../lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 后台与接口不应进入搜索索引。
      disallow: ["/admin", "/api"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
