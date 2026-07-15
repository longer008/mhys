"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import useSWR from "swr";
import DivinationForm from "@/components/DivinationForm";
import HexagramDisplay from "@/components/HexagramDisplay";
import SettingsDialog from "@/components/SettingsDialog";
import { calculateHexagrams, type DivinationResult } from "@/lib/meihua";
import { HistoryDialog } from "@/components/HistoryDialog";
import type { DivinationRequestContext, DivinationSubmission } from "@/features/divination/types";
import { History as HistoryIcon, RotateCcw } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-client";
import {
  DEFAULT_DIVINATION_RULES_SETTINGS,
  DEFAULT_SITE_CONTENT_SETTINGS,
  type PublicSiteSettings,
} from "@/features/settings/contracts";

const HOME_STEPS = [
  { key: 1, mark: "壹", label: "定所问" },
  { key: 2, mark: "贰", label: "取三数" },
  { key: 3, mark: "叁", label: "观卦象" },
] as const;

export default function Home() {
  const { data: publicSettings } = useSWR<PublicSiteSettings>(
    "/api/settings",
    (url: string) => fetchApi<PublicSiteSettings>(url, { cache: "no-store" }),
    { revalidateOnFocus: true, refreshInterval: 60_000 }
  );
  const site = publicSettings?.site || DEFAULT_SITE_CONTENT_SETTINGS;
  const divination = publicSettings?.divination || DEFAULT_DIVINATION_RULES_SETTINGS;

  useEffect(() => {
    document.title = `${site.siteTitle} | 观象占验`;
  }, [site.siteTitle]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [question, setQuestion] = useState("");
  const [requestContext, setRequestContext] = useState<DivinationRequestContext | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  const handleDivinationComplete = (submission: DivinationSubmission) => {
    const { num1, num2, num3, movingLine } = submission.numbers;
    const generatedAt = new Date(submission.generatedAt);
    const hexagrams = calculateHexagrams(
      num1,
      num2,
      num3,
      movingLine,
      submission.method,
      generatedAt
    );
    setResult(hexagrams);
    setQuestion(submission.question);
    setRequestContext({
      ...submission,
      clientRequestId: crypto.randomUUID(),
    });
    setActiveStep(3);
    setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
    setActiveStep(1);
  };

  return (
    <MotionConfig reducedMotion="user">
      <main id="main-content" className="frontend-theme frontend-shell relative -mb-16 flex min-h-[calc(100dvh-4rem)] w-full flex-1 flex-col overflow-hidden px-4 pb-24 pt-4 sm:px-6 lg:px-10">
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="loading"
            siteTitle={site.siteTitle}
            tagline={site.footerText}
            onComplete={() => setIsLoading(false)}
          />
        )}
      </AnimatePresence>

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col"
        >
          <header className="relative z-30 flex h-14 items-center justify-between border-b border-border/70">
            <button
              type="button"
              onClick={handleReset}
              className="group flex items-center gap-3 rounded-sm text-left"
              aria-label="返回起卦首页"
            >
              <span className="grid h-8 w-8 place-items-center border border-[var(--cinnabar)]/45 text-xs font-semibold text-[var(--cinnabar)] transition-colors group-hover:bg-[var(--cinnabar)] group-hover:text-white">
                梅
              </span>
              <span className="hidden text-sm font-medium tracking-[0.18em] text-foreground sm:block">{site.siteTitle}</span>
            </button>

            <nav className="flex items-center gap-1" aria-label="辅助功能">
              <button
                ref={historyButtonRef}
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="历史记录"
              >
                <HistoryIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">历史</span>
              </button>
              <SettingsDialog allowCustomAi={divination.allowCustomAi} />
            </nav>
          </header>

          <HistoryDialog
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            triggerRef={historyButtonRef}
          />

          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute bottom-10 right-10 hidden whitespace-nowrap text-[clamp(6rem,11vw,11rem)] font-semibold leading-[0.86] tracking-[-0.08em] text-foreground/[0.025] lg:block">
              象数
            </div>
          </div>

          <section
            className={`relative z-10 grid flex-1 items-start gap-10 pb-8 pt-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(30rem,1fr)] lg:gap-16 lg:pt-16 ${showResult ? "lg:grid-cols-[18rem_minmax(0,1fr)]" : ""}`}
          >
            <div className={`max-w-xl transition-all duration-300 ${showResult ? "lg:sticky lg:top-10" : "lg:pt-8"}`}>
              <div className="mb-7 flex items-center gap-3 text-xs font-medium tracking-[0.28em] text-[var(--cinnabar)]">
                <span className="h-px w-8 bg-current" />
                {site.homeEyebrow}
              </div>

              <h1 className={`break-words font-song font-semibold tracking-[-0.055em] text-foreground text-balance transition-[font-size] duration-300 ${showResult
                ? "text-4xl leading-tight lg:text-5xl"
                : site.siteTitle === "梅花易数"
                  ? "text-[clamp(4rem,9vw,8.5rem)] leading-[0.95]"
                  : "text-[clamp(3rem,7vw,6.5rem)] leading-[1.05]"
                }`}>
                {site.siteTitle === "梅花易数" ? (
                  <>
                    梅花
                    <br />
                    <span className="ml-[0.42em] text-[var(--cinnabar)]">易数</span>
                  </>
                ) : site.siteTitle}
              </h1>

              <p className={`mt-7 max-w-md text-base leading-8 text-muted-foreground text-pretty ${showResult ? "lg:text-sm lg:leading-7" : "sm:text-lg"}`}>
                {site.homeSubtitle}
              </p>

              <div className="mt-8 grid max-w-md grid-cols-3 border-y border-border/75 py-4 text-xs" role="list" aria-label="起卦流程">
                {HOME_STEPS.map((step) => {
                  const isActive = activeStep === step.key;
                  const isComplete = activeStep > step.key;

                  return (
                    <span
                      key={step.key}
                      role="listitem"
                      aria-current={isActive ? "step" : undefined}
                      className={cn(
                        "transition-colors duration-200",
                        isActive
                          ? "font-medium text-[var(--cinnabar)]"
                          : isComplete
                            ? "text-foreground"
                            : "text-muted-foreground/70",
                        step.key === 2 ? "text-center" : step.key === 3 ? "text-right" : ""
                      )}
                    >
                      {step.mark} · {step.label}
                    </span>
                  );
                })}
              </div>

              {showResult && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--cinnabar)]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  返回重新起卦
                </button>
              )}
            </div>

            <div className="w-full min-w-0 self-center">
              {site.announcementEnabled && site.announcementText && !showResult && (
                <div className="mx-auto mb-4 max-w-xl border-l-2 border-[var(--cinnabar)] bg-card/65 px-4 py-3 font-ui-cn text-sm leading-6 text-muted-foreground">
                  {site.announcementText}
                </div>
              )}
              <AnimatePresence mode="wait" initial={false}>
                {!showResult ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26 }}
                    className="mx-auto w-full max-w-xl"
                  >
                    <DivinationForm
                      onComplete={handleDivinationComplete}
                      onStepChange={setActiveStep}
                      enabledMethods={divination.enabledMethods}
                      defaultMethod={divination.defaultMethod}
                      maxQuestionLength={divination.maxQuestionLength}
                      noticeText={site.divinationNotice}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="w-full"
                  >
                    {result && requestContext && (
                      <HexagramDisplay
                        result={result}
                        question={question}
                        requestContext={requestContext}
                        onReset={handleReset}
                        aiInterpretationEnabled={divination.aiInterpretationEnabled}
                        allowCustomAi={divination.allowCustomAi}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      )}
      </main>
    </MotionConfig>
  );
}
