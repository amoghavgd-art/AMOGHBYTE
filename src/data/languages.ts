import { LanguageConfig } from '../types';

export const LANGUAGES: LanguageConfig[] = [
  {
    id: 'c',
    name: 'C (GCC 12)',
    extension: '.c',
    prismGrammar: 'c',
    defaultFileName: 'main.c',
    description: 'Natively compiled with GCC 12 & libc. High-performance system code.',
    supportsStdin: true,
    sampleCode: `// NeonCode Studio - C Compiler
#include <stdio.h>
#include <stdlib.h>

void calculatePrimes(int limit) {
    printf("Finding prime numbers up to %d:\\n", limit);
    int count = 0;
    for (int i = 2; i <= limit; i++) {
        int isPrime = 1;
        for (int j = 2; j * j <= i; j++) {
            if (i % j == 0) {
                isPrime = 0;
                break;
            }
        }
        if (isPrime) {
            printf("%d ", i);
            count++;
        }
    }
    printf("\\nTotal primes found: %d\\n", count);
}

int main() {
    printf("=== NEONCODE C RUNTIME ===\\n");
    calculatePrimes(50);
    return 0;
}`,
    interactiveInputSample: `// NeonCode Studio - C Interactive Input Demo
#include <stdio.h>

int main() {
    char name[64];
    int age;
    float favoriteNumber;

    printf("=== INTERACTIVE C INPUT DEMO ===\\n");
    printf("Please enter your name: ");
    if (scanf("%63s", name) != 1) return 1;

    printf("Enter your age: ");
    if (scanf("%d", &age) != 1) return 1;

    printf("Enter your favorite lucky number: ");
    if (scanf("%f", &favoriteNumber) != 1) return 1;

    printf("\\n>>> GREETING PROFILE <<<\\n");
    printf("Hello, %s! In 10 years you will be %d years old.\\n", name, age + 10);
    printf("Your lucky number squared is: %.2f\\n", favoriteNumber * favoriteNumber);

    return 0;
}`,
  },
  {
    id: 'python',
    name: 'Python 3',
    extension: '.py',
    prismGrammar: 'python',
    defaultFileName: 'script.py',
    description: 'Python 3.10 runtime with standard library and full stdin capabilities.',
    supportsStdin: true,
    sampleCode: `# NeonCode Studio - Python 3 Runtime
import math
import sys

def fibonacci_generator(n: int):
    a, b = 0, 1
    series = []
    for _ in range(n):
        series.append(a)
        a, b = b, a + b
    return series

def main():
    print(f"=== NEONCODE PYTHON 3 [{sys.version.split()[0]}] ===")
    fib = fibonacci_generator(12)
    print("Fibonacci Sequence (first 12):", fib)
    print("Golden Ratio Approximation:", fib[-1] / fib[-2] if len(fib) > 2 else 1)
    print(f"Euler's constant e: {math.e:.6f}, Pi: {math.pi:.6f}")

if __name__ == "__main__":
    main()`,
    interactiveInputSample: `# NeonCode Studio - Interactive Python Input
def main():
    print("=== INTERACTIVE TERMINAL INPUT ===")
    user_name = input("Enter your hacker handle: ")
    experience = input("Years of coding experience: ")
    target_lang = input("Which language do you want to master next? ")

    try:
        exp_int = int(experience)
        level = "Senior Architect" if exp_int >= 5 else "Rising Engineer"
    except ValueError:
        level = "Aspiring Coder"

    print("-" * 40)
    print(f"Welcome, {user_name}!")
    print(f"Rank Assessment: [{level}]")
    print(f"Next Goal: Mastering {target_lang} with NeonCode Studio.")
    print("-" * 40)

if __name__ == "__main__":
    main()`,
  },
  {
    id: 'html',
    name: 'HTML / CSS / JS',
    extension: '.html',
    prismGrammar: 'html',
    defaultFileName: 'index.html',
    description: 'Live interactive sandbox preview with CSS styling and JavaScript DOM execution.',
    supportsStdin: false,
    sampleCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NeonCode Interactive Web Canvas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .neon-card {
      background: #0d131f;
      border: 1px solid #1e293b;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.08);
    }
    h1 {
      color: #10b981;
      font-size: 24px;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
    .counter-display {
      font-size: 48px;
      font-weight: 700;
      font-family: monospace;
      color: #38bdf8;
      margin-bottom: 20px;
    }
    .btn-group { display: flex; gap: 8px; justify-content: center; }
    button {
      background: #090d16;
      color: #10b981;
      border: 1px solid #10b981;
      padding: 10px 20px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s ease;
    }
    button:hover {
      background: #10b981;
      color: #090d16;
    }
  </style>
</head>
<body>
  <div class="neon-card">
    <h1>NEON WEB SANDBOX</h1>
    <p>Live interactive web environment. Edit HTML, CSS, or JS and see instant results!</p>
    <div class="counter-display" id="countDisplay">0</div>
    <div class="btn-group">
      <button onclick="decrement()">- DECREMENT</button>
      <button onclick="reset()">RESET</button>
      <button onclick="increment()">+ INCREMENT</button>
    </div>
  </div>

  <script>
    let count = 0;
    const display = document.getElementById('countDisplay');
    function increment() { count++; update(); }
    function decrement() { count--; update(); }
    function reset() { count = 0; update(); }
    function update() {
      display.innerText = count;
      console.log('Current count value:', count);
    }
    console.log('NeonCode Web Sandbox Initialized!');
  </script>
</body>
</html>`,
    interactiveInputSample: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background: #080b11;
      color: #e2e8f0;
      font-family: monospace;
      padding: 30px;
      display: flex;
      justify-content: center;
    }
    .box {
      border: 1px solid #22c55e;
      background: #0d131f;
      padding: 24px;
      width: 100%;
      max-width: 500px;
    }
    input {
      width: 100%;
      padding: 10px;
      background: #090d16;
      border: 1px solid #334155;
      color: #22c55e;
      font-family: monospace;
      margin: 12px 0;
      box-sizing: border-box;
    }
    button {
      background: #22c55e;
      color: #000;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
    }
    .output-area {
      margin-top: 16px;
      padding: 12px;
      background: #05080e;
      border: 1px solid #1e293b;
      min-height: 60px;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="box">
    <h3 style="color:#22c55e">> INTERACTIVE TEXT TRANSLATOR</h3>
    <input type="text" id="userInput" placeholder="Type text here to convert to Morse & Hex...">
    <button onclick="processInput()">ANALYZE TEXT</button>
    <div class="output-area" id="output">Waiting for input...</div>
  </div>

  <script>
    function processInput() {
      const val = document.getElementById('userInput').value;
      if (!val) return;
      const hex = Array.from(val).map(c => c.charCodeAt(0).toString(16).toUpperCase()).join(' ');
      document.getElementById('output').innerHTML = 
        '<strong>Length:</strong> ' + val.length + ' chars<br>' +
        '<strong>Hex:</strong> ' + hex + '<br>' +
        '<strong>Uppercase:</strong> ' + val.toUpperCase();
      console.log('Processed text input:', val, 'Hex:', hex);
    }
  </script>
</body>
</html>`,
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    extension: '.js',
    prismGrammar: 'javascript',
    defaultFileName: 'index.js',
    description: 'Node.js 22 runtime with async/await, ES6+, and standard input handling.',
    supportsStdin: true,
    sampleCode: `// NeonCode Studio - Node.js Runtime
const crypto = require('crypto');

function generateSecureToken(bytes = 16) {
    return crypto.randomBytes(bytes).toString('hex');
}

const userRecords = [
    { id: 1, name: 'Alice Smith', role: 'Security Architect', active: true },
    { id: 2, name: 'Bob Jones', role: 'Kernel Dev', active: false },
    { id: 3, name: 'Charlie Kim', role: 'DevOps Lead', active: true },
];

console.log('=== NODE.JS RUNTIME DEMO ===');
console.log('Generating session tokens:');
for (const user of userRecords) {
    const token = generateSecureToken(8);
    console.log(\`User: \${user.name.padEnd(15)} | Role: \${user.role.padEnd(20)} | Session: \${token}\`);
}
`,
    interactiveInputSample: `// NeonCode Studio - Node.js Stdin Reader
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=== NODE.JS INTERACTIVE STDIN ===');
rl.question('What is your favorite data structure? ', (ds) => {
    rl.question('Why do you prefer it? ', (reason) => {
        console.log('\\n>>> DEVELOPER SUMMARY <<<');
        console.log(\`Favorite Data Structure: \${ds}\`);
        console.log(\`Rationale: \${reason}\`);
        rl.close();
    });
});
`,
  },
  {
    id: 'cpp',
    name: 'C++ (G++ 12)',
    extension: '.cpp',
    prismGrammar: 'cpp',
    defaultFileName: 'main.cpp',
    description: 'C++17 compiled with modern G++ 12 with full STL support.',
    supportsStdin: true,
    sampleCode: `// NeonCode Studio - C++17 Compiler
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

struct Metric {
    std::string name;
    double value;
};

int main() {
    std::cout << "=== NEONCODE C++17 STL DEMO ===" << std::endl;
    std::vector<Metric> metrics = {
        {"Throughput", 4520.5},
        {"Latency_P99", 14.2},
        {"Cache_Hit_Ratio", 98.7},
        {"Active_Threads", 64.0}
    };

    std::sort(metrics.begin(), metrics.end(), [](const Metric& a, const Metric& b) {
        return a.value > b.value;
    });

    std::cout << "Sorted System Metrics:" << std::endl;
    for (const auto& m : metrics) {
        std::cout << " - " << m.name << ": " << m.value << std::endl;
    }
    return 0;
}`,
    interactiveInputSample: `// NeonCode Studio - C++ Stdin Demo
#include <iostream>
#include <string>

int main() {
    std::string username;
    int a, b;

    std::cout << "=== C++ INTERACTIVE INPUT ===" << std::endl;
    std::cout << "Enter username: ";
    if (!(std::cin >> username)) return 1;

    std::cout << "Enter two numbers separated by space: ";
    if (!(std::cin >> a >> b)) return 1;

    std::cout << std::endl << "Hello " << username << "!" << std::endl;
    std::cout << a << " + " << b << " = " << (a + b) << std::endl;
    std::cout << a << " * " << b << " = " << (a * b) << std::endl;

    return 0;
}`,
  },
  {
    id: 'java',
    name: 'Java (OpenJDK 17)',
    extension: '.java',
    prismGrammar: 'java',
    defaultFileName: 'Main.java',
    description: 'OpenJDK 17 runtime with object-oriented mechanics and Scanner stdin.',
    supportsStdin: true,
    sampleCode: `// NeonCode Studio - Java OpenJDK 17
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class Task {
        String title;
        int priority;

        Task(String title, int priority) {
            this.title = title;
            this.priority = priority;
        }

        @Override
        public String toString() {
            return String.format("[Priority %d] %s", priority, title);
        }
    }

    public static void main(String[] args) {
        System.out.println("=== NEONCODE JAVA 17 RUNTIME ===");
        List<Task> queue = new ArrayList<>();
        queue.add(new Task("Initialize Memory Buffer", 1));
        queue.add(new Task("Establish TLS Socket", 2));
        queue.add(new Task("Start AI Inference Worker", 3));

        for (Task t : queue) {
            System.out.println("Executing: " + t);
        }
        System.out.println("All tasks finished successfully.");
    }
}`,
    interactiveInputSample: `// NeonCode Studio - Java Scanner Stdin
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("=== JAVA INTERACTIVE SCANNER ===");
        System.out.print("Enter your developer name: ");
        String name = scanner.nextLine();

        System.out.print("Enter your target monthly commits: ");
        int commits = scanner.nextInt();

        System.out.println("\\n>>> TARGET COMMIT GOAL <<<");
        System.out.println("Developer: " + name);
        System.out.println("Weekly pace needed: " + (commits / 4) + " commits/week");
        scanner.close();
    }
}`,
  },
  {
    id: 'sql',
    name: 'SQL (SQLite 3)',
    extension: '.sql',
    prismGrammar: 'sql',
    defaultFileName: 'query.sql',
    description: 'SQLite 3 database query engine with table creation, inserts, and joins.',
    supportsStdin: false,
    sampleCode: `-- NeonCode Studio - SQLite 3 Engine
CREATE TABLE developers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT NOT NULL,
    primary_lang TEXT NOT NULL,
    reputation INTEGER DEFAULT 100
);

CREATE TABLE commits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dev_id INTEGER,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(dev_id) REFERENCES developers(id)
);

INSERT INTO developers (handle, primary_lang, reputation) VALUES 
('neon_hacker', 'C', 450),
('py_ninja', 'Python', 620),
('ts_architect', 'TypeScript', 890);

INSERT INTO commits (dev_id, message) VALUES 
(1, 'refactor: memory pointer optimization'),
(2, 'feat: add streaming compression pipeline'),
(3, 'fix: resolve race condition in state store');

-- Query join developers and commits
SELECT 
    d.handle AS Developer,
    d.primary_lang AS Language,
    d.reputation AS Rep,
    c.message AS Recent_Commit
FROM developers d
JOIN commits c ON d.id = c.dev_id;
`,
    interactiveInputSample: `-- NeonCode Studio - SQLite Dynamic Data Filter
CREATE TABLE servers (
    hostname TEXT,
    ip TEXT,
    status TEXT,
    load_pct REAL
);

INSERT INTO servers VALUES 
('node-alpha', '10.0.0.1', 'HEALTHY', 34.2),
('node-beta', '10.0.0.2', 'WARNING', 88.5),
('node-gamma', '10.0.0.3', 'HEALTHY', 12.1),
('node-delta', '10.0.0.4', 'CRITICAL', 97.4);

-- Summary of server health
SELECT status, count(*) AS count, avg(load_pct) AS avg_load
FROM servers
GROUP BY status
ORDER BY avg_load DESC;
`,
  },
];
