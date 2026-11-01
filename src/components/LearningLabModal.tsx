import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Code2,
  X,
  Play,
  Award,
} from 'lucide-react';
import { AILearningStep, SupportedLanguage } from '../types';

interface LearningLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  currentCode: string;
  onLoadStarterCode: (starterCode: string) => void;
  onRunCode: () => void;
}

const PRESET_TOPICS: Record<SupportedLanguage, string[]> = {
  c: [
    'Variables, Data Types & Format Specifiers',
    'Control Flow, Loops & Conditionals',
    'Functions & Scope in C',
    'Pointers, Memory Addresses & Dereferencing',
    'Dynamic Memory Allocation (malloc & free)',
  ],
  python: [
    'Python Syntax, Variables & Dynamic Typing',
    'Lists, Dictionaries & List Comprehensions',
    'Functions, *args & **kwargs',
    'Object-Oriented Programming & Classes',
    'File Handling, Exceptions & Standard Library',
  ],
  html: [
    'Semantic HTML5 Architecture & Document Structure',
    'Modern CSS Flexbox & Box Model',
    'Interactive DOM Manipulation with JavaScript',
    'Event Listeners & Form Validation',
    'Async Fetch API & Dynamic UI Updates',
  ],
  javascript: [
    'ES6+ Fundamentals: Arrow Functions & Destructuring',
    'Promises, Async/Await & Event Loop',
    'Array Transformations: map, filter, reduce',
    'Closures & Lexical Scoping',
    'Error Handling & Defensive Coding',
  ],
  cpp: [
    'C++ Basics & Standard I/O Streams',
    'Standard Template Library: Vectors & Maps',
    'References, Const Correctness & Pointers',
    'Classes, Constructors & RAII',
    'Templates & Generic Programming',
  ],
  java: [
    'Java Syntax, Primitives & Object Wrappers',
    'Classes, Encapsulation & Inheritance',
    'Collections Framework: ArrayList & HashMap',
    'Exception Handling & Try-with-Resources',
    'Interfaces, Polymorphism & Lambda Expressions',
  ],
  typescript: [
    'Basic Types, Interfaces & Type Aliases',
    'Generics & Utility Types',
    'Union Types & Type Narrowing',
    'Classes & Access Modifiers',
    'Advanced Types & Mapped Types',
  ],
  sql: [
    'Table Creation & Primary Keys',
    'SELECT, Filtering (WHERE) & Sorting (ORDER BY)',
    'Aggregations (GROUP BY & HAVING)',
    'INNER JOIN & LEFT JOIN Mechanics',
    'Subqueries & Transactions',
  ],
};

