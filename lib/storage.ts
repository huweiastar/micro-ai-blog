import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type StoredImage = {
  url: string;
  name: string;
  dir: string;
  size: number;
  mtime: number;
};

/** S3 五项必需配置齐全才启用对象存储，否则调用方回退本地文件模式。 */
export function s3Configured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_BASE_URL
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "auto",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  });
  return client;
}

function publicBase(): string {
  return (process.env.S3_PUBLIC_BASE_URL as string).replace(/\/$/, "");
}

/** 上传并返回公开访问 URL。文件名含时间戳随机串，天然不可变，缓存设一年。 */
export async function putImage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${publicBase()}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
  );
}

/** 列出 images/ 前缀下全部对象（分页拉全）。 */
export async function listImages(): Promise<StoredImage[]> {
  const items: StoredImage[] = [];
  let token: string | undefined;
  do {
    const res = await getClient().send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: "images/",
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents || []) {
      if (!obj.Key) continue;
      const rel = obj.Key.replace(/^images\//, "");
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      items.push({
        url: `${publicBase()}/${obj.Key}`,
        name: rel.slice(rel.lastIndexOf("/") + 1),
        dir,
        size: obj.Size ?? 0,
        mtime: obj.LastModified ? obj.LastModified.getTime() : 0,
      });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return items;
}

/** 从公开 URL 反解出对象 Key；非本桶 URL 返回 null（调用方走本地删除）。 */
export function keyFromUrl(url: string): string | null {
  if (!s3Configured()) return null;
  const base = publicBase() + "/";
  return url.startsWith(base) ? url.slice(base.length) : null;
}
