// 云同步/登录的网络错误统一转成用户能看懂的话。
// 背景：Supabase 在部分网络下会被 TLS 重置，supabase-js 会把原始
// "Failed to fetch" 直接抛给页面，用户看不懂还以为 app 坏了。
// 注意：离线打卡本身不依赖网络，这里只影响云功能。

const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
  /network request failed/i,
  /fetch failed/i,
  /err_connection/i,
  /err_name_not_resolved/i,
  /err_internet_disconnected/i,
  /timeout/i,
];

export function isNetworkError(message?: string | null): boolean {
  if (!message) return false;
  return NETWORK_PATTERNS.some((re) => re.test(message));
}

export function friendlyCloudError(message?: string | null): string {
  if (isNetworkError(message)) {
    return '暂时连不上云端服务器（网络不通或被拦截）。你仍可离线打卡，本地数据不会丢失；网络恢复后再登录即可同步。';
  }
  return message || '操作失败，请稍后重试';
}
