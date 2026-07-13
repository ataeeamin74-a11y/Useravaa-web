import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const researchIndexPath = path.join(
  repoRoot,
  "src",
  "features",
  "career",
  "data",
  "career-research-index.json"
);
const catalogPath = path.join(
  repoRoot,
  "src",
  "features",
  "career",
  "data",
  "skill-catalog.json"
);
const requirementsPath = path.join(
  repoRoot,
  "src",
  "features",
  "career",
  "data",
  "career-skill-requirements.json"
);
const auditPath = path.join(
  repoRoot,
  "docs",
  "launch",
  "Useravaa_Career_Skill_Ontology_Audit_v1.md"
);

const TYPE_PREFIX = {
  soft: "soft",
  foundational: "foundational",
  specialized: "specialized",
  tool: "tool"
};

const SOFT = {
  "effective-communication": ["ارتباط مؤثر", "Effective Communication", ["ارتباطات مؤثر", "مهارت ارتباطی"], ["communication skills"]],
  "active-listening": ["گوش‌دادن فعال", "Active Listening", ["شنیدن فعال"], []],
  teamwork: ["کار تیمی", "Teamwork", ["همکاری تیمی"], ["collaboration"]],
  "feedback-reception": ["بازخوردپذیری", "Feedback Reception", ["پذیرش بازخورد"], ["receiving feedback"]],
  "time-management": ["مدیریت زمان", "Time Management", [], []],
  negotiation: ["مذاکره", "Negotiation", [], []],
  "stakeholder-management": ["مدیریت ذی‌نفعان", "Stakeholder Management", ["تعامل با ذی‌نفعان"], []],
  "conflict-management": ["مدیریت تعارض", "Conflict Management", ["حل تعارض"], []],
  adaptability: ["سازگاری", "Adaptability", ["انعطاف‌پذیری"], ["flexibility"]],
  "attention-to-detail": ["دقت", "Attention to Detail", ["دقت کاری", "توجه به جزئیات"], []],
  empathy: ["همدلی", "Empathy", [], []],
  "ethical-judgment": ["قضاوت اخلاقی", "Ethical Judgment", ["اخلاق حرفه‌ای"], ["professional ethics"]],
  leadership: ["رهبری", "Leadership", ["رهبری تیم"], []],
  presentation: ["ارائه مؤثر", "Effective Presentation", ["ارائه مطلب"], ["presentation skills"]],
  resilience: ["تاب‌آوری", "Resilience", ["کار زیر فشار"], ["working under pressure"]],
  curiosity: ["کنجکاوی حرفه‌ای", "Professional Curiosity", ["پرسش‌گری"], ["curiosity"]],
  ownership: ["مسئولیت‌پذیری", "Ownership", ["تعهد کاری"], ["accountability"]]
};

const FOUNDATIONAL = {
  "problem-solving": ["حل مسئله", "Problem Solving", [], []],
  "critical-thinking": ["تفکر انتقادی", "Critical Thinking", ["تفکر نقادانه"], []],
  research: ["تحقیق", "Research", ["پژوهش"], []],
  documentation: ["مستندسازی", "Documentation", [], []],
  "report-writing": ["گزارش‌نویسی", "Report Writing", ["تهیه گزارش"], []],
  "data-analysis": ["تحلیل داده", "Data Analysis", ["تحلیل داده‌ها"], []],
  "statistical-literacy": ["سواد آماری", "Statistical Literacy", ["آمار پایه"], ["basic statistics"]],
  "presentation-design": ["طراحی ارائه", "Presentation Design", ["ساخت پرزنتیشن"], ["slide design"]],
  "project-planning": ["برنامه‌ریزی پروژه", "Project Planning", ["برنامه‌ریزی کار"], []],
  "requirements-analysis": ["تحلیل نیازمندی", "Requirements Analysis", ["نیازسنجی"], []],
  "process-analysis": ["تحلیل فرایند", "Process Analysis", ["بررسی فرایند"], []],
  "root-cause-analysis": ["تحلیل علت ریشه‌ای", "Root Cause Analysis", ["ریشه‌یابی خطا"], ["RCA"]],
  experimentation: ["آزمایش‌گری", "Experimentation", ["طراحی آزمایش"], ["experiment design"]],
  "data-visualization": ["نمایش بصری داده", "Data Visualization", ["بصری‌سازی داده"], []],
  "spreadsheet-analysis": ["تحلیل صفحه‌گسترده", "Spreadsheet Analysis", ["تحلیل با اکسل"], []],
  "business-literacy": ["درک کسب‌وکار", "Business Literacy", ["شناخت کسب‌وکار"], []],
  "financial-literacy": ["سواد مالی", "Financial Literacy", ["درک مالی"], []],
  "risk-assessment": ["ارزیابی ریسک", "Risk Assessment", ["تحلیل ریسک"], []],
  "quality-assurance": ["تضمین کیفیت", "Quality Assurance", ["کنترل کیفیت"], []],
  "workflow-design": ["طراحی جریان کار", "Workflow Design", ["طراحی گردش کار"], []],
  "decision-making": ["تصمیم‌گیری", "Decision Making", [], []],
  "professional-writing": ["نوشتن حرفه‌ای", "Professional Writing", ["نوشتار حرفه‌ای"], []],
  "professional-english": ["انگلیسی حرفه‌ای", "Professional English", ["مکاتبه انگلیسی"], []],
  "security-literacy": ["سواد امنیت اطلاعات", "Information Security Literacy", ["آگاهی امنیتی"], ["security awareness"]]
};

