import { createContext, useContext, useState, ReactNode } from 'react';

/* ── Types ──────────────────────────────────── */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
}

export interface Quiz {
  id: string;
  teacherId: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: QuizQuestion[];
  timePerQuestion: number;
  createdAt: string;
  totalAttempts: number;
  avgScore: number;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface QuizResult {
  quizId: string;
  teacherId: string;
  quizTitle: string;
  subject: string;
  score: number;
  correctCount: number;
  totalCount: number;
  badge: BadgeTier | null;
  timeTaken: number;
  completedAt: string;
  answers: number[];
}

/* ── Badge thresholds ───────────────────────── */
export function getBadgeForScore(score: number): BadgeTier | null {
  if (score >= 95) return 'platinum';
  if (score >= 85) return 'gold';
  if (score >= 70) return 'silver';
  if (score >= 50) return 'bronze';
  return null;
}

export const BADGE_META: Record<BadgeTier, { label: string; emoji: string; color: string; bg: string; desc: string }> = {
  bronze:   { label: 'Bronze',   emoji: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.12)',   desc: 'Solid foundation — keep practising!' },
  silver:   { label: 'Silver',   emoji: '🥈', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)',  desc: 'Good understanding of the topic.' },
  gold:     { label: 'Gold',     emoji: '🥇', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   desc: 'Excellent! Near mastery level.' },
  platinum: { label: 'Platinum', emoji: '💎', color: '#7ab8ba', bg: 'rgba(122,184,186,0.12)',  desc: 'Outstanding! Top 5% performance.' },
};

/* ── Question bank ──────────────────────────── */
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  react: [
    { id: 'r1', question: 'What does the useState hook return in React?', options: ['A state variable and updater function', 'Only the current state value', 'A memoized value', 'An event handler'], correctIndex: 0, explanation: 'useState returns a tuple [currentState, setterFunction]. The setter schedules a re-render with the new value.', difficulty: 'Easy', points: 10 },
    { id: 'r2', question: 'Which hook runs a side effect after every render by default?', options: ['useState', 'useEffect', 'useMemo', 'useRef'], correctIndex: 1, explanation: 'useEffect runs after every render by default. You control when it re-runs via the dependency array.', difficulty: 'Easy', points: 10 },
    { id: 'r3', question: 'What does `useEffect(() => {}, [])` do?', options: ['Runs on every render', 'Runs only once after the initial mount', 'Runs on unmount only', 'Never runs'], correctIndex: 1, explanation: 'An empty dependency array [] makes useEffect run exactly once after the initial mount — like componentDidMount.', difficulty: 'Easy', points: 10 },
    { id: 'r4', question: 'What is the purpose of React.memo()?', options: ['Caches API calls', 'Memoizes a component skipping re-renders if props are unchanged', 'Creates a context', 'Logs render info'], correctIndex: 1, explanation: 'React.memo wraps a component and does a shallow prop comparison. If props haven\'t changed, React skips re-rendering the component.', difficulty: 'Medium', points: 15 },
    { id: 'r5', question: 'In TypeScript, what does `interface User { name?: string }` mean?', options: ['name is required', 'name is optional', 'name can only be null', 'name defaults to empty string'], correctIndex: 1, explanation: 'The `?` after a property name makes it optional in TypeScript interfaces. The property may be present or absent.', difficulty: 'Easy', points: 10 },
    { id: 'r6', question: 'What HTTP method is used to create a new resource in REST?', options: ['GET', 'PUT', 'POST', 'PATCH'], correctIndex: 2, explanation: 'POST creates new resources. GET reads, PUT replaces, PATCH partially updates, DELETE removes.', difficulty: 'Easy', points: 10 },
    { id: 'r7', question: 'What does the `useCallback` hook return?', options: ['A memoized value', 'A memoized callback that only changes if dependencies change', 'An effect cleanup function', 'A ref object'], correctIndex: 1, explanation: 'useCallback memoizes a function reference. It\'s useful when passing callbacks to child components wrapped in React.memo.', difficulty: 'Hard', points: 20 },
    { id: 'r8', question: 'What is code splitting in React?', options: ['Splitting CSS from JS', 'Splitting JS bundle into chunks loaded on demand', 'Separating state from UI', 'A testing technique'], correctIndex: 1, explanation: 'Code splitting with React.lazy + Suspense loads component bundles only when needed, reducing initial bundle size.', difficulty: 'Hard', points: 20 },
    { id: 'r9', question: 'What is the Virtual DOM?', options: ['Server-side rendered copy', 'A lightweight in-memory representation of the real DOM', 'A CSS-in-JS solution', 'A state management tool'], correctIndex: 1, explanation: 'React maintains a Virtual DOM — a JS tree mirroring the real DOM. React diffs old vs new VDOM to compute minimal real DOM updates.', difficulty: 'Medium', points: 15 },
    { id: 'r10', question: 'What does `async/await` do in JavaScript?', options: ['Makes code run faster', 'Provides cleaner syntax for Promise-based async code', 'Creates new threads', 'Prevents runtime errors'], correctIndex: 1, explanation: 'async/await is syntactic sugar over Promises, making async code readable in a sequential-looking style.', difficulty: 'Medium', points: 15 },
  ],
  python: [
    { id: 'p1', question: 'What does `[x**2 for x in range(4)]` produce?', options: ['[1, 4, 9, 16]', '[0, 1, 4, 9]', '[0, 2, 4, 6]', '[1, 2, 3, 4]'], correctIndex: 1, explanation: 'range(4) → [0,1,2,3]. Squaring each: 0,1,4,9 → [0, 1, 4, 9].', difficulty: 'Easy', points: 10 },
    { id: 'p2', question: 'What is a Python generator?', options: ['A built-in data type', 'A function that yields values lazily one at a time', 'A class decorator', 'A type annotation'], correctIndex: 1, explanation: 'Generators use `yield` to produce values lazily — only computing each value when requested, saving memory.', difficulty: 'Medium', points: 15 },
    { id: 'p3', question: 'What library is most commonly used for tabular data in Python?', options: ['NumPy', 'Pandas', 'Matplotlib', 'SciPy'], correctIndex: 1, explanation: 'Pandas provides DataFrames and Series — the standard tools for data manipulation, cleaning, and analysis in Python.', difficulty: 'Easy', points: 10 },
    { id: 'p4', question: 'What is overfitting in machine learning?', options: ['Model too simple to capture patterns', 'Model memorises training data and fails on new data', 'Training takes too long', 'Data not normalised'], correctIndex: 1, explanation: 'Overfitting means the model learned the training data\'s noise rather than patterns, causing poor generalisation.', difficulty: 'Medium', points: 15 },
    { id: 'p5', question: 'What does `*args` do in a Python function definition?', options: ['Passes keyword arguments', 'Collects positional arguments into a tuple', 'Multiplies arguments', 'Decorates the function'], correctIndex: 1, explanation: '`*args` collects any number of positional arguments into a tuple inside the function body.', difficulty: 'Medium', points: 15 },
    { id: 'p6', question: 'What is the difference between `copy.copy()` and `copy.deepcopy()`?', options: ['They are identical', 'deepcopy recursively copies all nested objects; copy is shallow', 'copy is faster and copies everything', 'deepcopy only works on lists'], correctIndex: 1, explanation: 'Shallow copy references nested objects; deepcopy creates fully independent copies of all nested structures.', difficulty: 'Hard', points: 20 },
    { id: 'p7', question: 'What does the `@property` decorator do in Python?', options: ['Marks a method as static', 'Allows a method to be accessed like an attribute', 'Caches a method result', 'Makes a class abstract'], correctIndex: 1, explanation: '@property lets you define a method that behaves like an attribute when accessed, enabling getter/setter patterns.', difficulty: 'Hard', points: 20 },
    { id: 'p8', question: 'What is the GIL (Global Interpreter Lock) in CPython?', options: ['A memory manager', 'A mutex allowing only one thread to execute Python bytecode at once', 'A security feature', 'A garbage collector'], correctIndex: 1, explanation: 'The GIL prevents true CPU-bound parallelism in CPython threads. Use multiprocessing or async I/O for concurrency.', difficulty: 'Hard', points: 20 },
    { id: 'p9', question: 'What does `enumerate(iterable)` return?', options: ['A sorted list', 'An iterator of (index, value) pairs', 'A dictionary', 'A set of values'], correctIndex: 1, explanation: 'enumerate() wraps an iterable producing (index, element) tuples, avoiding manual counter variables.', difficulty: 'Easy', points: 10 },
    { id: 'p10', question: 'What is a Pandas DataFrame?', options: ['A 1D array', 'A 2D labeled tabular data structure', 'A Python dictionary subclass', 'An SQL connection'], correctIndex: 1, explanation: 'A DataFrame is Pandas\' core 2D structure with labeled rows and columns — think of it as a super-powered spreadsheet.', difficulty: 'Easy', points: 10 },
  ],
  cpp: [
    { id: 'c1', question: 'What is a pointer in C++?', options: ['A data type alias', 'A variable storing the memory address of another variable', 'A reference type', 'A const value'], correctIndex: 1, explanation: 'A pointer stores a memory address. Dereference with * to read/write the value at that address.', difficulty: 'Easy', points: 10 },
    { id: 'c2', question: 'Default member access in `struct` vs `class` in C++?', options: ['Both are private', 'struct is public, class is private', 'class is public, struct is private', 'They differ only in size'], correctIndex: 1, explanation: 'The only real C++ difference: struct members are public by default; class members are private by default.', difficulty: 'Medium', points: 15 },
    { id: 'c3', question: 'What does RAII stand for?', options: ['Random Access Iterator Interface', 'Resource Acquisition Is Initialisation', 'Runtime Allocation Intelligent Invalidation', 'Recursive Algorithm Invocation Index'], correctIndex: 1, explanation: 'RAII ties resource lifetime to object lifetime: resources acquired in constructor, released in destructor — preventing leaks.', difficulty: 'Hard', points: 20 },
    { id: 'c4', question: 'Time complexity of binary search on a sorted array?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1, explanation: 'Binary search halves the search space each step, giving O(log n) — it\'s highly efficient for sorted data.', difficulty: 'Easy', points: 10 },
    { id: 'c5', question: 'What is a virtual function in C++?', options: ['A function with no body', 'A function enabling runtime polymorphism via base-class pointer', 'A static member function', 'An inline function'], correctIndex: 1, explanation: 'Virtual functions enable runtime polymorphism: the correct overridden version is called based on the actual object type.', difficulty: 'Medium', points: 15 },
    { id: 'c6', question: 'What does `std::move` enable?', options: ['Copying objects cheaply', 'Transferring resource ownership without copying (move semantics)', 'Moving memory addresses', 'Sorting algorithms'], correctIndex: 1, explanation: 'std::move casts to rvalue reference, triggering move constructors that steal resources instead of copying them.', difficulty: 'Hard', points: 20 },
    { id: 'c7', question: 'What does `nullptr` represent in C++11+?', options: ['Integer zero', 'Type-safe null pointer constant', 'An empty string', 'Unallocated memory'], correctIndex: 1, explanation: 'nullptr is a type-safe null pointer constant. Unlike NULL (which is 0), it can\'t accidentally match integer parameters.', difficulty: 'Easy', points: 10 },
    { id: 'c8', question: 'Stack vs Heap memory in C++?', options: ['Stack is larger; heap is smaller', 'Stack: auto-managed, fast, limited; Heap: manually managed, large, flexible', 'Heap is always faster', 'They are equivalent'], correctIndex: 1, explanation: 'Stack is automatic (local vars), very fast but limited. Heap is dynamic (new/delete or smart pointers), much larger.', difficulty: 'Medium', points: 15 },
    { id: 'c9', question: 'What is a template in C++?', options: ['A design pattern', 'A feature enabling generic programming with type parameters', 'A preprocessor macro', 'An inheritance mechanism'], correctIndex: 1, explanation: 'Templates allow writing generic functions/classes that work with any type, enabling compile-time polymorphism.', difficulty: 'Hard', points: 20 },
    { id: 'c10', question: 'What is the difference between `++i` and `i++`?', options: ['No difference', '++i increments first and returns new value; i++ returns current value then increments', 'i++ is faster always', '++i can cause undefined behaviour'], correctIndex: 1, explanation: 'Pre-increment (++i) increments and returns new value. Post-increment (i++) returns current value, then increments.', difficulty: 'Easy', points: 10 },
  ],
  blender: [
    { id: 'b1', question: 'What shortcut adds a new object in Blender\'s 3D viewport?', options: ['Ctrl+A', 'Shift+A', 'Alt+N', 'Ctrl+N'], correctIndex: 1, explanation: 'Shift+A opens the Add menu, letting you add meshes, lights, cameras, curves, and more.', difficulty: 'Easy', points: 10 },
    { id: 'b2', question: 'What does the Solidify modifier do?', options: ['Makes objects transparent', 'Adds thickness to a surface mesh', 'Converts to solid physics objects', 'Bakes lighting'], correctIndex: 1, explanation: 'Solidify adds depth to thin surfaces, turning a flat plane into a slab with a configurable thickness value.', difficulty: 'Easy', points: 10 },
    { id: 'b3', question: 'What is UV unwrapping?', options: ['Removing textures', 'Projecting a 3D surface onto a 2D plane for texturing', 'Animating a mesh', 'Baking AO'], correctIndex: 1, explanation: 'UV unwrapping "unfolds" a 3D model into 2D coordinates so you can paint textures or apply image maps precisely.', difficulty: 'Medium', points: 15 },
    { id: 'b4', question: 'What is a keyframe in animation?', options: ['A type of mesh vertex', 'A recorded state of a property at a specific frame', 'A camera mode', 'A rendering layer'], correctIndex: 1, explanation: 'Keyframes record a property value (position, rotation, scale) at a specific frame. Blender interpolates between them.', difficulty: 'Easy', points: 10 },
    { id: 'b5', question: 'Cycles vs Eevee renderer — key difference?', options: ['Eevee is slower', 'Cycles is path-traced (realistic); Eevee is real-time rasterised (fast)', 'They produce identical results', 'Cycles only uses CPU'], correctIndex: 1, explanation: 'Cycles is a physically-based path tracer — photorealistic but slow. Eevee is real-time rasterisation — fast with some visual trade-offs.', difficulty: 'Medium', points: 15 },
    { id: 'b6', question: 'What is a PBR material?', options: ['A procedural bump render', 'A Physically Based Rendering material simulating real-world light interaction', 'A post-processing pass', 'A particle setting'], correctIndex: 1, explanation: 'PBR materials use physically accurate properties (base color, metallic, roughness, normal) for realistic lighting.', difficulty: 'Hard', points: 20 },
    { id: 'b7', question: 'What does the Subdivision Surface modifier do?', options: ['Reduces polygon count', 'Smooths mesh by recursively subdividing faces', 'Applies textures', 'Animates the mesh'], correctIndex: 1, explanation: 'Subdivision Surface recursively subdivides polygons, creating smoother high-resolution meshes from low-poly models.', difficulty: 'Easy', points: 10 },
    { id: 'b8', question: 'What are shape keys used for?', options: ['Keyboard shortcuts', 'Storing multiple mesh shapes for blend animations', 'Material transitions', 'Camera animations'], correctIndex: 1, explanation: 'Shape keys store different deformed states of a mesh. Blending between them drives animations like facial expressions.', difficulty: 'Hard', points: 20 },
    { id: 'b9', question: 'What is ambient occlusion (AO)?', options: ['A type of light object', 'A shading technique simulating how light reaches surfaces in crevices', 'A texture format', 'A compositor node'], correctIndex: 1, explanation: 'AO darkens areas where light is blocked by nearby geometry (cracks, corners), adding visual depth and realism.', difficulty: 'Medium', points: 15 },
    { id: 'b10', question: 'What is retopology in 3D modelling?', options: ['A rendering technique', 'Rebuilding a mesh with cleaner, optimised topology', 'A UV mapping method', 'A rigging process'], correctIndex: 1, explanation: 'Retopology creates a new, clean mesh over a high-poly sculpt with better edge flow for animation and real-time use.', difficulty: 'Hard', points: 20 },
  ],
  selenium: [
    { id: 's1', question: 'What is Selenium WebDriver?', options: ['A JavaScript framework', 'A browser automation tool for testing', 'A CSS testing library', 'A REST API testing tool'], correctIndex: 1, explanation: 'Selenium WebDriver provides a programming interface to control browsers, simulating real user interactions for testing.', difficulty: 'Easy', points: 10 },
    { id: 's2', question: 'Which locator is generally most stable?', options: ['XPath by position', 'CSS index selectors', 'IDs and data-testid attributes', 'Class names'], correctIndex: 2, explanation: 'IDs and custom data-testid attributes are stable because they\'re unique and not tied to visual structure.', difficulty: 'Medium', points: 15 },
    { id: 's3', question: 'What is the Page Object Model (POM)?', options: ['A testing framework', 'A design pattern separating page elements from test logic', 'A Selenium built-in feature', 'A JavaScript pattern'], correctIndex: 1, explanation: 'POM creates a class per page encapsulating its elements and interactions, making tests cleaner and maintainable.', difficulty: 'Medium', points: 15 },
    { id: 's4', question: 'What is an explicit wait in Selenium?', options: ['Thread.sleep()', 'Waiting for a specific condition before proceeding', 'A global timeout setting', 'Waiting a fixed number of seconds'], correctIndex: 1, explanation: 'WebDriverWait with ExpectedConditions waits intelligently for a condition (element visible, clickable) up to a timeout.', difficulty: 'Medium', points: 15 },
    { id: 's5', question: 'What does CI/CD stand for?', options: ['Code Integration / Code Deployment', 'Continuous Integration / Continuous Delivery', 'Core Interface / Core Development', 'Customer Integration / Customer Delivery'], correctIndex: 1, explanation: 'CI/CD automates building, testing, and deploying. CI integrates code frequently; CD automates releases.', difficulty: 'Easy', points: 10 },
    { id: 's6', question: 'How does Cypress differ from Selenium?', options: ['Cypress is slower', 'Cypress is JS-native, runs inside the browser, with better DX', 'Cypress is a unit test framework', 'Cypress needs Java'], correctIndex: 1, explanation: 'Cypress runs inside the browser (not via WebDriver), offering faster execution, automatic waits, and real-time debugging.', difficulty: 'Hard', points: 20 },
    { id: 's7', question: 'What is test flakiness?', options: ['Tests that run too slowly', 'Tests that inconsistently pass or fail without code changes', 'Tests with many assertions', 'Undocumented tests'], correctIndex: 1, explanation: 'Flaky tests produce inconsistent results due to timing issues, race conditions, or environmental dependencies.', difficulty: 'Medium', points: 15 },
    { id: 's8', question: 'What is a test fixture?', options: ['A UI component', 'A fixed baseline (setup/teardown) ensuring tests run in a known state', 'A type of assertion', 'A mocking library'], correctIndex: 1, explanation: 'Fixtures establish and clean up known state before/after tests — like seeding a database or opening a browser session.', difficulty: 'Hard', points: 20 },
    { id: 's9', question: 'What is BDD (Behaviour-Driven Development)?', options: ['A coding framework', 'Writing tests as human-readable scenarios using Given/When/Then', 'A deployment strategy', 'A performance testing approach'], correctIndex: 1, explanation: 'BDD uses Gherkin syntax (Given/When/Then) to write tests that communicate behaviour to both technical and non-technical stakeholders.', difficulty: 'Hard', points: 20 },
    { id: 's10', question: 'What does `findElement` vs `findElements` return?', options: ['Same thing', 'findElement returns a single WebElement; findElements returns a list', 'findElements is deprecated', 'findElement is faster'], correctIndex: 1, explanation: 'findElement returns the first matching element (throws if not found); findElements returns a list (empty if nothing matches).', difficulty: 'Easy', points: 10 },
  ],
  n8n: [
    { id: 'n1', question: 'What is n8n?', options: ['A programming language', 'A workflow automation tool connecting apps via nodes', 'A database', 'A testing framework'], correctIndex: 1, explanation: 'n8n is an open-source workflow automation platform that connects apps via configurable nodes — like a self-hostable Zapier.', difficulty: 'Easy', points: 10 },
    { id: 'n2', question: 'What is a webhook?', options: ['A database hook', 'An HTTP callback triggered when a specific event occurs', 'A front-end component', 'A caching strategy'], correctIndex: 1, explanation: 'A webhook sends an HTTP POST to a URL when an event occurs in a service, enabling real-time integration without polling.', difficulty: 'Easy', points: 10 },
    { id: 'n3', question: 'What does REST stand for?', options: ['Remote Execution State Transfer', 'Representational State Transfer', 'Resource Endpoint Service Technology', 'Reactive Event Stream Transfer'], correctIndex: 1, explanation: 'REST (Representational State Transfer) is an architectural style for stateless, resource-based HTTP APIs.', difficulty: 'Easy', points: 10 },
    { id: 'n4', question: 'What is API rate limiting?', options: ['Speeding up API responses', 'Restricting the number of API calls in a given time window', 'A caching technique', 'An authentication method'], correctIndex: 1, explanation: 'Rate limiting caps requests per time window to prevent abuse and ensure fair usage across all API consumers.', difficulty: 'Medium', points: 15 },
    { id: 'n5', question: 'What is OAuth 2.0?', options: ['A database protocol', 'An authorisation framework enabling third-party access without sharing credentials', 'A query language', 'A testing standard'], correctIndex: 1, explanation: 'OAuth 2.0 lets users grant apps limited access to their accounts without revealing passwords — used by Google, GitHub, Slack.', difficulty: 'Medium', points: 15 },
    { id: 'n6', question: 'What is idempotency in APIs?', options: ['Speed optimisation', 'Making the same request multiple times has the same effect as once', 'A caching strategy', 'An error handling pattern'], correctIndex: 1, explanation: 'An idempotent operation produces the same result no matter how many times it\'s called. PUT and DELETE are idempotent; POST typically is not.', difficulty: 'Hard', points: 20 },
    { id: 'n7', question: 'What does JSON stand for?', options: ['JavaScript Object Notation', 'Java Serialised Object Network', 'JavaScript Online Navigation', 'JSON Standard Object Notation'], correctIndex: 0, explanation: 'JSON (JavaScript Object Notation) is a lightweight, human-readable data format widely used in APIs and configs.', difficulty: 'Easy', points: 10 },
    { id: 'n8', question: 'What is a message queue used for?', options: ['Storing database records', 'Decoupling services by asynchronously passing messages', 'Caching API responses', 'Managing user sessions'], correctIndex: 1, explanation: 'Message queues (RabbitMQ, SQS, Kafka) enable async, resilient communication between services that may be temporarily unavailable.', difficulty: 'Hard', points: 20 },
    { id: 'n9', question: 'What HTTP status code means "Unauthorised"?', options: ['404', '500', '401', '403'], correctIndex: 2, explanation: '401 means authentication is required or failed. 403 means authenticated but not permitted. 404 means not found.', difficulty: 'Easy', points: 10 },
    { id: 'n10', question: 'What is the difference between authentication and authorisation?', options: ['They are the same', 'Authentication verifies identity; authorisation determines permissions', 'Authorisation verifies identity; authentication determines permissions', 'Neither involves passwords'], correctIndex: 1, explanation: 'Authentication answers "who are you?" (login). Authorisation answers "what can you do?" (permissions/roles).', difficulty: 'Medium', points: 15 },
  ],
};

