import { Github, Mail } from "lucide-react";
import { getAboutProfile } from "../../lib/about";

export function ContactCard() {
  const profile = getAboutProfile();

  return (
    <div className="p-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      <h3 className="text-lg font-semibold mb-4">联系方式</h3>
      <div className="flex flex-wrap gap-3">
        {profile.github && (
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        )}
        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            邮箱
          </a>
        )}
      </div>
    </div>
  );
}
