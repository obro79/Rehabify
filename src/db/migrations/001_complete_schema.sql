-- =============================================================================
-- Rehabify Complete Database Schema Migration
-- Version: 001
-- Description: Complete schema including all PT features, messaging, notifications
--
-- RUN THIS WITH: npx drizzle-kit push
-- OR MANUALLY:   psql $DATABASE_URL -f src/db/migrations/001_complete_schema.sql
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profiles (extends Neon Auth users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User info
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,

  -- Role and assignment
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'pt', 'admin')),
  pt_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- PT notes on patient (for PT view)
  pt_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Gamification
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_workout_date DATE,

  -- Preferences
  preferences JSONB DEFAULT '{
    "voice_speed": "normal",
    "voice_verbosity": "standard",
    "difficulty_level": "beginner",
    "notifications_enabled": true
  }'::JSONB NOT NULL,

  -- Constraints
  CONSTRAINT xp_non_negative CHECK (xp >= 0),
  CONSTRAINT level_positive CHECK (level >= 1),
  CONSTRAINT streak_non_negative CHECK (current_streak >= 0)
);

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_pt ON profiles(pt_id) WHERE pt_id IS NOT NULL;

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------------------------
-- Exercises (static library)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Classification
  category TEXT NOT NULL,
  body_region TEXT NOT NULL,
  target_area TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tier INTEGER NOT NULL DEFAULT 2 CHECK (tier IN (1, 2)),

  -- Content
  description TEXT NOT NULL,
  instructions TEXT[] NOT NULL,
  common_mistakes TEXT[] DEFAULT '{}',
  modifications JSONB DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}',

  -- Exercise configuration
  default_reps INTEGER DEFAULT 10,
  default_sets INTEGER DEFAULT 3,
  default_hold_seconds INTEGER DEFAULT 0,
  rep_type TEXT DEFAULT 'standard',
  equipment TEXT,

  -- Media
  thumbnail_url TEXT,
  video_url TEXT,

  -- Vision config
  form_detection_enabled BOOLEAN DEFAULT FALSE,
  detection_config JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_body_region ON exercises(body_region);
CREATE INDEX IF NOT EXISTS idx_exercises_tier ON exercises(tier);
CREATE INDEX IF NOT EXISTS idx_exercises_slug ON exercises(slug);

-- -----------------------------------------------------------------------------
-- Plans (12-week rehabilitation programs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pt_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  name TEXT NOT NULL DEFAULT 'Rehabilitation Plan',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'modified')),

  -- 12-week structure (JSONB)
  structure JSONB NOT NULL,

  -- AI-generated content
  pt_summary TEXT,
  recommendations JSONB DEFAULT '[]'::JSONB,

  -- Review tracking
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_patient_id ON plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_plans_pt_id ON plans(pt_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Assessments (voice interview data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Interview data
  chief_complaint JSONB NOT NULL,
  pain_profile JSONB NOT NULL,
  functional_impact JSONB,
  medical_history JSONB,

  -- Movement screen
  movement_screen JSONB NOT NULL,

  -- Synthesis
  directional_preference TEXT CHECK (directional_preference IN ('flexion', 'extension', 'neutral')),
  red_flags TEXT[] DEFAULT '{}',

  -- Plan reference
  plan_id UUID REFERENCES plans(id),

  -- Session info
  duration_seconds INTEGER,
  voice_transcript TEXT,
  completed BOOLEAN DEFAULT FALSE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_assessments_patient_id ON assessments(patient_id);

-- -----------------------------------------------------------------------------
-- Plan Modifications (change history)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  modified_by UUID NOT NULL REFERENCES profiles(id),

  changes JSONB NOT NULL,
  notes TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plan_mods_plan_id ON plan_modifications(plan_id);

-- -----------------------------------------------------------------------------
-- Sessions (workout sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,

  date DATE NOT NULL,

  -- Exercise results
  exercises JSONB DEFAULT '[]'::JSONB,

  -- Metrics
  duration_seconds INTEGER DEFAULT 0,
  overall_form_score DECIMAL(5,2),

  -- Feedback
  overall_pain INTEGER CHECK (overall_pain >= 0 AND overall_pain <= 10),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  voice_feedback TEXT,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'missed')),

  -- XP
  xp_earned INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_plan_id ON sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);

