import React, { useState } from 'react';
import type { HydrationLog } from '@/domain/types';
import {
  Droplet,
  Check,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  History,
  Target,
  Flame,
  Award,
} from 'lucide-react';
import { ManageHydrationModal } from './ManageHydrationModal';

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
  logIdSuffix: string;
  label: string;
  phase: string;
  capacityMl: number;
  cumulativeTargetMl: number;
  isMandatoryTarget?: boolean;
  isBonus?: boolean;
  roleDescription: string;
}

const BOTTLES: BottleConfig[] = [
  {
    id: 1,
    logIdSuffix: '_b1',
    label: 'Botol 1',
    phase: 'Pagi & Tengah Hari',
    capacityMl: 1500,
    cumulativeTargetMl: 1500,
    roleDescription: 'Permulaan metabolisme & fokus pagi',
  },
  {
    id: 2,
    logIdSuffix: '_b2',
    label: 'Botol 2',
    phase: 'Petang (Sasaran Wajib)',
    capacityMl: 1500,
    cumulativeTargetMl: 3000,
    isMandatoryTarget: true,
    roleDescription: 'Cukupkan sasaran minimum 3.0 Liter wajib',
  },
  {
    id: 3,
    logIdSuffix: '_b3',
    label: 'Botol 3',
    phase: 'Malam (Bonus & Pemulihan)',
    capacityMl: 1500,
    cumulativeTargetMl: 4500,
    isBonus: true,
    roleDescription: 'Ekstra 4.5L untuk kesihatan optimum & kulit',
  },
];

