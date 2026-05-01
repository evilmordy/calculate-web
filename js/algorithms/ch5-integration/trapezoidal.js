(function(){
class TrapezoidalAlgorithm extends window.Algorithm{
  constructor(){super({name:'复合梯形公式',description:'用复合梯形公式计算定积分 ∫<sub>a</sub><sup>b</sup> f(x)dx',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M5 17l4-8 4 4 4-6"/><polygon points="5,17 9,9 13,13 17,7" fill="rgba(59,130,246,0.15)" stroke="none"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">被积函数 f(x) =</label><input type="text" class="form-input" id="tz-expr" placeholder="例如 4/(1+x^2)" style="font-family:'Courier New',monospace">
        <div class="form-hint">支持 <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code> 及 <code>sin</code> <code>cos</code> <code>exp</code> <code>log</code> <code>sqrt</code> 等；常数 <code>pi</code>（π）、<code>e</code>（自然底数）</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">下限 a</label><input type="text" class="form-input" id="tz-a" placeholder="0"></div>
          <div class="form-group"><label class="form-label">上限 b</label><input type="text" class="form-input" id="tz-b" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">等分数 n</label><input type="number" class="form-input" id="tz-n" min="1" max="1000" step="1" style="width:120px" placeholder="4"></div>
        </div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="tz-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="tz-error"></div>
      </div></div>
      <div class="algo-card" id="tz-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="tz-steps"></div></div></div>`
    document.getElementById('tz-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('tz-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('tz-expr').value.trim();if(!expr){e.textContent='请输入被积函数';e.classList.add('visible');return}
    let aS=document.getElementById('tz-a').value.trim(),bS=document.getElementById('tz-b').value.trim()
    let a=parseFloat(aS),b=parseFloat(bS),n=parseInt(document.getElementById('tz-n').value,10)
    if(isNaN(a)||isNaN(b)){e.textContent='请输入有效的积分上下限';e.classList.add('visible');return}
    if(a>=b){e.textContent='必须 a < b';e.classList.add('visible');return}
    if(isNaN(n)||n<1||n>1000){e.textContent='等分数 n 必须在 1~1000';e.classList.add('visible');return}

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

    let vals=[],sumV=0
    for(let k=0;k<=n;k++){
      let xk=a+k*h,fxk=f(xk),ck=(k===0||k===n)?0.5:1
      vals.push({xk,fxk,ck})
      sumV+=ck*fxk
      t+=`<tr><td>${k}</td><td>${F(xk)}</td><td>${F(fxk)}</td><td>${ck===1?'1':'½'}</td><td>${F(ck*fxk)}</td></tr>`
    }
    t+='</tbody></table>'
    steps.push({type:'html',html:t})

    steps.push({type:'header',text:'三、复合梯形公式'})
    steps.push({type:'step',html:this.stepHTML(`T<sub>${n}</sub> = h · [½f(a) + Σ<sub>k=1</sub><sup>n−1</sup>f(x<sub>k</sub>) + ½f(b)]`)})
    let result=h*sumV
    steps.push({type:'step',html:this.stepHTML(`T<sub>${n}</sub> = ${F(h)} × ${F(sumV)} = ${F(result)}`)})

    steps.push({type:'header',text:'四、误差估计'})
    steps.push({type:'step',html:this.stepHTML(`|E<sub>T</sub>| ≤ (b−a)³/(12n²) · max|f''(x)| ≈ ${F(Math.pow(b-a,3)/(12*n*n))}`)})

    steps.push({type:'result',text:`∫<sub>${a}</sub><sup>${b}</sup> f(x)dx ≈ ${F(result)}`})
    this.showSteps(steps)
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('tz-result').style.display='block';let se=document.getElementById('tz-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html')se.innerHTML+=`<div class="step-item">${s.html}</div>`
      else if(s.type==='step')se.innerHTML+=s.html
      else if(s.type==='result'){let d=document.createElement('div');d.className='result-block';d.style.padding='12px 0';d.innerHTML=`<strong style="color:var(--primary);font-size:16px">${s.text}</strong>`;se.appendChild(d)}
    })
  }
}
window.TrapezoidalAlgorithm=TrapezoidalAlgorithm
})()