/* ── Subject → bank key mapping ─────────────── */
export function getSubjectKey(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes('react') || s.includes('full stack') || s.includes('node') || s.includes('javascript') || s.includes('typescript')) return 'react';
  if (s.includes('python') || s.includes('data science') || s.includes('machine learning') || s.includes('pandas')) return 'python';
  if (s.includes('c++') || s.includes('cpp') || s.includes('systems')) return 'cpp';
  if (s.includes('blender') || s.includes('3d') || s.includes('animation')) return 'blender';
  if (s.includes('selenium') || s.includes('automation') || s.includes('qa') || s.includes('testing')) return 'selenium';
  return 'n8n';
}

/* ── AI question generator (mock) ───────────── */
export async function generateQuestionsAI(
  subject: string,
  _topic: string,
  difficulty: string,
  count: number,
  onQuestionGenerated?: (q: QuizQuestion) => void,
): Promise<QuizQuestion[]> {
  const key = getSubjectKey(subject);
  const bank = QUESTION_BANK[key] ?? QUESTION_BANK.react;
  let pool = [...bank];
  if (difficulty === 'Beginner') pool = bank.filter((q) => q.difficulty === 'Easy');
  else if (difficulty === 'Advanced') pool = bank.filter((q) => q.difficulty === 'Hard');
  if (pool.length < count) pool = bank;
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const result: QuizQuestion[] = [];
  for (let i = 0; i < selected.length; i++) {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    const q = { ...selected[i], id: `gen-${Date.now()}-${i}` };
    result.push(q);
    onQuestionGenerated?.(q);
  }
  return result;
}