const SPECIALIZED = {
  "software-design": ["طراحی نرم‌افزار", "Software Design"],
  debugging: ["اشکال‌زدایی", "Debugging"],
  "automated-testing": ["تست خودکار", "Automated Testing", ["اتوماسیون تست"], ["test automation"]],
  "application-security": ["امنیت اپلیکیشن", "Application Security"],
  "backend-development": ["توسعه بک‌اند", "Backend Development"],
  "api-design": ["طراحی API", "API Design"],
  "database-design": ["طراحی پایگاه داده", "Database Design"],
  "performance-optimization": ["بهینه‌سازی عملکرد", "Performance Optimization"],
  "object-oriented-programming": ["برنامه‌نویسی شیءگرا", "Object-Oriented Programming", ["شی‌گرایی"], ["OOP"]],
  concurrency: ["برنامه‌نویسی هم‌زمان", "Concurrent Programming"],
  "event-driven-architecture": ["معماری رویدادمحور", "Event-Driven Architecture"],
  "queue-processing": ["پردازش صف", "Queue Processing"],
  caching: ["طراحی کش", "Caching Design"],
  "frontend-development": ["توسعه فرانت‌اند", "Frontend Development"],
  "ui-implementation": ["پیاده‌سازی رابط کاربری", "UI Implementation"],
  "responsive-design": ["طراحی واکنش‌گرا", "Responsive Design"],
  accessibility: ["دسترس‌پذیری دیجیتال", "Digital Accessibility", ["دسترس پذیری"], ["accessibility", "WCAG"]],
  "state-management": ["مدیریت وضعیت", "State Management"],
  "form-design": ["طراحی فرم", "Form Design"],
  "frontend-performance": ["عملکرد فرانت‌اند", "Frontend Performance"],
  "mobile-development": ["توسعه اپلیکیشن موبایل", "Mobile Application Development"],
  "mobile-architecture": ["معماری اپلیکیشن موبایل", "Mobile Application Architecture"],
  "offline-data": ["مدیریت داده آفلاین", "Offline Data Management"],
  "container-orchestration": ["هماهنگ‌سازی کانتینر", "Container Orchestration"],
  "infrastructure-as-code": ["زیرساخت به‌صورت کد", "Infrastructure as Code", ["زیرساخت کدنویسی‌شده"], ["IaC"]],
  "release-automation": ["خودکارسازی انتشار", "Release Automation", ["اتوماسیون انتشار"], ["CI/CD"]],
  observability: ["مشاهده‌پذیری سیستم", "System Observability", ["پایش‌پذیری"], ["observability"]],
  "incident-response": ["پاسخ به رخداد", "Incident Response"],
  "reliability-engineering": ["مهندسی قابلیت اطمینان", "Reliability Engineering", ["مهندسی پایایی"], ["SRE"]],
  "service-level-objectives": ["هدف‌گذاری سطح خدمت", "Service Level Objectives", [], ["SLO"]],
  networking: ["مدیریت شبکه", "Network Management"],
  "system-administration": ["مدیریت سیستم", "System Administration"],
  "identity-management": ["مدیریت هویت", "Identity Management"],
  "access-control": ["کنترل دسترسی", "Access Control"],
  "penetration-testing": ["آزمون نفوذ", "Penetration Testing", [], ["pentest"]],
  "vulnerability-assessment": ["ارزیابی آسیب‌پذیری", "Vulnerability Assessment"],
  "security-monitoring": ["پایش امنیت", "Security Monitoring"],
  "log-analysis": ["تحلیل لاگ", "Log Analysis"],
  "threat-intelligence": ["هوشمندی تهدید", "Threat Intelligence"],
  "incident-triage": ["تریاژ رخداد", "Incident Triage"],
  troubleshooting: ["عیب‌یابی فنی", "Technical Troubleshooting"],
  "knowledge-management": ["مدیریت دانش", "Knowledge Management"],
  "test-design": ["طراحی آزمون نرم‌افزار", "Software Test Design"],
  "api-testing": ["تست API", "API Testing"],
  "ui-testing": ["تست رابط کاربری", "UI Testing"],
  "performance-testing": ["تست عملکرد", "Performance Testing"],
  "sql-querying": ["پرس‌وجوی SQL", "SQL Querying"],
  "statistical-analysis": ["تحلیل آماری", "Statistical Analysis"],
  "analytics-design": ["طراحی تحلیل", "Analytics Design"],
  "data-storytelling": ["روایت‌گری داده", "Data Storytelling"],
  "data-modeling": ["مدل‌سازی داده", "Data Modeling"],
  "data-pipelines": ["ساخت خط لوله داده", "Data Pipeline Engineering"],
  "data-quality": ["کیفیت داده", "Data Quality"],
  "distributed-systems": ["سیستم‌های توزیع‌شده", "Distributed Systems"],
  "data-governance": ["حاکمیت داده", "Data Governance"],
  "bi-dashboarding": ["طراحی داشبورد هوش تجاری", "BI Dashboard Design"],
  "machine-learning-engineering": ["مهندسی یادگیری ماشین", "Machine Learning Engineering", ["مهندسی ML"], ["ML engineering"]],
  "natural-language-processing": ["پردازش زبان طبیعی", "Natural Language Processing", [], ["NLP"]],
  "retrieval-augmented-generation": ["تولید تقویت‌شده با بازیابی", "Retrieval-Augmented Generation", [], ["RAG"]],
  "model-evaluation": ["ارزیابی مدل", "Model Evaluation"],
  mlops: ["عملیات یادگیری ماشین", "Machine Learning Operations", [], ["MLOps"]],
  "marketing-strategy": ["استراتژی بازاریابی", "Marketing Strategy"],
  "audience-research": ["تحقیق مخاطب", "Audience Research"],
  "campaign-planning": ["برنامه‌ریزی کمپین", "Campaign Planning"],
  "marketing-measurement": ["سنجش بازاریابی", "Marketing Measurement"],
  "growth-experimentation": ["آزمایش رشد", "Growth Experimentation"],
  "funnel-analysis": ["تحلیل قیف", "Funnel Analysis"],
  attribution: ["تحلیل اتریبیوشن", "Attribution Analysis"],
  "lifecycle-marketing": ["بازاریابی چرخه عمر", "Lifecycle Marketing"],
  "content-strategy": ["استراتژی محتوا", "Content Strategy"],
  copywriting: ["کپی‌رایتینگ", "Copywriting", ["تبلیغ‌نویسی"], []],
  "editorial-planning": ["برنامه‌ریزی تحریریه", "Editorial Planning"],
  "search-engine-optimization": ["بهینه‌سازی موتور جست‌وجو", "Search Engine Optimization", ["سئو"], ["SEO"]],
  "keyword-research": ["تحقیق کلمات کلیدی", "Keyword Research"],
  "technical-seo": ["سئوی فنی", "Technical SEO"],
  "on-page-seo": ["سئوی داخلی", "On-Page SEO"],
  "paid-advertising": ["تبلیغات پولی", "Paid Advertising"],
  "conversion-optimization": ["بهینه‌سازی تبدیل", "Conversion Rate Optimization", [], ["CRO"]],
  "creative-testing": ["آزمون خلاقه", "Creative Testing"],
  "market-research": ["تحقیق بازار", "Market Research"],
  "survey-design": ["طراحی نظرسنجی", "Survey Design"],
  "qualitative-research": ["تحقیق کیفی", "Qualitative Research"],
  "brand-strategy": ["استراتژی برند", "Brand Strategy"],
  positioning: ["جایگاه‌سازی برند", "Brand Positioning"],
  "creative-briefing": ["تدوین بریف خلاقه", "Creative Briefing"],
  "public-relations": ["روابط عمومی", "Public Relations"],
  "social-media-strategy": ["استراتژی شبکه‌های اجتماعی", "Social Media Strategy"],
  "social-content-production": ["تولید محتوای شبکه‌های اجتماعی", "Social Content Production"],
  "community-management": ["مدیریت کامیونیتی", "Community Management", ["مدیریت جامعه"], []],
  "social-listening": ["پایش گفت‌وگوهای اجتماعی", "Social Listening"],
  "crm-operations": ["عملیات CRM", "CRM Operations"],
  "crm-automation": ["اتوماسیون CRM", "CRM Automation"],
  "cohort-analysis": ["تحلیل کوهورت", "Cohort Analysis"],
  "contact-center-operations": ["عملیات مرکز تماس", "Contact Center Operations"],
  "workforce-management": ["مدیریت نیروی عملیاتی", "Workforce Management", [], ["WFM"]],
  "service-quality-monitoring": ["پایش کیفیت خدمت", "Service Quality Monitoring"],
  "account-management": ["مدیریت حساب مشتری", "Account Management"],
  "account-health-analysis": ["تحلیل سلامت حساب", "Account Health Analysis"],
  "sales-discovery": ["کشف مسئله فروش", "Sales Discovery"],
  "consultative-selling": ["فروش مشاوره‌ای", "Consultative Selling"],
  "proposal-writing": ["پیشنهادنویسی تجاری", "Business Proposal Writing"],
  "contract-management": ["مدیریت قرارداد", "Contract Management"],
  "partnership-development": ["توسعه مشارکت", "Partnership Development"],
  "field-sales": ["فروش میدانی", "Field Sales"],
  "territory-analysis": ["تحلیل منطقه فروش", "Sales Territory Analysis"],
  "customer-verification": ["احراز مشتری", "Customer Verification", [], ["KYC"]],
  "trade-documentation": ["اسناد بازرگانی", "Trade Documentation"],
  incoterms: ["اینکوترمز", "Incoterms"],
  "logistics-planning": ["برنامه‌ریزی لجستیک", "Logistics Planning"],
  "capacity-planning": ["برنامه‌ریزی ظرفیت", "Capacity Planning"],
  "inventory-operations": ["عملیات موجودی", "Inventory Operations"],
  sourcing: ["جست‌وجوی استعداد", "Talent Sourcing"],
  "structured-interviewing": ["مصاحبه ساختاریافته", "Structured Interviewing"],
  "evidence-evaluation": ["ارزیابی شواهد", "Evidence Evaluation"],
  "labor-law": ["قانون کار", "Labor Law"],
  "employee-relations": ["روابط کارکنان", "Employee Relations"],
  compensation: ["جبران خدمات", "Compensation"],
  "hr-operations": ["عملیات منابع انسانی", "HR Operations"],
  "payroll-processing": ["پردازش حقوق", "Payroll Processing"],
  "user-research": ["تحقیق کاربر", "User Research"],
  "interaction-design": ["طراحی تعامل", "Interaction Design"],
  "user-interface-design": ["طراحی رابط کاربری", "User Interface Design", ["طراحی UI"], ["UI design"]],
  prototyping: ["نمونه‌سازی", "Prototyping"],
  "design-systems": ["سیستم طراحی", "Design Systems"],
  "product-discovery": ["کشف محصول", "Product Discovery"],
  prioritization: ["اولویت‌بندی محصول", "Product Prioritization"],
  "roadmap-management": ["مدیریت نقشه راه", "Roadmap Management"],
  "product-analytics": ["تحلیل محصول", "Product Analytics"],
  accounting: ["حسابداری", "Accounting"],
  "financial-reporting": ["گزارشگری مالی", "Financial Reporting"],
  "internal-audit": ["حسابرسی داخلی", "Internal Audit"],
  "internal-controls": ["کنترل داخلی", "Internal Controls"],
  "tax-accounting": ["حسابداری مالیاتی", "Tax Accounting"],
  "treasury-accounting": ["حسابداری خزانه", "Treasury Accounting"],
  budgeting: ["بودجه‌ریزی", "Budgeting"],
  reconciliation: ["تطبیق حساب", "Account Reconciliation"],
  "regulatory-compliance": ["انطباق مقرراتی", "Regulatory Compliance"],
  "visual-design": ["طراحی بصری", "Visual Design"],
  typography: ["تایپوگرافی", "Typography"],
  "layout-design": ["صفحه‌آرایی", "Layout Design"],
  "print-production": ["آماده‌سازی چاپ", "Print Production"],
  "video-editing": ["تدوین ویدئو", "Video Editing"],
  "visual-storytelling": ["روایت‌گری بصری", "Visual Storytelling"],
  "audio-editing": ["تدوین صدا", "Audio Editing"],
  "color-grading": ["اصلاح رنگ", "Color Grading"],
  illustration: ["تصویرسازی", "Illustration"],
  "digital-painting": ["نقاشی دیجیتال", "Digital Painting"],
  "character-design": ["طراحی کاراکتر", "Character Design"],
  "three-dimensional-modeling": ["مدل‌سازی سه‌بعدی", "3D Modeling"],
  texturing: ["بافت‌پردازی", "Texturing"],
  lighting: ["نورپردازی سه‌بعدی", "3D Lighting"],
  rendering: ["رندرینگ", "Rendering"],
  "motion-design": ["طراحی حرکت", "Motion Design"],
  animation: ["انیمیشن", "Animation"],
  compositing: ["کامپوزیت تصویر", "Compositing"],
  "brand-identity": ["طراحی هویت بصری", "Visual Identity Design"],
  "brand-governance": ["حاکمیت برند", "Brand Governance"]
};

