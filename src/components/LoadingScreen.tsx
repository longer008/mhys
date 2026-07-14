"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  useEffect(() => {
    const minDuration = 520;
    const startTime = Date.now();
    let isMounted = true;

    const handleLoad = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsedTime);

      setTimeout(() => {
        if (isMounted) {
          onComplete();
        }
      }, remainingTime);
    };

    // 页面已完成加载时直接进入最短展示计时。
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      isMounted = false;
      window.removeEventListener("load", handleLoad);
    };
  }, [onComplete]);

  // 先天八卦序列，1 表示阳爻，0 表示阴爻。
  const trigrams = [
    { name: "Qian", lines: [1, 1, 1], angle: 0 },
    { name: "Xun", lines: [1, 1, 0], angle: 45 },
    { name: "Kan", lines: [0, 1, 0], angle: 90 },
    { name: "Gen", lines: [0, 0, 1], angle: 135 },
    { name: "Kun", lines: [0, 0, 0], angle: 180 },
    { name: "Zhen", lines: [0, 0, 1], angle: 225 },
    { name: "Li", lines: [1, 0, 1], angle: 270 },
    { name: "Dui", lines: [0, 1, 1], angle: 315 },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
    >
      {/* Background Texture */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
        }}
      />

      {/* Main Container - Flex Column for Layout */}
      <div className="relative flex flex-col items-center gap-6">

        {/* Animation Container */}
        <div className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
          <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 400 400">
            <defs>
              <filter id="ink-wash-taiji">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
                <feGaussianBlur stdDeviation="0.2" />
              </filter>
              <filter id="ink-blur">
                <feGaussianBlur stdDeviation="0.2" />
              </filter>
            </defs>

            {/* Center Taiji (Yin Yang) - Clockwise Rotation (Yang/Heaven) */}
            <motion.g
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
              style={{ originX: 0.5, originY: 0.5 }}
            >
              {/* Yang (White/Light) Fish */}
              <circle cx="200" cy="200" r="98" fill="#e5e5e0" />

              {/* Yin (Black/Dark) Fish */}
              <motion.path
                d="M 200,100 A 50,50 0 0 1 200,200 A 50,50 0 0 0 200,300 A 100,100 0 0 1 200,100"
                fill="#1a1a1a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.36, delay: 0.06 }}
              />

              {/* Eyes */}
              <circle cx="200" cy="150" r="12" fill="#1a1a1a" />
              <circle cx="200" cy="250" r="12" fill="#e5e5e0" />
            </motion.g>

            {/* Bagua Trigrams Ring - Counter-Clockwise Rotation (Yin/Earth) */}
            <motion.g
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: -360 }}
              transition={{ duration: 8, ease: "linear", repeat: Infinity }}
              style={{ originX: 0.5, originY: 0.5 }}
            >
              {trigrams.map((trigram) => {
                const radius = 160;
                const rad = (trigram.angle - 90) * (Math.PI / 180);
                // Fix hydration mismatch by rounding coordinates
                const x = (200 + radius * Math.cos(rad)).toFixed(2);
                const y = (200 + radius * Math.sin(rad)).toFixed(2);

                return (
                  <g key={trigram.name} transform={`translate(${x}, ${y}) rotate(${trigram.angle})`}>
                    {trigram.lines.map((isYang, lineIndex) => (
                      <g key={lineIndex} transform={`translate(0, ${(lineIndex - 1) * 12})`}>
                        {isYang ? (
                          // Yang Line (Solid)
                          <rect x="-15" y="-2" width="30" height="4" fill="#2a2a2a" opacity="1" rx="1" />
                        ) : (
                          // Yin Line (Broken)
                          <g>
                            <rect x="-15" y="-2" width="12" height="4" fill="#2a2a2a" opacity="1" rx="1" />
                            <rect x="3" y="-2" width="12" height="4" fill="#2a2a2a" opacity="1" rx="1" />
                          </g>
                        )}
                      </g>
                    ))}
                  </g>
                );
              })}
            </motion.g>
          </svg>
        </div>

        {/* Text Overlay - Positioned Below */}
        <motion.div
          className="z-10 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
        >
          <h1 className="ml-2 font-song text-2xl font-semibold tracking-[0.5em] text-foreground sm:text-3xl">梅花易数</h1>
          <div className="flex items-center gap-3 text-[var(--cinnabar)] opacity-75">
            <div className="h-px w-7 bg-current" />
            <p className="text-[10px] tracking-[0.28em] text-muted-foreground sm:text-xs">观象授时 · 万物皆数</p>
            <div className="h-px w-7 bg-current" />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
