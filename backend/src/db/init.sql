-- 初始化数据库表（开园版：增加实名认证 + 企业认证）

-- 创业者表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    avatar VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending_verification',
    level INTEGER DEFAULT 1,
    credit_score INTEGER DEFAULT 100,
    skills TEXT[],
    certifications JSONB,
    earnings_total DECIMAL(12,2) DEFAULT 0,
    earnings_pending DECIMAL(12,2) DEFAULT 0,
    
    -- 实名认证字段
    id_card_hash VARCHAR(255),
    id_card_masked VARCHAR(20),
    id_card_verified BOOLEAN DEFAULT FALSE,
    id_card_verified_at TIMESTAMP,
    
    -- 企业认证字段
    company_name VARCHAR(200),
    company_registration_no VARCHAR(50),
    company_type VARCHAR(50), -- 'new_register' | 'existing_upload'
    company_verified BOOLEAN DEFAULT FALSE,
    company_verified_at TIMESTAMP,
    business_license_url VARCHAR(500),
    
    -- 服务开通状态
    service_enabled BOOLEAN DEFAULT FALSE,
    service_enabled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    verified_at TIMESTAMP
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    reward_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    deadline DATE,
    required_skills TEXT[],
    region VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal',
    publisher_id UUID,
    assignee_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- 任务执行记录表
CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    partner_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress',
    deliverables JSONB,
    agent_invocations JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    payout_status VARCHAR(20) DEFAULT 'pending',
    payout_amount DECIMAL(12,2),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (partner_id) REFERENCES users(id)
);

-- Agent 调用记录表
CREATE TABLE IF NOT EXISTS agent_invocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID,
    agent_type VARCHAR(50) NOT NULL,
    prompt TEXT,
    response JSONB,
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES executions(id)
);

-- 结算表
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL,
    period_start DATE,
    period_end DATE,
    total_amount DECIMAL(12,2) NOT NULL,
    fee_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    method VARCHAR(50),
    transaction_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES users(id)
);

-- 合同签署记录表
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_version VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50),
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contract_content TEXT  -- 存储签署的完整合同内容
);

-- 用户服务权限表（分级开通：软件服务自动开通，硬件服务需人工审核）
CREATE TABLE IF NOT EXISTS user_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 软件服务（电子合同签署后自动开通）
    silicon_employee_enabled BOOLEAN DEFAULT FALSE,      -- 硅基员工平台
    silicon_employee_enabled_at TIMESTAMP,
    token_market_enabled BOOLEAN DEFAULT FALSE,            -- Token团购中心
    token_market_enabled_at TIMESTAMP,
    
    -- 硬件/网络服务（需人工审核开通）
    model_tunnel_enabled BOOLEAN DEFAULT FALSE,            -- 合规海外模型通道（CSDP-WAN专线）
    model_tunnel_enabled_at TIMESTAMP,
    model_tunnel_approved_by UUID REFERENCES users(id),     -- 审核人（管理员）
    model_tunnel_approved_at TIMESTAMP,
    openclaw_deploy_enabled BOOLEAN DEFAULT FALSE,         -- OpenClaw部署平台（服务器资源）
    openclaw_deploy_enabled_at TIMESTAMP,
    openclaw_deploy_approved_by UUID REFERENCES users(id),
    openclaw_deploy_approved_at TIMESTAMP,
    
    -- 合同签署记录
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_version VARCHAR(50),
    contract_signed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 钱包表
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    frozen DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CNY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 账单明细表
CREATE TABLE IF NOT EXISTS billing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- recharge, token_usage, subscription
    item_name VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(12,2),
    unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token用量记录表
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_type VARCHAR(50),
    model_name VARCHAR(100),
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_cny DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 钱包交易记录表（资金流水）
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(30) NOT NULL, -- 'recharge', 'token_usage', 'task_escrow', 'task_release', 'task_refund', 'commission', 'withdrawal', 'bonus', 'subscription'
    direction VARCHAR(10) NOT NULL, -- 'in', 'out'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    
    -- 关联对象
    related_task_id UUID REFERENCES tasks(id),
    related_escrow_id UUID,
    related_billing_item_id UUID REFERENCES billing_items(id),
    
    -- 交易描述
    description TEXT,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, cancelled
    
    -- 余额快照
    balance_after DECIMAL(12,2) NOT NULL,
    frozen_after DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Escrow 托管表（任务资金托管）
