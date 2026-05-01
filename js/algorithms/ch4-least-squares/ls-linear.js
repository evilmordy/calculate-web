(function(){
class LSLinearAlgorithm extends window.Algorithm{
  constructor(){super({name:'线性拟合',description:'用最小二乘法求解多元线性模型 y=a₀+a₁x₁+...+a<sub>p</sub>x<sub>p</sub>',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="16" r="1.5" stroke="none" fill="currentColor"/><circle cx="12" cy="10" r="1.5" stroke="none" fill="currentColor"/><circle cx="14" cy="8" r="1.5" stroke="none" fill="currentColor"/><circle cx="16" cy="6" r="1.5" stroke="none" fill="currentColor"/><circle cx="18" cy="4" r="1.5" stroke="none" fill="currentColor"/><path d="M7 17l13-13"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入数据</div><div class="algo-card-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">数据点数 m</label><input type="number" class="form-input" id="ls-m" min="2" max="20" step="1" style="width:80px" value="4"></div>
          <div class="form-group"><label class="form-label">自变量个数 p</label><input type="number" class="form-input" id="ls-p" min="1" max="5" step="1" style="width:80px" value="1"></div>
        </div>
        <div class="form-group"><label class="form-label">数据表 (m 行 × (p+1) 列, 最后一列为 y)</label><div id="ls-grid"></div>
        <div class="form-hint">每行: x<sub>1</sub> x<sub>2</sub> ... x<sub>p</sub> y</div></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="ls-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="ls-error"></div>
      </div></div>
      <div class="algo-card" id="ls-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="ls-steps"></div></div></div>`
    let m=4,p=1
    let gen=()=>{let c=document.getElementById('ls-grid');c.innerHTML='';let w=document.createElement('div');w.className='matrix-display';let l=document.createElement('span');l.className='bracket left';l.textContent='[';w.appendChild(l);let t=document.createElement('table');t.className='matrix-table input-mode'
    for(let i=0;i<m;i++){let tr=document.createElement('tr')
    for(let j=0;j<=p;j++){let td=document.createElement('td');let inp=document.createElement('input');inp.type='text';inp.className='matrix-input';inp.placeholder=j<p?`x<sub>${j+1}</sub>`:`y`;td.appendChild(inp);tr.appendChild(td)}t.appendChild(tr)}
    w.appendChild(t);let r=document.createElement('span');r.className='bracket right';r.textContent=']';w.appendChild(r);c.appendChild(w)}
    gen()
    document.getElementById('ls-m').addEventListener('change',e=>{m=Math.min(Math.max(parseInt(e.target.value,10)||4,2),20);gen()})
    document.getElementById('ls-p').addEventListener('change',e=>{p=Math.min(Math.max(parseInt(e.target.value,10)||1,1),5);gen()})
    document.getElementById('ls-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('ls-error');e.classList.remove('visible');e.textContent=''
    let m=parseInt(document.getElementById('ls-m').value,10),p=parseInt(document.getElementById('ls-p').value,10)
    if(isNaN(m)||m<2||m>20){e.textContent='数据点数 m 必须在 2~20';e.classList.add('visible');return}
    if(isNaN(p)||p<1||p>5){e.textContent='自变量个数 p 必须在 1~5';e.classList.add('visible');return}
    let inp=document.getElementById('ls-grid').querySelectorAll('.matrix-input')
    let data=[],allFrac=true
    for(let i=0;i<m;i++){
      let row=[]
      for(let j=0;j<=p;j++){let v=inp[i*(p+1)+j].value.trim();if(!v){e.textContent='请填写所有输入框';e.classList.add('visible');return}
      let px=window.FracTools.parseInput(v);if(!px){e.textContent=`第${i+1}行第${j+1}列输入无效`;e.classList.add('visible');return}
      if(px.type==='float')allFrac=false;row.push(px)}
      data.push(row)}
    this.resultData={m,p,data,allFrac}
    allFrac?this.solveFrac():this.solveFloat()
  }
  solveFrac(){
    let{m,p,data}=this.resultData,F=window.Fraction,fi=window.FracTools.fmtI,steps=[]
    let n=p+1
    let A=data.map(row=>row.slice(0,p).map(x=>x.value.clone())),y=data.map(row=>row[p].value.clone())
    for(let i=0;i<m;i++)A[i].unshift(new F(1))

    steps.push({type:'header',text:`一、构建设计矩阵 A (${m}×${n})`})
    steps.push({type:'html',html:this.matHTML(A,true)})

    steps.push({type:'header',text:`二、计算法方程组 A<sup>T</sup>A · a = A<sup>T</sup>y`})
    let ATA=[],ATy=[]
    for(let i=0;i<n;i++){ATA[i]=[];ATy[i]=new F(0)
    for(let k=0;k<n;k++){ATA[i][k]=new F(0)
    for(let r=0;r<m;r++)ATA[i][k]=ATA[i][k].add(A[r][i].mul(A[r][k]))}
    for(let r=0;r<m;r++)ATy[i]=ATy[i].add(A[r][i].mul(y[r]))}

    let matStr='<table class="result-table" style="margin:0 auto"><tbody>'
    for(let i=0;i<n;i++){matStr+='<tr>'
    for(let k=0;k<n;k++)matStr+=`<td>${fi(ATA[i][k])}</td>`
    matStr+=`<td style="border-left:2px solid var(--primary)">${fi(ATy[i])}</td></tr>`}
    matStr+='</tbody></table>'
    steps.push({type:'html',html:matStr})

    steps.push({type:'header',text:'三、列主元消去法求解系数 a'})
    let aug=[]
    for(let i=0;i<n;i++){aug[i]=[];for(let j=0;j<n;j++)aug[i].push(ATA[i][j].clone());aug[i].push(ATy[i].clone())}
    for(let col=0;col<n-1;col++){
      let pivot=col
      for(let row=col+1;row<n;row++)if(aug[row][col].abs().toFloat()>aug[pivot][col].abs().toFloat())pivot=row
      if(pivot!==col){let t=aug[col];aug[col]=aug[pivot];aug[pivot]=t}
      for(let row=col+1;row<n;row++){let f=aug[row][col].div(aug[col][col])
      for(let j=col;j<=n;j++)aug[row][j]=aug[row][j].sub(f.mul(aug[col][j]))}}
    let coeff=[]
    for(let i=n-1;i>=0;i--){let s=new F(0);for(let j=i+1;j<n;j++)s=s.add(aug[i][j].mul(coeff[j]))
    coeff[i]=aug[i][n].sub(s).div(aug[i][i])}

    steps.push({type:'header',text:'四、拟合公式'})
    let formula='y = '+fi(coeff[0])
    for(let i=1;i<n;i++){let v=coeff[i]
    if(v.num<0)formula+=` − ${fi(v.abs())}x<sub>${i}</sub>`;else formula+=` + ${fi(v)}x<sub>${i}</sub>`}
    steps.push({type:'step',html:this.stepHTML(formula)})

    steps.push({type:'header',text:'五、残差分析'})
    let rtable='<table class="result-table"><thead><tr><th>i</th>'
    for(let j=1;j<=p;j++)rtable+=`<th>x<sub>${j}</sub></th>`
    rtable+=`<th>y<sub>i</sub></th><th>ŷ<sub>i</sub></th><th>δ<sub>i</sub></th><th>δ<sub>i</sub>²</th></tr></thead><tbody>`
    let mse=new F(0)
    for(let i=0;i<m;i++){let yh=new F(0)
    for(let k=0;k<n;k++)yh=yh.add(coeff[k].mul(A[i][k]))
    let d=y[i].sub(yh);mse=mse.add(d.mul(d))
    rtable+=`<tr><td>${i+1}</td>`
    for(let j=1;j<=p;j++)rtable+=`<td>${fi(A[i][j])}</td>`
    rtable+=`<td>${fi(y[i])}</td><td>${fi(yh)}</td><td>${fi(d)}</td><td>${fi(d.mul(d))}</td></tr>`}
    rtable+='</tbody></table>';steps.push({type:'html',html:rtable})
    mse=mse.div(new F(m))
    steps.push({type:'result',text:`均方误差 MSE = ${fi(mse)} = ${mse.toFloat().toFixed(8)}`})
    this.showSteps(steps)
  }
  solveFloat(){
    let{m,p,data}=this.resultData,R=f=>window.FracTools.roundTo(f,4),steps=[],n=p+1
    let A=data.map(row=>row.slice(0,p).map(x=>x.type==='frac'?x.value.toFloat():x.value))
    let y=data.map(row=>row[p].type==='frac'?row[p].value.toFloat():row[p].value)
    for(let i=0;i<m;i++)A[i].unshift(1)

    steps.push({type:'header',text:'一、构建设计矩阵 A'})
    steps.push({type:'html',html:this.matHTMLFloat(A)})

    steps.push({type:'header',text:'二、计算 AᵀA 和 Aᵀy'})
    let ATA=[],ATy=[]
    for(let i=0;i<n;i++){ATA[i]=[];ATy[i]=0
    for(let k=0;k<n;k++){ATA[i][k]=0;for(let r=0;r<m;r++)ATA[i][k]+=A[r][i]*A[r][k]}for(let r=0;r<m;r++)ATy[i]+=A[r][i]*y[r]}
    let matStr='<table class="result-table" style="margin:0 auto"><tbody>'
    for(let i=0;i<n;i++){matStr+='<tr>';for(let k=0;k<n;k++)matStr+=`<td>${R(ATA[i][k])}</td>`
    matStr+=`<td style="border-left:2px solid var(--primary)">${R(ATy[i])}</td></tr>`}matStr+='</tbody></table>'
    steps.push({type:'html',html:matStr})

    steps.push({type:'header',text:'三、列主元消去法求解'})
    let aug=[];for(let i=0;i<n;i++){aug[i]=ATA[i].concat(ATy[i])}
    for(let col=0;col<n-1;col++){let pv=col;for(let row=col+1;row<n;row++)if(Math.abs(aug[row][col])>Math.abs(aug[pv][col]))pv=row
    if(pv!==col){let t=aug[col];aug[col]=aug[pv];aug[pv]=t}
    for(let row=col+1;row<n;row++){let f=aug[row][col]/aug[col][col];for(let j=col;j<=n;j++)aug[row][j]-=f*aug[col][j]}}
    let coeff=[];for(let i=n-1;i>=0;i--){let s=0;for(let j=i+1;j<n;j++)s+=aug[i][j]*coeff[j];coeff[i]=(aug[i][n]-s)/aug[i][i]}

    steps.push({type:'header',text:'四、拟合公式'})
    let F6=window.FracTools.roundTo
    let formula='y = '+F6(coeff[0],6)
    for(let i=1;i<n;i++){let v=coeff[i];formula+=v<0?` − ${F6(-v,6)}x<sub>${i}</sub>`:` + ${F6(v,6)}x<sub>${i}</sub>`}
    steps.push({type:'step',html:this.stepHTML(formula)})

    steps.push({type:'header',text:'五、残差分析'})
    let rtable='<table class="result-table"><thead><tr><th>i</th>'
    for(let j=1;j<=p;j++)rtable+=`<th>x<sub>${j}</sub></th>`
    rtable+=`<th>y<sub>i</sub></th><th>ŷ<sub>i</sub></th><th>δ<sub>i</sub></th><th>δ<sub>i</sub>²</th></tr></thead><tbody>`
    let mse=0
    for(let i=0;i<m;i++){let yh=0;for(let k=0;k<n;k++)yh+=coeff[k]*A[i][k];let d=y[i]-yh;mse+=d*d
    rtable+=`<tr><td>${i+1}</td>`
    for(let j=1;j<=p;j++)rtable+=`<td>${R(A[i][j])}</td>`
    rtable+=`<td>${R(y[i])}</td><td>${R(yh)}</td><td>${R(d)}</td><td>${R(d*d)}</td></tr>`}
    rtable+='</tbody></table>';steps.push({type:'html',html:rtable})
    mse/=m
    steps.push({type:'result',text:`均方误差 MSE = ${F6(mse,8)}`})
    this.showSteps(steps)
  }
  matHTML(A,frac){let fi=frac?window.FracTools.fmtI:f=>window.FracTools.roundTo(f,4)
  let h='<div class="matrix-display"><span class="bracket left">[</span><table class="matrix-table"><tbody>'
  for(let i=0;i<A.length;i++){h+='<tr>';for(let j=0;j<A[0].length;j++)h+=`<td>${fi(A[i][j])}</td>`;h+='</tr>'}
  h+='</tbody></table><span class="bracket right">]</span></div>';return h}
  matHTMLFloat(A){let R=window.FracTools.roundTo
  let h='<div class="matrix-display"><span class="bracket left">[</span><table class="matrix-table"><tbody>'
  for(let i=0;i<A.length;i++){h+='<tr>';for(let j=0;j<A[0].length;j++)h+=`<td>${R(A[i][j],4)}</td>`;h+='</tr>'}
  h+='</tbody></table><span class="bracket right">]</span></div>';return h}
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('ls-result').style.display='block';let se=document.getElementById('ls-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html')se.innerHTML+=`<div class="step-item">${s.html}</div>`
      else if(s.type==='step')se.innerHTML+=s.html
      else if(s.type==='result'){let d=document.createElement('div');d.className='result-block';d.style.padding='12px 0';d.innerHTML=`<strong style="color:var(--primary);font-size:16px">${s.text}</strong>`;se.appendChild(d)}
    })
  }
}
window.LSLinearAlgorithm=LSLinearAlgorithm
})()
