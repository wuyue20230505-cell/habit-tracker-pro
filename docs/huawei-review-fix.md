# 华为应用市场审核驳回修复记录

> 更新日期：2026-08-04

## 一、驳回问题 1 & 3：隐私政策提示缺失 / 页面展示异常 —— 已修复（代码）

### 问题 1：首次启动、注册登录界面未提示阅读隐私政策

**修复内容**：
- 新增 `src/components/PrivacyGate.tsx` —— 应用最外层门禁：
  - 首次启动强制弹出隐私政策同意弹窗（`PrivacyConsentModal`）
  - 未同意前**不初始化 Supabase、不渲染任何页面**（符合「未经明示同意不得收集信息」）
  - 同意后写入 `localStorage`（key: `habit-privacy-consent`，含版本号），之后不再弹窗
  - 隐私政策版本升级（`PRIVACY_VERSION` 常量变更）时要求用户重新同意
  - 「不同意」：Android 直接 `App.exitApp()` 退出；Web 显示拒绝提示页
- 新增 `src/components/PrivacyConsentModal.tsx` —— 弹窗支持摘要 ⇄ 全文切换，全文含儿童隐私、撤回同意等章节
- 新增 `src/components/PrivacyPolicyContent.tsx` —— 隐私政策单源组件（版本 1.1，2026-08-04），`/privacy` 页面复用
- 注册页新增「我已阅读并同意《隐私政策》」必选勾选，未勾选禁止注册
- 登录页、首页页脚新增《隐私政策》链接

**华为审核指南 7.5 参考**：https://developer.huawei.com/consumer/cn/doc/app/50104-07

### 问题 3：页面展示异常（背景图渲染成彩色条纹）

**根因**：背景图分辨率达亿级像素（`bg-habits.jpg` 12288×8192），Android WebView 解码内存超限（约 400MB），低配测试机解码失败渲染异常。

**修复内容**：
1. 全部 10 张背景图压缩至 2160px 宽（手机屏 2 倍超采样）+ JPEG 质量 88：**33MB → 3.8MB**，解码内存降至约 25MB
   - 原图备份：`C:\Users\wu\habit-images-backup\`
2. `index.html` 修复 preload 404：`bg-welcome.jpg` → `welcome-1.jpg`、`bg-stats.jpg` → `stats-1.jpg`
3. `dvh` 单位兼容：Android 7/8 WebView 不支持 `100dvh`，`index.css` 增加 `@supports not (height: 100dvh)` 回退到 `100vh`
4. `background-attachment: fixed` 在移动 WebView 渲染异常，触屏设备降级为 `scroll`

---

## 二、驳回问题 2：APP 备案 —— 需办理（运营手续，代码之外）

> 华为原文：APP 主体非境外主体且服务不在境外，但勾选了「APP服务器不在中国大陆」，不符合备案要求。
> 需按《工业和信息化部关于开展移动互联网应用程序备案工作的通知》履行备案手续。

### 当前矛盾

- 应用数据存于 **Supabase（新加坡）**、托管于 **Vercel（境外）**，主体为中国个人开发者
- 工信部要求：境内主体面向境内用户提供服务，须完成 **ICP 备案（域名）+ APP 备案**
- 华为后台「APP服务器不在中国大陆」选项须与事实一致，不能为了通过审核虚假勾选

### 备案办理流程（个人主体，约 2-4 周）

1. **准备域名**（如 `xxx.cn` 或 `xxx.com`，已在境内云服务商购买）
2. **选择接入服务商**（备案须通过境内接入商提交）：推荐腾讯云/阿里云/华为云
   - 需有一台境内服务器或云资源（轻量服务器即可，也可为备案购买云服务）
3. **提交 ICP 备案**：主体实名（身份证）+ 域名信息 + 服务内容，服务商初审 → 管局审核（约 1-2 周）
4. **办理 APP 备案**（工信部 2023 年 9 月新规）：
   - 通过同一接入商或工信部备案系统提交 APP 信息（应用名称、包名、icon、服务器位置等）
   - 个人主体：实名核验（人脸/短信）
5. **获取备案号**后填写至华为开发者后台 → 提交复审

### 配套工作：服务器迁移到国内（与备案同步推进）

备案通过后，数据存储位置需与备案信息一致。当前 Supabase（新加坡）不满足，需迁移：

**推荐方案（按成本排序）**：
| 方案 | 说明 | 成本 |
|------|------|------|
| 方案 B：国内 BaaS | uniCloud（阿里/腾讯）、腾讯云开发 CloudBase、LeanCloud 国内版，改动最小（换 SDK + 建表） | 低 |
| 方案 A：自建 | 腾讯云/阿里云轻量服务器 + PostgreSQL + 自建 Node API（重写 Supabase Auth/RLS，工作量最大） | 中 |
| 方案 C：保留 Supabase + 境内 CDN | 数据仍在境外，**不满足**存储位置要求，不推荐 | — |

**迁移步骤**（以方案 B 为例）：
1. 依据 `supabase/` 目录现有 migration SQL 在目标平台建表（habits / checkins / pomodoro / leaderboard 等）
2. 导出 Supabase 现有用户与数据，导入目标平台
3. 更换 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 为国内平台配置
4. 回归测试：注册、打卡、排行榜同步、云同步
5. **更新隐私政策第 3 条数据存储位置描述**（`src/components/PrivacyPolicyContent.tsx`），并递增 `PRIVACY_VERSION` 触发存量用户重新同意

### 华为后台操作清单

- [ ] 修正「APP服务器」相关勾选项（备案后按实际填写：境内接入 + 备案号）
- [ ] 填写 ICP/APP 备案号
- [ ] 上传包含本次全部修复的新 APK
- [ ] 隐私政策页面（`/privacy`）确认可访问

---

## 三、删除账号功能（华为/苹果审核硬性要求）

### 功能说明
- 入口：登录后 → 右上角头像（个人中心）→「删除账号」
- 二次确认：需输入「删除」二字确认，明确提示数据永久删除不可恢复
- 删除后：云端数据全部清除（auth 用户删除，`user_habits`/`user_checkins`/`user_pomodoro`/`leaderboard` 均 `ON DELETE CASCADE` 级联删除）+ 本地数据清除 + 退出登录

### 云端函数部署（必做，否则删除按钮会报错）

> 前端 JS 无法直接删除 auth 用户（需 service_role 密钥，不能暴露在浏览器），
> 通过 Supabase Edge Function 执行。**未部署时删除功能不可用，华为/苹果测试会失败。**

```bash
cd my-project
npx supabase login                        # 登录 Supabase 账号
npx supabase link --project-ref <项目ID>   # 项目ID：Supabase后台URL /project/<ID>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role密钥>
npx supabase functions deploy delete-account
```

- 函数代码：`supabase/functions/delete-account/index.ts`
- 密钥获取：Supabase 后台 → Project Settings → API → service_role（**切勿泄露到前端**）

## 四、验证记录

- 构建：`npm run build` 通过（tsc + vite）
- 端到端（Playwright，390×844 手机视口）9 项全部通过：
  首次启动弹窗 / 全文查看 / 不同意拒绝页 / 同意后进入 / 刷新不弹窗 / 注册页勾选展示 / 未勾选禁止注册 / 勾选生效 / 隐私政策链接跳转
