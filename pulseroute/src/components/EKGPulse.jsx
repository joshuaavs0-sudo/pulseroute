export default function EKGPulse({ active }) {
  return (
    <div className="relative h-8 w-40 overflow-hidden text-brand">
      <div className={`ekg-track ${active ? 'ekg-fast' : ''}`}>
        <EKGPath />
        <EKGPath />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white pointer-events-none" />
    </div>
  );
}

function EKGPath() {
  return (
    <svg width="400" height="32" viewBox="0 0 400 32" className="shrink-0" preserveAspectRatio="none">
      <path
        d="M0,16 L40,16 L52,16 L58,4 L66,28 L74,16 L120,16 L132,16 L138,8 L146,24 L154,16 L400,16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}