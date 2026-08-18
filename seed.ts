import bcrypt from "bcryptjs";
import { prisma } from "./src/config/prisma.js";

const PASSWORD = "123456";

// Deterministic PRNG so re-seeding produces identical, stable data.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(20260818);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const c = [...arr];
  const out: T[] = [];
  while (out.length < n && c.length) {
    out.push(c.splice(Math.floor(rand() * c.length), 1)[0]);
  }
  return out;
};
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^_+|_+$/g, "");

async function main() {
  console.log("🧹 Clearing existing data...");
  await wipeAll();
  console.log("✅ Existing data cleared.");

  const hashed = await bcrypt.hash(PASSWORD, 12);

  // ── 1. Education levels & subjects ──────────────────────────
  console.log("📚 Seeding education data...");
  const groups: Record<string, string> = {};
  const levelNames: Record<string, string> = {};
  const subjectIds: Record<string, string> = {};
  const categories: Record<string, string> = {};

  const groupDefs: Array<[string, number]> = [
    ["Primary", 1], ["Secondary", 2], ["Higher Secondary", 3], ["University", 4], ["Skills & Tests", 5],
  ];
  for (const [g, order] of groupDefs) {
    const grp = await prisma.educationLevelGroup.create({ data: { name: g, sort_order: order } });
    groups[g] = grp.id;
  }

  const levelDefs: Array<[string, string, number]> = [
    ["Primary", "Class 1", 1], ["Primary", "Class 2", 2], ["Primary", "Class 3", 3],
    ["Primary", "Class 4", 4], ["Primary", "Class 5", 5],
    ["Secondary", "Class 6", 6], ["Secondary", "Class 7", 7], ["Secondary", "Class 8", 8],
    ["Secondary", "Class 9", 9], ["Secondary", "Class 10", 10],
    ["Higher Secondary", "HSC (Science)", 11], ["Higher Secondary", "HSC (Commerce)", 12],
    ["Higher Secondary", "HSC (Arts)", 13],
    ["University", "Undergraduate (Honours)", 14], ["University", "Masters", 15],
    ["Skills & Tests", "IELTS", 16], ["Skills & Tests", "Admission Test", 17],
  ];
  for (const [g, n, order] of levelDefs) {
    const lvl = await prisma.educationLevel.create({ data: { group_id: groups[g], name: n, sort_order: order } });
    levelNames[`${g}:${n}`] = lvl.id;
    levelNames[n] = lvl.id;
  }

  const catDefs: Array<[string, number]> = [
    ["Science", 1], ["Commerce", 2], ["Arts & Humanities", 3], ["Language", 4], ["ICT & Computer", 5],
  ];
  for (const [c] of catDefs) {
    const cat = await prisma.subjectCategory.create({ data: { name: c } });
    categories[c] = cat.id;
  }

  const subjectDefs: Array<[string, string]> = [
    ["Science", "Physics"], ["Science", "Chemistry"], ["Science", "Biology"],
    ["Science", "Mathematics"], ["Science", "Higher Mathematics"],
    ["Science", "General Science"], ["Science", "Statistics"],
    ["Commerce", "Accounting"], ["Commerce", "Finance"], ["Commerce", "Business Studies"],
    ["Commerce", "Economics"],
    ["Arts & Humanities", "Bangla"], ["Arts & Humanities", "English Literature"],
    ["Arts & Humanities", "History"], ["Arts & Humanities", "Civics"],
    ["Language", "English"], ["Language", "Arabic"], ["Language", "Spoken English"],
    ["ICT & Computer", "ICT"], ["ICT & Computer", "Computer Science"],
    ["ICT & Computer", "Programming (Python/C)"], ["ICT & Computer", "Digital Marketing"],
  ];
  for (const [c, n] of subjectDefs) {
    const subj = await prisma.subject.create({ data: { category_id: categories[c], name: n } });
    subjectIds[n] = subj.id;
  }

  // ── 2. Subscription packages ───────────────────────────────
  console.log("💳 Seeding subscription packages...");
  const packages: Record<string, string> = {};
  const pkgDefs: Array<{ name: string; slug: string; desc: string; monthly: number; quarterly: number; yearly: number; lifetime?: number; max_services: number; max_batches: number; max_students: number | null; featured?: boolean; badge?: string; features: Array<[string, boolean]> }> = [
    {
      name: "Free", slug: "free", desc: "For teachers just getting started. Create one service and connect with students.",
      monthly: 0, quarterly: 0, yearly: 0, lifetime: 0, max_services: 1, max_batches: 1, max_students: 20,
      features: [["1 active service", true], ["1 batch per service", true], ["Up to 20 students per batch", true], ["Basic analytics", false], ["Data export", false]],
    },
    {
      name: "Basic", slug: "basic", desc: "Everything you need to run a small coaching class smoothly.",
      monthly: 199, quarterly: 549, yearly: 1999, max_services: 3, max_batches: 3, max_students: 50,
      features: [["3 active services", true], ["3 batches per service", true], ["Up to 50 students per batch", true], ["Attendance tracking", true], ["Task & daily notes", true], ["Data export", false]],
    },
    {
      name: "Pro", slug: "pro", desc: "For established teachers with multiple batches and bigger student groups.",
      monthly: 499, quarterly: 1349, yearly: 4999, max_services: 6, max_batches: 6, max_students: 120, featured: true, badge: "Most Popular",
      features: [["6 active services", true], ["6 batches per service", true], ["Up to 120 students per batch", true], ["Full analytics", true], ["Data export", true], ["Priority support", true]],
    },
    {
      name: "Elite", slug: "elite", desc: "Maximum capacity and premium tools for coaching centers.",
      monthly: 999, quarterly: 2699, yearly: 9999, lifetime: 19999, max_services: 15, max_batches: 15, max_students: null,
      features: [["15 active services", true], ["15 batches per service", true], ["Unlimited students", true], ["Full analytics", true], ["Data export", true], ["Dedicated manager", true]],
    },
  ];
  for (const p of pkgDefs) {
    const pkg = await prisma.subscriptionPackage.create({
      data: {
        name: p.name, slug: p.slug, description: p.desc, status: "ACTIVE",
        price_monthly: p.monthly, price_quarterly: p.quarterly, price_yearly: p.yearly, price_lifetime: p.lifetime,
        max_services: p.max_services, max_batches_per_service: p.max_batches, max_students_per_batch: p.max_students,
        can_use_online: true, can_use_offline: true, can_use_analytics: p.slug !== "free", can_export_data: p.slug === "pro" || p.slug === "elite",
        is_featured: !!p.featured, badge_label: p.badge,
      },
    });
    packages[p.slug] = pkg.id;
    for (const [label, incl] of p.features) {
      await prisma.packageFeature.create({ data: { package_id: pkg.id, label, is_included: incl } });
    }
  }

  // ── 3. Super Admin ─────────────────────────────────────────
  console.log("👑 Creating super admin...");
  const admin = await prisma.admin.create({
    data: {
      full_name: "EduConnect Super Admin",
      email: "superadmin@ec.com",
      password: hashed,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  // ── 4. Users (100 total incl. test accounts) ───────────────
  console.log("👥 Creating 100 users...");

  const maleFirst = ["Md. Abdul", "Tanvir", "Arif", "Rakib", "Fahim", "Sohel", "Naimur", "Sabbir", "Omar", "Emran", "Rifat", "Biplob", "Monir", "Hasan", "Mahmudul", "Mehedi", "Kamrul", "Rafiqul", "Shahriar", "Jahidul", "Shakib", "Nahid", "Abir", "Tawhid", "Sadman", "Efty", "Rasel", "Delwar", "Mizanur", "Shafiq"];
  const femaleFirst = ["Sadia", "Nusrat", "Mim", "Tahmina", "Jannatul", "Ritu", "Priya", "Tanjila", "Ayesha", "Moumita", "Fariha", "Popy", "Sara", "Sharmin", "Sabina", "Taslima", "Nasrin", "Shirin", "Rokeya", "Fatema", "Sumaiya", "Nabila", "Arisha", "Lamia", "Farzana", "Moushumi", "Runa", "Tania", "Dina", "Sultana"];
  const lastNames = ["Islam", "Ahmed", "Rahman", "Hasan", "Hossain", "Chowdhury", "Khan", "Akter", "Begum", "Sultana", "Alam", "Karim", "Mia", "Roy", "Saha", "Dey", "Paul", "Haldar", "Sarker", "Mondol", "Khatun", "Molla"];
  const cities = [
    ["Dhaka", ["Dhanmondi", "Uttara", "Mirpur", "Mohammadpur", "Banani", "Gulshan", "Badda", "Khilgaon", "Mohakhali", "Pallabi", "Rampura", "Moghbazar", "Tejgaon", "Demra", "Sabujbagh", "Kamrangirchar", "Bashundhara"]],
    ["Chattogram", ["GEC", "Agrabad", "Nasirabad", "Halishahar", "Patiya", "Oxygen", "Kotwali"]],
    ["Sylhet", ["Zindabazar", "Ambarkhana", "Mirabazar", "Kumarpara", "Shibganj"]],
    ["Rajshahi", ["Shaheb Bazar", "Upashahar", "Police Line"]],
    ["Khulna", ["Sonadanga", "Boyra", "Khalishpur", "Daulatpur"]],
    ["Barishal", ["Sadar Road", "Rupatali", "Nathullabad"]],
    ["Gazipur", ["Tongi", "Chowrasta"]],
    ["Rangpur", ["Jahaj Company"]],
    ["Mymensingh", ["Rasulpur"]],
    ["Cumilla", ["Kandirpar"]],
  ] as Array<[string, string[]]>;
  const studentInstitutions = ["Notre Dame College", "Dhaka College", "Viqarunnisa Noon School", "Adamjee Cantonment College", "Holy Cross Girls School", "Chittagong College", "Rajshahi College", "Sylhet Government College", "Khulna Collegiate School", "Barishal Zilla School", "Blue Bird School", "Mirpur Girls Ideal", "Khulna Public College", "Hazi Mohammad Mohsin College", "Academia School", "Cantonment Public School", "Mymensingh Girls Cadet", "Sylhet Commerce College"];
  const studentLevels = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "HSC (Science)", "HSC (Commerce)", "HSC (Arts)"];
  const occupations = ["Government Service", "Businessman", "Engineer", "Doctor", "Housewife", "School Teacher", "NGO Worker", "Retired Banker", "Farmer", "Private Job", "Journalist", "Banker", "Advocate", "Pharmacist", "Textile Business"];

  type TeacherSeed = { user: any; subject: string; levels: string[] };
  const teachers: any[] = [];
  const students: any[] = [];
  const guardians: any[] = [];
  const centers: any[] = [];
  const allUsers: any[] = [];

  const usedSlugs = new Set<string>();
  const makeUnique = (base: string) => {
    let slug = base;
    let i = 1;
    while (usedSlugs.has(slug)) slug = `${base}${i++}`;
    usedSlugs.add(slug);
    return slug;
  };

  // Test accounts first so their emails/usernames are exact.
  const testSeeds: Array<{ role: string; full_name: string; email: string; username: string; gender: string; dob: string; bio: string }> = [
    { role: "TEACHER", full_name: "Robiul Alam", email: "teacher@ec.com", username: "robiulalamdev", gender: "MALE", dob: "1992-04-15", bio: "Physics and Higher Math teacher with 8 years of experience. I help HSC and admission candidates crack the toughest problems with a friendly, step-by-step approach." },
    { role: "STUDENT", full_name: "Tanvir Ahmed", email: "student@ec.com", username: "tanvirahmed", gender: "MALE", dob: "2007-06-21", bio: "HSC 2nd year (Science) student. Preparing for BUET admission. Love solving physics puzzles and playing cricket with friends." },
    { role: "GUARDIAN", full_name: "Md. Abdul Karim", email: "guardian@ec.com", username: "abdulkarim", gender: "MALE", dob: "1975-11-02", bio: "Father of two school children. Looking for reliable teachers who actually track attendance and share regular progress notes." },
  ];

  const createUser = async (opts: {
    role: string; full_name: string; email: string; username: string; gender: string; dob: string; bio: string;
    city?: string; area?: string; address?: string;
    tagline?: string; exp?: number; quals?: string; achievements?: string;
    institution?: string; level?: string; roll?: string;
    occupation?: string; website?: string; established?: number; tradeLicense?: string;
  }) => {
    const [city, areas] = pick(cities);
    const area = opts.area || pick(areas);
    const user = await prisma.user.create({
      data: {
        role: opts.role as any,
        username: opts.username,
        full_name: opts.full_name,
        email: opts.email,
        password: hashed,
        phone: `017${String(10000000 + Math.floor(rand() * 89999999))}`,
        gender: opts.gender as any,
        date_of_birth: new Date(opts.dob),
        bio: opts.bio,
        country: "Bangladesh",
        state: city,
        city,
        area,
        address_line: opts.address || `${pick(["House", "Flat", "Road", "Sector", "Block"])} ${Math.floor(rand() * 90) + 1}`,
        is_email_verified: true,
        email_verified_at: new Date(),
        status: "ACTIVE",
        is_approved: opts.role === "TEACHER" || opts.role === "COACHING_CENTER",
      },
    });

    if (opts.role === "TEACHER") {
      await prisma.teacherProfile.create({
        data: { user_id: user.id, tagline: opts.tagline, experience_years: opts.exp, qualifications: opts.quals, achievements: opts.achievements },
      });
      teachers.push(user);
    } else if (opts.role === "STUDENT") {
      await prisma.studentProfile.create({
        data: {
          user_id: user.id,
          institution_name: opts.institution,
          education_level_id: opts.level ? levelNames[opts.level] : undefined,
          roll_number: opts.roll || String(Math.floor(rand() * 9000) + 100),
        },
      });
      students.push(user);
    } else if (opts.role === "GUARDIAN") {
      await prisma.guardianProfile.create({ data: { user_id: user.id, occupation: opts.occupation } });
      guardians.push(user);
    } else {
      await prisma.coachingCenterProfile.create({
        data: { user_id: user.id, trade_license_number: opts.tradeLicense, established_year: opts.established, website: opts.website },
      });
      centers.push(user);
    }

    await prisma.notificationPreference.create({
      data: { user_id: user.id, in_app_enabled: true, email_enabled: true, push_enabled: true, social_notifications: true, message_notifications: true, task_notifications: true, attendance_notifications: true, announcement_notifications: true, enrollment_notifications: true, payment_notifications: true },
    });

    if (opts.role === "TEACHER") {
      const pkgSlug = opts.email === "teacher@ec.com" ? "pro" : pick(["basic", "pro", "pro", "elite"]);
      await prisma.userSubscription.create({
        data: { user_id: user.id, package_id: packages[pkgSlug], status: "ACTIVE", billing_cycle: "MONTHLY", started_at: new Date(), amount_paid: pkgSlug === "elite" ? 999 : pkgSlug === "pro" ? 499 : 199, payment_method: "BKASH", transaction_id: `TXN${Math.random().toString(36).slice(2, 10).toUpperCase()}` },
      });
    }

    allUsers.push(user);
    return user;
  };

  // Test accounts (exact emails/usernames)
  const testTeacher = await createUser({ ...testSeeds[0], city: "Dhaka", area: "Dhanmondi", tagline: "Physics & Higher Math — HSC + Admission", exp: 8, quals: "MSc in Physics, University of Dhaka", achievements: "Produced 12 HSC GPA-5 students in 2024; mentor of 2 BUET admittees" });
  await createUser({ ...testSeeds[1], city: "Dhaka", area: "Uttara", institution: "Notre Dame College", level: "HSC (Science)", roll: "20230127" });
  await createUser({ ...testSeeds[2], city: "Dhaka", area: "Mirpur", occupation: "Government Service" });

  // Teacher specialties
  const specialties: Array<{ name: string; gender: "MALE" | "FEMALE"; subject: string; levels: string[]; tagline: string; quals: string }> = [
    { name: "Physics", gender: "MALE", subject: "Physics", levels: ["HSC (Science)", "Admission Test"], tagline: "Physics & Higher Math — HSC + Admission", quals: "MSc in Physics, University of Dhaka" },
    { name: "Chemistry", gender: "FEMALE", subject: "Chemistry", levels: ["Class 9", "Class 10", "HSC (Science)"], tagline: "Chemistry made easy — HSC & Varsity", quals: "MSc in Chemistry, Jahangirnagar University" },
    { name: "Biology", gender: "FEMALE", subject: "Biology", levels: ["Class 9", "Class 10", "HSC (Science)"], tagline: "Biology through diagrams & mnemonics", quals: "MSc in Botany, University of Rajshahi" },
    { name: "Mathematics", gender: "MALE", subject: "Mathematics", levels: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "HSC (Science)"], tagline: "Math that actually makes sense", quals: "MSc in Mathematics, University of Dhaka" },
    { name: "English", gender: "FEMALE", subject: "English", levels: ["IELTS", "Undergraduate (Honours)"], tagline: "IELTS & Spoken English Trainer", quals: "B.A. in English, NSU" },
    { name: "ICT", gender: "MALE", subject: "ICT", levels: ["HSC (Science)", "HSC (Commerce)", "Undergraduate (Honours)"], tagline: "ICT + Programming with real projects", quals: "BSc in CSE, BUET" },
    { name: "Accounting", gender: "MALE", subject: "Accounting", levels: ["HSC (Commerce)"], tagline: "Accounting simplified for HSC & BBA", quals: "MBA (Finance), SUST" },
    { name: "Economics", gender: "FEMALE", subject: "Economics", levels: ["HSC (Commerce)", "Undergraduate (Honours)"], tagline: "Economics through real-world stories", quals: "MSS in Economics, University of Chittagong" },
    { name: "Bangla", gender: "FEMALE", subject: "Bangla", levels: ["Class 9", "Class 10", "HSC (Arts)"], tagline: "Bangla literature with passion", quals: "MA in Bangla, University of Dhaka" },
    { name: "Higher Math", gender: "MALE", subject: "Higher Mathematics", levels: ["HSC (Science)"], tagline: "Calculus made visual", quals: "MSc in Applied Math, BUET" },
  ];

  // 27 more teachers (specialty repeated across name pool)
  const teacherSpecs: Array<{ spec: (typeof specialties)[number]; full_name: string; gender: "MALE" | "FEMALE" }> = [];
  const specIndex: Record<string, number> = {};
  const allTeacherFirst = [...maleFirst, ...femaleFirst];
  for (let i = 0; i < 27; i++) {
    const spec = specialties[i % specialties.length];
    const g = spec.gender;
    const firstPool = g === "MALE" ? maleFirst : femaleFirst;
    const full_name = `${pick(firstPool)} ${pick(lastNames)}`;
    const slug = makeUnique(slugify(full_name));
    teacherSpecs.push({ spec, full_name, gender: g });
    const city = pick(cities)[0];
    await createUser({
      role: "TEACHER", full_name, email: `${slug}${(specIndex[spec.name] = (specIndex[spec.name] || 0) + 1)}@mail.com`, username: slug, gender: g, dob: `${1984 + Math.floor(rand() * 12)}-${String(Math.floor(rand() * 12) + 1).padStart(2, "0")}-${String(Math.floor(rand() * 27) + 1).padStart(2, "0")}`,
      bio: `${spec.subject} teacher. ${spec.tagline}. I help students build strong fundamentals and exam confidence.`,
      city, area: pick(city === "Dhaka" ? cities[0][1] : city === "Chattogram" ? cities[1][1] : cities[2][1]),
      tagline: spec.tagline, exp: 4 + Math.floor(rand() * 10), quals: spec.quals, achievements: `Produced ${Math.floor(rand() * 20) + 5} GPA-5 students in recent years`,
    });
  }

  // 45 students
  for (let i = 0; i < 45; i++) {
    const g = Math.random() > 0.5 ? "FEMALE" : "MALE";
    const firstPool = g === "FEMALE" ? femaleFirst : maleFirst;
    const full_name = `${pick(firstPool)} ${pick(lastNames)}`;
    const slug = makeUnique(slugify(full_name));
    const level = pick(studentLevels);
    const city = pick(cities)[0];
    await createUser({
      role: "STUDENT", full_name, email: `${slug}${i}@mail.com`, username: slug, gender: g, dob: `${2005 + Math.floor(rand() * 5)}-${String(Math.floor(rand() * 12) + 1).padStart(2, "0")}-${String(Math.floor(rand() * 27) + 1).padStart(2, "0")}`,
      bio: `${level} student at ${pick(studentInstitutions)}. ${["Dreaming of studying medicine.", "Preparing for BUET admission.", "Aspiring engineer.", "Passionate about science and math.", "Future CA/accountant.", "Love reading and writing."][i % 6]}`,
      city, area: pick(city === "Dhaka" ? cities[0][1] : city === "Chattogram" ? cities[1][1] : cities[2][1]),
      institution: pick(studentInstitutions), level, roll: String(Math.floor(rand() * 9000) + 100),
    });
  }

  // 15 guardians
  for (let i = 0; i < 15; i++) {
    const g = Math.random() > 0.4 ? "MALE" : "FEMALE";
    const firstPool = g === "MALE" ? maleFirst : femaleFirst;
    const full_name = `${pick(firstPool)} ${pick(lastNames)}`;
    const slug = makeUnique(slugify(full_name));
    const city = pick(cities)[0];
    await createUser({
      role: "GUARDIAN", full_name, email: `${slug}${i}@mail.com`, username: slug, gender: g, dob: `${1970 + Math.floor(rand() * 16)}-${String(Math.floor(rand() * 12) + 1).padStart(2, "0")}-${String(Math.floor(rand() * 27) + 1).padStart(2, "0")}`,
      bio: `Guardian looking for a dependable teacher. ${["I value structured learning and regular progress updates.", "Prefer teachers who share attendance and homework updates regularly.", "Looking for supportive tutors who genuinely care about results."][i % 3]}`,
      city, area: pick(city === "Dhaka" ? cities[0][1] : city === "Chattogram" ? cities[1][1] : cities[2][1]),
      occupation: pick(occupations),
    });
  }

  // 10 coaching centers
  const centerNames = ["Ideal Coaching Center", "Bondhon Academy", "Bright Future Coaching", "Star Educational Academy", "Sahitto Ghar Academy", "Prottasha Coaching House", "Nondon Coaching Center", "Shikkha Bikash Academy", "Uttoron Coaching Center", "Alok Pot Coaching Academy"];
  for (let i = 0; i < 10; i++) {
    const full_name = centerNames[i];
    const slug = makeUnique(slugify(full_name));
    const city = pick(cities)[0];
    await createUser({
      role: "COACHING_CENTER", full_name, email: `${slug}@mail.com`, username: slug, gender: "OTHER", dob: `${2005 + Math.floor(rand() * 8)}-01-01`,
      bio: `A trusted coaching center offering SSC & HSC batches. Experienced faculty, small batches, and monthly progress reports to guardians.`,
      city, area: pick(city === "Dhaka" ? cities[0][1] : city === "Chattogram" ? cities[1][1] : cities[2][1]),
      website: `www.${slug}.com`, established: 2005 + Math.floor(rand() * 15), tradeLicense: `TL-${Math.floor(100000 + Math.random() * 900000)}`,
    });
  }

  console.log(`   → ${allUsers.length} users created (${teachers.length} teachers, ${students.length} students, ${guardians.length} guardians, ${centers.length} centers)`);

  // ── 5. Services & batches ─────────────────────────────────
  console.log("📦 Seeding services & batches...");
  const services: any[] = [];
  const titleBySubject: Record<string, string[]> = {
    Physics: ["HSC Physics + Higher Math Mastery", "Physics Foundation — HSC & Admission", "Physics Crash Course for Board Exam"],
    Chemistry: ["Chemistry Made Easy — HSC Batch", "Chemistry Foundation SSC + HSC", "Organic Chemistry Intensive"],
    Biology: ["Biology — Diagram to Board Marks", "Biology for SSC & HSC", "Medical Admission Biology"],
    Mathematics: ["SSC & HSC Math Foundation", "Math that Makes Sense", "Higher Math Problem Solving"],
    English: ["IELTS Band 7+ Training (Online)", "Spoken English & IELTS Foundation", "English Grammar & Writing Skills"],
    ICT: ["ICT & Programming Bootcamp", "Python + C for Beginners", "CSE Foundation — Python & DSA"],
    Accounting: ["HSC Accounting & Finance", "Partnership Accounts Mastery", "BBA Foundation Accounts"],
    Economics: ["Economics — HSC & BBA Foundation", "Micro & Macro Economics Explained"],
    Bangla: ["Bangla 1st & 2nd Paper Masterclass", "Bangla Creative Writing Workshop"],
    "Higher Mathematics": ["Higher Math — Calculus to Vector", "Admission Math Sprint"],
  };
  const serviceDesc: Record<string, string> = {
    Physics: "Complete Physics course covering every chapter of the syllabus, weekly tests, past-board solution sessions, and small batches so every student gets personal attention.",
    Chemistry: "Organic + Inorganic + Physical chemistry with visual explanations, chapter summaries, and weekly doubt-clearing sessions. Perfect for board exam success.",
    Biology: "Biology with heavy focus on diagrams and previous board questions. Mnemonics to remember classifications. Weekly quick quizzes.",
    Mathematics: "Build rock-solid math fundamentals from algebra basics to complex calculus. Regular worksheets and homework review.",
    English: "Interactive classes focused on speaking and exam strategy. Weekly mock tests, small group practice, and personalized feedback.",
    ICT: "HSC ICT syllabus plus real programming (C & Python). Project-based classes where students build real things.",
    Accounting: "Accounting and Finance with real business examples, ledger practice, and board-question drills. Classes twice a week.",
    Economics: "Micro and macro economics explained with real Bangladesh context. News-based discussions make abstract concepts concrete.",
    Bangla: "Comprehensive Bangla preparation with creative writing workshops, grammar drills, and famous prose/poem analysis.",
    "Higher Mathematics": "Deep dive into calculus, matrices, and vector analysis with tons of practice problems for HSC science students.",
  };

  const teacherSpecialty = new Map<string, { subject: string; levels: string[] }>();
  teacherSpecialty.set(testTeacher.id, { subject: "Physics", levels: ["HSC (Science)", "Admission Test"] });
  for (const t of teachers.slice(1)) {
    const spec = specialties[t ? (teachers.indexOf(t) - 1) % specialties.length : 0];
    teacherSpecialty.set(t.id, { subject: spec.subject, levels: spec.levels });
  }

  for (const t of teachers) {
    const spec = teacherSpecialty.get(t.id)!;
    const subj = spec.subject;
    const titles = titleBySubject[subj] || [`${subj} Masterclass`];
    const title = titles[Math.floor(rand() * titles.length)];
    const slug = makeUnique(slugify(title));
    const mode = pick(["ONLINE", "OFFLINE", "HYBRID", "ONLINE"]);
    const format = pick(["BATCH", "BATCH", "INDIVIDUAL"]);
    const svc = await prisma.service.create({
      data: {
        teacher_id: t.id,
        title,
        slug,
        description: serviceDesc[subj] || "A structured coaching service with regular tests and personal attention.",
        format: format as any,
        mode: mode as any,
        status: "ACTIVE",
        country: "Bangladesh",
        state: t.state || "Dhaka",
        city: t.city || "Dhaka",
        area: t.area || "Dhanmondi",
        meeting_platform: mode !== "OFFLINE" ? pick(["Google Meet", "Zoom"]) : null,
        joining_fee: 300 + Math.floor(rand() * 700),
        monthly_fee: 1500 + Math.floor(rand() * 3500),
        per_session_fee: format === "INDIVIDUAL" ? 600 + Math.floor(rand() * 500) : null,
        currency: "BDT",
      },
    });
    for (const sub of subj === "Higher Mathematics" ? ["Higher Mathematics"] : subj === "Physics" ? ["Physics", "Higher Mathematics"] : [subj]) {
      if (subjectIds[sub]) await prisma.serviceSubject.create({ data: { service_id: svc.id, subject_id: subjectIds[sub] } });
    }
    for (const lvl of spec.levels) {
      const l = levelNames[lvl];
      if (l) await prisma.serviceLevel.create({ data: { service_id: svc.id, level_id: l } });
    }
    for (const [method, accName, instructions] of pickN([["BKASH", t.phone, "Send money to this bKash number"], ["NAGAD", t.phone, "Nagad payment accepted"], ["CASH", "", "Pay in cash at the center"], ["ROCKET", t.phone, "Rocket available"]], 2)) {
      await prisma.servicePaymentMethod.create({
        data: { service_id: svc.id, method: method as any, account_name: accName || null, account_number: accName || null, instructions },
      });
    }
    services.push(svc);
  }
  console.log(`   → ${services.length} services created`);

  // Batches — 2 per BATCH-format service (where possible), some COMPLETED/UPCOMING
  const batches: any[] = [];
  for (const svc of services) {
    const t = teachers.find((x) => x.id === svc.teacher_id);
    const spec = teacherSpecialty.get(svc.teacher_id!)!;
    const subjName = spec.subject;
    for (let bi = 0; bi < 2; bi++) {
      const status = bi === 0 ? "ONGOING" : rand() > 0.35 ? "UPCOMING" : "COMPLETED";
      const dayPools: Array<[string, string, string]> = [["SUNDAY", "17:00", "18:30"], ["MONDAY", "16:00", "17:30"], ["TUESDAY", "17:00", "18:30"], ["WEDNESDAY", "08:00", "09:30"], ["THURSDAY", "17:00", "18:30"], ["FRIDAY", "09:00", "11:00"], ["SATURDAY", "10:00", "12:00"]];
      const batch = await prisma.batch.create({
        data: {
          service_id: svc.id,
          name: `${svc.title} — ${bi === 0 ? "Batch A" : "Batch B"}`,
          description: `${subjName} class batch for serious students. ${pick(["Evening batch, 3 classes per week.", "Weekend-only batch for busy students.", "Morning batch for college students.", "Project-based practical sessions included."])}`,
          status: status as any,
          max_students: 20 + Math.floor(rand() * 25),
          start_date: new Date(status === "COMPLETED" ? "2026-01-05" : status === "UPCOMING" ? "2026-09-05" : "2026-06-01"),
          end_date: status === "COMPLETED" ? new Date("2026-07-30") : null,
        },
      });
      const days = pickN(dayPools, bi === 0 ? 3 : 2);
      for (const [day, st, et] of days) {
        await prisma.batchSchedule.create({ data: { batch_id: batch.id, day: day as any, start_time: st, end_time: et } }).catch(() => {});
      }
      const chat = await prisma.chat.create({ data: { type: "BATCH_GROUP", batch_id: batch.id, name: batch.name, service_id: svc.id } });
      await prisma.chatParticipant.create({ data: { chat_id: chat.id, user_id: svc.teacher_id } });
      batches.push(batch);
    }
  }
  console.log(`   → ${batches.length} batches created`);

  // ── 6. Enrollments ────────────────────────────────────────
  console.log("🎓 Seeding enrollments...");
  const enrollments: any[] = [];
  const studentProfiles = await prisma.studentProfile.findMany({ select: { id: true, user_id: true } });

  for (const batch of batches) {
    const n = Math.min(studentProfiles.length, 4 + Math.floor(rand() * 5));
    const members = pickN(studentProfiles, n);
    for (const sp of members) {
      const enr = await prisma.enrollment.create({
        data: { batch_id: batch.id, student_profile_id: sp.id, status: "APPROVED", enrolled_at: new Date(), invited_by_teacher: false },
      }).catch(() => null);
      if (!enr) continue;
      enrollments.push(enr);
      await prisma.batch.update({ where: { id: batch.id }, data: { enrolled_count: { increment: 1 } } }).catch(() => {});
      const batchChat = await prisma.chat.findUnique({ where: { batch_id: batch.id } });
      if (batchChat) {
        await prisma.chatParticipant.create({ data: { chat_id: batchChat.id, user_id: sp.user_id } }).catch(() => {});
      }
    }
  }

  // Pending / waitlisted enrollments for realism
  const batch0 = batches[0];
  const spIds = studentProfiles.map((s) => s.id);
  for (let i = 0; i < 6; i++) {
    const sp = studentProfiles[i % studentProfiles.length];
    await prisma.enrollment.create({ data: { batch_id: batch0.id, student_profile_id: sp.id, status: "PENDING", invited_by_teacher: false } }).catch(() => {});
  }
  await prisma.enrollment.create({ data: { batch_id: batch0.id, student_profile_id: studentProfiles[6].id, status: "WAITLISTED", waitlist_position: 1 } }).catch(() => {});
  await prisma.batch.update({ where: { id: batch0.id }, data: { waitlist_enabled: true, waitlist_count: 1 } }).catch(() => {});
  console.log(`   → ${enrollments.length + 7} enrollments created`);

  // ── 7. Payments ───────────────────────────────────────────
  console.log("💰 Seeding payments...");
  let paymentCount = 0;
  for (const enr of enrollments) {
    if (Math.random() > 0.85) continue;
    const batch = batches.find((b) => b.id === enr.batch_id);
    const svc = batch ? services.find((s) => s.id === batch.service_id) : null;
    const amount = svc?.monthly_fee ? Number(svc.monthly_fee) : 2000 + Math.floor(rand() * 2000);
    const status = rand() > 0.2 ? "APPROVED" : "PENDING";
    await prisma.paymentRecord.create({
      data: {
        enrollment_id: enr.id,
        amount,
        currency: "BDT",
        method: pick(["BKASH", "NAGAD", "ROCKET", "CASH"]),
        transaction_id: `TXN${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        sender_name: "Student",
        sender_number: `017${String(10000000 + Math.floor(rand() * 89999999))}`,
        payment_for: pick(["Monthly fee", "Joining fee", "1st installment", "Monthly fee (2nd month)"]),
        status: status as any,
        reviewed_at: status === "APPROVED" ? new Date() : null,
      },
    });
    paymentCount++;
  }
  console.log(`   → ${paymentCount} payment records created`);

  // ── 8. Posts ──────────────────────────────────────────────
  console.log("📝 Seeding posts...");
  const posts: any[] = [];
  const offeringTemplates: Array<{ title: string; content: string; subjects: string[] }> = [
    { title: "Admission open — HSC Physics + Higher Math batch", content: "Admission open for my HSC Physics + Higher Math batch (2026-27 session). Small batch of 30 with weekly tests, past board solutions, and doubt sessions every Thursday. Both online and offline options available. DM me for a demo class.", subjects: ["Physics", "Higher Mathematics"] },
    { title: "Limited seats — new IELTS intensive batch", content: "New IELTS intensive batch starting soon. 6 weeks, 3 classes/week, weekly mock tests, and speaking practice in small groups. I've helped 300+ students reach Band 7+. Book a free consultation now.", subjects: ["English"] },
    { title: "Learn Python + C — ICT students welcome", content: "CSE foundation batch open. We build a real project by the end — last batch built a library management system. Python, C, and Data Structures covered. Laptop recommended.", subjects: ["ICT", "Programming (Python/C)", "Computer Science"] },
    { title: "Chemistry crash course before board exam", content: "Short crash course covering the whole HSC Chemistry syllabus before the board exam. 8 sessions, chapter-wise past board questions, and a final mock exam with results. Limited seats.", subjects: ["Chemistry"] },
    { title: "Math foundation batch — SSC & HSC", content: "New batch for students who find math hard. We start from the very basics and build up step by step. Weekly worksheets and homework review. First class free.", subjects: ["Mathematics"] },
    { title: "Biology diagram mastery batch", content: "Biology batch with heavy focus on diagrams and mnemonics. Perfect for SSC and HSC students who lose marks in diagram questions. Weekly quick quizzes included.", subjects: ["Biology"] },
    { title: "Accounting & Finance — HSC Commerce", content: "Join my HSC Commerce batch. Real business examples, ledger practice, and board-question drills. Classes twice a week with progress reports to guardians.", subjects: ["Accounting", "Finance"] },
    { title: "Economics with real-world stories", content: "Learn economics through real Bangladesh news and stories. Micro + macro covered. Great for HSC Commerce and BBA foundation students.", subjects: ["Economics"] },
    { title: "Bangla 1st & 2nd paper masterclass", content: "Creative writing workshops, grammar drills, and famous prose/poem analysis. My students consistently score A+ in Bangla. Join before seats fill up.", subjects: ["Bangla"] },
    { title: "Admission math sprint — BUET/DU", content: "Focused problem-solving strategy for engineering & medical admission tests. Mock tests every weekend with detailed analysis. Limited batch.", subjects: ["Higher Mathematics"] },
  ];
  const seekingTemplates: Array<{ title: string; content: string; mode: string; budgetMin: number; budgetMax: number; subjects: string[]; levels: string[] }> = [
    { title: "Looking for Chemistry tutor (Class 10)", content: "My child needs Chemistry support for SSC 2026. Prefer female teacher, offline preferred, but online is fine. Budget around 2000-2500/month.", mode: "OFFLINE", budgetMin: 2000, budgetMax: 2500, subjects: ["Chemistry"], levels: ["Class 10"] },
    { title: "Admission test preparation — BUET", content: "HSC 2nd year science student preparing for BUET. Need a mentor for Physics + Higher Math problem-solving strategy. Flexible schedule, online preferred.", mode: "ONLINE", budgetMin: 3000, budgetMax: 4000, subjects: ["Physics", "Higher Mathematics"], levels: ["Admission Test"] },
    { title: "Accounting tutor needed — HSC Commerce", content: "Looking for an Accounting teacher for HSC Commerce 2nd year. Weakest area is partnership accounts. Twice a week classes, online acceptable.", mode: "ONLINE", budgetMin: 1500, budgetMax: 2000, subjects: ["Accounting"], levels: ["HSC (Commerce)"] },
    { title: "Tutor for my son — HSC Science", content: "My son is in HSC 1st year (Science). He's struggling with Chemistry. Looking for an experienced teacher for weekly private classes. Must share progress reports with me.", mode: "HYBRID", budgetMin: 2500, budgetMax: 3500, subjects: ["Chemistry"], levels: ["HSC (Science)"] },
    { title: "English tutor for IELTS target 7.5", content: "Planning to apply for scholarships abroad. Need an IELTS trainer for a 2-month intensive. Currently at Band 6, target 7.5. Online classes work best.", mode: "ONLINE", budgetMin: 3500, budgetMax: 5000, subjects: ["English"], levels: ["IELTS"] },
    { title: "Math support for Class 9 student", content: "Looking for a patient math teacher for my Class 9 daughter. Algebra and geometry are weak. Weekly 2 classes, prefer female teacher.", mode: "OFFLINE", budgetMin: 1500, budgetMax: 2000, subjects: ["Mathematics"], levels: ["Class 9"] },
    { title: "Biology tutor for medical admission", content: "Need Biology coaching for medical admission test. I'm HSC 2nd year science. Looking for a teacher who focuses on diagrams and quick revision.", mode: "HYBRID", budgetMin: 2500, budgetMax: 4000, subjects: ["Biology"], levels: ["Admission Test"] },
  ];

  // OFFERING posts from teachers
  for (const t of teachers) {
    const tmpl = pick(offeringTemplates);
    const svc = services.find((s) => s.teacher_id === t.id);
    const post = await prisma.post.create({
      data: {
        author_id: t.id,
        type: "OFFERING",
        title: tmpl.title,
        content: tmpl.content,
        status: "ACTIVE",
        service_id: svc?.id || null,
        currency: "BDT",
        country: "Bangladesh",
        state: t.state || "Dhaka",
        city: t.city || "Dhaka",
        area: t.area || "Dhanmondi",
      },
    });
    for (const sub of tmpl.subjects) {
      if (subjectIds[sub]) await prisma.postSubject.create({ data: { post_id: post.id, subject_id: subjectIds[sub] } }).catch(() => {});
    }
    const spec = teacherSpecialty.get(t.id)!;
    for (const lvl of spec.levels) {
      const l = levelNames[lvl];
      if (l) await prisma.postLevel.create({ data: { post_id: post.id, level_id: l } }).catch(() => {});
    }
    posts.push(post);
  }

  // SEEKING posts from students & guardians
  const seekers = [...students, ...guardians];
  for (let i = 0; i < Math.min(seekers.length, 28); i++) {
    const s = seekers[i];
    const tmpl = seekingTemplates[i % seekingTemplates.length];
    const post = await prisma.post.create({
      data: {
        author_id: s.id,
        type: "SEEKING",
        title: tmpl.title,
        content: tmpl.content,
        status: "ACTIVE",
        preferred_mode: tmpl.mode as any,
        budget_min: tmpl.budgetMin,
        budget_max: tmpl.budgetMax,
        currency: "BDT",
        country: "Bangladesh",
        state: s.state || "Dhaka",
        city: s.city || "Dhaka",
        area: s.area || "Dhanmondi",
      },
    });
    for (const sub of tmpl.subjects) {
      if (subjectIds[sub]) await prisma.postSubject.create({ data: { post_id: post.id, subject_id: subjectIds[sub] } }).catch(() => {});
    }
    for (const lvl of tmpl.levels) {
      const l = levelNames[lvl];
      if (l) await prisma.postLevel.create({ data: { post_id: post.id, level_id: l } }).catch(() => {});
    }
    posts.push(post);
  }
  console.log(`   → ${posts.length} posts created`);

  // ── 9. Likes, comments, follows ───────────────────────────
  console.log("❤️ Seeding likes, comments, follows...");
  let likeCount = 0;
  for (const post of posts) {
    const likers = pickN([...students, ...guardians, ...teachers], 4 + Math.floor(rand() * 5));
    for (const l of likers) {
      if (l.id === post.author_id) continue;
      await prisma.like.create({ data: { user_id: l.id, post_id: post.id } }).catch(() => {});
      likeCount++;
    }
  }

  const commentPool = [
    "Is there any seat left? I'd love to join!",
    "Can you share the demo class recording?",
    "How long is the course and what's the schedule?",
    "Is online option available?",
    "Do you provide weekly progress reports to guardians?",
    "What's the class size? I prefer small batches.",
    "Can I get a trial class before enrolling?",
    "What materials do I need to bring?",
    "My son is weak in this subject — will you start from basics?",
    "How are the mock tests — are they close to the real exam?",
  ];
  let commentCount = 0;
  const commentIds: any[] = [];
  for (const post of posts) {
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const author = pick([...students, ...guardians, ...teachers]);
      if (author.id === post.author_id) continue;
      const cmt = await prisma.comment.create({ data: { post_id: post.id, author_id: author.id, content: pick(commentPool) } }).catch(() => null);
      if (!cmt) continue;
      commentIds.push(cmt);
      commentCount++;
    }
  }
  // replies
  let replyCount = 0;
  for (const cmt of commentIds) {
    if (Math.random() > 0.4) {
      const post = posts.find((p) => p.id === cmt.post_id);
      if (post) {
        await prisma.comment.create({ data: { post_id: post.id, author_id: post.author_id, content: pick(["Yes! Send me a message for details.", "Of course — I'll share the details.", "There's a free trial class this weekend.", "Absolutely! Let's schedule it.", "Great question — I'll answer in class."]), parent_id: cmt.id } }).catch(() => {});
        replyCount++;
      }
    }
  }

  // follows — students/guardians follow teachers
  let followCount = 0;
  for (const s of students) {
    for (const t of pickN(teachers, 3 + Math.floor(rand() * 4))) {
      if (s.id === t.id) continue;
      await prisma.follow.create({ data: { follower_id: s.id, following_id: t.id } }).catch(() => {});
      followCount++;
    }
  }
  for (const g of guardians) {
    for (const t of pickN(teachers, 2 + Math.floor(rand() * 3))) {
      if (g.id === t.id) continue;
      await prisma.follow.create({ data: { follower_id: g.id, following_id: t.id } }).catch(() => {});
      followCount++;
    }
  }
  console.log(`   → ${likeCount} likes, ${commentCount} comments (+${replyCount} replies), ${followCount} follows created`);

  // ── 10. Reviews ───────────────────────────────────────────
  console.log("⭐ Seeding reviews...");
  const reviewComments = [
    { rating: 5, comment: "Best teacher I've had. Explanations are crystal clear and very patient. Highly recommended!", reply: "Thank you! Glad the classes are helping." },
    { rating: 5, comment: "Very organized classes and the weekly tests really help. My grades improved within two months.", reply: "Proud of your progress! Keep it up." },
    { rating: 4, comment: "Great teaching style and personal attention. Wish there were more doubt sessions though." },
    { rating: 5, comment: "The mock tests are very close to the real exam. I felt much more prepared.", reply: "Happy to hear that! Good luck!" },
    { rating: 4, comment: "Teacher is knowledgeable and explains concepts clearly. Regular homework keeps us on track." },
    { rating: 5, comment: "Learned from scratch and now solving confidently. The project-based approach is excellent." },
  ];
  let reviewCount = 0;
  for (const svc of services) {
    const n = 2 + Math.floor(rand() * 4);
    const reviewers = pickN(students, n);
    for (const reviewer of reviewers) {
      const rc = pick(reviewComments);
      const enroll = await prisma.enrollment.findFirst({ where: { batch: { service_id: svc.id } } }).catch(() => null);
      const created = await prisma.review.create({
        data: {
          service_id: svc.id,
          reviewer_id: reviewer.id,
          enrollment_id: enroll?.id || null,
          rating: rc.rating,
          comment: rc.comment,
          status: "VISIBLE",
          teacher_reply: rc.reply || null,
          teacher_replied_at: rc.reply ? new Date() : null,
        },
      }).catch(() => null);
      if (created) reviewCount++;
    }
  }
  // update cached ratings
  for (const svc of services) {
    const agg = await prisma.review.aggregate({ where: { service_id: svc.id, status: "VISIBLE" }, _avg: { rating: true }, _count: { rating: true } });
    await prisma.service.update({ where: { id: svc.id }, data: { average_rating: agg._avg.rating || 0, total_reviews: agg._count.rating } });
    const tp = await prisma.teacherProfile.findUnique({ where: { user_id: svc.teacher_id } });
    if (tp) {
      const tAgg = await prisma.review.aggregate({ where: { service: { teacher_id: svc.teacher_id }, status: "VISIBLE" }, _avg: { rating: true }, _count: { rating: true } });
      await prisma.teacherProfile.update({ where: { user_id: svc.teacher_id }, data: { average_rating: tAgg._avg.rating || 0, total_reviews: tAgg._count.rating } });
    }
  }
  console.log(`   → ${reviewCount} reviews created`);

  // ── 11. Chats & messages ──────────────────────────────────
  console.log("💬 Seeding chats & messages...");
  const msgTemplates: Array<[string, string]> = [
    ["Hi sir, I'm interested in the batch. Is there a seat?", "Yes! There are still seats. I'll send you the details."],
    ["What's the monthly fee and schedule?", "2500 BDT + 500 joining fee. Classes 3 days a week."],
    ["Is there a free trial class?", "Yes, the first class is a free trial. Let me know which batch."],
    ["Do you share progress reports with guardians?", "Absolutely. I send reports every week with attendance and marks."],
    ["Can I pay via bKash?", "Yes, bKash is preferred. I'll share the number."],
    ["How many students are in a batch?", "Max 25 students so everyone gets attention."],
  ];
  let chatCount = 0;
  let msgCount = 0;
  for (let i = 0; i < 24; i++) {
    const teacher = teachers[i % teachers.length];
    const other = i % 2 === 0 ? students[i % students.length] : guardians[i % guardians.length];
    const svc = services.find((s) => s.teacher_id === teacher.id);
    if (!svc) continue;
    const chat = await prisma.chat.create({ data: { type: "DIRECT", service_id: svc.id } });
    await prisma.chatParticipant.create({ data: { chat_id: chat.id, user_id: teacher.id } });
    await prisma.chatParticipant.create({ data: { chat_id: chat.id, user_id: other.id } });
    const n = 2 + Math.floor(rand() * 3);
    for (let m = 0; m < n; m++) {
      const tpl = msgTemplates[(i + m) % msgTemplates.length];
      const sender = m % 2 === 0 ? other.id : teacher.id;
      const msg = await prisma.message.create({ data: { chat_id: chat.id, sender_id: sender, body: tpl[0], status: "SENT" } });
      await prisma.messageReadReceipt.create({ data: { message_id: msg.id, user_id: sender === teacher.id ? other.id : teacher.id } }).catch(() => {});
      msgCount++;
    }
    chatCount++;
  }
  console.log(`   → ${chatCount} chats & ${msgCount} messages created`);

  // ── 12. Notifications ─────────────────────────────────────
  console.log("🔔 Seeding notifications...");
  const notifPool: Array<[string, string, string, string]> = [
    ["FOLLOW_NEW", "New follower", "started following you", "user"],
    ["POST_LIKED", "Post liked", "liked your post", "post"],
    ["NEW_COMMENT", "New comment", "commented on your post", "post"],
    ["NEW_MESSAGE", "New message", "sent you a message", "chat"],
    ["PAYMENT_APPROVED", "Payment approved", "Your payment was approved", "payment"],
    ["NEW_TASK", "New task assigned", "You have a new homework task", "task"],
    ["NEW_ANNOUNCEMENT", "New announcement", "New announcement in your batch", "announcement"],
    ["ATTENDANCE_MARKED", "Attendance marked", "Your attendance was marked for today's class", "attendance"],
    ["ENROLLMENT_SUSPENDED", "Enrollment suspended", "Your enrollment was suspended", "enrollment"],
    ["GUARDIAN_LINK_ACCEPTED", "Guardian link accepted", "accepted your guardian request", "guardian"],
    ["CLASS_CANCELLED", "Class cancelled", "Today's class was cancelled", "batch"],
    ["NEW_DAILY_NOTE", "New daily note", "A new class note was published", "batch"],
  ];
  let notifCount = 0;
  for (const u of allUsers.slice(0, 60)) {
    const n = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const [type, title, body, refType] = pick(notifPool);
      await prisma.notification.create({ data: { user_id: u.id, type: type as any, channel: "IN_APP", title, body: `${pick(["A student", "A teacher", "A guardian"])} ${body}`, reference_type: refType, is_read: Math.random() > 0.5 } });
      notifCount++;
    }
  }
  console.log(`   → ${notifCount} notifications created`);

  // ── 13. Stories ───────────────────────────────────────────
  console.log("📖 Seeding stories...");
  const storyDefs: Array<[any, string]> = [
    [teachers[0], "Demo class this Sunday at 5 PM! Free for new students."],
    [students[0], "Finished my chemistry notes for chapter 4!"],
    [teachers[1], "Mock test today. Good luck to all my students!"],
    [students[1], "Solved 3 physics problems in 20 minutes. Feeling great!"],
    [teachers[2], "New batch launched — early birds get 10% off!"],
    [students[2], "Cleared my math test! Thanks to my teacher."],
    [teachers[3], "Weekly doubt session this Saturday. Bring your questions!"],
    [students[3], "Reading English novels to improve my vocabulary."],
    [teachers[4], "Board exam strategy session — don't miss it!"],
    [students[4], "Finished all homework before the deadline!"],
    [teachers[5], "Free trial class for new students this week."],
    [students[5], "My first coding project is done!"],
    [teachers[6], "Admission test mock — full analysis next class."],
    [students[6], "Practicing past board questions today."],
    [teachers[7], "Monthly fee reminder — due by the 15th."],
  ];
  const colors = ["#0066FF", "#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#EC4899", "#14B8A6"];
  let storyCount = 0;
  let storyViewCount = 0;
  for (const [u, content] of storyDefs) {
    const story = await prisma.story.create({ data: { user_id: u.id, content, media_type: "TEXT", bg_color: pick(colors), expires_at: new Date(Date.now() + 24 * 3600 * 1000) } });
    for (const v of pickN([...students, ...teachers], 3 + Math.floor(rand() * 4))) {
      if (v.id === u.id) continue;
      await prisma.storyView.create({ data: { story_id: story.id, user_id: v.id } }).catch(() => {});
      storyViewCount++;
    }
    storyCount++;
  }
  console.log(`   → ${storyCount} stories (${storyViewCount} views) created`);

  // ── 14. Batch content: attendance, tasks, notes, announcements, calendar ──
  console.log("📅 Seeding batch content...");
  const ongoingBatches = batches.filter((b) => b.status === "ONGOING");
  let attendanceCount = 0;
  let taskCount = 0;
  let noteCount = 0;
  let annCount = 0;
  let calCount = 0;

  for (const batch of ongoingBatches) {
    const batchEnrollments = await prisma.enrollment.findMany({ where: { batch_id: batch.id, status: "APPROVED" }, select: { student_profile_id: true } });
    const svc = services.find((s) => s.id === batch.service_id);
    if (!svc) continue;
    const teacher = svc.teacher_id;
    const dates = ["2026-07-12", "2026-07-15", "2026-07-19", "2026-07-22", "2026-07-26", "2026-07-29", "2026-08-02", "2026-08-05", "2026-08-09"];
    for (const d of dates) {
      for (const enr of batchEnrollments) {
        await prisma.attendance.create({
          data: { batch_id: batch.id, student_profile_id: enr.student_profile_id, class_date: new Date(d), status: Math.random() > 0.15 ? pick(["PRESENT", "PRESENT", "LATE"]) : "ABSENT", note: Math.random() > 0.8 ? "Was very active today" : null, marked_by_id: teacher },
        }).catch(() => {});
        attendanceCount++;
      }
      await prisma.dailyNote.create({
        data: { batch_id: batch.id, note_date: new Date(d), title: "Class notes", content: `Covered the day's chapter — explained with solved board problems. Students showed good understanding during the Q&A session.`, next_day_plan: "Next chapter + homework review. Bring your previous homework.", created_by_id: teacher },
      }).catch(() => {});
      noteCount++;
      await prisma.calendarEvent.create({
        data: { batch_id: batch.id, class_date: new Date(d), start_time: pick(["17:00", "16:00", "08:00"]), end_time: pick(["18:30", "17:30", "09:30"]), status: "COMPLETED" },
      }).catch(() => {});
      calCount++;
    }
    await prisma.task.create({
      data: { batch_id: batch.id, title: "Homework: Chapter problems", description: "Solve the assigned problems from the textbook. Show all steps clearly. Due before next class.", due_date: new Date("2026-08-15"), class_date: new Date("2026-08-09"), status: "ACTIVE", created_by_id: teacher },
    }).catch(() => {});
    taskCount++;
    await prisma.task.create({
      data: { batch_id: batch.id, title: "Weekly practice test", description: "Complete the weekly 20-question MCQ test. Results next class.", due_date: new Date("2026-08-17"), status: "ACTIVE", created_by_id: teacher },
    }).catch(() => {});
    taskCount++;
    await prisma.announcement.create({
      data: { batch_id: batch.id, title: "Class rescheduled", body: "This Friday's class is moved to Saturday 4 PM due to the national holiday. Same meeting link.", created_by_id: teacher },
    }).catch(() => {});
    annCount++;
    await prisma.announcement.create({
      data: { batch_id: batch.id, title: "Monthly fee reminder", body: "Monthly fee for August is due by the 15th. Pay via the method shared in the group.", created_by_id: teacher },
    }).catch(() => {});
    annCount++;
  }
  console.log(`   → ${attendanceCount} attendance, ${taskCount} tasks, ${noteCount} daily notes, ${annCount} announcements, ${calCount} calendar events created`);

  // ── 15. Guardian-student links ────────────────────────────
  console.log("👨‍👩‍👧 Seeding guardian links...");
  const studentProfileByUser: Record<string, any> = {};
  for (const sp of studentProfiles) studentProfileByUser[sp.user_id] = sp;
  const guardianProfiles = await prisma.guardianProfile.findMany({ select: { id: true, user_id: true } });
  let linkCount = 0;
  for (let i = 0; i < Math.min(guardians.length, 15); i++) {
    const g = guardians[i];
    const gp = guardianProfiles[i];
    const child = students[i % students.length];
    const sp = studentProfileByUser[child?.id];
    if (!gp || !sp) continue;
    await prisma.guardianStudent.create({
      data: { guardian_profile_id: gp.id, student_profile_id: sp.id, status: "ACTIVE", initiated_by: "GUARDIAN", relation_label: pick(["Father", "Mother", "Uncle", "Grandfather"]), requested_at: new Date(Date.now() - 30 * 86400000), responded_at: new Date(Date.now() - 25 * 86400000) },
    }).catch(() => {});
    linkCount++;
  }
  console.log(`   → ${linkCount} guardian links created`);

  // ── 16. Audit logs, teacher approvals, admin notes ────────
  console.log("📋 Seeding audit logs & teacher approvals...");
  for (const t of teachers) {
    await prisma.teacherApproval.create({ data: { user_id: t.id, reviewed_by: admin.id, status: "ACTIVE", note: "Verified documents and approved", reviewed_at: new Date() } }).catch(() => {});
  }
  await prisma.auditLog.create({ data: { admin_id: admin.id, action: "USER_APPROVED", target_type: "user", target_id: teachers[0].id, meta: { note: "Seed data approval" } } });
  await prisma.auditLog.create({ data: { admin_id: admin.id, action: "PACKAGE_CREATED", target_type: "package", target_id: packages["pro"], meta: { name: "Pro" } } });
  await prisma.auditLog.create({ data: { admin_id: admin.id, action: "ADMIN_CREATED", target_type: "admin", target_id: admin.id, meta: { email: admin.email } } });
  await prisma.adminNote.create({ data: { user_id: teachers[0].id, admin_id: admin.id, note: "Top-rated physics teacher. Keep an eye on enrollment numbers." } });
  await prisma.adminNote.create({ data: { user_id: students[1].id, admin_id: admin.id, note: "Active student, follows multiple teachers." } });
  console.log(`   → teacher approvals & audit logs created`);

  // ── Final counts ──────────────────────────────────────────
  console.log("\n📊 FINAL COUNTS:");
  const counts = await Promise.all([
    prisma.user.count().then((c) => `Users: ${c}`),
    prisma.admin.count().then((c) => `Admins: ${c}`),
    prisma.service.count().then((c) => `Services: ${c}`),
    prisma.batch.count().then((c) => `Batches: ${c}`),
    prisma.enrollment.count().then((c) => `Enrollments: ${c}`),
    prisma.post.count().then((c) => `Posts: ${c}`),
    prisma.comment.count().then((c) => `Comments: ${c}`),
    prisma.like.count().then((c) => `Likes: ${c}`),
    prisma.follow.count().then((c) => `Follows: ${c}`),
    prisma.review.count().then((c) => `Reviews: ${c}`),
    prisma.chat.count().then((c) => `Chats: ${c}`),
    prisma.message.count().then((c) => `Messages: ${c}`),
    prisma.notification.count().then((c) => `Notifications: ${c}`),
    prisma.story.count().then((c) => `Stories: ${c}`),
    prisma.paymentRecord.count().then((c) => `Payments: ${c}`),
    prisma.attendance.count().then((c) => `Attendance: ${c}`),
    prisma.task.count().then((c) => `Tasks: ${c}`),
    prisma.dailyNote.count().then((c) => `Daily notes: ${c}`),
    prisma.announcement.count().then((c) => `Announcements: ${c}`),
    prisma.calendarEvent.count().then((c) => `Calendar events: ${c}`),
    prisma.guardianStudent.count().then((c) => `Guardian links: ${c}`),
    prisma.subject.count().then((c) => `Subjects: ${c}`),
    prisma.educationLevel.count().then((c) => `Education levels: ${c}`),
    prisma.subscriptionPackage.count().then((c) => `Packages: ${c}`),
  ]);
  console.log(counts.join("\n"));
}

async function wipeAll() {
  const order: Array<() => Promise<unknown>> = [
    () => prisma.storyView.deleteMany(),
    () => prisma.story.deleteMany(),
    () => prisma.block.deleteMany(),
    () => prisma.follow.deleteMany(),
    () => prisma.messageReadReceipt.deleteMany(),
    () => prisma.message.deleteMany(),
    () => prisma.chatParticipant.deleteMany(),
    () => prisma.chat.deleteMany(),
    () => prisma.review.deleteMany(),
    () => prisma.like.deleteMany(),
    () => prisma.comment.deleteMany(),
    () => prisma.notification.deleteMany(),
    () => prisma.userDevice.deleteMany(),
    () => prisma.notificationPreference.deleteMany(),
    () => prisma.emailQueue.deleteMany(),
    () => prisma.paymentRecord.deleteMany(),
    () => prisma.enrollment.deleteMany(),
    () => prisma.teacherInvite.deleteMany(),
    () => prisma.scheduleOverride.deleteMany(),
    () => prisma.batchSchedule.deleteMany(),
    () => prisma.attendance.deleteMany(),
    () => prisma.taskVisibility.deleteMany(),
    () => prisma.task.deleteMany(),
    () => prisma.noteVisibility.deleteMany(),
    () => prisma.dailyNote.deleteMany(),
    () => prisma.announcement.deleteMany(),
    () => prisma.calendarEvent.deleteMany(),
    () => prisma.batch.deleteMany(),
    () => prisma.servicePaymentMethod.deleteMany(),
    () => prisma.serviceSubject.deleteMany(),
    () => prisma.serviceLevel.deleteMany(),
    () => prisma.service.deleteMany(),
    () => prisma.postSubject.deleteMany(),
    () => prisma.postLevel.deleteMany(),
    () => prisma.post.deleteMany(),
    () => prisma.media.deleteMany(),
    () => prisma.teacherApproval.deleteMany(),
    () => prisma.adminNote.deleteMany(),
    () => prisma.auditLog.deleteMany(),
    () => prisma.subscriptionHistory.deleteMany(),
    () => prisma.userSubscription.deleteMany(),
    () => prisma.packageFeature.deleteMany(),
    () => prisma.subscriptionPackage.deleteMany(),
    () => prisma.guardianStudent.deleteMany(),
    () => prisma.guardianProfile.deleteMany(),
    () => prisma.studentProfile.deleteMany(),
    () => prisma.teacherProfile.deleteMany(),
    () => prisma.coachingCenterProfile.deleteMany(),
    () => prisma.user.deleteMany(),
    () => prisma.admin.deleteMany(),
    () => prisma.subject.deleteMany(),
    () => prisma.subjectCategory.deleteMany(),
    () => prisma.educationLevel.deleteMany(),
    () => prisma.educationLevelGroup.deleteMany(),
  ];
  for (const op of order) {
    await op();
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });