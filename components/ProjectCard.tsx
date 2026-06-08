"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, ExternalLink, Star, ArrowUpRight } from "lucide-react";
import { GeneratedCover } from "./ui/GeneratedCover";
import type { Project } from "../types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(project.cover) && !coverFailed;

  return (
    <div
      className="group relative glass rounded-xl p-6 overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 active:scale-[0.99] cursor-pointer flex flex-col"
      onClick={() => router.push(`/projects/${project.slug}`)}
    >
      {/* Cover banner — falls back to deterministic generated artwork when absent or broken */}
      <div className="mb-4 -mx-6 -mt-6 h-40 overflow-hidden rounded-t-xl">
        {showCover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={project.cover}
            alt={project.name}
            onError={() => setCoverFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <GeneratedCover
            seed={project.slug}
            label={project.name}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-xl font-semibold mb-3 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300 flex items-center gap-2">
          <span className="line-clamp-1">{project.name}</span>
          <Star className="w-4 h-4 shrink-0 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-[var(--primary)]" />
        </h3>

        <p className="text-[var(--muted)] text-sm mb-5 leading-relaxed line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
            >
              {tech}
            </span>
          ))}
        </div>

        <ul className="space-y-2 mb-5">
          {project.highlights.slice(0, 4).map((highlight, index) => (
            <li key={index} className="text-sm text-[var(--muted)] flex items-start gap-2">
              <span className="text-[var(--primary)] mt-0.5 font-bold">+</span>
              <span className="flex-1">{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-4 pt-3 mt-auto border-t border-[var(--card-border)]">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors duration-200 group/link"
            >
              <Github className="w-4 h-4" />
              <span className="group-hover/link:underline">GitHub</span>
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors duration-200 group/link"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="group-hover/link:underline">在线演示</span>
            </a>
          )}
          <span className="inline-flex items-center gap-1 text-sm text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors duration-200 ml-auto">
            <span>详情</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
