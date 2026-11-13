import { useParams } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { ProjectCard } from '../components/ProjectCard';
import { api } from '../lib/amplify';
import { useAsync, useMediaUrl } from '../lib/hooks';

export default function Company() {
  const { slug = '' } = useParams();
  const { data, loading, error } = useAsync(() => api.getCompany(slug), [slug]);
  const logo = useMediaUrl(data?.profile.logoPath);

  if (loading) return <div className="min-h-screen"><SiteNav /></div>;
  if (error) return <div className="p-10">{error.message}</div>;
  if (!data) return <div className="min-h-screen"><SiteNav /><div className="p-10">Company not found</div></div>;
  const { profile, projects } = data;

  return (
    <div className="min-h-screen">
      <title>{`${profile.companyName} — INSIDER`}</title>
      <SiteNav />
      <section className="p-6 md:p-16 border-b border-border">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">{profile.verified ? 'Verified developer' : 'Developer'}</p>
        <div className="flex items-center gap-6">
          {logo && <img src={logo} alt="" className="w-20 h-20 object-cover border border-border" />}
          <div>
            <h1 className="text-5xl font-serif italic">{profile.companyName}</h1>
            {profile.website && /^https?:\/\//i.test(profile.website) && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-brand uppercase tracking-widest hover:underline mt-2 inline-block">{profile.website}</a>
            )}
          </div>
        </div>
        {profile.bio && <p className="max-w-2xl text-sm text-muted-foreground mt-6">{profile.bio}</p>}
      </section>
      <section className="p-6 md:p-8">
        <h2 className="text-2xl font-serif italic mb-6">Current listings</h2>
        {projects.length === 0 ? <p className="text-muted-foreground text-sm">No published listings.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{projects.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
