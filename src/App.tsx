import React, { useState, useEffect } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { CodeEditor } from './components/CodeEditor';
import { TerminalConsole } from './components/TerminalConsole';
import { HtmlPreview } from './components/HtmlPreview';
import { AIDoctorPanel } from './components/AIDoctorPanel';
import { LearningLabModal } from './components/LearningLabModal';
import { GitHubModal } from './components/GitHubModal';
import { LANGUAGES } from './data/languages';
import { SupportedLanguage, ExecutionResult } from './types';
import { Code, Terminal, Eye, Sparkles, LayoutTemplate, Split } from 'lucide-react';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('c');
  const [codeMap, setCodeMap] = useState<Record<SupportedLanguage, string>>(() => {
    const initial: Record<string, string> = {};
    LANGUAGES.forEach((l) => {
      initial[l.id] = l.sampleCode;
    });
    return initial as Record<SupportedLanguage, string>;
  });

  const [stdin, setStdin] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAIDoctorOpen, setIsAIDoctorOpen] = useState<boolean>(false);
  const [isLearningLabOpen, setIsLearningLabOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);

  // Layout mode for HTML: 'split' (Editor + Preview side-by-side) or 'tabbed'
  const [htmlViewMode, setHtmlViewMode] = useState<'split' | 'preview-only' | 'editor-only'>('split');

  const currentLangConfig = LANGUAGES.find((l) => l.id === currentLanguage) || LANGUAGES[0];
  const currentCode = codeMap[currentLanguage] || currentLangConfig.sampleCode;

  const handleCodeChange = (newCode: string) => {
    setCodeMap((prev) => ({
      ...prev,
      [currentLanguage]: newCode,
    }));
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setExecutionResult(null);
    setStdin('');
  };

  const handleLoadInteractiveDemo = () => {
    const sample = currentLangConfig.interactiveInputSample;
    handleCodeChange(sample);
    setExecutionResult(null);
  };

  // Run Code execution
  const executeCode = async (overrideStdin?: string) => {
    if (isRunning) return;
    setIsRunning(true);

    const activeStdin = overrideStdin !== undefined ? overrideStdin : stdin;

    try {
      if (currentLanguage === 'html') {
        // HTML is rendered client-side in HtmlPreview
        setExecutionResult({
          stdout: 'HTML/CSS/JS refreshed in Live Preview DOM Sandbox.',
          stderr: '',
          exitCode: 0,
          timestamp: new Date().toLocaleTimeString(),
          durationMs: 4,
        });
        setIsRunning(false);
        return;
      }

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: currentLanguage,
          code: currentCode,
          stdin: activeStdin,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Execution failed on server.');
      }

      const data = await res.json();
      setExecutionResult({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err.message || 'Network / runner error',
        exitCode: 1,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendLiveInput = (inputLine: string) => {
    // When user sends input from terminal bar, re-run with updated stdin stream
    executeCode(stdin ? `${stdin}\n${inputLine}` : inputLine);
  };

  // Keyboard shortcut listener: Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLanguage, currentCode, stdin, isRunning]);

  const hasErrors = !!(
    executionResult?.stderr ||
    executionResult?.compilationError ||
    (executionResult?.exitCode !== null && executionResult?.exitCode !== 0 && executionResult?.exitCode !== undefined)
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a0f] text-neutral-100 font-sans overflow-hidden">
      {/* Top Navigation */}
      <TopNavigation
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onRun={() => executeCode()}
        isRunning={isRunning}
        onOpenLearningLab={() => setIsLearningLabOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onToggleAIDoctor={() => setIsAIDoctorOpen(!isAIDoctorOpen)}
        isAIDoctorOpen={isAIDoctorOpen}
        hasErrors={hasErrors}
        onLoadInteractiveDemo={handleLoadInteractiveDemo}
      />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Canvas */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* HTML MODE: Split or Custom Views */}
          {currentLanguage === 'html' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* HTML View Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0f18] border-b border-[#182232] text-xs font-mono">
                <div className="flex items-center gap-2 text-neutral-400">
                  <span>HTML/CSS/JS Sandbox</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-emerald-400">Live Browser Engine</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHtmlViewMode('split')}
                    className={`px-2 py-0.5 border text-[11px] ${
                      htmlViewMode === 'split'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#101826] border-[#223147] text-neutral-400'
                    }`}
                  >
                    SPLIT VIEW
                  </button>
                  <button
                    onClick={() => setHtmlViewMode('editor-only')}
                    className={`px-2 py-0.5 border text-[11px] ${
                      htmlViewMode === 'editor-only'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#101826] border-[#223147] text-neutral-400'
                    }`}
                  >
                    CODE ONLY
                  </button>
                  <button
                    onClick={() => setHtmlViewMode('preview-only')}
                    className={`px-2 py-0.5 border text-[11px] ${
                      htmlViewMode === 'preview-only'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#101826] border-[#223147] text-neutral-400'
                    }`}
                  >
                    PREVIEW ONLY
                  </button>
                </div>
              </div>

              {/* View containers */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {(htmlViewMode === 'split' || htmlViewMode === 'editor-only') && (
                  <div className={`h-full ${htmlViewMode === 'split' ? 'md:w-1/2' : 'w-full'}`}>
                    <CodeEditor
                      code={currentCode}
                      onChange={handleCodeChange}
                      language={currentLanguage}
                      fileName={currentLangConfig.defaultFileName}
                      onRun={() => executeCode()}
                    />
                  </div>
                )}

                {(htmlViewMode === 'split' || htmlViewMode === 'preview-only') && (
                  <div className={`h-full ${htmlViewMode === 'split' ? 'md:w-1/2' : 'w-full'}`}>
                    <HtmlPreview htmlCode={currentCode} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* NON-HTML MODE: Compiler Code Editor + Terminal Console */
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
              {/* Left / Top: Code Editor */}
              <div className="flex-1 h-3/5 lg:h-full overflow-hidden">
                <CodeEditor
                  code={currentCode}
                  onChange={handleCodeChange}
                  language={currentLanguage}
                  fileName={currentLangConfig.defaultFileName}
                  onRun={() => executeCode()}
                />
              </div>

              {/* Right / Bottom: Interactive Terminal & Stdin */}
              <div className="h-2/5 lg:h-full lg:w-[480px] xl:w-[540px] flex flex-col border-t lg:border-t-0 lg:border-l border-[#182232] overflow-hidden">
                <TerminalConsole
                  result={executionResult}
                  isRunning={isRunning}
                  stdin={stdin}
                  onStdinChange={setStdin}
                  onClear={() => setExecutionResult(null)}
                  onAskAIDoctor={() => setIsAIDoctorOpen(true)}
                  onSendLiveInput={handleSendLiveInput}
                  supportsStdin={currentLangConfig.supportsStdin}
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Doctor Drawer */}
        {isAIDoctorOpen && (
          <div className="w-full md:w-[420px] lg:w-[460px] h-full shadow-2xl z-30 shrink-0">
            <AIDoctorPanel
              isOpen={isAIDoctorOpen}
              onClose={() => setIsAIDoctorOpen(false)}
              code={currentCode}
              language={currentLanguage}
              errorOutput={
                executionResult?.compilationError ||
                executionResult?.stderr ||
                (executionResult?.exitCode !== 0 ? `Exit Code: ${executionResult?.exitCode}` : '')
              }
              onApplyFix={(fixed) => {
                handleCodeChange(fixed);
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 bg-[#080c14] border-t border-[#182232] text-[11px] font-mono text-neutral-500 select-none">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-semibold">{currentLangConfig.name}</span>
          <span>·</span>
          <span>{currentLangConfig.description}</span>
        </div>

        <div className="flex items-center gap-4 tabular-nums">
          {executionResult?.durationMs !== undefined && (
            <span>Execution Time: {executionResult.durationMs}ms</span>
          )}
          <span>UTF-8</span>
          <span className="text-emerald-400/80">NeonCode Studio v2.4</span>
        </div>
      </footer>

      {/* AI Learning Lab Modal */}
      <LearningLabModal
        isOpen={isLearningLabOpen}
        onClose={() => setIsLearningLabOpen(false)}
        currentLanguage={currentLanguage}
        currentCode={currentCode}
        onLoadStarterCode={(starter) => {
          handleCodeChange(starter);
        }}
        onRunCode={() => executeCode()}
      />

      {/* GitHub Repository Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        currentCode={currentCode}
        defaultFileName={currentLangConfig.defaultFileName}
      />
    </div>
  );
}
