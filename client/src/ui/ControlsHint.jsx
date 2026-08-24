import React, { useEffect, useRef, useState } from 'react';

const HINTS = [
  { keys: ['W', '↑'], label: 'Forward' },
  { keys: ['S', '↓'], label: 'Reverse' },
  { keys: ['A', '←'], label: 'Turn left' },
  { keys: ['D', '→'], label: 'Turn right' },
  { keys: ['Wheel'], label: 'Camera zoom' },
];

export default function ControlsHint() {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const hideTimer = useRef();

  // Auto-fade after 10s, or immediately on first drive input
  useEffect(() => {
    if (dismissed) return;
    hideTimer.current = setTimeout(() => setVisible(false), 10000);
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        setVisible(false);
        setDismissed(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(hideTimer.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [dismissed]);

  return (
    <>
      {visible && !dismissed && (
        <div className="absolute bottom-4 left-4 z-30 bg-[#121820]/90 backdrop-blur border border-[#1a202c] rounded-lg p-3 shadow-2xl slide-in select-none">
          <div className="flex justify-between items-center mb-2 gap-6">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">Drive Controls</span>
            <button onClick={() => { setVisible(false); setDismissed(true); }}
              className="text-gray-500 hover:text-white text-xs leading-none">✕</button>
          </div>
          <div className="space-y-1">
            {HINTS.map(({ keys, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className="flex gap-1">
                  {keys.map(k => (
                    <kbd key={k} className="min-w-[20px] text-center px-1 py-0.5 bg-black/40 border border-gray-600 rounded font-mono text-[10px] text-gray-300">{k}</kbd>
                  ))}
                </div>
                <span className="text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-open button */}
      {!visible && dismissed && (
        <button
          onClick={() => setVisible(true)}
          className="absolute bottom-4 left-4 z-30 w-7 h-7 bg-[#121820]/90 backdrop-blur border border-[#1a202c] rounded-full text-gray-400 hover:text-white text-xs shadow-lg"
          title="Show controls"
        >?</button>
      )}
      {!visible && !dismissed && null}
    </>
  );
}
