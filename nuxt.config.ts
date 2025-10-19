// Nuxt 2 用の書き方（defineNuxtConfigは使わない）
export default {
  // TypeScript プロジェクトなら自動で拾われます
  // target や mode は既定のままでOK

  head: {
    title: 'nuxt-horse-memo',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    link: [
      // Bootstrap（見た目だけ使う）
      { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' },
    ],
  },

  modules: [
    '@nuxtjs/axios',            // ← Nuxt2 の axios モジュール
  ],

  // Nuxt2 では Lint は buildModules 側のことが多い
  buildModules: [
    // '@nuxt/typescript-build', // create-nuxt-appで既に入っていれば不要
    '@nuxt/typescript-build',     // Nuxt2 用の ESLint モジュール（@nuxt/eslint は Nuxt3 用）
  ],

  axios: {
    baseURL: 'http://localhost:3000',
  },
  serverMiddleware: [{ handler: '~/server/index.ts' }],
  // devtools: { enabled: true } や compatibilityDate は Nuxt3 専用。Nuxt2では削除
  plugins: [
    {src: '~/plugins/route-metrics.ts', mode: 'client'},
    {src: '~/plugins/view-logger.ts', mode: 'client'},
  ],
}
