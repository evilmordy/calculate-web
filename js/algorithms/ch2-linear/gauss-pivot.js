(function() {

class GaussPivotAlgorithm extends window.Algorithm {
  constructor() {
    super({
      name: '列主元消去法',
      description: '用列主元高斯消去法解线性方程组 Ax = b，同时计算系数矩阵的行列式',
      icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="6" y="8" width="4" height="4" rx="1"/><rect x="14" y="8" width="4" height="4" rx="1"/><rect x="6" y="16" width="4" height="4" rx="1"/><rect x="14" y="16" width="4" height="4" rx="1"/></svg>`,
    })
  }

  render(el) {
    super.render(el)
    el.innerHTML = `
      <div class="algo-card">
        <div class="algo-card-header">输入参数</div>
        <div class="algo-card-body">
          <div class="form-group">
            <label class="form-label">矩阵阶数 n</label>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <input type="number" class="form-input" id="gp-n" value="3" min="2" max="10" step="1" style="width:80px">
              <span class="form-hint" style="margin:0">支持整数/分数输入，如 <code>-2</code> <code>1/2</code></span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">增广矩阵 [A | b]</label>
            <div id="gp-grid"></div>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-primary" id="gp-calc-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              开始计算
            </button>
          </div>
          <div class="form-error" id="gp-error"></div>
        </div>
      </div>
      <div class="algo-card" id="gp-result" style="display:none">
        <div class="algo-card-header">计算过程与结果</div>
        <div class="algo-card-body">
          <div id="gp-steps"></div>
          <div id="gp-solution" style="margin-top:20px"></div>
          <div id="gp-det" style="margin-top:20px"></div>
        </div>
      </div>
    `
    this.generateGrid(3)
    document.getElementById('gp-n').addEventListener('change', (e) => {
      const n = parseInt(e.target.value, 10) || 3
      this.generateGrid(Math.min(Math.max(n, 2), 10))
    })
    document.getElementById('gp-calc-btn').addEventListener('click', () => this.start())
  }

  destroy() {
    super.destroy()
    this.timer = null
  }

  generateGrid(n) {
    const container = document.getElementById('gp-grid')
    container.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.className = 'matrix-display'
    const left = document.createElement('span')
    left.className = 'bracket left'
    left.textContent = '['
    wrapper.appendChild(left)
    const table = document.createElement('table')
    table.className = 'matrix-table input-mode'
    for (let i = 0; i < n; i++) {
      const tr = document.createElement('tr')
      for (let j = 0; j < n + 1; j++) {
        const td = document.createElement('td')
        const inp = document.createElement('input')
        inp.type = 'text'
        inp.className = 'matrix-input'
        inp.dataset.row = i
        inp.dataset.col = j
        inp.placeholder = j < n ? `a${i+1}${j+1}` : `b${i+1}`
        td.appendChild(inp)
        tr.appendChild(td)
        if (j === n - 1) {
          const sep = document.createElement('td')
          sep.className = 'sep'
          sep.textContent = '|'
          tr.appendChild(sep)
        }
      }
      table.appendChild(tr)
    }
    wrapper.appendChild(table)
    const right = document.createElement('span')
    right.className = 'bracket right'
    right.textContent = ']'
    wrapper.appendChild(right)
    container.appendChild(wrapper)
  }

  start() {
    const n = parseInt(document.getElementById('gp-n').value, 10)
    if (isNaN(n) || n < 2 || n > 10) {
      this.showError('阶数 n 必须在 2 到 10 之间')
      return
    }
    const errEl = document.getElementById('gp-error')
    errEl.classList.remove('visible')
    errEl.textContent = ''

    const parsed = this.readGrid(n)
    if (!parsed) return

    const { useFrac, matA, matB } = parsed
    this.solve(matA, matB, n, useFrac)
  }

  readGrid(n) {
    const inputs = document.querySelectorAll('#gp-grid .matrix-input')
    const matA = []
    const matB = []
    let useFrac = true
    let hasEmpty = false

    for (let i = 0; i < n; i++) {
      const rowA = []
      for (let j = 0; j < n; j++) {
        const inp = Array.from(inputs).find(el => parseInt(el.dataset.row) === i && parseInt(el.dataset.col) === j)
        const val = inp ? inp.value.trim() : ''
        if (val === '') { hasEmpty = true; continue }
        const parsed = window.FracTools.parseInput(val)
        if (!parsed) {
          this.showError(`第 ${i+1} 行第 ${j+1} 列输入无效: "${val}"`)
          return null
        }
        if (parsed.type === 'float') useFrac = false
        rowA.push(parsed)
      }
      const inpB = Array.from(inputs).find(el => parseInt(el.dataset.row) === i && parseInt(el.dataset.col) === n)
      const valB = inpB ? inpB.value.trim() : ''
      if (valB === '') { hasEmpty = true; continue }
      const parsedB = window.FracTools.parseInput(valB)
      if (!parsedB) {
        this.showError(`第 ${i+1} 行第 ${n+1} 列输入无效: "${valB}"`)
        return null
      }
      if (parsedB.type === 'float') useFrac = false
      matA.push(rowA)
      matB.push(parsedB)
    }

    if (hasEmpty) {
      this.showError('请填写所有输入框')
      return null
    }

    return { useFrac, matA, matB }
  }

  solve(matA, matB, n, useFrac) {
    const steps = []
    let finalDet = null

    if (useFrac) {
      try {
        const a = matA.map(row => row.map(p => p.value.clone()))
        const b = matB.map(p => p.value.clone())
        const result = this.solveFrac(a, b, n, steps)
        if (!result) return
        const { solution, det } = result
        finalDet = det
        this.renderResult(steps, solution.map(x => x.toString()), det, true)
      } catch (e) {
        this.showError('分数计算出错，尝试小数模式: ' + e.message)
        useFrac = false
      }
    }

    if (!useFrac) {
      const a = matA.map(row => row.map(p => p.type === 'frac' ? p.value.toFloat() : p.value))
      const b = matB.map(p => p.type === 'frac' ? p.value.toFloat() : p.value)
      const result = this.solveFloat(a, b, n, steps)
      if (!result) return
      const { solution, det } = result
      finalDet = det
      this.renderResult(steps, solution.map(x => window.FracTools.roundTo(x, 6).toString()), det, false)
    }
  }

  solveFrac(a, b, n, steps) {
    steps.push({ type: 'header', text: '一、前向消元（列主元高斯消去法）' })

    const mat = a.map(row => row.map(f => f.clone()))
    const rhs = b.map(f => f.clone())
    let swapCount = 0

    for (let k = 0; k < n - 1; k++) {
      let pivotRow = k
      for (let i = k + 1; i < n; i++) {
        if (window.FracTools.absGt(mat[i][k], mat[pivotRow][k])) {
          pivotRow = i
        }
      }

      if (mat[pivotRow][k].isZero()) {
        this.showError('矩阵奇异，无法继续求解')
        return null
      }

      if (pivotRow !== k) {
        const tmpRow = mat[k]
        mat[k] = mat[pivotRow]
        mat[pivotRow] = tmpRow
        const tmpRhs = rhs[k]
        rhs[k] = rhs[pivotRow]
        rhs[pivotRow] = tmpRhs
        swapCount++

        const dispMat = mat.map((row, ri) => row.map(f => f.clone()).concat(rhs[ri].clone()))
        steps.push({
          type: 'swap',
          desc: `<strong>第 ${k+1} 步 · 列选主元：</strong>第 ${k+1} 列最大元 |${window.FracTools.fmtI(mat[k][k].abs())}| 在行 ${pivotRow+1}，交换行 ${k+1} ↔ ${pivotRow+1}`,
          html: window.FracTools.fracMatHTML(dispMat),
        })
      }

      for (let i = k + 1; i < n; i++) {
        if (mat[i][k].isZero()) continue

        const factor = mat[i][k].div(mat[k][k])

        for (let j = k; j < n; j++) {
          mat[i][j] = mat[i][j].sub(factor.mul(mat[k][j]))
        }
        rhs[i] = rhs[i].sub(factor.mul(rhs[k]))

        const dispMat = mat.map((row, ri) => row.map(f => f.clone()).concat(rhs[ri].clone()))
        steps.push({
          type: 'elim',
          desc: `<strong>第 ${k+1} 步 · 消去 x<sub>${k+1}</sub>：</strong>R<sub>${i+1}</sub> = R<sub>${i+1}</sub> − (${window.FracTools.fmtI(factor)}) × R<sub>${k+1}</sub>`,
          html: window.FracTools.fracMatHTML(dispMat),
        })
      }
    }

    steps.push({ type: 'spacer' })
    steps.push({ type: 'header', text: '二、回代求解' })

    const solution = new Array(n)
    for (let i = n - 1; i >= 0; i--) {
      let sum = new window.Fraction(0, 1)
      let expr = ''
      for (let j = i + 1; j < n; j++) {
        const term = mat[i][j].mul(solution[j])
        sum = sum.add(term)
        if (j === i + 1) {
          expr = `${window.FracTools.fmtI(mat[i][j])}·${window.FracTools.fmtI(solution[j])}`
        } else {
          expr += ` + ${window.FracTools.fmtI(mat[i][j])}·${window.FracTools.fmtI(solution[j])}`
        }
      }
      let numerator = rhs[i].sub(sum)
      solution[i] = numerator.div(mat[i][i])

      steps.push({
        type: 'backsub',
        desc: `x<sub>${i+1}</sub> = (${window.FracTools.fmtI(rhs[i])} − ${expr || '0'}) / ${window.FracTools.fmtI(mat[i][i])} = ${window.FracTools.fmtI(solution[i])}`,
      })
    }

    steps.push({ type: 'spacer' })
    steps.push({ type: 'header', text: '三、行列式计算' })

    const diagValues = []
    let det = new window.Fraction(1, 1)
    for (let i = 0; i < n; i++) {
      diagValues.push(mat[i][i].clone())
      det = det.mul(mat[i][i])
    }
    if (swapCount % 2 === 1) det = det.neg()

    let detExpr = `det(A) = (−1)<sup>${swapCount}</sup>`
    for (let i = 0; i < n; i++) {
      detExpr += ` × (${window.FracTools.fmtI(diagValues[i])})`
    }
    detExpr += ` = ${window.FracTools.fmtI(det)}`

    steps.push({
      type: 'det',
      desc: detExpr,
    })

    return { solution, det }
  }

  solveFloat(a, b, n, steps) {
    steps.push({ type: 'header', text: '一、前向消元（列主元高斯消去法，小数模式）' })

    const mat = a.map(row => row.map(v => v))
    const rhs = b.map(v => v)
    let swapCount = 0

    for (let k = 0; k < n - 1; k++) {
      let pivotRow = k
      let maxVal = Math.abs(mat[k][k])
      for (let i = k + 1; i < n; i++) {
        if (Math.abs(mat[i][k]) > maxVal) {
          maxVal = Math.abs(mat[i][k])
          pivotRow = i
        }
      }

      if (Math.abs(mat[pivotRow][k]) < 1e-14) {
        this.showError('矩阵奇异，无法继续求解')
        return null
      }

      if (pivotRow !== k) {
        const tmpRow = mat[k]
        mat[k] = mat[pivotRow]
        mat[pivotRow] = tmpRow
        const tmpRhs = rhs[k]
        rhs[k] = rhs[pivotRow]
        rhs[pivotRow] = tmpRhs
        swapCount++

        const dispMat = mat.map((row, ri) => row.map(v => v).concat(rhs[ri]))
        steps.push({
          type: 'swap',
          desc: `<strong>第 ${k+1} 步 · 列选主元：</strong>第 ${k+1} 列最大元 |${window.FracTools.roundTo(mat[k][k], 4)}| 在行 ${pivotRow+1}，交换行 ${k+1} ↔ ${pivotRow+1}`,
          html: window.FracTools.floatMatHTML(dispMat),
        })
      }

      for (let i = k + 1; i < n; i++) {
        if (Math.abs(mat[i][k]) < 1e-14) continue

        const factor = mat[i][k] / mat[k][k]

        for (let j = k; j < n; j++) {
          mat[i][j] -= factor * mat[k][j]
        }
        rhs[i] -= factor * rhs[k]

        const dispMat = mat.map((row, ri) => row.map(v => v).concat(rhs[ri]))
        steps.push({
          type: 'elim',
          desc: `<strong>第 ${k+1} 步 · 消去 x<sub>${k+1}</sub>：</strong>R<sub>${i+1}</sub> = R<sub>${i+1}</sub> − ${window.FracTools.roundTo(factor, 4)} × R<sub>${k+1}</sub>`,
          html: window.FracTools.floatMatHTML(dispMat),
        })
      }
    }

    steps.push({ type: 'spacer' })
    steps.push({ type: 'header', text: '二、回代求解' })

    const solution = new Array(n)
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0
      let expr = ''
      for (let j = i + 1; j < n; j++) {
        sum += mat[i][j] * solution[j]
        if (j === i + 1) {
          expr = `${window.FracTools.roundTo(mat[i][j], 4)}·${window.FracTools.roundTo(solution[j], 4)}`
        } else {
          expr += ` + ${window.FracTools.roundTo(mat[i][j], 4)}·${window.FracTools.roundTo(solution[j], 4)}`
        }
      }
      solution[i] = (rhs[i] - sum) / mat[i][i]
      steps.push({
        type: 'backsub',
        desc: `x<sub>${i+1}</sub> = (${window.FracTools.roundTo(rhs[i], 4)} − ${expr || '0'}) / ${window.FracTools.roundTo(mat[i][i], 4)} = ${window.FracTools.roundTo(solution[i], 6)}`,
      })
    }

    steps.push({ type: 'spacer' })
    steps.push({ type: 'header', text: '三、行列式计算' })

    const diagValues = []
    let det = 1
    for (let i = 0; i < n; i++) {
      diagValues.push(mat[i][i])
      det *= mat[i][i]
    }
    if (swapCount % 2 === 1) det = -det
    det = window.FracTools.roundTo(det, 6)

    let detExpr = `det(A) = (−1)<sup>${swapCount}</sup>`
    for (let i = 0; i < n; i++) {
      detExpr += ` × ${window.FracTools.roundTo(diagValues[i], 4)}`
    }
    detExpr += ` = ${det}`

    steps.push({
      type: 'det',
      desc: detExpr,
    })

    return { solution, det }
  }

  renderResult(steps, solutionStr, det, isFrac) {
    const card = document.getElementById('gp-result')
    card.style.display = 'block'
    const stepsEl = document.getElementById('gp-steps')
    const solEl = document.getElementById('gp-solution')
    const detEl = document.getElementById('gp-det')

    stepsEl.innerHTML = ''
    steps.forEach(s => {
      if (s.type === 'spacer') {
        stepsEl.appendChild(document.createElement('hr'))
        return
      }
      const div = document.createElement('div')
      div.className = 'step-item'
      if (s.type === 'header') {
        div.className = 'step-header'
        div.innerHTML = s.text
      } else if (s.type === 'swap' || s.type === 'elim') {
        div.innerHTML = `<div class="step-desc">${s.desc}</div>${s.html}`
      } else if (s.type === 'backsub') {
        div.className = 'step-item backsub'
        div.innerHTML = `<span class="step-marker">◈</span> ${s.desc}`
      } else if (s.type === 'det') {
        div.className = 'step-item det'
        div.innerHTML = s.desc
      }
      stepsEl.appendChild(div)
    })

    let solHtml = '<div class="result-block"><strong>解向量：</strong>'
    solHtml += '<span class="solution-vector">x = ['
    solHtml += solutionStr.join(', ')
    solHtml += ']</span></div>'
    solEl.innerHTML = solHtml

    const lastStep = steps[steps.length - 1]
    detEl.innerHTML = `<div class="result-block"><strong>行列式：</strong><div class="det-display">${lastStep.desc}</div></div>`
  }

  showError(msg) {
    document.getElementById('gp-error').textContent = msg
    document.getElementById('gp-error').classList.add('visible')
    document.getElementById('gp-result').style.display = 'none'
  }
}

window.GaussPivotAlgorithm = GaussPivotAlgorithm

})()
