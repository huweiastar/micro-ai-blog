import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ManagerHome() {
  redirect(process.env.BLOG_ADMIN_URL || "https://huweiastar.deepai.icu/admin");
}