/* ── Pre-seeded quizzes ─────────────────────── */
const SEED_QUIZZES: Quiz[] = [
  { id: 'quiz-sarah-1', teacherId: 'sarah-johnson', title: 'React & TypeScript Fundamentals', subject: 'Full Stack Development', topic: 'React Hooks, TypeScript, REST APIs', difficulty: 'Intermediate', questions: QUESTION_BANK.react, timePerQuestion: 30, createdAt: '2025-04-10', totalAttempts: 142, avgScore: 74 },
  { id: 'quiz-michael-1', teacherId: 'michael-chen', title: 'Python & Data Science Essentials', subject: 'Python', topic: 'Python Core, Pandas, Machine Learning', difficulty: 'Intermediate', questions: QUESTION_BANK.python, timePerQuestion: 30, createdAt: '2025-04-12', totalAttempts: 98, avgScore: 68 },
  { id: 'quiz-emily-1', teacherId: 'emily-rodriguez', title: 'C++ Systems Programming', subject: 'C++', topic: 'Pointers, OOP, STL, Memory Management', difficulty: 'Advanced', questions: QUESTION_BANK.cpp, timePerQuestion: 35, createdAt: '2025-04-08', totalAttempts: 67, avgScore: 61 },
  { id: 'quiz-david-1', teacherId: 'david-park', title: 'Blender 3D Essentials', subject: 'Blender 3D', topic: 'Modelling, Rendering, Animation', difficulty: 'Beginner', questions: QUESTION_BANK.blender, timePerQuestion: 25, createdAt: '2025-04-15', totalAttempts: 55, avgScore: 71 },
  { id: 'quiz-priya-1', teacherId: 'priya-patel', title: 'Test Automation & QA', subject: 'Selenium Automation', topic: 'Selenium, Cypress, CI/CD, BDD', difficulty: 'Intermediate', questions: QUESTION_BANK.selenium, timePerQuestion: 30, createdAt: '2025-04-14', totalAttempts: 89, avgScore: 76 },
  { id: 'quiz-james-1', teacherId: 'james-wilson', title: 'API Integration & Automation', subject: 'n8n Workflow Automation', topic: 'REST APIs, Webhooks, OAuth, n8n', difficulty: 'Intermediate', questions: QUESTION_BANK.n8n, timePerQuestion: 30, createdAt: '2025-04-16', totalAttempts: 43, avgScore: 72 },
];

