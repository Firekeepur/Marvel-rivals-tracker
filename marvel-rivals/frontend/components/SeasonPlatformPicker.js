import { useEffect, useState } from 'react';

export default function SeasonPlatformPicker({ seasons, platforms, value, onChange }) {
  const [season, setSeason] = useState(value?.season ?? 'current');
  const [device, setDevice] = useState(value?.device ?? 'pc');

  useEffect(() => {
    onChange?.({ season, device });
  }, [season, device]);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <label>
        Season:&nbsp;
        <select value={season} onChange={(e) => setSeason(e.target.value)}>
          {seasons?.map((s) => (
            <option key={s} value={s === 'current' ? 'current' : s}>
              {s === 'current' ? 'Current' : s}
            </option>
          ))}
          {!seasons?.includes('current') && <option value="current">Current</option>}
        </select>
      </label>
      <label>
        Platform:&nbsp;
        <select value={device} onChange={(e) => setDevice(e.target.value)}>
          {platforms?.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          {!platforms?.length && <option value="pc">pc</option>}
        </select>
      </label>
    </div>
  );
}
