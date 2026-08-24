export const formatCoord = (n) => n.toFixed(4);
export const formatValue = (n, decimals = 1) => n.toFixed(decimals);
export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
export const formatDistance = (d) => d < 1000 ? `${d.toFixed(1)}m` : `${(d/1000).toFixed(2)}km`;
