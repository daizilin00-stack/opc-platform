'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  phone: string;
  realName: string;
  companyName: string;
  registrationNo: string;
  idCard: string;
  creditScore: number;
  level: number;
  status: 'active' | 'inactive' | 'pending';
  registerDate: string;
  lastLogin: string;
  hasLicense: boolean;
  hasContract: boolean;
  orderCount: number;
  totalSpent: number;
}

// 模拟客户数据（实际应从后端 API 获取）
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    phone: '138****8888',
    realName: '张三',
    companyName: '重庆某某科技有限公司',
    registrationNo: '91500103MA60****',
    idCard: '500103********1234',
    creditScore: 95,
    level: 2,
    status: 'active',
    registerDate: '2026-06-15',
    lastLogin: '2026-06-16 14:30',
    hasLicense: true,
    hasContract: true,
    orderCount: 3,
    totalSpent: 4500,
  },
  {
    id: '2',
    phone: '139****6666',
    realName: '李四',
    companyName: '重庆另一家公司',
    registrationNo: '91500103MA60****',
    idCard: '500103********5678',
    creditScore: 88,
    level: 1,
    status: 'active',
    registerDate: '2026-06-14',
    lastLogin: '2026-06-16 10:15',
    hasLicense: true,
    hasContract: true,
    orderCount: 1,
    totalSpent: 1500,
  },
  {
    id: '3',
    phone: '137****9999',
    realName: '王五',
    companyName: '待补充',
    registrationNo: '',
    idCard: '',
    creditScore: 100,
    level: 1,
    status: 'pending',
    registerDate: '2026-06-16',
    lastLogin: '2026-06-16 16:00',
    hasLicense: false,
    hasContract: false,
    orderCount: 0,
    totalSpent: 0,
  },
];

interface OrderRecord {
  id: string;
  customerId: string;
  customerName: string;
  planName: string;
  bandwidth: number;
  price: number;
  months: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'active' | 'cancelled';
  orderDate: string;
  contractSigned: boolean;
  licenseBackup: boolean;
}

const MOCK_ORDERS: OrderRecord[] = [
  {
    id: 'ORD123456',
    customerId: '1',
    customerName: '张三',
    planName: '跨境专业版',
    bandwidth: 10,
    price: 1500,
    months: 1,
    totalPrice: 1500,
    status: 'active',
    orderDate: '2026-06-15',
    contractSigned: true,
    licenseBackup: true,
  },
  {
    id: 'ORD123457',
    customerId: '1',
    customerName: '张三',
    planName: '跨境企业版',
    bandwidth: 100,
    price: 3999,
    months: 1,
    totalPrice: 3999,
    status: 'paid',
    orderDate: '2026-06-16',
    contractSigned: true,
    licenseBackup: true,
  },
];

