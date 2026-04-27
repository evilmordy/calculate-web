(function() {

function makeRowInputs(id,n,ph){
  let c=document.getElementById(id);c.innerHTML=''
  let d=document.createElement('div');d.style.display='flex';d.style.gap='6px';d.style.flexWrap='wrap'
  for(let i=0;i<n;i++){let inp=document.createElement('input');inp.type='text';inp.className='matrix-input';inp.style.width='60px';inp.placeholder=ph(i);d.appendChild(inp)}
  c.appendChild(d)}

function readRow(id,n){
  let inp=document.getElementById(id).querySelectorAll('input');let r=[]
  for(let i=0;i<n;i++){let v=parseFloat(inp[i].value.trim());if(isNaN(v))return null;r.push(v)}
  return r}

function parseRowFrac(id,n){
  let inp=document.getElementById(id).querySelectorAll('input');let r=[],allFrac=true
  for(let i=0;i<n;i++){
    let v=inp[i].value.trim();if(!v)return null
    let p=window.FracTools.parseInput(v);if(!p)return null
    if(p.type==='float')allFrac=false
    r.push(p)}
  return {vals:r,allFrac:allFrac}}

class TridiagonalAlgorithm extends window.Algorithm{
  constructor(){
    super({
      name:'追赶法(三对角)',
      description:'用追赶法 (Thomas Algorithm) 求解三对角线性方程组',
      icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16"/><path d="M6 12h12"/><path d="M4 18h16"/><path d="M8 6v12" stroke-dasharray="2 2"/><path d="M16 6v12" stroke-dasharray="2 2"/></svg>`,
    })
  }

  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card">
        <div class="algo-card-header">输入参数</div>
        <div class="algo-card-body">
          <div class="form-group">
            <label class="form-label">矩阵阶数 n</label>
            <input type="number" class="form-input" id="tri-n" value="4" min="2" max="10" step="1" style="width:80px">
          </div>
          <div class="form-group" id="tri-a-group" style="display:none"><label class="form-label">下对角线 a<sub>i</sub>（共 n−1 个）</label><div id="tri-a"></div></div>
          <div class="form-group" id="tri-b-group" style="display:none"><label class="form-label">主对角线 b<sub>i</sub>（共 n 个）</label><div id="tri-b"></div></div>
          <div class="form-group" id="tri-c-group" style="display:none"><label class="form-label">上对角线 c<sub>i</sub>（共 n−1 个）</label><div id="tri-c"></div></div>
          <div class="form-group" id="tri-d-group" style="display:none"><label class="form-label">右端项 d<sub>i</sub>（共 n 个）</label><div id="tri-d"></div></div>
          <div style="margin-top:8px"><button class="btn btn-primary" id="tri-calc-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
          <div class="form-error" id="tri-error"></div>
        </div>
      </div>
      <div class="algo-card" id="tri-result" style="display:none">
        <div class="algo-card-header">计算过程与结果</div>
        <div class="algo-card-body">
          <div id="tri-steps"></div>
          <div id="tri-solution" style="margin-top:20px"></div>
        </div>
      </div>`
    let gen=n=>{
      makeRowInputs('tri-a',n-1,i=>`a${i+2}`)
      makeRowInputs('tri-b',n,i=>`b${i+1}`)
      makeRowInputs('tri-c',n-1,i=>`c${i+1}`)
      makeRowInputs('tri-d',n,i=>`d${i+1}`)
      ;['tri-a-group','tri-b-group','tri-c-group','tri-d-group'].forEach(id=>document.getElementById(id).style.display='block')}
    gen(4)
    document.getElementById('tri-n').addEventListener('change',e=>gen(Math.min(Math.max(parseInt(e.target.value,10)||4,2),10)))
    document.getElementById('tri-calc-btn').addEventListener('click',()=>this.start())
  }

  start(){
    let n=parseInt(document.getElementById('tri-n').value,10)
    if(isNaN(n)||n<2||n>10){this.showError('阶数 n 必须在 2~10');return}

    let pA=parseRowFrac('tri-a',n-1);if(!pA){this.showError('请填写下对角线');return}
    let pB=parseRowFrac('tri-b',n);if(!pB){this.showError('请填写主对角线');return}
    let pC=parseRowFrac('tri-c',n-1);if(!pC){this.showError('请填写上对角线');return}
    let pD=parseRowFrac('tri-d',n);if(!pD){this.showError('请填写右端项');return}

    let useFrac=pA.allFrac&&pB.allFrac&&pC.allFrac&&pD.allFrac
    this.solve(pA.vals,pB.vals,pC.vals,pD.vals,n,useFrac)
  }

  solve(pA,pB,pC,pD,n,useFrac){
    if(useFrac){
      try{
        let a=pA.map(x=>x.value.clone()),b=pB.map(x=>x.value.clone()),c=pC.map(x=>x.value.clone()),d=pD.map(x=>x.value.clone())
        this.solveFrac(a,b,c,d,n)
      }catch(e){this.showError('分数计算出错: '+e.message)}
    }else{
      let a=pA.map(x=>x.type==='frac'?x.value.toFloat():x.value)
      let b=pB.map(x=>x.type==='frac'?x.value.toFloat():x.value)
      let c=pC.map(x=>x.type==='frac'?x.value.toFloat():x.value)
      let d=pD.map(x=>x.type==='frac'?x.value.toFloat():x.value)
      this.solveFloat(a,b,c,d,n)
    }
  }

  solveFrac(a,b,c,d,n){
    let steps=[],cp=new Array(n-1),dp=new Array(n)
    steps.push({type:'header',text:'一、前追（Forward Sweep）'})

    cp[0]=c[0].div(b[0]);dp[0]=d[0].div(b[0])
    steps.push({type:'step',text:`c'<sub>1</sub> = c<sub>1</sub>/b<sub>1</sub> = ${window.FracTools.fmtI(c[0])}/${window.FracTools.fmtI(b[0])} = ${window.FracTools.fmtI(cp[0])}`})
    steps.push({type:'step',text:`d'<sub>1</sub> = d<sub>1</sub>/b<sub>1</sub> = ${window.FracTools.fmtI(d[0])}/${window.FracTools.fmtI(b[0])} = ${window.FracTools.fmtI(dp[0])}`})

    for(let i=1;i<n-1;i++){
      let den=b[i].sub(a[i-1].mul(cp[i-1]))
      cp[i]=c[i].div(den)
      steps.push({type:'step',text:`c'<sub>${i+1}</sub> = c<sub>${i+1}</sub>/(b<sub>${i+1}</sub>−a<sub>${i+1}</sub>·c'<sub>${i}</sub>) = ${window.FracTools.fmtI(c[i])} / (${window.FracTools.fmtI(b[i])} − ${window.FracTools.fmtI(a[i-1])}×${window.FracTools.fmtI(cp[i-1])}) = ${window.FracTools.fmtI(cp[i])}`})
    }

    for(let i=1;i<n;i++){
      let den=b[i].sub(a[i-1].mul(cp[i-1]))
      dp[i]=d[i].sub(a[i-1].mul(dp[i-1])).div(den)
      steps.push({type:'step',text:`d'<sub>${i+1}</sub> = (d<sub>${i+1}</sub>−a<sub>${i+1}</sub>·d'<sub>${i}</sub>)/(b<sub>${i+1}</sub>−a<sub>${i+1}</sub>·c'<sub>${i}</sub>) = (${window.FracTools.fmtI(d[i])} − ${window.FracTools.fmtI(a[i-1])}×${window.FracTools.fmtI(dp[i-1])}) / (${window.FracTools.fmtI(b[i])} − ${window.FracTools.fmtI(a[i-1])}×${window.FracTools.fmtI(cp[i-1])}) = ${window.FracTools.fmtI(dp[i])}`})
    }

    steps.push({type:'spacer'})
    steps.push({type:'header',text:'二、赶（Back Substitution）'})

    let x=new Array(n)
    x[n-1]=dp[n-1]
    steps.push({type:'step',text:`x<sub>${n}</sub> = d'<sub>${n}</sub> = ${window.FracTools.fmtI(x[n-1])}`})

    for(let i=n-2;i>=0;i--){
      x[i]=dp[i].sub(cp[i].mul(x[i+1]))
      steps.push({type:'step',text:`x<sub>${i+1}</sub> = d'<sub>${i+1}</sub> − c'<sub>${i+1}</sub>·x<sub>${i+2}</sub> = ${window.FracTools.fmtI(dp[i])} − ${window.FracTools.fmtI(cp[i])}×${window.FracTools.fmtI(x[i+1])} = ${window.FracTools.fmtI(x[i])}`})
    }

    this.renderResult(steps,x,true)
  }

  solveFloat(a,b,c,d,n){
    let steps=[],cp=new Array(n-1),dp=new Array(n)
    steps.push({type:'header',text:'一、前追（Forward Sweep，小数模式）'})

    cp[0]=c[0]/b[0];dp[0]=d[0]/b[0]
    steps.push({type:'step',text:`c'<sub>1</sub> = c<sub>1</sub>/b<sub>1</sub> = ${window.FracTools.roundTo(c[0],4)}/${window.FracTools.roundTo(b[0],4)} = ${window.FracTools.roundTo(cp[0],6)}`})
    steps.push({type:'step',text:`d'<sub>1</sub> = d<sub>1</sub>/b<sub>1</sub> = ${window.FracTools.roundTo(d[0],4)}/${window.FracTools.roundTo(b[0],4)} = ${window.FracTools.roundTo(dp[0],6)}`})

    for(let i=1;i<n-1;i++){
      let den=b[i]-a[i-1]*cp[i-1]
      cp[i]=c[i]/den
      steps.push({type:'step',text:`c'<sub>${i+1}</sub> = ${window.FracTools.roundTo(c[i],4)}/(${window.FracTools.roundTo(b[i],4)}−${window.FracTools.roundTo(a[i-1],4)}×${window.FracTools.roundTo(cp[i-1],4)}) = ${window.FracTools.roundTo(cp[i],6)}`})
    }

    for(let i=1;i<n;i++){
      let den=b[i]-a[i-1]*cp[i-1]
      dp[i]=(d[i]-a[i-1]*dp[i-1])/den
      steps.push({type:'step',text:`d'<sub>${i+1}</sub> = (${window.FracTools.roundTo(d[i],4)}−${window.FracTools.roundTo(a[i-1],4)}×${window.FracTools.roundTo(dp[i-1],4)})/(${window.FracTools.roundTo(b[i],4)}−${window.FracTools.roundTo(a[i-1],4)}×${window.FracTools.roundTo(cp[i-1],4)}) = ${window.FracTools.roundTo(dp[i],6)}`})
    }

    steps.push({type:'spacer'})
    steps.push({type:'header',text:'二、赶（Back Substitution）'})

    let x=new Array(n)
    x[n-1]=dp[n-1]
    steps.push({type:'step',text:`x<sub>${n}</sub> = d'<sub>${n}</sub> = ${window.FracTools.roundTo(x[n-1],6)}`})

    for(let i=n-2;i>=0;i--){
      x[i]=dp[i]-cp[i]*x[i+1]
      steps.push({type:'step',text:`x<sub>${i+1}</sub> = ${window.FracTools.roundTo(dp[i],4)} − ${window.FracTools.roundTo(cp[i],4)}×${window.FracTools.roundTo(x[i+1],4)} = ${window.FracTools.roundTo(x[i],6)}`})
    }

    this.renderResult(steps,x,false)
  }

  renderResult(steps,x,isFrac){
    document.getElementById('tri-result').style.display='block'
    let se=document.getElementById('tri-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='step'){let d=document.createElement('div');d.className='step-item backsub';d.innerHTML=`<span class="step-marker">◈</span> ${s.text}`;se.appendChild(d)}
      else if(s.type==='spacer')se.appendChild(document.createElement('hr'))
    })
    let sol=x.map(v=>isFrac?window.FracTools.fmtI(v):window.FracTools.roundTo(v,6))
    document.getElementById('tri-solution').innerHTML=`<div class="result-block"><strong>解向量：</strong><span class="solution-vector">x = [${sol.join(', ')}]</span></div>`
  }

  showError(msg){
    document.getElementById('tri-error').textContent=msg;document.getElementById('tri-error').classList.add('visible')
    document.getElementById('tri-result').style.display='none'
  }
}

window.TridiagonalAlgorithm=TridiagonalAlgorithm

})()
