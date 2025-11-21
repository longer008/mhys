"use client";

import { useState } from "react";
import DivinationForm from "@/components/DivinationForm";
import HexagramDisplay from "@/components/HexagramDisplay";
import SettingsDialog from "@/components/SettingsDialog";
import { calculateHexagrams, DivinationResult } from "@/lib/meihua";
import { HistoryDialog } from "@/components/HistoryDialog";
import { saveRecord } from "@/lib/history";
import { History as HistoryIcon } from "lucide-react";

export default function Home() {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [question, setQuestion] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleInterpretationComplete = (interpretation: string) => {
    if (result && question) {
      saveRecord(question, result, interpretation);
    }
  };

  const handleDivinationComplete = (num1: number, num2: number, num3: number, q: string) => {
    const hexagrams = calculateHexagrams(num1, num2, num3);
    setResult(hexagrams);
    setQuestion(q);
    setShowResult(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden selection:bg-stone-200 selection:text-stone-900">
      <SettingsDialog />
      <button
        onClick={() => setIsHistoryOpen(true)}
        className="fixed top-4 right-16 p-2 text-stone-400 hover:text-stone-600 transition-colors z-50"
        title="历史记录"
      >
        <HistoryIcon className="w-6 h-6" />
      </button>
      <HistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle Ink Wash Circles */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-stone-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-stone-100/30 rounded-full blur-[80px]" />

        {/* Vertical Chinese Text Decoration (Optional, subtle) */}
        <div className="absolute top-24 right-12 text-[10rem] font-song text-stone-50 opacity-[0.03] select-none writing-vertical-rl">
          梅花易数
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-0">
        {/* Hero Section */}
        <div className={`text-center space-y-8 transition-all duration-1000 ease-out ${showResult ? 'scale-75 -translate-y-12 opacity-80' : 'opacity-100'}`}>
          <div className="relative inline-block">
            <h1
              onClick={() => setShowResult(false)}
              className="text-6xl md:text-8xl font-song font-bold text-stone-800 tracking-widest relative z-10 cursor-pointer hover:opacity-80 transition-opacity"
            >
              梅花易数
            </h1>
            {/* Red Seal Decoration */}
            <div className="absolute -top-4 -right-8 w-16 h-16 border-4 border-red-800/20 rounded-sm rotate-12 flex items-center justify-center opacity-60">
              <span className="text-red-900/30 font-serif text-xs">观象</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
            <p className="text-lg md:text-xl text-stone-500 max-w-xl mx-auto font-kai leading-loose tracking-wide">
              万物皆有数，数中藏玄机。<br />
              <span className="text-stone-400 text-base">观物取象 · 以象定数 · 洞悉天机</span>
            </p>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
          </div>
        </div>

        {/* Interactive Section */}
        <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
          {!showResult ? (
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
              <DivinationForm onComplete={handleDivinationComplete} />
            </div>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
              {result && <HexagramDisplay result={result} question={question} onReset={() => setShowResult(false)} onInterpretationComplete={handleInterpretationComplete} />}
            </div>
          )}
        </div>
      </div>

      <footer className="absolute bottom-6 text-stone-300 text-xs font-song tracking-[0.2em]">
        © 2025 梅花易数 · 观象授时
      </footer>
    </main>
  );
}
