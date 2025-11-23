"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const minDuration = 1000; // Minimum 1 second
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

    // Check if page is already loaded
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

  // Bagua Trigrams (Pre-heaven / Xian Tian sequence)
  // Top: Qian (Heaven), Bottom: Kun (Earth), etc.
  // Represented as 3 lines (1 = Yang/Solid, 0 = Yin/Broken)
  const trigrams = [
    { name: "Qian", lines: [1, 1, 1], angle: 0 },    // Heaven (South)
    { name: "Xun", lines: [1, 1, 0], angle: 45 },    // Wind (Southwest)
    { name: "Kan", lines: [0, 1, 0], angle: 90 },    // Water (West)
    { name: "Gen", lines: [0, 0, 1], angle: 135 },   // Mountain (Northwest)
    { name: "Kun", lines: [0, 0, 0], angle: 180 },   // Earth (North)
    { name: "Zhen", lines: [0, 0, 1], angle: 225 },  // Thunder (Northeast)
    { name: "Li", lines: [1, 0, 1], angle: 270 },    // Fire (East)
    { name: "Dui", lines: [0, 1, 1], angle: 315 },   // Lake (Southeast)
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fafaf9] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
        }}
      />

      {/* Main Container - Flex Column for Layout */}
      <div className="relative flex flex-col items-center gap-12">

        {/* Animation Container */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
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
              transition={{ duration: 8, ease: "linear", repeat: Infinity }}
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
                transition={{ duration: 1.5, delay: 0.2 }}
              />

              {/* Eyes */}
              <circle cx="200" cy="150" r="12" fill="#1a1a1a" />
              <circle cx="200" cy="250" r="12" fill="#e5e5e0" />
            </motion.g>

            {/* Bagua Trigrams Ring - Counter-Clockwise Rotation (Yin/Earth) */}
            <motion.g
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: -360 }}
              transition={{ duration: 12, ease: "linear", repeat: Infinity }}
              style={{ originX: 0.5, originY: 0.5 }}
            >
              {trigrams.map((trigram, i) => {
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
          className="flex flex-col items-center gap-4 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <h1 className="text-3xl md:text-4xl font-song font-bold text-[#1a1a1a] tracking-[0.8em] ml-4">梅花易数</h1>
          <div className="flex items-center gap-4 opacity-60">
            <div className="h-[1px] w-8 bg-[#8c3f3f]" />
            <p className="text-xs md:text-sm text-stone-600 font-kai tracking-[0.4em]">观象授时 · 万物皆数</p>
            <div className="h-[1px] w-8 bg-[#8c3f3f]" />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
