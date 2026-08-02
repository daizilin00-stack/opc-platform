const { pool } = require('../db/pool');
const logger = require('../utils/logger');

// 检查账户余额是否足够
async function checkAccountBalance(accountId, accountType, amount) {
  try {
    let balance;
    
    if (accountType === 'individual') {
      // 检查个人账户
      const result = await pool.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [accountId]
      );
      balance = result.rows.length > 0 ? result.rows[0].balance : 0;
    } else if (accountType === 'team') {
      // 检查团队账户
      const result = await pool.query(
        'SELECT balance FROM teams WHERE id = $1',
        [accountId]
      );
      balance = result.rows.length > 0 ? result.rows[0].balance : 0;
    } else {
      throw new Error('不支持的账户类型');
    }
    
    return balance >= amount;
  } catch (err) {
    logger.error('检查账户余额失败:', err);
    throw err;
  }
}

// 扣除账户金额
async function deductAccountBalance(accountId, accountType, amount, consumptionId) {
  try {
    if (accountType === 'individual') {
      // 个人账户扣费（使用现有的钱包系统）
      await pool.query(
        `UPDATE wallets SET balance = balance - $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [amount, accountId]
      );
    } else if (accountType === 'team') {
      // 团队账户扣费
      await pool.query(
        `UPDATE teams 
         SET balance = balance - $1, total_spent = total_spent + $1, updated_at = NOW()
         WHERE id = $2`,
        [amount, accountId]
      );
      
      // 记录团队钱包交易（可选）
      await pool.query(
        `INSERT INTO wallet_transactions
         (user_id, wallet_id, transaction_type, direction, amount, currency,
          balance_after, frozen_after, description, status)
         SELECT user_id, NULL, 'token_usage', 'out', $1, 'CNY',
                balance - $1, 0, 'AI 模型调用消耗', 'completed'
         FROM teams
         WHERE id = $2`,
        [amount, accountId]
      );
    } else {
      throw new Error('不支持的账户类型');
    }
    
    // 更新消费记录状态为已计费
    if (consumptionId) {
      await pool.query(
        `UPDATE consumptions SET status = 'billed', billed_at = NOW() WHERE id = $1`,
        [consumptionId]
      );
    }
  } catch (err) {
    logger.error('扣除账户金额失败:', err);
    throw err;
  }
}

// 获取用户的消费账户（个人账户或团队账户）
async function getUserAccountInfo(userId) {
  try {
    // 检查用户是否属于活跃团队
    const teamResult = await pool.query(
      `SELECT 
        tm.team_id, t.owner_id, t.balance, t.tier,
        tm.role, u.account_type
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       JOIN users u ON tm.user_id = u.id
       WHERE tm.user_id = $1 AND tm.status = 'active' AND t.status = 'active'`,
      [userId]
    );
    
    if (teamResult.rows.length > 0) {
      // 返回团队账户信息
      const row = teamResult.rows[0];
      return {
        accountId: row.team_id,
        accountType: 'team',
        ownerId: row.owner_id,
        role: row.role,
        tier: row.tier,
        balance: row.balance,
        isTeam: true
      };
    } else {
      // 返回个人账户信息
      const walletResult = await pool.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );
      
      return {
        accountId: userId,
        accountType: 'individual',
        role: null,
        tier: 'individual',
        balance: walletResult.rows.length > 0 ? walletResult.rows[0].balance : 0,
        isTeam: false
      };
    }
  } catch (err) {
    logger.error('获取用户账户信息失败:', err);
    return {
      accountId: userId,
      accountType: 'individual',
      tier: 'individual',
      balance: 0,
      isTeam: false
    };
  }
}

// 获取用户的折扣率
getDiscountRate = async (tier) => {
  switch (tier) {
    case 'individual':
      return 0.65; // 6.5折
    case 'team':
      return 0.55; // 5.5折
    case 'enterprise':
      return 0.80; // 8.0折
    default:
      return 1.0; // 无折扣
  }
};

// 计算模型调用成本
async function calculateModelCost(modelName, promptTokens, completionTokens, tier) {
  // 这需要根据实际定价配置
  // 暂时使用硬编码，后续可以移到数据库或配置文件
  const pricing = {
    'gpt-4o': { input: 0.036, output: 0.108 },
    'claude-3.5': { input: 0.022, output: 0.108 },
    'deepseek': { input: 0.001, output: 0.004 },
    'kimi': { input: 0.003, output: 0.006 },
    'tongyi': { input: 0.002, output: 0.005 },
    'default': { input: 0.01, output: 0.02 }
  };
  
  const modelPricing = pricing[modelName] || pricing['default'];
  const discountRate = await getDiscountRate(tier);
  
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;
  const totalCost = (inputCost + outputCost) * discountRate;
  
  return {
    inputCost,
    outputCost,
    totalCost,
    discountRate,
    originalCost: inputCost + outputCost
  };
}

module.exports = {
  checkAccountBalance,
  deductAccountBalance,
  getUserAccountInfo,
  calculateModelCost,
  getDiscountRate
};
