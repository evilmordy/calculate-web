(function() {

function makeMatrixGrid(containerId, rows, cols, phFn) {
  const c = document.getElementById(containerId)
  c.innerHTML = ''
  const w = document.createElement('div'); w.className = 'matrix-display'
  const l = document.createElement('span'); l.className = 'bracket left'; l.textContent = '['
  w.appendChild(l)
  const t = document.createElement('table'); t.className = 'matrix-table input-mode'
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr')
    for (let j = 0; j < cols; j++) {
      const td = document.createElement('td')
      const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'matrix-input'; inp.placeholder = phFn(i, j)
      td.appendChild(inp); tr.appendChild(td)
    }
    t.appendChild(tr)
  }
  w.appendChild(t)
  const r = document.createElement('span'); r.className = 'bracket right'; r.textContent = ']'
  w.appendChild(r); c.appendChild(w)
}

function readMatrixGrid(containerId, rows, cols) {
  const inp = document.getElementById(containerId).querySelectorAll('.matrix-input')
  const m = []; let idx = 0
  for (let i = 0; i < rows; i++) {
    const r = []
    for (let j = 0; j < cols; j++) {
      const v = parseFloat(inp[idx].value.trim()); if (isNaN(v)) return null
      r.push(v); idx++
    }
    m.push(r)
  }
  return m
}

function normInf(diff) {
  return Math.max(...diff.map(Math.abs))
}

class JacobiAlgorithm extends window.Algorithm {
  constructor() {
    super({
      name: 'Jacobi 迭代法',
      description: '用 Jacobi 迭代法求解线性方程组 Ax = b',
      icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="12" r="3"/><circle cx="16" cy="8" r="2"/><circle cx="16" cy="16" r="2"/><path d="M11 12l3-2M11 12l3 4" stroke-dasharray="2 2"/></svg>`,
    })
    this.timer = null; this.aborted = false
  }

  render(el) {
    super.render(el)
    el.innerHTML = `
      <div class="algo-card">
        <div class="algo-card-header">输入参数</div>
        <div class="algo-card-body">
          <div class="form-group">
            <label class="form-label">矩阵阶数 n</label>
            <input type="number" class="form-input" id="ja-n" value="3" min="2" max="10" step="1" style="width:80px">
          </div>
          <div class="form-group"><label class="form-label">矩阵 A</label><div id="ja-grid-a"></div></div>
          <div class="form-group"><label class="form-label">右端项 b</label><div id="ja-grid-b"></div></div>
          <div class="form-group"><label class="form-label">初始向量 x<sup>(0)</sup></label><div id="ja-grid-x0"></div></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">误差 ε</label><input type="number" class="form-input" id="ja-tol" value="0.0001" step="any" min="0" style="width:120px"></div>
            <div class="form-group"><label class="form-label">最大迭代次数</label><input type="number" class="form-input" id="ja-max" value="100" min="1" max="5000" step="1" style="width:120px"></div>
          </div>
          <div style="margin-top:8px"><button class="btn btn-primary" id="ja-calc-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
          <div class="form-error" id="ja-error"></div>
        </div>
      </div>
      <div class="algo-card" id="ja-result" style="display:none">
        <div class="algo-card-header">计算过程与结果</div>
        <div class="algo-card-body">
          <div class="calc-status" id="ja-status" style="display:none"><div class="spinner"></div><span>正在计算...</span></div>
          <div class="table-wrapper" id="ja-table"></div>
          <div id="ja-summary" style="margin-top:16px"></div>
        </div>
      </div>
    `
    this.generate(3)
    document.getElementById('ja-n').addEventListener('change', e => this.generate(Math.min(Math.max(parseInt(e.target.value, 10) || 3, 2), 10)))
    document.getElementById('ja-calc-btn').addEventListener('click', () => this.start())
  }

  generate(n) {
    makeMatrixGrid('ja-grid-a', n, n, (i, j) => `a${i+1}${j+1}`)
    makeMatrixGrid('ja-grid-b', n, 1, i => `b${i+1}`)
    makeMatrixGrid('ja-grid-x0', n, 1, () => '0')
  }

  destroy() { this.stop(); super.destroy() }
  stop() { this.aborted = true; if (this.timer) { clearInterval(this.timer); this.timer = null } }

  start() {
    this.stop(); this.aborted = false
    const n = parseInt(document.getElementById('ja-n').value, 10)
    if (isNaN(n) || n < 2 || n > 10) { this.showError('阶数 n 必须在 2~10'); return }
    const tol = parseFloat(document.getElementById('ja-tol').value)
    const maxIter = parseInt(document.getElementById('ja-max').value, 10)
    if (isNaN(tol) || tol <= 0) { this.showError('请输入有效的误差'); return }
    if (isNaN(maxIter) || maxIter < 1) { this.showError('请输入有效的最大迭代次数'); return }

    const A = readMatrixGrid('ja-grid-a', n, n)
    const b = readMatrixGrid('ja-grid-b', n, 1)
    const x0 = readMatrixGrid('ja-grid-x0', n, 1)
    if (!A || !b || !x0) { this.showError('请填写所有输入框'); return }

    const bb = b.map(r => r[0])
    const xx0 = x0.map(r => r[0])

    for (let i = 0; i < n; i++) {
      if (Math.abs(A[i][i]) < 1e-14) { this.showError(`对角线元素 A[${i+1}][${i+1}] 为零`); return }
    }

    this.iterate(A, bb, xx0, n, tol, maxIter)
  }

  iterate(A, b, x0, n, tol, maxIter) {
    const steps = []
    let x = [...x0]
    let converged = false

    for (let k = 0; k < maxIter; k++) {
      const xNew = new Array(n)
      for (let i = 0; i < n; i++) {
        let s = 0
        for (let j = 0; j < n; j++) if (j !== i) s += A[i][j] * x[j]
        xNew[i] = (b[i] - s) / A[i][i]
      }

      const diff = xNew.map((v, i) => Math.abs(v - x[i]))
      const err = normInf(diff)

      steps.push({ k: k + 1, x: [...xNew], err })

      if (err < tol) { converged = true; x = xNew; break }
      x = xNew
    }

    if (!converged) { this.showError(`迭代 ${maxIter} 次未收敛`); return }
    this.animate(steps, x, tol)
  }

  animate(steps, x, tol) {
    document.getElementById('ja-result').style.display = 'block'
    const wrapper = document.getElementById('ja-table')
    const status = document.getElementById('ja-status')

    let cols = '<th>k</th>'
    for (let i = 0; i < x.length; i++) cols += `<th>x<sub>${i+1}</sub></th>`
    cols += '<th>||Δx||<sub>∞</sub></th>'

    wrapper.innerHTML = `<table class="result-table"><thead><tr>${cols}</tr></thead><tbody id="ja-tbody"></tbody></table>`
    status.style.display = 'flex'
    document.getElementById('ja-summary').innerHTML = ''

    const tbody = document.getElementById('ja-tbody'); let idx = 0
    this.timer = setInterval(() => {
      if (this.aborted) { clearInterval(this.timer); this.timer = null; return }
      if (idx >= steps.length) {
        clearInterval(this.timer); this.timer = null; status.style.display = 'none'
        document.getElementById('ja-summary').innerHTML = `
          <div class="result-summary success"><strong>解向量：</strong><span class="solution-vector">x = [${steps[steps.length-1].x.map(v => v.toFixed(6)).join(', ')}]</span><br>
          <strong>迭代次数：</strong>${steps.length} 次 &nbsp;|&nbsp; <strong>最终误差：</strong>${steps[steps.length-1].err.toExponential(4)}</div>`
        return
      }
      const s = steps[idx]; const row = document.createElement('tr')
      row.innerHTML = `<td>${s.k}</td>${s.x.map(v => `<td>${v.toFixed(6)}</td>`).join('')}<td>${s.err.toExponential(4)}</td>`
      tbody.appendChild(row); row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); idx++
    }, 400)
  }

  showError(msg) {
    document.getElementById('ja-error').textContent = msg; document.getElementById('ja-error').classList.add('visible')
    document.getElementById('ja-result').style.display = 'none'
  }
}

window.JacobiAlgorithm = JacobiAlgorithm

})()
