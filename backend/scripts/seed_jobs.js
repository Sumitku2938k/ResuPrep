const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

const sampleJobs = [
  {
    title: 'Senior Frontend Developer',
    slug: 'senior-frontend-developer-techflow',
    company: 'TechFlow Inc.',
    companyLogo: '🚀',
    shortDescription: 'Lead the architecture and delivery of modern client-side React applications.',
    description:
      'TechFlow is looking for a Senior Frontend Developer to architect high-performance web applications using React, TypeScript, and modern state management. You will collaborate with product designers, mentor mid-level engineers, and drive frontend performance optimizations across our core SaaS platforms.',
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS'],
    preferredSkills: ['Next.js', 'Redux', 'Jest', 'GraphQL', 'Webpack'],
    experience: { min: 5, max: 8, level: 'senior' },
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 140000, max: 185000, currency: 'USD', display: '$140k - $185k' },
    category: 'tech',
    responsibilities: [
      'Design, build, and maintain efficient, reusable, and reliable React/TypeScript code.',
      'Optimize web applications for maximum speed, scalability, and cross-browser responsiveness.',
      'Participate in code reviews, design critiques, and frontend engineering standards definition.',
      'Collaborate closely with UI/UX designers, backend engineers, and product managers.',
    ],
    qualifications: [
      '5+ years of production experience in modern frontend development with React.',
      'Deep mastery of TypeScript, JavaScript (ES6+), and CSS architecture.',
      'Proven experience writing unit and integration tests using Jest and React Testing Library.',
      'Familiarity with CI/CD deployment pipelines and cloud infrastructure.',
    ],
    applicationUrl: 'https://techflow.example.com/careers/senior-frontend',
    isActive: true,
  },
  {
    title: 'Full Stack Engineer',
    slug: 'full-stack-engineer-datavault',
    company: 'DataVault Corp',
    companyLogo: '🏢',
    shortDescription: 'Build enterprise-grade distributed systems and real-time data dashboards.',
    description:
      'DataVault Corp is seeking a versatile Full Stack Engineer to build secure, scalable web applications and REST APIs. You will work across the entire stack, from React/TypeScript user interfaces to Node.js/PostgreSQL microservices and containerized Docker deployments.',
    requiredSkills: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'Docker'],
    preferredSkills: ['Redis', 'AWS', 'GraphQL', 'Express', 'Prisma'],
    experience: { min: 3, max: 6, level: 'mid' },
    location: 'New York, NY',
    jobType: 'Full-time',
    workMode: 'On-site',
    salary: { min: 125000, max: 160000, currency: 'USD', display: '$125k - $160k' },
    category: 'tech',
    responsibilities: [
      'Develop end-to-end features connecting React client interfaces with Node.js microservices.',
      'Architect relational database schemas, migrations, and optimized queries in PostgreSQL.',
      'Deploy and monitor containerized services using Docker and Kubernetes.',
      'Implement robust authentication, role-based authorization, and data encryption practices.',
    ],
    qualifications: [
      '3+ years of full-stack engineering experience building web applications at scale.',
      'Proficiency in Node.js, Express, React, and relational database systems.',
      'Experience containerizing applications with Docker and configuring cloud services.',
      'Strong problem-solving mindset and adherence to clean code principles.',
    ],
    applicationUrl: 'https://datavault.example.com/jobs/full-stack-engineer',
    isActive: true,
  },
  {
    title: 'Backend Node.js Developer',
    slug: 'backend-nodejs-developer-cloudscale',
    company: 'CloudScale Systems',
    companyLogo: '⚡',
    shortDescription: 'Architect resilient event-driven microservices and RESTful API gateways.',
    description:
      'CloudScale Systems is hiring a Backend Node.js Developer to build event-driven microservices, high-throughput message pipelines, and distributed data APIs. You will focus on performance tuning, caching strategies, and reliable distributed transactions.',
    requiredSkills: ['Node.js', 'JavaScript', 'Express', 'MongoDB', 'REST APIs'],
    preferredSkills: ['Kafka', 'Redis', 'TypeScript', 'Docker', 'Microservices'],
    experience: { min: 3, max: 5, level: 'mid' },
    location: 'Austin, TX',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: { min: 115000, max: 145000, currency: 'USD', display: '$115k - $145k' },
    category: 'tech',
    responsibilities: [
      'Design and implement high-performance RESTful APIs and asynchronous background jobs.',
      'Manage NoSQL database design, indexing strategies, and aggregation queries in MongoDB.',
      'Integrate message queuing systems (Kafka/RabbitMQ) and distributed caching with Redis.',
      'Monitor API latency, throughput, and error rates using APM tools.',
    ],
    qualifications: [
      '3+ years of focused backend development experience with Node.js.',
      'Strong knowledge of asynchronous programming, event loops, and stream processing.',
      'Demonstrated experience with MongoDB, Express, and REST architectural constraints.',
      'Understanding of microservices design patterns and API gateway security.',
    ],
    applicationUrl: 'https://cloudscale.example.com/careers/backend-node',
    isActive: true,
  },
  {
    title: 'Python Backend Developer',
    slug: 'python-backend-developer-fintech-nexus',
    company: 'FinTech Nexus',
    companyLogo: '💳',
    shortDescription: 'Build high-security financial transaction pipelines and ledger integrations.',
    description:
      'FinTech Nexus is seeking a Python Backend Developer to engineer high-throughput financial calculation engines and compliance automation pipelines. You will write clean, well-tested Python/FastAPI services operating under strict security and regulatory requirements.',
    requiredSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'REST APIs'],
    preferredSkills: ['Django', 'Celery', 'Redis', 'AWS', 'Security'],
    experience: { min: 3, max: 6, level: 'mid' },
    location: 'Chicago, IL',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 130000, max: 165000, currency: 'USD', display: '$130k - $165k' },
    category: 'tech',
    responsibilities: [
      'Develop core banking interfaces, ledger calculation services, and payment integrations.',
      'Write highly maintainable, type-annotated Python code using FastAPI and SQLAlchemy.',
      'Maintain rigorous automated test coverage and adhere to financial security standards.',
      'Collaborate with quantitative analysts and security engineers.',
    ],
    qualifications: [
      '3+ years of professional backend development with Python.',
      'Solid foundation in relational databases, transaction isolation levels, and ACID compliance.',
      'Experience with asynchronous processing in Python (FastAPI, asyncio, Celery).',
      'Knowledge of OWASP security practices and financial compliance standards.',
    ],
    applicationUrl: 'https://fintechnexus.example.com/apply/python-dev',
    isActive: true,
  },
  {
    title: 'React Native Mobile Engineer',
    slug: 'react-native-mobile-engineer-appsphere',
    company: 'AppSphere Innovations',
    companyLogo: '📱',
    shortDescription: 'Build fluid cross-platform iOS and Android mobile experiences.',
    description:
      'AppSphere Innovations is looking for a skilled React Native Mobile Engineer to build engaging, smooth mobile applications for consumer platforms. You will bridge native modules, optimize animations, and publish updates to the Apple App Store and Google Play Store.',
    requiredSkills: ['React Native', 'React', 'JavaScript', 'TypeScript', 'Mobile Design'],
    preferredSkills: ['Redux', 'iOS', 'Android', 'GraphQL', 'Firebase'],
    experience: { min: 2, max: 5, level: 'mid' },
    location: 'Remote',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: { min: 110000, max: 140000, currency: 'USD', display: '$110k - $140k' },
    category: 'tech',
    responsibilities: [
      'Develop, test, and maintain cross-platform mobile apps using React Native.',
      'Bridge native iOS (Swift/Obj-C) and Android (Kotlin/Java) libraries when necessary.',
      'Ensure 60fps UI animations, responsive layouts, and efficient offline data sync.',
      'Coordinate release management through TestFlight and Google Play Console.',
    ],
    qualifications: [
      '2+ years of hands-on mobile development experience using React Native.',
      'Strong grasp of JavaScript, TypeScript, and modern React hooks patterns.',
      'Published at least one production app in the App Store or Google Play Store.',
      'Experience with mobile CI/CD pipelines (Fastlane, Expo, or GitHub Actions).',
    ],
    applicationUrl: 'https://appsphere.example.com/jobs/react-native',
    isActive: true,
  },
  {
    title: 'QA Automation Engineer',
    slug: 'qa-automation-engineer-qualitypulse',
    company: 'QualityPulse Systems',
    companyLogo: '🧪',
    shortDescription: 'Design automated end-to-end test suites and regression frameworks.',
    description:
      'QualityPulse Systems is seeking a QA Automation Engineer to champion quality across our product suite. You will build automated testing frameworks using Playwright, Cypress, and Jest, integrating tests into CI/CD pipelines to catch bugs before production.',
    requiredSkills: ['JavaScript', 'TypeScript', 'Playwright', 'Cypress', 'Testing (Jest)'],
    preferredSkills: ['CI/CD', 'Docker', 'API Testing', 'Postman', 'Selenium'],
    experience: { min: 2, max: 4, level: 'mid' },
    location: 'Denver, CO',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 95000, max: 125000, currency: 'USD', display: '$95k - $125k' },
    category: 'tech',
    responsibilities: [
      'Build and maintain scalable end-to-end and integration test automation frameworks.',
      'Automate smoke, sanity, and regression test suites across modern web browsers.',
      'Integrate automated tests into continuous integration pipelines (GitHub Actions).',
      'Collaborate with developers to improve testability and root-cause production defects.',
    ],
    qualifications: [
      '2+ years of software quality assurance and test automation experience.',
      'Demonstrated expertise in Playwright, Cypress, or Selenium with TypeScript/JavaScript.',
      'Experience with REST API testing, mock servers, and automated performance checks.',
      'Clear technical documentation and bug reporting practices.',
    ],
    applicationUrl: 'https://qualitypulse.example.com/careers/qa-auto',
    isActive: true,
  },
  {
    title: 'Senior Data Analyst',
    slug: 'senior-data-analyst-metricwave',
    company: 'MetricWave Analytics',
    companyLogo: '📊',
    shortDescription: 'Translate complex datasets into actionable executive insights and dashboards.',
    description:
      'MetricWave Analytics is seeking a Senior Data Analyst to empower product and marketing leadership with deep analytical insights. You will write advanced SQL queries, build interactive dashboards, and design statistical experiments that steer strategic roadmaps.',
    requiredSkills: ['SQL', 'Python', 'Data Visualization', 'Tableau', 'Statistics'],
    preferredSkills: ['dbt', 'Snowflake', 'BigQuery', 'Power BI', 'A/B Testing'],
    experience: { min: 4, max: 7, level: 'senior' },
    location: 'Boston, MA',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 120000, max: 155000, currency: 'USD', display: '$120k - $155k' },
    category: 'data',
    responsibilities: [
      'Design, build, and maintain executive Tableau dashboards and data models.',
      'Perform complex SQL queries across multi-terabyte data warehouses.',
      'Formulate hypotheses, design A/B test methodologies, and interpret conversion lifts.',
      'Partner with cross-functional team leads to establish core KPI measurement frameworks.',
    ],
    qualifications: [
      '4+ years of experience in data analysis, business intelligence, or quantitative analytics.',
      'Advanced expertise in SQL (window functions, query plan optimization, CTEs).',
      'Proficiency with Python data libraries (pandas, numpy) and BI tools (Tableau, Looker).',
      'Strong statistical foundation and executive presentation capabilities.',
    ],
    applicationUrl: 'https://metricwave.example.com/jobs/senior-data-analyst',
    isActive: true,
  },
  {
    title: 'Machine Learning Engineer',
    slug: 'machine-learning-engineer-neuralcore',
    company: 'NeuralCore AI',
    companyLogo: '🤖',
    shortDescription: 'Deploy production deep learning models and scalable inference engines.',
    description:
      'NeuralCore AI is hiring a Machine Learning Engineer to take computer vision and NLP models from research prototypes to low-latency production inference services. You will optimize training pipelines, manage model versioning, and deploy services on cloud GPU clusters.',
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow/PyTorch', 'Statistics', 'Docker'],
    preferredSkills: ['MLflow', 'Kubernetes', 'CUDA', 'NLP', 'FastAPI'],
    experience: { min: 3, max: 6, level: 'senior' },
    location: 'Seattle, WA',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 155000, max: 210000, currency: 'USD', display: '$155k - $210k' },
    category: 'data',
    responsibilities: [
      'Train, fine-tune, and evaluate deep learning models using PyTorch or TensorFlow.',
      'Optimize model latency and throughput through quantization and TensorRT.',
      'Build containerized inference microservices with FastAPI and Kubernetes.',
      'Maintain automated data validation and model drift monitoring pipelines.',
    ],
    qualifications: [
      '3+ years of experience training and deploying machine learning models in production.',
      'Deep proficiency in Python, PyTorch/TensorFlow, and statistical modeling.',
      'Familiarity with MLOps best practices (MLflow, Kubeflow, Weights & Biases).',
      'Strong software engineering fundamentals and containerization experience.',
    ],
    applicationUrl: 'https://neuralcore.example.com/apply/ml-engineer',
    isActive: true,
  },
  {
    title: 'Data Platform Engineer',
    slug: 'data-platform-engineer-lakehouse',
    company: 'Lakehouse Dynamics',
    companyLogo: '🌊',
    shortDescription: 'Build scalable streaming ETL pipelines and lakehouse architectures.',
    description:
      'Lakehouse Dynamics is looking for a Data Platform Engineer to design robust data pipelines, streaming architectures, and data cataloging systems. You will work with Apache Spark, Kafka, and cloud data warehouses to empower analytics teams with clean data.',
    requiredSkills: ['Python', 'SQL', 'Big Data (Spark)', 'Docker', 'AWS/Cloud'],
    preferredSkills: ['Kafka', 'Airflow', 'Snowflake', 'Scala', 'Kubernetes'],
    experience: { min: 3, max: 6, level: 'mid' },
    location: 'Remote',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: { min: 135000, max: 175000, currency: 'USD', display: '$135k - $175k' },
    category: 'data',
    responsibilities: [
      'Design, implement, and maintain reliable batch and streaming data pipelines with Spark.',
      'Orchestrate complex DAG workflows using Apache Airflow.',
      'Implement data quality validation, lineage tracking, and schema evolution rules.',
      'Optimize database queries, partitioning schemes, and storage formats (Parquet, Iceberg).',
    ],
    qualifications: [
      '3+ years of experience building production data pipelines and platform infrastructure.',
      'Strong programming skills in Python or Scala with deep Apache Spark expertise.',
      'Experience with distributed message queues (Kafka) and cloud platforms (AWS/GCP).',
      'Solid grasp of data modeling concepts for analytical data lakes.',
    ],
    applicationUrl: 'https://lakehouse.example.com/careers/data-platform',
    isActive: true,
  },
  {
    title: 'Senior DevOps Engineer',
    slug: 'senior-devops-engineer-platformops',
    company: 'PlatformOps Global',
    companyLogo: '⚙️',
    shortDescription: 'Drive cloud reliability, infrastructure as code, and CI/CD pipelines.',
    description:
      'PlatformOps Global is seeking a Senior DevOps Engineer to lead cloud infrastructure automation, Kubernetes cluster management, and CI/CD pipeline reliability. You will champion infrastructure-as-code with Terraform and maintain high availability across AWS and GCP environments.',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS/Azure/GCP', 'Terraform', 'CI/CD Pipelines'],
    preferredSkills: ['Linux', 'Monitoring (Grafana)', 'Scripting (Bash/Python)', 'Helm', 'ArgoCD'],
    experience: { min: 5, max: 8, level: 'senior' },
    location: 'Remote',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: { min: 150000, max: 195000, currency: 'USD', display: '$150k - $195k' },
    category: 'devops',
    responsibilities: [
      'Architect and provision scalable cloud infrastructure using Terraform and Ansible.',
      'Administer multi-region production Kubernetes clusters and service mesh topologies.',
      'Design automated GitOps CI/CD deployment pipelines using ArgoCD and GitHub Actions.',
      'Implement proactive observability, alerting, and automated incident response runbooks.',
    ],
    qualifications: [
      '5+ years of dedicated DevOps or Site Reliability Engineering experience.',
      'Production mastery of Kubernetes, Docker containerization, and Terraform.',
      'Deep knowledge of AWS or GCP networking, IAM security policies, and cost management.',
      'Proficiency in Linux system internals and scripting (Python or Bash).',
    ],
    applicationUrl: 'https://platformops.example.com/careers/senior-devops',
    isActive: true,
  },
  {
    title: 'Cloud Infrastructure & SRE',
    slug: 'cloud-infrastructure-sre-skyline',
    company: 'Skyline Cloud Systems',
    companyLogo: '☁️',
    shortDescription: 'Guarantee service uptime, automated failover, and high scalability.',
    description:
      'Skyline Cloud Systems is seeking a Site Reliability Engineer to safeguard 99.99% service availability for our cloud platforms. You will troubleshoot distributed system failures, optimize capacity planning, and lead post-mortem blameless reviews.',
    requiredSkills: ['Linux', 'Docker', 'AWS/Azure/GCP', 'Monitoring (Grafana)', 'CI/CD Pipelines'],
    preferredSkills: ['Terraform', 'Kubernetes', 'Prometheus', 'Python', 'Networking'],
    experience: { min: 3, max: 6, level: 'mid' },
    location: 'Raleigh, NC',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 120000, max: 155000, currency: 'USD', display: '$120k - $155k' },
    category: 'devops',
    responsibilities: [
      'Maintain production service uptime, SLOs, and error budgets across cloud services.',
      'Build real-time observability dashboards and alerts with Prometheus and Grafana.',
      'Automate routine operations, patching, and disaster recovery failover workflows.',
      'Participate in on-call rotations with automated escalation policies.',
    ],
    qualifications: [
      '3+ years of SRE or cloud infrastructure experience in high-uptime environments.',
      'Hands-on experience with Linux administration, shell scripting, and container platforms.',
      'Familiarity with Prometheus/Grafana metrics collection and distributed tracing.',
      'Strong debugging mindset and systematic root cause analysis skills.',
    ],
    applicationUrl: 'https://skylinecloud.example.com/jobs/sre',
    isActive: true,
  },
  {
    title: 'Product UI/UX Designer',
    slug: 'product-ui-ux-designer-designcraft',
    company: 'DesignCraft Studios',
    companyLogo: '🎨',
    shortDescription: 'Create delightful user journeys, design systems, and wireframes.',
    description:
      'DesignCraft Studios is looking for a Product UI/UX Designer to craft intuitive user experiences for our web and mobile applications. You will conduct user research, build Figma prototypes, and evolve our multi-brand design system in tight collaboration with developers.',
    requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Wireframing'],
    preferredSkills: ['Prototyping', 'Responsive Design', 'HTML/CSS', 'Usability Testing'],
    experience: { min: 3, max: 5, level: 'mid' },
    location: 'Los Angeles, CA',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 105000, max: 135000, currency: 'USD', display: '$105k - $135k' },
    category: 'design',
    responsibilities: [
      'Lead end-to-end user experience design from discovery and user flows to high-fidelity UI.',
      'Maintain and expand comprehensive design systems, component tokens, and style guides in Figma.',
      'Conduct usability tests, interviews, and synthesize feedback into iterative product updates.',
      'Collaborate closely with frontend engineers to ensure design fidelity during implementation.',
    ],
    qualifications: [
      '3+ years of digital product design experience across web and mobile platforms.',
      'Exceptional portfolio showcasing user-centered design processes and visual aesthetics.',
      'Mastery of Figma, component variants, auto-layout, and interactive prototyping.',
      'Strong communication skills and ability to articulate design rationale clearly.',
    ],
    applicationUrl: 'https://designcraft.example.com/jobs/ui-ux-designer',
    isActive: true,
  },
  {
    title: 'Lead Product Designer',
    slug: 'lead-product-designer-userfirst',
    company: 'UserFirst Interactive',
    companyLogo: '✨',
    shortDescription: 'Direct strategic product design initiatives and mentor design talent.',
    description:
      'UserFirst Interactive is seeking a Lead Product Designer to guide the vision and visual elegance of our flagship enterprise tools. You will lead cross-functional workshops, advocate for user accessibility, and partner with executives to deliver world-class digital experiences.',
    requiredSkills: ['UI/UX Design', 'Design Systems', 'User Research', 'Figma', 'Accessibility'],
    preferredSkills: ['Leadership', 'Information Architecture', 'Design Strategy', 'HTML/CSS'],
    experience: { min: 6, max: 10, level: 'lead' },
    location: 'Remote',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: { min: 160000, max: 205000, currency: 'USD', display: '$160k - $205k' },
    category: 'design',
    responsibilities: [
      'Define the overarching product design strategy, UX standards, and design system governance.',
      'Mentor and coach product designers, conducting regular design reviews and crits.',
      'Facilitate design sprints, user mapping sessions, and customer validation interviews.',
      'Champion web accessibility (WCAG 2.1 AA) and inclusive design practices.',
    ],
    qualifications: [
      '6+ years of UX/product design experience with leadership or principal responsibilities.',
      'Demonstrated track record of shipping complex enterprise SaaS products.',
      'Extensive experience managing scaled design systems in Figma.',
      'Strategic thinking with strong executive presence and storytelling abilities.',
    ],
    applicationUrl: 'https://userfirst.example.com/careers/lead-designer',
    isActive: true,
  },
  {
    title: 'Technical Product Manager',
    slug: 'technical-product-manager-roadmap-iq',
    company: 'RoadmapIQ Software',
    companyLogo: '🎯',
    shortDescription: 'Define product vision, technical roadmaps, and sprint backlogs.',
    description:
      'RoadmapIQ Software is seeking a Technical Product Manager to lead the evolution of our developer platform APIs and analytics suite. You will bridge engineering and commercial teams, author clear PRDs, and prioritize sprint backlogs using data-driven insights.',
    requiredSkills: ['Product Management', 'Agile/Scrum', 'Data Analytics', 'Roadmap Planning', 'REST APIs'],
    preferredSkills: ['SQL', 'User Research', 'A/B Testing', 'Stakeholder Management', 'Jira'],
    experience: { min: 4, max: 7, level: 'senior' },
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 145000, max: 185000, currency: 'USD', display: '$145k - $185k' },
    category: 'product',
    responsibilities: [
      'Define product strategy, technical requirements, and feature milestones for engineering teams.',
      'Maintain prioritized backlogs and run agile ceremonies (sprint planning, backlog grooming).',
      'Analyze customer telemetry, usage funnels, and retention metrics to drive roadmap decisions.',
      'Coordinate feature launches with developer advocacy, marketing, and sales leadership.',
    ],
    qualifications: [
      '4+ years of product management experience focused on technical or developer-centric software.',
      'Solid technical foundation with an understanding of REST APIs, databases, and cloud software.',
      'Proficiency in quantitative product analytics (Mixpanel, Amplitude, SQL).',
      'Excellent written and verbal communication skills across technical and executive audiences.',
    ],
    applicationUrl: 'https://roadmapiq.example.com/careers/tpm',
    isActive: true,
  },
  {
    title: 'Enterprise Solutions Architect',
    slug: 'enterprise-solutions-architect-vanguard',
    company: 'Vanguard Business Solutions',
    companyLogo: '🌐',
    shortDescription: 'Design strategic enterprise technology transformations and system architecture.',
    description:
      'Vanguard Business Solutions is seeking an Enterprise Solutions Architect to lead enterprise client digital transformations. You will evaluate legacy systems, architect modern cloud-native solutions, and align executive business goals with engineering roadmaps.',
    requiredSkills: ['System Design', 'Cloud Architecture', 'REST APIs', 'Security', 'Enterprise Software'],
    preferredSkills: ['Microservices', 'AWS', 'Integration', 'Stakeholder Management', 'SQL'],
    experience: { min: 7, max: 12, level: 'lead' },
    location: 'New York, NY',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: { min: 175000, max: 230000, currency: 'USD', display: '$175k - $230k' },
    category: 'business',
    responsibilities: [
      'Architect robust, scalable technical solutions for Fortune 500 enterprise customers.',
      'Lead architecture design sessions and produce comprehensive technical blueprints.',
      'Assess security, compliance, data sovereignty, and performance constraints.',
      'Collaborate with C-suite executives and client engineering directors.',
    ],
    qualifications: [
      '7+ years of experience in enterprise systems architecture, consulting, or technical leadership.',
      'Broad technical mastery spanning distributed systems, cloud platforms, and security.',
      'Proven track record delivering multi-tier enterprise integrations.',
      'Outstanding business acumen, client relationship management, and consultative skills.',
    ],
    applicationUrl: 'https://vanguardbiz.example.com/careers/solutions-architect',
    isActive: true,
  },
];

async function seedJobs() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ResuPrep';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log(`Connected to MongoDB for Job Seeding (${mongoose.connection.host})`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const job of sampleJobs) {
      const existing = await Job.findOne({ slug: job.slug });
      await Job.findOneAndUpdate(
        { slug: job.slug },
        { $set: job },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      if (existing) {
        updatedCount++;
      } else {
        insertedCount++;
      }
    }

    console.log('✅ Job seed completed successfully');
    console.log(`   Total catalogue items: ${sampleJobs.length}`);
    console.log(`   New jobs inserted: ${insertedCount}`);
    console.log(`   Existing jobs updated: ${updatedCount}`);

    return { total: sampleJobs.length, inserted: insertedCount, updated: updatedCount };
  } catch (error) {
    console.error('❌ Job seed error:', error.message);
    throw error;
  }
}

// When invoked directly from the CLI
if (require.main === module) {
  seedJobs()
    .then(async () => {
      await mongoose.disconnect();
      console.log('MongoDB connection closed.');
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Fatal seed failure:', err);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(1);
    });
}

module.exports = { seedJobs, sampleJobs };

