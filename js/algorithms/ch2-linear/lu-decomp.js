(function() {

function displayStep(step){let d=document.createElement('div');d.className='step-item backsub';d.innerHTML=`<span class="step-marker">◈</span> ${step}`;return d}

class LUDecompAlgorithm extends window.Algorithm {
  constructor() {
    super({
      name: 'LU 分解',
      description: '用 LU 分解 (Doolittle / Crout) 求解线性方程组 Ax = b，同时计算行列式',
      icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><text x="3" y="16" font-size="12" fill="currentColor" stroke="none" font-family="serif" font-style="italic">L</text><text x="12" y="16" font-size="12" fill="currentColor" stroke="none" font-family="serif" font-style="italic">U</text><line x1="8" y1="5" x2="8" y2="19" stroke-dasharray="2 2"/></svg>`,
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
            <input type="number" class="form-input" id="lu-n" value="3" min="2" max="10" step="1" style="width:80px">
          </div>
          <div class="form-group">
            <label class="form-label">分解方法</label>
            <label style="margin-right:20px;cursor:pointer"><input type="radio" name="lu-method" value="doolittle" checked> Doolittle (L 单位下三角)</label>
            <label style="cursor:pointer"><input type="radio" name="lu-method" value="crout"> Crout (U 单位上三角)</label>
          </div>
          <div class="form-group"><label class="form-label">矩阵 A</label><div id="lu-grid-a"></div></div>
          <div class="form-group"><label class="form-label">右端项 b</label><div id="lu-grid-b"></div></div>
          <div style="margin-top:8px"><button class="btn btn-primary" id="lu-calc-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
          <div class="form-error" id="lu-error"></div>
        </div>
      </div>
      <div class="algo-card" id="lu-result" style="display:none">
        <div class="algo-card-header">计算过程与结果</div>
        <div class="algo-card-body">
          <div id="lu-steps"></div>
          <div id="lu-solution" style="margin-top:20px"></div>
          <div id="lu-det" style="margin-top:20px"></div>
        </div>
      </div>
    `
    let n=3
    window.FracTools.makeGrid('lu-grid-a',n,n,(i,j)=>`a${i+1}${j+1}`)
    window.FracTools.makeGrid('lu-grid-b',n,1,i=>`b${i+1}`)
    document.getElementById('lu-n').addEventListener('change',e=>{
      n=Math.min(Math.max(parseInt(e.target.value,10)||3,2),10)
      window.FracTools.makeGrid('lu-grid-a',n,n,(i,j)=>`a${i+1}${j+1}`)
      window.FracTools.makeGrid('lu-grid-b',n,1,i=>`b${i+1}`)
    })
    document.getElementById('lu-calc-btn').addEventListener('click',()=>this.start())
  }

  start(){
    let n=parseInt(document.getElementById('lu-n').value,10)
    if(isNaN(n)||n<2||n>10){this.showError('阶数 n 必须在 2~10');return}
    let pA=window.FracTools.readGrid('lu-grid-a',n,n)
    let pB=window.FracTools.readGrid('lu-grid-b',n,1)
    if(!pA||!pB){this.showError('请填写所有输入框');return}
    let useFrac=window.FracTools.checkAllFrac(pA)&&window.FracTools.checkAllFrac(pB)
    let method=document.querySelector('input[name="lu-method"]:checked').value
    this.solve(pA,pB,n,method,useFrac)
  }

  solve(pA,pB,n,method,useFrac){
    if(useFrac){
      try{
        let A=window.FracTools.parsedToFracMatrix(pA)
        let b=window.FracTools.parsedToFracVector(pB)
        this.solveFrac(A,b,n,method)
      }catch(e){
        this.showError('分数计算出错: '+e.message)
      }
    }else{
      let A=window.FracTools.parsedToFloatMatrix(pA)
      let b=window.FracTools.parsedToFloatVector(pB)
      this.solveFloat(A,b,n,method)
    }
  }

  solveFrac(A,b,n,method){
    let steps=[],L=[],U=[]
    for(let i=0;i<n;i++){L[i]=new Array(n).fill(null).map(()=>new window.Fraction(0));U[i]=new Array(n).fill(null).map(()=>new window.Fraction(0))}

    if(method==='doolittle'){
      for(let i=0;i<n;i++)L[i][i]=new window.Fraction(1)
      for(let k=0;k<n;k++){
        for(let j=k;j<n;j++){let s=new window.Fraction(0);for(let t=0;t<k;t++)s=s.add(L[k][t].mul(U[t][j]));U[k][j]=A[k][j].sub(s)}
        for(let i=k+1;i<n;i++){let s=new window.Fraction(0);for(let t=0;t<k;t++)s=s.add(L[i][t].mul(U[t][k]));L[i][k]=A[i][k].sub(s).div(U[k][k])}
      }
    }else{
      for(let i=0;i<n;i++)U[i][i]=new window.Fraction(1)
      for(let k=0;k<n;k++){
        for(let i=k;i<n;i++){let s=new window.Fraction(0);for(let t=0;t<k;t++)s=s.add(L[i][t].mul(U[t][k]));L[i][k]=A[i][k].sub(s)}
        for(let j=k+1;j<n;j++){let s=new window.Fraction(0);for(let t=0;t<k;t++)s=s.add(L[k][t].mul(U[t][j]));U[k][j]=A[k][j].sub(s).div(L[k][k])}
      }
    }

    let label=method==='doolittle'?'Doolittle (L 单位下三角)':'Crout (U 单位上三角)'
    steps.push({type:'header',text:`一、LU 分解结果（${label}）`})
    steps.push({type:'html',html:window.FracTools.fracMatHTML(L)+window.FracTools.fracMatHTML(U)})

    steps.push({type:'header',text:'二、前代 Ly = b'})
    let y=new Array(n)
    for(let i=0;i<n;i++){
      let s=new window.Fraction(0)
      for(let j=0;j<i;j++)s=s.add(L[i][j].mul(y[j]))
      y[i]=b[i].sub(s).div(L[i][i])
      steps.push({type:'step',html:displayStep(`y<sub>${i+1}</sub> = (${window.FracTools.fmtI(b[i])} − ${window.FracTools.fmtI(s)}) / ${window.FracTools.fmtI(L[i][i])} = ${window.FracTools.fmtI(y[i])}`)})
    }
    steps.push({type:'html',html:window.FracTools.vecFracHTML(y)})

    steps.push({type:'header',text:'三、回代 Ux = y'})
    let x=new Array(n)
    for(let i=n-1;i>=0;i--){
      let s=new window.Fraction(0)
      for(let j=i+1;j<n;j++)s=s.add(U[i][j].mul(x[j]))
      x[i]=y[i].sub(s).div(U[i][i])
      steps.push({type:'step',html:displayStep(`x<sub>${i+1}</sub> = (${window.FracTools.fmtI(y[i])} − ${window.FracTools.fmtI(s)}) / ${window.FracTools.fmtI(U[i][i])} = ${window.FracTools.fmtI(x[i])}`)})
    }

    steps.push({type:'header',text:'四、行列式计算'})
    let det=new window.Fraction(1)
    let detExpr='det(A) ='
    let diag=method==='doolittle'?U:L
    for(let i=0;i<n;i++){det=det.mul(diag[i][i]);detExpr+=` × ${window.FracTools.fmtI(diag[i][i])}`}
    detExpr+=` = ${window.FracTools.fmtI(det)}`

    this.renderResult(steps,x,detExpr,true)
  }

  solveFloat(A,b,n,method){
    let steps=[],L=[],U=[]
    for(let i=0;i<n;i++){L[i]=new Array(n).fill(0);U[i]=new Array(n).fill(0)}

    if(method==='doolittle'){
      for(let i=0;i<n;i++)L[i][i]=1
      for(let k=0;k<n;k++){
        for(let j=k;j<n;j++){let s=0;for(let t=0;t<k;t++)s+=L[k][t]*U[t][j];U[k][j]=A[k][j]-s}
        for(let i=k+1;i<n;i++){let s=0;for(let t=0;t<k;t++)s+=L[i][t]*U[t][k];L[i][k]=(A[i][k]-s)/U[k][k]}
      }
    }else{
      for(let i=0;i<n;i++)U[i][i]=1
      for(let k=0;k<n;k++){
        for(let i=k;i<n;i++){let s=0;for(let t=0;t<k;t++)s+=L[i][t]*U[t][k];L[i][k]=A[i][k]-s}
        for(let j=k+1;j<n;j++){let s=0;for(let t=0;t<k;t++)s+=L[k][t]*U[t][j];U[k][j]=(A[k][j]-s)/L[k][k]}
      }
    }

    let label=method==='doolittle'?'Doolittle (L 单位下三角)':'Crout (U 单位上三角)'
    steps.push({type:'header',text:`一、LU 分解结果（${label}，小数模式）`})
    steps.push({type:'html',html:window.FracTools.floatMatHTML(L)+window.FracTools.floatMatHTML(U)})

    steps.push({type:'header',text:'二、前代 Ly = b'})
    let y=new Array(n)
    for(let i=0;i<n;i++){let s=0;for(let j=0;j<i;j++)s+=L[i][j]*y[j];y[i]=(b[i]-s)/L[i][i]
    steps.push({type:'step',html:displayStep(`y<sub>${i+1}</sub> = (${window.FracTools.roundTo(b[i],4)} − ${window.FracTools.roundTo(s,4)}) / ${window.FracTools.roundTo(L[i][i],4)} = ${window.FracTools.roundTo(y[i],6)}`)})}
    steps.push({type:'html',html:window.FracTools.floatVecHTML(y)})

    steps.push({type:'header',text:'三、回代 Ux = y'})
    let x=new Array(n)
    for(let i=n-1;i>=0;i--){let s=0;for(let j=i+1;j<n;j++)s+=U[i][j]*x[j];x[i]=(y[i]-s)/U[i][i]
    steps.push({type:'step',html:displayStep(`x<sub>${i+1}</sub> = (${window.FracTools.roundTo(y[i],4)} − ${window.FracTools.roundTo(s,4)}) / ${window.FracTools.roundTo(U[i][i],4)} = ${window.FracTools.roundTo(x[i],6)}`)})}

    steps.push({type:'header',text:'四、行列式计算'})
    let det=1
    let detExpr='det(A) ='
    let diag=method==='doolittle'?U:L
    for(let i=0;i<n;i++){det*=diag[i][i];detExpr+=` × ${window.FracTools.roundTo(diag[i][i],4)}`}
    det=window.FracTools.roundTo(det,6)
    detExpr+=` = ${det}`

    this.renderResult(steps,x,detExpr,false)
  }

  renderResult(steps,x,detExpr,isFrac){
    document.getElementById('lu-result').style.display='block'
    let se=document.getElementById('lu-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html'){let d=document.createElement('div');d.className='step-item';d.innerHTML=s.html;se.appendChild(d)}
      else if(s.type==='step'){se.appendChild(s.html)}
    })
    let sol=x.map(v=>isFrac?window.FracTools.fmtI(v):window.FracTools.roundTo(v,6))
    document.getElementById('lu-solution').innerHTML=`<div class="result-block"><strong>解向量：</strong><span class="solution-vector">x = [${sol.join(', ')}]</span></div>`
    document.getElementById('lu-det').innerHTML=`<div class="result-block"><strong>行列式：</strong><div class="det-display">${detExpr}</div></div>`
  }

  showError(msg){
    document.getElementById('lu-error').textContent=msg;document.getElementById('lu-error').classList.add('visible')
    document.getElementById('lu-result').style.display='none'
  }
}

window.LUDecompAlgorithm=LUDecompAlgorithm

})()
