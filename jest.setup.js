// ★ import ではなく require を使う
const Vue = require('vue')

// Nuxt のプロダクション Tip を出さない
Vue.config.productionTip = false

// 必要であれば、グローバル登録しているものもここでモック
// 例: nuxt-link をダミー登録（警告を減らすため）
Vue.component('nuxt-link', {
  props: ['to'],
  render(h) {
    return h('a', { attrs: { href: this.to } }, this.$slots.default)
  },
})