export const LearningLabModal: React.FC<LearningLabModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  currentCode,
  onLoadStarterCode,
  onRunCode,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLanguage);
  const [selectedTopic, setSelectedTopic] = useState<string>(PRESET_TOPICS[currentLanguage]?.[0] || 'Fundamentals');
  const [customTopic, setCustomTopic] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [lessonData, setLessonData] = useState<AILearningStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const activeTopic = customTopic.trim() || selectedTopic;

  const startLesson = async (stepNum = 1) => {
    setIsLoading(true);
    setErrorMsg(null);
    setShowHint(false);

    try {
      const res = await fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          topic: activeTopic,
          currentStep: stepNum,
          action: 'start',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start learning lesson.');
      }

      const data: AILearningStep = await res.json();
      setLessonData(data);
      setCurrentStep(data.stepNumber || stepNum);
    } catch (err: any) {
      setErrorMsg(err.message || 'Learning tutor connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateSubmission = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          topic: activeTopic,
          currentStep: currentStep,
          userSubmission: currentCode,
          action: 'evaluate',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Evaluation failed.');
      }

      const data: AILearningStep = await res.json();
      setLessonData(data);
      if (data.passed) {
        setCurrentStep(data.stepNumber);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none font-sans">
      <div className="bg-[#080d16] border border-[#1e2a3f] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0d1422] border-b border-[#1e2a3f]">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
                NeonCode Step-by-Step Learning Lab
              </h2>
              <div className="text-[11px] text-neutral-400">
                Interactive AI Tutor with Real-Time Code Challenges
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1a2538] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Setup Strip: Select Language & Topic if not started */}
          {!lessonData && (
            <div className="space-y-4">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">
                  1. Select Target Language:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['c', 'python', 'html', 'javascript', 'cpp', 'java', 'sql'] as SupportedLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setSelectedTopic(PRESET_TOPICS[lang]?.[0] || 'Fundamentals');
                      }}
                      className={`py-2 px-3 text-left font-mono border transition-all ${
                        selectedLanguage === lang
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-[#0e1524] border-[#1e2a3f] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="uppercase text-xs">{lang}</div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {PRESET_TOPICS[lang]?.length || 5} lessons
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">
                  2. Choose Learning Track / Topic:
                </label>
                <div className="space-y-1.5">
                  {(PRESET_TOPICS[selectedLanguage] || []).map((topic, idx) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setCustomTopic('');
                      }}
                      className={`w-full text-left p-2.5 border transition-all flex items-center justify-between ${
                        selectedTopic === topic && !customTopic
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-medium'
                          : 'bg-[#0e1524] border-[#1e2a3f] text-neutral-300 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 text-[11px]">0{idx + 1}.</span>
                        <span>{topic}</span>
                      </span>
                      <span className="text-neutral-500 text-[10px]">Step-by-Step</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Or enter custom topic:
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g., Bitwise operations, Graph BFS/DFS, CSS Grid, Async Generators"
                  className="w-full bg-[#0a0f19] border border-[#1e2a3f] p-2 text-emerald-300 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => startLesson(1)}
                disabled={isLoading}
                className="w-full py-3 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                START STEP-BY-STEP MASTERCLASS
              </button>
            </div>
          )}

          {/* Active Lesson View */}
          {lessonData && (
            <div className="space-y-4">
              {/* Step indicator bar */}
              <div className="flex items-center justify-between p-3 bg-[#0c121e] border border-[#1e2a3f]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500 text-neutral-950 font-mono font-bold text-xs">
                    STEP {lessonData.stepNumber} OF {lessonData.totalSteps || 5}
                  </span>
                  <span className="font-bold text-neutral-200 text-sm">
                    {lessonData.topicTitle}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setLessonData(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-200 underline text-[11px]"
                >
                  Change Topic
                </button>
              </div>

              {/* Tutor feedback banner if just evaluated */}
              {lessonData.feedback && (
                <div
                  className={`p-3.5 border ${
                    lessonData.passed
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-500 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1 text-xs">
                    {lessonData.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>CHALLENGE SOLVED! EXCELLENT WORK!</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>NEEDS REVISION - KEEP GOING!</span>
                      </>
                    )}
                  </div>
                  <div className="text-[12px] leading-relaxed">{lessonData.feedback}</div>
                </div>
              )}

              {/* Theory / Concept */}
              <div className="bg-[#0b101a] border border-[#1e2a3f] p-4 space-y-2">
                <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  Concept &amp; Mechanics:
                </div>
                <div className="text-neutral-200 leading-relaxed text-xs whitespace-pre-wrap">
                  {lessonData.explanation}
                </div>
              </div>

              {/* Coding Challenge Box */}
              <div className="bg-[#080d16] border-2 border-emerald-500/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                    <Code2 className="w-4 h-4" />
                    <span>Your Coding Challenge:</span>
                  </div>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    Expected Output: {lessonData.expectedOutput}
                  </span>
                </div>

                <div className="text-neutral-100 font-medium text-xs leading-relaxed bg-[#0e1626] p-3 border border-[#1e2a3f]">
                  {lessonData.challengeTask}
                </div>

                {/* Actions: Load Starter Code + Run */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      onLoadStarterCode(lessonData.starterCode);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>LOAD STARTER CODE INTO EDITOR &amp; GO</span>
                  </button>

                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="py-2 px-3 bg-[#101826] border border-[#223147] text-neutral-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showHint ? 'HIDE HINT' : 'GET HINT'}</span>
                  </button>
                </div>

                {/* Hint Drawer */}
                {showHint && lessonData.hint && (
                  <div className="p-3 bg-amber-950/20 border border-amber-600/40 text-amber-200 text-xs leading-relaxed">
                    <strong className="text-amber-400">HINT:</strong> {lessonData.hint}
                  </div>
                )}
              </div>

              {/* Submission / Evaluation Action */}
              <div className="p-4 bg-[#0d1422] border border-[#1e2a3f] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-neutral-400 text-xs">
                  Done writing code in the editor? Submit your code for AI Tutor grading:
                </div>
                <button
                  onClick={evaluateSubmission}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-sky-500 text-neutral-950 font-bold hover:bg-sky-400 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Award className="w-4 h-4" />
                  <span>CHECK MY CODE &amp; ADVANCE</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {isLoading && (
            <div className="py-8 text-center text-emerald-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent animate-spin"></div>
              <div className="flex items-center gap-1.5">
                <span>Connecting with AI Tutor...</span>
                <span className="tabular-nums text-neutral-400">[{elapsedSeconds}s]</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
