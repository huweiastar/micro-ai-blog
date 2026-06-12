import { generatePageMetadata } from "../../lib/seo";
import { getAboutProfile } from "../../lib/about";
import { SkillGroup } from "../../components/profile/SkillGroup";
import { ContactCard } from "../../components/profile/ContactCard";
import { PageHeader } from "../../components/ui/PageHeader";
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
      <PageHeader title="关于我" description="个人介绍、技术栈和联系方式" />
      <Container className="pb-12">
      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">个人简介</h2>
        <div className="prose-custom max-w-none">
          {profile.bio.split("\n\n").map((para, i) => (
            <p key={i} className="text-[var(--muted)] leading-relaxed mb-4">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">技术栈</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profile.skills.map((group, i) => (
            <div
              key={group.title}
              className="glass rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
            >
              <SkillGroup title={group.title} items={group.items} hueIndex={i} />
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <ContactCard />
      </Container>
    </>
  );
}
