(function(){
class HermiteAlgorithm extends window.Algorithm{
  constructor(){super({name:'Hermite 插值',description:'构造两点三次 Hermite 插值多项式，满足函数值和导数值条件',icon:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M6 14l3-5 3 4 3-6 3 8"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/></svg>`})}
  render(el){
    super.render(el)
    el.innerHTML=`
      <div class="algo-card"><div class="algo-card-header">输入数据</div><div class="algo-card-body">
        <div class="form-group"><label class="form-label">区间端点数（当前仅支持 2 点三次 Hermite）</label><input type="number" class="form-input" value="2" min="2" max="2" step="1" style="width:80px" readonly></div>
        <div class="form-group"><label class="form-label">x<sub>0</sub></label><input type="text" class="form-input" id="he-x0" placeholder="如 0"></div>
        <div class="form-group"><label class="form-label">f(x<sub>0</sub>)</label><input type="text" class="form-input" id="he-f0" placeholder="如 1"></div>
        <div class="form-group"><label class="form-label">f'(x<sub>0</sub>)</label><input type="text" class="form-input" id="he-df0" placeholder="如 2"></div>
        <div class="form-group"><label class="form-label">x<sub>1</sub></label><input type="text" class="form-input" id="he-x1" placeholder="如 1"></div>
        <div class="form-group"><label class="form-label">f(x<sub>1</sub>)</label><input type="text" class="form-input" id="he-f1" placeholder="如 1"></div>
        <div class="form-group"><label class="form-label">f'(x<sub>1</sub>)</label><input type="text" class="form-input" id="he-df1" placeholder="如 3"></div>
        <div style="margin-top:8px"><button class="btn btn-primary" id="he-calc"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始计算</button></div>
        <div class="form-error" id="he-error"></div>
      </div></div>
      <div class="algo-card" id="he-result" style="display:none"><div class="algo-card-header">计算过程与结果</div><div class="algo-card-body"><div id="he-steps"></div></div></div>`
    document.getElementById('he-calc').addEventListener('click',()=>this.start())
  }
  start(){
    let e=document.getElementById('he-error');e.classList.remove('visible');e.textContent=''
    let fields=['he-x0','he-f0','he-df0','he-x1','he-f1','he-df1']
    let vals={},allFrac=true
    for(let f of fields){
      let v=document.getElementById(f).value.trim();if(!v){e.textContent='请填写所有输入框';e.classList.add('visible');return}
      let p=window.FracTools.parseInput(v);if(!p){e.textContent=`${f} 输入无效`;e.classList.add('visible');return}
      if(p.type==='float')allFrac=false;vals[f]=p}
    let x0=vals['he-x0'],f0=vals['he-f0'],df0=vals['he-df0'],x1=vals['he-x1'],f1=vals['he-f1'],df1=vals['he-df1']
    if(allFrac){try{this.solveFrac(x0.value.clone(),f0.value.clone(),df0.value.clone(),x1.value.clone(),f1.value.clone(),df1.value.clone())}catch(ex){e.textContent='计算出错: '+ex.message;e.classList.add('visible')}}
    else this.solveFloat(x0.value.toFloat(),f0.value.toFloat(),df0.value.toFloat(),x1.value.toFloat(),f1.value.toFloat(),df1.value.toFloat())
  }
  solveFrac(x0,f0,df0,x1,f1,df1){
    let F=window.Fraction,steps=[],fi=window.FracTools.fmtI
    steps.push({type:'header',text:'一、Hermite 基函数'})
    steps.push({type:'step',html:this.stepHTML(`α<sub>0</sub>(x) = (1+2(x−x<sub>0</sub>)/(x<sub>1</sub>−x<sub>0</sub>))·((x−x<sub>1</sub>)/(x<sub>0</sub>−x<sub>1</sub>))²`)})
    steps.push({type:'step',html:this.stepHTML(`β<sub>0</sub>(x) = (x−x<sub>0</sub>)·((x−x<sub>1</sub>)/(x<sub>0</sub>−x<sub>1</sub>))²`)})
    steps.push({type:'step',html:this.stepHTML(`α<sub>1</sub>(x) = (1+2(x−x<sub>1</sub>)/(x<sub>0</sub>−x<sub>1</sub>))·((x−x<sub>0</sub>)/(x<sub>1</sub>−x<sub>0</sub>))²`)})
    steps.push({type:'step',html:this.stepHTML(`β<sub>1</sub>(x) = (x−x<sub>1</sub>)·((x−x<sub>0</sub>)/(x<sub>1</sub>−x<sub>0</sub>))²`)})
    steps.push({type:'header',text:'二、多项式 H(x) = Σ[f(x<sub>i</sub>)α<sub>i</sub>(x) + f\'(x<sub>i</sub>)β<sub>i</sub>(x)]'})
    let d=x1.sub(x0)
    steps.push({type:'step',html:this.stepHTML(`H(x) = ${fi(f0)}α<sub>0</sub>(x) + ${fi(df0)}β<sub>0</sub>(x) + ${fi(f1)}α<sub>1</sub>(x) + ${fi(df1)}β<sub>1</sub>(x)`)})
    steps.push({type:'header',text:'三、验算'})
    let testX=[x0,x1]
    testX.forEach(x=>{
      let t=(x.sub(x0)).toFloat()/d.toFloat()
      let a0=(1+2*t)*Math.pow(1-t,2),b0=t*d.toFloat()*Math.pow(1-t,2)
      let a1=(1+2*(1-t))*Math.pow(t,2),b1=-(1-t)*d.toFloat()*Math.pow(t,2)
      let hx=f0.toFloat()*a0+df0.toFloat()*b0+f1.toFloat()*a1+df1.toFloat()*b1
      steps.push({type:'step',html:this.stepHTML(`H(${fi(x)}) = ${hx.toFixed(6)} (期望: f(${fi(x)}) = ${(x.equals(x0)?fi(f0):fi(f1))})`)})
    })
    this.showSteps(steps)
  }
  solveFloat(x0,f0,df0,x1,f1,df1){
    let F=f=>window.FracTools.roundTo(f,6),steps=[]
    steps.push({type:'header',text:'一、Hermite 基函数（小数模式）'})
    let d=x1-x0
    steps.push({type:'step',html:this.stepHTML(`α<sub>0</sub>(x)=(1+2(x−${F(x0)})/${F(d)})·((x−${F(x1)})/(${F(x0)}−${F(x1)}))²`)})
    steps.push({type:'step',html:this.stepHTML(`β<sub>0</sub>(x)=(x−${F(x0)})·((x−${F(x1)})/(${F(x0)}−${F(x1)}))²`)})
    steps.push({type:'step',html:this.stepHTML(`H(x)=${F(f0)}α₀(x)+${F(df0)}β₀(x)+${F(f1)}α₁(x)+${F(df1)}β₁(x)`)})
    steps.push({type:'header',text:'二、验算 H(x₀), H\'(x₀), H(x₁), H\'(x₁)'})
    let test=[[x0,f0,df0],[x1,f1,df1]]
    test.forEach(([x,fval,dfval])=>{
      let t=(x-x0)/d,a0=(1+2*t)*Math.pow(1-t,2),b0=t*d*Math.pow(1-t,2)
      let a1=(1+2*(1-t))*Math.pow(t,2),b1=-(1-t)*d*Math.pow(t,2)
      let h=f0*a0+df0*b0+f1*a1+df1*b1
      steps.push({type:'step',html:this.stepHTML(`H(${F(x)}) = ${F(h)} (期望: ${F(fval)})`)})
    })
    this.showSteps(steps)
  }
  stepHTML(text){return`<div class="step-item backsub"><span class="step-marker">◈</span> ${text}</div>`}
  showSteps(steps){
    document.getElementById('he-result').style.display='block';let se=document.getElementById('he-steps');se.innerHTML=''
    steps.forEach(s=>{
      if(s.type==='header'){let d=document.createElement('div');d.className='step-header';d.innerHTML=s.text;se.appendChild(d)}
      else if(s.type==='step')se.innerHTML+=s.html
    })
  }
}
window.HermiteAlgorithm=HermiteAlgorithm
})()
