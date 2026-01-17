-- =============================================================================
-- Rehabify Mock Data for Demo
-- Version: 003
-- Description: Sample PT, patient, sessions, messages for demo/testing
--
-- RUN THIS AFTER: 001_complete_schema.sql and 002_seed_data.sql
--
-- Demo Accounts:
--   PT:      dr.sarah@rehabify.demo (password: demo123)
--   Patient: alex.patient@rehabify.demo (password: demo123)
-- =============================================================================

-- =============================================================================
-- MOCK USERS (via Neon Auth - these are placeholders)
-- In production, create these accounts via the auth system first
-- =============================================================================

-- Note: In a real setup, you'd create auth.users entries first via Neon Auth
-- These UUIDs are deterministic for demo purposes
DO $$
DECLARE
  pt_id UUID := '11111111-1111-1111-1111-111111111111';
  patient_id UUID := '22222222-2222-2222-2222-222222222222';
  plan_id UUID := '33333333-3333-3333-3333-333333333333';
  assessment_id UUID := '44444444-4444-4444-4444-444444444444';
  week_ids UUID[] := ARRAY[
    '55555555-5555-5555-5555-555555555001'::UUID,
    '55555555-5555-5555-5555-555555555002'::UUID,
    '55555555-5555-5555-5555-555555555003'::UUID,
    '55555555-5555-5555-5555-555555555004'::UUID,
    '55555555-5555-5555-5555-555555555005'::UUID,
    '55555555-5555-5555-5555-555555555006'::UUID,
    '55555555-5555-5555-5555-555555555007'::UUID,
    '55555555-5555-5555-5555-555555555008'::UUID,
    '55555555-5555-5555-5555-555555555009'::UUID,
    '55555555-5555-5555-5555-555555555010'::UUID,
    '55555555-5555-5555-5555-555555555011'::UUID,
    '55555555-5555-5555-5555-555555555012'::UUID
  ];
  session_ids UUID[] := ARRAY[
    '66666666-6666-6666-6666-666666666001'::UUID,
    '66666666-6666-6666-6666-666666666002'::UUID,
    '66666666-6666-6666-6666-666666666003'::UUID,
    '66666666-6666-6666-6666-666666666004'::UUID,
    '66666666-6666-6666-6666-666666666005'::UUID,
    '66666666-6666-6666-6666-666666666006'::UUID,
    '66666666-6666-6666-6666-666666666007'::UUID,
    '66666666-6666-6666-6666-666666666008'::UUID,
    '66666666-6666-6666-6666-666666666009'::UUID,
    '66666666-6666-6666-6666-666666666010'::UUID
  ];
  cat_camel_id UUID;
  cobra_id UUID;
  dead_bug_id UUID;
  bird_dog_id UUID;
  pelvic_tilts_id UUID;
