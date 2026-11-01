export type SupportedLanguage =
  | 'c'
  | 'python'
  | 'html'
  | 'javascript'
  | 'typescript'
  | 'cpp'
  | 'java'
  | 'sql';

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  extension: string;
  prismGrammar: string;
  defaultFileName: string;
  description: string;
  supportsStdin: boolean;
  sampleCode: string;
  interactiveInputSample: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  compilationError?: string;
  timedOut?: boolean;
  durationMs?: number;
  timestamp: string;
  error?: string;
}

export interface AIDoctorResult {
  rootCause: string;
  explanation: string;
  fixedCode: string;
  keyChanges: string[];
  proTip: string;
}

export interface AILearningStep {
  stepNumber: number;
  totalSteps: number;
  topicTitle: string;
  conceptSummary: string;
  explanation: string;
  challengeTask: string;
  starterCode: string;
  expectedOutput: string;
  hint: string;
  passed: boolean;
  feedback: string;
  nextTopicSuggestion?: string;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  total_private_repos?: number;
  bio?: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  html_url: string;
  description?: string;
  language?: string;
  updated_at: string;
}

export interface GitHubCommitResult {
  success: boolean;
  commitSha: string;
  commitHtmlUrl: string;
  fileHtmlUrl: string;
  filePath: string;
  branch: string;
  message: string;
}
