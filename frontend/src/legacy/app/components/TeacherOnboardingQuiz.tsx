import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Brain, CheckCircle2, Clock3, Medal, RotateCcw } from 'lucide-react';

interface TeacherQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface TeacherOnboardingQuizProps {
  selectedSubjects: string[];
  passMinCorrect: number;
  totalQuestions: number;
  cooldownActive: boolean;
  cooldownRemainingMs: number;
  isSubmitting: boolean;
  onSubmit: (result: { correctAnswers: number; totalQuestions: number }) => Promise<void>;
}

const TEACHER_SUBJECT_BANK: Record<string, TeacherQuestion[]> = {
  English: [
    { id: 'eng-1', subject: 'English', question: 'Which sentence is grammatically correct?', options: ['He go to school daily.', 'He goes to school daily.', 'He going to school daily.', 'He gone to school daily.'], answerIndex: 1, explanation: 'With third-person singular (he/she/it), present simple takes -s: goes.' },
    { id: 'eng-2', subject: 'English', question: 'What is the synonym of “rapid”?', options: ['Slow', 'Quick', 'Weak', 'Heavy'], answerIndex: 1, explanation: 'Rapid means fast or quick.' },
    { id: 'eng-3', subject: 'English', question: 'Choose the correct punctuation.', options: ['Lets eat, grandma.', 'Let’s eat grandma.', 'Lets eat grandma.', 'Let’s eat, grandma.'], answerIndex: 3, explanation: 'Comma changes meaning; “Let’s eat, grandma.” is correct and safe for grandma.' },
    { id: 'eng-4', subject: 'English', question: 'Which is a complex sentence?', options: ['She laughed and cried.', 'I came, I saw, I left.', 'When it rained, we stayed inside.', 'Close the door.'], answerIndex: 2, explanation: 'Complex sentences combine an independent clause with a dependent clause.' },
    { id: 'eng-5', subject: 'English', question: 'Identify the passive voice sentence.', options: ['The team won the match.', 'The match was won by the team.', 'They win matches often.', 'Winning is fun.'], answerIndex: 1, explanation: 'Passive voice structure: object + form of be + past participle.' },
    { id: 'eng-6', subject: 'English', question: 'Which word is an adverb?', options: ['Beautiful', 'Quickly', 'Happiness', 'Honest'], answerIndex: 1, explanation: '“Quickly” modifies verbs and is an adverb.' },
    { id: 'eng-7', subject: 'English', question: 'What is the antonym of “expand”?', options: ['Grow', 'Stretch', 'Contract', 'Increase'], answerIndex: 2, explanation: 'Contract means to shrink, opposite of expand.' },
    { id: 'eng-8', subject: 'English', question: 'Choose the correct article: “___ honest person”.', options: ['A', 'An', 'The', 'No article'], answerIndex: 1, explanation: '“Honest” starts with a vowel sound, so use “an”.' },
    { id: 'eng-9', subject: 'English', question: 'Which sentence is in present perfect tense?', options: ['She is eating.', 'She has eaten.', 'She ate.', 'She had eaten.'], answerIndex: 1, explanation: 'Present perfect = has/have + past participle.' },
    { id: 'eng-10', subject: 'English', question: 'What is the main purpose of a thesis statement?', options: ['To define every term', 'To summarize references', 'To present the central argument', 'To format paragraphs'], answerIndex: 2, explanation: 'A thesis statement gives the core claim/argument of writing.' },
  ],
  Python: [
    { id: 'py-1', subject: 'Python', question: 'Which keyword defines a function in Python?', options: ['func', 'define', 'def', 'lambda'], answerIndex: 2, explanation: 'Python uses def to define functions.' },
    { id: 'py-2', subject: 'Python', question: 'What is the output type of `[x for x in range(3)]`?', options: ['tuple', 'list', 'set', 'dict'], answerIndex: 1, explanation: 'List comprehension creates a list.' },
    { id: 'py-3', subject: 'Python', question: 'How do you start a comment in Python?', options: ['//', '#', '--', '/*'], answerIndex: 1, explanation: 'Single-line comments start with #.' },
    { id: 'py-4', subject: 'Python', question: 'What does `len("abc")` return?', options: ['2', '3', '4', 'error'], answerIndex: 1, explanation: 'Length of “abc” is 3.' },
    { id: 'py-5', subject: 'Python', question: 'Which structure stores key-value pairs?', options: ['list', 'tuple', 'dict', 'set'], answerIndex: 2, explanation: 'Dictionaries store key-value mappings.' },
    { id: 'py-6', subject: 'Python', question: 'What is correct file open mode for appending?', options: ['r', 'w', 'x', 'a'], answerIndex: 3, explanation: 'Mode `a` appends to file end.' },
    { id: 'py-7', subject: 'Python', question: 'What does `pip` primarily do?', options: ['Runs Python files', 'Installs packages', 'Formats code', 'Compiles Python to C'], answerIndex: 1, explanation: 'pip installs and manages Python packages.' },
    { id: 'py-8', subject: 'Python', question: 'Which exception handles missing dictionary keys?', options: ['TypeError', 'ValueError', 'KeyError', 'IndexError'], answerIndex: 2, explanation: 'Missing dict keys raise KeyError.' },
    { id: 'py-9', subject: 'Python', question: 'What does `__name__ == "__main__"` check?', options: ['If script runs directly', 'If module is installed', 'If function name is main', 'If Python version is latest'], answerIndex: 0, explanation: 'It checks whether file is executed directly.' },
    { id: 'py-10', subject: 'Python', question: 'What is a Python tuple?', options: ['Mutable sequence', 'Immutable sequence', 'A key-value map', 'A loop type'], answerIndex: 1, explanation: 'Tuples are ordered and immutable.' },
  ],
  'C++': [
    { id: 'cpp-1', subject: 'C++', question: 'What symbol is used for single-line comments in C++?', options: ['#', '//', '/*', '--'], answerIndex: 1, explanation: 'C++ single-line comments use //.' },
    { id: 'cpp-2', subject: 'C++', question: 'What does `std::cout` do?', options: ['Input stream', 'Output stream', 'Memory allocation', 'File write only'], answerIndex: 1, explanation: 'std::cout outputs text to standard output.' },
    { id: 'cpp-3', subject: 'C++', question: 'Which keyword creates a class inheriting from base publicly?', options: ['inherits', 'extends', ': public', ': inherit'], answerIndex: 2, explanation: 'C++ uses `class Child : public Base {}` syntax.' },
    { id: 'cpp-4', subject: 'C++', question: 'Which STL container is dynamic array-like?', options: ['std::vector', 'std::map', 'std::set', 'std::stack'], answerIndex: 0, explanation: 'std::vector stores contiguous dynamic arrays.' },
    { id: 'cpp-5', subject: 'C++', question: 'What is `nullptr`?', options: ['Integer zero', 'Type-safe null pointer', 'Macro only', 'Dangling pointer'], answerIndex: 1, explanation: 'nullptr is type-safe null pointer constant in modern C++.' },
    { id: 'cpp-6', subject: 'C++', question: 'Which function is called when object is destroyed?', options: ['constructor', 'destructor', 'allocator', 'initializer'], answerIndex: 1, explanation: 'Destructor (~ClassName) runs on object destruction.' },
    { id: 'cpp-7', subject: 'C++', question: 'Which complexity is binary search on sorted array?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], answerIndex: 1, explanation: 'Binary search halves search space each step.' },
    { id: 'cpp-8', subject: 'C++', question: 'What does `virtual` enable in C++?', options: ['Faster compile', 'Runtime polymorphism', 'Inline expansion', 'Automatic memory free'], answerIndex: 1, explanation: 'virtual allows overridden methods resolved at runtime.' },
    { id: 'cpp-9', subject: 'C++', question: 'What does RAII stand for?', options: ['Runtime Access Internal Interface', 'Resource Acquisition Is Initialization', 'Random Access Is Immediate', 'Resource Allocation In Iterations'], answerIndex: 1, explanation: 'RAII ties resources to object lifetime.' },
    { id: 'cpp-10', subject: 'C++', question: 'What is the correct header for `std::string`?', options: ['<str>', '<string>', '<cstring>', '<iostream>'], answerIndex: 1, explanation: 'Include <string> for std::string.' },
  ],
  'Node.js': [
    { id: 'node-1', subject: 'Node.js', question: 'Node.js is primarily built on which engine?', options: ['SpiderMonkey', 'V8', 'JavaScriptCore', 'Chakra'], answerIndex: 1, explanation: 'Node.js uses Google V8 JavaScript engine.' },
    { id: 'node-2', subject: 'Node.js', question: 'Which module handles HTTP servers in Node?', options: ['fs', 'path', 'http', 'events'], answerIndex: 2, explanation: 'Built-in http module creates HTTP servers.' },
    { id: 'node-3', subject: 'Node.js', question: 'What does npm stand for?', options: ['Node Program Manager', 'Node Package Manager', 'Network Package Module', 'New Project Manager'], answerIndex: 1, explanation: 'npm is Node Package Manager.' },
    { id: 'node-4', subject: 'Node.js', question: 'Which method parses JSON request body in Express?', options: ['express.json()', 'express.parse()', 'app.body()', 'req.json()'], answerIndex: 0, explanation: 'express.json() middleware parses JSON bodies.' },
    { id: 'node-5', subject: 'Node.js', question: 'What does `process.env` provide?', options: ['Database ORM', 'Environment variables', 'Package lock data', 'Compiled output'], answerIndex: 1, explanation: 'process.env reads env variables.' },
    { id: 'node-6', subject: 'Node.js', question: 'Which keyword waits for Promise result in async function?', options: ['yield', 'await', 'defer', 'wait'], answerIndex: 1, explanation: 'await pauses async function until Promise resolves/rejects.' },
    { id: 'node-7', subject: 'Node.js', question: 'What is middleware in Express?', options: ['UI component', 'Function between request and response', 'Database schema', 'Routing table only'], answerIndex: 1, explanation: 'Middleware has access to req/res/next and can modify flow.' },
    { id: 'node-8', subject: 'Node.js', question: 'Which status code means created?', options: ['200', '201', '204', '404'], answerIndex: 1, explanation: '201 Created indicates successful resource creation.' },
    { id: 'node-9', subject: 'Node.js', question: 'What is common pattern for handling async errors in Express?', options: ['Ignore and continue', 'Wrap handlers and pass to next(err)', 'Use setTimeout', 'Only console.log'], answerIndex: 1, explanation: 'Use async wrapper and next(err) for centralized error middleware.' },
    { id: 'node-10', subject: 'Node.js', question: 'Which file usually defines package scripts/deps?', options: ['node.config', 'package.json', 'npm.lock', 'app.js'], answerIndex: 1, explanation: 'package.json stores scripts, dependencies, metadata.' },
  ],
  JavaScript: [
    { id: 'js-1', subject: 'JavaScript', question: 'Which keyword declares block-scoped variable?', options: ['var', 'let', 'const', 'Both let and const'], answerIndex: 3, explanation: 'let and const are block-scoped.' },
    { id: 'js-2', subject: 'JavaScript', question: 'What is result of `typeof null`?', options: ['null', 'object', 'undefined', 'number'], answerIndex: 1, explanation: 'Legacy JS behavior: typeof null is "object".' },
    { id: 'js-3', subject: 'JavaScript', question: 'Which method converts JSON string to object?', options: ['JSON.stringify', 'JSON.parse', 'Object.parse', 'parse.JSON'], answerIndex: 1, explanation: 'JSON.parse converts string into JS object.' },
    { id: 'js-4', subject: 'JavaScript', question: 'What does strict equality (`===`) compare?', options: ['Value only', 'Type only', 'Value and type', 'Reference only'], answerIndex: 2, explanation: '=== checks both value and type.' },
    { id: 'js-5', subject: 'JavaScript', question: 'Which array method creates new array with transformed elements?', options: ['forEach', 'map', 'filter', 'reduce'], answerIndex: 1, explanation: 'map returns transformed array.' },
    { id: 'js-6', subject: 'JavaScript', question: 'What is a Promise?', options: ['A loop helper', 'An object representing async completion/failure', 'A class decorator', 'A DOM node'], answerIndex: 1, explanation: 'Promise models async operation result.' },
    { id: 'js-7', subject: 'JavaScript', question: 'Which keyword creates class in modern JS?', options: ['object', 'prototype', 'class', 'constructor'], answerIndex: 2, explanation: 'class introduces class syntax.' },
    { id: 'js-8', subject: 'JavaScript', question: 'What does `Array.isArray(value)` check?', options: ['If object has length', 'If value is array', 'If value iterable', 'If value null'], answerIndex: 1, explanation: 'Array.isArray reliably checks arrays.' },
    { id: 'js-9', subject: 'JavaScript', question: 'What is event bubbling?', options: ['Event travels from parent to child only', 'Event propagates from target upward', 'Only keyboard events', 'Stops all handlers'], answerIndex: 1, explanation: 'Events bubble from target element to ancestors.' },
    { id: 'js-10', subject: 'JavaScript', question: 'Which function schedules callback after delay?', options: ['setNow', 'setDelay', 'setTimeout', 'setIntervalOnce'], answerIndex: 2, explanation: 'setTimeout runs callback after specified delay.' },
  ],
  Blender: [
    { id: 'bl-1', subject: 'Blender', question: 'Shortcut to add new object in Blender viewport?', options: ['Ctrl+A', 'Shift+A', 'Alt+A', 'Shift+N'], answerIndex: 1, explanation: 'Shift+A opens Add menu.' },
    { id: 'bl-2', subject: 'Blender', question: 'What does UV unwrapping do?', options: ['Adds lighting', 'Maps 3D mesh to 2D texture space', 'Optimizes animation', 'Renders final frame'], answerIndex: 1, explanation: 'UVs define how textures map onto 3D surfaces.' },
    { id: 'bl-3', subject: 'Blender', question: 'Which mode is used for mesh editing?', options: ['Sculpt Mode', 'Edit Mode', 'Pose Mode', 'Object Paint'], answerIndex: 1, explanation: 'Edit Mode is for vertices/edges/faces editing.' },
    { id: 'bl-4', subject: 'Blender', question: 'What does Subdivision Surface modifier do?', options: ['Reduces polygons', 'Smooths by subdividing geometry', 'Adds physics', 'Deletes doubles'], answerIndex: 1, explanation: 'Subdivision creates smoother high-poly shape.' },
    { id: 'bl-5', subject: 'Blender', question: 'Cycles renderer is known for?', options: ['Fast rasterization only', 'Path-traced realistic rendering', 'Texturing only', 'Animation baking'], answerIndex: 1, explanation: 'Cycles is physically based path tracer.' },
    { id: 'bl-6', subject: 'Blender', question: 'What are keyframes used for?', options: ['Texturing', 'Animation state over timeline', 'Viewport shading', 'Object grouping'], answerIndex: 1, explanation: 'Keyframes store property values at specific frames.' },
    { id: 'bl-7', subject: 'Blender', question: 'What does the Solidify modifier add?', options: ['Glow effect', 'Thickness', 'Transparency', 'Bone rig'], answerIndex: 1, explanation: 'Solidify adds thickness to mesh surfaces.' },
    { id: 'bl-8', subject: 'Blender', question: 'Which workspace is best for character rigging?', options: ['Layout', 'Scripting', 'Animation', 'Shading'], answerIndex: 2, explanation: 'Animation workspace is commonly used for rig/keyframes.' },
    { id: 'bl-9', subject: 'Blender', question: 'What is retopology?', options: ['Rendering pass', 'Rebuilding cleaner mesh topology', 'UV baking', 'Camera tracking'], answerIndex: 1, explanation: 'Retopology produces clean, animation-ready mesh.' },
    { id: 'bl-10', subject: 'Blender', question: 'Purpose of normal map in Blender material?', options: ['Change model shape', 'Fake surface detail in lighting', 'Set UV coordinates', 'Animate object'], answerIndex: 1, explanation: 'Normal maps affect lighting to simulate detail.' },
  ],
  'Selenium Automation': [
    { id: 'sel-1', subject: 'Selenium Automation', question: 'Selenium WebDriver is mainly used for?', options: ['Database migration', 'Browser automation testing', 'Code formatting', 'CI server setup'], answerIndex: 1, explanation: 'WebDriver automates browser actions for tests.' },
    { id: 'sel-2', subject: 'Selenium Automation', question: 'Which locator is generally most stable?', options: ['XPath by index', 'ID/data-testid', 'Class chain', 'Tag name only'], answerIndex: 1, explanation: 'Unique IDs or test IDs are more stable.' },
    { id: 'sel-3', subject: 'Selenium Automation', question: 'What is explicit wait?', options: ['Hard-coded sleep', 'Wait for specific condition', 'Build-time delay', 'Network timeout'], answerIndex: 1, explanation: 'Explicit wait waits for a condition (visible/clickable).' },
    { id: 'sel-4', subject: 'Selenium Automation', question: 'Page Object Model helps by?', options: ['Increasing browser speed', 'Separating page locators/actions from tests', 'Disabling flaky tests', 'Replacing assertions'], answerIndex: 1, explanation: 'POM improves maintainability by encapsulating page logic.' },
    { id: 'sel-5', subject: 'Selenium Automation', question: 'What does `findElements` return when no match?', options: ['Throws error', 'null', 'Empty list', 'Undefined'], answerIndex: 2, explanation: 'findElements returns empty list when no elements found.' },
    { id: 'sel-6', subject: 'Selenium Automation', question: 'Which status code indicates unauthorized?', options: ['403', '401', '404', '429'], answerIndex: 1, explanation: '401 indicates missing/invalid authentication.' },
    { id: 'sel-7', subject: 'Selenium Automation', question: 'Main reason tests become flaky?', options: ['Too many assertions', 'Timing/race conditions', 'Using CSS files', 'Using Git'], answerIndex: 1, explanation: 'Asynchronous timing issues often cause flaky tests.' },
    { id: 'sel-8', subject: 'Selenium Automation', question: 'CI in CI/CD stands for?', options: ['Code Integration', 'Continuous Integration', 'Continuous Inspection', 'Code Injection'], answerIndex: 1, explanation: 'CI = Continuous Integration.' },
    { id: 'sel-9', subject: 'Selenium Automation', question: 'Best practice for test data setup?', options: ['Use random each run only', 'Use deterministic fixtures', 'Manual setup only', 'No setup needed'], answerIndex: 1, explanation: 'Fixtures create repeatable known test state.' },
    { id: 'sel-10', subject: 'Selenium Automation', question: 'Which tool is commonly paired with Selenium for Java tests?', options: ['JUnit/TestNG', 'NumPy', 'Redux', 'Laravel'], answerIndex: 0, explanation: 'JUnit/TestNG are common Java test frameworks.' },
  ],
  'C Language': [
    { id: 'c-1', subject: 'C Language', question: 'Which header is needed for `printf`?', options: ['<conio.h>', '<stdlib.h>', '<stdio.h>', '<string.h>'], answerIndex: 2, explanation: 'printf is declared in stdio.h.' },
    { id: 'c-2', subject: 'C Language', question: 'What does `%d` format specifier represent?', options: ['float', 'char', 'int', 'string'], answerIndex: 2, explanation: '%d prints signed integer.' },
    { id: 'c-3', subject: 'C Language', question: 'Which operator gets value at pointer address?', options: ['&', '*', '->', '%'], answerIndex: 1, explanation: 'Dereference operator * accesses pointed value.' },
    { id: 'c-4', subject: 'C Language', question: 'What is the size of `char` in C?', options: ['1 byte', '2 bytes', '4 bytes', 'Depends only on OS'], answerIndex: 0, explanation: 'char is always 1 byte in C standard.' },
    { id: 'c-5', subject: 'C Language', question: 'Which loop checks condition before execution?', options: ['do-while only', 'while and for', 'do-while and for', 'switch'], answerIndex: 1, explanation: 'while/for are pre-test loops.' },
    { id: 'c-6', subject: 'C Language', question: 'What does `malloc` do?', options: ['Frees memory', 'Allocates dynamic memory', 'Copies strings', 'Opens files'], answerIndex: 1, explanation: 'malloc allocates memory from heap.' },
    { id: 'c-7', subject: 'C Language', question: 'What should follow successful `malloc` use?', options: ['No action', 'free()', 'delete', 'close()'], answerIndex: 1, explanation: 'free() releases malloc-allocated memory.' },
    { id: 'c-8', subject: 'C Language', question: 'Which statement is used for multiple branch selection?', options: ['if-else only', 'switch', 'for', 'goto'], answerIndex: 1, explanation: 'switch handles multi-case branch logic.' },
    { id: 'c-9', subject: 'C Language', question: 'What is array index of first element?', options: ['1', '0', '-1', 'Depends on compiler'], answerIndex: 1, explanation: 'C arrays are zero-indexed.' },
    { id: 'c-10', subject: 'C Language', question: 'What does `const` indicate in C?', options: ['Variable type char', 'Value cannot be modified through that identifier', 'Pointer null', 'Memory auto-freed'], answerIndex: 1, explanation: 'const creates read-only binding in context.' },
  ],
  Java: [
    { id: 'java-1', subject: 'Java', question: 'Which keyword defines a class in Java?', options: ['struct', 'class', 'object', 'define'], answerIndex: 1, explanation: 'Java uses class keyword.' },
    { id: 'java-2', subject: 'Java', question: 'JVM stands for?', options: ['Java Verified Method', 'Java Virtual Machine', 'Java Variable Model', 'Joint VM'], answerIndex: 1, explanation: 'JVM executes Java bytecode.' },
    { id: 'java-3', subject: 'Java', question: 'Which method is entry point of Java app?', options: ['start()', 'run()', 'main()', 'init()'], answerIndex: 2, explanation: 'public static void main(String[] args) is entry point.' },
    { id: 'java-4', subject: 'Java', question: 'Which collection stores unique elements?', options: ['List', 'Map', 'Set', 'Queue'], answerIndex: 2, explanation: 'Set keeps unique elements.' },
    { id: 'java-5', subject: 'Java', question: 'What does `extends` do in Java?', options: ['Implements interface', 'Creates inheritance', 'Imports package', 'Declares variable'], answerIndex: 1, explanation: 'extends creates class inheritance.' },
    { id: 'java-6', subject: 'Java', question: 'Which keyword is used for interface implementation?', options: ['extends', 'uses', 'implements', 'inherits'], answerIndex: 2, explanation: 'Classes implement interfaces via implements.' },
    { id: 'java-7', subject: 'Java', question: 'What is method overloading?', options: ['Same method name with different parameters', 'Overwriting parent method body', 'Calling method recursively', 'Using static methods only'], answerIndex: 0, explanation: 'Overloading means same name, different signatures.' },
    { id: 'java-8', subject: 'Java', question: 'Which access modifier is most restrictive?', options: ['public', 'protected', 'private', 'default'], answerIndex: 2, explanation: 'private is most restrictive to class scope.' },
    { id: 'java-9', subject: 'Java', question: 'What does `final` on variable imply?', options: ['Variable hidden', 'Value cannot be reassigned', 'Only public access', 'Auto serialization'], answerIndex: 1, explanation: 'final variable can be assigned once.' },
    { id: 'java-10', subject: 'Java', question: 'Which package includes ArrayList?', options: ['java.net', 'java.io', 'java.util', 'java.lang.reflect'], answerIndex: 2, explanation: 'ArrayList is in java.util package.' },
  ],
};

function shuffle<T>(items: T[]): T[] {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function buildTeacherQuestions(subjects: string[], totalQuestions: number): TeacherQuestion[] {
  const uniqueSubjects = Array.from(new Set(subjects)).filter((subject) => TEACHER_SUBJECT_BANK[subject]);

  if (uniqueSubjects.length === 0) {
    return [];
  }

  const basePerSubject = Math.floor(totalQuestions / uniqueSubjects.length);
  let remainder = totalQuestions % uniqueSubjects.length;

  const selected: TeacherQuestion[] = [];

  uniqueSubjects.forEach((subject) => {
    const source = shuffle(TEACHER_SUBJECT_BANK[subject]);
    const takeCount = basePerSubject + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);

    selected.push(...source.slice(0, takeCount));
  });

  return shuffle(selected).slice(0, totalQuestions);
}

export function TeacherOnboardingQuiz({
  selectedSubjects,
  passMinCorrect,
  totalQuestions,
  cooldownActive,
  cooldownRemainingMs,
  isSubmitting,
  onSubmit,
}: TeacherOnboardingQuizProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [localResult, setLocalResult] = useState<{ correct: number; total: number } | null>(null);

  const questions = useMemo(
    () => buildTeacherQuestions(selectedSubjects, totalQuestions),
    [selectedSubjects, totalQuestions],
  );

  const progressPercent = questions.length > 0
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  const selectedOption = answers[currentIndex] ?? -1;

  const startQuiz = () => {
    setStarted(true);
    setCurrentIndex(0);
    setSubmitted(false);
    setLocalResult(null);
    setAnswers(Array.from({ length: questions.length }, () => -1));
  };

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const answeredCount = answers.filter((answer) => answer >= 0).length;
  const canSubmit = answeredCount === questions.length && questions.length > 0;

  const submitQuiz = async () => {
    const correctAnswers = questions.reduce((total, question, index) => (
      answers[index] === question.answerIndex ? total + 1 : total
    ), 0);

    setLocalResult({ correct: correctAnswers, total: questions.length });
    setSubmitted(true);
    await onSubmit({ correctAnswers, totalQuestions: questions.length });
  };

  if (!started) {
    return (
      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(122,184,186,0.28)', background: 'white' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--foreground)] mb-1" style={{ fontWeight: 600 }}>
              <Brain className="w-4 h-4 text-purple-500" />
              Subject-wise Teacher Assessment
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {totalQuestions} MCQs generated only from selected subject(s). Pass requirement: {passMinCorrect}/{totalQuestions}.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#7c3aed' }}>
            Ready
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {selectedSubjects.map((subject) => (
            <span key={subject} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(122,184,186,0.14)', color: '#0f766e' }}>
              {subject}
            </span>
          ))}
        </div>

        {cooldownActive && (
          <div className="mb-4 flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.28)', color: '#b45309' }}>
            <Clock3 className="w-4 h-4" />
            Retry available in {formatCooldown(cooldownRemainingMs)}
          </div>
        )}

        <button
          type="button"
          disabled={cooldownActive || questions.length === 0}
          onClick={startQuiz}
          className="px-4 py-2 rounded-xl text-sm text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (submitted && localResult) {
    const passed = localResult.correct >= passMinCorrect;
    return (
      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(122,184,186,0.28)', background: 'white' }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: passed ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
          <Medal className="w-5 h-5" />
          {passed ? 'Great job! Assessment submitted.' : 'Assessment submitted. Keep pushing!'}
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Your score: {localResult.correct}/{localResult.total}. Pass target: {passMinCorrect}/{localResult.total}.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startQuiz}
            disabled={cooldownActive}
            className="px-4 py-2 rounded-xl text-sm border disabled:opacity-60"
            style={{ borderColor: 'rgba(122,184,186,0.35)', color: 'var(--foreground)' }}
          >
            <span className="inline-flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> Retry quiz</span>
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(122,184,186,0.28)', background: 'white' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm text-[var(--foreground)]" style={{ fontWeight: 600 }}>
          Question {currentIndex + 1} of {questions.length}
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(122,184,186,0.14)', color: '#0f766e' }}>
          {current.subject}
        </span>
      </div>

      <div className="h-2 rounded-full mb-4" style={{ background: 'rgba(122,184,186,0.16)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.25 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7ab8ba, #8b5cf6)' }}
        />
      </div>

      <div className="mb-4 text-[var(--foreground)]" style={{ fontWeight: 600 }}>
        {current.question}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {current.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(optionIndex)}
            className="text-left px-3 py-2 rounded-xl border text-sm transition-colors"
            style={{
              borderColor: selectedOption === optionIndex ? '#7ab8ba' : 'rgba(122,184,186,0.28)',
              background: selectedOption === optionIndex ? 'rgba(122,184,186,0.16)' : 'white',
              color: 'var(--foreground)',
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        {answeredCount}/{questions.length} answered
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={previousQuestion}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-xl text-sm border disabled:opacity-50"
          style={{ borderColor: 'rgba(122,184,186,0.35)', color: 'var(--foreground)' }}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="px-4 py-2 rounded-xl text-sm border disabled:opacity-50"
          style={{ borderColor: 'rgba(122,184,186,0.35)', color: 'var(--foreground)' }}
        >
          Next
        </button>
        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={() => { void submitQuiz(); }}
          className="px-4 py-2 rounded-xl text-sm text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Submitting…' : 'Submit Quiz'}
          </span>
        </button>
      </div>

      <p className="text-xs text-[var(--muted-foreground)] mt-4">Tip: Questions are generated only from your selected subjects.</p>
    </div>
  );
}
