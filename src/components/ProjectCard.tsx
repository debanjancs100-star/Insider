import { Link } from 'react-router-dom';
import { useMediaUrl } from '../lib/hooks';
import { formatMoneyRange } from '../lib/format';
import type { Listing } from '../lib/amplify';

export function ProjectCard({ project }: { project: Listing }) {
  const cover = useMediaUrl(project.coverPath);
  return (
    <Link to={`/projects/${project.slug}`} className="group block bg-card p-6 border border-border hover:border-brand/50 transition-colors">
      <div className="w-full aspect-[4/3] bg-surface mb-6 overflow-hidden">
        {cover ? (
          <img src={cover} alt={project.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{project.title}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-medium">{project.title}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{project.location || 'Location TBA'}</p>
        </div>
        <span className="block text-brand text-sm font-semibold tracking-tighter text-right">
          {formatMoneyRange(project.priceFrom, project.priceTo, project.currency)}
        </span>
      </div>
    </Link>
  );
}
