"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, X } from "lucide-react";

interface Photo {
  id: number;
  src: string;
  title: string | null;
  date: string | null;
  location: string | null;
  album: string;
}

interface AlbumGroup {
  album: string;
  photos: Photo[];
}

interface AlbumGridProps {
  albums: AlbumGroup[];
}

const STACK_ANGLES = [-4, 0, 3];
const FAN_ANGLES = [-12, 0, 12];
const FAN_Y = [-4, -10, -4];

export function AlbumGrid({ albums }: AlbumGridProps) {
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  if (albums.length === 0) {
    return (
      <div className="py-20 text-center text-[var(--muted)]">
        <ImageIcon className="mx-auto mb-4 h-10 w-10 opacity-50" />
        <p>相册还是空的，快来添加照片吧。</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((group, idx) => (
          <motion.div
            key={group.album}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <AlbumCard
              group={group}
              isExpanded={expandedAlbum === group.album}
              onToggle={() =>
                setExpandedAlbum(expandedAlbum === group.album ? null : group.album)
              }
              onPhotoClick={(photo) => setLightboxPhoto(photo)}
            />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              src={lightboxPhoto.src}
              alt={lightboxPhoto.title || ""}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxPhoto.title && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-white backdrop-blur-sm">
                <p className="font-medium">{lightboxPhoto.title}</p>
                {lightboxPhoto.location && (
                  <p className="text-sm opacity-80">{lightboxPhoto.location}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AlbumCard({
  group,
  isExpanded,
  onToggle,
  onPhotoClick,
}: {
  group: AlbumGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onPhotoClick: (photo: Photo) => void;
}) {
  const covers = group.photos.slice(0, 3);

  return (
    <div className={isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}>
      <motion.div
        layout
        className="relative cursor-pointer rounded-xl bg-white/50 p-4 backdrop-blur-xl dark:bg-[var(--card)]/60"
        onClick={onToggle}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-[var(--foreground)]">
            {group.album === "default" ? "默认相册" : group.album}
          </h3>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            {group.photos.length} 张
          </span>
        </div>

        {!isExpanded && (
          <div className="relative mx-auto h-48 w-full max-w-xs">
            {covers.map((photo, i) => (
              <motion.div
                key={photo.id}
                className="absolute inset-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5"
                animate={{
                  rotate: STACK_ANGLES[i] ?? 0,
                  y: i * 12,
                  scale: 1 - i * 0.04,
                }}
                whileHover={{
                  rotate: FAN_ANGLES[i] ?? 0,
                  y: FAN_Y[i] ?? 0,
                  scale: i === 1 ? 1 : 0.95,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ zIndex: i + 1 }}
              >
                <img
                  src={photo.src}
                  alt={photo.title || ""}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {group.photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoClick(photo);
                  }}
                >
                  <img
                    src={photo.src}
                    alt={photo.title || ""}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {photo.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs text-white">{photo.title}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
