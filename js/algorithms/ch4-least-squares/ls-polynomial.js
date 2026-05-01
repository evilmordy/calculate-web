(function(){
class LSPolyAlgorithm extends window.Algorithm{
  constructor(){super({name:'多项式拟合',description:'用最小二乘法求解多项式模型 y=a₀+a₁x+...+a<sub>k</sub>x<sup>k</sup>',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l6-14 2 6 4-8 4 10 2-4"/><circle cx="9" cy="11.5" r="1.5" stroke="none" fill="currentColor"/><circle cx="11" cy="5.5" r="1.5" stroke="none" fill="currentColor"/><circle cx="15" cy="1.5" r="1.5" stroke="none" fill="currentColor"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入数据</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">数据点数 m</label><input type="number" class="form-input" id="lp-m" min="3" max="20" step="1" style="width:80px" value="5"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">多项式次数 k (k&lt;m)</label><input type="number" class="form-input" id="lp-k" min="1" max="5" step="1" style="width:120px" value="2"></div>
        </div>
        <div class="form-group"><label class="form-label">数据点 (x<sub>i</sub>, y<sub>i</sub>)</label><div id="lp-grid"></div></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="lp-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="lp-error"></div>
      </div></div>
      <div class="algo-card" id="lp-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="lp-steps"></div></div></div>`
    let m=5
    let gen=()=>{let c=document.getElementById('lp-grid');c.innerHTML='';let w=document.createElement('div');w.className='matrix-display';let l=document.createElement('span');l.className='bracket left';l.textContent='[';w.appendChild(l);let t=document.createElement('table');t.className='matrix-table input-mode'
    for(let i=0;i<m;i++){let tr=document.createElement('tr');for(let j=0;j<2;j++){let td=document.createElement('td');let inp=document.createElement('input');inp.type='text';inp.className='matrix-input';inp.placeholder=j===0?`x<sub>${i+1}</sub>`:`y<sub>${i+1}</sub>`;td.appendChild(inp);tr.appendChild(td)}t.appendChild(tr)}
    w.appendChild(t);let r=document.createElement('span');r.className='bracket right';r.textContent=']';w.appendChild(r);c.appendChild(w)}
    gen()
    document.getElementById('lp-m').addEventListener('change',e=>{m=Math.min(Math.max(parseInt(e.target.value,10)||5,3),20);gen()})
    document.getElementById('lp-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('lp-error');e.classList.remove('visible');e.textContent=''
    let m=parseInt(document.getElementById('lp-m').value,10),k=parseInt(document.getElementById('lp-k').value,10)
    if(isNaN(m)||m<3||m>20){e.textContent='数据点数必须在 3~20';e.classList.add('visible');return}
    if(isNaN(k)||k<1||k>=m){e.textContent=`多项式次数 k 必须在 1~${m-1}`;e.classList.add('visible');return}
    let inp=document.getElementById('lp-grid').querySelectorAll('.matrix-input');let xs=[],ys=[],allFrac=true,empty=false
    for(let i=0;i<m;i++){let xv=inp[i*2].value.trim(),yv=inp[i*2+1].value.trim();if(!xv||!yv){empty=true;continue}
    let px=window.FracTools.parseInput(xv);if(!px){e.textContent=`x${i+1} 输入无效`;e.classList.add('visible');return}
    let py=window.FracTools.parseInput(yv);if(!py){e.textContent=`y${i+1} 输入无效`;e.classList.add('visible');return}
    if(px.type==='float'||py.type==='float')allFrac=false;xs.push(px);ys.push(py)}
    if(empty){e.textContent='请填写所有输入框';e.classList.add('visible');return}
    allFrac?this.solveFrac(xs.map(x=>x.value.clone()),ys.map(y=>y.value.clone()),m,k):this.solveFloat(xs.map(x=>x.type==='frac'?x.value.toFloat():x.value),ys.map(y=>y.type==='frac'?y.value.toFloat():y.value),m,k)
  }
  solveFrac(x,y,m,k){
    let F=window.Fraction,fi=window.FracTools.fmtI,steps=[]
    steps.push({type:'header',text:`一、构建法方程组 (${k+1}×${k+1})`})
    let p=2*k,N=Array.from({length:p+1},()=>new F(0)),T=new Array(k+1)
    for(let i=0;i<m;i++){let xi=x[i];for(let s=0;s<=p;s++)N[s]=N[s].add(new F(Math.pow(xi.num,s),Math.pow(xi.den,s)).clone())}
    for(let i=0;i<=k;i++){T[i]=new F(0);for(let j=0;j<m;j++)T[i]=T[i].add(y[j].mul(new F(Math.pow(x[j].num,i),Math.pow(x[j].den,i))))}
    steps.push({type:'html',html:this.buildMatHTML(N,T,k,true)})
    steps.push({type:'header',text:'二、解法方程组（列主元消去法）'})
    let mat=[],rhs=[]
    for(let i=0;i<=k;i++){let r=[];for(let j=0;j<=k;j++)r.push(N[i+j].clone());r.push(T[i].clone());mat.push(r);rhs.push(T[i].clone())}
    let a=[],b=[]
    for(let i=0;i<=k;i++){a.push(mat[i].slice(0,k+1));b.push(mat[i][k+1])}
    let K=a,nn=k+1
    for(let col=0;col<nn-1;col++){
      let pivot=col
      for(let row=col+1;row<nn;row++)if(K[row][col].abs().toFloat()>K[pivot][col].abs().toFloat())pivot=row
      if(pivot!==col){let t=K[col];K[col]=K[pivot];K[pivot]=t;let tb=b[col];b[col]=b[pivot];b[pivot]=tb}
      for(let row=col+1;row<nn;row++){let f=K[row][col].div(K[col][col])
      for(let j=col;j<nn;j++)K[row][j]=K[row][j].sub(f.mul(K[col][j]));b[row]=b[row].sub(f.mul(b[col]))}}
    let coeff=new Array(nn).fill(null)
    for(let i=nn-1;i>=0;i--){let s=new F(0);for(let j=i+1;j<nn;j++)s=s.add(K[i][j].mul(coeff[j]))
    coeff[i]=b[i].sub(s).div(K[i][i])}
    steps.push({type:'header',text:'三、拟合结果'})
    let expr='y = '
    for(let i=0;i<=k;i++){if(i===0)expr+=fi(coeff[i])
    else if(coeff[i].num<0)expr+=` − ${fi(coeff[i].abs())}x`
    else expr+=` + ${fi(coeff[i])}x`;if(i>1)expr+=`<sup>${i}</sup>`}
    steps.push({type:'step',html:this.stepHTML(expr)})
    let rtable='<table class="result-table"><thead><tr><th>i</th><th>x<sub>i</sub></th><th>y<sub>i</sub></th><th>ŷ<sub>i</sub></th><th>δ<sub>i</sub></th></tr></thead><tbody>'
    let mse=new F(0)
    for(let i=0;i<m;i++){let yh=new F(0);for(let j=0;j<=k;j++)yh=yh.add(coeff[j].mul(new F(Math.pow(x[i].num,j),Math.pow(x[i].den,j))));let d=y[i].sub(yh);mse=mse.add(d.mul(d))
    rtable+=`<tr><td>${i+1}</td><td>${fi(x[i])}</td><td>${fi(y[i])}</td><td>${fi(yh)}</td><td>${fi(d)}</td></tr>`}
    rtable+='</tbody></table>';steps.push({type:'html',html:rtable})
    mse=mse.div(new F(m))
    steps.push({type:'result',text:`均方误差 MSE = ${fi(mse)} = ${mse.toFloat().toFixed(8)}`})
    this.showSteps(steps)
  }
  solveFloat(x,y,m,k){
    let F=f=>window.FracTools.roundTo(f,6),steps=[]
    steps.push({type:'header',text:'一、构建法方程组（小数模式）'})
    let p=2*k,N=new Array(p+1).fill(0),T=new Array(k+1).fill(0)
    for(let s=0;s<=p;s++){for(let i=0;i<m;i++)N[s]+=Math.pow(x[i],s)}
    for(let i=0;i<=k;i++){for(let j=0;j<m;j++)T[i]+=y[j]*Math.pow(x[j],i)}
    steps.push({type:'html',html:this.buildMatHTMLFloat(N,T,k)})
    steps.push({type:'header',text:'二、解法方程组'})
    let nn=k+1,a=[];for(let i=0;i<nn;i++){let r=[];for(let j=0;j<nn;j++)r.push(N[i+j]);a.push(r.concat(T[i]))}
    for(let col=0;col<nn-1;col++){let pv=col;for(let row=col+1;row<nn;row++)if(Math.abs(a[row][col])>Math.abs(a[pv][col]))pv=row
    if(pv!==col)[a[col],a[pv]]=[a[pv],a[col]]
    for(let row=col+1;row<nn;row++){let f=a[row][col]/a[col][col];for(let j=col;j<=nn;j++)a[row][j]-=f*a[col][j]}}
    let coeff=new Array(nn)
    for(let i=nn-1;i>=0;i--){let s=0;for(let j=i+1;j<nn;j++)s+=a[i][j]*coeff[j];coeff[i]=(a[i][nn]-s)/a[i][i]}
    steps.push({type:'header',text:'三、拟合结果'})
    let expr='y = '
    for(let i=0;i<=k;i++){if(i===0)expr+=F(coeff[i])
    else if(coeff[i]<0)expr+=` − ${F(-coeff[i])}x`
    else expr+=` + ${F(coeff[i])}x`;if(i>1)expr+=`<sup>${i}</sup>`}
    steps.push({type:'step',html:this.stepHTML(expr)})
    let rtable='<table class="result-table"><thead><tr><th>i</th><th>x<sub>i</sub></th><th>y<sub>i</sub></th><th>ŷ<sub>i</sub></th><th>δ<sub>i</sub></th></tr></thead><tbody>'
    let mse=0
    for(let i=0;i<m;i++){let yh=0;for(let j=0;j<=k;j++)yh+=coeff[j]*Math.pow(x[i],j);let d=y[i]-yh;mse+=d*d
    rtable+=`<tr><td>${i+1}</td><td>${F(x[i])}</td><td>${F(y[i])}</td><td>${F(yh)}</td><td>${F(d)}</td></tr>`}
    rtable+='</tbody></table>';steps.push({type:'html',html:rtable})
    mse/=m;steps.push({type:'result',text:`均方误差 MSE = ${F(mse)}`})
    this.showSteps(steps)
  }
  buildMatHTML(N,T,k,frac){
    let fi=f=>frac?window.FracTools.fmtI(f):window.FracTools.roundTo(f,4)
    let h='<table class="result-table" style="margin:0 auto"><tbody>'
    for(let i=0;i<=k;i++){h+='<tr>';for(let j=0;j<=k;j++)h+=`<td>${fi(N[i+j])}</td>`;h+=`<td style="border-left:2px solid var(--primary)">${fi(T[i])}</td></tr>`}
    h+='</tbody></table>';return h
  }
  buildMatHTMLFloat(N,T,k){
    let F=f=>window.FracTools.roundTo(f,4)
    let h='<table class="result-table" style="margin:0 auto"><tbody>'
    for(let i=0;i<=k;i++){h+='<tr>';for(let j=0;j<=k;j++)h+=`<td>${F(N[i+j])}</td>`;h+=`<td style="border-left:2px solid var(--primary)">${F(T[i])}</td></tr>`}
    h+='</tbody></table>';return h
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('lp-result').style.display='block';let se=document.getElementById('lp-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='html')se.innerHTML+=`<div class="step-item">${s.html}</div>`
      else if(s.type==='step')se.innerHTML+=s.html
      else if(s.type==='result'){let d=document.createElement('div');d.className='result-block';d.style.padding='12px 0';d.innerHTML=`<strong style="color:var(--primary);font-size:16px">${s.text}</strong>`;se.appendChild(d)}
    })
  }
}
window.LSPolyAlgorithm=LSPolyAlgorithm
})()
