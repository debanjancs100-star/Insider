export function SiteFooter() {
  return (
    <footer className="p-8 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        © {new Date().getFullYear()} INSIDER Marketplace
      </div>
      <div>
        <span className="block text-[10px] uppercase text-muted-foreground mb-2 tracking-widest">Contact</span>
        <span className="text-xs">hq@insider.build</span>
      </div>
    </footer>
  );
}
