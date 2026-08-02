const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 检查并创建 deploy 相关表...');
    
    // 创建 deploy_agents 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS deploy_agents (
        id VARCHAR(32) PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        template VARCHAR(100) DEFAULT 'standard',
        status VARCHAR(20) DEFAULT 'creating' CHECK (status IN ('creating', 'running', 'stopped', 'error', 'destroyed')),
        model VARCHAR(50) NOT NULL,
        system_prompt TEXT,
        endpoint VARCHAR(255),
        api_key_hash VARCHAR(255),
        container_id VARCHAR(255),
        cpu_limit VARCHAR(20) DEFAULT '1',
        memory_limit VARCHAR(20) DEFAULT '2G',
        storage_limit VARCHAR(20) DEFAULT '10G',
        hourly_price DECIMAL(10,4) DEFAULT 0.05,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deploy_agents_user_id ON deploy_agents(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deploy_agents_status ON deploy_agents(status)`);
    
    // 创建 deploy_agent_usage 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS deploy_agent_usage (
        id BIGSERIAL PRIMARY KEY,
        agent_id VARCHAR(32) NOT NULL,
        date DATE NOT NULL,
        hours DECIMAL(10,2) DEFAULT 0,
        prompt_tokens BIGINT DEFAULT 0,
        completion_tokens BIGINT DEFAULT 0,
        compute_cost DECIMAL(10,4) DEFAULT 0,
        model_cost DECIMAL(10,4) DEFAULT 0,
        total_cost DECIMAL(10,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uk_deploy_agent_usage_agent_date ON deploy_agent_usage(agent_id, date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deploy_agent_usage_date ON deploy_agent_usage(date)`);
    
    console.log('✅ deploy 表创建完成');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = migrate;
