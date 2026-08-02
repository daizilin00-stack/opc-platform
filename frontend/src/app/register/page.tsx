'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

export default function RegisterPage() {
  const [step, setStep] = useState('register'); // register | id-verify | license-upload | company-verify | contract-sign | complete
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    phone: '',
    password: '',
    realName: '',
    idCard: '',
    companyName: '',
    registrationNo: '',
    companyType: 'existing_upload', // 默认已有公司，需要上传营业执照
    contractAgreed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useStore((state) => state.login);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.register(form.phone, form.password, form.realName);
      if (res?.token) {
        login({
          id: res.user.id,
          phone: res.user.phone,
          realName: res.user.realName || '',
          skills: res.user.skills || [],
          creditScore: res.user.creditScore || 100,
          level: res.user.level || 1,
          token: res.token,
        });
        setStep('id-verify');
      } else {
        setError(res?.error || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleIdVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.auth.verifyId(form.idCard, form.realName);
      setStep('license-upload');
    } catch (err: any) {
      setError(err.message || '实名认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseFile && !licensePreview) {
      setError('请上传营业执照');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 模拟上传营业执照到服务器
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 保存营业执照信息到 localStorage（实际应上传到服务器）
      if (licensePreview) {
        localStorage.setItem('businessLicense', licensePreview);
        localStorage.setItem('businessLicenseName', licenseFile?.name || '营业执照');
      }
      setStep('company-verify');
    } catch (err: any) {
      setError(err.message || '营业执照上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.auth.verifyCompany(form.companyName, form.registrationNo, form.companyType);
      setStep('contract-sign');
    } catch (err: any) {
      setError(err.message || '企业认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleContractSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contractAgreed) {
      setError('请先阅读并同意合同条款');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.auth.signContract('v1.0', true);
      setStep('complete');
    } catch (err: any) {
      setError(err.message || '合同签署失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const stepItems = [
    { key: 'register', label: '注册' },
    { key: 'id-verify', label: '实名' },
    { key: 'license-upload', label: '执照' },
    { key: 'company-verify', label: '企业' },
    { key: 'contract-sign', label: '签约' },
    { key: 'complete', label: '开通' }
  ];

  const isStepCompleted = (stepKey: string, index: number) => {
    const currentIndex = stepItems.findIndex(s => s.key === step);
    if (step === 'complete') return index < 5;
    return index < currentIndex;
  };

  const isStepActive = (stepKey: string, index: number) => {
    return step === stepKey || isStepCompleted(stepKey, index);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            O
          </div>
          <h1 className="text-2xl font-bold text-gray-900">加入 OPC 数字平台</h1>
          <p className="text-gray-600 mt-2">完成认证，开启 AI 数字员工服务</p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto">
          {stepItems.map((s, i) => (
            <div key={s.key} className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isStepActive(s.key, i) ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className={`ml-1 text-xs ${
                step === s.key ? 'text-brand-600 font-bold' : 'text-gray-500'
              }`}>
                {s.label}
              </span>
              {i < 5 && <div className="w-4 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="card">
          {/* 步骤 1：注册 */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  required
                  placeholder="13800000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                <input
                  type="text"
                  required
                  placeholder="与身份证一致"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.realName}
                  onChange={e => setForm({ ...form, realName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  required
                  placeholder="至少 6 位"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? '注册中...' : '注册账号'}
              </button>
              <p className="text-center text-sm text-gray-500">
                已有账号？<Link href="/login" className="text-brand-600 hover:underline">立即登录</Link>
              </p>
            </form>
          )}

          {/* 步骤 2：实名认证 */}
          {step === 'id-verify' && (
            <form onSubmit={handleIdVerify} className="space-y-4">
              <div className="bg-brand-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-brand-700">
                  ⚠️ 根据《网络安全法》要求，使用平台服务需完成实名认证
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                <input
                  type="text"
                  required
                  placeholder="与身份证一致"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.realName}
                  onChange={e => setForm({ ...form, realName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
                <input
                  type="text"
                  required
                  placeholder="18位身份证号码"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.idCard}
                  onChange={e => setForm({ ...form, idCard: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '认证中...' : '提交实名认证'}
              </button>
            </form>
          )}

          {/* 步骤 3：营业执照上传 */}
          {step === 'license-upload' && (
            <form onSubmit={handleLicenseUpload} className="space-y-4">
              <div className="bg-accent-50 border border-accent-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-accent-700 font-bold mb-1">
                  📄 必须上传营业执照
                </p>
                <p className="text-sm text-accent-600">
                  根据平台合规要求，使用跨境网络服务必须提供企业营业执照。个人用户请注册个体工商户营业执照后上传。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传营业执照</label>
                <input
                  type="file"
                  id="license-upload"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      setError('文件大小超过 10MB，请压缩后重新上传');
                      return;
                    }
                    setLicenseFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setLicensePreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <div
                  onClick={() => document.getElementById('license-upload')?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-gray-50 transition-colors"
                >
                  {licensePreview ? (
                    <div className="space-y-2">
                      <img src={licensePreview} alt="营业执照预览" className="max-h-48 mx-auto rounded" />
                      <p className="text-xs text-green-600">✅ 已上传：{licenseFile?.name || '营业执照'}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 text-sm">点击上传营业执照照片或 PDF</p>
                      <p className="text-gray-400 text-xs mt-1">支持 JPG、PNG、PDF，最大 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>提示：</strong>营业执照将用于：
                  <br />1. 平台合规审核
                  <br />2. 订购服务时与合同一起存档
                  <br />3. 后台客户信息管理系统备份
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || !licenseFile}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '上传中...' : '确认上传并继续'}
              </button>
            </form>
          )}

          {/* 步骤 4：企业认证 */}
          {step === 'company-verify' && (
            <form onSubmit={handleCompanyVerify} className="space-y-4">
              <div className="bg-brand-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-brand-700">
                  ✅ 营业执照已上传，请补充企业信息
                </p>
              </div>
              
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, companyType: 'new_register' })}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    form.companyType === 'new_register'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  新注册公司
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, companyType: 'existing_upload' })}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    form.companyType === 'existing_upload'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  已有公司
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                <input
                  type="text"
                  required
                  placeholder="企业全称（与营业执照一致）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  统一社会信用代码
                </label>
                <input
                  type="text"
                  required
                  placeholder="18位代码（与营业执照一致）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.registrationNo}
                  onChange={e => setForm({ ...form, registrationNo: e.target.value })}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '提交中...' : '提交企业认证'}
              </button>
            </form>
          )}

          {/* 步骤 5：电子合同签署 */}
          {step === 'contract-sign' && (
            <form onSubmit={handleContractSign} className="space-y-4">
              <div className="bg-brand-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-brand-700 font-bold mb-2">
                  最后一步：签署网络服务协议
                </p>
                <p className="text-sm text-gray-600">
                  您的营业执照已保存至平台，签署协议后二者将一并存档
                </p>
              </div>

              {/* 合同内容摘要 */}
              <div className="border border-gray-200 rounded-lg p-4 h-48 overflow-y-auto text-sm text-gray-700 space-y-2">
                <p className="font-bold">OPC 数字平台网络服务协议（摘要）</p>
                <p>1. 服务范围：硅基员工平台（软件服务，签署即开通）、Token 团购中心（软件服务，签署即开通）、海外模型能力（软件服务，已接入）</p>
                <p>2. 用户义务：提供真实身份信息，合法使用平台服务，不得用于违法违规用途</p>
                <p>3. 平台义务：保障服务可用性，保护用户数据安全，合规提供跨境数据服务</p>
                <p>4. 计费规则：硅基员工按订阅计费，Token 按实际用量计费，硬件服务按资源用量计费</p>
                <p>5. 违约责任：违反法律法规或平台规则，平台有权终止服务</p>
                <p>（完整协议请查看附件）</p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  checked={form.contractAgreed}
                  onChange={e => setForm({ ...form, contractAgreed: e.target.checked })}
                />
                <span className="text-sm text-gray-700">
                  我已阅读并同意《OPC 数字平台网络服务协议》，确认提供的信息真实有效，承诺合法使用平台服务
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !form.contractAgreed}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '签署中...' : '签署协议并开通服务'}
              </button>
            </form>
          )}

          {/* 步骤 6：开通完成 */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">服务开通成功！</h3>
              <p className="text-gray-600 mb-2">
                您的营业执照和合同已安全存档
              </p>
              <p className="text-sm text-gray-500 mb-6">
                欢迎来到 OPC 数字平台，您的 AI 数字员工已就绪
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-bold text-green-800">✅ 已自动开通（立即使用）</p>
                  <p className="text-sm text-green-700">硅基员工平台 — 雇佣您的 AI 数字员工</p>
                  <p className="text-sm text-green-700">Token 团购中心 — 优惠购买大模型 API</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-bold text-blue-800">📄 已存档资料</p>
                  <p className="text-sm text-blue-700">营业执照：已上传并备份</p>
                  <p className="text-sm text-blue-700">服务协议：已签署并备份</p>
                </div>
              </div>

              <button
                onClick={() => router.push('/workspace')}
                className="btn-primary inline-block"
              >
                进入工作台
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
