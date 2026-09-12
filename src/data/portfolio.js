import portfolioPdf from '@/assets/Lopez_Jhon_Lay_CV_2026.pdf';

export const profile = {
  name: 'Jhon Lay Lopez',
  brand: 'JL',
  role: 'Application Developer to Software Engineer',
  heroRole: 'Application Developer',
  location: 'Pasay, Philippines',
  email: 'jhonlaylopez.2003@gmail.com',
  portfolioUrl: portfolioPdf,
  heroTitle: 'Web & Mobile',
  heroTag:
    'I build practical web and mobile applications with clean interfaces, dependable workflows, and a growing focus on AI and DevOps.',
  availability: 'Open to work, collaborations, and software engineering opportunities.',
};

export const navItems = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Contact', href: '/#contact' },
];

export const about = {
  eyebrow: '01 - Subject Profile',
  title: 'The Case File',
  lead: 'A cleaner record of who I am, what I build, and where I am aiming next.',
  paragraphs: [
    'I’m an Application Developer with hands-on experience building and maintaining full-stack web applications using technologies such as Next.js, React, NestJS, TypeScript, Python, and PostgreSQL.',
    'In my current role at DFNN Inc., I work across frontend and backend development, build internal systems and dashboards, integrate third-party services such as the Google Maps API, and automate stakeholder reporting using Python and Google Cloud Platform services like BigQuery and Cloud Run Functions.',
    'I enjoy building practical software that solves real business problems and continuously improving how I work through modern development practices, cloud technologies, DevOps, and AI-assisted development.',
    'My goal is to continue growing as a full-stack software engineer, taking on more complex systems and building reliable, scalable applications that create real value for users and businesses.',
  ],
  facts: [
    { label: 'Education', value: 'BS Information Technology' },
    { label: 'Current Company', value: 'DFNN Inc.' },
    { label: 'Focus', value: 'Web, Mobile, AI, DevOps' },
    { label: 'Status', value: 'Open to Work' },
  ],
};

export const personalProjects = [
  {
    number: 'File 01',
    name: 'Ya Gameela',
    category: 'Personal Project',
    description:
      'A product catalog and custom content management system for a lifestyle brand, built around storefront and publishing workflows.',
    tech: ['Next.js', 'TypeScript', 'Prisma', 'Neon', 'Cloudinary'],
    repo: 'https://github.com/Lopez-JhonLay/ya-gameela',
    liveUrl: 'https://ya-gameela-web.vercel.app/',
  },
  {
    number: 'File 02',
    name: 'DevFlow',
    category: 'Personal Project',
    description:
      'A full-stack developer workspace for organizing projects, Markdown documentation, assets, and reusable code snippets.',
    tech: ['React', 'NestJS', 'PostgreSQL'],
    repo: 'https://github.com/Lopez-JhonLay/devflow',
    liveUrl: 'https://devflow-five-iota.vercel.app/login',
  },
  {
    number: 'File 03',
    name: 'Rental Bill Management System',
    category: 'Personal Project',
    description:
      'A rental management app for tracking units, tenants, utility readings, and monthly bills with saved rate details.',
    tech: ['React', 'NestJS', 'Prisma'],
    repo: 'https://github.com/Lopez-JhonLay/rental-bill-management-system',
    liveUrl: 'https://rental-bill-management-system.vercel.app/',
  },
  {
    number: 'File 04',
    name: 'Classroom Randomizer',
    category: 'Personal Project',
    description:
      'A classroom tool for managing student lists and selecting students fairly with an animated result.',
    tech: ['Next.js', 'Prisma', 'PostgreSQL'],
    repo: 'https://github.com/Lopez-JhonLay/classroom-randomizer',
    liveUrl: 'https://classroom-randomizer.vercel.app/',
  },
];

export const capstoneProjects = [
  {
    number: 'File 06',
    name: 'Barangay Information System',
    category: 'Capstone Project',
    description:
      'A team-built information system for Brgy. Central Bicutan, Taguig, focused on practical local-service workflows.',
    role: 'Capstone contributor',
    tech: ['React', 'Full-stack', 'Records'],
    repo: 'https://github.com/PUPT-2025-CAPRO-BIS',
  },
];

export const workProjects = [
  {
    number: 'File 05',
    name: 'LottoMatik Marketing Website',
    category: 'Work Project',
    description:
      'Developed and maintained responsive public pages and interactive features, including an Agent Locator with Google Maps, location search, filtering, and API-driven agent data.',
    role: 'Application Developer at DFNN Inc.',
    tech: ['Next.js', 'Material UI', 'Google Maps API'],
    liveUrl: 'https://lottomatik.com/',
  },
];

export const experience = [
  {
    role: 'Application Developer',
    organization: 'DFNN Inc.',
    location: 'BGC, Taguig City',
    date: 'September 2025 - Present',
    detail: 'Built full-stack LottoMatik features and automated agent sales and lottery reporting with BigQuery and Google Cloud Platform.',
  },
  {
    role: 'Frontend Developer Intern',
    organization: 'DigiPlus Interactive Corp.',
    location: 'BGC, Taguig City',
    date: 'March 2025 - June 2025',
    detail: 'Developed responsive Vue.js interfaces, reusable components, and API-integrated workflows with Element Plus and Pinia.',
  },
  {
    role: 'BS in Information Technology',
    organization: 'Polytechnic University of the Philippines',
    location: 'PUP-Taguig',
    date: '2021 - 2025',
    detail: 'Completed a Bachelor of Science in Information Technology.',
  },
];

export const skillGroups = [
  {
    category: 'Frontend',
    skills: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Vue.js', 'Material UI', 'Tailwind CSS'],
  },
  {
    category: 'Backend',
    skills: ['Node.js', 'NestJS', 'REST APIs', 'Cloudflare Workers'],
  },
  {
    category: 'Databases & Data',
    skills: ['PostgreSQL', 'Cloudflare D1', 'BigQuery'],
  },
  {
    category: 'Cloud & DevOps',
    skills: ['Google Cloud Platform', 'Cloudflare', 'GitHub Actions'],
  },
  {
    category: 'Testing & Tools',
    skills: ['Playwright', 'Git', 'GitHub', 'OAuth', 'JWT'],
  },
];

export const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/Lopez-JhonLay',
  },
  {
    label: 'LinkedIn',
    href: 'http://www.linkedin.com/in/jhon-lay-lopez',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/jhonlay.lopez.1',
  },
];
