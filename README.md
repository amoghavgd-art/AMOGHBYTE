# NeonCode Studio

A high-performance, dark-mode online compiler and developer workspace with multi-language execution, interactive terminal I/O, intelligent code diagnostics, guided learning modules, and GitHub integration.

## Features

- **Multi-Language Compiler**: Native execution support for C (GCC), C++ (G++), Python 3, JavaScript (Node.js), TypeScript, Java (OpenJDK), SQLite, and HTML/CSS/JS with live DOM preview.
- **Interactive Terminal**: Full standard input (`stdin`) streaming, execution timing, status metrics, and memory diagnostics.
- **Code Diagnostics**: Root-cause error analysis, Big-O algorithmic complexity profiling, and one-click code fixes.
- **Learning Lab**: Structured, step-by-step interactive coding lessons across key programming fundamentals.
- **GitHub Integration**: Direct repository push and commit functionality via personal access tokens.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- Compilers for desired languages (e.g., `gcc`, `g++`, `python3`, `java`, `sqlite3` in system PATH)

### Installation

1. Clone repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` to `.env`.

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
