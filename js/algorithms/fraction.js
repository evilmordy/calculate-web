(function(){
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);if(a===0&&b===0)return 1;if(a===0)return b;if(b===0)return a;while(b){let t=b;b=a%b;a=t}return a}

class Fraction{
constructor(num,den){
if(den===void 0)den=1
if(typeof num==='object'&&num&&'num'in num&&'den'in num){this.num=num.num;this.den=num.den;return}
if(den===0)throw Error('分母不能为零')
if(num===0){this.num=0;this.den=1;return}
if(den<0){num=-num;den=-den}
let g=gcd(Math.abs(num),Math.abs(den))
this.num=num/g;this.den=den/g}
clone(){return new Fraction(this.num,this.den)}
add(o){let b=o instanceof Fraction?o:new Fraction(o,1);return new Fraction(this.num*b.den+b.num*this.den,this.den*b.den)}
sub(o){let b=o instanceof Fraction?o:new Fraction(o,1);return new Fraction(this.num*b.den-b.num*this.den,this.den*b.den)}
mul(o){let b=o instanceof Fraction?o:new Fraction(o,1);return new Fraction(this.num*b.num,this.den*b.den)}
div(o){let b=o instanceof Fraction?o:new Fraction(o,1);if(b.num===0)throw Error('除数不能为零');return new Fraction(this.num*b.den,this.den*b.num)}
neg(){return new Fraction(-this.num,this.den)}
abs(){return new Fraction(Math.abs(this.num),this.den)}
equals(o){let b=o instanceof Fraction?o:new Fraction(o,1);return this.num*b.den===b.num*this.den}
toFloat(){return this.num/this.den}
isZero(){return this.num===0}
toString(){return this.den===1?String(this.num):this.num<0?`-${Math.abs(this.num)}/${this.den}`:`${this.num}/${this.den}`}
}

function cloneFracMatrix(mat){return mat.map(row=>row.map(f=>new Fraction(f)))}
function fracAbsGt(a,b){return Math.abs(a.num)*b.den>Math.abs(b.num)*a.den}
function roundTo(v,d){let f=Math.pow(10,d);return Math.round(v*f)/f}

function parseInput(str){
str=str.trim();if(!str)return null
if(str.includes('/')){
let p=str.split('/');if(p.length!==2)return null
let n=parseInt(p[0],10),d=parseInt(p[1],10)
if(isNaN(n)||isNaN(d)||d===0)return null
return{type:'frac',value:new Fraction(n,d)}}
let v=parseFloat(str);if(isNaN(v))return null
if(Number.isInteger(v))return{type:'frac',value:new Fraction(v,1)}
let sv=v.toString();if(sv.includes('e'))return{type:'float',value:v}
let dc=sv.includes('.')?sv.split('.')[1].length:0
if(dc>6)return{type:'float',value:v}
let d=Math.pow(10,dc);return{type:'frac',value:new Fraction(Math.round(v*d),d)}}

function fmtFrac(f){
if(f.den===1)return String(f.num)
let s=f.num<0?'−':''
return `${s}<span class="frac-stack"><span class="frac-num">${Math.abs(f.num)}</span><span class="frac-bar"></span><span class="frac-den">${f.den}</span></span>`}

function fmtInline(f){
if(f.den===1)return String(f.num)
return f.num<0?`−${Math.abs(f.num)}/${f.den}`:`${f.num}/${f.den}`}

function fracMatHTML(m){
let h='<div class="matrix-display"><span class="bracket left">[</span><table class="matrix-table"><tbody>'
for(let i=0;i<m.length;i++){h+='<tr>';for(let j=0;j<m[0].length;j++)h+=`<td>${fmtFrac(m[i][j])}</td>`;h+='</tr>'}
h+='</tbody></table><span class="bracket right">]</span></div>';return h}

function vecFracHTML(v){
let h='<div class="matrix-display"><span class="bracket left">[</span><table class="matrix-table"><tbody>'
for(let i=0;i<v.length;i++)h+=`<tr><td>${fmtFrac(v[i])}</td></tr>`
h+='</tbody></table><span class="bracket right">]</span></div>';return h}

function floatMatHTML(m){
let h='<div class="matrix-display"><span class="bracket left">[</span><table class="matrix-table"><tbody>'
for(let i=0;i<m.length;i++){h+='<tr>';for(let j=0;j<m[0].length;j++)h+=`<td>${roundTo(m[i][j],4)}</td>`;h+='</tr>'}
h+='</tbody></table><span class="bracket right">]</span></div>';return h}

function floatVecHTML(v){
let h='<div class="matrix-display"><span class="bracket left">[</span><table class="matrix-table"><tbody>'
for(let i=0;i<v.length;i++)h+=`<tr><td>${roundTo(v[i],4)}</td></tr>`
h+='</tbody></table><span class="bracket right">]</span></div>';return h}

function makeGrid(id,rows,cols,ph){
let c=document.getElementById(id);c.innerHTML=''
let w=document.createElement('div');w.className='matrix-display'
let l=document.createElement('span');l.className='bracket left';l.textContent='[';w.appendChild(l)
let t=document.createElement('table');t.className='matrix-table input-mode'
for(let i=0;i<rows;i++){let tr=document.createElement('tr')
for(let j=0;j<cols;j++){let td=document.createElement('td')
let inp=document.createElement('input');inp.type='text';inp.className='matrix-input';inp.placeholder=ph(i,j)
td.appendChild(inp);tr.appendChild(td)}
t.appendChild(tr)}
w.appendChild(t)
let r=document.createElement('span');r.className='bracket right';r.textContent=']';w.appendChild(r)
c.appendChild(w)}

function readGrid(id,rows,cols){
let inp=document.getElementById(id).querySelectorAll('.matrix-input');if(!inp.length)return null
let m=[];let idx=0
for(let i=0;i<rows;i++){let r=[]
for(let j=0;j<cols;j++){let p=parseInput(inp[idx].value);if(!p)return null;r.push(p);idx++}
m.push(r)}
return m}

function parsedToFracMatrix(p){return p.map(row=>row.map(x=>x.value.clone()))}
function parsedToFracVector(p){return p.map(row=>row[0].value.clone())}
function parsedToFloatMatrix(p){return p.map(row=>row.map(x=>x.type==='frac'?x.value.toFloat():x.value))}
function parsedToFloatVector(p){return p.map(row=>row[0].type==='frac'?row[0].value.toFloat():row[0].value)}
function checkAllFrac(p){return p.every(row=>row.every(x=>x.type==='frac'))}

window.Fraction=Fraction
window.FracTools={
cloneMatrix:cloneFracMatrix,absGt:fracAbsGt,parseInput:parseInput,roundTo:roundTo,
fmtD:fmtFrac,fmtI:fmtInline,fracMatHTML:fracMatHTML,vecFracHTML:vecFracHTML,
floatMatHTML:floatMatHTML,floatVecHTML:floatVecHTML,
makeGrid:makeGrid,readGrid:readGrid,
parsedToFracMatrix:parsedToFracMatrix,parsedToFracVector:parsedToFracVector,
parsedToFloatMatrix:parsedToFloatMatrix,parsedToFloatVector:parsedToFloatVector,
checkAllFrac:checkAllFrac}
})()
