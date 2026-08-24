import React, { useRef, useEffect } from 'react';
import useSimStore from '../stores/useSimStore';

export default function EventLog() {
  const eventLog = useSimStore(s => s.eventLog);
  const listRef = useRef(null);
  
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [eventLog]);
  
  const getLevelProps = (level) => {
    switch(level) {
      case 'info': return { icon: 'ℹ️', color: 'text-gray-400' };
      case 'warning': return { icon: '⚠', color: 'text-[#a89a6b]' };
      case 'alert': return { icon: '🔴', color: 'text-[#bd7a72]' };
      case 'success': return { icon: '✅', color: 'text-[#7da892]' };
      default: return { icon: 'ℹ️', color: 'text-gray-400' };
    }
  };

  return (
    <div className="flex-1 max-h-[200px] bg-[#0e1116] border-r border-[#151920] p-3 flex flex-col">
      <div className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">EVENT LOG</div>
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-1">
        {eventLog.map(e => {
          const { icon, color } = getLevelProps(e.level);
          return (
            <div key={e.id} className={`flex items-start gap-2 text-xs font-mono ${color}`}>
              <span className="text-gray-600 w-16 shrink-0">{e.surveyTime.toFixed(1)}s</span>
              <span>{icon}</span>
              <span>{e.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
