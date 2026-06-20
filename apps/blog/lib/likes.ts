import { getDb } from "./db";

/** 读取某篇文章的点赞数，以及指定访客是否已点赞。 */
export function getLikes(
  slug: string,
  visitorId?: string
): { count: number; liked: boolean } {
  const db = getDb();
  const row = db.prepare("SELECT count FROM likes WHERE slug = ?").get(slug) as
    | { count: number }
    | undefined;
  const liked = visitorId
    ? Boolean(
        db
          .prepare("SELECT 1 FROM like_voters WHERE slug = ? AND visitor_id = ?")
          .get(slug, visitorId)
      )
    : false;
  return { count: row?.count ?? 0, liked };
}

/** 切换点赞状态（同一访客点赞/取消）。返回最新计数与状态。 */
export function toggleLike(
  slug: string,
  visitorId: string
): { count: number; liked: boolean } {
  const db = getDb();
  const now = new Date().toISOString();
  const txn = db.transaction((): { count: number; liked: boolean } => {
    const removed = db
      .prepare("DELETE FROM like_voters WHERE slug = ? AND visitor_id = ?")
      .run(slug, visitorId);
    let liked: boolean;
    if (removed.changes > 0) {
      db.prepare(
        "UPDATE likes SET count = MAX(0, count - 1), updated_at = ? WHERE slug = ?"
      ).run(now, slug);
      liked = false;
    } else {
      db.prepare("INSERT INTO like_voters (slug, visitor_id) VALUES (?, ?)").run(
        slug,
        visitorId
      );
      db.prepare(
        `INSERT INTO likes (slug, count, updated_at) VALUES (?, 1, ?)
         ON CONFLICT(slug) DO UPDATE SET count = count + 1, updated_at = ?`
      ).run(slug, now, now);
      liked = true;
    }
    const row = db.prepare("SELECT count FROM likes WHERE slug = ?").get(slug) as
      | { count: number }
      | undefined;
    return { count: row?.count ?? 0, liked };
  });
  return txn();
}
