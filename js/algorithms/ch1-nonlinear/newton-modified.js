(function() {

class NewtonModifiedAlgorithm extends window.Algorithm {
  constructor() {
    super({
      name: '修正牛顿法(重根)',
      description: '用修正牛顿法求方程 f(x) = 0 的重根，迭代公式 x<sub>k+1</sub> = x<sub>k</sub> − m·f(x<sub>k</sub>)/f\'(x<sub>k</sub>)，m 为重根数',
      icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M6 14l3-5 3 4 3-6 3 8"/><text x="14" y="7" font-size="8" fill="currentColor" stroke="none" font-family="serif">m</text></svg>`,
    })
    this.timer = null
    this.aborted = false
  }

  render(el) {
    super.render(el)
    this.aborted = false
    el.innerHTML = `
      <div class="algo-card">
        <div class="algo-card-header">输入参数</div>
        <div class="algo-card-body">
          <div class="form-group">
            <label class="form-label">方程 f(x) =</label>
            <input type="text" class="form-input" id="mf-expr" value="(x-1)^2*(x+1)" placeholder="例: (x-1)^2*(x+1)">
            <div class="form-hint">
              修正迭代公式: x<sub>k+1</sub> = x<sub>k</sub> − m · f(x<sub>k</sub>) / f'(x<sub>k</sub>)，
              导数采用数值微分自动计算
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">重根数 m</label>
              <input type="number" class="form-input" id="mf-m" value="2" min="1" step="1" placeholder="如 2">
            </div>
            <div class="form-group">
              <label class="form-label">初始值 x₀</label>
              <input type="number" class="form-input" id="mf-x0" value="0.5" step="any" placeholder="如 0.5">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">误差 ε</label>
              <input type="number" class="form-input" id="mf-tol" value="0.0001" step="any" min="0" placeholder="如 0.0001">
            </div>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-primary" id="mf-calc-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              开始计算
            </button>
          </div>
          <div class="form-error" id="mf-error"></div>
        </div>
      </div>
      <div class="algo-card" id="mf-result" style="display:none">
        <div class="algo-card-header">计算结果</div>
        <div class="algo-card-body">
          <div class="calc-status" id="mf-status" style="display:none">
            <div class="spinner"></div>
            <span>正在计算...</span>
          </div>
          <div class="table-wrapper" id="mf-table"></div>
          <div id="mf-summary"></div>
        </div>
      </div>
    `

    document.getElementById('mf-calc-btn').addEventListener('click', () => this.start())
    ;['mf-expr', 'mf-m', 'mf-x0', 'mf-tol'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') this.start()
      })
    })
  }

  destroy() {
    this.stop()
    super.destroy()
  }

  stop() {
    this.aborted = true
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  start() {
    this.stop()
    this.aborted = false

    const expr = document.getElementById('mf-expr').value.trim()
    const m = parseInt(document.getElementById('mf-m').value, 10)
    const x0 = parseFloat(document.getElementById('mf-x0').value)
    const tol = parseFloat(document.getElementById('mf-tol').value)
    const errEl = document.getElementById('mf-error')

    errEl.classList.remove('visible')
    errEl.textContent = ''
    ;['mf-expr', 'mf-m', 'mf-x0', 'mf-tol'].forEach(id =>
      document.getElementById(id).classList.remove('error')
    )

    if (!expr) {
      this.showError('请输入方程 f(x)')
      document.getElementById('mf-expr').classList.add('error')
      return
    }
    if (isNaN(m) || m < 1 || !Number.isInteger(m)) {
      this.showError('重根数 m 必须为正整数')
      document.getElementById('mf-m').classList.add('error')
      return
    }
    if (isNaN(x0)) {
      this.showError('请输入有效的初始值 x₀')
      document.getElementById('mf-x0').classList.add('error')
      return
    }
    if (isNaN(tol) || tol <= 0) {
      this.showError('请输入有效的正数误差值')
      document.getElementById('mf-tol').classList.add('error')
      return
    }

    let f
    try {
      const compiled = math.compile(expr)
      f = x => compiled.evaluate({ x })
    } catch (e) {
      this.showError('方程解析失败: ' + e.message)
      document.getElementById('mf-expr').classList.add('error')
      return
    }

    const eps = x => 1e-8 * Math.max(1, Math.abs(x))
    const df = x => (f(x + eps(x)) - f(x - eps(x))) / (2 * eps(x))

    let fx0
    try { fx0 = f(x0) } catch (e) { this.showError('计算函数值出错: ' + e.message); return }
    if (!isFinite(fx0)) { this.showError('函数值不是有限数'); return }

    if (fx0 === 0) {
      this.showResult(`精确根 x = ${this.fmt(x0)}（初始值即为根）`)
      return
    }

    const steps = []
    const maxIter = 100
    let xk = x0

    for (let k = 0; k < maxIter; k++) {
      let fxk, dfxk
      try {
        fxk = f(xk)
        dfxk = df(xk)
      } catch (e) {
        this.showError('计算函数/导数时出错: ' + e.message)
        return
      }

      if (!isFinite(fxk) || !isFinite(dfxk)) {
        this.showError('函数值或导数值不是有限数')
        return
      }

      if (Math.abs(dfxk) < 1e-14) {
        this.showError(`导数值接近于零，迭代失败 (x${k} = ${this.fmt(xk)})`)
        return
      }

      const xk1 = xk - m * fxk / dfxk

      steps.push({
        k,
        xk: +xk.toFixed(10),
        fxk: +fxk.toFixed(10),
        dfxk: +dfxk.toFixed(10),
        xk1: +xk1.toFixed(10),
      })

      if (Math.abs(fxk) < tol || Math.abs(xk1 - xk) < tol) {
        this.animateResults(steps, xk, tol)
        return
      }

      xk = xk1
    }root

    this.showError(`已达到最大迭代次数 (${maxIter})，可能不收敛`)
  }

  animateResults(steps, root, tol) {
    const card = document.getElementById('mf-result')
    const wrapper = document.getElementById('mf-table')
    const status = document.getElementById('mf-status')
    card.style.display = 'block'
    wrapper.innerHTML = `
      <table class="result-table">
        <thead>
          <tr>
            <th>k</th>
            <th>x<sub>k</sub></th>
            <th>f(x<sub>k</sub>)</th>
            <th>f'(x<sub>k</sub>)</th>
            <th>x<sub>k+1</sub></th>
          </tr>
        </thead>
        <tbody id="mf-tbody"></tbody>
      </table>
    `
    status.style.display = 'flex'
    document.getElementById('mf-summary').innerHTML = ''

    const tbody = document.getElementById('mf-tbody')
    let idx = 0

    this.timer = setInterval(() => {
      if (this.aborted) {
        clearInterval(this.timer)
        this.timer = null
        return
      }

      if (idx >= steps.length) {
        clearInterval(this.timer)
        this.timer = null
        status.style.display = 'none'

        const last = steps[steps.length - 1]
        document.getElementById('mf-summary').innerHTML = `
          <div class="result-summary success">
            <strong>最终近似根</strong>：x ≈ ${this.fmt(root)}<br>
            <strong>迭代次数</strong>：${steps.length} 次<br>
            <strong>|f(根)|</strong>：${this.fmt(Math.abs(last.fxk))} &lt; ε = ${tol}
          </div>
        `
        return
      }

      const s = steps[idx]
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${s.k}</td>
        <td>${this.fmt(s.xk)}</td>
        <td>${this.fmt(s.fxk)}</td>
        <td>${this.fmt(s.dfxk)}</td>
        <td>${this.fmt(s.xk1)}</td>
      `
      tbody.appendChild(row)
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      idx++
    }, 400)
  }

  showError(msg) {
    document.getElementById('mf-error').textContent = msg
    document.getElementById('mf-error').classList.add('visible')
    document.getElementById('mf-result').style.display = 'none'
  }

  showResult(msg) {
    const card = document.getElementById('mf-result')
    card.style.display = 'block'
    document.getElementById('mf-table').innerHTML = ''
    document.getElementById('mf-summary').innerHTML = `
      <div class="result-summary success">${msg}</div>
    `
  }

  fmt(n) {
    if (n === 0) return '0'
    if (Math.abs(n) < 1e-10) return '0'
    const s = n.toFixed(8).replace(/\.?0+$/, '')
    return s.length > 12 ? n.toExponential(4) : s
  }
}

window.NewtonModifiedAlgorithm = NewtonModifiedAlgorithm

})()
