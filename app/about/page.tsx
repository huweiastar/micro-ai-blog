import { generatePageMetadata } from "../../lib/seo";
import { getAboutProfile } from "../../lib/about";
import { SkillGroup } from "../../components/profile/SkillGroup";
import { ContactCard } from "../../components/profile/ContactCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { Container } from "../../components/ui/Container";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "关于我",
  description: "个人介绍、技术栈和联系方式",
});

export default function AboutPage() {
  const profile = getAboutProfile();

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
            {profile.bio.split("\n\n").map((para, i) => (
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
