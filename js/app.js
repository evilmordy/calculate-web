const chapters = [
  {
    id: 'ch1', name: '非线性方程组求根',
    algorithms: {
      bisection:      new window.BisectionAlgorithm(),
      newton:         new window.NewtonAlgorithm(),
      newtonModified: new window.NewtonModifiedAlgorithm(),
      newtonImproved: new window.NewtonImprovedAlgorithm(),
    }
  },
  {
    id: 'ch2', name: '线性代数方程组',
    algorithms: {
      gaussPivot:  new window.GaussPivotAlgorithm(),
      luDecomp:    new window.LUDecompAlgorithm(),
      tridiagonal: new window.TridiagonalAlgorithm(),
      jacobi:      new window.JacobiAlgorithm(),
      gaussSeidel: new window.GaussSeidelAlgorithm(),
    }
  },
  {
    id: 'ch3', name: '插值',
    algorithms: {
      lagrange:      new window.LagrangeAlgorithm(),
      newtonInterp:  new window.NewtonInterpAlgorithm(),
      hermite:       new window.HermiteAlgorithm(),
    }
  },
  {
    id: 'ch4', name: '曲线拟合的最小二乘法',
    algorithms: {
      lsLinear:    new window.LSLinearAlgorithm(),
      lsPolynomial: new window.LSPolyAlgorithm(),
    }
  },
  {
    id: 'ch5', name: '数值积分和数值微分',
    algorithms: {
      trapezoidal: new window.TrapezoidalAlgorithm(),
      simpson:     new window.SimpsonAlgorithm(),
      cotes:       new window.CotesAlgorithm(),
      romberg:     new window.RombergAlgorithm(),
    }
  },
  {
    id: 'ch6', name: '常微分方程初值问题',
    algorithms: {
      euler:         new window.EulerAlgorithm(),
      eulerImproved: new window.EulerImprovedAlgorithm(),
      rk4:           new window.Rk4Algorithm(),
    }
  },
]

const algoMap = {}
chapters.forEach(ch => {
  for (const [id, algo] of Object.entries(ch.algorithms)) {
    algoMap[id] = { chapter: ch, algo }
  }
})

let currentAlgo = null

function renderSidebar() {
  const nav = document.getElementById('nav')
  let html = ''
  chapters.forEach((ch, idx) => {
    const hasAlgos = Object.keys(ch.algorithms).length > 0
    html += `<div class="chapter-header${hasAlgos ? '' : ' empty'}" data-chapter="${ch.id}">`
    html += `<span class="chapter-arrow">${hasAlgos ? '▸' : ''}</span>`
    html += `<span class="chapter-number">${idx + 1}.</span>`
    html += `<span class="chapter-name">${ch.name}</span>`
    html += '</div>'
    if (hasAlgos) {
      html += `<div class="chapter-algos" data-chapter="${ch.id}" style="display:none">`
      for (const [id, algo] of Object.entries(ch.algorithms)) {
        html += `<a class="nav-item" href="#${id}" data-id="${id}">${algo.icon}<span>${algo.name}</span></a>`
      }
      html += '</div>'
    }
  })
  nav.innerHTML = html

  document.querySelectorAll('.chapter-header').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.chapter
      const container = document.querySelector(`.chapter-algos[data-chapter="${id}"]`)
      if (!container) return
      const open = container.style.display === 'block'
      container.style.display = open ? 'none' : 'block'
      el.querySelector('.chapter-arrow').textContent = open ? '▸' : '▾'
    })
  })
}

function handleRoute() {
  const hash = location.hash.slice(1)
  const entry = algoMap[hash]
  const nav = document.getElementById('nav')

  if (!entry) {
    showWelcome()
    return
  }

  const { chapter, algo } = entry
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.id === hash))

  document.getElementById('algo-title').textContent = algo.name
  document.getElementById('algo-desc').textContent = algo.description

  if (currentAlgo && currentAlgo !== algo) currentAlgo.destroy()
  currentAlgo = algo
  algo.render(document.getElementById('content'))

  const container = nav.querySelector(`.chapter-algos[data-chapter="${chapter.id}"]`)
  if (container) {
    container.style.display = 'block'
    const header = nav.querySelector(`.chapter-header[data-chapter="${chapter.id}"]`)
    if (header) header.querySelector('.chapter-arrow').textContent = '▾'
  }
}

function showWelcome() {
  document.getElementById('content').innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
      </svg>
      <h3>请从左侧选择一个算法</h3>
      <p>选择算法后，即可进行交互式计算练习</p>
    </div>
  `
  document.getElementById('algo-title').textContent = '欢迎'
  document.getElementById('algo-desc').textContent = '请从左侧选择一个算法开始练习'
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'))
}

function init() {
  renderSidebar()
  handleRoute()
  window.addEventListener('hashchange', handleRoute)
}

document.addEventListener('DOMContentLoaded', init)