const TOOLS = {
  git: ["Git", "Git", [], ["version control"]],
  docker: ["Docker", "Docker"],
  postman: ["Postman", "Postman"],
  sql: ["SQL", "SQL", ["اس کیو ال"], []],
  postgresql: ["PostgreSQL", "PostgreSQL", ["Postgres"], []],
  "sql-server": ["Microsoft SQL Server", "Microsoft SQL Server", ["SQL Server"], []],
  mysql: ["MySQL", "MySQL"],
  redis: ["Redis", "Redis"],
  mongodb: ["MongoDB", "MongoDB"],
  kafka: ["Apache Kafka", "Apache Kafka", ["کافکا"], ["Kafka"]],
  csharp: ["C#", "C#", ["سی شارپ"], ["C Sharp"]],
  "aspnet-core": ["ASP.NET Core", "ASP.NET Core"],
  "entity-framework": ["Entity Framework Core", "Entity Framework Core", ["EF Core"], []],
  go: ["Go", "Go", ["گولنگ"], ["Golang"]],
  java: ["Java", "Java", ["جاوا"], []],
  "spring-boot": ["Spring Boot", "Spring Boot"],
  jpa: ["JPA", "Java Persistence API"],
  nodejs: ["Node.js", "Node.js", ["نود جی‌اس"], ["Node"]],
  typescript: ["TypeScript", "TypeScript", ["تایپ‌اسکریپت"], ["TS"]],
  php: ["PHP", "PHP"],
  laravel: ["Laravel", "Laravel", ["لاراول"], []],
  python: ["Python", "Python", ["پایتون"], []],
  django: ["Django", "Django", ["جنگو"], []],
  celery: ["Celery", "Celery"],
  angular: ["Angular", "Angular", ["انگولار"], []],
  rxjs: ["RxJS", "RxJS"],
  react: ["React", "React", ["ری‌اکت"], ["React.js"]],
  nextjs: ["Next.js", "Next.js", ["نکست جی‌اس"], ["Next"]],
  vue: ["Vue", "Vue", ["ویو"], ["Vue.js"]],
  nuxt: ["Nuxt", "Nuxt", ["ناکست"], ["Nuxt.js"]],
  blazor: ["Blazor", "Blazor"],
  kotlin: ["Kotlin", "Kotlin", ["کاتلین"], []],
  "android-sdk": ["Android SDK", "Android SDK"],
  "jetpack-compose": ["Jetpack Compose", "Jetpack Compose", ["Compose"], []],
  gradle: ["Gradle", "Gradle"],
  linux: ["Linux", "Linux", ["لینوکس"], []],
  kubernetes: ["Kubernetes", "Kubernetes", ["کوبرنتیز"], ["K8s"]],
  terraform: ["Terraform", "Terraform"],
  helm: ["Helm", "Helm"],
  argocd: ["Argo CD", "Argo CD", ["آرگو سی‌دی"], []],
  prometheus: ["Prometheus", "Prometheus"],
  grafana: ["Grafana", "Grafana"],
  opentelemetry: ["OpenTelemetry", "OpenTelemetry", [], ["OTel"]],
  powershell: ["PowerShell", "PowerShell"],
  "windows-server": ["Windows Server", "Windows Server"],
  "active-directory": ["Active Directory", "Active Directory", [], ["AD"]],
  entra: ["Microsoft Entra", "Microsoft Entra", [], ["Entra ID", "Azure AD"]],
  "microsoft-365": ["Microsoft 365", "Microsoft 365", ["آفیس ۳۶۵"], ["Office 365"]],
  "cisco-ios": ["Cisco IOS", "Cisco IOS"],
  wireshark: ["Wireshark", "Wireshark"],
  zabbix: ["Zabbix", "Zabbix"],
  burp: ["Burp Suite", "Burp Suite"],
  nmap: ["Nmap", "Nmap"],
  metasploit: ["Metasploit", "Metasploit"],
  sentinel: ["Microsoft Sentinel", "Microsoft Sentinel"],
  splunk: ["Splunk", "Splunk"],
  defender: ["Microsoft Defender", "Microsoft Defender"],
  playwright: ["Playwright", "Playwright"],
  jira: ["Jira", "Jira", ["جیرا"], []],
  "jira-service-management": ["Jira Service Management", "Jira Service Management", [], ["JSM"]],
  "microsoft-excel": ["Microsoft Excel", "Microsoft Excel", ["اکسل"], ["Excel"]],
  "google-sheets": ["Google Sheets", "Google Sheets", ["گوگل شیت"], ["Sheets"]],
  "power-bi": ["Microsoft Power BI", "Microsoft Power BI", ["پاور بی‌آی"], ["Power BI"]],
  "power-query": ["Power Query", "Power Query"],
  dax: ["DAX", "Data Analysis Expressions"],
  r: ["R", "R"],
  spss: ["IBM SPSS", "IBM SPSS", ["اس‌پی‌اس‌اس"], ["SPSS"]],
  pandas: ["Pandas", "Pandas"],
  airflow: ["Apache Airflow", "Apache Airflow", ["ایرفلو"], ["Airflow"]],
  dbt: ["dbt", "dbt"],
  spark: ["Apache Spark", "Apache Spark", ["اسپارک"], ["Spark"]],
  pytorch: ["PyTorch", "PyTorch"],
  "hugging-face": ["Hugging Face", "Hugging Face"],
  fastapi: ["FastAPI", "FastAPI"],
  pgvector: ["pgvector", "pgvector"],
  ga4: ["Google Analytics 4", "Google Analytics 4", ["گوگل آنالیتیکس"], ["GA4"]],
  gtm: ["Google Tag Manager", "Google Tag Manager", ["گوگل تگ منیجر"], ["GTM"]],
  "google-ads": ["Google Ads", "Google Ads", ["گوگل ادز"], []],
  "meta-ads": ["Meta Ads Manager", "Meta Ads Manager", ["متا ادز"], ["Facebook Ads"]],
  "search-console": ["Google Search Console", "Google Search Console", ["سرچ کنسول"], ["GSC"]],
  "screaming-frog": ["Screaming Frog", "Screaming Frog"],
  ahrefs: ["Ahrefs", "Ahrefs"],
  wordpress: ["WordPress", "WordPress", ["وردپرس"], []],
  hubspot: ["HubSpot", "HubSpot", ["هاب‌اسپات"], []],
  salesforce: ["Salesforce", "Salesforce", ["سیلزفورس"], []],
  braze: ["Braze", "Braze"],
  mixpanel: ["Mixpanel", "Mixpanel"],
  zendesk: ["Zendesk", "Zendesk"],
  canva: ["Canva", "Canva", ["کانوا"], []],
  capcut: ["CapCut", "CapCut", ["کپ‌کات"], []],
  "meta-business-suite": ["Meta Business Suite", "Meta Business Suite"],
  "linkedin-recruiter": ["LinkedIn Recruiter", "LinkedIn Recruiter", ["لینکدین ریکروتر"], []],
  bamboohr: ["BambooHR", "BambooHR"],
  zoom: ["Zoom", "Zoom", ["زوم"], []],
  powerpoint: ["Microsoft PowerPoint", "Microsoft PowerPoint", ["پاورپوینت"], ["PowerPoint"]],
  miro: ["Miro", "Miro", ["میرو"], []],
  notion: ["Notion", "Notion", ["نوشن"], []],
  productboard: ["Productboard", "Productboard"],
  "google-maps": ["Google Maps", "Google Maps", ["گوگل مپس"], ["Maps"]],
  rahkaran: ["راهکاران", "Rahkaran ERP", ["ERP راهکاران"], []],
  outlook: ["Microsoft Outlook", "Microsoft Outlook", ["اوت‌لوک"], ["Outlook"]],
  modian: ["سامانه مؤدیان", "Iranian Taxpayer System", [], ["Modian"]],
  "tax-portal": ["درگاه مالیاتی", "Iranian Tax Portal", ["پرتال مالیات"], []],
  "customs-portal": ["سامانه جامع تجارت", "Iran Trade System", ["سامانه گمرک"], []],
  figma: ["Figma", "Figma", ["فیگما"], []],
  figjam: ["FigJam", "FigJam", ["فیگ‌جم"], []],
  photoshop: ["Adobe Photoshop", "Adobe Photoshop", ["فتوشاپ"], ["Photoshop"]],
  illustrator: ["Adobe Illustrator", "Adobe Illustrator", ["ایلاستریتور"], ["Illustrator"]],
  indesign: ["Adobe InDesign", "Adobe InDesign", ["ایندیزاین"], ["InDesign"]],
  premiere: ["Adobe Premiere Pro", "Adobe Premiere Pro", ["پریمیر"], ["Premiere"]],
  "after-effects": ["Adobe After Effects", "Adobe After Effects", ["افتر افکت"], ["After Effects"]],
  "davinci-resolve": ["DaVinci Resolve", "DaVinci Resolve", ["داوینچی ریزالو"], ["Resolve"]],
  audition: ["Adobe Audition", "Adobe Audition", ["آدیشن"], ["Audition"]],
  procreate: ["Procreate", "Procreate", ["پروکریت"], []],
  "clip-studio": ["Clip Studio Paint", "Clip Studio Paint"],
  blender: ["Blender", "Blender", ["بلندر"], []],
  maya: ["Autodesk Maya", "Autodesk Maya", ["مایا"], ["Maya"]],
  "substance-3d": ["Adobe Substance 3D", "Adobe Substance 3D", ["سابستنس"], ["Substance Painter"]],
  unreal: ["Unreal Engine", "Unreal Engine", ["آنریل"], []],
  unity: ["Unity", "Unity", ["یونیتی"], []],
  "cinema-4d": ["Cinema 4D", "Cinema 4D", ["سینما فوردی"], ["C4D"]],
  "media-encoder": ["Adobe Media Encoder", "Adobe Media Encoder", ["مدیا انکودر"], ["Media Encoder"]]
};

