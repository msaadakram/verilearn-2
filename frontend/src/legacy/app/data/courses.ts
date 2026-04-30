export interface CourseModule {
  title: string;
  lessons: string[];
  duration: string;
}

export interface CourseInstructor {
  name: string;
  title: string;
  students: string;
  rating: number;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  lessons: number;
  students: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  badge?: string;
  color: string;
  icon: string;
  highlights: string[];
  requirements: string[];
  whatYouLearn: string[];
  modules: CourseModule[];
  instructor: CourseInstructor;
  tags: string[];
}

export const courses: Course[] = [
  {
    id: 'cpp',
    title: 'C++ Mastery',
    subtitle: 'From Zero to Systems Programming Expert',
    description:
      'Master C++ from the ground up. Learn modern C++20/23 features, memory management, data structures, algorithms, and build real-world applications including a game engine and a multithreaded server.',
    image:
      'https://images.unsplash.com/photo-1733412505442-36cfa59a4240?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGUlMjBkYXJrJTIwc2NyZWVufGVufDF8fHx8MTc3NjY5NTE3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Programming',
    level: 'All Levels',
    duration: '48 hours',
    lessons: 186,
    students: '12,400+',
    rating: 4.8,
    reviews: 2340,
    price: 79,
    originalPrice: 199,
    badge: 'Best Seller',
    color: '#3b82f6',
    icon: '⚡',
    highlights: [
      'Modern C++20/23 standards',
      'Memory management & smart pointers',
      'STL containers & algorithms',
      'Multithreading & concurrency',
      'Build a game engine from scratch',
      'Certificate of completion',
    ],
    requirements: [
      'Basic computer literacy',
      'No prior programming experience needed',
      'A computer with a C++ compiler (guide provided)',
    ],
    whatYouLearn: [
      'Write clean, efficient, and modern C++ code',
      'Understand pointers, references, and memory management',
      'Master object-oriented programming patterns',
      'Implement complex data structures and algorithms',
      'Build multithreaded and concurrent applications',
      'Create real-world projects including a game engine',
      'Prepare for technical interviews at top companies',
      'Use CMake, GDB, and professional C++ tooling',
    ],
    modules: [
      { title: 'C++ Foundations', lessons: ['Environment Setup', 'Variables & Types', 'Control Flow', 'Functions', 'Arrays & Strings'], duration: '6h' },
      { title: 'Object-Oriented C++', lessons: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Operator Overloading', 'Templates'], duration: '8h' },
      { title: 'Memory & Pointers', lessons: ['Raw Pointers', 'Smart Pointers', 'RAII Pattern', 'Move Semantics', 'Memory Pools'], duration: '7h' },
      { title: 'STL Deep Dive', lessons: ['Containers', 'Iterators', 'Algorithms', 'Functional Programming', 'Custom Allocators'], duration: '6h' },
      { title: 'Concurrency', lessons: ['Threads', 'Mutexes & Locks', 'Async/Futures', 'Thread Pools', 'Lock-free Structures'], duration: '7h' },
      { title: 'Capstone: Game Engine', lessons: ['Architecture Design', 'Rendering Pipeline', 'Physics Engine', 'ECS Pattern', 'Final Build'], duration: '14h' },
    ],
    instructor: { name: 'Dr. Alex Kovalev', title: 'Senior Systems Engineer, Ex-Google', students: '45,000+', rating: 4.9 },
    tags: ['C++', 'Systems Programming', 'Game Dev', 'Performance'],
  },
  {
    id: 'python',
    title: 'Python Complete',
    subtitle: 'The Ultimate Python Developer Bootcamp',
    description:
      'The most comprehensive Python course on the platform. From basics to advanced topics like decorators, generators, async programming, data science with Pandas, web development with Django, and automation scripts.',
    image:
      'https://images.unsplash.com/photo-1656680715953-75d4bbcbb839?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxweXRob24lMjBwcm9ncmFtbWluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NzY2OTUxNzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Programming',
    level: 'Beginner',
    duration: '52 hours',
    lessons: 210,
    students: '28,600+',
    rating: 4.9,
    reviews: 5120,
    price: 69,
    originalPrice: 189,
    badge: 'Most Popular',
    color: '#eab308',
    icon: '🐍',
    highlights: [
      'Python 3.12+ with latest features',
      'Data science with Pandas & NumPy',
      'Web development with Django',
      'Automation & scripting mastery',
      '15+ real-world projects',
      'Job-ready portfolio',
    ],
    requirements: [
      'No programming experience required',
      'A computer with internet access',
      'Enthusiasm to learn!',
    ],
    whatYouLearn: [
      'Master Python fundamentals and advanced features',
      'Build web applications with Django and Flask',
      'Analyze data with Pandas, NumPy, and Matplotlib',
      'Automate repetitive tasks and workflows',
      'Work with APIs, databases, and file systems',
      'Write clean, Pythonic, and testable code',
      'Understand decorators, generators, and async/await',
      'Deploy Python applications to production',
    ],
    modules: [
      { title: 'Python Basics', lessons: ['Installation & Setup', 'Variables & Data Types', 'Control Flow', 'Functions', 'Modules & Packages'], duration: '7h' },
      { title: 'Data Structures', lessons: ['Lists & Tuples', 'Dictionaries & Sets', 'Comprehensions', 'Itertools', 'Collections Module'], duration: '6h' },
      { title: 'OOP in Python', lessons: ['Classes', 'Inheritance & Mixins', 'Magic Methods', 'Decorators', 'Metaclasses'], duration: '8h' },
      { title: 'Data Science Track', lessons: ['NumPy Fundamentals', 'Pandas DataFrames', 'Data Visualization', 'Statistical Analysis', 'ML Intro'], duration: '10h' },
      { title: 'Web Development', lessons: ['Django Setup', 'Models & ORM', 'Views & Templates', 'REST APIs', 'Authentication'], duration: '10h' },
      { title: 'Automation & Projects', lessons: ['File Automation', 'Web Scraping', 'Email Bots', 'Task Scheduler', 'Capstone Project'], duration: '11h' },
    ],
    instructor: { name: 'Maria Santos', title: 'Python Lead at Netflix, Author', students: '82,000+', rating: 4.9 },
    tags: ['Python', 'Data Science', 'Django', 'Automation'],
  },
  {
    id: 'fullstack',
    title: 'Full Stack Development',
    subtitle: 'Build Modern Web Apps from Frontend to Backend',
    description:
      'Become a complete full-stack developer. Master React, Node.js, TypeScript, PostgreSQL, Docker, and deploy to the cloud. Build 5 production-grade applications with modern best practices.',
    image:
      'https://images.unsplash.com/photo-1669023414171-56f0740e34cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGZ1bGxzdGFjayUyMGNvZGluZ3xlbnwxfHx8fDE3NzY2OTUxODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Web Development',
    level: 'Intermediate',
    duration: '64 hours',
    lessons: 248,
    students: '18,200+',
    rating: 4.8,
    reviews: 3450,
    price: 89,
    originalPrice: 249,
    badge: 'Top Rated',
    color: '#10b981',
    icon: '🌐',
    highlights: [
      'React 19 + Next.js 15',
      'Node.js + Express + TypeScript',
      'PostgreSQL + Prisma ORM',
      'Docker & CI/CD pipelines',
      '5 production-grade projects',
      'Cloud deployment (AWS/Vercel)',
    ],
    requirements: [
      'Basic HTML, CSS, and JavaScript knowledge',
      'Understanding of programming fundamentals',
      'A computer with Node.js installed',
    ],
    whatYouLearn: [
      'Build responsive UIs with React and Tailwind CSS',
      'Create RESTful and GraphQL APIs with Node.js',
      'Design and manage databases with PostgreSQL',
      'Implement authentication and authorization',
      'Containerize apps with Docker and Docker Compose',
      'Set up CI/CD pipelines with GitHub Actions',
      'Deploy applications to AWS and Vercel',
      'Write comprehensive tests (unit, integration, e2e)',
    ],
    modules: [
      { title: 'Frontend Foundations', lessons: ['React Deep Dive', 'TypeScript Essentials', 'State Management', 'Tailwind CSS', 'Component Patterns'], duration: '12h' },
      { title: 'Backend Development', lessons: ['Node.js & Express', 'REST API Design', 'GraphQL', 'Middleware', 'Error Handling'], duration: '10h' },
      { title: 'Database & ORM', lessons: ['PostgreSQL', 'Prisma ORM', 'Migrations', 'Query Optimization', 'Redis Caching'], duration: '8h' },
      { title: 'Auth & Security', lessons: ['JWT & Sessions', 'OAuth 2.0', 'RBAC', 'Input Validation', 'Security Best Practices'], duration: '7h' },
      { title: 'DevOps & Deployment', lessons: ['Docker', 'CI/CD Pipelines', 'AWS Basics', 'Vercel Deploy', 'Monitoring'], duration: '9h' },
      { title: 'Capstone Projects', lessons: ['E-commerce Platform', 'Social Media App', 'SaaS Dashboard', 'Real-time Chat', 'Portfolio Site'], duration: '18h' },
    ],
    instructor: { name: 'James Park', title: 'Staff Engineer at Stripe', students: '56,000+', rating: 4.8 },
    tags: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
  },
  {
    id: 'selenium',
    title: 'Selenium Automation',
    subtitle: 'Master Test Automation & QA Engineering',
    description:
      'Become a sought-after QA automation engineer. Master Selenium WebDriver with Python and Java, build robust test frameworks with Page Object Model, integrate with CI/CD, and learn advanced techniques like parallel testing and visual regression.',
    image:
      'https://images.unsplash.com/photo-1675865254433-6ba341f0f00b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMHRlc3RpbmclMjBhdXRvbWF0aW9uJTIwUUF8ZW58MXx8fHwxNzc2Njk1MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'QA & Testing',
    level: 'Intermediate',
    duration: '36 hours',
    lessons: 142,
    students: '8,900+',
    rating: 4.7,
    reviews: 1680,
    price: 69,
    originalPrice: 179,
    badge: 'High Demand',
    color: '#8b5cf6',
    icon: '🧪',
    highlights: [
      'Selenium WebDriver (Python & Java)',
      'Page Object Model framework',
      'CI/CD integration with Jenkins',
      'Parallel & cross-browser testing',
      'API testing with REST Assured',
      'Industry-standard test reports',
    ],
    requirements: [
      'Basic Python or Java knowledge',
      'Understanding of HTML & CSS selectors',
      'Familiarity with web browsers',
    ],
    whatYouLearn: [
      'Write robust automated tests with Selenium WebDriver',
      'Design scalable test frameworks using Page Object Model',
      'Handle dynamic elements, waits, and complex scenarios',
      'Run tests in parallel across multiple browsers',
      'Integrate tests into CI/CD pipelines',
      'Generate professional test reports with Allure',
      'Perform API testing alongside UI tests',
      'Debug and maintain test suites effectively',
    ],
    modules: [
      { title: 'Selenium Fundamentals', lessons: ['Setup & Configuration', 'Locators & Selectors', 'Actions & Interactions', 'Waits & Synchronization', 'Screenshots & Logging'], duration: '6h' },
      { title: 'Framework Design', lessons: ['Page Object Model', 'Test Data Management', 'Configuration Management', 'Custom Utilities', 'Logging Framework'], duration: '7h' },
      { title: 'Advanced Techniques', lessons: ['Dynamic Elements', 'iFrames & Windows', 'File Upload/Download', 'JavaScript Executor', 'Shadow DOM'], duration: '6h' },
      { title: 'CI/CD Integration', lessons: ['Jenkins Setup', 'Pipeline Config', 'Docker Selenium Grid', 'Parallel Execution', 'Scheduled Runs'], duration: '6h' },
      { title: 'API + UI Testing', lessons: ['REST Assured Basics', 'API Test Framework', 'Hybrid Testing', 'Data-Driven Tests', 'BDD with Cucumber'], duration: '6h' },
      { title: 'Capstone Project', lessons: ['E-commerce Test Suite', 'Cross-browser Matrix', 'Allure Reports', 'Performance Baselines', 'Final Framework'], duration: '5h' },
    ],
    instructor: { name: 'Priya Sharma', title: 'QA Lead at Microsoft, ISTQB Certified', students: '32,000+', rating: 4.8 },
    tags: ['Selenium', 'QA', 'Test Automation', 'CI/CD'],
  },
  {
    id: 'blender',
    title: 'Blender 3D Complete',
    subtitle: 'Create Stunning 3D Art, Animation & VFX',
    description:
      'Unlock your creative potential with Blender. Learn 3D modeling, texturing, lighting, animation, and visual effects. From stylized characters to photorealistic environments — build a professional 3D portfolio.',
    image:
      'https://images.unsplash.com/photo-1760008486534-a5c359d0dd09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzZCUyMG1vZGVsaW5nJTIwZGlnaXRhbCUyMGFydCUyMGNyZWF0aW9ufGVufDF8fHx8MTc3NjY5NTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: '3D & Design',
    level: 'Beginner',
    duration: '56 hours',
    lessons: 198,
    students: '15,300+',
    rating: 4.9,
    reviews: 2890,
    price: 74,
    originalPrice: 219,
    badge: 'Editor\'s Pick',
    color: '#f97316',
    icon: '🎨',
    highlights: [
      'Blender 4.x (latest version)',
      '3D modeling & sculpting',
      'PBR texturing & materials',
      'Character animation & rigging',
      'VFX & motion graphics',
      'Professional portfolio pieces',
    ],
    requirements: [
      'No prior 3D experience needed',
      'A computer with a dedicated GPU recommended',
      'Creative mindset and patience',
    ],
    whatYouLearn: [
      'Navigate Blender\'s interface like a pro',
      'Model anything from hard-surface to organic shapes',
      'Create photorealistic materials and textures',
      'Rig and animate 3D characters',
      'Light scenes for mood and realism',
      'Render with Cycles and EEVEE engines',
      'Create visual effects and motion graphics',
      'Build a professional 3D portfolio',
    ],
    modules: [
      { title: 'Blender Essentials', lessons: ['Interface Navigation', 'Modeling Basics', 'Edit Mode Tools', 'Modifiers', 'Shortcuts Mastery'], duration: '8h' },
      { title: 'Modeling Mastery', lessons: ['Hard-Surface Modeling', 'Organic Sculpting', 'Retopology', 'Boolean Workflows', 'Procedural Modeling'], duration: '10h' },
      { title: 'Materials & Texturing', lessons: ['Shader Editor', 'PBR Materials', 'UV Unwrapping', 'Texture Painting', 'Procedural Textures'], duration: '9h' },
      { title: 'Lighting & Rendering', lessons: ['Lighting Principles', 'HDRI Environments', 'Cycles Rendering', 'EEVEE Real-time', 'Compositing'], duration: '8h' },
      { title: 'Animation & Rigging', lessons: ['Keyframe Animation', 'Armature Rigging', 'Walk Cycles', 'Facial Animation', 'Physics Simulations'], duration: '10h' },
      { title: 'Portfolio Projects', lessons: ['Stylized Character', 'Photorealistic Room', 'Product Visualization', 'Motion Graphics Reel', 'Final Showreel'], duration: '11h' },
    ],
    instructor: { name: 'Lucas Fernandez', title: 'Senior 3D Artist, Ex-Pixar', students: '41,000+', rating: 4.9 },
    tags: ['Blender', '3D Modeling', 'Animation', 'VFX'],
  },
  {
    id: 'n8n',
    title: 'n8n Workflow Automation',
    subtitle: 'Automate Everything — No Code Required',
    description:
      'Master n8n, the powerful open-source workflow automation tool. Connect 400+ apps, build complex automations, handle data transformations, and create AI-powered workflows. From simple tasks to enterprise-grade pipelines.',
    image:
      'https://images.unsplash.com/photo-1759752393975-7ca7b302fcc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JrZmxvdyUyMGF1dG9tYXRpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3NjY5NTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Automation',
    level: 'Beginner',
    duration: '28 hours',
    lessons: 112,
    students: '6,800+',
    rating: 4.8,
    reviews: 980,
    price: 59,
    originalPrice: 159,
    badge: 'Trending',
    color: '#ec4899',
    icon: '🔗',
    highlights: [
      'n8n cloud & self-hosted setup',
      '400+ app integrations',
      'AI-powered workflows with LLMs',
      'Data transformation & ETL',
      'Error handling & monitoring',
      'Enterprise automation patterns',
    ],
    requirements: [
      'No coding experience needed',
      'Basic understanding of APIs is helpful',
      'A free n8n cloud account',
    ],
    whatYouLearn: [
      'Build complex multi-step automations visually',
      'Connect and orchestrate 400+ applications',
      'Transform and manipulate data between services',
      'Create AI-powered workflows with OpenAI & LLMs',
      'Handle errors gracefully and monitor workflows',
      'Self-host n8n for full control and privacy',
      'Build webhook-triggered automations',
      'Design enterprise-grade automation architectures',
    ],
    modules: [
      { title: 'n8n Fundamentals', lessons: ['Platform Overview', 'First Workflow', 'Triggers & Nodes', 'Credentials Setup', 'Workflow Management'], duration: '4h' },
      { title: 'Core Integrations', lessons: ['Google Workspace', 'Slack & Discord', 'CRM Systems', 'Email Automation', 'Database Nodes'], duration: '5h' },
      { title: 'Data Transformation', lessons: ['JSON Manipulation', 'Code Nodes', 'Expressions', 'Merge & Split', 'Data Mapping'], duration: '5h' },
      { title: 'AI Workflows', lessons: ['OpenAI Integration', 'LangChain Nodes', 'Vector Databases', 'AI Agents', 'RAG Pipelines'], duration: '5h' },
      { title: 'Advanced Patterns', lessons: ['Error Handling', 'Sub-workflows', 'Webhooks', 'Scheduling', 'Rate Limiting'], duration: '4h' },
      { title: 'Real-World Projects', lessons: ['Lead Enrichment Pipeline', 'Content Repurposing Bot', 'Customer Support Agent', 'Data Sync System', 'Final Automation Suite'], duration: '5h' },
    ],
    instructor: { name: 'Sophie Weber', title: 'Automation Architect, n8n Community Lead', students: '19,000+', rating: 4.8 },
    tags: ['n8n', 'Automation', 'No-Code', 'AI Workflows'],
  },
];
