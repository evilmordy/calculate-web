window.Algorithm = class Algorithm {
  constructor({ name, description, icon }) {
    this.name = name
    this.description = description
    this.icon = icon || ''
    this.el = null
  }

  render(el) {
    this.el = el
    this.el.innerHTML = ''
  }

  destroy() {
    this.el = null
  }
}
