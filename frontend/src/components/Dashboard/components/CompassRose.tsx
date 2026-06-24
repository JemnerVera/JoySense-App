import React, { useMemo } from 'react';

interface CompassRoseProps {
  heading: number;
  title: string;
}

function degreesToCompass(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

export function CompassRose({ heading, title }: CompassRoseProps) {
  const validHeading = typeof heading === 'number' && !isNaN(heading) && heading >= 0;
  const angle = validHeading ? heading % 360 : 0;
  const compassDir = validHeading ? degreesToCompass(angle) : '--';

  const ticks = useMemo(() => {
    const result: { angle: number; label: string; isMain: boolean }[] = [];
    for (let i = 0; i < 360; i += 45) {
      const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      result.push({ angle: i, label: labels[i / 45], isMain: i % 90 === 0 });
    }
    return result;
  }, []);

  return (
    <div className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <h3 className="text-xs font-bold text-gray-800 dark:text-white font-mono tracking-wider uppercase">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 200" className="w-28 h-28 md:w-32 md:h-32">
          {/* Outer ring */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#374151" strokeWidth="2" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="#4b5563" strokeWidth="1" />

          {/* Inner decorative rings */}
          <circle cx="100" cy="100" r="50" fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="25" fill="none" stroke="#4b5563" strokeWidth="0.5" />

          {/* Tick marks and cardinal labels */}
          {ticks.map((tick) => {
            const rad = (tick.angle - 90) * (Math.PI / 180);
            const innerR = tick.isMain ? 72 : 78;
            const outerR = 84;
            const labelR = 65;
            const x1 = 100 + innerR * Math.cos(rad);
            const y1 = 100 + innerR * Math.sin(rad);
            const x2 = 100 + outerR * Math.cos(rad);
            const y2 = 100 + outerR * Math.sin(rad);
            const lx = 100 + labelR * Math.cos(rad);
            const ly = 100 + labelR * Math.sin(rad);

            return (
              <g key={tick.angle}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tick.isMain ? '#eab308' : '#6b7280'} strokeWidth={tick.isMain ? 2 : 1} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                  fill={tick.isMain ? '#eab308' : '#9ca3af'}
                  fontSize={tick.isMain ? 12 : 8}
                  fontFamily="monospace"
                  fontWeight={tick.isMain ? 'bold' : 'normal'}
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          <g transform={`rotate(${angle} 100 100)`}>
            <line x1="100" y1="100" x2="100" y2="25" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
            <line x1="100" y1="100" x2="100" y2="60" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <polygon points="97,28 103,28 100,18" fill="#eab308" />
            <circle cx="100" cy="100" r="5" fill="#eab308" />
            <circle cx="100" cy="100" r="2.5" fill="#1f2937" />
          </g>

          {/* Minor tick marks every 10 degrees */}
          {Array.from({ length: 36 }, (_, i) => i * 10).filter(d => d % 45 !== 0).map((deg) => {
            const rad = (deg - 90) * (Math.PI / 180);
            const x1 = 100 + 82 * Math.cos(rad);
            const y1 = 100 + 82 * Math.sin(rad);
            const x2 = 100 + 84 * Math.cos(rad);
            const y2 = 100 + 84 * Math.sin(rad);
            return (
              <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4b5563" strokeWidth="0.5" />
            );
          })}
        </svg>

        {/* Digital reading */}
        <div className="text-center">
          <div className="text-base font-bold font-mono text-yellow-400 tabular-nums">
            {validHeading ? `${angle.toFixed(1)}°` : '---'}
          </div>
          <div className="text-xs font-mono text-gray-500 dark:text-neutral-400 font-bold tracking-wider">
            {compassDir}
          </div>
        </div>
      </div>
    </div>
  );
}
