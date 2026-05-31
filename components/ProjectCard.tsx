"use client";

import { useRouter } from "next/navigation";
import { Github, ExternalLink, Star, Code2, ArrowUpRight } from "lucide-react";
import type { Project } from "../types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <div
      className="group relative glass rounded-xl p-6 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--primary)]/20 hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      onClick={() => router.push(`/projects/${project.slug}`)}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Animated corner accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary)]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      {/* Icon badge */}
      <div className="relative z-10 mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:shadow-[var(--primary)]/30">
          <Code2 className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text group-hover:from-[var(--primary)] group-hover:to-[var(--accent)] transition-all duration-300 flex items-center gap-2">
          <span>{project.name}</span>
          <Star className="w-4 h-4 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-[var(--primary)]" />
        </h3>

        <p className="text-[var(--muted)] text-sm mb-5 leading-relaxed group-hover:text-[var(--foreground)] transition-colors duration-300">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10 text-[var(--primary)] border border-[var(--primary)]/20 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-[var(--primary)]/20 transition-all duration-200"
            >
              {tech}
            </span>
          ))}
        </div>

        <ul className="space-y-2 mb-5">
          {project.highlights.map((highlight, index) => (
            <li key={index} className="text-sm text-[var(--muted)] flex items-start gap-2 group-hover:text-[var(--foreground)] transition-colors duration-200">
              <span className="text-[var(--primary)] mt-0.5 font-bold group-hover:scale-125 group-hover:rotate-12 transition-transform duration-200">+</span>
              <span className="flex-1">{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-4 pt-3 border-t border-[var(--card-border)]">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-105 group/link"
            >
              <Github className="w-4 h-4 group-hover/link:rotate-12 transition-transform duration-200" />
              <span className="group-hover/link:underline">GitHub</span>
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-all duration-200 hover:scale-105 group/link"
            >
              <ExternalLink className="w-4 h-4 group-hover/link:-rotate-12 transition-transform duration-200" />
              <span className="group-hover/link:underline">在线演示</span>
            </a>
          )}
          <span className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-all duration-200 ml-auto">
            <span>详情</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}
