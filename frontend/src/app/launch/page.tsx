import Link from "next/link";
import Countdown from "@/components/launch/Countdown";
import { LAUNCH_CONFIG, getRemainingSeats, getLaunchProgress } from "@/lib/launch";

export default function LaunchPage() {
  const remaining = getRemainingSeats();
  const progress = getLaunchProgress();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10 pixel-dots" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
              开园倒计时 · 首批 {LAUNCH_CONFIG.totalSeats} 席预约中
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              7 天后，让你的公司
              <span className="block text-accent-300">拥有第一支 AI 数字团队</span>
            </h1>

            <p className="text-lg md:text-xl text-brand-100 mb-10 leading-relaxed">
              无需海外账号、无需外币信用卡、无需合规烦恼。
              <br className="hidden md:block" />
              平台统一接入 GPT-5.4 / Claude / Kimi / DeepSeek，人民币结算，即开即用。
            </p>

            <div className="mb-10">
              <Countdown targetDate={LAUNCH_CONFIG.launchDate} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-accent-500 hover:bg-accent-600 text-white text-lg px-8 py-4 rounded-xl font-bold transition inline-flex items-center justify-center gap-2"
              >
                立即预约开园名额
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/pricing"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg px-8 py-4 rounded-xl font-medium transition inline-flex items-center justify-center"
              >
                查看完整定价
              </Link>
            </div>

            {/* 名额进度 */}
            <div className="mt-12 max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex justify-between text-sm mb-2">
                <span>已预约 {LAUNCH_CONFIG.reservedSeats} 席</span>
                <span>剩余 {remaining} 席</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-brand-100 mt-3">
                前 {LAUNCH_CONFIG.totalSeats} 名完成企业认证用户，额外赠送合规咨询 1 次
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">开园四大亮点</h2>
            <p className="text-slate-600">依托中新数据港基础设施，为创业者提供即开即用的 AI 生产能力</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LAUNCH_CONFIG.highlights.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">开园专属优惠</h2>
            <p className="text-slate-600">开园首月特价，限时 30 天</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LAUNCH_CONFIG.packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-6 border ${
                  pkg.popular
                    ? "border-brand-500 ring-2 ring-brand-500 bg-brand-50/30"
                    : "border-slate-200 bg-white"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                    开园推荐
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {pkg.tag}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">¥{pkg.launchPrice}</span>
                  <span className="text-slate-500">/{pkg.period}</span>
                  <span className="ml-2 text-sm text-slate-400 line-through">
                    ¥{pkg.originalPrice}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <svg className="w-5 h-5 text-accent-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-xl font-medium transition ${
                    pkg.popular
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {pkg.launchPrice <= 10 ? "免费体验" : "立即预约"}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              {LAUNCH_CONFIG.registrationBonus.description}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好让你的 AI 团队上线了吗？</h2>
          <p className="text-slate-300 mb-8">
            开园首月特惠，仅剩 {remaining} 席。预约不需要付费，开园后按套餐选择即可。
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white text-lg px-8 py-4 rounded-xl font-bold transition"
          >
            立即预约
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
