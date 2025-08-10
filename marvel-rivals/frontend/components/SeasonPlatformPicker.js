import { useEffect, useState } from 'react';

export default function SeasonPlatformPicker({ seasons, platforms, value, onChange }) {
  const [season, setSeason] = useState(value?.season ?? 'current');
  const [device, setDevice] = useState(value?.device ?? (platforms?.[0] || 'pc'));

  useEffect(() => { onChange?.({ season, device }); }, [season, device]);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <label>Season:&nbsp;
        <select value={season} onChange={(e)=>setSeason(e.target.value)}>
          {(seasons || ['current']).map(s => <option key={s} value={s}>{s === 'current' ? 'Current' : s}</option>)}
        </select>
      </label>
      <label>Platform:&nbsp;
        <select value={device} onChange={(e)=>setDevice(e.target.value)}>
          {(platforms || ['pc','ps','xbox']).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
    </div>
  );
}
