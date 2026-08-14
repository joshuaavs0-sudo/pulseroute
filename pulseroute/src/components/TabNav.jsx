export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="bg-white border border-border rounded-xl p-1.5 flex flex-wrap gap-1 mt-4 shadow-card">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200
              ${isActive
                ? 'bg-brand/10 text-brand'
                : 'text-mute hover:text-ink hover:bg-soft'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}