export const HydrationCard: React.FC<HydrationCardProps> = ({
  logs,
  todayStr,
  dailyGoalMl = 3000,
  onAddWater,
  onDeleteLog,
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isManageHistoryOpen, setIsManageHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter today's hydration logs
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const totalMl = todayLogs.reduce((sum, l) => sum + l.amountMl, 0);

  // Find deterministic bottle logs if present
  const bottle1Log = todayLogs.find((l) => l.id === `hyd_${todayStr}_b1`);
  const bottle2Log = todayLogs.find((l) => l.id === `hyd_${todayStr}_b2`);
  const bottle3Log = todayLogs.find((l) => l.id === `hyd_${todayStr}_b3`);

  // Handle fallback / legacy logs gracefully:
  // If specific IDs are missing, count how many 1500ml increments exist
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
  const tickedCount = bottleTickedStates.filter(Boolean).length;

  const triggerFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

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
          // Fallback: delete the most recent legacy log
          const sortedLegacy = [...legacyLogs].sort((a, b) =>
            b.loggedAt.localeCompare(a.loggedAt)
          );
          if (sortedLegacy[0]) {
            await onDeleteLog(sortedLegacy[0].id);
          }
        }
        triggerFeedback(`Botol ${bottleNumber} dinyah-tanda (1.5L dibatalkan).`);
      } else {
        // TICK: Add 1,500 ml log for this bottle
        await onAddWater(1500, targetId);

        if (bottleNumber === 2 || (tickedCount === 1 && bottleNumber !== 3)) {
          triggerFeedback(
            '🔥 TAHNIAH! Sasaran wajib 3.0 Liter berjaya dicapai hari ini!'
          );
        } else if (bottleNumber === 3 || tickedCount === 2) {
          triggerFeedback(
            '💎 LUAR BIASA! 4.5 Liter maksimum hidrasi dicapai! Terbaik bro!'
          );
        } else {
          triggerFeedback(`✓ Botol 1 ditandakan selesai (+1.5L)! Teruskan momentum!`);
        }
      }
    } catch (err) {
      console.error('Failed to toggle bottle hydration:', err);
      triggerFeedback('Ralat menyimpan hidrasi. Sila cuba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset all today's logs back to zero
  const handleResetToday = async () => {
    if (todayLogs.length === 0) return;
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      for (const log of todayLogs) {
        await onDeleteLog(log.id);
      }
      triggerFeedback('Semua botol hari ini telah di-reset ke 0.');
    } catch (err) {
      console.error('Failed to reset today hydration:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Total in Liters
  const totalLiters = (totalMl / 1000).toFixed(1);
  const mandatoryLiters = (dailyGoalMl / 1000).toFixed(1);

  // Motivational headline based on bottles completed
  let motivationalHeadline = 'Mula hari anda dengan Botol 1. Wajib minum minimum 3.0L hari ini!';
  let motivationalBadge = (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-400">
      <Droplet className="w-3.5 h-3.5 text-cyan-400/60" /> 0 / 3 Botol Diminum
    </span>
  );

  if (tickedCount === 1) {
    motivationalHeadline =
      'Bagus! Botol 1 selesai (1.5L). Tinggal 1 botol lagi untuk capai sasaran wajib 3.0L!';
    motivationalBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
        <Droplet className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/40" /> 1 / 3 Botol • 1.5L Diminum
      </span>
    );
  } else if (tickedCount === 2) {
    motivationalHeadline =
      '🎉 TAHNIAH! Sasaran wajib 3.0 Liter berjaya dicapai! Anda boleh teruskan Botol 3 untuk bonus 4.5L!';
    motivationalBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <Target className="w-3.5 h-3.5 text-emerald-400" /> 2 / 3 Botol • Sasaran Wajib 3.0L Tercapai!
      </span>
    );
  } else if (tickedCount >= 3) {
    motivationalHeadline =
      '💎 LUAR BIASA! 4.5 Liter maksimum hidrasi dicapai! Tubuh dan minda anda dalam keadaan optimum!';
    motivationalBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-400/20 border border-teal-300/40 text-teal-200 shadow-[0_0_18px_rgba(45,212,191,0.4)]">
        <Sparkles className="w-3.5 h-3.5 text-teal-300" /> 3 / 3 Botol • 4.5L Maksimum Selesai!
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/85 backdrop-blur-xl p-5 md:p-7 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient water glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/[0.08] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.25)]">
              <Droplet className="w-6 h-6 fill-cyan-400/30" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-content-primary">
                  Hydration Tracker
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                  3 Botol Besar (1.5L)
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                Wajib minum <strong className="text-cyan-300">minimum 3.0 Liter</strong> (2 botol) • Maksimum <strong className="text-teal-300">4.5 Liter</strong> (3 botol)
              </p>
            </div>
          </div>
        </div>

        {/* Total Liters & Milestone Badge */}
        <div className="flex items-center gap-4 self-start lg:self-center">
          <div className="text-left lg:text-right">
            <div className="flex items-baseline gap-1 lg:justify-end">
              <span className="text-3xl lg:text-4xl font-extrabold font-mono text-cyan-300 drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)]">
                {totalLiters}L
              </span>
              <span className="text-sm font-semibold text-content-secondary font-mono">
                / {tickedCount >= 3 ? '4.5L' : `${mandatoryLiters}L`}
              </span>
            </div>
            <div className="text-[11px] text-content-secondary mt-0.5">
              {totalMl >= 3000 ? (
                <span className="text-emerald-300 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Sasaran Wajib Dicapai
                </span>
              ) : (
                <span>Kurang {((3000 - totalMl) / 1000).toFixed(1)}L ke sasaran wajib</span>
              )}
            </div>
          </div>

          <div className="hidden sm:block">{motivationalBadge}</div>
        </div>
      </div>

      {/* Motivation & Status Alert */}
      <div className="mb-6 relative z-10">
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-[#0e1d38]/60 to-cyan-950/40 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              {tickedCount >= 3 ? (
                <Award className="w-5 h-5 text-teal-300" />
              ) : tickedCount >= 2 ? (
                <Flame className="w-5 h-5 text-emerald-400" />
              ) : (
                <Droplet className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-cyan-100 font-medium leading-relaxed">
              {motivationalHeadline}
            </p>
          </div>

          {/* Quick Clear Today button if any logs exist */}
          {todayLogs.length > 0 && (
            <button
              type="button"
              onClick={handleResetToday}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300/80 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all self-end sm:self-center shrink-0 active:scale-95"
              title="Reset semula 3 botol hari ini"
            >
              <RotateCcw className="w-3 h-3" /> Reset Hari Ini
            </button>
          )}
        </div>

        {/* Feedback toast */}
        {statusMessage && (
          <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-xs text-cyan-200 font-medium flex items-center gap-2 animate-fade-in shadow-lg">
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 3 BIG BOTTLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 relative z-10 mb-6">
        {BOTTLES.map((bottle) => {
          const isTicked = bottleTickedStates[bottle.id - 1];

          return (
            <div
              key={bottle.id}
              className={`rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between p-5 relative overflow-hidden group ${
                isTicked
                  ? 'border-cyan-400/50 bg-gradient-to-b from-[#0f2442]/90 to-[#091528]/95 shadow-[0_0_30px_rgba(6,182,212,0.22)]'
                  : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15'
              }`}
            >
              {/* Bottle Card Header */}
              <div className="w-full flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-content-primary">
                      {bottle.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      (1.5L)
                    </span>
                  </div>
                  <p className="text-[11px] text-content-secondary mt-0.5">
                    {bottle.phase}
                  </p>
                </div>

                {/* Badges for Bottle 2 and Bottle 3 */}
                {bottle.isMandatoryTarget && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isTicked
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    Wajib 3.0L
                  </span>
                )}
                {bottle.isBonus && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isTicked
                        ? 'bg-teal-400/25 text-teal-200 border border-teal-300/40 shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                    }`}
                  >
                    Bonus 4.5L
                  </span>
                )}
              </div>

              {/* INTERACTIVE 1.5L WATER BOTTLE GRAPHIC */}
              <button
                type="button"
                onClick={() => handleToggleBottle(bottle.id)}
                disabled={isProcessing}
                className="w-full my-2 flex flex-col items-center justify-center relative focus:outline-none group/bottle cursor-pointer"
                title={`Klik untuk ${isTicked ? 'batalkan' : 'tandakan selesai'} ${bottle.label}`}
                aria-label={`Tick ${bottle.label} (1.5 Liter)`}
              >
                <div className="relative w-40 sm:w-44 h-64 sm:h-72 flex items-center justify-center transition-transform duration-300 group-hover/bottle:scale-[1.03]">
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
                      {/* Gradient for liquid body */}
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

                      {/* Glass gradient */}
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

                      {/* Clip path matching inner bottle contour */}
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
                          {/* Main Fluid Rectangle (filled to 1.5L line, Y=95 to Y=330) */}
                          <rect
                            x="20"
                            y="95"
                            width="120"
                            height="240"
                            fill={`url(#liquidGrad_${bottle.id})`}
                          />

                          {/* Animated wave crest at the water surface */}
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

                          {/* Floating air bubbles inside water */}
                          <circle cx="55" cy="220" r="3.5" fill="#ffffff" opacity="0.45" />
                          <circle cx="95" cy="180" r="2.5" fill="#ffffff" opacity="0.35" />
                          <circle cx="68" cy="140" r="4" fill="#ffffff" opacity="0.4" />
                          <circle cx="105" cy="260" r="3" fill="#ffffff" opacity="0.3" />
                          <circle cx="50" cy="280" r="2" fill="#ffffff" opacity="0.3" />
                        </g>
                      ) : (
                        /* Empty state: subtle bottom droplet */
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
                      {/* 1.5L line */}
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

                      {/* 1.0L line */}
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

                      {/* 0.5L line */}
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

                    {/* Specular glass reflection line down the left side */}
                    <path
                      d="M 44 115 L 44 290"
                      stroke="rgba(255, 255, 255, 0.28)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Center Floating Status Badge inside the bottle */}
                    <g transform="translate(80, 200)">
                      {isTicked ? (
                        <g>
                          <circle
                            r="26"
                            fill="#065f46"
                            stroke="#34d399"
                            strokeWidth="2.5"
                            className="shadow-lg"
                          />
                          <path
                            d="M -9 1 L -2 8 L 10 -4"
                            stroke="#ffffff"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </g>
                      ) : (
                        <g opacity="0.6">
                          <circle
                            r="22"
                            fill="#0b172a"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <path
                            d="M 0 -8 C -4 -2, -6 1, -6 5 C -6 8.5, -3.3 11, 0 11 C 3.3 11, 6 8.5, 6 5 C 6 1, 4 -2, 0 -8 Z"
                            fill="#38bdf8"
                            opacity="0.7"
                          />
                        </g>
                      )}
                    </g>
                  </svg>
                </div>
              </button>

              {/* Description & Role */}
              <p className="text-[11px] text-content-secondary/80 text-center px-2 mb-3.5 min-h-[32px] flex items-center justify-center">
                {bottle.roleDescription}
              </p>

              {/* TICK BUTTON */}
              <button
                type="button"
                onClick={() => handleToggleBottle(bottle.id)}
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none ${
                  isTicked
                    ? 'bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-content-primary'
                }`}
              >
                {isTicked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                    <span>✓ Selesai Minum (1.5L)</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 group-hover:border-cyan-400 flex items-center justify-center transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-cyan-400 transition-colors" />
                    </div>
                    <span>Tick {bottle.label} (+1.5L)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer / Management Link */}
      <div className="pt-4 border-t border-white/[0.08] relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-content-secondary">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-cyan-400" />
          <span>
            {todayLogs.length} rekod hidrasi aktif hari ini ({totalMl.toLocaleString()} ml).
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsManageHistoryOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors self-start sm:self-auto cursor-pointer"
          title="Lihat sejarah dan rekod hidrasi hari-hari lepas"
        >
          <History className="w-3.5 h-3.5" /> Sejarah & Log Lalu ({logs.length})
        </button>
      </div>

      {/* History Management Modal */}
      <ManageHydrationModal
        isOpen={isManageHistoryOpen}
        onClose={() => setIsManageHistoryOpen(false)}
      />
    </div>
  );
};
