(function(){
class EulerImprovedAlgorithm extends window.Algorithm{
  constructor(){super({name:'改进 Euler 法',description:'用改进欧拉公式（预报-校正）求解 y\'=f(x,y), y(x₀)=y₀',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19l6-8 4 6 6-10"/><line x1="9" y1="11" x2="13" y2="17" stroke-dasharray="2 2"/></svg>`});this.timer=null;this.aborted=false}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">微分方程 y\' = f(x, y) =</label><input type="text" class="form-input" id="ei-expr" placeholder="例如 x+y" style="font-family:'Courier New',monospace">
        <div class="form-hint">变量使用 <code>x</code> 和 <code>y</code></div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">x₀</label><input type="text" class="form-input" id="ei-x0" placeholder="0"></div>
          <div class="form-group"><label class="form-label">y₀ = y(x₀)</label><input type="text" class="form-input" id="ei-y0" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">步长 h</label><input type="text" class="form-input" id="ei-h" placeholder="0.1"></div>
          <div class="form-group"><label class="form-label">步数 N</label><input type="number" class="form-input" id="ei-N" min="1" max="100" step="1" style="width:120px" placeholder="10"></div>
        </div>
        <div class="form-group"><label class="form-label">精确解 y(x) = (可选)</label><input type="text" class="form-input" id="ei-exact" placeholder="留空跳过对比"></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="ei-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="ei-error"></div>
      </div></div>
      <div class="algo-card" id="ei-result" style="display:none"><div class="algo-card-header">计算结果</div><div class="algo-card-body">
        <div class="calc-status" id="ei-status" style="display:none"><div class="spinner"></div><span>正在计算...</span></div>
        <div class="table-wrapper" id="ei-table"></div><div id="ei-summary" style="margin-top:16px"></div>
      </div></div>`
    document.getElementById('ei-calc').addEventListener('click',()=>this.start())
  }
  destroy(){this.stop();super.destroy()}
  stop(){this.aborted=true;if(this.timer){clearInterval(this.timer);this.timer=null}}

  start(){
    this.stop();this.aborted=false
    let e=document.getElementById('ei-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('ei-expr').value.trim();if(!expr){e.textContent='请输入微分方程';e.classList.add('visible');return}
    let x0=parseFloat(document.getElementById('ei-x0').value.trim()),y0=parseFloat(document.getElementById('ei-y0').value.trim())
    let h=parseFloat(document.getElementById('ei-h').value.trim()),N=parseInt(document.getElementById('ei-N').value,10)
    if(isNaN(x0)||isNaN(y0)||isNaN(h)||h<=0||isNaN(N)||N<1||N>100){e.textContent='请检查输入参数';e.classList.add('visible');return}
    let f,exact=null
    try{let c=math.compile(expr);f=(x,y)=>c.evaluate({x,y})}catch(ex){e.textContent='方程解析失败: '+ex.message;e.classList.add('visible');return}
    let exactS=document.getElementById('ei-exact').value.trim()
    if(exactS){try{let ce=math.compile(exactS);exact=x=>ce.evaluate({x})}catch(ex){}}
    this.solve(f,x0,y0,h,N,exact)
  }
  solve(f,x0,y0,h,N,exact){
    let steps=[],x=x0,y=y0
    for(let k=0;k<N;k++){
      let fy=f(x,y),yp=y+h*fy,fyp=f(x+h,yp),yc=y+h/2*(fy+fyp),nx=x+h
      steps.push({k,x,y,fy,yp,fyp,yc,ex:exact?exact(nx):null})
      x=nx;y=yc
    }
    let cols=exact?['k','x<sub>k</sub>','y<sub>k</sub>','f(x<sub>k</sub>,y<sub>k</sub>)','y<sub>p</sub>(预报)','f(x<sub>k+1</sub>,y<sub>p</sub>)','y<sub>c</sub>(校正)','y<sub>ex</sub>','|误差|']:['k','x<sub>k</sub>','y<sub>k</sub>','f','y<sub>p</sub>','f(x<sub>k+1</sub>,y<sub>p</sub>)','y<sub>c</sub>']
    this.animate(steps,cols,exact)
  }
  animate(steps,cols,exact){
    document.getElementById('ei-result').style.display='block'
    let ws=document.getElementById('ei-table'),st=document.getElementById('ei-status'),F=f=>window.FracTools.roundTo(f,6)
    ws.innerHTML=`<table class="result-table"><thead><tr>${cols.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody id="ei-tbody"></tbody></table>`
    st.style.display='flex';document.getElementById('ei-summary').innerHTML=''
    let tbody=document.getElementById('ei-tbody'),idx=0
    this.timer=setInterval(()=>{
      if(this.aborted){clearInterval(this.timer);this.timer=null;return}
      if(idx>=steps.length){clearInterval(this.timer);this.timer=null;st.style.display='none'
        let last=steps[steps.length-1]
        document.getElementById('ei-summary').innerHTML=`
          <div class="result-summary success"><strong>改进 Euler 法计算结果</strong><br>
          y<sub>${idx}</sub> = ${F(last.yc)} (x = ${F(last.x+parseFloat(document.getElementById('ei-h').value))})</div>`;return}
      let s=steps[idx],row=document.createElement('tr')
      let cells=`<td>${s.k}</td><td>${F(s.x)}</td><td>${F(s.y)}</td><td>${F(s.fy)}</td><td>${F(s.yp)}</td><td>${F(s.fyp)}</td><td>${F(s.yc)}</td>`
      if(exact)cells+=`<td>${F(s.ex)}</td><td>${F(Math.abs(s.yc-s.ex))}</td>`
      row.innerHTML=cells;tbody.appendChild(row);row.scrollIntoView({behavior:'smooth',block:'nearest'});idx++
    },400)
  }
}
window.EulerImprovedAlgorithm=EulerImprovedAlgorithm
})()
