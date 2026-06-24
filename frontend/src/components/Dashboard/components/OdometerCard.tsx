import React from 'react';

interface OdometerCardProps {
  value: number;
  title: string;
}

export function OdometerCard({ value, title }: OdometerCardProps) {
  const displayValue = typeof value === 'number' && !isNaN(value)
    ? value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '---';

  return (
    <div className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚜</span>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white font-mono tracking-wider uppercase">
            {title}
          </h3>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl px-6 py-5 border border-neutral-600 shadow-inner">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold font-mono tracking-widest text-yellow-400 tabular-nums">
            {displayValue}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-1 tracking-widest uppercase">
            Kilómetros
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 font-mono">
        <span>● Acumulado total</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          En vivo
        </span>
      </div>
    </div>
  );
}
