// 轻量 toast —— 模块级事件发射器，不侵入 Context 树

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function showToast(msg: string) {
  listeners.forEach((f) => f(msg));
}

export function onToast(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
