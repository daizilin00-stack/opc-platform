-- 提现申请表 + 风控系统迁移（2026-06-28）

-- 提现申请表
CREATE TABLE IF NOT EXISTS withdraw_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
    
    -- 提现金额
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    fee DECIMAL(12,2) DEFAULT 0, -- 手续费（平台承担为0）
    net_amount DECIMAL(12,2) NOT NULL, -- 实际到账金额
    
    -- 提现方式
    method VARCHAR(30) NOT NULL, -- 'bank_transfer', 'alipay', 'wechat'
    account_info JSONB NOT NULL, -- {name, account, bank_name, branch}
    
    -- 状态机
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, processing, completed, failed
    
    -- 风控信息
    risk_level VARCHAR(10) DEFAULT 'low', -- low, medium, high
    risk_flags TEXT[], -- 风控标记
    
    -- 审批信息
    reviewed_by UUID REFERENCES users(id), -- 审核管理员
    reviewed_at TIMESTAMP,
    review_note TEXT, -- 审核备注
    
    -- 支付信息
    payment_ref VARCHAR(255), -- 银行流水号/支付单号
    paid_at TIMESTAMP, -- 实际打款时间
    
    -- 用户备注
    user_note TEXT,
    
    -- 关联交易记录
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束：金额必须大于0
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_net_amount_positive CHECK (net_amount > 0)
);

-- 提现风控日志表
CREATE TABLE IF NOT EXISTS withdraw_risk_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdraw_request_id UUID REFERENCES withdraw_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 风控触发项
    rule_name VARCHAR(100) NOT NULL, -- 'daily_limit', 'frequency_limit', 'amount_limit', 'unverified_user', 'suspicious_account'
    rule_description TEXT,
    risk_level VARCHAR(10) NOT NULL, -- low, medium, high, critical
    
    -- 处理结果
    action_taken VARCHAR(30), -- 'blocked', 'allowed', 'manual_review', 'flagged'
    
    -- 详情
    details JSONB, -- 触发时的数据快照
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统风控配置表
CREATE TABLE IF NOT EXISTS risk_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认风控配置（仅工作日提现 + 强制企业认证）
INSERT INTO risk_config (config_key, config_value, description) VALUES
('withdraw_limits', '{"min_amount": 100, "max_amount": 50000, "daily_limit": 100000, "monthly_limit": 500000}'::jsonb, '提现金额限制'),
('withdraw_frequency', '{"daily_max_count": 3, "weekly_max_count": 10, "monthly_max_count": 30}'::jsonb, '提现频率限制'),
('withdraw_window', '{"allowed_days": [1,2,3,4,5], "allowed_hours_start": 9, "allowed_hours_end": 18}'::jsonb, '提现时间窗口：仅工作日 9:00-18:00'),
('withdraw_requirements', '{"require_real_name": true, "require_company_verify": true, "require_phone_bind": true, "min_account_age_days": 0}'::jsonb, '提现前置条件：强制企业认证'),
('risk_rules', '{"large_amount_threshold": 10000, "suspicious_daily_amount": 50000, "new_user_limit": 500}'::jsonb, '风险阈值配置')
ON CONFLICT (config_key) DO NOTHING;

-- 索引
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user ON withdraw_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created ON withdraw_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_withdraw_risk_logs_user ON withdraw_risk_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_risk_logs_withdraw ON withdraw_risk_logs(withdraw_request_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_risk_logs_rule ON withdraw_risk_logs(rule_name);