BEGIN

  -- =============================================================================
  -- PROFILES
  -- =============================================================================

  -- PT Profile: Dr. Sarah Chen
  INSERT INTO profiles (id, email, display_name, role, xp, level, created_at)
  VALUES (
    pt_id,
    'dr.sarah@rehabify.demo',
    'Dr. Sarah Chen, DPT',
    'pt',
    0,
    1,
    NOW() - INTERVAL '6 months'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

  -- Patient Profile: Alex Thompson
  INSERT INTO profiles (
    id, email, display_name, role, pt_id,
    xp, level, current_streak, longest_streak, last_workout_date,
    preferences, created_at
  )
  VALUES (
    patient_id,
    'alex.patient@rehabify.demo',
    'Alex Thompson',
    'patient',
    pt_id,
    2450,
    8,
    5,
    12,
    CURRENT_DATE - 1,
    '{
      "voice_speed": "normal",
      "voice_verbosity": "standard",
      "difficulty_level": "intermediate",
      "notifications_enabled": true
    }'::JSONB,
    NOW() - INTERVAL '3 weeks'
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    pt_id = EXCLUDED.pt_id,
    xp = EXCLUDED.xp,
    level = EXCLUDED.level,
    current_streak = EXCLUDED.current_streak;

  -- =============================================================================
  -- PT CANNED RESPONSES
  -- =============================================================================

  INSERT INTO canned_responses (pt_id, title, content, category, sort_order) VALUES
  (pt_id, 'Great Progress', 'Great progress on your form! Keep up the excellent work.', 'encouragement', 1),
  (pt_id, 'Rest Days', 'Remember to take rest days when needed - recovery is part of the process.', 'guidance', 2),
  (pt_id, 'Pain Improvement', 'I noticed some improvement in your pain levels - that''s encouraging!', 'feedback', 3),
  (pt_id, 'Schedule Check-in', 'Let''s discuss your progress at our next check-in.', 'scheduling', 4),
  (pt_id, 'Slow Movements', 'Try to focus on slow, controlled movements rather than rushing through reps.', 'correction', 5),
  (pt_id, 'Pain Alert', 'If you''re experiencing increased pain, please let me know right away.', 'warning', 6),
  (pt_id, 'Form Reminder', 'Remember: quality over quantity. Focus on perfect form for each rep.', 'correction', 7),
  (pt_id, 'Hydration', 'Make sure you''re staying hydrated before and after your sessions.', 'guidance', 8)
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- ASSESSMENT
  -- =============================================================================

  INSERT INTO assessments (id, patient_id, status, chief_complaint, pain_location, pain_level, pain_duration, pain_triggers, functional_limitations, medical_history, current_medications, previous_treatments, goals, directional_preference, ai_summary, created_at)
  VALUES (
    assessment_id,
    patient_id,
    'completed',
    'Lower back pain that started 3 months ago after lifting heavy boxes during a move',
    ARRAY['lower_back', 'left_hip'],
    6,
    '3 months',
    ARRAY['prolonged sitting', 'bending forward', 'lifting'],
    ARRAY['difficulty sitting for more than 30 minutes', 'trouble bending to tie shoes', 'interrupted sleep'],
    ARRAY['No previous back injuries', 'Generally healthy'],
    ARRAY['Ibuprofen as needed'],
    ARRAY['Tried heat packs at home', 'Some stretching from YouTube videos'],
    ARRAY['Return to normal daily activities', 'Be able to sit through work meetings', 'Play with kids without pain'],
    'extension',
    'Patient presents with mechanical lower back pain of 3 months duration following lifting injury. Pain is aggravated by flexion activities and prolonged sitting. Extension preference noted. Good candidate for McKenzie-based approach with focus on extension exercises and postural correction. Recommend starting with gentle mobility work progressing to core stability.',
    NOW() - INTERVAL '3 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================================================
  -- REHABILITATION PLAN (12 weeks)
  -- =============================================================================

  INSERT INTO plans (id, patient_id, pt_id, name, status, duration_weeks, current_week, assessment_id, ai_generated, reviewed_at, reviewed_by, created_at)
  VALUES (
    plan_id,
    patient_id,
    pt_id,
    'Lower Back Rehabilitation Program',
    'approved',
    12,
    3,
    assessment_id,
    TRUE,
    NOW() - INTERVAL '20 days',
    pt_id,
    NOW() - INTERVAL '3 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  -- Get exercise IDs
  SELECT id INTO cat_camel_id FROM exercises WHERE slug = 'cat-camel' LIMIT 1;
  SELECT id INTO cobra_id FROM exercises WHERE slug = 'cobra-stretch' LIMIT 1;
  SELECT id INTO dead_bug_id FROM exercises WHERE slug = 'dead-bug' LIMIT 1;
  SELECT id INTO bird_dog_id FROM exercises WHERE slug = 'bird-dog' LIMIT 1;
  SELECT id INTO pelvic_tilts_id FROM exercises WHERE slug = 'pelvic-tilts' LIMIT 1;

  -- Create 12 weeks of plan structure
  FOR i IN 1..12 LOOP
    INSERT INTO plan_weeks (id, plan_id, week_number, focus, notes, exercises)
    VALUES (
      week_ids[i],
      plan_id,
      i,
      CASE
        WHEN i <= 2 THEN 'Pain relief and gentle mobility'
        WHEN i <= 4 THEN 'Core activation and stability basics'
        WHEN i <= 6 THEN 'Progressive strengthening'
        WHEN i <= 8 THEN 'Functional movement patterns'
        WHEN i <= 10 THEN 'Advanced stability and endurance'
        ELSE 'Maintenance and independence'
      END,
      CASE
        WHEN i <= 2 THEN 'Focus on pain-free movement. Stop if pain increases.'
        WHEN i <= 4 THEN 'Begin engaging core muscles. Maintain neutral spine.'
        WHEN i <= 6 THEN 'Increase difficulty gradually. Monitor fatigue.'
        WHEN i <= 8 THEN 'Apply exercises to daily movements.'
        WHEN i <= 10 THEN 'Build endurance. Longer holds, more reps.'
        ELSE 'You''re ready for independent maintenance!'
      END,
      CASE
        WHEN i <= 2 THEN jsonb_build_array(
          jsonb_build_object('exercise_id', cat_camel_id, 'sets', 2, 'reps', 8, 'days', ARRAY[1,3,5]),
          jsonb_build_object('exercise_id', cobra_id, 'sets', 2, 'reps', 6, 'days', ARRAY[1,3,5]),
          jsonb_build_object('exercise_id', pelvic_tilts_id, 'sets', 2, 'reps', 10, 'days', ARRAY[2,4,6])
        )
        WHEN i <= 4 THEN jsonb_build_array(
          jsonb_build_object('exercise_id', cat_camel_id, 'sets', 3, 'reps', 10, 'days', ARRAY[1,3,5]),
          jsonb_build_object('exercise_id', cobra_id, 'sets', 3, 'reps', 8, 'days', ARRAY[1,3,5]),
          jsonb_build_object('exercise_id', dead_bug_id, 'sets', 2, 'reps', 8, 'days', ARRAY[2,4,6]),
          jsonb_build_object('exercise_id', bird_dog_id, 'sets', 2, 'reps', 8, 'days', ARRAY[2,4,6])
        )
        ELSE jsonb_build_array(
          jsonb_build_object('exercise_id', cat_camel_id, 'sets', 3, 'reps', 12, 'days', ARRAY[1,2,3,4,5]),
          jsonb_build_object('exercise_id', cobra_id, 'sets', 3, 'reps', 10, 'days', ARRAY[1,3,5]),
          jsonb_build_object('exercise_id', dead_bug_id, 'sets', 3, 'reps', 12, 'days', ARRAY[1,2,3,4,5]),
          jsonb_build_object('exercise_id', bird_dog_id, 'sets', 3, 'reps', 10, 'days', ARRAY[2,4,6])
        )
      END
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- =============================================================================
  -- COMPLETED SESSIONS (10 sessions over 3 weeks)
  -- =============================================================================

  -- Week 1, Day 1 - First session, learning form
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[1],
    patient_id,
    plan_id,
    week_ids[1],
    CURRENT_DATE - 19,
    'completed',
    720,
    72,
    6,
    5,
    4,
    'First session went well. Still learning the movements.',
    NOW() - INTERVAL '19 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 1, Day 3
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[2],
    patient_id,
    plan_id,
    week_ids[1],
    CURRENT_DATE - 17,
    'completed',
    680,
    76,
    5,
    4,
    4,
    'Feeling more comfortable with cat-camel.',
    NOW() - INTERVAL '17 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 1, Day 5
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[3],
    patient_id,
    plan_id,
    week_ids[1],
    CURRENT_DATE - 15,
    'completed',
    650,
    81,
    5,
    4,
    5,
    'Great session! Pain is definitely improving.',
    NOW() - INTERVAL '15 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 2, Day 1
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[4],
    patient_id,
    plan_id,
    week_ids[2],
    CURRENT_DATE - 12,
    'completed',
    710,
    83,
    5,
    3,
    5,
    'Cobra stretch is getting easier. Less stiffness in the morning.',
    NOW() - INTERVAL '12 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 2, Day 3
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[5],
    patient_id,
    plan_id,
    week_ids[2],
    CURRENT_DATE - 10,
    'completed',
    695,
    85,
    4,
    3,
    5,
    'Starting to feel stronger.',
    NOW() - INTERVAL '10 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 2, Day 5
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[6],
    patient_id,
    plan_id,
    week_ids[2],
    CURRENT_DATE - 8,
    'completed',
    720,
    87,
    4,
    3,
    5,
    'Best session yet! Form feedback is really helpful.',
    NOW() - INTERVAL '8 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 3, Day 1
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[7],
    patient_id,
    plan_id,
    week_ids[3],
    CURRENT_DATE - 5,
    'completed',
    750,
    88,
    4,
    2,
    5,
    'Dead bug is challenging but I can feel my core working.',
    NOW() - INTERVAL '5 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 3, Day 3 - Slight setback (slept wrong)
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[8],
    patient_id,
    plan_id,
    week_ids[3],
    CURRENT_DATE - 3,
    'completed',
    680,
    82,
    6,
    5,
    3,
    'Woke up with some stiffness. Took it easy today.',
    NOW() - INTERVAL '3 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 3, Day 4 - High pain day (triggers alert)
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[9],
    patient_id,
    plan_id,
    week_ids[3],
    CURRENT_DATE - 2,
    'completed',
    540,
    78,
    7,
    6,
    2,
    'Pain flared up after sitting too long at work yesterday. Had to cut the session short.',
    NOW() - INTERVAL '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- Week 3, Day 5 - Recovery
  INSERT INTO sessions (id, patient_id, plan_id, plan_week_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at)
  VALUES (
    session_ids[10],
    patient_id,
    plan_id,
    week_ids[3],
    CURRENT_DATE - 1,
    'completed',
    700,
    85,
    5,
    3,
    4,
    'Feeling better today. The exercises really do help.',
    NOW() - INTERVAL '1 day'
  ) ON CONFLICT (id) DO NOTHING;

  -- =============================================================================
  -- EXERCISE RESULTS (for each session)
  -- =============================================================================

  -- Session 1 results
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[1], cat_camel_id, 2, 16, 70, ARRAY['spine_not_fully_curved', 'moving_too_fast'], 'Learning the movement pattern'),
  (session_ids[1], cobra_id, 2, 12, 74, ARRAY['hips_lifting'], 'Need to keep hips down')
  ON CONFLICT DO NOTHING;

  -- Session 2 results
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[2], cat_camel_id, 2, 16, 78, ARRAY['moving_too_fast'], NULL),
  (session_ids[2], cobra_id, 2, 12, 75, ARRAY['hips_lifting'], NULL)
  ON CONFLICT DO NOTHING;

  -- Session 3 results
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[3], cat_camel_id, 2, 16, 84, NULL, 'Much better rhythm'),
  (session_ids[3], cobra_id, 2, 12, 80, NULL, 'Good form today')
  ON CONFLICT DO NOTHING;

  -- Session 4 results
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[4], cat_camel_id, 3, 30, 85, NULL, NULL),
  (session_ids[4], cobra_id, 3, 24, 82, NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- Session 5 results
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[5], cat_camel_id, 3, 30, 86, NULL, NULL),
  (session_ids[5], cobra_id, 3, 24, 84, NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- Session 6 results
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[6], cat_camel_id, 3, 30, 88, NULL, 'Excellent control'),
  (session_ids[6], cobra_id, 3, 24, 86, NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- Session 7 results (adding Dead Bug)
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[7], cat_camel_id, 3, 30, 90, NULL, NULL),
  (session_ids[7], cobra_id, 3, 24, 88, NULL, NULL),
  (session_ids[7], dead_bug_id, 2, 16, 82, ARRAY['back_arching'], 'New exercise - learning form')
  ON CONFLICT DO NOTHING;

  -- Session 8 results (setback day)
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[8], cat_camel_id, 3, 30, 84, NULL, 'Moved slowly due to stiffness'),
  (session_ids[8], cobra_id, 2, 16, 80, NULL, 'Reduced intensity')
  ON CONFLICT DO NOTHING;

  -- Session 9 results (high pain day)
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[9], cat_camel_id, 2, 20, 78, NULL, 'Cut short due to pain'),
  (session_ids[9], cobra_id, 2, 12, 78, NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- Session 10 results (recovery)
  INSERT INTO exercise_results (session_id, exercise_id, sets_completed, reps_completed, form_score, form_issues, notes) VALUES
  (session_ids[10], cat_camel_id, 3, 30, 86, NULL, NULL),
  (session_ids[10], cobra_id, 3, 24, 84, NULL, NULL),
  (session_ids[10], dead_bug_id, 2, 16, 85, NULL, 'Better core engagement')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- MESSAGES (PT-Patient communication)
  -- =============================================================================

  -- Initial welcome message from PT
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (pt_id, patient_id, 'Hi Alex! Welcome to Rehabify. I''ve reviewed your assessment and created a personalized 12-week program for your lower back. The first two weeks will focus on gentle mobility to reduce pain. Feel free to message me anytime if you have questions!', NOW() - INTERVAL '20 days', NOW() - INTERVAL '21 days')
  ON CONFLICT DO NOTHING;

  -- Patient question
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (patient_id, pt_id, 'Thanks Dr. Chen! Quick question - should I feel a stretch during the cat-camel exercise or should it be completely pain-free?', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days' + INTERVAL '2 hours')
  ON CONFLICT DO NOTHING;

  -- PT response
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (pt_id, patient_id, 'Great question! You should feel a gentle stretch, but no sharp pain. The movement should feel comfortable - think of it as "exploring your range of motion" rather than pushing limits. If you feel any sharp pain, reduce the range. Let me know how your next session goes!', NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days' + INTERVAL '4 hours')
  ON CONFLICT DO NOTHING;

  -- Week 1 check-in from PT
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (pt_id, patient_id, 'I saw your first week of sessions - great job staying consistent! Your form scores are improving nicely. How are you feeling overall? Any changes in your pain levels?', NOW() - INTERVAL '13 days', NOW() - INTERVAL '14 days')
  ON CONFLICT DO NOTHING;

  -- Patient update
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (patient_id, pt_id, 'Feeling much better! The morning stiffness is definitely less. I''m starting to sit through work meetings without as much discomfort. The voice coaching is really helpful for keeping my form correct.', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days' + INTERVAL '3 hours')
  ON CONFLICT DO NOTHING;

  -- Recent message about pain flare
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (patient_id, pt_id, 'Had a rough day yesterday - pain was higher than usual. I think I sat too long in a meeting. The session today was harder.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days' + INTERVAL '1 hour')
  ON CONFLICT DO NOTHING;

  -- PT response to flare
  INSERT INTO messages (sender_id, recipient_id, content, read_at, created_at) VALUES
  (pt_id, patient_id, 'I saw the alert and your session notes. Flare-ups are normal during recovery, especially after prolonged sitting. Try to take micro-breaks every 30 minutes at work - even just standing and doing a few gentle back extensions. You made the right call taking it easy. Let me know if the pain doesn''t settle in a day or two.', NULL, NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- NOTIFICATIONS
  -- =============================================================================

  -- Notifications for patient
  INSERT INTO notifications (user_id, type, title, message, data, read_at, created_at) VALUES
  (patient_id, 'plan_approved', 'Plan Approved!', 'Dr. Chen has approved your rehabilitation plan. You''re ready to start!', '{"plan_id": "' || plan_id || '"}'::JSONB, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (patient_id, 'achievement', 'Achievement Unlocked!', 'You earned "First Steps" - Complete your first workout session', '{"achievement": "First Steps", "xp": 50}'::JSONB, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
  (patient_id, 'streak', 'Streak Milestone!', 'You''re on a 5-day streak! Keep it up!', '{"streak": 5}'::JSONB, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (patient_id, 'new_message', 'New Message', 'Dr. Chen sent you a message', '{"sender": "Dr. Sarah Chen, DPT"}'::JSONB, NULL, NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- Notifications for PT
  INSERT INTO notifications (user_id, type, title, message, data, read_at, created_at) VALUES
  (pt_id, 'new_patient', 'New Patient Assigned', 'Alex Thompson has been assigned to you', '{"patient_id": "' || patient_id || '"}'::JSONB, NOW() - INTERVAL '20 days', NOW() - INTERVAL '21 days'),
  (pt_id, 'plan_review', 'Plan Ready for Review', 'AI-generated plan for Alex Thompson needs your approval', '{"patient_id": "' || patient_id || '", "plan_id": "' || plan_id || '"}'::JSONB, NOW() - INTERVAL '20 days', NOW() - INTERVAL '21 days'),
  (pt_id, 'alert', 'High Pain Alert', 'Alex Thompson reported pain level 7/10', '{"patient_id": "' || patient_id || '", "pain_level": 7}'::JSONB, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  (pt_id, 'new_message', 'New Message', 'Alex Thompson sent you a message', '{"sender": "Alex Thompson"}'::JSONB, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days' + INTERVAL '1 hour')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- PT ALERTS
  -- =============================================================================

  -- High pain alert (from session 9)
  INSERT INTO pt_alerts (pt_id, patient_id, session_id, type, severity, title, description, recommendation, status, created_at) VALUES
  (pt_id, patient_id, session_ids[9], 'high_pain', 'high', 'High Pain Reported', 'Patient reported pain level 7/10 during session, up from baseline of 4/10', 'Consider checking in with patient about the pain spike. May need to temporarily reduce exercise intensity.', 'active', NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- Form regression alert (noticed in session 8)
  INSERT INTO pt_alerts (pt_id, patient_id, session_id, type, severity, title, description, recommendation, status, dismissed_at, dismiss_reason, created_at) VALUES
  (pt_id, patient_id, session_ids[8], 'form_regression', 'medium', 'Form Score Decreased', 'Form score dropped from 87 to 82 (6% decrease)', 'Monitor next few sessions. Patient noted morning stiffness which may explain the regression.', 'dismissed', NOW() - INTERVAL '2 days', 'Temporary setback due to sleep position. Patient recovered.', NOW() - INTERVAL '3 days')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- PT RECOMMENDATIONS (AI-generated suggestions)
  -- =============================================================================

  -- Recommendation to progress difficulty
  INSERT INTO pt_recommendations (pt_id, patient_id, plan_id, type, title, description, rationale, suggested_changes, confidence_score, status, created_at) VALUES
  (pt_id, patient_id, plan_id, 'progress', 'Ready for Progression', 'Patient may be ready to increase exercise difficulty', 'Average form score 85%+ over last 5 sessions. Pain levels consistently decreasing. Good adherence to program.', '{"changes": [{"exercise": "cat-camel", "current_reps": 10, "suggested_reps": 12}, {"exercise": "cobra", "current_sets": 3, "suggested_sets": 4}]}'::JSONB, 0.82, 'pending', NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- USER ACHIEVEMENTS
  -- =============================================================================

  -- Get achievement IDs and award them
  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT patient_id, id, NOW() - INTERVAL '19 days'
  FROM achievements WHERE name = 'First Steps'
  ON CONFLICT DO NOTHING;

  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT patient_id, id, NOW() - INTERVAL '8 days'
  FROM achievements WHERE name = 'Dedicated'
  ON CONFLICT DO NOTHING;

  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT patient_id, id, NOW() - INTERVAL '6 days'
  FROM achievements WHERE name = 'Week Warrior'
  ON CONFLICT DO NOTHING;

  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT patient_id, id, NOW() - INTERVAL '15 days'
  FROM achievements WHERE name = 'Good Form'
  ON CONFLICT DO NOTHING;

  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT patient_id, id, NOW() - INTERVAL '12 days'
  FROM achievements WHERE name = 'Century Club'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Mock data for Alex Thompson inserted!';

END $$;

-- =============================================================================
-- ADDITIONAL PATIENTS FOR PT DASHBOARD
-- =============================================================================

DO $$
DECLARE
  pt_id UUID := '11111111-1111-1111-1111-111111111111';

  -- Patient 2: Maria - Star patient, ahead of schedule
  maria_id UUID := '22222222-2222-2222-2222-222222222002';
  maria_plan_id UUID := '33333333-3333-3333-3333-333333333002';
  maria_assessment_id UUID := '44444444-4444-4444-4444-444444444002';

  -- Patient 3: James - New patient, just started
  james_id UUID := '22222222-2222-2222-2222-222222222003';
  james_plan_id UUID := '33333333-3333-3333-3333-333333333003';
  james_assessment_id UUID := '44444444-4444-4444-4444-444444444003';

  -- Patient 4: Sofia - Struggling, needs attention
  sofia_id UUID := '22222222-2222-2222-2222-222222222004';
  sofia_plan_id UUID := '33333333-3333-3333-3333-333333333004';
  sofia_assessment_id UUID := '44444444-4444-4444-4444-444444444004';

  -- Patient 5: Marcus - Plan pending review
  marcus_id UUID := '22222222-2222-2222-2222-222222222005';
  marcus_plan_id UUID := '33333333-3333-3333-3333-333333333005';
  marcus_assessment_id UUID := '44444444-4444-4444-4444-444444444005';

  cat_camel_id UUID;
  cobra_id UUID;
  dead_bug_id UUID;
  bird_dog_id UUID;
  wall_slides_id UUID;
  external_rotation_id UUID;
  quad_sets_id UUID;
  heel_slides_id UUID;
BEGIN

  -- Get exercise IDs
  SELECT id INTO cat_camel_id FROM exercises WHERE slug = 'cat-camel' LIMIT 1;
  SELECT id INTO cobra_id FROM exercises WHERE slug = 'cobra-stretch' LIMIT 1;
  SELECT id INTO dead_bug_id FROM exercises WHERE slug = 'dead-bug' LIMIT 1;
  SELECT id INTO bird_dog_id FROM exercises WHERE slug = 'bird-dog' LIMIT 1;
  SELECT id INTO wall_slides_id FROM exercises WHERE slug = 'wall-slides' LIMIT 1;
  SELECT id INTO external_rotation_id FROM exercises WHERE slug = 'external-rotation' LIMIT 1;
  SELECT id INTO quad_sets_id FROM exercises WHERE slug = 'quad-sets' LIMIT 1;
  SELECT id INTO heel_slides_id FROM exercises WHERE slug = 'heel-slides' LIMIT 1;

  -- =============================================================================
  -- PATIENT 2: Maria Rodriguez - Star Patient (Shoulder, Week 8)
  -- =============================================================================

  INSERT INTO profiles (id, email, display_name, role, pt_id, xp, level, current_streak, longest_streak, last_workout_date, created_at)
  VALUES (
    maria_id,
    'maria.r@rehabify.demo',
    'Maria Rodriguez',
    'patient',
    pt_id,
    5200,
    12,
    18,
    18,
    CURRENT_DATE,
    NOW() - INTERVAL '8 weeks'
  ) ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

  INSERT INTO assessments (id, patient_id, status, chief_complaint, pain_location, pain_level, pain_duration, goals, directional_preference, created_at)
  VALUES (
    maria_assessment_id,
    maria_id,
    'completed',
    'Right shoulder pain after rotator cuff strain from tennis',
    ARRAY['shoulder', 'right_arm'],
    5,
    '6 weeks',
    ARRAY['Return to tennis', 'Full overhead mobility', 'Pain-free sleeping'],
    'external_rotation',
    NOW() - INTERVAL '8 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO plans (id, patient_id, pt_id, name, status, duration_weeks, current_week, assessment_id, ai_generated, reviewed_at, reviewed_by, created_at)
  VALUES (
    maria_plan_id,
    maria_id,
    pt_id,
    'Rotator Cuff Rehabilitation',
    'approved',
    12,
    8,
    maria_assessment_id,
    TRUE,
    NOW() - INTERVAL '8 weeks',
    pt_id,
    NOW() - INTERVAL '8 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  -- Maria's recent sessions (excellent progress)
  INSERT INTO sessions (patient_id, plan_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, created_at) VALUES
  (maria_id, maria_plan_id, CURRENT_DATE - 2, 'completed', 840, 94, 2, 1, 5, NOW() - INTERVAL '2 days'),
  (maria_id, maria_plan_id, CURRENT_DATE - 1, 'completed', 820, 96, 1, 1, 5, NOW() - INTERVAL '1 day'),
  (maria_id, maria_plan_id, CURRENT_DATE, 'completed', 850, 95, 1, 0, 5, NOW())
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- PATIENT 3: James Wilson - New Patient (Knee, Week 1)
  -- =============================================================================

  INSERT INTO profiles (id, email, display_name, role, pt_id, xp, level, current_streak, longest_streak, last_workout_date, created_at)
  VALUES (
    james_id,
    'james.w@rehabify.demo',
    'James Wilson',
    'patient',
    pt_id,
    150,
    2,
    2,
    2,
    CURRENT_DATE - 1,
    NOW() - INTERVAL '4 days'
  ) ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

  INSERT INTO assessments (id, patient_id, status, chief_complaint, pain_location, pain_level, pain_duration, goals, created_at)
  VALUES (
    james_assessment_id,
    james_id,
    'completed',
    'Left knee pain after ACL reconstruction surgery 6 weeks ago',
    ARRAY['knee', 'left_leg'],
    4,
    '6 weeks post-op',
    ARRAY['Regain full knee flexion', 'Walk without limp', 'Return to hiking'],
    NOW() - INTERVAL '4 days'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO plans (id, patient_id, pt_id, name, status, duration_weeks, current_week, assessment_id, ai_generated, reviewed_at, reviewed_by, created_at)
  VALUES (
    james_plan_id,
    james_id,
    pt_id,
    'Post-ACL Reconstruction Protocol',
    'approved',
    16,
    1,
    james_assessment_id,
    TRUE,
    NOW() - INTERVAL '3 days',
    pt_id,
    NOW() - INTERVAL '4 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- James's sessions (just starting)
  INSERT INTO sessions (patient_id, plan_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at) VALUES
  (james_id, james_plan_id, CURRENT_DATE - 2, 'completed', 480, 72, 4, 4, 4, 'Taking it slow as instructed', NOW() - INTERVAL '2 days'),
  (james_id, james_plan_id, CURRENT_DATE - 1, 'completed', 520, 75, 4, 3, 4, 'Knee felt a bit better today', NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- PATIENT 4: Sofia Martinez - Struggling (Lower Back, Week 5)
  -- =============================================================================

  INSERT INTO profiles (id, email, display_name, role, pt_id, xp, level, current_streak, longest_streak, last_workout_date, created_at)
  VALUES (
    sofia_id,
    'sofia.m@rehabify.demo',
    'Sofia Martinez',
    'patient',
    pt_id,
    980,
    5,
    0,
    4,
    CURRENT_DATE - 4,
    NOW() - INTERVAL '5 weeks'
  ) ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

  INSERT INTO assessments (id, patient_id, status, chief_complaint, pain_location, pain_level, pain_duration, goals, directional_preference, created_at)
  VALUES (
    sofia_assessment_id,
    sofia_id,
    'completed',
    'Chronic lower back pain, worse with pregnancy 2 years ago',
    ARRAY['lower_back', 'pelvis'],
    7,
    '2 years',
    ARRAY['Pick up toddler without pain', 'Exercise again', 'Sleep through the night'],
    'neutral',
    NOW() - INTERVAL '5 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO plans (id, patient_id, pt_id, name, status, duration_weeks, current_week, assessment_id, ai_generated, reviewed_at, reviewed_by, created_at)
  VALUES (
    sofia_plan_id,
    sofia_id,
    pt_id,
    'Post-Partum Core Rehabilitation',
    'approved',
    12,
    5,
    sofia_assessment_id,
    TRUE,
    NOW() - INTERVAL '5 weeks',
    pt_id,
    NOW() - INTERVAL '5 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  -- Sofia's sessions (inconsistent, struggling)
  INSERT INTO sessions (patient_id, plan_id, date, status, duration_seconds, overall_form_score, pain_before, pain_after, patient_rating, patient_feedback, created_at) VALUES
  (sofia_id, sofia_plan_id, CURRENT_DATE - 7, 'completed', 600, 68, 6, 6, 3, 'Hard to find time with the baby', NOW() - INTERVAL '7 days'),
  (sofia_id, sofia_plan_id, CURRENT_DATE - 4, 'completed', 420, 62, 7, 7, 2, 'Pain was bad today, had to stop early', NOW() - INTERVAL '4 days')
  ON CONFLICT DO NOTHING;

  -- Sofia's alerts (multiple concerns)
  INSERT INTO pt_alerts (pt_id, patient_id, type, severity, title, description, recommendation, status, created_at) VALUES
  (pt_id, sofia_id, 'missed_sessions', 'medium', 'Adherence Concern', 'Patient has missed 3 sessions in the past week', 'Check in about barriers to exercise. Consider adjusting schedule or exercise selection.', 'active', NOW() - INTERVAL '1 day'),
  (pt_id, sofia_id, 'no_improvement', 'high', 'Pain Not Improving', 'Pain levels remain at 6-7/10 after 5 weeks', 'Consider modifying program. May need in-person evaluation.', 'active', NOW() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- Sofia's message asking for help
  INSERT INTO messages (sender_id, recipient_id, content, created_at) VALUES
  (sofia_id, pt_id, 'Dr. Chen, I''m really struggling to keep up. Between the baby and work, I can barely find 10 minutes. And the pain isn''t getting better. Should we try something different?', NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- PATIENT 5: Marcus Johnson - Pending Review (Ankle, New)
  -- =============================================================================

  INSERT INTO profiles (id, email, display_name, role, pt_id, xp, level, current_streak, longest_streak, last_workout_date, created_at)
  VALUES (
    marcus_id,
    'marcus.j@rehabify.demo',
    'Marcus Johnson',
    'patient',
    pt_id,
    0,
    1,
    0,
    0,
    NULL,
    NOW() - INTERVAL '1 day'
  ) ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

  INSERT INTO assessments (id, patient_id, status, chief_complaint, pain_location, pain_level, pain_duration, goals, created_at)
  VALUES (
    marcus_assessment_id,
    marcus_id,
    'completed',
    'Right ankle sprain from basketball, 3rd sprain this year',
    ARRAY['ankle', 'right_foot'],
    5,
    '2 weeks',
    ARRAY['Return to basketball', 'Prevent future sprains', 'Improve ankle stability'],
    NOW() - INTERVAL '1 day'
  ) ON CONFLICT (id) DO NOTHING;

  -- Marcus's plan is pending PT review
  INSERT INTO plans (id, patient_id, pt_id, name, status, duration_weeks, current_week, assessment_id, ai_generated, created_at)
  VALUES (
    marcus_plan_id,
    marcus_id,
    pt_id,
    'Ankle Stability and Sprain Prevention',
    'pending_review',
    8,
    1,
    marcus_assessment_id,
    TRUE,
    NOW() - INTERVAL '1 day'
  ) ON CONFLICT (id) DO NOTHING;

  -- Notification for PT about pending plan
  INSERT INTO notifications (user_id, type, title, message, data, created_at) VALUES
  (pt_id, 'plan_review', 'New Plan Pending Review', 'AI-generated plan for Marcus Johnson is ready for your review', '{"patient_id": "' || marcus_id || '", "plan_id": "' || marcus_plan_id || '"}'::JSONB, NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- =============================================================================
  -- PT DASHBOARD SUMMARY
  -- =============================================================================

  RAISE NOTICE '✅ Additional patients inserted!';
  RAISE NOTICE '';
  RAISE NOTICE '   PT Dashboard now shows:';
  RAISE NOTICE '   ┌─────────────────┬───────────┬────────┬──────────┬─────────────┐';
  RAISE NOTICE '   │ Patient         │ Condition │ Week   │ Status   │ Alerts      │';
  RAISE NOTICE '   ├─────────────────┼───────────┼────────┼──────────┼─────────────┤';
  RAISE NOTICE '   │ Alex Thompson   │ Lower Back│ 3/12   │ On Track │ 1 (pain)    │';
  RAISE NOTICE '   │ Maria Rodriguez │ Shoulder  │ 8/12   │ Excellent│ 0           │';
  RAISE NOTICE '   │ James Wilson    │ Knee (ACL)│ 1/16   │ New      │ 0           │';
  RAISE NOTICE '   │ Sofia Martinez  │ Lower Back│ 5/12   │ Struggling│ 2 (urgent) │';
  RAISE NOTICE '   │ Marcus Johnson  │ Ankle     │ -      │ Pending  │ 0           │';
  RAISE NOTICE '   └─────────────────┴───────────┴────────┴──────────┴─────────────┘';
  RAISE NOTICE '';
  RAISE NOTICE '   Dashboard metrics:';
  RAISE NOTICE '   - Total Patients: 5';
  RAISE NOTICE '   - Pending Reviews: 1';
  RAISE NOTICE '   - Active Alerts: 3';
  RAISE NOTICE '   - Needs Attention: 2';

END $$;
