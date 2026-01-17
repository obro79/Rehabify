#!/usr/bin/env node

/**
 * Generate SQL seed file from exercises JSON
 *
 * Usage: node scripts/generate-seed-sql.js
 * Output: src/db/migrations/002_seed_data.sql
 */

const fs = require('fs');
const path = require('path');

// Read JSON data
const jsonPath = path.join(__dirname, '../src/lib/exercises/data.json');
const outputPath = path.join(__dirname, '../src/db/migrations/002_seed_data.sql');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const exercises = data.exercises;

console.log(`Found ${exercises.length} exercises to convert`);

// Helper to escape SQL strings
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Helper to convert array to PostgreSQL array literal
function toSQLArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const escaped = arr.map(item => `"${String(item).replace(/"/g, '\\"').replace(/'/g, "''")}"`);
  return `ARRAY[${arr.map(item => escapeSQL(item)).join(', ')}]`;
}

// Helper to convert object to JSONB
function toJSONB(obj) {
  if (!obj || Object.keys(obj).length === 0) return "'{}'::JSONB";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::JSONB`;
}

// Generate SQL
let sql = `-- =============================================================================
-- Rehabify Seed Data
-- Version: 002
-- Description: Seed ${exercises.length} exercises and achievements
-- Generated: ${new Date().toISOString()}
--
-- RUN THIS AFTER: 001_complete_schema.sql
-- =============================================================================

-- =============================================================================
-- EXERCISES (${exercises.length} total)
-- =============================================================================

`;

// Group exercises by tier for organization
const tier1 = exercises.filter(e => e.tier === 1);
const tier2 = exercises.filter(e => e.tier === 2);

sql += `-- Tier 1 Exercises (${tier1.length} exercises with form detection)\n`;
sql += `-- Tier 2 Exercises (${tier2.length} exercises, voice-guided only)\n\n`;

// Generate INSERT for each exercise
sql += `INSERT INTO exercises (
  name, slug, category, body_region, target_area, difficulty, tier,
  description, instructions, common_mistakes, modifications, contraindications,
  default_reps, default_sets, default_hold_seconds, rep_type, equipment,
  thumbnail_url, video_url, form_detection_enabled, detection_config
) VALUES\n`;

const values = exercises.map((ex, i) => {
  const isLast = i === exercises.length - 1;

  return `-- ${ex.name}
(
  ${escapeSQL(ex.name)},
  ${escapeSQL(ex.slug)},
  ${escapeSQL(ex.category)},
  ${escapeSQL(ex.body_region)},
  ${escapeSQL(ex.target_area || null)},
  ${escapeSQL(ex.difficulty)},
  ${ex.tier},
  ${escapeSQL(ex.description)},
  ${toSQLArray(ex.instructions)},
  ${toSQLArray(ex.common_mistakes || [])},
  ${toJSONB(ex.modifications || {})},
  ${toSQLArray(ex.contraindications || [])},
  ${ex.default_reps || 10},
  ${ex.default_sets || 3},
  ${ex.default_hold_seconds || 0},
  ${escapeSQL(ex.rep_type || 'standard')},
  ${escapeSQL(ex.equipment || null)},
  ${escapeSQL(ex.thumbnail_url || null)},
  ${escapeSQL(ex.video_url || null)},
  ${ex.form_detection_enabled ? 'TRUE' : 'FALSE'},
  ${toJSONB(ex.detection_config || null)}
)${isLast ? ';' : ','}
`;
});

sql += values.join('\n');

// Add achievements
sql += `

-- =============================================================================
-- ACHIEVEMENTS
-- =============================================================================

INSERT INTO achievements (name, description, condition_type, condition_value, xp_reward, category, sort_order) VALUES
-- Session milestones
('First Steps', 'Complete your first workout session', 'total_sessions', 1, 50, 'milestone', 1),
('Dedicated', 'Complete 10 workout sessions', 'total_sessions', 10, 100, 'milestone', 2),
('Committed', 'Complete 50 workout sessions', 'total_sessions', 50, 300, 'milestone', 3),
('Veteran', 'Complete 100 workout sessions', 'total_sessions', 100, 500, 'milestone', 4),
('Marathon Runner', 'Complete 250 workout sessions', 'total_sessions', 250, 1000, 'milestone', 5),

-- Streak achievements
('Week Warrior', 'Maintain a 7-day workout streak', 'streak', 7, 100, 'streak', 10),
('Fortnight Fighter', 'Maintain a 14-day workout streak', 'streak', 14, 200, 'streak', 11),
('Month Master', 'Maintain a 30-day workout streak', 'streak', 30, 500, 'streak', 12),
('Consistency Champion', 'Maintain a 60-day workout streak', 'streak', 60, 1000, 'streak', 13),

-- Form achievements
('Good Form', 'Score 80+ on any exercise', 'form_score', 80, 50, 'skill', 20),
('Great Form', 'Score 90+ on any exercise', 'form_score', 90, 100, 'skill', 21),
('Perfect Form', 'Score 95+ on any exercise', 'form_score', 95, 200, 'skill', 22),
('Form Master', 'Score 95+ on 10 different exercises', 'form_score_count', 10, 500, 'skill', 23),

-- Rep milestones
('Century Club', 'Complete 100 total reps', 'total_reps', 100, 75, 'milestone', 30),
('Rep Machine', 'Complete 1000 total reps', 'total_reps', 1000, 250, 'milestone', 31),
('Rep Legend', 'Complete 5000 total reps', 'total_reps', 5000, 500, 'milestone', 32),
('Rep God', 'Complete 10000 total reps', 'total_reps', 10000, 1000, 'milestone', 33),

-- Variety achievements
('Explorer', 'Try 10 different exercises', 'unique_exercises', 10, 100, 'exploration', 40),
('Adventurer', 'Try 25 different exercises', 'unique_exercises', 25, 250, 'exploration', 41),
('Completionist', 'Try 50 different exercises', 'unique_exercises', 50, 500, 'exploration', 42),
('Master of All', 'Try 100 different exercises', 'unique_exercises', 100, 1000, 'exploration', 43),

-- Body region achievements
('Back Specialist', 'Complete 50 lower back exercises', 'body_region_count', 50, 200, 'specialization', 50),
('Shoulder Pro', 'Complete 50 shoulder exercises', 'body_region_count', 50, 200, 'specialization', 51),
('Knee Expert', 'Complete 50 knee exercises', 'body_region_count', 50, 200, 'specialization', 52),
('Ankle Master', 'Complete 50 ankle exercises', 'body_region_count', 50, 200, 'specialization', 53);


-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '   - ${tier1.length} Tier 1 exercises (form detection enabled)';
  RAISE NOTICE '   - ${tier2.length} Tier 2 exercises (voice-guided)';
  RAISE NOTICE '   - ${exercises.length} total exercises';
  RAISE NOTICE '   - 24 achievements';
END $$;
`;

// Write output
fs.writeFileSync(outputPath, sql);
console.log(`Generated ${outputPath}`);
console.log(`  - ${tier1.length} Tier 1 exercises`);
console.log(`  - ${tier2.length} Tier 2 exercises`);
console.log(`  - ${exercises.length} total exercises`);
