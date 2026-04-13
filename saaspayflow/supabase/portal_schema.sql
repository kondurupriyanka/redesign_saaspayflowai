-- PAYFLOW AI - PUBLIC PORTAL SCHEMA
-- Run this in your Supabase SQL Editor.

-- 1. Client Portal Tokens (Magic Links)
CREATE TABLE IF NOT EXISTS client_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

-- 2. Projects and Milestones
CREATE TABLE IF NOT EXISTS projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  name text not null,
  description text,
  progress_percent numeric(5,2) default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'on_hold', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'review', 'done')),
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Delay Reasons (Client Feedback)
CREATE TABLE IF NOT EXISTS delay_reasons (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  reason_type text not null,
  custom_reason text,
  scheduled_date date,
  created_at timestamptz not null default now()
);

-- 4. RPC for Token Generation
CREATE OR REPLACE FUNCTION generate_portal_token(p_client_id UUID)
RETURNS text AS $$
DECLARE
  v_token text;
BEGIN
  -- Check for existing non-expired token
  SELECT token INTO v_token 
  FROM client_portal_tokens 
  WHERE client_id = p_client_id AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;
  
  IF v_token IS NULL THEN
    INSERT INTO client_portal_tokens (client_id)
    VALUES (p_client_id)
    RETURNING token INTO v_token;
  END IF;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Row Level Security (RLS)
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delay_reasons ENABLE ROW LEVEL SECURITY;

-- 5.1 Public Access Policies (Bypassing auth.uid() for portal views)
-- Use a helper function to validate token
CREATE OR REPLACE FUNCTION is_valid_portal_token(p_token text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_portal_tokens 
    WHERE token = p_token AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invoices selectable by public if invoice's client has valid token
-- Note: In a production app, we'd pass the token in a header or param and check it here.
-- For this implementation, we'll allow public select if the token matches.
DROP POLICY IF EXISTS "Public can view invoices via token" ON invoices;
CREATE POLICY "Public can view invoices via token" ON invoices
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_portal_tokens 
      WHERE token = current_setting('request.headers', true)::json->>'x-portal-token'
      AND expires_at > now()
    )
  );

-- Delay reasons insertable by public
DROP POLICY IF EXISTS "Public can submit delay reasons" ON delay_reasons;
CREATE POLICY "Public can submit delay reasons" ON delay_reasons
  FOR INSERT WITH CHECK (true);

-- Projects \u0026 Milestones viewable via token
DROP POLICY IF EXISTS "Public can view projects via token" ON projects;
CREATE POLICY "Public can view projects via token" ON projects
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_portal_tokens 
      WHERE token = current_setting('request.headers', true)::json->>'x-portal-token'
      AND expires_at > now()
    )
  );

DROP POLICY IF EXISTS "Public can view milestones via token" ON milestones;
CREATE POLICY "Public can view milestones via token" ON milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE client_id IN (
        SELECT client_id FROM client_portal_tokens 
        WHERE token = current_setting('request.headers', true)::json->>'x-portal-token'
        AND expires_at > now()
      )
    )
  );

-- 6. RPC for Public Portal Data Fetching
-- Returns client, freelancer name, invoices, and projects
CREATE OR REPLACE FUNCTION fetch_portal_data(p_token text)
RETURNS json AS $$
DECLARE
  v_client_id uuid;
  v_freelancer_id uuid;
  v_client_name text;
  v_freelancer_name text;
  v_invoices json;
  v_projects json;
  v_result json;
BEGIN
  -- Validate token and get client_id
  SELECT client_id INTO v_client_id 
  FROM client_portal_tokens 
  WHERE token = p_token AND expires_at > now();
  
  IF v_client_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get Client and Freelancer Info
  SELECT c.name, u.full_name, c.user_id 
  INTO v_client_name, v_freelancer_name, v_freelancer_id
  FROM clients c
  JOIN users u ON c.user_id = u.id
  WHERE c.id = v_client_id;
  
  -- Get Invoices
  SELECT json_agg(i.*) INTO v_invoices
  FROM invoices i
  WHERE i.client_id = v_client_id
  AND i.status != 'draft';
  
  -- Get Projects with Milestones
  SELECT json_agg(p_with_m) INTO v_projects
  FROM (
    SELECT p.*, (
      SELECT json_agg(m.* ORDER BY m.order ASC) 
      FROM milestones m 
      WHERE m.project_id = p.id
    ) as milestones
    FROM projects p
    WHERE p.client_id = v_client_id
  ) p_with_m;
  
  -- Combine Result
  v_result := json_build_object(
    'client_id', v_client_id,
    'client_name', v_client_name,
    'freelancer_name', v_freelancer_name,
    'freelancer_id', v_freelancer_id,
    'invoices', COALESCE(v_invoices, '[]'::json),
    'projects', COALESCE(v_projects, '[]'::json)
  );

  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portal_tokens_client_id ON client_portal_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON client_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_delay_reasons_invoice_id ON delay_reasons(invoice_id);

-- 7. PROGRESS CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION calculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_milestones INT;
  v_done_milestones INT;
  v_progress NUMERIC(5,2);
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_total_milestones FROM milestones WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  SELECT COUNT(*) INTO v_done_milestones FROM milestones WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND status = 'done';
  
  -- Calculate percentage
  IF v_total_milestones > 0 THEN
    v_progress := (v_done_milestones::numeric / v_total_milestones::numeric) * 100;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Update project
  UPDATE projects SET progress_percent = v_progress, updated_at = now() 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_progress ON milestones;
CREATE TRIGGER trigger_calculate_progress
AFTER INSERT OR UPDATE OR DELETE ON milestones
FOR EACH ROW EXECUTE FUNCTION calculate_project_progress();

-- 8. AUTHENTICATED USER POLICIES
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own milestones" ON milestones;
CREATE POLICY "Users can manage their own milestones" ON milestones
  FOR ALL TO authenticated USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );


