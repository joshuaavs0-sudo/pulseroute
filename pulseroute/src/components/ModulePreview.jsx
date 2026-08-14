const COLOR_MAP = {
  red: { stripe: '#E1263F', bg: 'bg-brand/10', text: 'text-brand' },
  blue: { stripe: '#2559E8', bg: 'bg-blue/10', text: 'text-blue' },
  green: { stripe: '#12A150', bg: 'bg-green/10', text: 'text-green' },
  amber: { stripe: '#F5A524', bg: 'bg-amber/10', text: 'text-amber' },
};

export default function ModulePreview({ icon, title, description, bullets, accent = 'blue' }) {
  const c = COLOR_MAP[accent];
  const barHeights = [40, 70, 55, 90, 35, 65];

  return (
    <div
      className="stripe-card rounded-2xl p-8"
      style={{ '--stripe-color': c.stripe }}
    >
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
              {icon}
            </span>
            <span className="text-[10px] font-data uppercase tracking-wider text-mute border border-border rounded-full px-2.5 py-1">
              In development
            </span>
          </div>

          <h2 className="font-display text-xl font-semibold text-ink mt-4">{title}</h2>
          <p className="text-sm text-mute mt-2 max-w-lg leading-relaxed">{description}</p>

          <ul className="mt-5 grid sm:grid-cols-2 gap-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-xs text-ink/80">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${c.bg.replace('/10', '')}`} />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative live-data preview graphic */}
        <div className="md:w-48 shrink-0 rounded-xl bg-soft border border-border p-4 flex flex-col justify-between">
          <p className="text-[10px] font-data uppercase text-mute tracking-wide">Preview data</p>
          <div className="flex items-end gap-1.5 h-20 mt-2">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t mini-bar ${c.bg.replace('/10', '/60')}`}
                style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
          <p className={`text-[11px] font-data font-semibold mt-2 ${c.text}`}>Module activates on build</p>
        </div>
      </div>
    </div>
  );
}