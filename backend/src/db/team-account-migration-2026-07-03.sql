-- ============================================================
-- OPC 平台团队账户体系迁移脚本
-- 日期：2026-07-03
-- 说明：增加团队账户、消费计费、审计日志
-- ============================================================

-- 1. 修改 users 表，增加账户类型字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual' 
  CHECK (account_type IN ('individual', 'team_owner', 'team_member', 'enterprise_member'));

-- 为现有用户设置默认值
UPDATE users SET account_type = 'individual' WHERE account_type IS NULL;

-- 2. 创建团队表
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- 企业认证信息
  business_license VARCHAR(255),
  company_name VARCHAR(255),
  legal_person VARCHAR(100),
  
  -- 总号（Owner）
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- 账户信息
  balance DECIMAL(12,2) DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  monthly_budget DECIMAL(12,2),
  alert_threshold DECIMAL(12,2) DEFAULT 500,
  
  -- 服务层级
  tier VARCHAR(20) DEFAULT 'team' CHECK (tier IN ('team', 'enterprise')),
  
  -- Token 配额
  token_quota BIGINT DEFAULT 10000000,  -- 默认1000万
  token_used BIGINT DEFAULT 0,
  
  -- 网络服务配置
  network_service JSONB DEFAULT NULL,  -- {type, bandwidth, status, ip_count}
  
  -- 权限配置
  permissions JSONB DEFAULT '{
    "memberCanInvite": false,
    "memberCanViewAllConsumption": false,
    "memberCanManageBilling": false
  }',
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'dissolved')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建团队成员关联表
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 角色
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  
  -- 个人月度限额（可选）
  monthly_quota DECIMAL(12,2),
  
  -- 个人消费统计（冗余，方便查询）
  total_spent DECIMAL(12,2) DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMP,
  
  UNIQUE(team_id, user_id)
);

-- 4. 创建消费记录表（如果尚不存在）
CREATE TABLE IF NOT EXISTS consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 谁消费的
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(100),  -- 冗余，方便查询
  
  -- 所属团队（如果是团队消费）
  team_id UUID REFERENCES teams(id),
  team_name VARCHAR(255),  -- 冗余
  
  -- 扣费账户
  account_id UUID NOT NULL,  -- user_id 或 team_id
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('individual', 'team', 'enterprise')),
  
  -- 消费内容
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('token', 'network', 'employee', 'product', 'task', 'subscription')),
  service_id VARCHAR(100) NOT NULL,  -- gpt-4o, claude-3.5, net-10m 等
  service_name VARCHAR(255),
  
  -- 用量明细
  prompt_tokens BIGINT DEFAULT 0,
  completion_tokens BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  
  -- 费用
  unit_price DECIMAL(12,6) NOT NULL,  -- 单价（元/1K tokens）
  quantity DECIMAL(12,4) NOT NULL,     -- 数量
  amount DECIMAL(12,4) NOT NULL,       -- 实际费用
  currency VARCHAR(10) DEFAULT 'CNY',
  
  -- 折扣信息
  discount_rate DECIMAL(3,2) DEFAULT 1.0,  -- 折扣率（1.0 = 无折扣，0.55 = 5.5折）
  original_amount DECIMAL(12,4),            -- 原价
  tier_applied VARCHAR(20),                 -- 应用的层级：personal/team/enterprise
  
  -- 状态
  status VARCHAR(20) DEFAULT 'billed' CHECK (status IN ('billed', 'refunded', 'disputed', 'cancelled')),
  
  -- 请求详情（用于审计）
  request_details JSONB,  -- {model, temperature, max_tokens, ip_address}
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  billed_at TIMESTAMP,
  
  -- 索引
  CONSTRAINT fk_consumption_team FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- 5. 修改 audit_logs 表，添加团队字段（如果 security-migration 已创建）
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS result VARCHAR(20) DEFAULT 'success' CHECK (result IN ('success', 'failure', 'denied'));
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 6. 修改现有 billing_items 表，支持团队
ALTER TABLE billing_items ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE billing_items ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual' 
  CHECK (account_type IN ('individual', 'team', 'enterprise'));
ALTER TABLE billing_items ADD COLUMN IF NOT EXISTS consumed_by UUID REFERENCES users(id);

-- 7. 修改 token_usage 表，支持团队
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS original_cost DECIMAL(12,4) DEFAULT 0;

-- 8. 创建索引（优化查询性能）
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

CREATE INDEX IF NOT EXISTS idx_consumptions_user ON consumptions(user_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_team ON consumptions(team_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_account ON consumptions(account_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_service ON consumptions(service_type, service_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_created ON consumptions(created_at);
CREATE INDEX IF NOT EXISTS idx_consumptions_user_created ON consumptions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_consumptions_team_created ON consumptions(team_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team ON audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_billing_team ON billing_items(team_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_team ON token_usage(team_id);

-- 9. 创建触发器：更新 team_members 的 total_spent
CREATE OR REPLACE FUNCTION update_member_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    UPDATE team_members 
    SET total_spent = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM consumptions 
      WHERE team_id = NEW.team_id AND user_id = NEW.user_id
    )
    WHERE team_id = NEW.team_id AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_spent ON consumptions;
CREATE TRIGGER trigger_update_member_spent
  AFTER INSERT ON consumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_member_spent();

-- 10. 创建触发器：更新 teams 的 token_used
CREATE OR REPLACE FUNCTION update_team_token_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    UPDATE teams 
    SET token_used = (
      SELECT COALESCE(SUM(total_tokens), 0) 
      FROM consumptions 
      WHERE team_id = NEW.team_id AND service_type = 'token'
    )
    WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_team_token_usage ON consumptions;
CREATE TRIGGER trigger_update_team_token_usage
  AFTER INSERT ON consumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_token_usage();

-- 11. 创建视图：团队消费汇总（方便查询）
CREATE OR REPLACE VIEW team_consumption_summary AS
SELECT 
  c.team_id,
  DATE_TRUNC('day', c.created_at) AS date,
  c.service_type,
  c.service_id,
  c.service_name,
  COUNT(*) AS call_count,
  SUM(c.prompt_tokens) AS total_prompt_tokens,
  SUM(c.completion_tokens) AS total_completion_tokens,
  SUM(c.total_tokens) AS total_tokens,
  SUM(c.amount) AS total_amount,
  SUM(c.original_amount) AS total_original_amount
FROM consumptions c
WHERE c.team_id IS NOT NULL
GROUP BY c.team_id, DATE_TRUNC('day', c.created_at), c.service_type, c.service_id, c.service_name;

-- 12. 创建视图：成员消费汇总
CREATE OR REPLACE VIEW member_consumption_summary AS
SELECT 
  c.team_id,
  c.user_id,
  c.user_name,
  DATE_TRUNC('day', c.created_at) AS date,
  c.service_type,
  COUNT(*) AS call_count,
  SUM(c.total_tokens) AS total_tokens,
  SUM(c.amount) AS total_amount
FROM consumptions c
WHERE c.team_id IS NOT NULL
GROUP BY c.team_id, c.user_id, c.user_name, DATE_TRUNC('day', c.created_at), c.service_type;

-- 完成
SELECT 'Team account migration completed successfully' AS status;
