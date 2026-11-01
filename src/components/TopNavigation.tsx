import React from 'react';
import { Play, GraduationCap, Github, Bot, Sparkles, Terminal } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';

interface TopNavigationProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  isRunning: boolean;
  onOpenLearningLab: () => void;
  onOpenGitHubModal: () => void;
  onToggleAIDoctor: () => void;
  isAIDoctorOpen: boolean;
  hasErrors: boolean;
  onLoadInteractiveDemo: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentLanguage,
  onLanguageChange,
  onRun,
  isRunning,
  onOpenLearningLab,
  onOpenGitHubModal,
  onToggleAIDoctor,
  isAIDoctorOpen,
  hasErrors,
  onLoadInteractiveDemo,
}) => {
  const [aiOnline, setAiOnline] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        setAiOnline(data.online === true);
      })
      .catch(() => setAiOnline(false));
  }, []);

  return (
    <header className="flex items-center justify-between gap-8 px-4 py-2.5 bg-[#080c14] border-b border-[#182232] select-none">
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2 group whitespace-nowrap">
          <div className="w-7 h-7 bg-emerald-500 text-neutral-950 flex items-center justify-center font-mono font-black text-sm tracking-tighter">
            &gt;_
          </div>
          <span className="text-sm font-bold tracking-wider text-neutral-100 font-mono">
            NEONCODE<span className="text-emerald-400">.STUDIO</span>
          </span>
        </a>
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-[#0e1624] border border-[#223147] text-[10px] font-mono text-neutral-400">
          <span
            className={`w-1.5 h-1.5 ${
              aiOnline === true ? 'bg-emerald-400 animate-pulse' : aiOnline === false ? 'bg-rose-400' : 'bg-neutral-500'
            }`}
          />
          <span>AI: {aiOnline === true ? 'ONLINE' : aiOnline === false ? 'OFFLINE' : 'CONNECTING...'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-mono shrink-0">
        <button
          onClick={onOpenLearningLab}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1524] border border-[#223147] text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors whitespace-nowrap"
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI LEARNING LAB</span>
        </button>

        <button
          onClick={onOpenGitHubModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1524] border border-[#223147] text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors whitespace-nowrap"
        >
          <Github className="w-3.5 h-3.5 text-emerald-400" />
          <span>PUSH TO GITHUB</span>
        </button>

        <button
          onClick={onLoadInteractiveDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1524] border border-[#223147] text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors whitespace-nowrap"
          title="Load program demonstrating keyboard / input prompts"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span>STDIN INPUT DEMO</span>
        </button>
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <select
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
          className="bg-[#0f1726] border border-[#23334d] text-emerald-300 text-xs font-mono px-2.5 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id} className="bg-[#0a0f18] text-neutral-200">
              {l.name}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleAIDoctor}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border transition-colors whitespace-nowrap ${
            isAIDoctorOpen
              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
              : hasErrors
              ? 'bg-rose-950/50 border-rose-600 text-rose-300 animate-pulse'
              : 'bg-[#0f1726] border-[#23334d] text-neutral-300 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">AI DOCTOR</span>
          {hasErrors && <span className="text-[10px] text-rose-400 font-bold">(! FIX)</span>}
        </button>

        {/* Run Action */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'RUNNING...' : 'RUN'}</span>
        </button>
      </div>
    </header>
  );
};
