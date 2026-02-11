/**
 * Seed script: Populate PT dashboard with sample patient data
 *
 * Run: node scripts/seed-pt-data.mjs
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Read DATABASE_URL from .env.local
const envFile = readFileSync(".env.local", "utf-8");
const dbUrl = envFile.match(/DATABASE_URL=(.*)/)?.[1];
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

const PT_ID = "11111111-1111-1111-1111-111111111111";

// New sample patients
const PATIENTS = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "alex.thompson@rehabify.demo",
    name: "Alex Thompson",
    xp: 450,
    level: 3,
    streak: 5,
    longestStreak: 12,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "maria.garcia@rehabify.demo",
    name: "Maria Garcia",
    xp: 280,
    level: 2,
    streak: 3,
    longestStreak: 7,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "james.wilson@rehabify.demo",
    name: "James Wilson",
    xp: 120,
    level: 1,
    streak: 0,
    longestStreak: 4,
  },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// 12-week plan structure with exercises using days properly
function buildPlanStructure() {
  const exerciseSets = [
    // Week 1-3: Beginner mobility
    ["prone-press-up", "pelvic-tilt", "knee-to-chest", "cat-camel"],
    ["prone-press-up", "cobra-stretch", "pelvic-tilt", "dead-bug"],
    ["cobra-stretch", "bird-dog", "glute-bridge", "cat-camel"],
    // Week 4-6: Core stability
    ["dead-bug", "bird-dog", "glute-bridge", "plank"],
    ["plank", "side-plank", "dead-bug", "cobra-stretch"],
    ["glute-bridge", "single-leg-bridge", "bird-dog", "plank"],
    // Week 7-9: Intermediate strength
    ["side-plank", "fire-hydrant", "clamshell", "glute-bridge"],
    ["plank", "dead-bug", "bird-dog", "single-leg-bridge"],
    ["fire-hydrant", "clamshell", "side-plank-elbow", "glute-bridge"],
    // Week 10-12: Advanced
    ["single-leg-bridge", "side-plank-elbow", "plank", "bird-dog"],
    ["quadruped-hip-extension", "fire-hydrant", "dead-bug", "clamshell"],
    ["prone-hip-extension", "single-leg-bridge", "side-plank-elbow", "plank"],
  ];

  const focuses = [
    "Initial Pain Relief & Gentle Mobility",
    "Continued Pain Relief & Core Awareness",
    "Foundation Building & Extension Mobility",
    "Core Stability Introduction",
    "Progressing Core Stability",
    "Strength Foundation",
    "Intermediate Strength & Balance",
    "Dynamic Stability Training",
    "Advanced Stability & Endurance",
    "Functional Movement Integration",
    "Sport-Specific Preparation",
    "Return to Full Activity",
  ];

  return {
    weeks: exerciseSets.map((slugs, i) => ({
      weekNumber: i + 1,
      focus: focuses[i],
      notes: `Week ${i + 1} of your rehabilitation program. ${i < 4 ? "Focus on pain-free movement and proper form." : i < 8 ? "Gradually increasing challenge. Stop if pain exceeds 3/10." : "Building toward full function. Maintain proper form throughout."}`,
      exercises: slugs.map((slug, j) => ({
        exerciseId: uuid(),
        exerciseSlug: slug,
        name: slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        sets: Math.min(2 + Math.floor(i / 4), 4),
        reps: [8, 10, 12, 15][Math.min(Math.floor(i / 3), 3)],
        holdSeconds: [0, 2, 3, 5][Math.min(Math.floor(i / 3), 3)],
        days: [1, 3, 5], // Mon, Wed, Fri
        order: j,
        notes: j === 0 ? "Focus on controlled movement throughout." : undefined,
      })),
    })),
  };
}

function buildSessionExercises(slugs) {
  return slugs.map((slug) => ({
    exerciseSlug: slug,
    name: slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    setsCompleted: 2 + Math.floor(Math.random() * 2),
    repsCompleted: 8 + Math.floor(Math.random() * 5),
    formScore: 65 + Math.floor(Math.random() * 30),
    painLevel: Math.floor(Math.random() * 4),
    notes: null,
  }));
}

async function seed() {
  console.log("Seeding PT dashboard data...\n");

  // 1. Assign existing patients to Dr. Sarah
  console.log("1. Assigning existing patients to Dr. Sarah...");
  await sql`
    UPDATE profiles
    SET pt_id = ${PT_ID}
    WHERE role = 'patient' AND pt_id IS NULL
  `;
  console.log("   Done.\n");

  // 2. Upsert sample patients
  console.log("2. Creating sample patients...");
  for (const p of PATIENTS) {
    await sql`
      INSERT INTO profiles (id, email, display_name, role, pt_id, xp, level, current_streak, longest_streak, created_at)
      VALUES (
        ${p.id}, ${p.email}, ${p.name}, 'patient', ${PT_ID},
        ${p.xp}, ${p.level}, ${p.streak}, ${p.longestStreak},
        NOW() - INTERVAL '3 months' * ${Math.random() + 0.5}
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        pt_id = ${PT_ID},
        xp = EXCLUDED.xp,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak
    `;
    console.log(`   Created/updated: ${p.name}`);
  }
  console.log();

  // 3. Create plans for each sample patient
  console.log("3. Creating rehabilitation plans...");
  const planIds = {};
  const statuses = ["approved", "approved", "pending_review"];
  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const planId = uuid();
    planIds[p.id] = planId;
    const structure = buildPlanStructure();

    await sql`
      INSERT INTO plans (id, patient_id, pt_id, name, status, structure, recommendations, created_at, updated_at)
      VALUES (
        ${planId},
        ${p.id},
        ${PT_ID},
        ${"12-Week Lower Back Rehab"},
        ${statuses[i]},
        ${JSON.stringify(structure)},
        ${JSON.stringify([
          { type: "encouragement", message: "Great progress so far!" },
          { type: "precaution", message: "Avoid heavy lifting during recovery" },
        ])},
        NOW() - INTERVAL '2 weeks',
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;
    console.log(`   Plan for ${p.name}: ${statuses[i]}`);
  }
  console.log();

  // 4. Create sessions for Alex (active patient with good history)
  console.log("4. Creating workout sessions...");
  const alexSlugs = ["prone-press-up", "cobra-stretch", "pelvic-tilt", "dead-bug"];
  for (let d = 0; d < 10; d++) {
    const sessionId = uuid();
    const dayOffset = d * 2 + Math.floor(Math.random() * 2); // roughly every other day
    const formScore = 70 + Math.floor(Math.random() * 25);
    const pain = Math.max(0, 4 - Math.floor(d / 3) + Math.floor(Math.random() * 2)); // decreasing pain over time

    await sql`
      INSERT INTO sessions (id, patient_id, plan_id, date, exercises, duration_seconds, overall_form_score, overall_pain, overall_rating, status, xp_earned, created_at)
      VALUES (
        ${sessionId},
        ${PATIENTS[0].id},
        ${planIds[PATIENTS[0].id]},
        ${daysAgo(dayOffset)},
        ${JSON.stringify(buildSessionExercises(alexSlugs))},
        ${900 + Math.floor(Math.random() * 600)},
        ${formScore},
        ${pain},
        ${Math.min(5, Math.floor(formScore / 20) + 1)},
        'completed',
        ${25 + Math.floor(Math.random() * 25)},
        ${new Date(Date.now() - dayOffset * 86400000).toISOString()}
      )
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("   10 sessions for Alex Thompson");

  // 5 sessions for Maria
  const mariaSlugs = ["bird-dog", "glute-bridge", "cat-camel", "plank"];
  for (let d = 0; d < 5; d++) {
    const sessionId = uuid();
    const dayOffset = d * 3 + 1;
    await sql`
      INSERT INTO sessions (id, patient_id, plan_id, date, exercises, duration_seconds, overall_form_score, overall_pain, overall_rating, status, xp_earned, created_at)
      VALUES (
        ${sessionId},
        ${PATIENTS[1].id},
        ${planIds[PATIENTS[1].id]},
        ${daysAgo(dayOffset)},
        ${JSON.stringify(buildSessionExercises(mariaSlugs))},
        ${800 + Math.floor(Math.random() * 400)},
        ${60 + Math.floor(Math.random() * 20)},
        ${2 + Math.floor(Math.random() * 3)},
        ${3 + Math.floor(Math.random() * 2)},
        'completed',
        ${20 + Math.floor(Math.random() * 15)},
        ${new Date(Date.now() - dayOffset * 86400000).toISOString()}
      )
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("   5 sessions for Maria Garcia");
  console.log("   0 sessions for James Wilson (new patient)");
  console.log();

  // 5. Create PT alerts
  console.log("5. Creating PT alerts...");

  // James hasn't done any sessions - missed sessions alert
  await sql`
    INSERT INTO pt_alerts (id, patient_id, pt_id, type, severity, title, description, recommendation, created_at)
    VALUES (
      ${uuid()},
      ${PATIENTS[2].id},
      ${PT_ID},
      'missed_sessions',
      'medium',
      'Missed Sessions',
      'James Wilson has not completed any sessions in the past 7 days.',
      'Consider reaching out to check on progress and motivation.',
      NOW() - INTERVAL '1 day'
    )
    ON CONFLICT DO NOTHING
  `;
  console.log("   Alert: James Wilson - missed sessions");

  // Maria reported high pain
  await sql`
    INSERT INTO pt_alerts (id, patient_id, pt_id, type, severity, title, description, recommendation, created_at)
    VALUES (
      ${uuid()},
      ${PATIENTS[1].id},
      ${PT_ID},
      'high_pain',
      'high',
      'High Pain Reported',
      'Maria Garcia reported pain level 7/10 during her last session.',
      'Review exercise intensity and consider modifying the plan.',
      NOW() - INTERVAL '2 hours'
    )
    ON CONFLICT DO NOTHING
  `;
  console.log("   Alert: Maria Garcia - high pain report");
  console.log();

  console.log("Seed complete! Refresh the PT dashboard to see the data.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
