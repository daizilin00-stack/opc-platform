const express = require('express');
const router = express.Router();
const { authenticate, requireVerifiedUser } = require('../middleware/auth');
const DeployService = require('../services/deployService');
const { chatCompletion, chatCompletionStream } = require('../services/modelProxy');

module.exports = (db) => {
  const deployService = new DeployService(db);

  /**
   * 创建 Agent
   * POST /api/v1/deploy/agents
   */
  router.post('/agents', authenticate, requireVerifiedUser, async (req, res) => {
    try {
      const { name, description, template, model, config, resources } = req.body;
      
      // 验证必填字段
      if (!name || !model) {
        return res.status(400).json({ 
          code: 400, 
          message: '名称和模型为必填项' 
        });
      }

      const result = await deployService.createAgent(req.user.id, {
        name,
        description: description || '',
        template: template || 'standard',
        model,
        system_prompt: config?.system_prompt || '',
        resources: resources || { cpu: '1', memory: '2G', storage: '10G' }
      });

      res.status(201).json({
        code: 0,
        data: result,
        message: 'Agent 创建中，请稍后查看状态'
      });
    } catch (error) {
      console.error('创建 Agent 失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '创建失败: ' + error.message 
      });
    }
  });

  /**
   * 获取 Agent 列表
   * GET /api/v1/deploy/agents
   */
  router.get('/agents', authenticate, async (req, res) => {
    try {
      const agents = await deployService.listAgents(req.user.id);
      res.json({
        code: 0,
        data: agents
      });
    } catch (error) {
      console.error('获取 Agent 列表失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '获取失败: ' + error.message 
      });
    }
  });

  /**
   * 获取 Agent 详情
   * GET /api/v1/deploy/agents/:id
   */
  router.get('/agents/:id', authenticate, async (req, res) => {
    try {
      const agent = await deployService.getAgent(req.params.id);
      
      if (!agent || agent.user_id !== req.user.id) {
        return res.status(404).json({ 
          code: 404, 
          message: 'Agent 不存在' 
        });
      }

      res.json({
        code: 0,
        data: agent
      });
    } catch (error) {
      console.error('获取 Agent 详情失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '获取失败: ' + error.message 
      });
    }
  });

  /**
   * 启动 Agent
   * POST /api/v1/deploy/agents/:id/start
   */
  router.post('/agents/:id/start', authenticate, requireVerifiedUser, async (req, res) => {
    try {
      const agent = await deployService.getAgent(req.params.id);
      
      if (!agent || agent.user_id !== req.user.id) {
        return res.status(404).json({ 
          code: 404, 
          message: 'Agent 不存在' 
        });
      }

      await deployService.startAgent(req.params.id);
      
      res.json({
        code: 0,
        message: 'Agent 启动成功'
      });
    } catch (error) {
      console.error('启动 Agent 失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '启动失败: ' + error.message 
      });
    }
  });

  /**
   * 停止 Agent
   * POST /api/v1/deploy/agents/:id/stop
   */
  router.post('/agents/:id/stop', authenticate, requireVerifiedUser, async (req, res) => {
    try {
      const agent = await deployService.getAgent(req.params.id);
      
      if (!agent || agent.user_id !== req.user.id) {
        return res.status(404).json({ 
          code: 404, 
          message: 'Agent 不存在' 
        });
      }

      await deployService.stopAgent(req.params.id);
      
      res.json({
        code: 0,
        message: 'Agent 停止成功'
      });
    } catch (error) {
      console.error('停止 Agent 失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '停止失败: ' + error.message 
      });
    }
  });

  /**
   * 删除 Agent
   * DELETE /api/v1/deploy/agents/:id
   */
  router.delete('/agents/:id', authenticate, requireVerifiedUser, async (req, res) => {
    try {
      const agent = await deployService.getAgent(req.params.id);
      
      if (!agent || agent.user_id !== req.user.id) {
        return res.status(404).json({ 
          code: 404, 
          message: 'Agent 不存在' 
        });
      }

      await deployService.deleteAgent(req.params.id);
      
      res.json({
        code: 0,
        message: 'Agent 删除成功'
      });
    } catch (error) {
      console.error('删除 Agent 失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '删除失败: ' + error.message 
      });
    }
  });

  /**
   * 获取 Agent 用量统计
   * GET /api/v1/deploy/agents/:id/usage
   */
  router.get('/agents/:id/usage', authenticate, async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      const agent = await deployService.getAgent(req.params.id);
      if (!agent || agent.user_id !== req.user.id) {
        return res.status(404).json({ 
          code: 404, 
          message: 'Agent 不存在' 
        });
      }

      const now = new Date();
      const start = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = end_date || now.toISOString().split('T')[0];

      const usage = await deployService.getUsage(req.params.id, start, end);
      
      res.json({
        code: 0,
        data: {
          agent_id: req.params.id,
          period: { start, end },
          usage
        }
      });
    } catch (error) {
      console.error('获取用量统计失败:', error);
      res.status(500).json({ 
        code: 500, 
        message: '获取失败: ' + error.message 
      });
    }
  });

  /**
   * 获取部署模板列表
   * GET /api/v1/deploy/templates
   */
  router.get('/templates', async (req, res) => {
    const templates = [
      {
        id: 'minimal',
        name: '最小化',
        description: '适用于测试和原型开发',
        resources: { cpu: '0.5', memory: '1G', storage: '5G' },
        pricing: { compute: { hourly: 0.03 } }
      },
      {
        id: 'standard',
        name: '标准',
        description: '适用于生产环境',
        resources: { cpu: '1', memory: '2G', storage: '10G' },
        pricing: { compute: { hourly: 0.05 } }
      },
      {
        id: 'performance',
        name: '高性能',
        description: '适用于高并发场景',
        resources: { cpu: '2', memory: '4G', storage: '20G' },
        pricing: { compute: { hourly: 0.10 } }
      }
    ];

    res.json({
      code: 0,
      data: templates
    });
  });

  /**
   * Agent 对话接口（OpenAI-compatible）
   * POST /api/v1/deploy/chat
   * 通过 Authorization: Bearer <agent-api-key> 鉴权
   */
  router.post('/chat', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const apiKey = authHeader.replace(/^Bearer\s+/i, '');

      if (!apiKey) {
        return res.status(401).json({ error: 'Missing API key' });
      }

      const agent = await deployService.verifyApiKey(apiKey);
      if (!agent) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const { model, messages, temperature, max_tokens, stream } = req.body;
      const modelId = model || agent.model || 'gpt-5.4-mini';

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const generator = chatCompletionStream(modelId, messages, {
            temperature: temperature ?? 0.7,
            max_tokens: max_tokens ?? 2048
          });

          let promptTokens = 0;
          let completionTokens = 0;

          for await (const chunk of generator) {
            if (chunk.choices) {
              const delta = chunk.choices[0]?.delta;
              if (delta?.content) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
              }
            }
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens || 0;
              completionTokens = chunk.usage.completion_tokens || 0;
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();

          // 记录用量（异步，不阻塞响应）
          if (promptTokens || completionTokens) {
            const cost = (promptTokens / 1000 * 0.0041) + (completionTokens / 1000 * 0.0098);
            deployService.recordModelUsage(agent.id, promptTokens, completionTokens, cost).catch(console.error);
          }
        } catch (err) {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
        }
      } else {
        const response = await chatCompletion(modelId, messages, {
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 2048
        });

        res.json(response);

        if (response.usage) {
          const { prompt_tokens, completion_tokens } = response.usage;
          const cost = (prompt_tokens / 1000 * 0.0041) + (completion_tokens / 1000 * 0.0098);
          deployService.recordModelUsage(agent.id, prompt_tokens, completion_tokens, cost).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Agent 对话失败:', error);
      res.status(500).json({ error: '对话失败: ' + error.message });
    }
  });

  return router;
};
