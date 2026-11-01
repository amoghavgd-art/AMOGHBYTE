import React, { useState, useEffect } from 'react';
import { Bot, Check, ArrowRight, Sparkles, X, Activity, BookOpen, AlertCircle } from 'lucide-react';
import { AIDoctorResult } from '../types';

interface AIDoctorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  errorOutput?: string;
  onApplyFix: (newCode: string) => void;
}

export const AIDoctorPanel: React.FC<AIDoctorPanelProps> = ({
  isOpen,
  onClose,
  code,
  language,
  errorOutput,
  onApplyFix,
}) => {
  const [activeTab, setActiveTab] = useState<'fix' | 'explain'>('fix');
  const [isLoading, setIsLoading] = useState(false);
  const [fixResult, setFixResult] = useState<AIDoctorResult | null>(null);
  const [explainResult, setExplainResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Auto-run analysis when opened
  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setApplied(false);

    try {
      const res = await fetch('/api/ai/fix-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          errorOutput: errorOutput || 'General syntax & logic inspection',
          context: 'User requested comprehensive error diagnosis and clean fix.',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Diagnostic request failed. Check server connection.');
      }

      const data: AIDoctorResult = await res.json();
      setFixResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to AI Doctor.');
    } finally {
      setIsLoading(false);
    }
  };

  const runExplanation = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to explain code.');
      }

      const data = await res.json();
      setExplainResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to explain code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-[#080c14] border-l border-[#1a2333] font-sans text-xs select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d131f] border-b border-[#1a2333]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-neutral-100 uppercase tracking-wider text-xs">
            Neon AI Code Doctor
          </span>
          <span className="px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
            {language.toUpperCase()}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1a2436] text-neutral-400 hover:text-neutral-200 transition-colors"
          title="Close Doctor Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a2333] bg-[#0a0f19]">
        <button
          onClick={() => {
            setActiveTab('fix');
            if (!fixResult) runDiagnostics();
          }}
          className={`flex-1 py-2 px-3 text-center font-medium transition-colors border-r border-[#1a2333] flex items-center justify-center gap-1.5 ${
            activeTab === 'fix'
              ? 'bg-[#101826] text-emerald-400 border-b-2 border-b-emerald-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Error Fixer</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('explain');
            if (!explainResult) runExplanation();
          }}
          className={`flex-1 py-2 px-3 text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'explain'
              ? 'bg-[#101826] text-emerald-400 border-b-2 border-b-emerald-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Big-O &amp; Logic</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Alert if request failed */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Diagnostic Failed</div>
              <div className="text-[11px] mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <div className="text-emerald-400 font-mono text-xs flex items-center gap-1.5">
              <span>Running code diagnostics...</span>
              <span className="tabular-nums text-neutral-400">[{elapsedSeconds}s]</span>
            </div>
            <div className="text-neutral-500 text-[11px]">
              Inspecting syntax tree, compiler diagnostics &amp; execution flow
            </div>
          </div>
        )}

        {/* Tab 1: ERROR FIXER */}
        {activeTab === 'fix' && !isLoading && (
          <>
            {!fixResult ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-neutral-400 text-xs">
                  Run diagnostics to analyze syntax, runtime issues, and generate verified fixes.
                </p>
                <button
                  onClick={runDiagnostics}
                  className="px-4 py-2 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs flex items-center gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze Code &amp; Fix
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Root Cause Banner */}
                <div className="p-3 bg-amber-950/30 border border-amber-600/50">
                  <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                    Root Cause Identified:
                  </div>
                  <div className="text-amber-100 text-xs font-medium leading-relaxed">
                    {fixResult.rootCause}
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-1">
                  <div className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider">
                    Detailed Explanation:
                  </div>
                  <div className="text-neutral-300 leading-relaxed bg-[#0b101a] border border-[#1a2333] p-3 text-xs whitespace-pre-wrap">
                    {fixResult.explanation}
                  </div>
                </div>

                {/* Key Changes List */}
                {fixResult.keyChanges && fixResult.keyChanges.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider">
                      Key Fixes Applied:
                    </div>
                    <ul className="space-y-1 bg-[#0b101a] border border-[#1a2333] p-3">
                      {fixResult.keyChanges.map((change, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-300 text-[11px]">
                          <span className="text-emerald-400 font-bold font-mono">[{i + 1}]</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pro Tip */}
                {fixResult.proTip && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs">
                    <span className="font-bold text-emerald-400 mr-1.5">PRO TIP:</span>
                    {fixResult.proTip}
                  </div>
                )}

                {/* Apply Fix Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onApplyFix(fixResult.fixedCode);
                      setApplied(true);
                      setTimeout(() => setApplied(false), 2500);
                    }}
                    className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      applied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                    }`}
                  >
                    {applied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>FIX APPLIED TO EDITOR!</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>APPLY FIX DIRECTLY TO EDITOR</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Fixed Code Preview */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px] uppercase tracking-wider">
                    <span>Fixed Code Solution</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(fixResult.fixedCode)}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-3 bg-[#06080e] border border-[#1a2333] font-mono text-[11px] text-neutral-200 overflow-x-auto max-h-56 whitespace-pre">
                    {fixResult.fixedCode}
                  </pre>
                </div>

                <button
                  onClick={runDiagnostics}
                  className="w-full py-2 bg-[#101826] border border-[#223147] text-neutral-300 hover:text-white transition-colors text-xs font-semibold"
                >
                  RE-RUN DIAGNOSTICS
                </button>
              </div>
            )}
          </>
        )}

        {/* Tab 2: EXPLAIN & BIG-O */}
        {activeTab === 'explain' && !isLoading && (
          <>
            {!explainResult ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-neutral-400 text-xs">
                  Generate algorithmic breakdown, time &amp; space complexity (Big-O), and memory profile.
                </p>
                <button
                  onClick={runExplanation}
                  className="px-4 py-2 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs flex items-center gap-1.5 mx-auto"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Analyze Complexity
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Big-O Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-[#0b101a] border border-[#1a2333]">
                    <div className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold">
                      Time Complexity
                    </div>
                    <div className="text-emerald-400 font-mono font-bold text-sm mt-0.5">
                      {explainResult.timeComplexity}
                    </div>
                  </div>
                  <div className="p-3 bg-[#0b101a] border border-[#1a2333]">
                    <div className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold">
                      Space Complexity
                    </div>
                    <div className="text-sky-400 font-mono font-bold text-sm mt-0.5">
                      {explainResult.spaceComplexity}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <div className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider">
                    Algorithm Overview:
                  </div>
                  <div className="text-neutral-200 bg-[#0b101a] border border-[#1a2333] p-3 text-xs leading-relaxed">
                    {explainResult.summary}
                  </div>
                </div>

                {/* Line by line */}
                {explainResult.lineByLineBreakdown && (
                  <div className="space-y-1.5">
                    <div className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider">
                      Walkthrough:
                    </div>
                    <div className="space-y-1 bg-[#0b101a] border border-[#1a2333] p-3 max-h-48 overflow-y-auto">
                      {explainResult.lineByLineBreakdown.map((item: string, idx: number) => (
                        <div key={idx} className="text-neutral-300 text-[11px] py-0.5 border-b border-neutral-900/60 last:border-none">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimizations */}
                {explainResult.optimizations && (
                  <div className="space-y-1.5">
                    <div className="text-neutral-400 font-semibold text-[11px] uppercase tracking-wider">
                      Optimization Insights:
                    </div>
                    <ul className="space-y-1 bg-[#0b101a] border border-[#1a2333] p-3">
                      {explainResult.optimizations.map((opt: string, idx: number) => (
                        <li key={idx} className="text-neutral-300 text-[11px] flex items-start gap-1.5">
                          <span className="text-emerald-400">&bull;</span>
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
