// plugins/view-logger.ts
import Vue from 'vue'

type ViewLogPayload = {
  name: string
  elapsedMs: number
  path?: string
  extra?: Record<string, any>
}

declare module 'vue/types/vue' {
  interface Vue {
    $logView: (payload: ViewLogPayload) => Promise<void>
  }
}

Vue.prototype.$logView = async function (
  { name, elapsedMs, path, extra }: ViewLogPayload
): Promise<void> {
  try {
    await (this as any).$axios.$post('/api/logs/view', {
      name,
      elapsedMs,
      path: path ?? this.$route.fullPath,
      ts: Date.now(),
      extra: extra ?? null,
    })
  } catch {
    // 送信失敗は無視（画面に影響させない）
  }
}
