import { useRef, useState } from 'react';
import type { ClickEffectType } from './ClickEffectLayer';

export interface ProjectCardProps {
  slug: string;
  title: string;
  cover: string;
  description: string;
  techStack: string[];
  clickEffect?: ClickEffectType;
}

export default function ProjectCard({
  slug,
  title,
  cover,
  description,
  techStack,
  clickEffect = 'none'
}: ProjectCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLAnchorElement>(null);
  const href = `/projects/${slug}`;

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -8, ry: px * 8 });
  }

  function handleMouseLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent('project-navigate', {
        detail: { type: clickEffect, href, x: e.clientX, y: e.clientY }
      })
    );
  }

  return (
    <a
      ref={cardRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
      }}
      className="group panel flex flex-col overflow-hidden rounded-xl border border-border transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-accent hover:shadow-[0_0_28px_-8px_var(--color-accent)]"
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
              className="rounded border border-border bg-ink-900 px-2 py-0.5 font-mono text-xs text-accent-2 transition-colors group-hover:border-accent-2/60"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
