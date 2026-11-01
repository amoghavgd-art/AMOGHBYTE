import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Helper: Run subprocess with timeout and stdin
interface RunSubprocessResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
}

function runSubprocess(
  cmd: string,
  args: string[],
  cwd: string,
  stdinData: string = '',
  timeoutMs: number = 7000
): Promise<RunSubprocessResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cmd, args, {
      cwd,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        NODE_ENV: 'development',
      },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (err) {
        // process may have already exited
      }
    }, timeoutMs);

    if (child.stdin) {
      if (stdinData) {
        child.stdin.write(stdinData);
        if (!stdinData.endsWith('\n')) {
          child.stdin.write('\n');
        }
      }
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 200000) {
        stdout = stdout.slice(0, 200000) + '\n[Output truncated at 200KB]';
        try { child.kill('SIGKILL'); } catch (e) {}
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 100000) {
        stderr = stderr.slice(0, 100000) + '\n[Stderr truncated]';
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({
        stdout,
        stderr,
        exitCode: code,
        timedOut,
        durationMs,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      resolve({
        stdout,
        stderr: stderr + `\nProcess error: ${err.message}`,
        exitCode: 1,
        timedOut: false,
        durationMs,
      });
    });
  });
}

// -------------------------------------------------------------
// POST /api/run - Execute code in supported compilers
// -------------------------------------------------------------
app.post('/api/run', async (req: Request, res: Response) => {
  const { language, code, stdin = '' } = req.body;

  if (!language || typeof code !== 'string') {
    return res.status(400).json({ error: 'Language and code are required.' });
  }

  const runId = `neon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tempDir = path.join(os.tmpdir(), runId);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    let result: {
      stdout: string;
      stderr: string;
      exitCode: number | null;
      compilationError?: string;
      timedOut: boolean;
      durationMs: number;
    } = {
      stdout: '',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      durationMs: 0,
    };

    const normalizedLang = language.toLowerCase();

    if (normalizedLang === 'c') {
      const sourceFile = path.join(tempDir, 'main.c');
      const binFile = path.join(tempDir, 'main');
      fs.writeFileSync(sourceFile, code, 'utf-8');

      // Compile with gcc
      const compileRes = await runSubprocess('gcc', ['-O2', '-Wall', '-Wextra', sourceFile, '-o', binFile, '-lm'], tempDir, '', 10000);

      if (compileRes.exitCode !== 0) {
        result = {
          stdout: '',
          stderr: compileRes.stderr || 'Compilation failed with error code ' + compileRes.exitCode,
          exitCode: compileRes.exitCode,
          compilationError: compileRes.stderr,
          timedOut: compileRes.timedOut,
          durationMs: compileRes.durationMs,
        };
      } else {
        // Execute compiled binary
        const execRes = await runSubprocess(binFile, [], tempDir, stdin, 8000);
        result = {
          stdout: execRes.stdout,
          stderr: execRes.stderr,
          exitCode: execRes.exitCode,
          timedOut: execRes.timedOut,
          durationMs: compileRes.durationMs + execRes.durationMs,
        };
      }
    } else if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
      const sourceFile = path.join(tempDir, 'main.cpp');
      const binFile = path.join(tempDir, 'main');
      fs.writeFileSync(sourceFile, code, 'utf-8');

      const compileRes = await runSubprocess('g++', ['-O2', '-std=c++17', '-Wall', sourceFile, '-o', binFile, '-lm'], tempDir, '', 10000);

      if (compileRes.exitCode !== 0) {
        result = {
          stdout: '',
          stderr: compileRes.stderr || 'C++ Compilation failed',
          exitCode: compileRes.exitCode,
          compilationError: compileRes.stderr,
          timedOut: compileRes.timedOut,
          durationMs: compileRes.durationMs,
        };
      } else {
        const execRes = await runSubprocess(binFile, [], tempDir, stdin, 8000);
        result = {
          stdout: execRes.stdout,
          stderr: execRes.stderr,
          exitCode: execRes.exitCode,
          timedOut: execRes.timedOut,
          durationMs: compileRes.durationMs + execRes.durationMs,
        };
      }
    } else if (normalizedLang === 'python' || normalizedLang === 'py') {
      const sourceFile = path.join(tempDir, 'script.py');
      fs.writeFileSync(sourceFile, code, 'utf-8');

      const execRes = await runSubprocess('python3', [sourceFile], tempDir, stdin, 8000);
      result = {
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        exitCode: execRes.exitCode,
        timedOut: execRes.timedOut,
        durationMs: execRes.durationMs,
      };
    } else if (normalizedLang === 'javascript' || normalizedLang === 'js' || normalizedLang === 'node') {
      const sourceFile = path.join(tempDir, 'index.js');
      fs.writeFileSync(sourceFile, code, 'utf-8');

      const execRes = await runSubprocess('node', [sourceFile], tempDir, stdin, 8000);
      result = {
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        exitCode: execRes.exitCode,
        timedOut: execRes.timedOut,
        durationMs: execRes.durationMs,
      };
    } else if (normalizedLang === 'typescript' || normalizedLang === 'ts') {
      const sourceFile = path.join(tempDir, 'index.ts');
      fs.writeFileSync(sourceFile, code, 'utf-8');

      const execRes = await runSubprocess('npx', ['tsx', sourceFile], tempDir, stdin, 10000);
      result = {
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        exitCode: execRes.exitCode,
        timedOut: execRes.timedOut,
        durationMs: execRes.durationMs,
      };
    } else if (normalizedLang === 'java') {
      // Find main class name or default to Main
      const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const sourceFile = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(sourceFile, code, 'utf-8');

      // Java 11+ supports executing source file directly
      const execRes = await runSubprocess('java', [sourceFile], tempDir, stdin, 10000);
      result = {
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        exitCode: execRes.exitCode,
        timedOut: execRes.timedOut,
        durationMs: execRes.durationMs,
      };
    } else if (normalizedLang === 'sql') {
      const sourceFile = path.join(tempDir, 'query.sql');
      fs.writeFileSync(sourceFile, code, 'utf-8');

      const execRes = await runSubprocess('sqlite3', ['-header', '-column', path.join(tempDir, 'db.sqlite')], tempDir, code, 8000);
      result = {
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        exitCode: execRes.exitCode,
        timedOut: execRes.timedOut,
        durationMs: execRes.durationMs,
      };
    } else if (normalizedLang === 'html') {
      // HTML is primarily rendered in client preview iframe, but we return OK
      result = {
        stdout: 'HTML/CSS/JS ready for live preview.',
        stderr: '',
        exitCode: 0,
        timedOut: false,
        durationMs: 5,
      };
    } else {
      return res.status(400).json({ error: `Language '${language}' is not supported yet.` });
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Execution failed: ' + (error?.message || String(error)),
    });
  } finally {
    // Clean up temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      // ignore cleanup errors
    }
  }
});

// -------------------------------------------------------------
// GET /api/ai/status - Check AI Service Status
// -------------------------------------------------------------
app.get('/api/ai/status', async (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  if (!hasKey) {
    return res.status(503).json({
      online: false,
      error: 'GEMINI_API_KEY is not configured on server.',
    });
  }

  try {
    const ping = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Ping',
    });
    return res.json({
      online: true,
      model: 'gemini-3.1-flash-lite',
      tier: 'Active',
      pingResponse: ping.text ? 'OK' : 'EMPTY',
    });
  } catch (err: any) {
    return res.status(500).json({
      online: false,
      error: err.message || 'Gemini ping failed',
    });
  }
});

// -------------------------------------------------------------
// POST /api/ai/fix-error - AI Error Doctor
// -------------------------------------------------------------
app.post('/api/ai/fix-error', async (req: Request, res: Response) => {
  try {
    const { code, language, errorOutput, context } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required.' });
    }

    const systemInstruction = `You are NeonCode AI Doctor, an expert compiler diagnostics engineer.
Analyze the user's code, language, compiler error messages, or runtime exceptions.
Explain the bug simply and provide the complete corrected code with zero regressions.
Return purely valid JSON matching the requested schema.`;

    const prompt = `LANGUAGE: ${language}
USER CODE:
\`\`\`${language}
${code}
\`\`\`

COMPILER / RUNTIME ERROR OUTPUT:
${errorOutput || 'No explicit stderr provided. Please analyze for logic errors, crashes, or unhandled exceptions.'}

ADDITIONAL CONTEXT / INTENT:
${context || 'Fix all compilation, syntax, runtime, and algorithmic errors.'}

Provide:
1. rootCause: Concise summary of what went wrong (1-2 sentences).
2. explanation: Friendly, step-by-step breakdown of the bug.
3. fixedCode: The complete, ready-to-run corrected code.
4. keyChanges: Array of specific bullet points describing each change made.
5. proTip: An actionable best-practice tip to prevent this class of bug in ${language}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING },
            explanation: { type: Type.STRING },
            fixedCode: { type: Type.STRING },
            keyChanges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            proTip: { type: Type.STRING },
          },
          required: ['rootCause', 'explanation', 'fixedCode', 'keyChanges', 'proTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('AI Fix error failed:', error);
    return res.status(500).json({
      error: 'AI diagnostics failed: ' + (error?.message || 'Unknown error'),
    });
  }
});

// -------------------------------------------------------------
// POST /api/ai/learn - Step-by-Step Learning Lab Tutor
// -------------------------------------------------------------
app.post('/api/ai/learn', async (req: Request, res: Response) => {
  try {
    const { language, topic, currentStep = 1, userSubmission = '', action = 'start' } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'Language is required.' });
    }

    const systemInstruction = `You are NeonCode Master Tutor, an encouraging computer science educator.
You guide developers step-by-step through interactive hands-on coding lessons.
Each step must contain:
1. Clear, concise theoretical concept with a small snippet.
2. A hands-on coding challenge for the student to write in the compiler.
3. Starter code with comments/TODOs to load into the editor.
4. Expected output instructions.
5. If the student submitted a solution (action === 'evaluate'), evaluate their code and output, give constructive feedback, and if correct, advance to the next step!`;

    const prompt = `Action: ${action}
Language: ${language}
Topic: ${topic || 'Core Fundamentals & Syntax'}
Current Step Number: ${currentStep}
Student Submission Code:
${userSubmission ? userSubmission : '(None yet)'}

Generate step ${currentStep} of a structured 5-step masterclass on ${topic || 'Basics'} in ${language}.
If action is 'evaluate', inspect the student's submission. If it solves the exercise, set 'passed': true and provide step ${Number(currentStep) + 1}. If incorrect or incomplete, set 'passed': false, explain why kindly, and give hints.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stepNumber: { type: Type.INTEGER },
            totalSteps: { type: Type.INTEGER },
            topicTitle: { type: Type.STRING },
            conceptSummary: { type: Type.STRING },
            explanation: { type: Type.STRING },
            challengeTask: { type: Type.STRING },
            starterCode: { type: Type.STRING },
            expectedOutput: { type: Type.STRING },
            hint: { type: Type.STRING },
            passed: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            nextTopicSuggestion: { type: Type.STRING },
          },
          required: [
            'stepNumber',
            'totalSteps',
            'topicTitle',
            'conceptSummary',
            'explanation',
            'challengeTask',
            'starterCode',
            'expectedOutput',
            'hint',
            'passed',
            'feedback',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('AI Learn failed:', error);
    return res.status(500).json({
      error: 'Learning tutor failed: ' + (error?.message || 'Unknown error'),
    });
  }
});

