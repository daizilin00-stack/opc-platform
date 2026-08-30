-- 2026-08-28: 新增商品购买与套餐开通能力（Token 充值套餐 + AI 员工套餐）

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('token_credit', 'ai_employee_package')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    credit_value DECIMAL(12,2) DEFAULT 0,      -- 实际到账钱包金额（Token 套餐用）
    token_quota BIGINT DEFAULT 0,              -- 赠送 Token 额度对应的配额（可选）
    ai_employees TEXT[] DEFAULT '{}',           -- AI 员工套餐包含的角色
    period_months INTEGER DEFAULT 1,            -- 订阅有效期（月）
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户订阅/套餐表
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES recharge_orders(id),
    product_id VARCHAR(50) REFERENCES products(id),
    status VARCHAR(20) DEFAULT 'active',        -- active, expired, cancelled
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    ai_employees TEXT[] DEFAULT '{}',
    token_quota BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为充值订单增加商品关联字段
ALTER TABLE recharge_orders ADD COLUMN IF NOT EXISTS product_id VARCHAR(50) REFERENCES products(id);
ALTER TABLE recharge_orders ADD COLUMN IF NOT EXISTS product_type VARCHAR(20);
ALTER TABLE recharge_orders ADD COLUMN IF NOT EXISTS benefits_delivered BOOLEAN DEFAULT FALSE;

-- 索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_product ON recharge_orders(product_id);

-- 初始化商品数据（与 frontend/src/lib/pricing.ts 保持一致）
INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('token-credit-100', 'token_credit', '轻量充值', '充值 ¥100，到账 ¥110', 100, 110, 0, 0, '{}', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('token-credit-500', 'token_credit', '标准充值', '充值 ¥500，到账 ¥580', 500, 580, 0, 0, '{}', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('token-credit-2000', 'token_credit', '企业充值', '充值 ¥2000，到账 ¥2400', 2000, 2400, 0, 0, '{}', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('token-credit-10000', 'token_credit', '年付充值', '充值 ¥10000，到账 ¥13000', 10000, 13000, 0, 0, '{}', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('promo-experience', 'ai_employee_package', '体验版', '适合个人创业者初次体验', 99, 100, 100000, 1, '{assistant}', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('promo-startup', 'ai_employee_package', '创业版', '适合初创企业快速启动', 999, 600, 500000, 1, '{sales,support,assistant}', 11)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, name, description, price, credit_value, token_quota, period_months, ai_employees, sort_order)
VALUES
  ('promo-overseas', 'ai_employee_package', '出海版', '适合有海外业务的企业', 3999, 2500, 2000000, 1, '{ceo,sales,support,solution,compliance,assistant}', 12)
ON CONFLICT (id) DO NOTHING;