const TEMPLATES = {
  backend: {
    soft: ["effective-communication", "teamwork", "feedback-reception", "time-management", "ownership"],
    foundational: ["problem-solving", "documentation", "requirements-analysis", "critical-thinking"],
    specialized: ["backend-development", "api-design", "database-design", "debugging", "automated-testing", "application-security", "performance-optimization"],
    tools: ["git", "docker", "postman", "sql"]
  },
  frontend: {
    soft: ["effective-communication", "teamwork", "feedback-reception", "attention-to-detail", "ownership"],
    foundational: ["problem-solving", "requirements-analysis", "quality-assurance", "documentation"],
    specialized: ["frontend-development", "ui-implementation", "responsive-design", "accessibility", "state-management", "frontend-performance", "automated-testing"],
    tools: ["git", "playwright"]
  },
  fullstack: {
    soft: ["effective-communication", "teamwork", "feedback-reception", "time-management", "ownership"],
    foundational: ["problem-solving", "requirements-analysis", "documentation", "critical-thinking"],
    specialized: ["software-design", "backend-development", "frontend-development", "api-design", "database-design", "ui-implementation", "automated-testing", "debugging"],
    tools: ["git", "docker", "postman", "sql"]
  },
  mobile: {
    soft: ["effective-communication", "teamwork", "feedback-reception", "attention-to-detail", "ownership"],
    foundational: ["problem-solving", "requirements-analysis", "quality-assurance", "documentation"],
    specialized: ["mobile-development", "mobile-architecture", "ui-implementation", "offline-data", "automated-testing", "debugging", "performance-optimization"],
    tools: ["git", "postman"]
  },
  platform: {
    soft: ["effective-communication", "teamwork", "resilience", "ownership", "adaptability"],
    foundational: ["problem-solving", "root-cause-analysis", "documentation", "risk-assessment"],
    specialized: ["system-administration", "container-orchestration", "infrastructure-as-code", "release-automation", "observability", "incident-response", "networking"],
    tools: ["linux", "git", "docker"]
  },
  security: {
    soft: ["ethical-judgment", "effective-communication", "curiosity", "attention-to-detail", "resilience"],
    foundational: ["critical-thinking", "risk-assessment", "report-writing", "security-literacy"],
    specialized: ["vulnerability-assessment", "networking", "access-control", "incident-response", "log-analysis"],
    tools: ["linux", "wireshark"]
  },
  itops: {
    soft: ["active-listening", "effective-communication", "empathy", "resilience", "ownership"],
    foundational: ["problem-solving", "root-cause-analysis", "documentation", "security-literacy"],
    specialized: ["troubleshooting", "knowledge-management", "system-administration", "networking", "identity-management", "access-control"],
    tools: ["microsoft-365", "jira-service-management"]
  },
  qa: {
    soft: ["effective-communication", "attention-to-detail", "teamwork", "curiosity", "ownership"],
    foundational: ["quality-assurance", "problem-solving", "documentation", "requirements-analysis"],
    specialized: ["test-design", "automated-testing", "api-testing", "ui-testing", "performance-testing", "debugging"],
    tools: ["git", "playwright", "postman", "jira"]
  },
  analytics: {
    soft: ["effective-communication", "active-listening", "curiosity", "presentation", "ethical-judgment"],
    foundational: ["data-analysis", "statistical-literacy", "critical-thinking", "report-writing", "data-visualization"],
    specialized: ["sql-querying", "analytics-design", "statistical-analysis", "data-storytelling", "data-modeling"],
    tools: ["sql", "microsoft-excel", "power-bi"]
  },
  dataEngineering: {
    soft: ["effective-communication", "teamwork", "ownership", "attention-to-detail", "adaptability"],
    foundational: ["problem-solving", "data-analysis", "documentation", "quality-assurance"],
    specialized: ["data-pipelines", "data-modeling", "data-quality", "distributed-systems", "automated-testing", "observability"],
    tools: ["sql", "python", "git", "docker"]
  },
  artificialIntelligence: {
    soft: ["effective-communication", "curiosity", "ethical-judgment", "teamwork", "ownership"],
    foundational: ["statistical-literacy", "experimentation", "data-analysis", "critical-thinking"],
    specialized: ["machine-learning-engineering", "natural-language-processing", "model-evaluation", "mlops", "data-quality"],
    tools: ["python", "git", "docker"]
  },
  marketing: {
    soft: ["effective-communication", "curiosity", "presentation", "feedback-reception", "time-management"],
    foundational: ["research", "data-analysis", "report-writing", "experimentation", "business-literacy"],
    specialized: ["marketing-strategy", "audience-research", "campaign-planning", "marketing-measurement"],
    tools: ["microsoft-excel", "ga4"]
  },
  marketResearch: {
    soft: ["active-listening", "curiosity", "effective-communication", "presentation", "ethical-judgment"],
    foundational: ["research", "statistical-literacy", "data-analysis", "report-writing", "data-visualization"],
    specialized: ["market-research", "survey-design", "qualitative-research", "statistical-analysis", "data-storytelling"],
    tools: ["microsoft-excel", "power-bi"]
  },
  crm: {
    soft: ["active-listening", "effective-communication", "stakeholder-management", "attention-to-detail", "ownership"],
    foundational: ["process-analysis", "data-analysis", "documentation", "workflow-design", "business-literacy"],
    specialized: ["crm-operations", "crm-automation", "funnel-analysis", "data-quality"],
    tools: ["microsoft-excel", "sql", "power-bi"]
  },
  serviceOperations: {
    soft: ["active-listening", "effective-communication", "empathy", "resilience", "ownership"],
    foundational: ["process-analysis", "root-cause-analysis", "data-analysis", "documentation"],
    specialized: ["contact-center-operations", "workforce-management", "service-quality-monitoring", "knowledge-management"],
    tools: ["microsoft-excel", "power-bi", "zendesk"]
  },
  commercial: {
    soft: ["active-listening", "negotiation", "effective-communication", "stakeholder-management", "ownership"],
    foundational: ["business-literacy", "financial-literacy", "research", "presentation-design", "decision-making"],
    specialized: ["sales-discovery", "consultative-selling", "proposal-writing", "contract-management", "account-management"],
    tools: ["microsoft-excel", "powerpoint", "hubspot"]
  },
  hr: {
    soft: ["active-listening", "empathy", "effective-communication", "ethical-judgment", "conflict-management"],
    foundational: ["documentation", "process-analysis", "report-writing", "data-analysis"],
    specialized: ["labor-law", "evidence-evaluation", "hr-operations", "employee-relations"],
    tools: ["microsoft-excel", "bamboohr"]
  },
  productDesign: {
    soft: ["active-listening", "effective-communication", "feedback-reception", "empathy", "presentation"],
    foundational: ["research", "requirements-analysis", "critical-thinking", "presentation-design"],
    specialized: ["user-research", "interaction-design", "user-interface-design", "prototyping", "accessibility", "design-systems"],
    tools: ["figma", "figjam", "jira"]
  },
  product: {
    soft: ["active-listening", "stakeholder-management", "effective-communication", "negotiation", "ownership"],
    foundational: ["requirements-analysis", "data-analysis", "decision-making", "experimentation", "business-literacy"],
    specialized: ["product-discovery", "prioritization", "roadmap-management", "product-analytics", "user-research"],
    tools: ["jira", "miro", "ga4", "sql"]
  },
  finance: {
    soft: ["attention-to-detail", "ethical-judgment", "effective-communication", "ownership", "time-management"],
    foundational: ["financial-literacy", "risk-assessment", "spreadsheet-analysis", "report-writing", "documentation"],
    specialized: ["accounting", "internal-controls", "reconciliation", "regulatory-compliance"],
    tools: ["microsoft-excel", "rahkaran"]
  },
  creative: {
    soft: ["feedback-reception", "effective-communication", "attention-to-detail", "time-management", "curiosity"],
    foundational: ["research", "project-planning", "quality-assurance", "presentation-design"],
    specialized: ["visual-design", "visual-storytelling", "layout-design", "creative-briefing"],
    tools: ["photoshop", "illustrator"]
  },
  logistics: {
    soft: ["effective-communication", "negotiation", "resilience", "attention-to-detail", "ownership"],
    foundational: ["process-analysis", "data-analysis", "problem-solving", "documentation"],
    specialized: ["logistics-planning", "inventory-operations"],
    tools: ["microsoft-excel", "rahkaran", "power-bi"]
  },
  social: {
    soft: ["effective-communication", "curiosity", "feedback-reception", "resilience", "time-management"],
    foundational: ["research", "data-analysis", "project-planning", "professional-writing"],
    specialized: ["social-media-strategy", "social-content-production", "community-management", "social-listening", "marketing-measurement"],
    tools: ["meta-business-suite", "canva", "ga4"]
  }
};

