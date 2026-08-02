-- 安全整改: 身份证加密存储 + 等保2.0基础 (2026-06-05)
-- 执行: psql -d opc_db -f security-migration-2026-06-05.sql

-- ============================================================
-- 1. 身份证加密存储 (F2 - 修复明文存储)
-- ============================================================
-- 将明文 id_card 改为 id_card_hash + id_card_masked
-- 原有 id_card 列将被删除，数据不可恢复，请确认已备份

-- 先删除明文列（开发环境直接重建，生产环境需先加密迁移）
ALTER TABLE users DROP COLUMN IF EXISTS id_card;

-- 新增身份证哈希（bcrypt 哈希，用于查重验证）
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_hash VARCHAR(255);

-- 新增身份证掩码（如 110101******1234，用于前端显示）
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_masked VARCHAR(20);

-- 创建唯一索引：同一个身份证号不能绑定两个用户（基于哈希）
-- 注意：bcrypt 有随机盐，不能直接用 UNIQUE，需应用层查重
CREATE INDEX IF NOT EXISTS idx_users_id_card_hash ON users(id_card_hash);

-- ============================================================
-- 2. 等保2.0 - 操作日志审计表 (F3 整改)
-- ============================================================
-- 记录关键操作：登录、认证、敏感操作、权限变更

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 操作信息
    action VARCHAR(100) NOT NULL, -- 'login', 'id_verify', 'company_verify', 'contract_sign', 'task_create', 'wallet_withdraw', 'service_change'
    resource_type VARCHAR(50), -- 'user', 'task', 'wallet', 'escrow', 'system'
    resource_id UUID, -- 被操作对象ID
    
    -- 请求详情
    ip_address INET,
    user_agent VARCHAR(500),
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_body JSONB, -- 脱敏后的请求体
    
    -- 结果
    status VARCHAR(20) DEFAULT 'success', -- success, failure, blocked
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- 会话信息
    session_id VARCHAR(255),
    jwt_id VARCHAR(255), -- JWT jti，用于追踪
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    CONSTRAINT valid_ip CHECK (ip_address IS NULL OR ip_address::text ~ '^\d+\.\d+\.\d+\.\d+$')
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 3. 等保2.0 - 密码安全策略表 (F3 整改)
-- ============================================================
-- 记录用户密码历史，防止重复使用最近密码

CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, created_at DESC);

-- 清理旧密码：保留最近 5 条
-- 应用层实现：每次修改密码时，删除该用户的第 6 条及以后的记录

-- ============================================================
-- 4. 等保2.0 - 登录失败锁定表 (F3 整改)
-- ============================================================
-- 防止暴力破解：连续 5 次失败锁定 30 分钟

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(100) NOT NULL, -- phone 或 IP
    identifier_type VARCHAR(20) NOT NULL, -- 'phone', 'ip'
    attempt_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked ON login_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================================
-- 5. 等保2.0 - 敏感数据访问日志 (F3 整改)
-- ============================================================
-- 记录对敏感数据的查询（如钱包、身份证号哈希）

CREATE TABLE IF NOT EXISTS sensitive_data_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accessor_id UUID, -- 操作者（管理员或系统）
    data_type VARCHAR(50) NOT NULL, -- 'wallet', 'id_card_hash', 'contract', 'phone'
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    access_reason TEXT, -- 访问原因
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensitive_data_access_target ON sensitive_data_access(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_access_accessor ON sensitive_data_access(accessor_id, created_at DESC);

-- ============================================================
-- 6. 系统配置表（JWT密钥轮换等）
-- ============================================================

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 默认配置：密码策略
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('password_min_length', '8', 'number', '密码最小长度'),
('password_require_uppercase', 'true', 'boolean', '密码必须包含大写字母'),
('password_require_lowercase', 'true', 'boolean', '密码必须包含小写字母'),
('password_require_digit', 'true', 'boolean', '密码必须包含数字'),
('password_require_special', 'true', 'boolean', '密码必须包含特殊字符'),
('password_max_age_days', '90', 'number', '密码最长有效期（天）'),
('login_max_attempts', '5', 'number', '连续登录失败最大次数'),
('login_lock_duration_minutes', '30', 'number', '登录锁定时间（分钟）'),
('jwt_secret_version', '1', 'number', '当前JWT密钥版本（用于密钥轮换）')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 7. 管理员表（用于审核、系统管理）
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, auditor
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建默认管理员（密码需通过应用层设置，此处不预置）
-- INSERT INTO admins (username, password_hash, real_name, role) VALUES 
-- ('admin', '$2a$12$...', '系统管理员', 'super_admin');

-- ============================================================
-- 8. 验证: 检查整改完成
-- ============================================================

SELECT 'security_migration_completed' as status, NOW() as migrated_at;

-- 检查表是否创建成功
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'created' ELSE 'missing' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audit_logs', 'password_history', 'login_attempts', 'sensitive_data_access', 'system_config', 'admins')
ORDER BY table_name;