export default function AdminCustomersPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders' | 'contracts'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.phone.includes(searchTerm) || 
    c.realName.includes(searchTerm) || 
    c.companyName.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    const labels = {
      active: '正常',
      inactive: '停用',
      pending: '待完善',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500 mb-1">总客户数</p>
            <p className="text-2xl font-bold text-slate-900">{MOCK_CUSTOMERS.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500 mb-1">正常服务中</p>
            <p className="text-2xl font-bold text-green-600">
              {MOCK_CUSTOMERS.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500 mb-1">待完善资料</p>
            <p className="text-2xl font-bold text-yellow-600">
              {MOCK_CUSTOMERS.filter(c => c.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500 mb-1">总订单金额</p>
            <p className="text-2xl font-bold text-brand-600">
              ¥{MOCK_ORDERS.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'customers', label: '客户列表' },
            { key: 'orders', label: '订单管理' },
            { key: 'contracts', label: '合同/执照存档' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="搜索手机号、姓名或公司名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
            <button className="btn-primary px-6">搜索</button>
            <button className="btn-secondary px-6">导出Excel</button>
          </div>
        </div>

        {/* 客户列表 */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">客户信息</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">企业信息</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">资料状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">订单</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{customer.realName || '未实名'}</div>
                      <div className="text-slate-500">{customer.phone}</div>
                      <div className="text-xs text-slate-400">注册: {customer.registerDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{customer.companyName || '-'}</div>
                      <div className="text-xs text-slate-500">{customer.registrationNo || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 text-xs ${customer.hasLicense ? 'text-green-600' : 'text-red-500'}`}>
                          {customer.hasLicense ? '✅' : '❌'} 营业执照
                        </span>
                        <br />
                        <span className={`inline-flex items-center gap-1 text-xs ${customer.hasContract ? 'text-green-600' : 'text-red-500'}`}>
                          {customer.hasContract ? '✅' : '❌'} 服务协议
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{customer.orderCount} 笔</div>
                      <div className="text-xs text-slate-500">消费 ¥{customer.totalSpent}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDetailModal(true);
                        }}
                        className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 订单管理 */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">订单号</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">客户</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">服务</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">金额</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">合同</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">执照</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{order.id}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <div>{order.planName}</div>
                      <div className="text-xs text-slate-500">{order.bandwidth}M / {order.months}个月</div>
                    </td>
                    <td className="px-4 py-3 font-bold">¥{order.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {order.contractSigned ? (
                        <span className="text-green-600 text-xs">✅ 已签署</span>
                      ) : (
                        <span className="text-red-500 text-xs">❌ 未签署</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.licenseBackup ? (
                        <span className="text-green-600 text-xs">✅ 已备份</span>
                      ) : (
                        <span className="text-red-500 text-xs">❌ 未备份</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'active' ? 'bg-green-100 text-green-700' :
                        order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status === 'active' ? '服务中' :
                         order.status === 'paid' ? '已支付' :
                         order.status === 'pending' ? '待支付' : '已取消'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 合同/执照存档 */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">📄 合同存档</h3>
              <div className="space-y-3">
                {MOCK_CUSTOMERS.filter(c => c.hasContract).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-700">{customer.companyName || customer.realName}</p>
                      <p className="text-xs text-slate-500">客户ID: {customer.id} | 签署日期: {customer.registerDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-brand-600 text-sm hover:underline">查看合同</button>
                      <button className="text-brand-600 text-sm hover:underline">下载PDF</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">🏢 营业执照存档</h3>
              <div className="space-y-3">
                {MOCK_CUSTOMERS.filter(c => c.hasLicense).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-700">{customer.companyName || customer.realName}</p>
                      <p className="text-xs text-slate-500">统一代码: {customer.registrationNo || '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-brand-600 text-sm hover:underline">查看执照</button>
                      <button className="text-brand-600 text-sm hover:underline">下载图片</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 客户详情弹窗 */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">客户详情</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">姓名</p>
                  <p className="font-medium">{selectedCustomer.realName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">手机号</p>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">公司名称</p>
                  <p className="font-medium">{selectedCustomer.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">统一社会信用代码</p>
                  <p className="font-medium">{selectedCustomer.registrationNo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">信用分</p>
                  <p className="font-medium">{selectedCustomer.creditScore}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">等级</p>
                  <p className="font-medium">LV.{selectedCustomer.level}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">资料备份状态</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={selectedCustomer.hasLicense ? 'text-green-600' : 'text-red-500'}>
                      {selectedCustomer.hasLicense ? '✅' : '❌'}
                    </span>
                    <span className="text-sm">营业执照</span>
                    {selectedCustomer.hasLicense && (
                      <button className="text-brand-600 text-xs hover:underline ml-2">查看原件</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={selectedCustomer.hasContract ? 'text-green-600' : 'text-red-500'}>
                      {selectedCustomer.hasContract ? '✅' : '❌'}
                    </span>
                    <span className="text-sm">服务协议</span>
                    {selectedCustomer.hasContract && (
                      <button className="text-brand-600 text-xs hover:underline ml-2">查看合同</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">订单记录</h4>
                <p className="text-sm text-slate-600">订单数: {selectedCustomer.orderCount} | 总消费: ¥{selectedCustomer.totalSpent}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
