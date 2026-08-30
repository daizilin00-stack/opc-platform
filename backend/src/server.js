const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const migrate = require('./db/migrate');
const migrateDeploy = require('./db/migrate-deploy');
const logger = require('./utils/logger');
const pool = require('./db/pool');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const agentRoutes = require('./routes/agents');
const escrowRoutes = require('./routes/escrow');
const walletRoutes = require('./routes/wallet');
const commissionsRoutes = require('./routes/commissions');
const userRoutes = require('./routes/users');
const billingRoutes = require('./routes/billing');
const modelRoutes = require('./routes/models');
const deployRoutes = require('./routes/deploy');
const earningsRoutes = require('./routes/earnings');
const { router: withdrawalRouter } = require('./routes/withdrawal');
const adminWithdrawalRoutes = require('./routes/admin-withdrawal');
const teamRoutes = require('./routes/teams');
const consumptionRoutes = require('./routes/consumptions');
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3100',
    'http://127.0.0.1:3100',
  ],
  credentials: true
}));

// 限流
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' }
}));

// 日志
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// 微信支付回调需要原始请求体验证签名，必须放在 express.json 之前
app.use('/api/payment/wechat/callback', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'OPC 数字平台',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/consumptions', consumptionRoutes);
app.use('/api/v1/withdrawal', withdrawalRouter);
app.use('/api/v1/admin', adminWithdrawalRoutes);
app.use('/api/v1/deploy', deployRoutes(pool));
app.use('/api/payment', paymentRoutes);
app.use('/api/products', productRoutes);

// 404 和错误处理
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  logger.info(`🚀 OPC 后端服务已启动，端口: ${PORT}`);
  // 启动时自动迁移数据库
  await migrate();
  await migrateDeploy();
});

module.exports = app;