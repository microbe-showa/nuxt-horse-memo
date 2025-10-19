// plugins/route-metrics.ts
import { Plugin } from '@nuxt/types'

declare global {
  interface Window { __navStart?: number }
}

const plugin: Plugin = ({ app }) => {
  // 念のため二重ガード
  if (process.client && typeof window !== 'undefined') {
    app.router?.beforeEach((_to, _from, next) => {
      window.__navStart = performance.now()
      next()
    })
  }
}

export default plugin
