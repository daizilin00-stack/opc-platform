-- 添加用户角色字段（用于管理员权限控制）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 更新管理员用户（示例：需要手动设置董事长账号为 super_admin）
-- UPDATE users SET role = 'super_admin' WHERE phone = '董事长手机号';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
