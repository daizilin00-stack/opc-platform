'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { NETWORK_SERVICES } from '@/lib/pricing';

export default function ContractPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const user = useStore((state) => state.user);

  const planId = searchParams.get('plan') || 'net-pro';
  const orderId = searchParams.get('order') || '';
  const plan = NETWORK_SERVICES.find(p => p.id === planId);

  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">请先登录后再签署合同</p>
          <Link href="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    );
  }

  const handleSign = async () => {
    if (!agreed) return;
    setLoading(true);
    
    // 获取营业执照（从localStorage或用户资料）
    const businessLicense = localStorage.getItem('businessLicense');
    const businessLicenseName = localStorage.getItem('businessLicenseName');
    
    // 模拟：将合同和营业执照一起备份到系统
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 保存合同和营业执照关联记录（实际应发送到后端API）
    const contractRecord = {
      orderId: orderId || 'ORD' + Date.now().toString().slice(-8),
      planId,
      planName: plan?.name,
      customerId: user?.id,
      customerName: user?.realName || user?.phone,
      companyName: user?.companyName || '',
      contractVersion: 'CSDP-WAN-2024-v1',
      signedAt: new Date().toISOString(),
      licenseBackup: !!businessLicense,
      licenseFileName: businessLicenseName || '',
      status: 'active',
    };
    
    // 保存到localStorage模拟系统备份（实际应发送到后端）
    const existingRecords = JSON.parse(localStorage.getItem('contractRecords') || '[]');
    existingRecords.push(contractRecord);
    localStorage.setItem('contractRecords', JSON.stringify(existingRecords));
    
    setSigned(true);
    setLoading(false);
  };

  if (signed) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">电子合同签署成功！</h2>
            <p className="text-slate-500 mb-2">订单号：{orderId || 'ORD' + Date.now().toString().slice(-8)}</p>
            <p className="text-sm text-slate-400 mb-6">签署时间：{new Date().toLocaleString('zh-CN')}</p>

            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-green-700 mb-1">
                <strong>✓ 合同已生效</strong>
              </p>
              <p className="text-sm text-green-600">
                《CSDP-WAN 网络优化服务协议》已签署，服务将在支付完成后自动开通。
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/wallet')} className="btn-primary">
                前往支付
              </button>
              <button onClick={() => router.push('/workspace')} className="btn-secondary">
                进入工作台
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">CSDP-WAN 服务协议</h1>
          <p className="text-center text-sm text-slate-500 mb-8">
            甲方：{user?.realName || user?.phone || '（客户）'} &nbsp;&nbsp; 乙方：中新数据港（重庆）科技有限公司
          </p>

          <div className="prose prose-sm max-w-none text-slate-700 space-y-4 h-[60vh] overflow-y-auto pr-4 border border-slate-100 rounded-lg p-4 bg-slate-50/50">
            <p className="text-sm leading-relaxed">
              <strong>甲方</strong>（以下简称&quot;甲方&quot;）与<strong>中新数据港（重庆）科技有限公司</strong>（以下简称&quot;乙方&quot;）依据中华人民共和国有关法律之规定，本着诚实信用、互惠互利原则，就乙方为甲方所属之&quot;CSDP-WAN 云直连&quot;提供网络优化服务签订以下基本条款。
            </p>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">一、甲方业务及使用范围</h3>
              <p className="text-sm">1.1 甲方从事 {plan?.target || '跨境电商/独立站/SOHO'} 业务。</p>
              <p className="text-sm">1.2 甲方对上述业务及使用用途的真实性负责，如业务或使用用途有变更应按照本协议第五条约定及时通知乙方。</p>
              <p className="text-sm">1.3 本协议项下的服务禁止向任何第三方转售，仅可作为第1.1条所列的企业经营、办公用途使用，甲方对此知悉并自觉遵守执行。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">二、服务约定</h3>
              <p className="text-sm">2.1 按照《附件一》约定的内容执行。</p>
              <p className="text-sm">2.2 乙方为甲方提供的服务包括：{plan?.bandwidth || 10}M 带宽跨境网络通道、不限流量、{plan?.ipType || '共享/专属IP'}、自动配置、7×24技术监控。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">三、费用及支付</h3>
              <p className="text-sm">3.1 甲方就乙方所提供的服务向乙方支付详列于《附件一》的相关费用。</p>
              <p className="text-sm">3.2 乙方收到款项应按约定开具并邮寄相应增值税专用发票于甲方。</p>
              <p className="text-sm">3.3 乙方收款账户：</p>
              <div className="bg-white p-3 rounded border border-slate-200 text-sm space-y-1">
                <p>开户名称：中新数据港（重庆）科技有限公司</p>
                <p>开户银行：中国民生银行股份有限公司重庆解放碑支行</p>
                <p>开户账号：644200815</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">四、合同期限</h3>
              <p className="text-sm">4.1 本协议项下服务期限届满前，除非任何一方在本合同履行期限届满前30日书面通知另一方不再续签本合同或另签署新的《附件一》，否则本协议将继续顺延一年，顺延次数不限。</p>
              <p className="text-sm">4.2 在顺延情形下，如甲方超过一个月未支付相应费用，视为甲方不同意顺延，乙方终止合同，甲方应补交终止前的服务费用。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">五、甲方权利和义务</h3>
              <p className="text-sm">5.1 甲方应按附件一约定的付款方式向乙方支付设备押金（如有硬件设备）及服务费。甲方如未按时足额交纳服务费，且逾期付费超过一个月的，乙方有权选择暂停向甲方提供服务和/或终止本协议的执行，并继续追索甲方拖欠的全部费用的本金及其违约金。</p>
              <p className="text-sm">5.2 协议履行过程中，甲方应妥善保管硬件设备（如有）。协议履行完毕时，甲方向乙方归还设备，若设备无损坏情形，乙方返还设备押金。若设备有损坏情形，乙方可视实际损坏情况依据当时市场价格要求甲方支付相应费用或赔偿相应损失。</p>
              <p className="text-sm">5.3 甲方承诺不得利用本协议项下服务从事违反国家法律、法规和政策规定的活动，必须严格遵守附件二《网络信息安全承诺书》的全部内容，否则，乙方有权终止服务并要求甲方承担合同总金额10%的违约金赔偿责任。</p>
              <p className="text-sm">5.4 为配合国家监管部门监管要求，甲方同意应乙方要求不定期提供包括但不限于经营主体信息、经营资质、许可证明、产品介绍、审计报告等相关资料。上述材料均用于确保和向监管机关证明本协议项下双方行为及服务的合法性。</p>
              <p className="text-sm">5.5 甲方承诺不向任何第三方转售本协议项下服务，一经发现，乙方有权立即终止合同，并不承担任何违约责任。</p>
              <p className="text-sm">5.6 甲方如变更业务范围、使用用途，应当提前15个工作日以书面形式将变更后的相关信息同步至乙方，经乙方合理审查并同意后方可变更。若乙方发现甲方未按照约定用途使用本协议项下服务或变更业务范围未事先通知乙方，乙方有权终止协议，亦有权中止服务直至确认甲方的业务真实性或甲方整改后。</p>
              <p className="text-sm">5.7 甲方如变更企业名称、账户、通讯地址、联系人等相关信息，应提前15个工作日以书面形式将变更后的相关信息及时通知乙方，否则，应对因此造成的一切后果承担责任。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">六、乙方权利和义务</h3>
              <p className="text-sm">6.1 乙方负责对甲方接入的线路进行网络优化服务、日常维护、管理工作，并保证服务正常运作。</p>
              <p className="text-sm">6.2 乙方在对甲方起始计费日前，应完成提供本协议服务所需的所有软件、硬件、设备和通信基础设施的安装调试工作，并使之处于合格正常可使用的状态。需要甲方协助的，甲方应予配合。</p>
              <p className="text-sm">6.3 若因乙方设备故障而导致暂时无法为甲方提供正常服务，接到甲方通知后，乙方应于工作日4小时之内响应，节假日8小时之内响应，并尽快恢复网络通畅。</p>
              <p className="text-sm">6.4 乙方有权对甲方资质、业务（包括但不限于营业执照、组织机构代码证、特许经营许可、业务场景等）进行核实，如甲方资质在本协议存续期间过期或失效或乙方合理怀疑甲方业务违反附件二约定的，乙方有权终止服务并解除本协议。</p>
              <p className="text-sm">6.5 乙方应确保所提供网络优化服务质量的通畅性，若因乙方原因造成服务质量低于乙方承诺的，乙方给予甲方低于服务质量相应天数的服务期顺延。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">七、违约条款</h3>
              <p className="text-sm">7.1 甲乙双方任何一方不履行本协议项下的义务或者履行义务不符合本约定的，非违约方有权要求违约方继续履行相应的义务，要求违约方采取及时、合理的补救措施。违约方应按协议总金额的10%向守约方支付违约金，违约金不足以弥补因此给守约方造成的直接经济损失的，违约方应继续赔偿。</p>
              <p className="text-sm">7.2 任一方不得无故单方终止本协议，甲方无故提出单方终止协议的，乙方可要求甲方继续履行协议，若甲方确无业务需要继续使用本协议项下服务的，甲方应按照本条第1款约定向乙方支付违约金；乙方无故提出单方终止本协议的，甲方可要求乙方继续履行协议，若乙方已经不具备履行能力的，应按本条第1款约定向甲方支付违约金。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">八、保密条款</h3>
              <p className="text-sm">8.1 甲乙双方对彼此之间相互提供的信息、资料以及本协议的具体内容负有保密责任。甲方同意乙方将甲乙双方合作方式、项目类型及甲方联系人信息共享给乙方业务支持方。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">九、不可抗力与免责条款</h3>
              <p className="text-sm">9.1 不可抗力定义：指在本协议签署后发生的、本协议签署时不能预见的、其发生与后果是无法避免或克服的、妨碍任何一方全部或部分履约的所有事件。上述事件包括疫情、地震、台风、水灾、火灾、战争、国际或国内运输中断、流行病、罢工，以及根据中国法律或一般国际商业惯例认作不可抗力的其他事件。一方缺少资金不属于不可抗力事件。</p>
              <p className="text-sm">9.2 如果发生不可抗力事件，影响一方履行其在本协议项下的义务，则在不可抗力造成的延误期内中止履行，而不视为违约。</p>
              <p className="text-sm">9.3 双方明确乙方因以下所列情形而未能履行协议及由此产生的相关损失不承担责任：</p>
              <p className="text-sm pl-4">（1）由于不可抗力等因素导致乙方无法履行；</p>
              <p className="text-sm pl-4">（2）正常的网络扩容工程和电源割接工程导致的，或非乙方原因引发的供电和通电不稳定而造成的设备故障及损失；</p>
              <p className="text-sm pl-4">（3）因甲方自身的基础网络问题或基础网络运营商的骨干网络故障，及乙方难以避免、难以排除的技术或网络故障或第三方原因而造成甲方无法使用本协议服务的，不视为乙方违约，但乙方将尽力争取在最短时间内解决，对此双方无异议。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">十、附则</h3>
              <p className="text-sm">10.1 本协议自甲乙双方法定代表人或有权代表签字并加盖公章或合同章之日起生效，在协议生效期间，未经双方一致确认，双方都应遵守协议且不得无故单方终止。</p>
              <p className="text-sm">10.2 本协议未尽事宜按国家相关法律法规执行或由双方协商解决。若无法协商一致，可向原告方所在地人民法院进行起诉。</p>
              <p className="text-sm">10.3 本协议壹式肆份，甲方留存贰份，乙方留存贰份，每份均具有同等法律效力。</p>
              <p className="text-sm">10.4 本协议所有附件均作为协议不可分割的组成部分，与协议正文具有同等法律效力。</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">附件二：网络及信息安全承诺书</h3>
              <p className="text-sm">本单位与贵公司签订《CSDP-WAN服务协议》（&quot;合同&quot;），本单位在此郑重承诺遵守本承诺书，如有违反本承诺书有关条款的行为，本单位承担由此带来的一切民事、行政和刑事责任。</p>
              <p className="text-sm">1. 本单位承诺遵守《中华人民共和国网络安全法》《全国人民代表大会常务委员会关于加强网络信息保护的决定》《中华人民共和国电信条例》《中华人民共和国计算机信息系统安全保护条例》《计算机信息网络国际联网安全保护管理办法》《互联网信息服务管理办法》《电信和互联网用户个人信息保护规定》和《公共互联网网络安全突发事件应急预案》及有关法律、法规、规章和政策文件规定（&quot;相关规定&quot;）。</p>
              <p className="text-sm">2. 本单位承诺按照相关规定、政府主管部门要求以及合同约定规范使用业务，不得超出合同约定的范围和用途使用业务，具备所从事业务的全部合法必要的资质条件。</p>
              <p className="text-sm">3. 本单位承诺按照用户真实身份信息制度（&quot;实名制&quot;）的要求提供身份信息、使用业务，并保证所提供信息、资料的真实、完整、准确、有效。</p>
              <p className="text-sm">4. 本单位保证不利用网络、服务（包括但不限于固定网、移动网、互联网，下同）从事危害国家安全、泄露国家秘密等违法犯罪活动，不侵犯他人的合法权益。</p>
              <p className="text-sm">5. 本单位承诺严格按照国家相关法律法规做好本单位网络安全、信息安全管理工作，健全各项网络安全管理制度和落实各项安全保护技术措施，按政府主管部门要求设立信息安全责任人和信息安全审查员，当安全责任人发生变更时及时通知贵公司。否则，导致的一切后果由本单位承担，贵公司有权立即终止合同。</p>
              <p className="text-sm">6. 本单位承诺不将贵公司服务进行再次转租，否则，贵公司有权立即停止服务协议并回收接入设备。</p>
              <p className="text-sm">7. 本单位承诺配合贵公司为公安机关、国家安全机关等政府部门依法维护国家安全和侦查犯罪的活动提供协助，如实提供有关安全保护的信息、资料及数据文件，积极协助查处信息网络违法犯罪行为。</p>
            </div>

            <p className="text-sm text-center text-slate-500 pt-4">（以下无正文，为协议签署页）</p>
          </div>
        </div>

        {/* 签署区域 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="agree" className="text-sm text-slate-700 cursor-pointer">
              我已完整阅读并理解《CSDP-WAN 服务协议》及《网络及信息安全承诺书》的全部内容，确认提供的信息真实有效，承诺合法使用平台服务，同意遵守协议中的所有条款。
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSign}
              disabled={!agreed || loading}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '签署中...' : '确认签署电子合同'}
            </button>
            <Link href={`/order?plan=${planId}`} className="btn-secondary py-3 px-6">
              返回
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
