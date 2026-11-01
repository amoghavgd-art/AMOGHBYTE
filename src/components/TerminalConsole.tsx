import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Copy, Check, AlertTriangle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ExecutionResult } from '../types';

interface TerminalConsoleProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  stdin: string;
  onStdinChange: (val: string) => void;
  onClear: () => void;
  onAskAIDoctor?: () => void;
  onSendLiveInput?: (inputLine: string) => void;
  supportsStdin: boolean;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  result,
  isRunning,
  stdin,
  onStdinChange,
  onClear,
  onAskAIDoctor,
  onSendLiveInput,
  supportsStdin,
}) => {
  const [copied, setCopied] = useState(false);
  const [liveInputText, setLiveInputText] = useState('');
  const [showPreconfiguredStdin, setShowPreconfiguredStdin] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result, isRunning]);

  const handleCopy = () => {
    if (!result) return;
    const fullText = [
      result.stdout ? `=== STDOUT ===\n${result.stdout}` : '',
      result.stderr ? `=== STDERR ===\n${result.stderr}` : '',
      result.compilationError ? `=== COMPILATION ERROR ===\n${result.compilationError}` : '',
    ].filter(Boolean).join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLiveInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInputText.trim()) return;

    // Append to existing stdin
    const updated = stdin ? `${stdin}\n${liveInputText}` : liveInputText;
    onStdinChange(updated);

    if (onSendLiveInput) {
      onSendLiveInput(liveInputText);
    }
    setLiveInputText('');
  };

  const hasError = !!(result?.stderr || result?.compilationError || (result?.exitCode !== null && result?.exitCode !== 0 && result?.exitCode !== undefined));

  return (
    <div className="flex flex-col h-full bg-[#06080d] border border-[#1a2333] font-mono text-xs select-none">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0c111a] border-b border-[#1a2333]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
            Terminal &amp; Execution Output
          </span>
          {isRunning && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse"></span>
              COMPILING &amp; RUNNING...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {supportsStdin && (
            <button
              onClick={() => setShowPreconfiguredStdin(!showPreconfiguredStdin)}
              className={`px-2 py-1 text-[11px] border transition-colors ${
                showPreconfiguredStdin
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-[#101826] border-[#223147] text-neutral-400 hover:text-neutral-200'
              }`}
              title="Pre-configure standard input for programs listening to input"
            >
              [STDIN BUFFER {stdin ? `(${stdin.split('\n').filter(Boolean).length})` : ''}]
            </button>
          )}

          <button
            onClick={handleCopy}
            disabled={!result}
            className="flex items-center gap-1 px-2 py-1 bg-[#101826] border border-[#223147] text-neutral-400 hover:text-neutral-200 disabled:opacity-40 transition-colors"
            title="Copy Output"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>COPY</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2 py-1 bg-[#101826] border border-[#223147] text-neutral-400 hover:text-rose-400 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Pre-configured Stdin Drawer (collapsible) */}
      {showPreconfiguredStdin && supportsStdin && (
        <div className="bg-[#0b101a] border-b border-[#1a2333] p-3 text-[11px]">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span>Standard Input (stdin) Stream: Each line is fed to scanf / input() / cin / Scanner</span>
            <button
              onClick={() => onStdinChange('')}
              className="text-neutral-500 hover:text-neutral-300"
            >
              Clear Buffer
            </button>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder={"Enter inputs line-by-line before running:\nJohn Doe\n28\n42"}
            rows={3}
            className="w-full bg-[#070a10] border border-[#1e293b] p-2 text-emerald-300 text-xs font-mono outline-none focus:border-emerald-500 resize-none"
          />
        </div>
      )}

      {/* Terminal Screen Body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 select-text font-mono text-[12px] leading-relaxed">
        {/* Startup banner */}
        <div className="text-neutral-500 pb-2 border-b border-neutral-900 text-[11px]">
          NeonCode Execution Engine v2.4 // Ready. Press [RUN] or [Ctrl + Enter] to compile.
        </div>

        {/* Empty state */}
        {!result && !isRunning && (
          <div className="py-8 text-center text-neutral-600">
            <div>Program output, interactive prompts, and runtime logs will appear here.</div>
            <div className="text-neutral-700 text-[11px] mt-1">
              Supports C, C++, Python 3, Node.js, Java, and SQLite.
            </div>
          </div>
        )}

        {/* Compilation Error Notice & Call to AI Doctor */}
        {result?.compilationError && (
          <div className="p-3 bg-rose-950/20 border border-rose-800/60 text-rose-300">
            <div className="flex items-center justify-between font-bold text-rose-400 mb-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                COMPILATION FAILED (Exit Code: {result.exitCode ?? 1})
              </span>
              {onAskAIDoctor && (
                <button
                  onClick={onAskAIDoctor}
                  className="px-2 py-1 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  FIX ERROR WITH AI DOCTOR
                </button>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-rose-300 text-[11px] overflow-x-auto">
              {result.compilationError}
            </pre>
          </div>
        )}

        {/* Stdout Output */}
        {result?.stdout && (
          <div className="text-neutral-100 whitespace-pre-wrap break-all">
            {result.stdout}
          </div>
        )}

        {/* Stderr / Runtime Error Output */}
        {result?.stderr && !result.compilationError && (
          <div className="p-2.5 bg-rose-950/20 border border-rose-900/50 text-rose-300">
            <div className="flex items-center justify-between text-rose-400 font-semibold mb-1 text-[11px]">
              <span>[STDERR / RUNTIME DIAGNOSTIC]</span>
              {onAskAIDoctor && (
                <button
                  onClick={onAskAIDoctor}
                  className="px-2 py-0.5 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1 text-[10px]"
                >
                  <ArrowRight className="w-3 h-3" />
                  ASK AI DOCTOR
                </button>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-[11px] overflow-x-auto">
              {result.stderr}
            </pre>
          </div>
        )}

        {/* Timeout warning */}
        {result?.timedOut && (
          <div className="p-2 bg-amber-950/40 border border-amber-600/60 text-amber-300">
            [EXECUTION TIMED OUT] Program exceeded execution limit (8s). Check for infinite loops or unconsumed input prompts.
          </div>
        )}

        {/* Program Exit Summary */}
        {result && (
          <div className="pt-2 border-t border-neutral-900/80 flex items-center justify-between text-neutral-500 text-[11px]">
            <div className="flex items-center gap-3">
              <span>
                Process exited with status{' '}
                <span
                  className={
                    result.exitCode === 0
                      ? 'text-emerald-400 font-semibold'
                      : 'text-rose-400 font-semibold'
                  }
                >
                  {result.exitCode ?? 'SIGTERM'}
                </span>
              </span>
              {result.durationMs !== undefined && (
                <span className="tabular-nums">Time: {result.durationMs}ms</span>
              )}
            </div>
            {hasError && onAskAIDoctor && (
              <button
                onClick={onAskAIDoctor}
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
              >
                Inspect Bug with AI &rarr;
              </button>
            )}
          </div>
        )}

        {isRunning && (
          <div className="flex items-center gap-2 text-emerald-400 py-1">
            <span className="terminal-cursor"></span>
            <span className="text-neutral-400">Awaiting program output or input response...</span>
          </div>
        )}

        <div ref={outputEndRef} />
      </div>

      {/* Interactive Stdin Bar (Listening to User Input) */}
      {supportsStdin && (
        <form
          onSubmit={handleLiveInputSubmit}
          className="flex items-center gap-2 px-3 py-2 bg-[#0a0f18] border-t border-[#1a2333]"
        >
          <div className="text-emerald-400 font-bold shrink-0">&gt;</div>
          <input
            type="text"
            value={liveInputText}
            onChange={(e) => setLiveInputText(e.target.value)}
            placeholder="Type input here for scanf / input() / cin and press Enter..."
            className="flex-1 bg-transparent border-none text-emerald-300 placeholder-neutral-600 text-xs font-mono outline-none"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#101826] border border-emerald-500/50 hover:bg-emerald-500 hover:text-neutral-950 text-emerald-400 text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
          >
            <span>SEND INPUT</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
};
