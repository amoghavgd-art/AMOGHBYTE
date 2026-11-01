import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  Github,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  KeyRound,
  LogOut,
  FolderGit2,
} from 'lucide-react';
import { GitHubUser, GitHubRepo, GitHubCommitResult } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  defaultFileName: string;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  defaultFileName,
}) => {
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [branches, setBranches] = useState<string[]>(['main']);
  const [targetFilePath, setTargetFilePath] = useState<string>(defaultFileName);
  const [commitMessage, setCommitMessage] = useState<string>('feat: commit from NeonCode Studio');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<GitHubCommitResult | null>(null);

  // New repo creation mode
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);

  // Load saved token from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('neoncode_gh_token');
    if (saved) {
      setToken(saved);
      validateToken(saved);
    }
  }, []);

  useEffect(() => {
    setTargetFilePath(defaultFileName);
  }, [defaultFileName]);

  const validateToken = async (pat: string) => {
    if (!pat.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/github/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pat.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'GitHub token validation failed.');
      }

      const userData: GitHubUser = await res.json();
      setUser(userData);
      localStorage.setItem('neoncode_gh_token', pat.trim());

      // Fetch user repos
      await fetchRepos(pat.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with GitHub.');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepos = async (pat: string) => {
    try {
      const res = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pat }),
      });

      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
        if (data.repos?.length > 0 && !selectedRepo) {
          setSelectedRepo(data.repos[0].name);
          setSelectedBranch(data.repos[0].default_branch || 'main');
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('neoncode_gh_token');
    setToken('');
    setUser(null);
    setRepos([]);
    setSelectedRepo('');
    setCommitResult(null);
  };

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim() || !token) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          name: newRepoName.trim(),
          isPrivate: newRepoPrivate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create repository.');
      }

      const created = await res.json();
      setStatusMessage(`Repository '${created.full_name}' created successfully!`);
      setIsCreatingRepo(false);
      setNewRepoName('');
      await fetchRepos(token);
      setSelectedRepo(created.name);
      setSelectedBranch(created.default_branch || 'main');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not create repository.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!user || !selectedRepo || !targetFilePath.trim() || !token) {
      setErrorMessage('Please select a repository and enter a file path.');
      return;
    }

    setIsCommitting(true);
    setErrorMessage(null);
    setCommitResult(null);

    try {
      const res = await fetch('/api/github/commit-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          owner: user.login,
          repo: selectedRepo,
          branch: selectedBranch || 'main',
          filePath: targetFilePath.trim(),
          content: currentCode,
          commitMessage: commitMessage.trim() || `Update ${targetFilePath} via NeonCode Studio`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to push commit to GitHub.');
      }

      const result: GitHubCommitResult = await res.json();
      setCommitResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Git push operation failed.');
    } finally {
      setIsCommitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none font-sans">
      <div className="bg-[#080d16] border border-[#1e2a3f] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0d1422] border-b border-[#1e2a3f]">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
                GitHub Repository Integration
              </h2>
              <div className="text-[11px] text-neutral-400">
                Commit and push code directly to your GitHub repository
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
          {/* STEP 1: AUTHENTICATION */}
          {!user ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#0c121e] border border-[#1e2a3f] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate with GitHub Personal Access Token (PAT)</span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  To securely commit code from NeonCode Studio directly to your GitHub profile, provide a GitHub Personal Access Token with the <strong className="text-emerald-400 font-mono">repo</strong> scope.
                </p>

                <div className="flex items-center gap-2 text-[11px]">
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=NeonCode+Studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-semibold"
                  >
                    <span>Generate GitHub PAT on github.com (1-click)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="pt-2">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full bg-[#070a10] border border-[#1e2a3f] p-2.5 text-emerald-300 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => validateToken(token)}
                  disabled={isLoading || !token.trim()}
                  className="w-full py-2.5 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>VERIFYING WITH GITHUB API...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>CONNECT GITHUB ACCOUNT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: AUTHENTICATED PROFILE & COMMIT WORKFLOW */
            <div className="space-y-4">
              {/* Connected User Badge */}
              <div className="flex items-center justify-between p-3 bg-[#0c121e] border border-[#1e2a3f]">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-9 h-9 border border-[#1e2a3f]"
                  />
                  <div>
                    <div className="font-bold text-neutral-100 flex items-center gap-2">
                      <span>{user.name}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">@{user.login}</span>
                    </div>
                    <div className="text-neutral-500 text-[10px]">
                      {user.public_repos} public repositories &bull; Authenticated session active
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#101826] border border-[#223147] text-neutral-400 hover:text-rose-400 transition-colors text-[11px]"
                  title="Disconnect token"
                >
                  <LogOut className="w-3 h-3" />
                  <span>DISCONNECT</span>
                </button>
              </div>

              {/* Commit Result Success Banner */}
              {commitResult && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>CODE COMMITTED &amp; PUSHED SUCCESSFULLY!</span>
                  </div>
                  <div className="text-[11px] text-neutral-300 font-mono">
                    Target: {user.login}/{selectedRepo} ({commitResult.branch}) &rarr; {commitResult.filePath}
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <a
                      href={commitResult.fileHtmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors text-xs"
                    >
                      <span>VIEW FILE ON GITHUB</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {commitResult.commitHtmlUrl && (
                      <a
                        href={commitResult.commitHtmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 underline text-xs"
                      >
                        View Commit Diff &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Repo Selector or New Repo Form */}
              {!isCreatingRepo ? (
                <div className="space-y-3 p-4 bg-[#0c121e] border border-[#1e2a3f]">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                      Select Repository:
                    </label>
                    <button
                      onClick={() => setIsCreatingRepo(true)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create New Repo</span>
                    </button>
                  </div>

                  {repos.length === 0 ? (
                    <div className="text-neutral-500 py-2">
                      No repositories found. Create one to begin pushing code.
                    </div>
                  ) : (
                    <select
                      value={selectedRepo}
                      onChange={(e) => {
                        setSelectedRepo(e.target.value);
                        const r = repos.find((repo) => repo.name === e.target.value);
                        if (r) setSelectedBranch(r.default_branch || 'main');
                      }}
                      className="w-full bg-[#070a10] border border-[#1e2a3f] p-2.5 text-emerald-300 text-xs font-mono outline-none focus:border-emerald-500"
                    >
                      {repos.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name} {r.private ? '(Private)' : ''} &bull; {r.language || 'Code'}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Branch & File Path */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Branch:
                      </label>
                      <input
                        type="text"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-[#070a10] border border-[#1e2a3f] p-2 text-neutral-200 text-xs font-mono outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
                        File Path in Repo:
                      </label>
                      <input
                        type="text"
                        value={targetFilePath}
                        onChange={(e) => setTargetFilePath(e.target.value)}
                        placeholder="e.g. main.c or src/app.py"
                        className="w-full bg-[#070a10] border border-[#1e2a3f] p-2 text-neutral-200 text-xs font-mono outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Commit Message */}
                  <div>
                    <label className="block text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
                      Commit Message:
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="feat: implement prime numbers algorithm in C"
                      className="w-full bg-[#070a10] border border-[#1e2a3f] p-2 text-neutral-200 text-xs font-mono outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Commit & Push Action Button */}
                  <button
                    onClick={handleCommitAndPush}
                    disabled={isCommitting || !selectedRepo || !targetFilePath.trim()}
                    className="w-full py-3 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                  >
                    {isCommitting ? (
                      <span>PUSHING COMMIT TO GITHUB...</span>
                    ) : (
                      <>
                        <GitCommit className="w-4 h-4" />
                        <span>COMMIT &amp; PUSH TO REPOSITORY</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Create New Repository Form */
                <form onSubmit={handleCreateRepo} className="p-4 bg-[#0c121e] border border-[#1e2a3f] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">
                      Create New GitHub Repository
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingRepo(false)}
                      className="text-neutral-400 hover:text-neutral-200 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
                      Repository Name:
                    </label>
                    <input
                      type="text"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      placeholder="e.g. algorithms-lab-2026"
                      required
                      className="w-full bg-[#070a10] border border-[#1e2a3f] p-2 text-emerald-300 text-xs font-mono outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="privateRepo"
                      checked={newRepoPrivate}
                      onChange={(e) => setNewRepoPrivate(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <label htmlFor="privateRepo" className="text-neutral-300 text-xs cursor-pointer">
                      Make repository Private
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !newRepoName.trim()}
                    className="w-full py-2.5 bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    <FolderGit2 className="w-4 h-4" />
                    <span>CREATE REPOSITORY ON GITHUB</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs">
              {statusMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
