export interface GalleryPhoto {
  id: number;
  src: string;
  title: string | null;
  date: string | null;
  location: string | null;
  album: string;
  sortOrder: number;
  createdAt: string;
}

export interface AlbumGroup {
  album: string;
  photos: GalleryPhoto[];
}
