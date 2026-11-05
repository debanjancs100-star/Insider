import { Link } from "@tanstack/react-router";
import { formatMoneyRange } from "@/lib/format";

type Project = {
  slug: string;
  title: string;
  location: string | null;
  cover_url: string | null;
  price_from: number | null;
  price_to: number | null;
  currency: string | null;
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group block bg-card p-6 border border-border hover:border-brand/50 transition-colors"
    >
      <div className="w-full aspect-[4/3] bg-surface outline outline-1 -outline-offset-1 outline-white/5 mb-6 overflow-hidden">
        {project.cover_url ? (
          <img
            src={project.cover_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {project.title}
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-medium">{project.title}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            {project.location || "Location TBA"}
          </p>
        </div>
        <div className="text-right">
          <span className="block text-brand text-sm font-semibold tracking-tighter">
            {formatMoneyRange(project.price_from, project.price_to, project.currency || "USD")}
          </span>
        </div>
      </div>
    </Link>
  );
}