-- -----------------------------------------------------------------------------
-- Session Notes (PT notes on sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),

  content TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);

-- -----------------------------------------------------------------------------
-- PT Alerts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pt_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pt_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('high_pain', 'missed_sessions', 'declining_form', 'patient_concern')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,

  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_by UUID REFERENCES profiles(id),
  dismiss_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_pt_id ON pt_alerts(pt_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON pt_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON pt_alerts(pt_id) WHERE dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON pt_alerts(severity);

-- -----------------------------------------------------------------------------
-- PT Recommendations (AI suggestions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pt_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pt_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('reduce_difficulty', 'increase_difficulty', 'substitute_exercise', 'modify_schedule')),
  reason TEXT NOT NULL,
  suggested_changes JSONB NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendations_pt_id ON pt_recommendations(pt_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_pending ON pt_recommendations(pt_id) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- Messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  image_url TEXT,

  read_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id) WHERE read_at IS NULL;

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('plan_update', 'new_message', 'alert', 'new_patient', 'achievement')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,

  read_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- -----------------------------------------------------------------------------
-- Canned Responses (PT templates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pt_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_canned_pt ON canned_responses(pt_id);

-- -----------------------------------------------------------------------------
-- Achievements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,

  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,

  xp_reward INTEGER DEFAULT 0 NOT NULL,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- -----------------------------------------------------------------------------
-- User Achievements (junction table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);


-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Auto-create alert on high pain
CREATE OR REPLACE FUNCTION create_pain_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.overall_pain > 5 THEN
    INSERT INTO pt_alerts (patient_id, pt_id, session_id, type, severity, title, description, recommendation)
    SELECT
      NEW.patient_id,
      p.pt_id,
      NEW.id,
      'high_pain',
      CASE WHEN NEW.overall_pain >= 8 THEN 'high' ELSE 'medium' END,
      'High Pain Reported',
      format('Patient reported pain level %s/10 after session', NEW.overall_pain),
      'Review session and consider reducing intensity'
    FROM profiles p
    WHERE p.id = NEW.patient_id AND p.pt_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS session_pain_alert ON sessions;
CREATE TRIGGER session_pain_alert
  AFTER INSERT OR UPDATE OF overall_pain ON sessions
  FOR EACH ROW
  WHEN (NEW.overall_pain > 5)
  EXECUTE FUNCTION create_pain_alert();

-- Notify on plan update
CREATE OR REPLACE FUNCTION notify_plan_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.structure IS DISTINCT FROM NEW.structure THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.patient_id,
      'plan_update',
      'Your plan has been updated',
      'Your physical therapist has made changes to your exercise plan.',
      jsonb_build_object('planId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_update_notification ON plans;
CREATE TRIGGER plan_update_notification
  AFTER UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION notify_plan_update();

-- Notify on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    NEW.recipient_id,
    'new_message',
    format('New message from %s', p.display_name),
    LEFT(NEW.content, 100),
    jsonb_build_object('messageId', NEW.id, 'senderId', NEW.sender_id)
  FROM profiles p
  WHERE p.id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_notification ON messages;
CREATE TRIGGER message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Update streak on session completion
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_workout DATE;
  days_since INTEGER;
BEGIN
  SELECT last_workout_date INTO last_workout
  FROM profiles WHERE id = NEW.patient_id;

  IF last_workout IS NULL THEN
    UPDATE profiles
    SET current_streak = 1, longest_streak = GREATEST(longest_streak, 1), last_workout_date = NEW.date
    WHERE id = NEW.patient_id;
  ELSE
    days_since := NEW.date - last_workout;
    IF days_since = 1 THEN
      UPDATE profiles
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_workout_date = NEW.date
      WHERE id = NEW.patient_id;
    ELSIF days_since > 1 THEN
      UPDATE profiles
      SET current_streak = 1, last_workout_date = NEW.date
      WHERE id = NEW.patient_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_streak_on_session ON sessions;
CREATE TRIGGER update_streak_on_session
  AFTER INSERT ON sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_user_streak();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own, PTs can read their patients
DROP POLICY IF EXISTS profiles_own ON profiles;
CREATE POLICY profiles_own ON profiles FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_pt_read ON profiles;
CREATE POLICY profiles_pt_read ON profiles FOR SELECT
USING (pt_id = auth.uid() OR id IN (SELECT patient_id FROM plans WHERE pt_id = auth.uid()));

-- Plans
DROP POLICY IF EXISTS plans_patient ON plans;
CREATE POLICY plans_patient ON plans FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS plans_pt ON plans;
CREATE POLICY plans_pt ON plans FOR ALL
USING (pt_id = auth.uid() OR patient_id IN (SELECT id FROM profiles WHERE pt_id = auth.uid()));

-- Sessions
DROP POLICY IF EXISTS sessions_patient ON sessions;
CREATE POLICY sessions_patient ON sessions FOR ALL USING (patient_id = auth.uid());

DROP POLICY IF EXISTS sessions_pt ON sessions;
CREATE POLICY sessions_pt ON sessions FOR SELECT
USING (patient_id IN (SELECT id FROM profiles WHERE pt_id = auth.uid()));

-- Messages
DROP POLICY IF EXISTS messages_own ON messages;
CREATE POLICY messages_own ON messages FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS messages_send ON messages;
CREATE POLICY messages_send ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS messages_read ON messages;
CREATE POLICY messages_read ON messages FOR UPDATE USING (recipient_id = auth.uid());

-- Notifications
DROP POLICY IF EXISTS notifications_own ON notifications;
CREATE POLICY notifications_own ON notifications FOR ALL USING (user_id = auth.uid());

-- PT Alerts
DROP POLICY IF EXISTS alerts_pt ON pt_alerts;
CREATE POLICY alerts_pt ON pt_alerts FOR ALL USING (pt_id = auth.uid());

-- PT Recommendations
DROP POLICY IF EXISTS recommendations_pt ON pt_recommendations;
CREATE POLICY recommendations_pt ON pt_recommendations FOR ALL USING (pt_id = auth.uid());

-- Assessments
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessments_patient ON assessments;
CREATE POLICY assessments_patient ON assessments FOR ALL USING (patient_id = auth.uid());

DROP POLICY IF EXISTS assessments_pt ON assessments;
CREATE POLICY assessments_pt ON assessments FOR SELECT
USING (patient_id IN (SELECT id FROM profiles WHERE pt_id = auth.uid()));

-- Canned Responses
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS canned_responses_pt ON canned_responses;
CREATE POLICY canned_responses_pt ON canned_responses FOR ALL USING (pt_id = auth.uid());

-- Session Notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS session_notes_author ON session_notes;
CREATE POLICY session_notes_author ON session_notes FOR ALL USING (author_id = auth.uid());

DROP POLICY IF EXISTS session_notes_pt_read ON session_notes;
CREATE POLICY session_notes_pt_read ON session_notes FOR SELECT
USING (session_id IN (
  SELECT s.id FROM sessions s
  JOIN profiles p ON s.patient_id = p.id
  WHERE p.pt_id = auth.uid()
));

-- Plan Modifications
ALTER TABLE plan_modifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plan_mods_pt ON plan_modifications;
CREATE POLICY plan_mods_pt ON plan_modifications FOR ALL USING (modified_by = auth.uid());

DROP POLICY IF EXISTS plan_mods_patient_read ON plan_modifications;
CREATE POLICY plan_mods_patient_read ON plan_modifications FOR SELECT
USING (plan_id IN (SELECT id FROM plans WHERE patient_id = auth.uid()));


-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema migration complete!';
  RAISE NOTICE '   - Core tables created (profiles, exercises, plans, sessions)';
  RAISE NOTICE '   - PT features enabled (alerts, recommendations, messages)';
  RAISE NOTICE '   - Triggers configured (pain alerts, notifications, streaks)';
  RAISE NOTICE '   - RLS policies applied';
END $$;
