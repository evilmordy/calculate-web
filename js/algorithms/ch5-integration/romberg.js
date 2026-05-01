(function(){
class RombergAlgorithm extends window.Algorithm{
  constructor(){super({name:'Romberg 外推',description:'用 Romberg 求积算法计算定积分的更高精度近似值',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M6 16l2-4 2 6 2-8 2 4 2-6"/><line x1="7" y1="16" x2="17" y2="6"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入参数</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">被积函数 f(x) =</label><input type="text" class="form-input" id="rg-expr" placeholder="例如 4/(1+x^2)" style="font-family:'Courier New',monospace">
        <div class="form-hint">支持 <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>^</code> 及 <code>sin</code> <code>cos</code> <code>exp</code> <code>log</code> <code>sqrt</code> 等；常数 <code>pi</code>（π）、<code>e</code>（自然底数）</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">下限 a</label><input type="text" class="form-input" id="rg-a" placeholder="0"></div>
          <div class="form-group"><label class="form-label">上限 b</label><input type="text" class="form-input" id="rg-b" placeholder="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">精度 ε</label><input type="number" class="form-input" id="rg-tol" step="any" min="0" style="width:120px" placeholder="1e-8"></div>
          <div class="form-group"><label class="form-label">最大外推次数</label><input type="number" class="form-input" id="rg-max" min="1" max="10" step="1" style="width:120px" value="6"></div>
        </div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="rg-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="rg-error"></div>
      </div></div>
      <div class="algo-card" id="rg-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="rg-steps"></div></div></div>`
    document.getElementById('rg-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('rg-error');e.classList.remove('visible');e.textContent=''
    let expr=document.getElementById('rg-expr').value.trim();if(!expr){e.textContent='请输入被积函数';e.classList.add('visible');return}
    let a=parseFloat(document.getElementById('rg-a').value.trim()),b=parseFloat(document.getElementById('rg-b').value.trim())
    if(isNaN(a)||isNaN(b)){e.textContent='请输入有效的积分上下限';e.classList.add('visible');return}
    if(a>=b){e.textContent='必须 a < b';e.classList.add('visible');return}
    let tol=parseFloat(document.getElementById('rg-tol').value),max=parseInt(document.getElementById('rg-max').value,10)
    if(isNaN(tol)||tol<=0) tol=1e-8
    if(isNaN(max)||max<2) max=6

    let f
    try{let c=math.compile(expr);f=x=>c.evaluate({x})}catch(ex){e.textContent='函数解析失败: '+ex.message;e.classList.add('visible');return}
    this.solve(f,a,b,tol,max)
  }
  trap(f,a,b,n){
    let h=(b-a)/n,s=0
    for(let k=0;k<=n;k++){
      let xk=a+k*h,coef=(k===0||k===n)?0.5:1
      s+=coef*f(xk)
    }
    return h*s
  }
  solve(f,a,b,tol,max){
    let steps=[],F=f=>window.FracTools.roundTo(f,10)
    steps.push({type:'header',text:'一、逐次半分计算梯形值 T<sub>2<sup>k</sup></sub><sup>(0)</sup>'})
    let T=[]
    for(let k=0;k<max;k++){let n=Math.pow(2,k+1);T.push(this.trap(f,a,b,n))
    steps.push({type:'step',html:this.stepHTML(`T<sub>${n}</sub><sup>(0)</sup> = ${F(T[k])}`)})}

    steps.push({type:'header',text:'二、Romberg 外推矩阵'})
    let matrix=Array.from({length:max},()=>[])
    for(let k=0;k<max;k++)matrix[k]=[T[k]]

    let converged=false,bestIdx=0
    for(let j=1;j<max;j++){
      let pow4=Math.pow(4,j)
      for(let k=0;k<max-j;k++){
        matrix[k][j]=(pow4*matrix[k+1][j-1]-matrix[k][j-1])/(pow4-1)
      }
      let last=matrix[0][j],prev=matrix[0][j-1]
      if(j>=2&&Math.abs(last-prev)<tol){converged=true;bestIdx=j;break}
    }
    if(!converged)bestIdx=max-1

    let h='<table class="result-table"><thead><tr><th>k</th>'
    for(let j=0;j<=bestIdx;j++)h+=`<th>T<sup>(${j})</sup></th>`
    h+='</tr></thead><tbody>'
    for(let k=0;k<max-(converged?bestIdx:0);k++){
      if(k===0||matrix[k]&&matrix[k].length>0){
        h+='<tr>';h+=`<td>${Math.pow(2,k+1)}</td>`
        for(let j=0;j<=bestIdx&&j<matrix[k].length;j++)h+=`<td>${F(matrix[k][j])}</td>`
        if(bestIdx+1>matrix[k].length)for(let j=matrix[k].length;j<=bestIdx;j++)h+='<td></td>'
        h+='</tr>'
      }
    }
    h+='</tbody></table>'
    steps.push({type:'html',html:h})

    steps.push({type:'header',text:'三、外推公式'})
    steps.push({type:'step',html:this.stepHTML(`T<sub>m</sub><sup>(k)</sup> = (4<sup>k</sup>·T<sub>m+1</sub><sup>(k−1)</sup> − T<sub>m</sub><sup>(k−1)</sup>) / (4<sup>k</sup> − 1)`)})

    let result=matrix[0][bestIdx]
    steps.push({type:'result',text:`∫<sub>${a}</sub><sup>${b}</sup> f(x)dx ≈ ${F(result)} (外推 ${bestIdx} 次)`})
    this.showSteps(steps)
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('rg-result').style.display='block';let se=document.getElementById('rg-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html')se.innerHTML+=`<div class="step-item">${s.html}</div>`
      else if(s.type==='step')se.innerHTML+=s.html
      else if(s.type==='result'){let d=document.createElement('div');d.className='result-block';d.style.padding='12px 0';d.innerHTML=`<strong style="color:var(--primary);font-size:16px">${s.text}</strong>`;se.appendChild(d)}
    })
  }
}
window.RombergAlgorithm=RombergAlgorithm
})()
