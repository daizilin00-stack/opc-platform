-- 支付网关迁移（2026-07-29）
-- 扩展充值订单与钱包交易，支持微信/支付宝/模拟支付

-- 1. 在 wallet_transactions 增加关联充值订单字段
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS related_recharge_order_id UUID REFERENCES recharge_orders(id) ON DELETE SET NULL;

-- 2. 为 recharge_orders 增加支付网关相关字段（已存在字段不重复创建）
ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS gateway VARCHAR(30) DEFAULT 'manual'; -- wechat | alipay | mock | manual | stripe

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS gateway_prepay_id VARCHAR(255);

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS gateway_code_url TEXT; -- 微信支付 native 二维码内容

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS gateway_order_str TEXT; -- 支付宝 order string

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS gateway_raw_response JSONB;

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS client_ip VARCHAR(50);

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS notify_url VARCHAR(500);

ALTER TABLE recharge_orders
ADD COLUMN IF NOT EXISTS expire_at TIMESTAMP;

-- 3. 增加订单号唯一索引（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recharge_orders_order_no'
  ) THEN
    -- 如果已有 third_party_order_id 用作订单号，确保唯一
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recharge_orders_order_no ON recharge_orders(third_party_order_id) WHERE third_party_order_id IS NOT NULL;
  END IF;
END
$$;

-- 4. 为 wallet_transactions 相关字段增加索引
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_recharge_order ON wallet_transactions(related_recharge_order_id);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_gateway ON recharge_orders(gateway);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_created_at ON recharge_orders(created_at);

-- 5. 订单状态约束说明（由应用层维护）
-- pending -> paid -> completed
-- pending -> failed / cancelled
-- 新增 gateway 枚举值由应用层校验