const CAREER_PROFILES = {
  "dotnet-c-sharp-backend": { templates: ["backend"], specialized: ["object-oriented-programming", "software-design"], tools: ["csharp", "aspnet-core", "entity-framework", "sql-server"] },
  "go-backend": { templates: ["backend"], specialized: ["concurrency", "distributed-systems"], tools: ["go", "postgresql", "redis"] },
  "java-jvm-backend": { templates: ["backend"], specialized: ["object-oriented-programming", "event-driven-architecture"], tools: ["java", "spring-boot", "jpa", "kafka"] },
  "node-js-typescript-backend": { templates: ["backend"], specialized: ["event-driven-architecture", "queue-processing"], tools: ["nodejs", "typescript", "postgresql", "redis"] },
  "php-laravel-backend": { templates: ["backend"], specialized: ["queue-processing", "caching"], tools: ["php", "laravel", "mysql", "redis"] },
  "python-django-backend": { templates: ["backend"], specialized: ["object-oriented-programming", "queue-processing"], tools: ["python", "django", "postgresql", "celery"] },
  "angular-frontend": { templates: ["frontend"], specialized: ["form-design"], tools: ["angular", "typescript", "rxjs"] },
  "react-next-js-frontend": { templates: ["frontend"], specialized: ["form-design"], tools: ["react", "nextjs", "typescript"] },
  "vue-nuxt-frontend": { templates: ["frontend"], specialized: ["form-design"], tools: ["vue", "nuxt", "typescript"] },
  "full-stack-dotnet-blazor": { templates: ["fullstack"], specialized: ["object-oriented-programming"], tools: ["csharp", "blazor", "aspnet-core", "entity-framework", "sql-server"] },
  "full-stack-node-js-mern": { templates: ["fullstack"], specialized: ["event-driven-architecture"], tools: ["nodejs", "typescript", "react", "mongodb"] },
  "android-native-kotlin": { templates: ["mobile"], specialized: ["concurrency"], tools: ["kotlin", "android-sdk", "jetpack-compose", "gradle"] },
  "kubernetes-platform-engineering": { templates: ["platform"], specialized: ["service-level-objectives"], tools: ["kubernetes", "terraform", "helm", "argocd", "prometheus"] },
  "sre-reliability-engineering": { templates: ["platform"], specialized: ["reliability-engineering", "service-level-objectives"], tools: ["kubernetes", "prometheus", "grafana", "opentelemetry", "terraform"] },
  "offensive-security-penetration-testing": { templates: ["security"], specialized: ["penetration-testing"], tools: ["burp", "nmap", "metasploit"] },
  "soc-security-monitoring-and-incident-response": { templates: ["security"], specialized: ["security-monitoring", "incident-triage", "threat-intelligence"], tools: ["sentinel", "splunk", "defender"] },
  "it-support-helpdesk": { templates: ["itops"], specialized: ["service-quality-monitoring"], tools: ["windows-server", "active-directory"] },
  "network-administration-and-infrastructure": { templates: ["itops"], specialized: ["networking", "system-administration"], tools: ["cisco-ios", "wireshark", "zabbix", "linux"] },
  "windows-microsoft-infrastructure": { templates: ["itops"], specialized: ["identity-management", "access-control", "system-administration"], tools: ["windows-server", "active-directory", "powershell", "entra"] },
  "qa-automation-sdet": { templates: ["qa"], specialized: ["application-security"], tools: ["typescript", "python"] },
  "analytics-and-business-insights": { templates: ["analytics"], foundational: ["business-literacy"], tools: ["python", "pandas"] },
  "data-engineering-and-platform": { templates: ["dataEngineering"], specialized: ["data-governance"], tools: ["airflow", "dbt", "spark", "kafka", "postgresql"] },
  "llm-genai": { templates: ["artificialIntelligence"], specialized: ["retrieval-augmented-generation", "data-pipelines"], tools: ["pytorch", "hugging-face", "fastapi", "pgvector"] },
  "bi-dashboarding-and-reporting": { templates: ["analytics"], specialized: ["bi-dashboarding", "data-governance"], tools: ["power-query", "dax", "sql-server"] },
  "growth-marketing": { templates: ["marketing"], specialized: ["growth-experimentation", "funnel-analysis", "lifecycle-marketing", "attribution"], tools: ["gtm", "hubspot", "google-ads", "sql"] },
  "content-and-copywriting": { templates: ["marketing"], specialized: ["content-strategy", "copywriting", "editorial-planning", "search-engine-optimization"], tools: ["wordpress", "search-console", "canva"] },
  "market-research-and-insights": { templates: ["marketResearch"], specialized: ["audience-research"], tools: ["spss", "r", "google-sheets"] },
  "digital-marketing": { templates: ["marketing"], specialized: ["paid-advertising", "search-engine-optimization", "lifecycle-marketing"], tools: ["gtm", "google-ads", "search-console", "hubspot"] },
  seo: { templates: ["marketing"], specialized: ["search-engine-optimization", "keyword-research", "technical-seo", "on-page-seo"], tools: ["search-console", "screaming-frog", "ahrefs", "wordpress"] },
  "brand-pr-and-communications": { templates: ["marketing"], specialized: ["brand-strategy", "positioning", "creative-briefing", "public-relations"], tools: ["powerpoint", "miro", "google-sheets"] },
  "marketing-generalist-and-strategy": { templates: ["marketing"], specialized: ["content-strategy", "paid-advertising", "lifecycle-marketing"], tools: ["hubspot", "wordpress", "google-ads"] },
  "performance-marketing": { templates: ["marketing"], specialized: ["paid-advertising", "attribution", "conversion-optimization", "creative-testing"], tools: ["google-ads", "meta-ads", "gtm", "sql"] },
  "crm-operations": { templates: ["crm"], foundational: ["requirements-analysis"], tools: ["salesforce", "hubspot"] },
  "crm-and-retention-operations": { templates: ["crm"], specialized: ["lifecycle-marketing", "cohort-analysis"], foundational: ["experimentation"], tools: ["braze", "mixpanel", "hubspot"] },
  "contact-center-operations": { templates: ["serviceOperations"], soft: ["conflict-management"], tools: ["salesforce"] },
  "account-management": { templates: ["commercial"], specialized: ["account-health-analysis"], soft: ["stakeholder-management"], tools: ["salesforce", "notion"] },
  "b2b-corporate-sales": { templates: ["commercial"], soft: ["negotiation"], tools: ["salesforce", "linkedin-recruiter"] },
  "business-development": { templates: ["commercial"], specialized: ["partnership-development", "market-research"], tools: ["notion", "google-sheets"] },
  "commercial-trading-operations": { templates: ["commercial"], specialized: ["trade-documentation", "incoterms", "reconciliation"], tools: ["rahkaran", "outlook", "customs-portal"] },
  "market-development-merchant-acquisition": { templates: ["commercial"], specialized: ["field-sales", "territory-analysis", "customer-verification"], tools: ["google-maps", "salesforce"] },
  "talent-acquisition": { templates: ["hr"], specialized: ["sourcing", "structured-interviewing"], soft: ["negotiation"], tools: ["linkedin-recruiter", "zoom"] },
  "hr-management": { templates: ["hr"], specialized: ["compensation", "workforce-management"], soft: ["leadership"], tools: ["power-bi", "rahkaran"] },
  "hr-operations-and-personnel-administration": { templates: ["hr"], specialized: ["payroll-processing"], foundational: ["workflow-design"], soft: ["attention-to-detail"], tools: ["rahkaran", "outlook"] },
  "ui-ux": { templates: ["productDesign"], specialized: ["visual-design"], tools: ["ga4"] },
  "product-management-and-ownership": { templates: ["product"], specialized: ["market-research"], tools: ["productboard", "powerpoint"] },
  "logistics-operations": { templates: ["logistics"], specialized: ["capacity-planning", "contract-management"], foundational: ["risk-assessment", "workflow-design"], tools: ["google-maps", "outlook"] },
  "career-path-1drths": { templates: ["finance"], specialized: ["internal-audit", "evidence-evaluation", "statistical-analysis"], tools: ["sql", "power-bi"] },
  "career-path-fmhiml": { templates: ["finance"], specialized: ["payroll-processing", "labor-law", "tax-accounting"], tools: ["modian", "tax-portal"] },
  "career-path-1bed9m": { templates: ["finance"], specialized: ["treasury-accounting", "financial-reporting"], tools: ["power-bi", "outlook"] },
  "career-path-1b5cj3": { templates: ["finance"], specialized: ["tax-accounting", "financial-reporting"], foundational: ["research"], tools: ["modian", "tax-portal"] },
  "career-path-1gt2jj": { templates: ["finance"], specialized: ["financial-reporting", "budgeting"], soft: ["leadership"], tools: ["power-bi", "powerpoint"] },
  "graphic-design-and-visual-content": { templates: ["creative"], specialized: ["typography", "print-production"], tools: ["indesign", "figma", "canva"] },
  "career-path-1w9y14": { templates: ["creative"], specialized: ["video-editing", "audio-editing", "color-grading"], tools: ["premiere", "davinci-resolve", "after-effects", "audition"] },
  "career-path-1u9xrl": { templates: ["creative"], specialized: ["illustration", "digital-painting", "character-design"], tools: ["procreate", "clip-studio"] },
  "3d-art": { templates: ["creative"], specialized: ["three-dimensional-modeling", "texturing", "lighting", "rendering"], tools: ["blender", "maya", "substance-3d", "unreal"] },
  "career-path-1lo6cj": { templates: ["creative"], specialized: ["motion-design", "animation", "compositing", "typography"], tools: ["after-effects", "premiere", "cinema-4d", "media-encoder"] },
  "career-path-1rtxp8": { templates: ["creative"], specialized: ["brand-identity", "brand-governance", "typography"], tools: ["indesign", "figma"] },
  "social-media-marketing": { templates: ["social"], specialized: ["campaign-planning", "creative-testing"], tools: ["capcut", "premiere"] }
};

