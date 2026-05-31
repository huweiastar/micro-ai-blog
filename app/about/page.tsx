import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import { getAboutProfile } from "../../lib/about";
import { SkillGroup } from "../../components/profile/SkillGroup";
import { ContactCard } from "../../components/profile/ContactCard";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "关于我",
  description: "个人介绍、技术栈和联系方式",
});

export default function AboutPage() {
  const profile = getAboutProfile();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">关于我</h1>

      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">个人简介</h2>
        <div className="prose-custom max-w-none">
          <p className="text-[var(--muted)] leading-relaxed">
            {profile.bio}
          </p>
          <p className="text-[var(--muted)] leading-relaxed mt-4">
            {profile.bio2}
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">技术栈</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.skills.map((group) => (
            <div
              key={group.title}
              className="p-5 rounded-xl border border-[var(--card-border)] bg-[var(--card)]"
            >
              <SkillGroup title={group.title} items={group.items} />
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <ContactCard />
    </div>
  );
}
