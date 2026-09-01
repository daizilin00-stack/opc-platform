#!/usr/bin/env node
/**
 * Deploy Service - Agent 生命周期管理
 * 负责创建、管理、销毁 Agent Docker 容器
 */

const { execSync } = require('child_process');
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

    await this.db.query(
      `INSERT INTO deploy_agents 
       (id, user_id, name, description, template, model, system_prompt, 
        api_key_hash, cpu_limit, memory_limit, storage_limit, hourly_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'creating')`,
      [agentId, userId, config.name, config.description, config.template,
       config.model, config.system_prompt || '',
       this.hashKey(apiKey), config.resources?.cpu || '1',
       config.resources?.memory || '2G', config.resources?.storage || '10G',
       config.pricing?.compute?.hourly || 0.05]
    );

    // 异步创建容器
    this.createContainer(agentId, config, apiKey).catch(err => {
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
  async createContainer(agentId, config, apiKey) {
    const networkName = `${this.networkPrefix}${agentId}`;
    const containerName = `opc-agent-${agentId}`;

    try {
      execSync(`docker network create ${networkName} 2>/dev/null || true`);

      const opcApiBase = process.env.OPC_API_BASE_URL || 'http://host.docker.internal:3003';

      const envVars = [
        `-e AGENT_ID=${agentId}`,
        `-e MODEL_PROVIDER=opc`,
        `-e MODEL_BASE_URL=${opcApiBase}`,
        `-e MODEL_API_KEY=${apiKey}`,
        `-e MODEL=${config.model || 'gpt-5.4-mini'}`
      ];

      const cmd = `docker run -d \\
        --name ${containerName} \\
        --network ${networkName} \\
        --cpus=${config.resources?.cpu || '1'} \\
        --memory=${(config.resources?.memory || '2G').toLowerCase()} \\
        ${envVars.join(' ')} \\
        -p 0:8080 \\
        --restart unless-stopped \\
        opc/agent-base:v1`;

      const containerId = execSync(cmd).toString().trim();

      const portInfo = execSync(`docker port ${containerName} 8080`).toString().trim();
      const hostPort = portInfo.split(':').pop();

      await this.db.query(
        `UPDATE deploy_agents 
         SET container_id = $1, status = 'running', endpoint = $2, updated_at = NOW()
         WHERE id = $3`,
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
      execSync(`docker stop ${containerName} 2>/dev/null || true`);
      execSync(`docker rm ${containerName} 2>/dev/null || true`);
      execSync(`docker network rm ${networkName} 2>/dev/null || true`);

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
    const { rows } = await this.db.query(
      `SELECT id, name, description, status, model, endpoint, 
              hourly_price, created_at, updated_at
       FROM deploy_agents 
       WHERE user_id = $1 AND status != 'destroyed'
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * 获取 Agent 详情
   */
  async getAgent(agentId) {
    const { rows } = await this.db.query(
      `SELECT * FROM deploy_agents WHERE id = $1`,
      [agentId]
    );
    return rows[0] || null;
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(apiKey) {
    const parts = apiKey.split('-');
    if (parts.length !== 4 || parts[0] !== 'opc' || parts[1] !== 'agt') {
      return null;
    }
    const agentId = `agt_${parts[2]}`;
    const agent = await this.getAgent(agentId);
    if (!agent) return null;
    if (agent.api_key_hash !== this.hashKey(apiKey)) return null;
    if (agent.status !== 'running') return null;
    return agent;
  }

  /**
   * 记录模型调用用量
   */
  async recordModelUsage(agentId, promptTokens, completionTokens, modelCost) {
    const today = new Date().toISOString().split('T')[0];

    await this.db.query(
      `INSERT INTO deploy_agent_usage 
       (agent_id, date, prompt_tokens, completion_tokens, model_cost)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (agent_id, date) DO UPDATE SET
       prompt_tokens = deploy_agent_usage.prompt_tokens + EXCLUDED.prompt_tokens,
       completion_tokens = deploy_agent_usage.completion_tokens + EXCLUDED.completion_tokens,
       model_cost = deploy_agent_usage.model_cost + EXCLUDED.model_cost`,
      [agentId, today, promptTokens, completionTokens, modelCost]
    );
  }
}

module.exports = DeployService;
