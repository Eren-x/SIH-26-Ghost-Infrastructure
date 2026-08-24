import React from 'react';
import useSimStore from '../stores/useSimStore';
import { socket } from '../socket';
import { formatTime, formatDistance } from '../utils/format';

export default function SurveyReport() {
  const stats = useSimStore(s => s.surveyStats);
  const anomalies = useSimStore(s => s.detectedAnomalies);
  const resetSurvey = useSimStore(s => s.resetSurvey);
  const roverDistance = useSimStore(s => s.roverDistance);
  const surveyTime = useSimStore(s => s.surveyTime);

  const handleReset = () => {
    socket.emit('survey:reset');
    resetSurvey();
  };

  // Use stats from server if available, fall back to client-side data
  const distance = stats?.distance ?? roverDistance ?? 0;
  const duration = stats?.duration ?? surveyTime ?? 0;
  const samples = stats?.samples ?? 0;
  const anomalyCount = stats?.anomalies ?? anomalies.length;
  const cavities = stats?.cavities ?? anomalies.filter(a => a.type === 'cavity').length;
  const leaks = stats?.leaks ?? anomalies.filter(a => a.type === 'leak').length;

  const rb = stats?.riskBreakdown ?? { CALM: 1, WATCH: 0, INSPECT: 0 };
  const total = (rb.CALM + rb.WATCH + rb.INSPECT) || 1;
  const pCalm = (rb.CALM / total) * 100;
  const pWatch = (rb.WATCH / total) * 100;
  const pInspect = (rb.INSPECT / total) * 100;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center fade-in">
      <div className="w-full max-w-2xl bg-[#0e1116] rounded-2xl p-8 border border-[#151920] shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#1a2420] text-[#7da892] p-4 rounded-full mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-200 tracking-wide">SURVEY COMPLETE</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#12161c] p-4 rounded-xl border border-[#151920]">
            <div className="text-xs text-gray-500 uppercase font-mono mb-1">Distance</div>
            <div className="text-2xl text-gray-200 font-mono">{formatDistance(distance)}</div>
          </div>
          <div className="bg-[#12161c] p-4 rounded-xl border border-[#151920]">
            <div className="text-xs text-gray-500 uppercase font-mono mb-1">Duration</div>
            <div className="text-2xl text-gray-200 font-mono">{formatTime(duration)}</div>
          </div>
          <div className="bg-[#12161c] p-4 rounded-xl border border-[#151920]">
            <div className="text-xs text-gray-500 uppercase font-mono mb-1">Samples</div>
            <div className="text-2xl text-gray-200 font-mono">{samples}</div>
          </div>
          <div className="bg-[#12161c] p-4 rounded-xl border border-[#151920]">
            <div className="text-xs text-gray-500 uppercase font-mono mb-1">Anomalies</div>
            <div className="text-2xl text-[#bd8a85] font-mono font-bold">{anomalyCount}</div>
          </div>
          <div className="bg-[#12161c] p-4 rounded-xl border border-[#151920]">
            <div className="text-xs text-gray-500 uppercase font-mono mb-1">Cavities</div>
            <div className="text-2xl text-[#bd9a72] font-mono">{cavities}</div>
          </div>
          <div className="bg-[#12161c] p-4 rounded-xl border border-[#151920]">
            <div className="text-xs text-gray-500 uppercase font-mono mb-1">Leaks</div>
            <div className="text-2xl text-[#8ba0c9] font-mono">{leaks}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xs text-gray-500 uppercase font-mono mb-2">Risk Breakdown</div>
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-gray-800">
            <div style={{ width: `${pCalm}%` }} className="bg-[#5f7d64]" title={`Calm: ${pCalm.toFixed(1)}%`} />
            <div style={{ width: `${pWatch}%` }} className="bg-[#94875f]" title={`Watch: ${pWatch.toFixed(1)}%`} />
            <div style={{ width: `${pInspect}%` }} className="bg-[#a06262]" title={`Inspect: ${pInspect.toFixed(1)}%`} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
            <span>CALM {pCalm.toFixed(0)}%</span>
            <span>WATCH {pWatch.toFixed(0)}%</span>
            <span>INSPECT {pInspect.toFixed(0)}%</span>
          </div>
        </div>

        {anomalies.length > 0 && (
          <div className="mb-8">
            <div className="text-xs text-gray-500 uppercase font-mono mb-2">Detected Anomalies</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {anomalies.map((a, i) => (
                <div key={a.id || i} className="flex justify-between items-center bg-[#12161c] p-2 rounded border border-[#151920] text-xs font-mono">
                  <span className={a.type === 'cavity' ? 'text-[#bd9a72]' : 'text-[#8ba0c9]'}>{a.type.toUpperCase()}</span>
                  <span className="text-gray-400">Risk {typeof a.riskScore === 'number' ? a.riskScore.toFixed(0) : '—'}</span>
                  {a.gps && <span className="text-gray-500">{a.gps.lat.toFixed(4)}, {a.gps.lng.toFixed(4)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button onClick={handleReset} className="px-6 py-3 bg-[#334155] hover:bg-[#3b4a63] text-gray-200 rounded-lg font-bold uppercase tracking-wider transition">RESET SURVEY</button>
        </div>
      </div>
    </div>
  );
}
