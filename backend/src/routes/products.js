/**
 * 商品/套餐 API
 * 提供商品列表、商品详情查询、用户订阅查询
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../db/pool');
const logger = require('../utils/logger');

/**
 * 获取商品列表
 * GET /api/products
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];

    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += ' ORDER BY sort_order ASC, created_at ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      products: result.rows.map(p => ({
        id: p.id,
        type: p.type,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        creditValue: parseFloat(p.credit_value),
        tokenQuota: parseInt(p.token_quota, 10),
        aiEmployees: p.ai_employees || [],
        periodMonths: p.period_months,
        isActive: p.is_active
      }))
    });
  } catch (error) {
    logger.error('获取商品列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取商品列表失败' });
  }
});

/**
 * 获取当前用户订阅/套餐
 * GET /api/products/subscriptions
 * 需要登录
 * ⚠️ 此路由必须放在 /:productId 之前，避免被 Express 路径参数拦截
 */
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.type as product_type
       FROM subscriptions s
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      subscriptions: result.rows.map(s => ({
        id: s.id,
        productId: s.product_id,
        productName: s.product_name,
        productType: s.product_type,
        status: s.status,
        startedAt: s.started_at,
        expiresAt: s.expires_at,
        aiEmployees: s.ai_employees || [],
        tokenQuota: parseInt(s.token_quota, 10)
      }))
    });
  } catch (error) {
    logger.error('获取用户订阅失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户订阅失败' });
  }
});

/**
 * 获取单个商品详情
 * GET /api/products/:productId
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = TRUE',
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '商品不存在或已下架' });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      product: {
        id: p.id,
        type: p.type,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        creditValue: parseFloat(p.credit_value),
        tokenQuota: parseInt(p.token_quota, 10),
        aiEmployees: p.ai_employees || [],
        periodMonths: p.period_months,
        isActive: p.is_active
      }
    });
  } catch (error) {
    logger.error('获取商品详情失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取商品详情失败' });
  }
});

module.exports = router;