const TYPE_DEFINITIONS = {
  soft: SOFT,
  foundational: FOUNDATIONAL,
  specialized: SPECIALIZED,
  tool: TOOLS
};

const RECOMMENDED_SKILL_IDS = new Set([
  "soft-effective-communication",
  "soft-active-listening",
  "soft-teamwork",
  "soft-time-management",
  "soft-attention-to-detail",
  "soft-curiosity",
  "foundational-problem-solving",
  "foundational-critical-thinking",
  "foundational-research",
  "foundational-data-analysis",
  "foundational-documentation",
  "foundational-report-writing",
  "foundational-project-planning",
  "tool-microsoft-excel",
  "tool-google-sheets",
  "tool-power-bi",
  "tool-figma",
  "tool-canva",
  "tool-git",
  "tool-sql"
]);

const RELATIONSHIPS = {
  "specialized-statistical-analysis": {
    prerequisiteSkillIds: ["foundational-statistical-literacy"],
    relatedSkillIds: ["foundational-data-analysis"]
  },
  "specialized-data-storytelling": {
    prerequisiteSkillIds: ["foundational-data-visualization"],
    relatedSkillIds: ["foundational-presentation-design"]
  },
  "specialized-machine-learning-engineering": {
    prerequisiteSkillIds: ["foundational-statistical-literacy", "foundational-data-analysis"],
    relatedSkillIds: ["specialized-model-evaluation"]
  },
  "specialized-retrieval-augmented-generation": {
    prerequisiteSkillIds: ["specialized-natural-language-processing"],
    relatedSkillIds: ["specialized-model-evaluation"]
  },
  "specialized-technical-seo": {
    prerequisiteSkillIds: ["specialized-search-engine-optimization"],
    relatedSkillIds: ["specialized-on-page-seo"]
  },
  "specialized-conversion-optimization": {
    prerequisiteSkillIds: ["foundational-experimentation"],
    relatedSkillIds: ["specialized-marketing-measurement"]
  },
  "specialized-user-interface-design": {
    relatedSkillIds: ["specialized-interaction-design", "specialized-design-systems"]
  },
  "specialized-three-dimensional-modeling": {
    relatedSkillIds: ["specialized-texturing", "specialized-lighting"]
  },
  "specialized-motion-design": {
    prerequisiteSkillIds: ["specialized-visual-design"],
    relatedSkillIds: ["specialized-animation"]
  }
};

