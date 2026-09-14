// 隐私政策内容 —— 单源维护，供 PrivacyPage 与首次启动同意弹窗复用
// 注意：版本号变更(PRIVACY_VERSION)会触发所有用户重新同意(符合政策第7条)
export const PRIVACY_VERSION = '1.1';
export const PRIVACY_UPDATED = '2026年8月4日';

const SECTIONS: { title: string; items: (string | { strong: string; text: string })[] }[] = [
  {
    title: '1. 我们收集的信息',
    items: [
      { strong: '账号信息', text: '注册账号时，我们收集您的邮箱地址、昵称和头像（emoji 或图片）。' },
      { strong: '打卡数据', text: '您创建的习惯名称、emoji 图标、颜色标签、频率设置（日/周/月）、打卡日期和备注。' },
      { strong: '番茄钟数据', text: '专注时长记录、工作/休息时间设置、完成周期数。' },
      { strong: '设备信息', text: '本应用不收集设备标识符（如 IMEI、MAC 地址、Android ID）、位置信息或其他设备敏感数据。' },
    ],
  },
  {
    title: '2. 信息的使用',
    items: [
      { strong: '仅用于核心功能', text: '习惯打卡记录、数据统计图表、排行榜排名展示、番茄钟计时。' },
      { strong: '公开展示', text: '您的昵称和头像会在排行榜中公开展示给其他用户。' },
      { strong: '不用于商业', text: '我们不会将您的个人信息用于广告投放、用户画像分析、自动化决策或任何其他商业目的。' },
      { strong: '不分享', text: '我们不会将您的个人信息出售或分享给任何第三方。' },
    ],
  },
  {
    title: '3. 信息的存储与安全',
    items: [
      { strong: '云端存储', text: '数据存储在 Supabase 云服务器（新加坡区域），采用行业标准加密技术保护数据传输（TLS）和存储安全。' },
      { strong: '网页托管', text: '网页端托管于 Vercel 平台。' },
      { strong: '本地数据', text: '本地数据存储在您设备的浏览器 localStorage 中，仅限您本地访问。' },
    ],
  },
  {
    title: '4. 您的隐私权利',
    items: [
      { strong: '访问权', text: '您可随时在应用内查看您的所有个人数据和打卡记录。' },
      { strong: '修改权', text: '您可随时在应用内修改昵称、头像等个人资料。' },
      { strong: '删除权', text: '您可在应用内「个人中心」自行删除账号，所有云端数据将被永久删除，不可恢复。' },
      { strong: '数据导出', text: '可通过应用内「反馈」页面提交数据导出请求。' },
      { strong: '撤回同意', text: '您可随时通过删除账号撤回对隐私政策的同意。以上权利行使方式均为应用内自助操作，无需额外审批。' },
    ],
  },
  {
    title: '5. 第三方服务',
    items: [
      { strong: 'Supabase', text: '提供用户认证和数据存储后端服务。隐私政策：https://supabase.com/privacy' },
      { strong: 'Vercel', text: '提供网页托管服务。隐私政策：https://vercel.com/legal/privacy-policy' },
      { strong: '合规声明', text: '以上第三方服务均符合 GDPR 和行业安全标准。' },
    ],
  },
  {
    title: '6. 儿童隐私',
    items: [
      '本应用不面向 13 岁以下儿童。我们不会故意收集儿童的个人信息。如发现儿童信息被收集，请立即联系我们删除。',
    ],
  },
  {
    title: '7. 隐私政策更新',
    items: [
      '本隐私政策可能不时更新。更新后将在应用内以弹窗方式通知您。重大变更需要您重新同意。',
    ],
  },
  {
    title: '8. 联系我们',
    items: [
      { strong: '邮箱', text: '如有任何隐私相关问题、投诉或建议，请联系：515327096@qq.com。我们将在 15 个工作日内回复您的请求。' },
    ],
  },
];

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-stone-700">
      <p>
        打卡番茄钟（以下简称"本应用"）非常重视用户隐私。本隐私政策说明本应用如何收集、使用、存储和分享您的个人信息，以及您对这些信息所享有的权利。
      </p>
      {SECTIONS.map((s) => (
        <section key={s.title}>
          <h2 className="text-base font-bold text-stone-900 mb-2">{s.title}</h2>
          <ul className="list-disc pl-5 space-y-1">
            {s.items.map((it, i) =>
              typeof it === 'string' ? (
                <li key={i}>{it}</li>
              ) : (
                <li key={i}>
                  <strong className="text-stone-900">{it.strong}</strong>：{it.text}
                </li>
              )
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