// -------------------------------------------------------------
// POST /api/ai/explain - Code Explanation & Complexity (Big-O)
// -------------------------------------------------------------
app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Explain this ${language} code clearly for a developer. Provide time & space complexity (Big-O), memory allocation notes, and optimization possibilities:
\`\`\`${language}
${code}
\`\`\``,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            timeComplexity: { type: Type.STRING },
            spaceComplexity: { type: Type.STRING },
            lineByLineBreakdown: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            optimizations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'timeComplexity', 'spaceComplexity', 'lineByLineBreakdown', 'optimizations'],
        },
      },
    });

    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Explanation failed' });
  }
});

// -------------------------------------------------------------
// GitHub Repository Integration API Endpoints
// -------------------------------------------------------------

// Validate GitHub Token & Get User Profile
app.post('/api/github/user', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'GitHub Token is required.' });
  }

  try {
    const ghRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NeonCode-Studio',
      },
    });

    if (!ghRes.ok) {
      const errBody = await ghRes.json().catch(() => ({}));
      return res.status(ghRes.status).json({
        error: errBody.message || 'Failed to authenticate with GitHub. Please check your token permissions (repo scope required).',
      });
    }

    const userData = await ghRes.json();
    return res.json({
      login: userData.login,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
      public_repos: userData.public_repos,
      total_private_repos: userData.total_private_repos || 0,
      bio: userData.bio,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'GitHub connection error: ' + err.message });
  }
});

