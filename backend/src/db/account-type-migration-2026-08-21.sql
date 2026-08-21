-- 2026-08-21 账号类型迁移
-- 目的：区分个人创业者与企业账号，支持分阶实名/企业认证

-- 0. 清理可能存在的旧 check 约束，确保迁移可重复执行
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND conname LIKE 'users_account_type%';
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- 1. 增加账号类型字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';

-- 2. 已有账号：已做企业认证的标记为企业
UPDATE users
SET account_type = 'enterprise'
WHERE company_verified = TRUE;

-- 3. 添加索引
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