CREATE TABLE IF NOT EXISTS escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- 金额
    total_amount DECIMAL(12,2) NOT NULL, -- 任务总金额
    commission_rate DECIMAL(5,2) DEFAULT 0.15, -- 佣金率 15%
    commission_amount DECIMAL(12,2) DEFAULT 0, -- 平台佣金
    assignee_amount DECIMAL(12,2) DEFAULT 0, -- 接单方实际到账
    
    -- 资金流向
    publisher_id UUID REFERENCES users(id), -- 发布方
    assignee_id UUID REFERENCES users(id), -- 接单方
    
    -- 状态机
    status VARCHAR(30) DEFAULT 'funded', -- funded, milestone_released, completed, disputed, refunded, cancelled
    
    -- 托管时间线
    funded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 资金到位
    deadline_at TIMESTAMP, -- 任务截止时间
    auto_release_at TIMESTAMP, -- 自动释放时间（3天后）
    released_at TIMESTAMP, -- 实际释放时间
    disputed_at TIMESTAMP, -- 纠纷时间
    resolved_at TIMESTAMP, -- 解决时间
    
    -- 纠纷处理
    dispute_reason TEXT,
    dispute_evidence JSONB,
    resolution_type VARCHAR(20), -- 'full_release', 'partial_release', 'full_refund'
    resolution_amount DECIMAL(12,2),
    resolved_by UUID REFERENCES users(id), -- 处理人（管理员或系统）
    
    -- 里程碑（支持多阶段付款）
    milestones JSONB, -- [{"name": "初稿", "amount": 500, "status": "pending"}]
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 佣金记录表
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    escrow_id UUID REFERENCES escrow_payments(id),
    
    -- 佣金信息
    base_amount DECIMAL(12,2) NOT NULL, -- 任务基础金额
    commission_rate DECIMAL(5,2) NOT NULL, -- 15%
    commission_amount DECIMAL(12,2) NOT NULL, -- 平台佣金
    assignee_amount DECIMAL(12,2) NOT NULL, -- 接单方实得
    
    -- 佣金调整（优惠、减免等）
    discount_rate DECIMAL(5,2) DEFAULT 0, -- 优惠率（如开园免佣金）
    discount_amount DECIMAL(12,2) DEFAULT 0, -- 优惠金额
    final_commission DECIMAL(12,2) NOT NULL, -- 最终佣金
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending', -- pending, collected, refunded, waived
    
    -- 关联
    transaction_id UUID REFERENCES wallet_transactions(id), -- 关联钱包交易
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    collected_at TIMESTAMP
);

-- 新用户奖励记录表
CREATE TABLE IF NOT EXISTS new_user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 奖励信息
    credit_type VARCHAR(30) NOT NULL, -- 'registration_bonus', 'first_task_bonus', 'referral_bonus', 'promotion'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    
    -- 使用状态
    used_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,
    
    -- 限制条件
    valid_until TIMESTAMP, -- 有效期
    applicable_for VARCHAR(50), -- 'token', 'task', 'all' -- 适用范围
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active', -- active, used, expired, revoked
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    expired_at TIMESTAMP
);

-- 任务里程碑表（支持多阶段付款）
CREATE TABLE IF NOT EXISTS task_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    escrow_id UUID REFERENCES escrow_payments(id) ON DELETE CASCADE,
    
    -- 里程碑信息
    name VARCHAR(100) NOT NULL, -- "初稿", "二稿", "终稿"
    description TEXT,
    amount DECIMAL(12,2) NOT NULL, -- 本阶段金额
    sequence INTEGER NOT NULL, -- 顺序
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending', -- pending, submitted, approved, rejected, disputed
    
    -- 时间线
    deadline TIMESTAMP, -- 本阶段截止时间
    submitted_at TIMESTAMP, -- 接单方提交时间
    submitted_content TEXT, -- 提交内容/链接
    reviewed_at TIMESTAMP, -- 发布方审核时间
    reviewed_by UUID REFERENCES users(id), -- 审核人（发布方）
    
    -- 支付
    paid_at TIMESTAMP,
    payment_transaction_id UUID REFERENCES wallet_transactions(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 充值订单表
CREATE TABLE IF NOT EXISTS recharge_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- 充值信息
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    payment_method VARCHAR(30), -- 'wechat', 'alipay', 'bank_transfer', 'stripe', 'manual'
    
    -- 第三方支付信息
    third_party_order_id VARCHAR(255), -- 微信支付订单号/支付宝订单号
    third_party_transaction_id VARCHAR(255), -- 支付平台交易号
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, cancelled, refunded
    
    -- 时间线
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- 备注
    description TEXT,
    metadata JSONB -- 额外信息
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_task ON escrow_payments(task_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_status ON escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_commissions_task ON commissions(task_id);
CREATE INDEX IF NOT EXISTS idx_new_user_credits_user ON new_user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_new_user_credits_status ON new_user_credits(status);
CREATE INDEX IF NOT EXISTS idx_task_milestones_task ON task_milestones(task_id);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_user ON recharge_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_status ON recharge_orders(status);

-- 新增索引（已有表的索引）
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_publisher ON tasks(publisher_id);
CREATE INDEX IF NOT EXISTS idx_executions_task ON executions(task_id);
CREATE INDEX IF NOT EXISTS idx_executions_partner ON executions(partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_partner ON payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
