(function(){
class Rk4Algorithm extends window.Algorithm{
  constructor(){super({name:'四阶 Runge-Kutta',description:'用标准四阶 Runge-Kutta 法 (RK4) 求解 y\'=f(x,y), y(x₀)=y₀',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19l6-8 4 6 6-10"/><polygon points="6,10 10,10 10,16 6,16"/><polygon points="11,12 15,12 15,18 11,18"/><polygon points="16,8 20,8 20,14 16,14"/></svg>`});this.timer=null;this.aborted=false}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">微分方程 y\' = f(x, y) =</label><input type="text" class="form-input" id="rk-expr" placeholder="例如 x+y" style="font-family:'Courier New',monospace">
        <div class="form-hint">变量使用 <code>x</code> 和 <code>y</code></div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">x₀</label><input type="text" class="form-input" id="rk-x0" placeholder="0"></div>
          <div class="form-group"><label class="form-label">y₀ = y(x₀)</label><input type="text" class="form-input" id="rk-y0" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">步长 h</label><input type="text" class="form-input" id="rk-h" placeholder="0.1"></div>
          <div class="form-group"><label class="form-label">步数 N</label><input type="number" class="form-input" id="rk-N" min="1" max="100" step="1" style="width:120px" placeholder="5"></div>
        </div>
        <div class="form-group"><label class="form-label">精确解 y(x) = (可选)</label><input type="text" class="form-input" id="rk-exact" placeholder="留空跳过对比"></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="rk-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="rk-error"></div>
      </div></div>
      <div class="algo-card" id="rk-result" style="display:none"><div class="algo-card-header">计算结果</div><div class="algo-card-body">
        <div class="calc-status" id="rk-status" style="display:none"><div class="spinner"></div><span>正在计算...</span></div>
        <div class="table-wrapper" id="rk-table"></div><div id="rk-summary" style="margin-top:16px"></div>
      </div></div>`
    document.getElementById('rk-calc').addEventListener('click',()=>this.start())
  }
  destroy(){this.stop();super.destroy()}
  stop(){this.aborted=true;if(this.timer){clearInterval(this.timer);this.timer=null}}

  start(){
    this.stop();this.aborted=false
    let e=document.getElementById('rk-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('rk-expr').value.trim();if(!expr){e.textContent='请输入微分方程';e.classList.add('visible');return}
    let x0=parseFloat(document.getElementById('rk-x0').value.trim()),y0=parseFloat(document.getElementById('rk-y0').value.trim())
    let h=parseFloat(document.getElementById('rk-h').value.trim()),N=parseInt(document.getElementById('rk-N').value,10)
    if(isNaN(x0)||isNaN(y0)||isNaN(h)||h<=0||isNaN(N)||N<1||N>100){e.textContent='请检查输入参数';e.classList.add('visible');return}
    let f,exact=null
    try{let c=math.compile(expr);f=(x,y)=>c.evaluate({x,y})}catch(ex){e.textContent='方程解析失败: '+ex.message;e.classList.add('visible');return}
    let exactS=document.getElementById('rk-exact').value.trim()
    if(exactS){try{let ce=math.compile(exactS);exact=x=>ce.evaluate({x})}catch(ex){}}
    this.solve(f,x0,y0,h,N,exact)
  }
  solve(f,x0,y0,h,N,exact){
    let steps=[],x=x0,y=y0
    for(let k=0;k<N;k++){
      let k1=f(x,y),k2=f(x+h/2,y+h*k1/2),k3=f(x+h/2,y+h*k2/2),k4=f(x+h,y+h*k3)
      let yNext=y+h/6*(k1+2*k2+2*k3+k4),nx=x+h
      steps.push({k,x,y,k1,k2,k3,k4,yNext,ex:exact?exact(nx):null})
      x=nx;y=yNext
    }
    let cols=exact?['k','x<sub>k</sub>','y<sub>k</sub>','K<sub>1</sub>','K<sub>2</sub>','K<sub>3</sub>','K<sub>4</sub>','y<sub>k+1</sub>','y<sub>ex</sub>','|误差|']:['k','x<sub>k</sub>','y<sub>k</sub>','K<sub>1</sub>','K<sub>2</sub>','K<sub>3</sub>','K<sub>4</sub>','y<sub>k+1</sub>']
    this.animate(steps,cols,exact)
  }
  animate(steps,cols,exact){
    document.getElementById('rk-result').style.display='block'
    let ws=document.getElementById('rk-table'),st=document.getElementById('rk-status'),F=f=>window.FracTools.roundTo(f,6)
    ws.innerHTML=`<table class="result-table"><thead><tr>${cols.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody id="rk-tbody"></tbody></table>`
    st.style.display='flex';document.getElementById('rk-summary').innerHTML=''
    let tbody=document.getElementById('rk-tbody'),idx=0
    this.timer=setInterval(()=>{
      if(this.aborted){clearInterval(this.timer);this.timer=null;return}
      if(idx>=steps.length){clearInterval(this.timer);this.timer=null;st.style.display='none'
        let last=steps[steps.length-1]
        document.getElementById('rk-summary').innerHTML=`
          <div class="result-summary success"><strong>RK4 计算结果</strong><br>
          y<sub>${idx}</sub> = ${F(last.yNext)} (x = ${F(last.x+parseFloat(document.getElementById('rk-h').value))})</div>`;return}
      let s=steps[idx],row=document.createElement('tr')
      let cells=`<td>${s.k}</td><td>${F(s.x)}</td><td>${F(s.y)}</td><td>${F(s.k1)}</td><td>${F(s.k2)}</td><td>${F(s.k3)}</td><td>${F(s.k4)}</td><td>${F(s.yNext)}</td>`
      if(exact)cells+=`<td>${F(s.ex)}</td><td>${F(Math.abs(s.yNext-s.ex))}</td>`
      row.innerHTML=cells;tbody.appendChild(row);row.scrollIntoView({behavior:'smooth',block:'nearest'});idx++
    },400)
  }
}
window.Rk4Algorithm=Rk4Algorithm
})()
