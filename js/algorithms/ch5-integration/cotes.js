(function(){
class CotesAlgorithm extends window.Algorithm{
  constructor(){super({name:'复合 Cotes 公式',description:'用复合柯特斯 (Newton-Cotes n=4) 公式计算定积分 ∫<sub>a</sub><sup>b</sup> f(x)dx',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M5 17 C7 9 13 5 19 5"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">被积函数 f(x) =</label><input type="text" class="form-input" id="ct-expr" placeholder="例如 4/(1+x^2)" style="font-family:'Courier New',monospace">
        <div class="form-hint">支持 <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code> 及 <code>sin</code> <code>cos</code> <code>exp</code> <code>log</code> <code>sqrt</code> 等；常数 <code>pi</code>（π）、<code>e</code>（自然底数）</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">下限 a</label><input type="text" class="form-input" id="ct-a" placeholder="0"></div>
          <div class="form-group"><label class="form-label">上限 b</label><input type="text" class="form-input" id="ct-b" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">等分数 n (4 的倍数)</label><input type="number" class="form-input" id="ct-n" min="4" max="1000" step="4" style="width:120px" placeholder="4"></div>
        </div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="ct-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="ct-error"></div>
      </div></div>
      <div class="algo-card" id="ct-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="ct-steps"></div></div></div>`
    document.getElementById('ct-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('ct-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('ct-expr').value.trim();if(!expr){e.textContent='请输入被积函数';e.classList.add('visible');return}
    let a=parseFloat(document.getElementById('ct-a').value.trim()),b=parseFloat(document.getElementById('ct-b').value.trim()),n=parseInt(document.getElementById('ct-n').value,10)
    if(isNaN(a)||isNaN(b)){e.textContent='请输入有效的积分上下限';e.classList.add('visible');return}
    if(a>=b){e.textContent='必须 a < b';e.classList.add('visible');return}
    if(isNaN(n)||n<4||n%4!==0||n>1000){e.textContent='等分数 n 必须为 4~1000 且为 4 的倍数';e.classList.add('visible');return}
    let f
    try{let c=math.compile(expr);f=x=>c.evaluate({x})}catch(ex){e.textContent='函数解析失败: '+ex.message;e.classList.add('visible');return}
    this.solve(f,a,b,n)
  }
  solve(f,a,b,n){
    let steps=[],F=f=>window.FracTools.roundTo(f,8),h=(b-a)/n
    steps.push({type:'header',text:`一、参数`})
    steps.push({type:'step',html:this.stepHTML(`步长 h = (b−a)/n = ${F(h)}`)})
    steps.push({type:'step',html:this.stepHTML(`节点数 n+1 = ${n+1}，共 ${n/4} 个柯特斯子区间`)})

    steps.push({type:'header',text:'二、节点值表'})
    let t='<table class="result-table"><thead><tr><th>k</th><th>x<sub>k</sub></th><th>f(x<sub>k</sub>)</th><th>系数 c<sub>k</sub></th><th>c<sub>k</sub>·f(x<sub>k</sub>)</th></tr></thead><tbody>'
    let S7=0,S14=0,S32=0,S12=0,sumV=0
    for(let k=0;k<=n;k++){
      let xk=a+k*h,fxk=f(xk),ck
      if(k===0||k===n)ck=7
      else if(k%4===0)ck=14
      else if(k%4===1||k%4===3)ck=32
      else ck=12
      sumV+=ck*fxk;t+=`<tr><td>${k}</td><td>${F(xk)}</td><td>${F(fxk)}</td><td>${ck}</td><td>${F(ck*fxk)}</td></tr>`
    }
    t+='</tbody></table>';steps.push({type:'html',html:t})

    steps.push({type:'header',text:'三、Cotes 公式'})
    let coeff=2*h/45
    steps.push({type:'step',html:this.stepHTML(`C<sub>${n}</sub> = 2h/45 · [7f<sub>0</sub> + 7f<sub>n</sub> + 14Σf(4i) + 32Σf(4i+1,4i+3) + 12Σf(4i+2)]`)})
    let result=coeff*sumV
    steps.push({type:'step',html:this.stepHTML(`C<sub>${n}</sub> = ${F(coeff)} × ${F(sumV)} = ${F(result)}`)})

    steps.push({type:'header',text:'四、误差估计'})
    steps.push({type:'step',html:this.stepHTML(`|E<sub>C</sub>| ≤ 2(b−a)⁷/(945n⁶) · max|f<sup>(6)</sup>(x)| ≈ ${F(2*Math.pow(b-a,7)/(945*Math.pow(n,6)))}`)})

    steps.push({type:'result',text:`∫<sub>${a}</sub><sup>${b}</sup> f(x)dx ≈ ${F(result)}`})
    this.showSteps(steps)
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('ct-result').style.display='block';let se=document.getElementById('ct-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html')se.innerHTML+=`<div class="step-item">${s.html}</div>`
      else if(s.type==='step')se.innerHTML+=s.html
      else if(s.type==='result'){let d=document.createElement('div');d.className='result-block';d.style.padding='12px 0';d.innerHTML=`<strong style="color:var(--primary);font-size:16px">${s.text}</strong>`;se.appendChild(d)}
    })
  }
}
window.CotesAlgorithm=CotesAlgorithm
})()
