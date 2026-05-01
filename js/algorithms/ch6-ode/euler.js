(function(){
class EulerAlgorithm extends window.Algorithm{
  constructor(){super({name:'Euler 法',description:'用欧拉公式求解一阶常微分方程初值问题 y\'=f(x,y), y(x₀)=y₀',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19l6-8 4 6 6-10"/><polyline points="3,19 5.5,19 5.5,11 9,11 9,17 13,17 13,7 19,7"/></svg>`});this.timer=null;this.aborted=false}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">微分方程 y\' = f(x, y) =</label><input type="text" class="form-input" id="eu-expr" placeholder="例如 x+y" style="font-family:'Courier New',monospace">
        <div class="form-hint">变量使用 <code>x</code> 和 <code>y</code>。支持 <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code> <code>sin</code> <code>cos</code> <code>exp</code> 等；常数 <code>pi</code>（π）、<code>e</code>（自然底数）</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">x₀</label><input type="text" class="form-input" id="eu-x0" placeholder="0"></div>
          <div class="form-group"><label class="form-label">y₀ = y(x₀)</label><input type="text" class="form-input" id="eu-y0" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">步长 h</label><input type="text" class="form-input" id="eu-h" placeholder="0.1"></div>
          <div class="form-group"><label class="form-label">步数 N</label><input type="number" class="form-input" id="eu-N" min="1" max="100" step="1" style="width:120px" placeholder="10"></div>
        </div>
        <div class="form-group"><label class="form-label">精确解 y(x) = (可选)</label><input type="text" class="form-input" id="eu-exact" placeholder="例如 exp(x) (留空则跳过对比)"></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="eu-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="eu-error"></div>
      </div></div>
      <div class="algo-card" id="eu-result" style="display:none"><div class="algo-card-header">计算结果</div><div class="algo-card-body">
        <div class="calc-status" id="eu-status" style="display:none"><div class="spinner"></div><span>正在计算...</span></div>
        <div class="table-wrapper" id="eu-table"></div><div id="eu-summary" style="margin-top:16px"></div>
      </div></div>`
    document.getElementById('eu-calc').addEventListener('click',()=>this.start())
  }
  destroy(){this.stop();super.destroy()}
  stop(){this.aborted=true;if(this.timer){clearInterval(this.timer);this.timer=null}}

  start(){
    this.stop();this.aborted=false
    let e=document.getElementById('eu-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('eu-expr').value.trim();if(!expr){e.textContent='请输入微分方程';e.classList.add('visible');return}
    let x0=parseFloat(document.getElementById('eu-x0').value.trim()),y0=parseFloat(document.getElementById('eu-y0').value.trim())
    let h=parseFloat(document.getElementById('eu-h').value.trim()),N=parseInt(document.getElementById('eu-N').value,10)
    if(isNaN(x0)||isNaN(y0)||isNaN(h)||h<=0||isNaN(N)||N<1||N>100){e.textContent='请检查输入参数';e.classList.add('visible');return}
    let f,exact=null
    try{let c=math.compile(expr);f=(x,y)=>c.evaluate({x,y})}catch(ex){e.textContent='方程解析失败: '+ex.message;e.classList.add('visible');return}
    let exactS=document.getElementById('eu-exact').value.trim()
    if(exactS){try{let ce=math.compile(exactS);exact=x=>ce.evaluate({x})}catch(ex){}}
    this.solve(f,x0,y0,h,N,exact)
  }
  solve(f,x0,y0,h,N,exact){
    let steps=[],x=x0,y=y0
    for(let k=0;k<N;k++){
      let fy=f(x,y),nY=y+h*fy
      steps.push({k,x,y,fy,nY,ex:exact?exact(x+h):null})
      x+=h;y=nY
    }
    let names=exact?['k','x<sub>k</sub>','y<sub>k</sub>','f(x<sub>k</sub>,y<sub>k</sub>)','y<sub>k+1</sub>','y<sub>exact</sub>','|误差|']:['k','x<sub>k</sub>','y<sub>k</sub>','f(x<sub>k</sub>,y<sub>k</sub>)','y<sub>k+1</sub>']
    this.animate(steps,names,exact)
  }
  animate(steps,names,exact){
    document.getElementById('eu-result').style.display='block'
    let ws=document.getElementById('eu-table'),st=document.getElementById('eu-status'),F=f=>window.FracTools.roundTo(f,6)
    let cols=names.map(n=>`<th>${n}</th>`).join('')
    ws.innerHTML=`<table class="result-table"><thead><tr>${cols}</tr></thead><tbody id="eu-tbody"></tbody></table>`
    st.style.display='flex';document.getElementById('eu-summary').innerHTML=''
    let tbody=document.getElementById('eu-tbody'),idx=0
    this.timer=setInterval(()=>{
      if(this.aborted){clearInterval(this.timer);this.timer=null;return}
      if(idx>=steps.length){clearInterval(this.timer);this.timer=null;st.style.display='none'
        let last=steps[steps.length-1]
        document.getElementById('eu-summary').innerHTML=`
          <div class="result-summary success"><strong>Euler 法计算结果</strong><br>
          y<sub>${idx}</sub> = ${F(last.nY)} (x = ${F(last.x+parseFloat(document.getElementById('eu-h').value))})<br>
          <strong>步数:</strong> ${steps.length} | <strong>步长:</strong> ${document.getElementById('eu-h').value}</div>`;return}
      let s=steps[idx],row=document.createElement('tr')
      let cells=`<td>${s.k}</td><td>${F(s.x)}</td><td>${F(s.y)}</td><td>${F(s.fy)}</td><td>${F(s.nY)}</td>`
      if(exact)cells+=`<td>${F(s.ex)}</td><td>${F(Math.abs(s.nY-s.ex))}</td>`
      row.innerHTML=cells;tbody.appendChild(row);row.scrollIntoView({behavior:'smooth',block:'nearest'});idx++
    },400)
  }
}
window.EulerAlgorithm=EulerAlgorithm
})()
