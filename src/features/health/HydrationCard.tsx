import React, { useState } from 'react';
import type { HydrationLog } from '@/domain/types';
import {
  Droplet,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface HydrationCardProps {
  logs: HydrationLog[];
  todayStr: string;
  dailyGoalMl?: number;
  onAddWater: (amountMl: number, customId?: string) => Promise<void>;
  onUpdateLog?: (id: string, amountMl: number) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdateDailyGoal?: (goalMl: number) => void;
}

interface BottleConfig {
  id: number;
  label: string;
  capacityMl: number;
}

const BOTTLES: BottleConfig[] = [
  { id: 1, label: 'Botol 1', capacityMl: 1500 },
  { id: 2, label: 'Botol 2', capacityMl: 1500 },
  { id: 3, label: 'Botol 3', capacityMl: 1500 },
];

export const HydrationCard: React.FC<HydrationCardProps> = ({
  logs,
  todayStr,
  onAddWater,
  onDeleteLog,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter today's hydration logs
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const totalMl = todayLogs.reduce((sum, l) => sum + l.amountMl, 0);

  // Find deterministic bottle logs if present
  const bottle1Log = todayLogs.find((l) => l.id === `hyd_${todayStr}_b1`);
  const bottle2Log = todayLogs.find((l) => l.id === `hyd_${todayStr}_b2`);
  const bottle3Log = todayLogs.find((l) => l.id === `hyd_${todayStr}_b3`);

  // Handle fallback / legacy logs gracefully
  const legacyLogs = todayLogs.filter(
    (l) => !['_b1', '_b2', '_b3'].some((sfx) => l.id.endsWith(sfx))
  );
  const legacyTotal = legacyLogs.reduce((sum, l) => sum + l.amountMl, 0);

  // Derive tick status for each bottle
  const isBottle1Ticked = Boolean(bottle1Log) || (!bottle2Log && !bottle3Log && legacyTotal >= 1500);
  const isBottle2Ticked =
    Boolean(bottle2Log) ||
    (!bottle3Log && (bottle1Log ? legacyTotal >= 1500 : legacyTotal >= 3000));
  const isBottle3Ticked =
    Boolean(bottle3Log) ||
    (bottle1Log && bottle2Log
      ? legacyTotal >= 1500
      : bottle1Log || bottle2Log
        ? legacyTotal >= 3000
        : legacyTotal >= 4500);

  const bottleTickedStates = [isBottle1Ticked, isBottle2Ticked, isBottle3Ticked];

  // Toggle a bottle on / off
  const handleToggleBottle = async (bottleNumber: number) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const isCurrentlyTicked = bottleTickedStates[bottleNumber - 1];
      const targetId = `hyd_${todayStr}_b${bottleNumber}`;
      const existingSpecificLog = todayLogs.find((l) => l.id === targetId);

      if (isCurrentlyTicked) {
        // UNTICK: Remove the bottle's log
        if (existingSpecificLog) {
          await onDeleteLog(existingSpecificLog.id);
        } else if (legacyLogs.length > 0) {
          const sortedLegacy = [...legacyLogs].sort((a, b) =>
            b.loggedAt.localeCompare(a.loggedAt)
          );
          if (sortedLegacy[0]) {
            await onDeleteLog(sortedLegacy[0].id);
          }
        }
      } else {
        // TICK: Add 1,500 ml log for this bottle
        await onAddWater(1500, targetId);
      }
    } catch (err) {
      console.error('Failed to toggle bottle hydration:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset all today's logs back to zero
  const handleResetToday = async () => {
    if (todayLogs.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      for (const log of todayLogs) {
        await onDeleteLog(log.id);
      }
    } catch (err) {
      console.error('Failed to reset today hydration:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalLiters = (totalMl / 1000).toFixed(1);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/85 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient water glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Pure Minimalist Title only */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Droplet className="w-5 h-5 fill-cyan-400/30" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-content-primary">
            Hydration Tracker
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-cyan-300">
            {totalLiters}L / 3.0L
          </span>
          {todayLogs.length > 0 && (
            <button
              type="button"
              onClick={handleResetToday}
              disabled={isProcessing}
              className="p-1.5 rounded-lg text-content-secondary hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
              title="Reset botol hari ini"
              aria-label="Reset hari ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3 BIG BOTTLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 relative z-10">
        {BOTTLES.map((bottle) => {
          const isTicked = bottleTickedStates[bottle.id - 1];

          return (
            <div
              key={bottle.id}
              className={`rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between p-4 sm:p-5 relative overflow-hidden group ${
                isTicked
                  ? 'border-cyan-400/50 bg-gradient-to-b from-[#0f2442]/90 to-[#091528]/95 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                  : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15'
              }`}
            >
              {/* Bottle Label */}
              <div className="text-xs sm:text-sm font-bold text-content-primary mb-2">
                {bottle.label} <span className="font-mono text-cyan-300 font-semibold">(1.5L)</span>
              </div>

              {/* INTERACTIVE 1.5L WATER BOTTLE GRAPHIC */}
              <button
                type="button"
                onClick={() => handleToggleBottle(bottle.id)}
                disabled={isProcessing}
                className="w-full my-1 flex flex-col items-center justify-center relative focus:outline-none group/bottle cursor-pointer"
                title={`Klik untuk ${isTicked ? 'batalkan' : 'tandakan selesai'} ${bottle.label}`}
                aria-label={`Tick ${bottle.label} (1.5 Liter)`}
              >
                <div className="relative w-36 sm:w-40 h-56 sm:h-64 flex items-center justify-center transition-transform duration-300 group-hover/bottle:scale-[1.03]">
                  {/* Outer aura glow when ticked */}
                  {isTicked && (
                    <div className="absolute inset-4 rounded-3xl bg-cyan-400/20 blur-2xl pointer-events-none animate-pulse" />
                  )}

                  <svg
                    viewBox="0 0 160 360"
                    className="w-full h-full drop-shadow-2xl select-none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id={`liquidGrad_${bottle.id}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
                        <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.95" />
                      </linearGradient>

                      <linearGradient
                        id={`glassGrad_${bottle.id}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
                        <stop offset="25%" stopColor="#ffffff" stopOpacity="0.04" />
                        <stop offset="75%" stopColor="#ffffff" stopOpacity="0.02" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
                      </linearGradient>

                      <clipPath id={`bottleClip_${bottle.id}`}>
                        <path d="M 66 56 L 66 62 C 66 74, 38 84, 34 100 L 34 300 C 34 322, 50 330, 80 330 C 110 330, 126 322, 126 300 L 126 100 C 122 84, 94 74, 94 62 L 94 56 Z" />
                      </clipPath>
                    </defs>

                    {/* Cap / Handle */}
                    <path
                      d="M 64 22 C 64 10, 96 10, 96 22"
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.8"
                    />
                    <rect
                      x="60"
                      y="20"
                      width="40"
                      height="16"
                      rx="4"
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="56"
                      y="36"
                      width="48"
                      height="8"
                      rx="2"
                      fill={isTicked ? '#0284c7' : '#334155'}
                      stroke="#0284c7"
                      strokeWidth="1"
                    />
                    <rect
                      x="66"
                      y="44"
                      width="28"
                      height="12"
                      fill="#0f172a"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                    />

                    {/* Bottle Outer Body Base Glass */}
                    <path
                      d="M 66 56 L 66 62 C 66 74, 38 84, 34 100 L 34 300 C 34 322, 50 330, 80 330 C 110 330, 126 322, 126 300 L 126 100 C 122 84, 94 74, 94 62 L 94 56 Z"
                      fill={`url(#glassGrad_${bottle.id})`}
                      stroke={
                        isTicked
                          ? 'rgba(6, 182, 212, 0.6)'
                          : 'rgba(56, 189, 248, 0.3)'
                      }
                      strokeWidth="2.5"
                    />

                    {/* Clipped Fluid Water inside bottle */}
                    <g clipPath={`url(#bottleClip_${bottle.id})`}>
                      {isTicked ? (
                        <g className="transition-all duration-700 ease-out">
                          <rect
                            x="20"
                            y="95"
                            width="120"
                            height="240"
                            fill={`url(#liquidGrad_${bottle.id})`}
                          />
                          <path
                            d="M 20 96 Q 50 90, 80 96 T 140 96 L 140 106 L 20 106 Z"
                            fill="#67e8f9"
                            opacity="0.8"
                          />
                          <path
                            d="M 20 98 Q 50 104, 80 98 T 140 98 L 140 106 L 20 106 Z"
                            fill="#a5f3fc"
                            opacity="0.5"
                          />

                          {/* Subtle bubbles */}
                          <circle cx="55" cy="220" r="3.5" fill="#ffffff" opacity="0.45" />
                          <circle cx="95" cy="180" r="2.5" fill="#ffffff" opacity="0.35" />
                          <circle cx="68" cy="140" r="4" fill="#ffffff" opacity="0.4" />
                          <circle cx="105" cy="260" r="3" fill="#ffffff" opacity="0.3" />
                        </g>
                      ) : (
                        <g>
                          <rect
                            x="20"
                            y="322"
                            width="120"
                            height="12"
                            fill="#0284c7"
                            opacity="0.25"
                          />
                        </g>
                      )}
                    </g>

                    {/* Milliliter & Liter Graduation Lines on the Right */}
                    <g opacity={isTicked ? '0.9' : '0.45'}>
                      <line
                        x1="102"
                        y1="110"
                        x2="120"
                        y2="110"
                        stroke={isTicked ? '#ffffff' : '#38bdf8'}
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y="114"
                        textAnchor="end"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill={isTicked ? '#e0f2fe' : '#94a3b8'}
                      >
                        1.5L
                      </text>

                      <line
                        x1="108"
                        y1="175"
                        x2="120"
                        y2="175"
                        stroke={isTicked ? '#ffffff' : '#38bdf8'}
                        strokeWidth="1.5"
                      />
                      <text
                        x="104"
                        y="178"
                        textAnchor="end"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill={isTicked ? '#e0f2fe' : '#64748b'}
                      >
                        1.0L
                      </text>

                      <line
                        x1="108"
                        y1="240"
                        x2="120"
                        y2="240"
                        stroke={isTicked ? '#ffffff' : '#38bdf8'}
                        strokeWidth="1.5"
                      />
                      <text
                        x="104"
                        y="243"
                        textAnchor="end"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill={isTicked ? '#e0f2fe' : '#64748b'}
                      >
                        0.5L
                      </text>
                    </g>

                    {/* Specular glass reflection line */}
                    <path
                      d="M 44 115 L 44 290"
                      stroke="rgba(255, 255, 255, 0.28)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Center Floating Status Badge */}
                    <g transform="translate(80, 200)">
                      {isTicked ? (
                        <g>
                          <circle
                            r="24"
                            fill="#065f46"
                            stroke="#34d399"
                            strokeWidth="2.5"
                          />
                          <path
                            d="M -8 1 L -2 7 L 9 -4"
                            stroke="#ffffff"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </g>
                      ) : (
                        <g opacity="0.5">
                          <circle
                            r="20"
                            fill="#0b172a"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <path
                            d="M 0 -7 C -3.5 -2, -5 1, -5 4.5 C -5 7.5, -2.8 10, 0 10 C 2.8 10, 5 7.5, 5 4.5 C 5 1, 3.5 -2, 0 -7 Z"
                            fill="#38bdf8"
                            opacity="0.7"
                          />
                        </g>
                      )}
                    </g>
                  </svg>
                </div>
              </button>

              {/* TICK BUTTON */}
              <button
                type="button"
                onClick={() => handleToggleBottle(bottle.id)}
                disabled={isProcessing}
                className={`w-full py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none mt-2 ${
                  isTicked
                    ? 'bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-content-primary'
                }`}
              >
                {isTicked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                    <span>✓ Selesai (1.5L)</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 group-hover:border-cyan-400 flex items-center justify-center transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-cyan-400 transition-colors" />
                    </div>
                    <span>Tick Botol {bottle.id} (1.5L)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