/* ── Context ────────────────────────────────── */
interface QuizContextType {
  quizzes: Quiz[];
  results: QuizResult[];
  addQuiz: (quiz: Quiz) => void;
  saveResult: (result: QuizResult) => void;
  getQuizzesByTeacher: (teacherId: string) => Quiz[];
  getResultForQuiz: (quizId: string) => QuizResult | undefined;
}

const QuizContext = createContext<QuizContextType | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(SEED_QUIZZES);
  const [results, setResults] = useState<QuizResult[]>(() => {
    try { return JSON.parse(localStorage.getItem('verilearn_quiz_results') || '[]'); } catch { return []; }
  });

  const addQuiz = (quiz: Quiz) => setQuizzes((prev) => [quiz, ...prev]);

  const saveResult = (result: QuizResult) =>
    setResults((prev) => {
      const updated = prev.filter((r) => r.quizId !== result.quizId).concat(result);
      localStorage.setItem('verilearn_quiz_results', JSON.stringify(updated));
      return updated;
    });

  const getQuizzesByTeacher = (teacherId: string) => quizzes.filter((q) => q.teacherId === teacherId);
  const getResultForQuiz = (quizId: string) => results.find((r) => r.quizId === quizId);

  return (
    <QuizContext.Provider value={{ quizzes, results, addQuiz, saveResult, getQuizzesByTeacher, getResultForQuiz }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}
