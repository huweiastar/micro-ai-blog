import { getGalleryPhotos } from "../../lib/gallery";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import { ImageIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "相册",
  description: "镜头里的片刻与风景",
  url: "/gallery",
});

export default function GalleryPage() {
  const photos = getGalleryPhotos();

  return (
    <>
      <PageHeader
        title="相册"
        description="镜头里的片刻与风景"
        count={photos.length}
        countLabel="张"
      />
      <Container className="pb-16">
        {photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-20 text-center">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]/60" />
            <p className="text-sm text-[var(--muted)]">
              相册还空着，往 <code className="font-mono">content/gallery.yaml</code> 添加照片即可。
            </p>
          </div>
        ) : (
          // 瀑布流：CSS columns，点击任意图经全局 ImageZoom 放大（容器带 data-zoomable）
          <div
            data-zoomable
            className="columns-2 gap-4 sm:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid"
          >
            {photos.map((photo, i) => (
              <figure
                key={photo.src + i}
                className="group relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.title || "相册照片"}
                  loading="lazy"
                  className="w-full cursor-zoom-in object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {(photo.title || photo.date || photo.location) && (
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {photo.title && (
                      <div className="text-sm font-medium">{photo.title}</div>
                    )}
                    {(photo.date || photo.location) && (
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-white/80">
                        {photo.date && (
                          <span className="font-mono tabular-nums">{photo.date}</span>
                        )}
                        {photo.location && <span>· {photo.location}</span>}
                      </div>
                    )}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
