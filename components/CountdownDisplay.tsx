import React from 'react';

interface CountdownTime {
  overdue: boolean;
  days: number;
  hours: number;
  minutes: number;
}

interface CountdownDisplayProps {
  remaining: CountdownTime | null;
}

/**
 * Memoized countdown display component.
 * This prevents the entire parent from re-rendering on each timer tick.
 * Only re-renders when the `remaining` object changes.
 */
const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ remaining }) => {
  if (!remaining) return null;

  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
        Zbývá času
      </p>
      <p className={`text-xl font-black tracking-wider ${
        remaining.overdue ? 'text-lavrs-red' : 'text-lavrs-red'
      }`}>
        {remaining.overdue
          ? 'PO SPLATNOSTI'
          : `${remaining.days}d : ${remaining.hours}h : ${remaining.minutes}m`}
      </p>
    </div>
  );
};

export default React.memo(CountdownDisplay);
