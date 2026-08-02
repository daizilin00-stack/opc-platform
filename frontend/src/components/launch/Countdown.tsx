"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // ISO date string
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const difference = new Date(targetDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
}

export default function Countdown({ targetDate, className = "" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: "天", value: timeLeft.days },
    { label: "时", value: timeLeft.hours },
    { label: "分", value: timeLeft.minutes },
    { label: "秒", value: timeLeft.seconds },
  ];

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-3">
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <span className="text-2xl md:text-3xl font-bold text-brand-600">
                {String(unit.value).padStart(2, "0")}
              </span>
            </div>
            <div className="text-xs md:text-sm text-slate-500 mt-2">{unit.label}</div>
          </div>
          {index < units.length - 1 && (
            <span className="text-2xl font-bold text-slate-300 -mt-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
