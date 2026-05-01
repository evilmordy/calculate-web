(function(){
class LagrangeAlgorithm extends window.Algorithm{
  constructor(){super({name:'Lagrange 插值',description:'用拉格朗日插值公式构造插值多项式，计算给定点处的函数值',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l6-16 4 12 4-10 4 14"/><circle cx="7" cy="5" r="1.5" fill="currentColor" stroke="none"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入数据</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">数据点数 n</label><input type="number" class="form-input" id="lg-n" min="2" max="10" step="1" style="width:80px" value="3"></div>
        <div class="form-group"><label class="form-label">数据点 (x<sub>i</sub>, y<sub>i</sub>)</label><div id="lg-grid"></div></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="lg-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>求解插值函数</button></div>
        <div class="form-error" id="lg-error"></div>
      </div></div>
      <div class="algo-card" id="lg-poly-card" style="display:none"><div class="algo-card-header">插值多项式</div><div class="algo-card-body"><div id="lg-poly-steps"></div></div></div>
      <div class="algo-card" id="lg-sub-card" style="display:none"><div class="algo-card-header">求值</div><div class="algo-card-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">小题(1): 已知 x 求 f(x)</label>
            <div style="display:flex;gap:8px"><input type="text" class="form-input" id="lg-x" style="flex:1;width:auto">
            <button class="btn btn-primary" id="lg-calc-x" style="padding:8px 16px;font-size:13px">计算</button></div>
            <div id="lg-x-result" style="margin-top:8px;font-size:15px;font-weight:600;color:var(--primary)"></div>
          </div>
          <div class="form-group"><label class="form-label">小题(2): 已知 y 求 x (反插值)</label>
            <div style="display:flex;gap:8px"><input type="text" class="form-input" id="lg-y" style="flex:1;width:auto">
            <button class="btn btn-primary" id="lg-calc-y" style="padding:8px 16px;font-size:13px">计算</button></div>
            <div id="lg-y-result" style="margin-top:8px;font-size:15px;font-weight:600;color:var(--primary)"></div>
            <div id="lg-y-steps" style="margin-top:8px"></div>
          </div>
        </div>
      </div></div>`
    let n=3
    let gen=()=>{let c=document.getElementById('lg-grid');c.innerHTML='';let w=document.createElement('div');w.className='matrix-display';let l=document.createElement('span');l.className='bracket left';l.textContent='[';w.appendChild(l);let t=document.createElement('table');t.className='matrix-table input-mode'
    for(let i=0;i<n;i++){let tr=document.createElement('tr');let td0=document.createElement('td');let inp0=document.createElement('input');inp0.type='text';inp0.className='matrix-input';inp0.placeholder=`x<sub>${i}</sub>`;td0.appendChild(inp0);tr.appendChild(td0);let td1=document.createElement('td');let inp1=document.createElement('input');inp1.type='text';inp1.className='matrix-input';inp1.placeholder=`y<sub>${i}</sub>`;td1.appendChild(inp1);tr.appendChild(td1);t.appendChild(tr)}
    w.appendChild(t);let r=document.createElement('span');r.className='bracket right';r.textContent=']';w.appendChild(r);c.appendChild(w)}
    gen()
    document.getElementById('lg-n').addEventListener('change',e=>{n=Math.min(Math.max(parseInt(e.target.value,10)||3,2),10);gen()})
    document.getElementById('lg-calc').addEventListener('click',()=>this.buildPoly())
    document.getElementById('lg-calc-x').addEventListener('click',()=>this.evalX())
    document.getElementById('lg-calc-y').addEventListener('click',()=>this.evalY())
  }
  buildPoly(){
    let errEl=document.getElementById('lg-error');errEl.classList.remove('visible');errEl.textContent=''
    let n=parseInt(document.getElementById('lg-n').value,10);if(isNaN(n)||n<2||n>10){errEl.textContent='数据点数必须在 2~10';errEl.classList.add('visible');return}
    let inp=document.getElementById('lg-grid').querySelectorAll('.matrix-input');let xs=[],ys=[],allFrac=true
    for(let i=0;i<n;i++){
      let xv=inp[i*2].value.trim(),yv=inp[i*2+1].value.trim()
      if(!xv||!yv){errEl.textContent='请填写所有输入框';errEl.classList.add('visible');return}
      let px=window.FracTools.parseInput(xv);if(!px){errEl.textContent=`x${i} 输入无效`;errEl.classList.add('visible');return}
      let py=window.FracTools.parseInput(yv);if(!py){errEl.textContent=`y${i} 输入无效`;errEl.classList.add('visible');return}
      if(px.type==='float'||py.type==='float')allFrac=false
      xs.push(px);ys.push(py)}
    this.resultData={xs,ys,allFrac,n}
    allFrac?this.buildPolyFrac(xs.map(x=>x.value.clone()),ys.map(y=>y.value.clone())):this.buildPolyFloat(xs.map(x=>x.type==='frac'?x.value.toFloat():x.value),ys.map(y=>y.type==='frac'?y.value.toFloat():y.value))
  }
  buildPolyFrac(x,y){
    let n=x.length,F=window.Fraction,fi=window.FracTools.fmtI,steps=[]
    steps.push({type:'header',text:'构造 Lagrange 基函数 l<sub>i</sub>(x)'})
    let denoms=[]
    for(let i=0;i<n;i++){let d=new F(1);for(let j=0;j<n;j++)if(j!==i)d=d.mul(x[i].sub(x[j]));denoms.push(d)}
    let st=''
    for(let i=0;i<n;i++){let numE='',denE=''
    for(let j=0;j<n;j++)if(j!==i){numE+=`(x−${fi(x[j])})`;denE+=`(${fi(x[i])}−${fi(x[j])})`}
    st+=this.stepHTML(`l<sub>${i}</sub>(x) = ${numE} / [${denE}]`)}
    steps.push({type:'html',html:st})

    steps.push({type:'header',text:`L<sub>${n-1}</sub>(x) = Σ y<sub>i</sub>·l<sub>i</sub>(x)`})
    let coeffs=[];for(let d=0;d<n;d++)coeffs.push(new F(0))
    for(let i=0;i<n;i++){
      let tc=[y[i].clone()]
      for(let j=0;j<n;j++){if(j===i)continue
      let ntc=[];for(let d=0;d<=tc.length;d++)ntc.push(new F(0))
      for(let d=0;d<tc.length;d++){ntc[d+1]=ntc[d+1].add(tc[d]);ntc[d]=ntc[d].sub(tc[d].mul(x[j]))}
      tc=ntc}
      for(let d=0;d<tc.length;d++)coeffs[d]=coeffs[d].add(tc[d].div(denoms[i]))}
    let polyStr=''
    for(let d=0;d<n;d++){if(coeffs[d].isZero())continue;let v=coeffs[d]
    if(polyStr===''&&v.num<0)polyStr='− ';else if(polyStr!=='')polyStr+=v.num>=0?' + ':' − '
    let vAbs=v.abs(),show=d===0||!vAbs.equals(new F(1))
    if(show)polyStr+=fi(vAbs)
    if(d===1)polyStr+='x';else if(d>1)polyStr+=`x<sup>${d}</sup>`}
    if(polyStr==='')polyStr='0'
    steps.push({type:'poly',html:this.polyHTML(`L<sub>${n-1}</sub>(x) = ${polyStr}`)})
    document.getElementById('lg-poly-card').style.display='block'
    document.getElementById('lg-poly-steps').innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;document.getElementById('lg-poly-steps').appendChild(d)}
      else {document.getElementById('lg-poly-steps').innerHTML+=s.html||s.htmlHTML}
    })

    this.resultData.x=x;this.resultData.y=y;this.resultData.coeffs=coeffs;this.resultData.isFrac=true
    document.getElementById('lg-sub-card').style.display='block'
    document.getElementById('lg-x-result').innerHTML=''
    document.getElementById('lg-y-result').innerHTML=''
    document.getElementById('lg-y-steps').innerHTML=''
  }
  buildPolyFloat(x,y){
    let n=x.length,F=f=>window.FracTools.roundTo(f,4),R=f=>f.toFixed(6).replace(/\.?0+$/,''),steps=[]
    steps.push({type:'header',text:'构造 Lagrange 基函数 l<sub>i</sub>(x)（小数模式）'})
    let denoms=[]
    for(let i=0;i<n;i++){let d=1;for(let j=0;j<n;j++)if(j!==i)d*=(x[i]-x[j]);denoms.push(d)}
    let coeffs=[];for(let d=0;d<n;d++)coeffs.push(0)
    for(let i=0;i<n;i++){
      let tc=[y[i]]
      for(let j=0;j<n;j++){if(j===i)continue
      let ntc=[];for(let d=0;d<=tc.length;d++)ntc.push(0)
      for(let d=0;d<tc.length;d++){ntc[d+1]+=tc[d];ntc[d]-=tc[d]*x[j]}
      tc=ntc}
      for(let d=0;d<tc.length;d++)coeffs[d]+=tc[d]/denoms[i]}
    let polyStr=''
    for(let d=0;d<n;d++){if(Math.abs(coeffs[d])<1e-10)continue;let v=coeffs[d]
    if(polyStr===''&&v<0)polyStr='− ';else if(polyStr!=='')polyStr+=v>=0?' + ':' − '
    let vAbs=Math.abs(v),show=d===0||Math.abs(vAbs-1)>1e-10
    if(show)polyStr+=R(vAbs)
    if(d===1)polyStr+='x';else if(d>1)polyStr+=`x<sup>${d}</sup>`}
    if(polyStr==='')polyStr='0'
    steps.push({type:'poly',html:this.polyHTML(`L<sub>${n-1}</sub>(x) = ${polyStr}`)})
    document.getElementById('lg-poly-card').style.display='block'
    document.getElementById('lg-poly-steps').innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;document.getElementById('lg-poly-steps').appendChild(d)}
      else document.getElementById('lg-poly-steps').innerHTML+=s.html
    })
    this.resultData.x=x;this.resultData.y=y;this.resultData.coeffsFloat=coeffs;this.resultData.isFrac=false
    document.getElementById('lg-sub-card').style.display='block'
    document.getElementById('lg-x-result').innerHTML=''
    document.getElementById('lg-y-result').innerHTML=''
    document.getElementById('lg-y-steps').innerHTML=''
  }
  evalX(){
    let rd=this.resultData;if(!rd){document.getElementById('lg-error').textContent='请先求解插值函数';document.getElementById('lg-error').classList.add('visible');return}
    let ts=document.getElementById('lg-x').value.trim()
    let pt=window.FracTools.parseInput(ts);if(!pt){document.getElementById('lg-error').textContent='x 输入无效';document.getElementById('lg-error').classList.add('visible');return}
    if(rd.isFrac){
      let v=pt.value,sum=new window.Fraction(0)
      for(let d=0;d<rd.coeffs.length;d++)sum=sum.add(rd.coeffs[d].mul(new window.Fraction(Math.pow(v.num,d),Math.pow(v.den,d))))
      document.getElementById('lg-x-result').innerHTML=`f(${window.FracTools.fmtI(v)}) ≈ ${window.FracTools.fmtI(sum)} = ${sum.toFloat().toFixed(8)}`
    }else{
      let v=pt.type==='frac'?pt.value.toFloat():pt.value,sum=0
      for(let d=0;d<rd.coeffsFloat.length;d++)sum+=rd.coeffsFloat[d]*Math.pow(v,d)
      document.getElementById('lg-x-result').innerHTML=`f(${v}) ≈ ${window.FracTools.roundTo(sum,8)}`
    }
  }
  evalY(){
    let rd=this.resultData;if(!rd){document.getElementById('lg-error').textContent='请先求解插值函数';document.getElementById('lg-error').classList.add('visible');return}
    let ts=document.getElementById('lg-y').value.trim()
    let pt=window.FracTools.parseInput(ts);if(!pt){document.getElementById('lg-error').textContent='y 输入无效';document.getElementById('lg-error').classList.add('visible');return}
    if(rd.isFrac){
      let x=rd.x.map(v=>v.clone()),y=rd.y.map(v=>v.clone())
      let yt=pt.value.clone(),F=window.Fraction,fi=window.FracTools.fmtI
      let steps=[],div=[],nn=x.length
      for(let i=0;i<nn;i++){div[i]=[];div[i][0]=x[i].clone()}
      for(let i=1;i<nn;i++)for(let j=1;j<=i;j++)div[i][j]=div[i][j-1].sub(div[i-1][j-1]).div(y[i].sub(y[i-j]))
      let nCoef=[];nCoef[0]=div[0][0].clone();for(let i=1;i<nn;i++)nCoef[i]=div[i][i].clone()
      let result=new F(0)
      for(let k=0;k<nn;k++){let p=nCoef[k].clone();for(let j=0;j<k;j++)p=p.mul(yt.sub(y[j]));result=result.add(p)}
      let poly=`N<sub>${nn-1}</sub>(y) = ${fi(nCoef[0])}`
      for(let k=1;k<nn;k++){poly+=` + ${nCoef[k].num<0?'− '+fi(nCoef[k].abs()):fi(nCoef[k])}`
      for(let j=0;j<k;j++)poly+=`(y − ${fi(y[j])})`}
      document.getElementById('lg-y-steps').innerHTML=`<div class="step-item backsub"><span class="step-marker">◈</span> 反插值: 交换数据点为 (y<sub>i</sub>, x<sub>i</sub>)，插值后<br>${poly}<br><strong>结果:</strong> x ≈ ${fi(result)} = ${result.toFloat().toFixed(8)}</div>`
      document.getElementById('lg-y-result').innerHTML=`x ≈ ${window.FracTools.fmtI(result)} = ${result.toFloat().toFixed(8)}`
    }else{
      let x=rd.x,y=rd.y,yt=pt.type==='frac'?pt.value.toFloat():pt.value,F=f=>window.FracTools.roundTo(f,6),R=f=>f.toFixed(6).replace(/\.?0+$/,'')
      let div=[],nn=x.length
      for(let i=0;i<nn;i++){div[i]=[];div[i][0]=x[i]}
      for(let i=1;i<nn;i++)for(let j=1;j<=i;j++)div[i][j]=(div[i][j-1]-div[i-1][j-1])/(y[i]-y[i-j])
      let nCoef=[];nCoef[0]=div[0][0];for(let i=1;i<nn;i++)nCoef[i]=div[i][i]
      let result=0
      for(let k=0;k<nn;k++){let p=nCoef[k];for(let j=0;j<k;j++)p*=(yt-y[j]);result+=p}
      let poly=`N<sub>${nn-1}</sub>(y) = ${R(nCoef[0])}`
      for(let k=1;k<nn;k++){poly+=` + ${nCoef[k]<0?'− '+R(-nCoef[k]):R(nCoef[k])}`
      for(let j=0;j<k;j++)poly+=`(y − ${F(y[j])})`}
      document.getElementById('lg-y-steps').innerHTML=`<div class="step-item backsub"><span class="step-marker">◈</span> 反插值: 交换数据点为 (y<sub>i</sub>, x<sub>i</sub>)，插值后<br>${poly}<br><strong>结果:</strong> x ≈ ${F(result)}</div>`
      document.getElementById('lg-y-result').innerHTML=`x ≈ ${F(result)}`
    }
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  polyHTML(text){return`<div class="step-item backsub" style="font-size:15px;font-weight:600;color:var(--primary)">${text}</div>`}
}
window.LagrangeAlgorithm=LagrangeAlgorithm
})()