const DESCRIPTION_OVERRIDES = {
  "soft-effective-communication": "توانایی توضیح روشن موضوع و فهم دقیق منظور دیگران.",
  "soft-active-listening": "شنیدن دقیق، پرسیدن سؤال مناسب و بازتاب درست نیاز طرف مقابل.",
  "soft-teamwork": "همکاری مسئولانه با دیگران برای رسیدن به یک خروجی مشترک.",
  "soft-feedback-reception": "دریافت بازخورد بدون دفاعی‌شدن و تبدیل آن به اصلاح عملی.",
  "soft-time-management": "اولویت‌بندی کار و تحویل قابل‌اعتماد در زمان توافق‌شده.",
  "foundational-problem-solving": "شکستن مسئله، بررسی گزینه‌ها و انتخاب راه‌حل قابل‌آزمایش.",
  "foundational-data-analysis": "خواندن داده، یافتن الگو و تبدیل آن به نتیجه‌ای قابل‌استفاده.",
  "foundational-research": "جمع‌آوری و ارزیابی منظم اطلاعات برای پاسخ به یک سؤال مشخص.",
  "foundational-documentation": "ثبت تصمیم‌ها، فرایندها و دانش به‌شکلی که دیگران بتوانند استفاده کنند.",
  "tool-microsoft-excel": "کار با داده، فرمول، جدول و گزارش در Microsoft Excel.",
  "tool-figma": "طراحی، نمونه‌سازی و همکاری روی رابط‌های دیجیتال در Figma.",
  "tool-git": "ثبت و مدیریت نسخه‌های کد و همکاری کنترل‌شده روی تغییرات.",
  "tool-sql": "پرس‌وجو و کار با داده‌های ساخت‌یافته در پایگاه داده."
};

