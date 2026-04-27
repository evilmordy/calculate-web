(function() {

class BisectionAlgorithm extends window.Algorithm {
  constructor() {
    super({
      name: '二分法求根',
      description: '用二分法（Bisection Method）求方程 f(x) = 0 在区间 [a, b] 内的近似根',
      icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>`,
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
            <input type="text" class="form-input" id="f-expr" value="x^3 - x - 2" placeholder="例: x^3 - x - 2">
            <div class="form-hint">
              支持运算符: <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code>；
              函数: <code>sin(x)</code> <code>cos(x)</code> <code>exp(x)</code> <code>log(x)</code> <code>sqrt(x)</code> 等
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">误差 tolerance ε</label>
            <input type="number" class="form-input" id="tol" value="0.001" step="any" min="0" placeholder="如 0.001">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">区间左端点 a</label>
              <input type="number" class="form-input" id="a-val" value="1" step="any" placeholder="如 1">
            </div>
            <div class="form-group">
              <label class="form-label">区间右端点 b</label>
              <input type="number" class="form-input" id="b-val" value="2" step="any" placeholder="如 2">
            </div>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-primary" id="calc-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              开始计算
            </button>
          </div>
          <div class="form-error" id="form-error"></div>
        </div>
      </div>
      <div class="algo-card" id="result-card" style="display:none">
        <div class="algo-card-header">计算结果</div>
        <div class="algo-card-body">
          <div class="calc-status" id="calc-status" style="display:none">
            <div class="spinner"></div>
            <span>正在计算...</span>
          </div>
          <div class="table-wrapper" id="table-wrapper"></div>
          <div id="summary"></div>
        </div>
      </div>
    `

    document.getElementById('calc-btn').addEventListener('click', () => this.start())
    const inputs = ['f-expr', 'tol', 'a-val', 'b-val']
    inputs.forEach(id => {
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

    const expr = document.getElementById('f-expr').value.trim()
    const tol = parseFloat(document.getElementById('tol').value)
    let a = parseFloat(document.getElementById('a-val').value)
    let b = parseFloat(document.getElementById('b-val').value)
    const errEl = document.getElementById('form-error')

    errEl.classList.remove('visible')
    errEl.textContent = ''
    ;['f-expr', 'tol', 'a-val', 'b-val'].forEach(id =>
      document.getElementById(id).classList.remove('error')
    )

    if (!expr) {
      this.showError('请输入方程 f(x)')
      document.getElementById('f-expr').classList.add('error')
      return
    }
    if (isNaN(tol) || tol <= 0) {
      this.showError('请输入有效的正数误差值')
      document.getElementById('tol').classList.add('error')
      return
    }
    if (isNaN(a)) {
      this.showError('请输入有效的左端点 a')
      document.getElementById('a-val').classList.add('error')
      return
    }
    if (isNaN(b)) {
      this.showError('请输入有效的右端点 b')
      document.getElementById('b-val').classList.add('error')
      return
    }
    if (a >= b) {
      this.showError('必须满足 a < b')
      document.getElementById('a-val').classList.add('error')
      document.getElementById('b-val').classList.add('error')
      return
    }

    let f
    try {
      const compiled = math.compile(expr)
      f = x => compiled.evaluate({ x })
    } catch (e) {
      this.showError('方程解析失败，请检查表达式格式：' + e.message)
      document.getElementById('f-expr').classList.add('error')
      return
    }

    let fa, fb
    try {
      fa = f(a)
      fb = f(b)
    } catch (e) {
      this.showError('计算函数值时出错：' + e.message)
      return
    }

    if (!isFinite(fa) || !isFinite(fb)) {
      this.showError('区间端点函数值不是有限数，请检查区间')
      return
    }

    if (fa === 0) {
      this.showResult(`精确根 x = ${this.fmt(a)}（左端点即为根）`)
      return
    }
    if (fb === 0) {
      this.showResult(`精确根 x = ${this.fmt(b)}（右端点即为根）`)
      return
    }

    if (fa * fb > 0) {
      this.showError('f(a) 与 f(b) 同号，无法保证区间内有根，请更换区间')
      return
    }

    const steps = []
    const maxIter = 200
    let iter = 0
    let root = (a + b) / 2
    let lastWidth = (b - a) / 2

    while ((b - a) / 2 >= tol && iter < maxIter) {
      const x = (a + b) / 2
      let fx
      try {
        fx = f(x)
      } catch {
        this.showError('计算函数值时出错')
        return
      }
      if (!isFinite(fx)) {
        this.showError('函数值不是有限数，计算终止')
        return
      }
      steps.push({
        iter: iter + 1,
        a: +a.toFixed(10),
        b: +b.toFixed(10),
        x: +x.toFixed(10),
        fx: +fx.toFixed(10),
        width: +((b - a) / 2).toFixed(10),
      })

      if (fx === 0) {
        root = x
        lastWidth = (b - a) / 2
        break
      }
      if (f(a) * fx < 0) {
        b = x
      } else {
        a = x
      }
      root = (a + b) / 2
      lastWidth = (b - a) / 2
      iter++
    }

    if (iter >= maxIter) {
      this.showError('已达到最大迭代次数，可能不收敛')
      return
    }

    this.animateResults(steps, root, lastWidth)
  }

  animateResults(steps, root, finalWidth) {
    const card = document.getElementById('result-card')
    const wrapper = document.getElementById('table-wrapper')
    const status = document.getElementById('calc-status')
    card.style.display = 'block'
    wrapper.innerHTML = `
      <table class="result-table">
        <thead>
          <tr>
            <th>k</th>
            <th>a</th>
            <th>b</th>
            <th>x = (a+b)/2</th>
            <th>f(x)</th>
            <th>(b-a)/2</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    `
    status.style.display = 'flex'
    document.getElementById('summary').innerHTML = ''

    const tbody = document.getElementById('tbody')
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

        const summaryEl = document.getElementById('summary')
        summaryEl.innerHTML = `
          <div class="result-summary success">
            <strong>最终近似根</strong>：x ≈ ${this.fmt(root)}<br>
            <strong>迭代次数</strong>：${steps.length} 次<br>
            <strong>区间半宽 (b-a)/2</strong>：${this.fmt(finalWidth)}
          </div>
        `
        return
      }

      const s = steps[idx]
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${s.iter}</td>
        <td>${this.fmt(s.a)}</td>
        <td>${this.fmt(s.b)}</td>
        <td>${this.fmt(s.x)}</td>
        <td>${this.fmt(s.fx)}</td>
        <td>${this.fmt(s.width)}</td>
      `
      tbody.appendChild(row)
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      idx++
    }, 400)
  }

  showError(msg) {
    document.getElementById('form-error').textContent = msg
    document.getElementById('form-error').classList.add('visible')
    document.getElementById('result-card').style.display = 'none'
  }

  showResult(msg) {
    const card = document.getElementById('result-card')
    card.style.display = 'block'
    document.getElementById('table-wrapper').innerHTML = ''
    document.getElementById('summary').innerHTML = `
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

window.BisectionAlgorithm = BisectionAlgorithm

})()