// List User Repositories
app.post('/api/github/repos', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'GitHub Token is required.' });
  }

  try {
    const ghRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=60&affiliation=owner,collaborator', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NeonCode-Studio',
      },
    });

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      return res.status(ghRes.status).json({ error: err.message || 'Could not fetch repositories.' });
    }

    const repos = await ghRes.json();
    const formatted = repos.map((r: any) => ({
      name: r.name,
      full_name: r.full_name,
      default_branch: r.default_branch || 'main',
      private: r.private,
      html_url: r.html_url,
      description: r.description,
      language: r.language,
      updated_at: r.updated_at,
    }));

    return res.json({ repos: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to list repositories: ' + err.message });
  }
});

// List Branches for a repository
app.post('/api/github/branches', async (req: Request, res: Response) => {
  const { token, owner, repo } = req.body;
  if (!token || !owner || !repo) {
    return res.status(400).json({ error: 'Token, owner, and repo are required.' });
  }

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NeonCode-Studio',
      },
    });

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      return res.status(ghRes.status).json({ error: err.message || 'Could not fetch branches.' });
    }

    const branches = await ghRes.json();
    return res.json({ branches: branches.map((b: any) => b.name) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create a New GitHub Repository
app.post('/api/github/create-repo', async (req: Request, res: Response) => {
  const { token, name, description = '', isPrivate = false } = req.body;
  if (!token || !name) {
    return res.status(400).json({ error: 'Token and repo name are required.' });
  }

  try {
    const ghRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NeonCode-Studio',
      },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true, // creates README and initial branch
      }),
    });

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      return res.status(ghRes.status).json({ error: err.message || 'Failed to create repository.' });
    }

    const newRepo = await ghRes.json();
    return res.json({
      name: newRepo.name,
      full_name: newRepo.full_name,
      html_url: newRepo.html_url,
      default_branch: newRepo.default_branch || 'main',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Create repo error: ' + err.message });
  }
});

