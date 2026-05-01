(function(){
class NewtonInterpAlgorithm extends window.Algorithm{
  constructor(){super({name:'Newton 均差插值',description:'用牛顿均差插值公式构造插值多项式并计算函数值',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M6 14l3-5 3 4 3-6 3 8"/><text x="10" y="21" font-size="10" fill="currentColor" stroke="none" font-family="serif" font-style="italic">f[x<sub>i</sub>,...,x<sub>j</sub>]</text></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入数据</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">数据点数 n</label><input type="number" class="form-input" id="ni-n" min="2" max="10" step="1" style="width:80px" value="3"></div>
        <div class="form-group"><label class="form-label">数据点 (x<sub>i</sub>, f<sub>i</sub>)</label><div id="ni-grid"></div></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="ni-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>求解插值函数</button></div>
        <div class="form-error" id="ni-error"></div>
      </div></div>
      <div class="algo-card" id="ni-poly-card" style="display:none"><div class="algo-card-header">插值多项式</div><div class="algo-card-body"><div id="ni-poly-steps"></div></div></div>
      <div class="algo-card" id="ni-sub-card" style="display:none"><div class="algo-card-header">求值</div><div class="algo-card-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">小题(1): 已知 x 求 f(x)</label>
            <div style="display:flex;gap:8px"><input type="text" class="form-input" id="ni-x" style="flex:1;width:auto">
            <button class="btn btn-primary" id="ni-calc-x" style="padding:8px 16px;font-size:13px">计算</button></div>
            <div id="ni-x-result" style="margin-top:8px;font-size:15px;font-weight:600;color:var(--primary)"></div>
          </div>
          <div class="form-group"><label class="form-label">小题(2): 已知 y 求 x (反插值)</label>
            <div style="display:flex;gap:8px"><input type="text" class="form-input" id="ni-y" style="flex:1;width:auto">
            <button class="btn btn-primary" id="ni-calc-y" style="padding:8px 16px;font-size:13px">计算</button></div>
            <div id="ni-y-result" style="margin-top:8px;font-size:15px;font-weight:600;color:var(--primary)"></div>
          </div>
        </div>
      </div></div>`
    let n=3
    let gen=()=>{let c=document.getElementById('ni-grid');c.innerHTML='';let w=document.createElement('div');w.className='matrix-display';let l=document.createElement('span');l.className='bracket left';l.textContent='[';w.appendChild(l);let t=document.createElement('table');t.className='matrix-table input-mode'
    for(let i=0;i<n;i++){let tr=document.createElement('tr')
    for(let j=0;j<2;j++){let td=document.createElement('td');let inp=document.createElement('input');inp.type='text';inp.className='matrix-input';inp.placeholder=j===0?`x<sub>${i}</sub>`:`f<sub>${i}</sub>`;td.appendChild(inp);tr.appendChild(td)}t.appendChild(tr)}
    w.appendChild(t);let r=document.createElement('span');r.className='bracket right';r.textContent=']';w.appendChild(r);c.appendChild(w)}
    gen()
    document.getElementById('ni-n').addEventListener('change',e=>{n=Math.min(Math.max(parseInt(e.target.value,10)||3,2),10);gen()})
    document.getElementById('ni-calc').addEventListener('click',()=>this.buildPoly())
    document.getElementById('ni-calc-x').addEventListener('click',()=>this.evalX())
    document.getElementById('ni-calc-y').addEventListener('click',()=>this.evalY())
  }
  buildPoly(){
    let e=document.getElementById('ni-error');e.classList.remove('visible');e.textContent=''
    let n=parseInt(document.getElementById('ni-n').value,10);if(isNaN(n)||n<2||n>10){e.textContent='数据点数必须在 2~10';e.classList.add('visible');return}
    let inp=document.getElementById('ni-grid').querySelectorAll('.matrix-input');let xs=[],ys=[],allFrac=true
    for(let i=0;i<n;i++){let xv=inp[i*2].value.trim(),yv=inp[i*2+1].value.trim();if(!xv||!yv){e.textContent='请填写所有输入框';e.classList.add('visible');return}
    let px=window.FracTools.parseInput(xv);if(!px){e.textContent=`x${i} 输入无效`;e.classList.add('visible');return}
    let py=window.FracTools.parseInput(yv);if(!py){e.textContent=`f${i} 输入无效`;e.classList.add('visible');return}
    if(px.type==='float'||py.type==='float')allFrac=false;xs.push(px);ys.push(py)}
    this.resultData={xs,ys,allFrac,n}
    allFrac?this.buildPolyFrac(xs.map(x=>x.value.clone()),ys.map(y=>y.value.clone())):this.buildPolyFloat(xs.map(x=>x.type==='frac'?x.value.toFloat():x.value),ys.map(y=>y.type==='frac'?y.value.toFloat():y.value))
  }
  buildPolyFrac(x,y){
    let n=x.length,F=window.Fraction,fi=window.FracTools.fmtI,steps=[],div=[]
    steps.push({type:'header',text:'一、构建均差表'})
    for(let i=0;i<n;i++){div[i]=[];div[i][0]=y[i].clone()}
    for(let i=1;i<n;i++)for(let j=1;j<=i;j++)div[i][j]=div[i][j-1].sub(div[i-1][j-1]).div(x[i].sub(x[i-j]))
    let h='<table class="result-table"><thead><tr><th>i</th><th>x<sub>i</sub></th><th>f[<sub></sub>]</th>'
    for(let j=1;j<n;j++){let sub='';for(let t=0;t<=j;t++)sub+=`<sub>${t}</sub>`;h+=`<th>f[<sub>0</sub>,${sub}]</th>`}
    h+='</tr></thead><tbody>'
    for(let i=0;i<n;i++){h+='<tr>';h+=`<td>${i}</td><td>${fi(x[i])}</td>`;for(let j=0;j<=i;j++)h+=`<td>${fi(div[i][j])}</td>`;h+='</tr>'}
    h+='</tbody></table>';steps.push({type:'html',html:h})
    steps.push({type:'header',text:`二、Newton 插值多项式 N<sub>${n-1}</sub>(x)`})
    let nCoef=[];nCoef[0]=div[0][0].clone();for(let i=1;i<n;i++)nCoef[i]=div[i][i].clone()
    let newtonStr=`N<sub>${n-1}</sub>(x) = ${fi(nCoef[0])}`
    for(let k=1;k<n;k++){let sign=nCoef[k].num<0?' − ':' + ';newtonStr+=sign+(nCoef[k].num<0?fi(nCoef[k].abs()):fi(nCoef[k]))
    for(let j=0;j<k;j++)newtonStr+=`(x − ${fi(x[j])})`}
    let coeffs=[];for(let d=0;d<n;d++)coeffs.push(new F(0))
    for(let k=0;k<n;k++){let tc=[nCoef[k].clone()]
    for(let j=0;j<k;j++){let ntc=[];for(let d=0;d<=tc.length;d++)ntc.push(new F(0))
    for(let d=0;d<tc.length;d++){ntc[d+1]=ntc[d+1].add(tc[d]);ntc[d]=ntc[d].sub(tc[d].mul(x[j]))}tc=ntc}
    for(let d=0;d<tc.length;d++)coeffs[d]=coeffs[d].add(tc[d])}
    let polyStr=''
    for(let d=0;d<n;d++){if(coeffs[d].isZero())continue;let v=coeffs[d]
    if(polyStr===''&&v.num<0)polyStr='− ';else if(polyStr!=='')polyStr+=v.num>=0?' + ':' − '
    let show=d===0||!v.abs().equals(new F(1));if(show)polyStr+=fi(v.abs())
    if(d===1)polyStr+='x';else if(d>1)polyStr+=`x<sup>${d}</sup>`}
    if(polyStr==='')polyStr='0'
    steps.push({type:'poly',html:this.stepHTML(newtonStr)+this.polyExpandHTML(`= ${polyStr}`)})
    document.getElementById('ni-poly-card').style.display='block'
    document.getElementById('ni-poly-steps').innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;document.getElementById('ni-poly-steps').appendChild(d)}
      else document.getElementById('ni-poly-steps').innerHTML+=s.html||s.htmlHTML||''
    })
    this.resultData.x=x;this.resultData.y=y;this.resultData.nCoef=nCoef;this.resultData.coeffs=coeffs;this.resultData.isFrac=true
    document.getElementById('ni-sub-card').style.display='block'
    document.getElementById('ni-x-result').innerHTML='';document.getElementById('ni-y-result').innerHTML=''
  }
  buildPolyFloat(x,y){
    let n=x.length,F=f=>window.FracTools.roundTo(f,6),R=f=>f.toFixed(6).replace(/\.?0+$/,''),steps=[],div=[]
    steps.push({type:'header',text:'一、构建均差表'})
    for(let i=0;i<n;i++){div[i]=[];div[i][0]=y[i]}
    for(let i=1;i<n;i++)for(let j=1;j<=i;j++)div[i][j]=(div[i][j-1]-div[i-1][j-1])/(x[i]-x[i-j])
    let h='<table class="result-table"><thead><tr><th>i</th><th>x<sub>i</sub></th><th>f[<sub></sub>]</th>'
    for(let j=1;j<n;j++){let sub='';for(let t=0;t<=j;t++)sub+=`<sub>${t}</sub>`;h+=`<th>f[<sub>0</sub>,${sub}]</th>`}
    h+='</tr></thead><tbody>'
    for(let i=0;i<n;i++){h+='<tr>';h+=`<td>${i}</td><td>${F(x[i])}</td>`;for(let j=0;j<=i;j++)h+=`<td>${F(div[i][j])}</td>`;h+='</tr>'}
    h+='</tbody></table>';steps.push({type:'html',html:h})
    steps.push({type:'header',text:`二、Newton 插值多项式 N<sub>${n-1}</sub>(x)`})
    let nCoef=[];nCoef[0]=div[0][0];for(let i=1;i<n;i++)nCoef[i]=div[i][i]
    let newtonStr=`N<sub>${n-1}</sub>(x) = ${R(nCoef[0])}`
    for(let k=1;k<n;k++){let sign=nCoef[k]<0?' − ':' + ';newtonStr+=sign+(nCoef[k]<0?R(-nCoef[k]):R(nCoef[k]))
    for(let j=0;j<k;j++)newtonStr+=`(x − ${F(x[j])})`}
    let coeffs=[];for(let d=0;d<n;d++)coeffs.push(0)
    for(let k=0;k<n;k++){let tc=[nCoef[k]];for(let j=0;j<k;j++){let ntc=[],L=tc.length
    for(let d=0;d<=L;d++)ntc.push(0);for(let d=0;d<L;d++){ntc[d+1]+=tc[d];ntc[d]-=tc[d]*x[j]}tc=ntc}
    for(let d=0;d<tc.length;d++)coeffs[d]+=tc[d]}
    let polyStr=''
    for(let d=0;d<n;d++){if(Math.abs(coeffs[d])<1e-10)continue;let v=coeffs[d]
    if(polyStr===''&&v<0)polyStr='− ';else if(polyStr!=='')polyStr+=v>=0?' + ':' − '
    let show=d===0||Math.abs(Math.abs(v)-1)>1e-10;if(show)polyStr+=R(Math.abs(v))
    if(d===1)polyStr+='x';else if(d>1)polyStr+=`x<sup>${d}</sup>`}
    if(polyStr==='')polyStr='0'
    steps.push({type:'poly',html:this.stepHTML(newtonStr)+this.polyExpandHTML(`= ${polyStr}`)})
    document.getElementById('ni-poly-card').style.display='block'
    document.getElementById('ni-poly-steps').innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;document.getElementById('ni-poly-steps').appendChild(d)}
      else document.getElementById('ni-poly-steps').innerHTML+=s.html||''
    })
    this.resultData.x=x;this.resultData.y=y;this.resultData.nCoef=nCoef;this.resultData.coeffsFloat=coeffs;this.resultData.isFrac=false
    document.getElementById('ni-sub-card').style.display='block'
    document.getElementById('ni-x-result').innerHTML='';document.getElementById('ni-y-result').innerHTML=''
  }
  evalX(){
    let rd=this.resultData;if(!rd){document.getElementById('ni-error').textContent='请先求解插值函数';document.getElementById('ni-error').classList.add('visible');return}
    let ts=document.getElementById('ni-x').value.trim()
    let pt=window.FracTools.parseInput(ts);if(!pt){document.getElementById('ni-error').textContent='x 输入无效';document.getElementById('ni-error').classList.add('visible');return}
    let el=document.getElementById('ni-x-result')
    if(rd.isFrac){
      let v=pt.value.clone(),F=window.Fraction,r=new F(0)
      for(let k=0;k<rd.nCoef.length;k++){let p=rd.nCoef[k].clone();for(let j=0;j<k;j++)p=p.mul(v.sub(rd.x[j]));r=r.add(p)}
      el.innerHTML=`f(${window.FracTools.fmtI(v)}) ≈ ${window.FracTools.fmtI(r)} = ${r.toFloat().toFixed(8)}`
    }else{
      let v=pt.type==='frac'?pt.value.toFloat():pt.value,r=0,F=f=>window.FracTools.roundTo(f,8)
      for(let k=0;k<rd.nCoef.length;k++){let p=rd.nCoef[k];for(let j=0;j<k;j++)p*=(v-rd.x[j]);r+=p}
      el.innerHTML=`f(${v}) ≈ ${F(r)}`
    }
  }
  evalY(){
    let rd=this.resultData;if(!rd){document.getElementById('ni-error').textContent='请先求解插值函数';document.getElementById('ni-error').classList.add('visible');return}
    let ts=document.getElementById('ni-y').value.trim()
    let pt=window.FracTools.parseInput(ts);if(!pt){document.getElementById('ni-error').textContent='y 输入无效';document.getElementById('ni-error').classList.add('visible');return}
    let el=document.getElementById('ni-y-result')
    if(rd.isFrac){
      let y=rd.y.map(v=>v.clone()),x=rd.x.map(v=>v.clone()),yt=pt.value.clone(),F=window.Fraction,fi=window.FracTools.fmtI
      let div=[],nn=x.length
      for(let i=0;i<nn;i++){div[i]=[];div[i][0]=x[i].clone()}
      for(let i=1;i<nn;i++)for(let j=1;j<=i;j++)div[i][j]=div[i][j-1].sub(div[i-1][j-1]).div(y[i].sub(y[i-j]))
      let nCoef=[];nCoef[0]=div[0][0].clone();for(let i=1;i<nn;i++)nCoef[i]=div[i][i].clone()
      let r=new F(0)
      for(let k=0;k<nn;k++){let p=nCoef[k].clone();for(let j=0;j<k;j++)p=p.mul(yt.sub(y[j]));r=r.add(p)}
      el.innerHTML=`x ≈ ${fi(r)} = ${r.toFloat().toFixed(8)}`
    }else{
      let y=rd.y,x=rd.x,yt=pt.type==='frac'?pt.value.toFloat():pt.value,F=f=>window.FracTools.roundTo(f,8)
      let div=[],nn=x.length
      for(let i=0;i<nn;i++){div[i]=[];div[i][0]=x[i]}
      for(let i=1;i<nn;i++)for(let j=1;j<=i;j++)div[i][j]=(div[i][j-1]-div[i-1][j-1])/(y[i]-y[i-j])
      let nCoef=[];nCoef[0]=div[0][0];for(let i=1;i<nn;i++)nCoef[i]=div[i][i]
      let r=0
      for(let k=0;k<nn;k++){let p=nCoef[k];for(let j=0;j<k;j++)p*=(yt-y[j]);r+=p}
      el.innerHTML=`x ≈ ${F(r)}`
    }
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  polyExpandHTML(text){return`<div class="step-item backsub" style="font-size:15px;font-weight:600;color:var(--primary)">${text}</div>`}
}
window.NewtonInterpAlgorithm=NewtonInterpAlgorithm
})()
