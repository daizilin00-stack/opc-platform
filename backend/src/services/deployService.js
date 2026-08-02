#!/usr/bin/env node
/**
 * Deploy Service - Agent 生命周期管理
 * 负责创建、管理、销毁 Agent Docker 容器
 */

const { execSync, spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class DeployService {
  constructor(db) {
    this.db = db;
    this.networkPrefix = 'opc-agent-';
  }

  /**
   * 生成 Agent ID
   */
  generateAgentId() {
    return 'agt_' + crypto.randomBytes(8).toString('hex');
  }

  /**
   * 生成 Agent API Key
   */
  generateApiKey(agentId) {
    const random = crypto.randomBytes(6).toString('base64url');
    return `opc-agt-${agentId.slice(4)}-${random}`;
  }

  /**
   * 创建 Agent
   */
  async createAgent(userId, config) {
    const agentId = this.generateAgentId();
    const apiKey = this.generateApiKey(agentId);
    
    // 1. 写入数据库
    await this.db.query(
      `INSERT INTO deploy_agents 
       (id, user_id, name, description, template, model, system_prompt, 
        api_key_hash, cpu_limit, memory_limit, storage_limit, hourly_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'creating')`,
      [agentId, userId, config.name, config.description, config.template,
       config.model, config.system_prompt || '',
       this.hashKey(apiKey), config.resources?.cpu || '1',
       config.resources?.memory || '2G', config.resources?.storage || '10G',
       config.pricing?.compute?.hourly || 0.05]
    );

    // 2. 异步创建容器（不阻塞响应）
    this.createContainer(agentId, config).catch(err => {
      console.error(`创建容器失败 ${agentId}:`, err);
      this.updateAgentStatus(agentId, 'error');
    });

    return {
      id: agentId,
      api_key: apiKey,
      status: 'creating',
      endpoint: `https://${agentId}.agents.opc-platform.com`
    };
  }

  /**
   * 创建 Docker 容器
   */
  async createContainer(agentId, config) {
    const networkName = `${this.networkPrefix}${agentId}`;
    const containerName = `opc-agent-${agentId}`;
    
    try {
      // 1. 创建独立网络
      execSync(`docker network create ${networkName} 2>/dev/null || true`);

      // 2. 启动容器
      const envVars = [
        `-e AGENT_ID=${agentId}`,
        `-e MODEL_PROVIDER=opc`,
        `-e MODEL_BASE_URL=${process.env.OPC_API_BASE_URL || 'http://host.docker.internal:3003/v1'}`,
        `-e MODEL_API_KEY=${config.api_key}`,
        `-e SYSTEM_PROMPT=${config.system_prompt || ''}`,
        `-e MODEL=${config.model || 'gpt-4o'}`
      ];

      const cmd = `docker run -d \\
        --name ${containerName} \\
        --network ${networkName} \\
        --cpus=${config.resources?.cpu || '1'} \\
        --memory=${config.resources?.memory || '2g'} \\
        ${envVars.join(' ')} \\
        -p 0:8080 \\
        --restart unless-stopped \\
        opc/agent-base:v1`;

      const containerId = execSync(cmd).toString().trim();
      
      // 3. 获取映射端口
      const portInfo = execSync(`docker port ${containerName} 8080`).toString().trim();
      const hostPort = portInfo.split(':')[1];

      // 4. 更新数据库
      await this.db.query(
        `UPDATE deploy_agents 
         SET container_id = ?, status = 'running', endpoint = ?, updated_at = NOW()
         WHERE id = ?`,
        [containerId, `http://localhost:${hostPort}`, agentId]
      );

      return { containerId, port: hostPort };
    } catch (error) {
      await this.updateAgentStatus(agentId, 'error');
      throw error;
    }
  }

  /**
   * 启动 Agent
   */
  async startAgent(agentId) {
    const containerName = `opc-agent-${agentId}`;
    try {
      execSync(`docker start ${containerName}`);
      await this.updateAgentStatus(agentId, 'running');
      return { success: true };
    } catch (error) {
      throw new Error(`启动失败: ${error.message}`);
    }
  }

  /**
   * 停止 Agent
   */
  async stopAgent(agentId) {
    const containerName = `opc-agent-${agentId}`;
    try {
      execSync(`docker stop ${containerName}`);
      await this.updateAgentStatus(agentId, 'stopped');
      return { success: true };
    } catch (error) {
      throw new Error(`停止失败: ${error.message}`);
    }
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(agentId) {
    const containerName = `opc-agent-${agentId}`;
    const networkName = `${this.networkPrefix}${agentId}`;
    
    try {
      // 1. 停止并删除容器
      execSync(`docker stop ${containerName} 2>/dev/null || true`);
      execSync(`docker rm ${containerName} 2>/dev/null || true`);
      
      // 2. 删除网络
      execSync(`docker network rm ${networkName} 2>/dev/null || true`);
      
      // 3. 更新数据库
      await this.updateAgentStatus(agentId, 'destroyed');
      
      return { success: true };
    } catch (error) {
      throw new Error(`删除失败: ${error.message}`);
    }
  }

  /**
   * 获取 Agent 列表
   */
  async listAgents(userId) {
    const [agents] = await this.db.query(
      `SELECT id, name, description, status, model, endpoint, 
              hourly_price, created_at, updated_at
       FROM deploy_agents 
       WHERE user_id = ? AND status != 'destroyed'
       ORDER BY created_at DESC`,
      [userId]
    );
    return agents;
  }

  /**
   * 获取 Agent 详情
   */
  async getAgent(agentId) {
    const [agents] = await this.db.query(
      `SELECT * FROM deploy_agents WHERE id = ?`,
      [agentId]
    );
    return agents[0] || null;
  }

  /**
   * 获取用量统计
   */
  async getUsage(agentId, startDate, endDate) {
    const [usage] = await this.db.query(
      `SELECT 
        SUM(hours) as total_hours,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(compute_cost) as total_compute_cost,
        SUM(model_cost) as total_model_cost,
        SUM(total_cost) as total_cost
       FROM deploy_agent_usage 
       WHERE agent_id = ? AND date BETWEEN ? AND ?`,
      [agentId, startDate, endDate]
    );
    return usage[0];
  }

  /**
   * 记录模型调用用量
   */
  async recordModelUsage(agentId, promptTokens, completionTokens) {
    const today = new Date().toISOString().split('T')[0];
    const cost = this.calculateModelCost(promptTokens, completionTokens);
    
    await this.db.query(
      `INSERT INTO deploy_agent_usage 
       (agent_id, date, prompt_tokens, completion_tokens, model_cost)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       prompt_tokens = prompt_tokens + VALUES(prompt_tokens),
       completion_tokens = completion_tokens + VALUES(completion_tokens),
       model_cost = model_cost + VALUES(model_cost)`,
      [agentId, today, promptTokens, completionTokens, cost]
    );
  }

  /**
   * 计算模型成本
   */
  calculateModelCost(promptTokens, completionTokens) {
    // 按 LingAPI 2.4折价格计算
    const inputPrice = 0.0041;  // ¥0.0041/1K tokens
    const outputPrice = 0.0098; // ¥0.0098/1K tokens
    
    return (promptTokens / 1000 * inputPrice) + 
           (completionTokens / 1000 * outputPrice);
  }

  /**
   * 更新 Agent 状态
   */
  async updateAgentStatus(agentId, status) {
    await this.db.query(
      `UPDATE deploy_agents SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, agentId]
    );
  }

  /**
   * 哈希 API Key
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * 验证 API Key
   */
  verifyApiKey(apiKey) {
    const parts = apiKey.split('-');
    if (parts.length !== 4 || parts[0] !== 'opc' || parts[1] !== 'agt') {
      return null;
    }
    return parts[2]; // 返回 agent_id
  }
}

module.exports = DeployService;
