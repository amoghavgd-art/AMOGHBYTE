import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
  fileName: string;
  readOnly?: boolean;
  onRun?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  fileName,
  readOnly = false,
  onRun,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll between textarea, syntax highlight pre, and line numbers
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;

      if (preRef.current) {
        preRef.current.scrollTop = top;
        preRef.current.scrollLeft = left;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        // Dedent
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        if (value.startsWith('    ', lineStart)) {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 4);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - 4);
            textarea.selectionEnd = Math.max(lineStart, end - 4);
          }, 0);
        } else if (value.startsWith('  ', lineStart)) {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 2);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - 2);
            textarea.selectionEnd = Math.max(lineStart, end - 2);
          }, 0);
        }
      } else {
        // Indent 4 spaces
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
      return;
    }

    // Auto-close brackets and quotes
    const pairMap: Record<string, string> = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairMap[e.key]) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end) {
        e.preventDefault();
        const closeChar = pairMap[e.key];
        const newValue = textarea.value.substring(0, start) + e.key + closeChar + textarea.value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
    }
  };

  // Map language to Prism grammar
  const getPrismLang = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'c': return 'c';
      case 'cpp':
      case 'c++': return 'cpp';
      case 'python':
      case 'py': return 'python';
      case 'html': return 'markup';
      case 'javascript':
      case 'js': return 'javascript';
      case 'typescript':
      case 'ts': return 'typescript';
      case 'java': return 'java';
      case 'sql': return 'sql';
      default: return 'javascript';
    }
  };

  const prismGrammar = getPrismLang(language);
  const grammar = Prism.languages[prismGrammar] || Prism.languages.javascript;
  const highlightedCode = Prism.highlight(code || ' ', grammar, prismGrammar);

  const lines = (code || '').split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Current cursor position calculations
  const [cursorPos, setCursorPos] = React.useState({ line: 1, col: 1 });

  const updateCursor = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.substring(0, pos);
    const lineNum = textBefore.split('\n').length;
    const lastNewline = textBefore.lastIndexOf('\n');
    const colNum = pos - (lastNewline === -1 ? 0 : lastNewline + 1) + 1;
    setCursorPos({ line: lineNum, col: colNum });
  };

  useEffect(() => {
    handleScroll();
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-[#070a0f] border border-[#1a2333] select-none font-mono text-[13px]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#0c111a] border-b border-[#1a2333] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#101826] border border-[#223147] text-neutral-200">
            <span className="w-2 h-2 bg-emerald-500 inline-block"></span>
            <span className="font-medium">{fileName}</span>
            <span className="text-neutral-500 text-[11px]">({language.toUpperCase()})</span>
          </div>
          <span className="text-neutral-600 text-xs hidden sm:inline">UTF-8</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
          <span className="tabular-nums">Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span className="text-neutral-600">|</span>
          <span className="tabular-nums">{code.length} chars</span>
          <span className="text-neutral-600">|</span>
          <span className="text-emerald-400/90 hidden md:inline">Ctrl + Enter to Run</span>
        </div>
      </div>

      <div className="relative flex-1 flex overflow-hidden">
        <div
          ref={lineNumbersRef}
          className="w-12 bg-[#090e17] border-r border-[#1a2333] text-neutral-600 text-right pr-3 pt-3 select-none overflow-hidden font-mono text-[13px] leading-[22px]"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className={`transition-colors ${
                cursorPos.line === i + 1 ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="relative flex-1 h-full overflow-hidden">
          <pre
            ref={preRef}
            className="absolute inset-0 m-0 p-3 bg-transparent overflow-hidden pointer-events-none font-mono text-[13px] leading-[22px] whitespace-pre tab-4"
            dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
          />

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursor();
            }}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full m-0 p-3 bg-transparent text-transparent caret-emerald-400 resize-none font-mono text-[13px] leading-[22px] whitespace-pre outline-none border-none tab-4 overflow-auto selection:bg-emerald-500/25 selection:text-emerald-200"
            placeholder="Type or paste your code here..."
          />
        </div>
      </div>
    </div>
  );
};