// Commit and push file to GitHub repository
app.post('/api/github/commit-push', async (req: Request, res: Response) => {
  const { token, owner, repo, branch, filePath, content, commitMessage } = req.body;

  if (!token || !owner || !repo || !filePath || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing required commit parameters.' });
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const targetBranch = branch || 'main';
  const message = commitMessage || `Update ${cleanPath} via NeonCode Studio`;

  try {
    // 1. Check if file already exists to get its SHA (required by GitHub Contents API for updates)
    let existingSha: string | undefined;
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${encodeURIComponent(targetBranch)}`,
      {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'NeonCode-Studio',
        },
      }
    );

    if (checkRes.ok) {
      const existingData = await checkRes.json();
      existingSha = existingData.sha;
    }

    // 2. Put file contents with base64 encoding
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');

    const putBody: any = {
      message,
      content: base64Content,
      branch: targetBranch,
    };

    if (existingSha) {
      putBody.sha = existingSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NeonCode-Studio',
      },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return res.status(putRes.status).json({
        error: err.message || `Failed to commit to ${owner}/${repo}. Check branch and permissions.`,
      });
    }

    const commitData = await putRes.json();
    return res.json({
      success: true,
      commitSha: commitData.commit?.sha,
      commitHtmlUrl: commitData.commit?.html_url,
      fileHtmlUrl: commitData.content?.html_url,
      filePath: cleanPath,
      branch: targetBranch,
      message,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Git commit failed: ' + err.message });
  }
});

// Mount Vite in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeonCode Studio backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
