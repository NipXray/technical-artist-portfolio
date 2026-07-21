import { useState } from 'react';

export interface ProjectCardProps {
  slug: string;
  title: string;
  cover: string;
  description: string;
  techStack: string[];
}

export default function ProjectCard({ slug, title, cover, description, techStack }: ProjectCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={`/projects/${slug}`}
      className="group panel flex flex-col overflow-hidden rounded-lg border border-border transition-colors hover:border-accent"
    >
      <div className="relative aspect-video overflow-hidden bg-ink-900">
        {!imgFailed ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-paper-dim">
            no_preview.png
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-paper transition-colors group-hover:text-accent">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-paper-dim">{description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded border border-border bg-ink-900 px-2 py-0.5 font-mono text-xs text-accent-2"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
