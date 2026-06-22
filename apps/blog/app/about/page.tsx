import { generatePageMetadata } from "../../lib/seo";
import { SkillGroup } from "../../components/profile/SkillGroup";
import { ContactCard } from "../../components/profile/ContactCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { Container } from "../../components/ui/Container";
import { api } from "../../lib/api/client";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "关于我",
  description: "个人介绍、技术栈和联系方式",
});

export default async function AboutPage() {
  let profile: {
    name: string;
    avatar: string | null;
    bio: string | null;
    tagline: string | null;
    skills: Array<{ title: string; items: string[] }>;
  } = {
    name: "博主",
    avatar: null,
    bio: null,
    tagline: null,
    skills: [],
  };

  try {
    const data = await api.about.get();
    profile = {
      name: data.profile.name,
      avatar: data.profile.avatar,
      bio: data.profile.bio,
      tagline: data.profile.tagline,
      skills: data.profile.skills.map((s) => ({
        title: (s as any).title || (s as any).category || "技能",
        items: (s as any).items || [],
      })),
    };
  } catch (err) {
    console.error("Failed to fetch about profile from API:", err);
  }

  return (
    <>
      {/* 头图氛围区 */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--primary)]/15 via-[var(--accent)]/5 to-transparent"
        />
        <Container className="relative py-14 text-center">
          {profile.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt={profile.name}
              className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[var(--primary)]/20"
            />
          )}
          <h1 className="mt-4 text-2xl font-black text-[var(--foreground)]">👋 {profile.name}</h1>
          {profile.tagline && <p className="mt-2 text-sm text-[var(--muted)]">{profile.tagline}</p>}
        </Container>
      </div>

      <Container className="pb-12">
        <GlassCard className="mb-8 p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-semibold">个人简介</h2>
          <div className="prose-custom max-w-none">
            {(profile.bio || "").split("\n\n").map((para, i) => (
              <p key={i} className="mb-4 leading-relaxed text-[var(--muted)]">
                {para}
              </p>
            ))}
          </div>
        </GlassCard>

        <section className="mb-8">
          <h2 className="mb-6 text-xl font-semibold">技术栈</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.skills.map((group, i) => (
              <GlassCard key={group.title} hover className="p-5">
                <SkillGroup title={group.title} items={group.items} hueIndex={i} />
              </GlassCard>
            ))}
          </div>
        </section>

        <ContactCard />
      </Container>
    </>
  );
}