function normalizeText(value) {
  return value
    .normalize("NFKC")
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200d]/gu, " ")
    .replace(/[“”«»'`]/gu, "")
    .replace(/[.,،؛;:!?؟()[\]{}_-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("fa");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function skillId(type, key) {
  return `${TYPE_PREFIX[type]}-${key}`;
}

function defaultDescription(type, titleFa) {
  if (type === "soft") {
    return `توانایی به‌کارگیری «${titleFa}» در همکاری و تصمیم‌گیری روزمره.`;
  }
  if (type === "foundational") {
    return `قابلیت انتقال‌پذیر «${titleFa}» برای انجام منظم و قابل‌اتکای کار.`;
  }
  if (type === "specialized") {
    return `مهارت حرفه‌ای «${titleFa}» برای انجام وظایف تخصصی این حوزه.`;
  }
  return `توانایی کار عملی با ${titleFa} در یک جریان کاری حرفه‌ای.`;
}

function buildCatalog() {
  return Object.entries(TYPE_DEFINITIONS).flatMap(([type, definitions]) => (
    Object.entries(definitions).map(([key, definition]) => {
      const [titleFa, titleEn, aliasesFa = [], aliasesEn = []] = definition;
      const id = skillId(type, key);
      const relationship = RELATIONSHIPS[id] ?? {};
      return {
        id,
        type,
        titleFa,
        titleEn,
        descriptionFa: DESCRIPTION_OVERRIDES[id] ?? defaultDescription(type, titleFa),
        aliasesFa,
        aliasesEn,
        searchTerms: unique([
          titleFa,
          titleEn,
          ...aliasesFa,
          ...aliasesEn,
          ...key.split("-")
        ]),
        isSelectable: true,
        isRecommended: RECOMMENDED_SKILL_IDS.has(id),
        prerequisiteSkillIds: relationship.prerequisiteSkillIds ?? [],
        relatedSkillIds: relationship.relatedSkillIds ?? [],
        broaderSkillId: null,
        narrowerSkillIds: []
      };
    })
  ));
}

function collectProfileKeys(profile, type) {
  const templateKeys = profile.templates.flatMap((templateName) => {
    const template = TEMPLATES[templateName];
    if (!template) throw new Error(`Unknown career skill template: ${templateName}`);
    return template[type] ?? [];
  });
  return unique([...(profile[type] ?? []), ...templateKeys]);
}

function makeRequirements(type, keys) {
  const coreCount = type === "specialized" ? 3 : 2;
  const importantEnd = Math.min(keys.length, coreCount + (type === "soft" ? 3 : 4));
  const baseWeight = {
    soft: 0.9,
    foundational: 0.85,
    specialized: 1,
    tools: 0.78
  }[type];

  return keys.map((key, index) => {
    const catalogType = type === "tools" ? "tool" : type;
    const importance = index < coreCount
      ? "core"
      : index < importantEnd
        ? "important"
        : "useful";
    const entryExpectation = type === "specialized" && index === 0
      ? "working"
      : type === "tools" && index === 0
        ? "working"
        : index < coreCount
          ? "basic"
          : "awareness";
    const importanceWeight = importance === "core" ? 1 : importance === "important" ? 0.78 : 0.5;

    return {
      skillId: skillId(catalogType, key),
      importance,
      entryExpectation,
      weight: Number((baseWeight * importanceWeight).toFixed(2))
    };
  });
}

function buildCareerRequirements(researchIndex) {
  const researchBySlug = new Map(researchIndex.roles.map((role) => [role.appSlug, role]));

  return Object.entries(CAREER_PROFILES).map(([careerSlug, profile]) => {
    const research = researchBySlug.get(careerSlug);
    if (!research) throw new Error(`${careerSlug}: no canonical research index entry`);

    return {
      careerSlug,
      titleFa: research.titleFa,
      titleEn: research.titleEn,
      softSkills: makeRequirements("soft", collectProfileKeys(profile, "soft")),
      foundationalSkills: makeRequirements("foundational", collectProfileKeys(profile, "foundational")),
      specializedSkills: makeRequirements("specialized", collectProfileKeys(profile, "specialized")),
      tools: makeRequirements("tools", collectProfileKeys(profile, "tools"))
    };
  });
}

function similarity(first, second) {
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (a === b) return 1;
  const grams = (value) => new Set([...value].slice(0, -1).map((char, index) => char + value[index + 1]));
  const firstGrams = grams(a);
  const secondGrams = grams(b);
  if (!firstGrams.size || !secondGrams.size) return 0;
  const overlap = [...firstGrams].filter((gram) => secondGrams.has(gram)).length;
  return (2 * overlap) / (firstGrams.size + secondGrams.size);
}

function validateCatalog(catalog) {
  const errors = [];
  const validTypes = new Set(["soft", "foundational", "specialized", "tool"]);
  const ids = new Set();
  const canonicalTitles = new Map();
  const searchableTerms = new Map();

  for (const item of catalog) {
    if (ids.has(item.id)) errors.push(`Duplicate skill ID: ${item.id}`);
    ids.add(item.id);
    if (!validTypes.has(item.type)) errors.push(`${item.id}: invalid type ${item.type}`);
    if (!item.titleFa || !item.titleEn || !item.descriptionFa) errors.push(`${item.id}: required field missing`);
    if (/[،,/;]|\sو\s/u.test(item.titleFa)) errors.push(`${item.id}: non-atomic Persian title ${item.titleFa}`);

    const normalizedTitle = normalizeText(item.titleFa);
    if (canonicalTitles.has(normalizedTitle)) {
      errors.push(`Duplicate normalized Persian title: ${item.titleFa}`);
    }
    canonicalTitles.set(normalizedTitle, item.id);

    for (const term of [item.titleFa, item.titleEn, ...item.aliasesFa, ...item.aliasesEn]) {
      const normalizedTerm = normalizeText(term);
      const existing = searchableTerms.get(normalizedTerm);
      if (existing && existing !== item.id) {
        errors.push(`Alias collision: ${term} maps to ${existing} and ${item.id}`);
      }
      searchableTerms.set(normalizedTerm, item.id);
    }
  }

  for (let firstIndex = 0; firstIndex < catalog.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < catalog.length; secondIndex += 1) {
      const first = catalog[firstIndex];
      const second = catalog[secondIndex];
      if (first.type !== second.type) continue;
      if (similarity(first.titleFa, second.titleFa) >= 0.93) {
        errors.push(`Unresolved near-duplicate: ${first.id} / ${second.id}`);
      }
    }
  }

  for (const item of catalog) {
    for (const relationshipId of [
      ...item.prerequisiteSkillIds,
      ...item.relatedSkillIds,
      ...item.narrowerSkillIds,
      ...(item.broaderSkillId ? [item.broaderSkillId] : [])
    ]) {
      if (!ids.has(relationshipId)) errors.push(`${item.id}: unknown relationship ${relationshipId}`);
    }
  }

  return errors;
}

function validateRequirements(catalog, records, researchIndex) {
  const errors = [];
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const canonicalSlugs = new Set(researchIndex.roles.map((role) => role.appSlug));
  const recordSlugs = new Set(records.map((record) => record.careerSlug));
  const validImportance = new Set(["core", "important", "useful"]);
  const validExpectation = new Set(["awareness", "basic", "working", "advanced"]);
  const weakCoverage = [];

  if (records.length !== 58 || canonicalSlugs.size !== 58) {
    errors.push(`Expected 58 canonical records, found requirements=${records.length}, research=${canonicalSlugs.size}`);
  }
  for (const slug of canonicalSlugs) {
    if (!recordSlugs.has(slug)) errors.push(`Missing career requirement record: ${slug}`);
  }
  for (const legacySlug of ["social-media-content-creation", "social-media-management", "social-media-and-community", "social-media-and-community-13kpqt"]) {
    if (recordSlugs.has(legacySlug)) errors.push(`Legacy social-media path returned as canonical: ${legacySlug}`);
  }

  for (const record of records) {
    const allRequirements = [
      ...record.softSkills,
      ...record.foundationalSkills,
      ...record.specializedSkills,
      ...record.tools
    ];
    const requirementIds = new Set();
    for (const requirement of allRequirements) {
      const item = catalogById.get(requirement.skillId);
      if (!item) errors.push(`${record.careerSlug}: unknown skill ${requirement.skillId}`);
      if (requirementIds.has(requirement.skillId)) errors.push(`${record.careerSlug}: duplicate ${requirement.skillId}`);
      requirementIds.add(requirement.skillId);
      if (!validImportance.has(requirement.importance)) errors.push(`${record.careerSlug}: invalid importance`);
      if (!validExpectation.has(requirement.entryExpectation)) errors.push(`${record.careerSlug}: invalid entry expectation`);
      if (!Number.isFinite(requirement.weight) || requirement.weight <= 0) errors.push(`${record.careerSlug}: invalid weight`);
    }

    const typedGroups = [
      ["soft", record.softSkills, "soft"],
      ["foundational", record.foundationalSkills, "foundational"],
      ["specialized", record.specializedSkills, "specialized"],
      ["tool", record.tools, "tool"]
    ];
    for (const [label, requirements, expectedType] of typedGroups) {
      for (const requirement of requirements) {
        const actualType = catalogById.get(requirement.skillId)?.type;
        if (actualType && actualType !== expectedType) {
          errors.push(`${record.careerSlug}: ${requirement.skillId} is ${actualType}, not ${label}`);
        }
      }
    }

    const categoryLengths = [
      record.softSkills.length,
      record.foundationalSkills.length,
      record.specializedSkills.length,
      record.tools.length
    ];
    if (allRequirements.length < 16 || categoryLengths.some((count) => count < 4)) {
      weakCoverage.push(record.careerSlug);
    }
    if (record.softSkills.length > 8 || record.foundationalSkills.length > 8 || record.specializedSkills.length > 12 || record.tools.length > 10) {
      errors.push(`${record.careerSlug}: category exceeds curation guidance`);
    }
  }

  return { errors, weakCoverage };
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const researchIndex = JSON.parse(await readFile(researchIndexPath, "utf8"));
  const catalog = buildCatalog();
  const records = buildCareerRequirements(researchIndex);
  const catalogErrors = validateCatalog(catalog);
  const requirementAudit = validateRequirements(catalog, records, researchIndex);
  const errors = [...catalogErrors, ...requirementAudit.errors];

  if (errors.length) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  const catalogPayload = {
    schemaVersion: 1,
    generatedFrom: "curated-career-research-reconciliation",
    itemCount: catalog.length,
    items: catalog
  };
  const requirementsPayload = {
    schemaVersion: 1,
    canonicalCareerCount: records.length,
    scoringDefaults: {
      haveMultiplier: 1,
      interestedMultiplier: 0.62,
      missingCorePenalty: 0.16,
      interestedCorePenaltyMultiplier: 0.45
    },
    records
  };
  await writeJson(catalogPath, catalogPayload);
  await writeJson(requirementsPath, requirementsPayload);

  const typeCounts = Object.fromEntries(Object.keys(TYPE_PREFIX).map((type) => [
    type,
    catalog.filter((item) => item.type === type).length
  ]));
  const aliasCount = catalog.reduce((sum, item) => sum + item.aliasesFa.length + item.aliasesEn.length, 0);
  const coverageCounts = records.map((record) => (
    record.softSkills.length
    + record.foundationalSkills.length
    + record.specializedSkills.length
    + record.tools.length
  ));
  const audit = [
    "# Useravaa Career Skill Ontology Audit v1",
    "",
    "## Summary",
    "",
    `- Canonical career paths covered: **${records.length} / 58**`,
    `- Catalog items: **${catalog.length}**`,
    `- Soft skills: **${typeCounts.soft}**`,
    `- Foundational skills: **${typeCounts.foundational}**`,
    `- Specialized skills: **${typeCounts.specialized}**`,
    `- Tools and systems: **${typeCounts.tool}**`,
    `- Search aliases: **${aliasCount}**`,
    `- Explicit duplicate resolutions through aliases: **${aliasCount}**`,
    "- Unresolved normalized-title collisions: **0**",
    "- Unresolved near-duplicate catalog entries: **0**",
    "- Unknown career requirement references: **0**",
    `- Paths with weak data coverage: **${requirementAudit.weakCoverage.length}**`,
    `- Requirement count range: **${Math.min(...coverageCounts)}–${Math.max(...coverageCounts)}**`,
    `- Average requirements per career: **${(coverageCounts.reduce((sum, count) => sum + count, 0) / coverageCounts.length).toFixed(1)}**`,
    "",
    "## Curation Method",
    "",
    "The ontology is curated from the 59 private source reports reconciled to the approved 58-path taxonomy, the approved career-card data, and the current product-page content. Raw noun phrases are not copied into the catalog. Combined phrases are split, software is classified as tools, transferable capabilities are separated from role-specific capabilities, and ordering inside each curated profile controls importance and entry expectation.",
    "",
    "## Social Media Reconciliation",
    "",
    "Only `social-media-marketing` is canonical. Content-production evidence and channel-management evidence feed one requirement record. Legacy social-media slugs are rejected by validation.",
    "",
    "## Weak Coverage",
    "",
    ...(requirementAudit.weakCoverage.length
      ? requirementAudit.weakCoverage.map((slug) => `- \`${slug}\``)
      : ["No path falls below the minimum category or total requirement thresholds."]),
    ""
  ].join("\n");
  await mkdir(path.dirname(auditPath), { recursive: true });
  await writeFile(auditPath, audit);

  process.stdout.write([
    `Generated ${catalog.length} normalized catalog items.`,
    `Generated ${records.length} canonical career requirement records.`,
    `Aliases: ${aliasCount}.`,
    `Weak coverage paths: ${requirementAudit.weakCoverage.length}.`,
    "Ontology issues: 0."
  ].join("\n") + "\n");
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
