import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, Eye, Terminal } from 'lucide-react';

interface HtmlPreviewProps {
  htmlCode: string;
  onConsoleLog?: (type: 'log' | 'warn' | 'error', message: string) => void;
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({ htmlCode, onConsoleLog }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<{ id: string; type: 'log' | 'warn' | 'error'; msg: string; time: string }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Generate injection script to capture console output inside the iframe
  const buildIframeSource = (src: string) => {
    const consoleInterceptor = `
      <script>
        (function() {
          const sendLog = (type, args) => {
            try {
              const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
              window.parent.postMessage({ type: 'NEON_CONSOLE', level: type, text: msg }, '*');
            } catch(e) {}
          };
          const origLog = console.log;
          const origWarn = console.warn;
          const origError = console.error;
          console.log = function(...args) { origLog.apply(console, args); sendLog('log', args); };
          console.warn = function(...args) { origWarn.apply(console, args); sendLog('warn', args); };
          console.error = function(...args) { origError.apply(console, args); sendLog('error', args); };
          window.onerror = function(msg, url, line) {
            sendLog('error', ['Uncaught Error: ' + msg + ' (Line ' + line + ')']);
          };
        })();
      </script>
    `;

    if (src.includes('<head>')) {
      return src.replace('<head>', `<head>${consoleInterceptor}`);
    } else {
      return `${consoleInterceptor}${src}`;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEON_CONSOLE') {
        const { level, text } = event.data;
        const now = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev.slice(-49), { id: Math.random().toString(), type: level, msg: text, time: now }]);
        if (onConsoleLog) {
          onConsoleLog(level, text);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleLog]);

  const handleRefresh = () => {
    setLogs([]);
    setIframeKey((k) => k + 1);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#070a0f] border border-[#1a2333] select-none">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0c111a] border-b border-[#1a2333] text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
            HTML / CSS / JS Sandbox Preview
          </span>
          <span className="px-2 py-0.5 bg-[#101826] border border-[#223147] text-emerald-400 text-[10px]">
            ACTIVE DOM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors ${
              showLogs
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-[#101826] border-[#223147] text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>CONSOLE ({logs.length})</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 bg-[#101826] border border-[#223147] text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Reload Preview"
          >
            <RefreshCw className="w-3 h-3" />
            <span>RELOAD</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="flex items-center gap-1 px-2 py-1 bg-[#101826] border border-[#223147] text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="w-3 h-3" />
            <span>NEW TAB</span>
          </button>
        </div>
      </div>

      {/* Main Preview Surface */}
      <div className="flex-1 relative bg-white overflow-hidden flex flex-col">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={buildIframeSource(htmlCode)}
          title="Sandbox Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          className="w-full flex-1 border-none bg-white"
        />

        {/* DOM Console Log Overlay (collapsible) */}
        {showLogs && (
          <div className="h-44 bg-[#080b11] border-t border-[#1a2333] font-mono text-xs overflow-y-auto p-2.5">
            <div className="flex items-center justify-between text-neutral-400 pb-1 mb-1 border-b border-neutral-900 text-[10px]">
              <span>DOM CONSOLE OUTPUT</span>
              <button onClick={() => setLogs([])} className="hover:text-neutral-200">
                Clear
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="text-neutral-600 text-[11px] py-4 text-center">
                No console messages logged yet. Use console.log() in your script.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`py-0.5 text-[11px] flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-rose-400'
                      : log.type === 'warn'
                      ? 'text-amber-400'
                      : 'text-emerald-300'
                  }`}
                >
                  <span className="text-neutral-600 shrink-0 tabular-nums">[{log.time}]</span>
                  <span className="text-neutral-500 shrink-0 font-bold">[{log.type.toUpperCase()}]</span>
                  <span className="whitespace-pre-wrap break-all">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
