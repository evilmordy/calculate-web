(function(){
class SimpsonAlgorithm extends window.Algorithm{
  constructor(){super({name:'复合 Simpson 公式',description:'用复合 Simpson (1/3) 公式计算定积分 ∫<sub>a</sub><sup>b</sup> f(x)dx',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M5 17 Q9 7 17 5"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">被积函数 f(x) =</label><input type="text" class="form-input" id="sp-expr" placeholder="例如 4/(1+x^2)" style="font-family:'Courier New',monospace">
        <div class="form-hint">支持 <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code> 及 <code>sin</code> <code>cos</code> <code>exp</code> <code>log</code> <code>sqrt</code> 等；常数 <code>pi</code>（π）、<code>e</code>（自然底数）</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">下限 a</label><input type="text" class="form-input" id="sp-a" placeholder="0"></div>
          <div class="form-group"><label class="form-label">上限 b</label><input type="text" class="form-input" id="sp-b" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">等分数 n (偶数)</label><input type="number" class="form-input" id="sp-n" min="2" max="1000" step="2" style="width:120px" placeholder="4"></div>
        </div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="sp-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="sp-error"></div>
      </div></div>
      <div class="algo-card" id="sp-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="sp-steps"></div></div></div>`
    document.getElementById('sp-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('sp-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('sp-expr').value.trim();if(!expr){e.textContent='请输入被积函数';e.classList.add('visible');return}
    let a=parseFloat(document.getElementById('sp-a').value.trim()),b=parseFloat(document.getElementById('sp-b').value.trim()),n=parseInt(document.getElementById('sp-n').value,10)
    if(isNaN(a)||isNaN(b)){e.textContent='请输入有效的积分上下限';e.classList.add('visible');return}
    if(a>=b){e.textContent='必须 a < b';e.classList.add('visible');return}
    if(isNaN(n)||n<2||n%2!==0||n>1000){e.textContent='等分数 n 必须为 2~1000 之间的偶数';e.classList.add('visible');return}
    let f
    try{let c=math.compile(expr);f=x=>c.evaluate({x})}catch(ex){e.textContent='函数解析失败: '+ex.message;e.classList.add('visible');return}
    this.solve(f,a,b,n)
  }
  solve(f,a,b,n){
    let steps=[],F=f=>window.FracTools.roundTo(f,8),h=(b-a)/n
    steps.push({type:'header',text:`一、参数`})
    steps.push({type:'step',html:this.stepHTML(`步长 h = (b−a)/n = ${F(h)}`)})
    steps.push({type:'header',text:'二、节点值表'})
    let t='<table class="result-table"><thead><tr><th>k</th><th>x<sub>k</sub></th><th>f(x<sub>k</sub>)</th><th>系数 c<sub>k</sub></th><th>c<sub>k</sub>·f(x<sub>k</sub>)</th></tr></thead><tbody>'
    let s4=0,s2=0
    for(let k=0;k<=n;k++){
      let xk=a+k*h,fxk=f(xk),ck=(k===0||k===n)?1:(k%2===1?4:2)
      if(k%2===1&&k!==n)s4+=fxk;else if(k%2===0&&k!==0&&k!==n)s2+=fxk
      t+=`<tr><td>${k}</td><td>${F(xk)}</td><td>${F(fxk)}</td><td>${ck}</td><td>${F(ck*fxk)}</td></tr>`
    }
    t+='</tbody></table>';steps.push({type:'html',html:t})
    steps.push({type:'header',text:'三、Simpson 1/3 公式'})
    let fa=f(a),fb=f(b),result=h/3*(fa+4*s4+2*s2+fb)
    steps.push({type:'step',html:this.stepHTML(`S<sub>${n}</sub> = h/3 · [f(a) + 4Σf(奇) + 2Σf(偶) + f(b)]`)})
    steps.push({type:'step',html:this.stepHTML(`S<sub>${n}</sub> = ${F(h/3)} × [${F(fa)} + 4×${F(s4)} + 2×${F(s2)} + ${F(fb)}]`)})
    steps.push({type:'step',html:this.stepHTML(`S<sub>${n}</sub> = ${F(h/3)} × ${F(fa+4*s4+2*s2+fb)} = ${F(result)}`)})
    steps.push({type:'header',text:'四、误差估计'})
    steps.push({type:'step',html:this.stepHTML(`|E<sub>S</sub>| ≤ (b−a)⁵/(180n⁴) · max|f<sup>(4)</sup>(x)| ≈ ${F(Math.pow(b-a,5)/(180*Math.pow(n,4)))}`)})
    steps.push({type:'result',text:`∫<sub>${a}</sub><sup>${b}</sup> f(x)dx ≈ ${F(result)}`})
    this.showSteps(steps)
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('sp-result').style.display='block';let se=document.getElementById('sp-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html')se.innerHTML+=`<div class="step-item">${s.html}</div>`
      else if(s.type==='step')se.innerHTML+=s.html
      else if(s.type==='result'){let d=document.createElement('div');d.className='result-block';d.style.padding='12px 0';d.innerHTML=`<strong style="color:var(--primary);font-size:16px">${s.text}</strong>`;se.appendChild(d)}
    })
  }
}
window.SimpsonAlgorithm=SimpsonAlgorithm
})()
