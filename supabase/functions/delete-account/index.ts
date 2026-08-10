// 删除账号 Edge Function（华为/苹果审核硬性要求：应用内可删除账号）
// 说明：
//   - 前端无法直接删除 auth 用户（需 service_role），此函数用 service role 执行
//   - 删除 auth.users 中的用户后，user_habits / user_checkins / user_pomodoro /
//     leaderboard 均通过 ON DELETE CASCADE 自动清除
//   - 调用方身份校验：仅允许用户删除自己的账号
//
// 部署（本地执行）：
//   supabase link --project-ref <项目ID>
//   supabase secrets set SERVICE_ROLE_KEY=<service_role/secret key>
//   supabase functions deploy delete-account

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// 新版 CLI 不允许 SUPABASE_ 前缀的自定义变量，用 SERVICE_ROLE_KEY
// （旧版自动注入的 SUPABASE_SERVICE_ROLE_KEY 同时兼容）
const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// 浏览器跨域必须显式处理 OPTIONS 预检并返回 CORS 头，否则浏览器端调用全部失败
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  // 浏览器预检请求：必须返回 200 + CORS 头（否则浏览器报 Failed to fetch）
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  // 1. 校验调用者身份（JWT）
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: '请先登录' }, 401);

  const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''));
  if (authErr || !user) return json({ error: '登录已过期，请重新登录后再试' }, 401);

  // 2. 仅允许删除自己的账号
  const { userId } = await req.json().catch(() => ({}));
  if (!userId || userId !== user.id) return json({ error: '参数错误' }, 400);

  // 3. 删除用户（业务数据级联清除）
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: '删除失败，请稍后重试' }, 500);

  return json({ ok: true });
});
