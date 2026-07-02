(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();var u=(g=>(g[g.EMPTY=0]="EMPTY",g[g.RED=1]="RED",g[g.BLUE=2]="BLUE",g))(u||{}),y=(g=>(g[g.NORMAL=0]="NORMAL",g[g.WALL=1]="WALL",g[g.SWAMP=2]="SWAMP",g))(y||{}),k=(g=>(g[g.NONE=0]="NONE",g[g.GENE_BOOST=1]="GENE_BOOST",g))(k||{}),E=(g=>(g.METEOR="meteor",g.GENE_BOOST="gene_boost",g.SWAMP_TERRAIN="swamp",g))(E||{});const P={survivalMin:2,survivalMax:3,birthCount:3},_=100,A={0:"#0a0e17",1:"#e63946",2:"#457b9d",WALL:"#2d3142",SWAMP:"#2d6a4f",GRID_LINE:"#151b2b",LEVIATHAN:"#9b5de5",GENE_BOOST:"#f9c74f"},N={meteor:{type:"meteor",name:"隕石打擊",description:"清除半徑5格內的所有細胞",cooldown:30,icon:"☄️"},gene_boost:{type:"gene_boost",name:"基因強化",description:"3x3區域內我方細胞20回合內不會擁擠死亡",cooldown:20,icon:"🧬"},swamp:{type:"swamp",name:"沼澤地形",description:"將區域轉化為沼澤，改變繁殖條件",cooldown:15,icon:"🌿"}},W=[0,1,2,5],G=50,L=500;class D{constructor(t){this.width=t.width,this.height=t.height;const e=this.width*this.height;this.cells=new Uint8Array(e),this.terrain=new Uint8Array(e),this.buffs=new Uint8Array(e),this.buffDurations=new Int16Array(e)}idx(t,e){return e*this.width+t}inBounds(t,e){return t>=0&&t<this.width&&e>=0&&e<this.height}getCell(t,e){return this.inBounds(t,e)?this.cells[this.idx(t,e)]:u.EMPTY}setCell(t,e,s){this.inBounds(t,e)&&(this.cells[this.idx(t,e)]=s)}getTerrain(t,e){return this.inBounds(t,e)?this.terrain[this.idx(t,e)]:y.NORMAL}setTerrain(t,e,s){this.inBounds(t,e)&&(this.terrain[this.idx(t,e)]=s)}getBuff(t,e){return this.inBounds(t,e)?this.buffs[this.idx(t,e)]:k.NONE}setBuff(t,e,s,i){if(!this.inBounds(t,e))return;const n=this.idx(t,e);this.buffs[n]=s,this.buffDurations[n]=i}clearBuff(t,e){if(!this.inBounds(t,e))return;const s=this.idx(t,e);this.buffs[s]=k.NONE,this.buffDurations[s]=0}tickBuffs(){for(let t=0;t<this.buffDurations.length;t++)this.buffDurations[t]>0&&(this.buffDurations[t]--,this.buffDurations[t]<=0&&(this.buffs[t]=k.NONE))}countNeighbors(t,e,s){let i=0;for(let n=-1;n<=1;n++)for(let r=-1;r<=1;r++){if(r===0&&n===0)continue;const o=t+r,a=e+n;this.inBounds(o,a)&&this.cells[this.idx(o,a)]===s&&i++}return i}countRed(){let t=0;for(let e=0;e<this.cells.length;e++)this.cells[e]===u.RED&&t++;return t}countBlue(){let t=0;for(let e=0;e<this.cells.length;e++)this.cells[e]===u.BLUE&&t++;return t}getCellsArray(){return this.cells}getTerrainArray(){return this.terrain}getBuffsArray(){return this.buffs}getBuffDurationsArray(){return this.buffDurations}setCellsFromBuffer(t){this.cells.set(t)}setBuffsFromBuffer(t){this.buffs.set(t)}setBuffDurationsFromBuffer(t){this.buffDurations.set(t)}clear(){this.cells.fill(0),this.terrain.fill(0),this.buffs.fill(0),this.buffDurations.fill(0)}clone(){const t=new D({width:this.width,height:this.height});return t.cells.set(this.cells),t.terrain.set(this.terrain),t.buffs.set(this.buffs),t.buffDurations.set(this.buffDurations),t}placeCellsRandom(t=.3){for(let e=0;e<this.height;e++)for(let s=0;s<this.width;s++)if(Math.random()<t){const i=Math.random()<.5?u.RED:u.BLUE;this.setCell(s,e,i)}}placeInitialPattern(){const t=Math.floor(this.width/2),e=.25;for(let s=0;s<this.height;s++)for(let i=0;i<t-5;i++)Math.random()<e&&this.setCell(i,s,u.RED);for(let s=0;s<this.height;s++)for(let i=t+5;i<this.width;i++)Math.random()<e&&this.setCell(i,s,u.BLUE)}toJSON(){return{width:this.width,height:this.height,cells:Array.from(this.cells),terrain:Array.from(this.terrain),version:"1.0.0"}}static fromJSON(t){const e=new D({width:t.width,height:t.height});return e.cells.set(new Uint8Array(t.cells)),e.terrain.set(new Uint8Array(t.terrain)),e}exportJSON(){return JSON.stringify(this.toJSON())}static importJSON(t){const e=JSON.parse(t);return D.fromJSON(e)}createDiffSnapshot(){return{cells:new Uint8Array(this.cells),terrain:new Uint8Array(this.terrain),buffs:new Uint8Array(this.buffs),buffDurations:new Int16Array(this.buffDurations)}}restoreFromSnapshot(t){this.cells.set(t.cells),this.terrain.set(t.terrain),this.buffs.set(t.buffs),this.buffDurations.set(t.buffDurations)}}class C{static countNeighbors(t,e,s,i,n,r){let o=0;for(let a=-1;a<=1;a++)for(let l=-1;l<=1;l++){if(l===0&&a===0)continue;const c=e+l,d=s+a;c>=0&&c<i&&d>=0&&d<n&&t[d*i+c]===r&&o++}return o}static getEffectiveBirthCount(t,e){switch(e){case y.SWAMP:return t+1;default:return t}}static getEffectiveSurvivalMax(t,e){switch(e){case k.GENE_BOOST:return t+1;default:return t}}static computeCell(t,e,s,i,n,r,o,a=P){const l=n*r+i,c=t[l],d=e[l],m=s[l];if(d===y.WALL)return u.EMPTY;const f=C.countNeighbors(t,i,n,r,o,u.RED),p=C.countNeighbors(t,i,n,r,o,u.BLUE);if(c!==u.EMPTY){const h=c===u.RED?f:p,b=C.getEffectiveSurvivalMax(a.survivalMax,m);return h<a.survivalMin||h>b?u.EMPTY:c}else{const h=C.getEffectiveBirthCount(a.birthCount,d),b=f===h,T=p===h;return b&&T?f>p?u.RED:p>f?u.BLUE:Math.random()<.5?u.RED:u.BLUE:b?u.RED:T?u.BLUE:u.EMPTY}}static computeNextGeneration(t,e,s,i,n,r=P){const o=i*n,a=new Uint8Array(o);for(let l=0;l<n;l++)for(let c=0;c<i;c++){const d=l*i+c;if(e[d]===y.WALL){a[d]=u.EMPTY;continue}a[d]=C.computeCell(t,e,s,c,l,i,n,r)}return a}static computeWithDiffs(t,e,s,i,n,r=P){const o=i*n,a=new Uint8Array(o),l=[],c=[];for(let d=0;d<n;d++)for(let m=0;m<i;m++){const f=d*i+m,p=e[f];let h;p===y.WALL?h=u.EMPTY:h=C.computeCell(t,e,s,m,d,i,n,r),h!==t[f]&&(l.push(f),c.push(t[f])),a[f]=h}return{newCells:a,changeIndices:l,oldValues:c}}static countCells(t){let e=0,s=0,i=0;for(let n=0;n<t.length;n++)switch(t[n]){case u.RED:e++;break;case u.BLUE:s++;break;default:i++;break}return{red:e,blue:s,empty:i}}static findHighestDensityZone(t,e,s,i,n=10){let r=0,o=0,a=0;const l=Math.floor(n/2);for(let c=l;c<i-l;c+=l)for(let d=l;d<s-l;d+=l){let m=0;for(let f=-l;f<l;f++)for(let p=-l;p<l;p++){const h=d+p,b=c+f;h>=0&&h<s&&b>=0&&b<i&&t[b*s+h]===e&&m++}m>a&&(a=m,r=d,o=c)}return{x:r,y:o,count:a}}}class O{constructor(){this.worker=null,this.requestId=0,this.pendingResolve=null,this.useWorker=!1,this.workerReady=!1,this.initWorker()}initWorker(){try{this.worker=new Worker(new URL("/cellular-automata-tactics-simulator/assets/GameWorker-C8ru4sYW.js",import.meta.url),{type:"module"}),this.worker.onmessage=t=>this.handleWorkerMessage(t),this.worker.onerror=t=>{console.warn("Worker error, falling back to main thread:",t),this.useWorker=!1},this.useWorker=!0,this.workerReady=!0}catch(t){console.warn("Web Worker not available, using main thread:",t),this.useWorker=!1}}handleWorkerMessage(t){const e=t.data;e.type==="result"&&e.id===this.requestId&&this.pendingResolve&&(this.pendingResolve({cells:new Uint8Array(e.cells),buffs:new Uint8Array(e.buffs),buffDurations:new Int16Array(e.buffDurations),changes:new Uint8Array(e.changes),redCount:e.redCount,blueCount:e.blueCount,computeTime:e.computeTime}),this.pendingResolve=null)}async computeNext(t,e=P){return this.useWorker&&this.worker&&this.workerReady?this.computeWithWorker(t,e):this.computeMainThread(t,e)}computeWithWorker(t,e){return new Promise(s=>{this.requestId++,this.pendingResolve=s;const i=new Uint8Array(t.getCellsArray()),n=new Uint8Array(t.getTerrainArray()),r=new Uint8Array(t.getBuffsArray()),o=new Int16Array(t.getBuffDurationsArray());this.worker.postMessage({id:this.requestId,type:"compute",cells:i.buffer,terrain:n.buffer,buffs:r.buffer,buffDurations:o.buffer,width:t.width,height:t.height,config:e},[i.buffer,n.buffer,r.buffer,o.buffer])})}computeMainThread(t,e){const s=performance.now(),i=t.getCellsArray(),n=t.getTerrainArray(),r=t.getBuffsArray(),o=t.getBuffDurationsArray(),a=t.width,l=t.height,c=a*l,d=new Uint8Array(r),m=new Int16Array(o);for(let x=0;x<c;x++)m[x]>0&&(m[x]--,m[x]<=0&&(d[x]=k.NONE));const{newCells:f,changeIndices:p,oldValues:h}=C.computeWithDiffs(i,n,d,a,l,e),b=[];for(let x=0;x<p.length;x++)b.push(p[x],h[x],f[p[x]]);const T=new Uint8Array(b),v=C.countCells(f),w=performance.now()-s;return{cells:f,buffs:d,buffDurations:m,changes:T,redCount:v.red,blueCount:v.blue,computeTime:w}}computeSync(t,e=P){return this.computeMainThread(t,e)}destroy(){this.worker&&(this.worker.terminate(),this.worker=null),this.useWorker=!1,this.workerReady=!1}}class F{constructor(){this.skills=new Map,this.activeFaction=u.RED;for(const t of Object.values(E)){const e=N[t];this.skills.set(t,{...e,currentCooldown:0})}}setActiveFaction(t){this.activeFaction=t}getActiveFaction(){return this.activeFaction}getSkill(t){return this.skills.get(t)}getAllSkills(){return Array.from(this.skills.values())}canUse(t){const e=this.skills.get(t);return e!==void 0&&e.currentCooldown<=0}tickCooldowns(){for(const t of this.skills.values())t.currentCooldown>0&&t.currentCooldown--}executeSkill(t,e,s){if(!this.canUse(t))return!1;const i=this.skills.get(t);let n=!1;switch(t){case E.METEOR:n=this.executeMeteor(e,s);break;case E.GENE_BOOST:n=this.executeGeneBoost(e,s);break;case E.SWAMP_TERRAIN:n=this.executeSwamp(e,s);break}return n&&(i.currentCooldown=i.cooldown),n}executeMeteor(t,e){for(let i=-5;i<=5;i++)for(let n=-5;n<=5;n++)if(n*n+i*i<=5*5){const r=e.x+n,o=e.y+i;t.inBounds(r,o)&&t.getTerrain(r,o)!==y.WALL&&t.setCell(r,o,u.EMPTY)}return!0}executeGeneBoost(t,e){let s=!1;for(let i=-1;i<=1;i++)for(let n=-1;n<=1;n++){const r=e.x+n,o=e.y+i;t.inBounds(r,o)&&t.getCell(r,o)===this.activeFaction&&(t.setBuff(r,o,1,20),s=!0)}return s}executeSwamp(t,e){let s=!1;for(let i=-2;i<=2;i++)for(let n=-2;n<=2;n++){const r=e.x+n,o=e.y+i;t.inBounds(r,o)&&t.getTerrain(r,o)!==y.WALL&&(t.setTerrain(r,o,y.SWAMP),s=!0)}return s}setCooldown(t,e){const s=this.skills.get(t);s&&(s.currentCooldown=e)}resetAll(){for(const t of this.skills.values())t.currentCooldown=0}}class z{constructor(){this.speed=1,this.paused=!1,this.history=[],this.future=[],this.currentTick=0}getSpeed(){return this.speed}setSpeed(t){this.speed=t}isPaused(){return this.paused}setPaused(t){this.paused=t}togglePause(){return this.paused=!this.paused,this.paused}getCurrentTick(){return this.currentTick}setCurrentTick(t){this.currentTick=t}incrementTick(){this.currentTick++}saveSnapshot(t){const e={cells:new Uint8Array(t.getCellsArray()),terrain:new Uint8Array(t.getTerrainArray()),buffs:new Uint8Array(t.getBuffsArray()),buffDurations:new Int16Array(t.getBuffDurationsArray()),tick:this.currentTick};this.history.push(e),this.history.length>G&&this.history.shift(),this.future=[]}undo(t){if(this.history.length===0)return!1;const e={cells:new Uint8Array(t.getCellsArray()),terrain:new Uint8Array(t.getTerrainArray()),buffs:new Uint8Array(t.getBuffsArray()),buffDurations:new Int16Array(t.getBuffDurationsArray()),tick:this.currentTick};this.future.push(e);const s=this.history.pop();return t.setCellsFromBuffer(s.cells),t.getTerrainArray().set(s.terrain),t.getBuffsArray().set(s.buffs),t.getBuffDurationsArray().set(s.buffDurations),this.currentTick=s.tick,!0}redo(t){if(this.future.length===0)return!1;const e={cells:new Uint8Array(t.getCellsArray()),terrain:new Uint8Array(t.getTerrainArray()),buffs:new Uint8Array(t.getBuffsArray()),buffDurations:new Int16Array(t.getBuffDurationsArray()),tick:this.currentTick};this.history.push(e);const s=this.future.pop();return t.setCellsFromBuffer(s.cells),t.getTerrainArray().set(s.terrain),t.getBuffsArray().set(s.buffs),t.getBuffDurationsArray().set(s.buffDurations),this.currentTick=s.tick,!0}canUndo(){return this.history.length>0}canRedo(){return this.future.length>0}getHistoryLength(){return this.history.length}getFutureLength(){return this.future.length}clearHistory(){this.history=[],this.future=[],this.currentTick=0}}class H{constructor(){this.redCount=0,this.blueCount=0,this.tick=0,this.fps=0,this.computeTime=0,this.history=[],this.frameCount=0,this.lastFpsTime=performance.now()}update(t,e,s,i){this.redCount=t,this.blueCount=e,this.tick=s,this.computeTime=i,this.history.push({tick:s,red:t,blue:e}),this.history.length>L&&(this.history=this.history.slice(-L))}tickFps(){this.frameCount++;const t=performance.now(),e=t-this.lastFpsTime;e>=1e3&&(this.fps=Math.round(this.frameCount*1e3/e),this.frameCount=0,this.lastFpsTime=t)}getRedCount(){return this.redCount}getBlueCount(){return this.blueCount}getTick(){return this.tick}getFps(){return this.fps}getComputeTime(){return this.computeTime}getHistory(){return this.history}getStats(){return{tick:this.tick,redCount:this.redCount,blueCount:this.blueCount,fps:this.fps,computeTime:this.computeTime}}clear(){this.redCount=0,this.blueCount=0,this.tick=0,this.fps=0,this.computeTime=0,this.history=[],this.frameCount=0,this.lastFpsTime=performance.now()}}class S{static addWall(t,e,s){t.inBounds(e,s)&&(t.setTerrain(e,s,y.WALL),t.setCell(e,s,0))}static addWallLine(t,e,s,i,n){const r=Math.abs(i-e),o=Math.abs(n-s),a=e<i?1:-1,l=s<n?1:-1;let c=r-o,d=e,m=s;for(;S.addWall(t,d,m),!(d===i&&m===n);){const f=2*c;f>-o&&(c-=o,d+=a),f<r&&(c+=r,m+=l)}}static addWallRect(t,e,s,i,n){for(let r=0;r<i;r++)S.addWall(t,e+r,s),S.addWall(t,e+r,s+n-1);for(let r=0;r<n;r++)S.addWall(t,e,s+r),S.addWall(t,e+i-1,s+r)}static addSwamp(t,e,s,i,n){for(let r=0;r<n;r++)for(let o=0;o<i;o++){const a=e+o,l=s+r;t.inBounds(a,l)&&t.getTerrain(a,l)!==y.WALL&&t.setTerrain(a,l,y.SWAMP)}}static clearTerrain(t,e,s){t.inBounds(e,s)&&t.setTerrain(e,s,y.NORMAL)}static generateRandomTerrain(t,e=5,s=3){for(let i=0;i<e;i++){const n=Math.floor(Math.random()*t.width),r=Math.floor(Math.random()*t.height),o=Math.min(t.width-1,n+Math.floor(Math.random()*20)-10),a=Math.min(t.height-1,r+Math.floor(Math.random()*20)-10);S.addWallLine(t,Math.max(0,n),Math.max(0,r),Math.max(0,o),Math.max(0,a))}for(let i=0;i<s;i++){const n=Math.floor(Math.random()*(t.width-10)),r=Math.floor(Math.random()*(t.height-10)),o=5+Math.floor(Math.random()*10),a=5+Math.floor(Math.random()*10);S.addSwamp(t,n,r,o,a)}}static exportMap(t){return t.exportJSON()}static importMap(t){try{return D.importJSON(t)}catch{return console.error("Failed to parse map JSON"),null}}static validateMap(t){return!(!t.width||!t.height||!t.cells||t.cells.length!==t.width*t.height||!t.terrain||t.terrain.length!==t.width*t.height)}}class X{constructor(t,e){this.pathRecalcInterval=5,this.tickCounter=0,this.state={x:t,y:e,size:3,hp:100,maxHp:100,targetX:t,targetY:e,alive:!0,path:[],moveTimer:0}}getState(){return{...this.state}}isAlive(){return this.state.alive}getPosition(){return{x:this.state.x,y:this.state.y}}update(t){this.state.alive&&(this.tickCounter++,(this.tickCounter%this.pathRecalcInterval===0||this.state.path.length===0)&&(this.findTarget(t),this.calculatePath(t)),this.state.path.length>0&&this.moveAlongPath(t),this.consumeCells(t),this.state.hp=Math.max(0,this.state.hp-.1),this.state.hp<=0&&(this.state.alive=!1))}findTarget(t){const e=t.getCellsArray();C.findHighestDensityZone(e,u.EMPTY,t.width,t.height,15);let s=0,i=0,n=0;const r=15,o=Math.floor(r/2),a=Math.max(1,Math.floor(r/2));for(let l=o;l<t.height-o;l+=a)for(let c=o;c<t.width-o;c+=a){let d=0;for(let m=-o;m<o;m++)for(let f=-o;f<o;f++){const p=c+f,h=l+m;p>=0&&p<t.width&&h>=0&&h<t.height&&e[h*t.width+p]!==u.EMPTY&&d++}d>n&&(n=d,s=c,i=l)}this.state.targetX=s,this.state.targetY=i}calculatePath(t){const e=this.state.x,s=this.state.y,i=this.state.targetX,n=this.state.targetY,r=[],o=new Set,a=(f,p)=>p*t.width+f,l=(f,p)=>Math.abs(f-i)+Math.abs(p-n),c={x:e,y:s,g:0,h:l(e,s),f:l(e,s),parent:null};r.push(c);let d=0;const m=2e3;for(;r.length>0&&d<m;){d++;let f=0;for(let h=1;h<r.length;h++)r[h].f<r[f].f&&(f=h);const p=r.splice(f,1)[0];if(Math.abs(p.x-i)<=2&&Math.abs(p.y-n)<=2){const h=[];let b=p;for(;b;)h.unshift({x:b.x,y:b.y}),b=b.parent;this.state.path=h;return}o.add(a(p.x,p.y));for(let h=-1;h<=1;h++)for(let b=-1;b<=1;b++){if(b===0&&h===0)continue;const T=p.x+b,v=p.y+h;if(!t.inBounds(T,v)||o.has(a(T,v))||t.getTerrain(T,v)===y.WALL)continue;const w=p.g+(b!==0&&h!==0?1.414:1),x=l(T,v),R=w+x,B=r.find(M=>M.x===T&&M.y===v);B?w<B.g&&(B.g=w,B.f=R,B.parent=p):r.push({x:T,y:v,g:w,h:x,f:R,parent:p})}}this.state.path=[{x:i,y:n}]}moveAlongPath(t){if(this.state.path.length<=1)return;const e=this.state.path[1],s=Math.sign(e.x-this.state.x),i=Math.sign(e.y-this.state.y),n=this.state.x+s,r=this.state.y+i;if(this.canMoveTo(t,n,r)){if(this.state.x=n,this.state.y=r,this.state.path.length>0){const o=this.state.path[0];o.x===n&&o.y===r&&this.state.path.shift()}}else this.state.path=[]}canMoveTo(t,e,s){for(let i=0;i<this.state.size;i++)for(let n=0;n<this.state.size;n++){const r=e+n,o=s+i;if(!t.inBounds(r,o)||t.getTerrain(r,o)===y.WALL)return!1}return!0}consumeCells(t){for(let e=0;e<this.state.size;e++)for(let s=0;s<this.state.size;s++){const i=this.state.x+s,n=this.state.y+e;t.inBounds(i,n)&&t.getCell(i,n)!==u.EMPTY&&(t.setCell(i,n,u.EMPTY),this.state.hp=Math.min(this.state.maxHp,this.state.hp+2))}}takeDamage(t){this.state.hp=Math.max(0,this.state.hp-t),this.state.hp<=0&&(this.state.alive=!1)}reset(t,e){this.state={x:t,y:e,size:3,hp:100,maxHp:100,targetX:t,targetY:e,alive:!0,path:[],moveTimer:0},this.tickCounter=0}}class I{constructor(){this.rules=[],this.rawScript="",this.enabled=!1,this.executionLog=[],this.maxLogSize=100}isEnabled(){return this.enabled}setEnabled(t){this.enabled=t}getScript(){return this.rawScript}getLog(){return this.executionLog}parseScript(t){this.rawScript=t,this.rules=[],this.executionLog=[];const e=t.split(`
`).map(s=>s.trim()).filter(s=>s.length>0&&!s.startsWith("//")&&!s.startsWith("#"));for(const s of e)try{const i=this.parseLine(s);i&&this.rules.push(i)}catch(i){return this.log(`Parse error: ${s} - ${i}`),!1}return this.log(`Parsed ${this.rules.length} rule(s)`),!0}parseLine(t){const s=t.toUpperCase().match(/^IF\s+(.+?)\s+THEN\s+(.+)$/);if(!s)return null;const i=s[1],n=s[2],o=i.split(/\s+AND\s+/).map(c=>{const d=c.trim(),m=d.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/);if(!m)throw new Error(`Invalid condition: ${d}`);return{left:m[1].toLowerCase(),operator:m[2],right:m[3].trim()}}),a=n.match(/^CAST\s+(\w+)\s+AT\s+(\w+)$/);if(!a)throw new Error(`Invalid action: ${n}`);const l={type:"cast",target:a[2].toLowerCase(),params:{skill:a[1].toLowerCase()}};return{conditions:o,action:l}}executeRules(t){if(!this.enabled||this.rules.length===0)return;const e=this.buildContext(t);for(const s of this.rules)this.evaluateConditions(s.conditions,e)&&this.executeAction(s.action,t,e)}buildContext(t){const s=t.getGrid().getCellsArray(),i=C.countCells(s),n=i.red+i.blue+i.empty,r=t.getSkillSystem();return{redCells:i.red,blueCells:i.blue,totalCells:n,tick:t.getTick(),meteorCooldown:r.getSkill(E.METEOR)?.currentCooldown??999,geneBoostCooldown:r.getSkill(E.GENE_BOOST)?.currentCooldown??999,swampCooldown:r.getSkill(E.SWAMP_TERRAIN)?.currentCooldown??999}}evaluateConditions(t,e){for(const s of t){const i=this.resolveValue(s.left,e),n=this.resolveValue(s.right,e);if(!this.compare(i,s.operator,n))return!1}return!0}resolveValue(t,e){const s=t.trim().toLowerCase();if(s.endsWith("%"))return parseFloat(s)/100;switch(s){case"red_cells":return e.redCells;case"blue_cells":return e.blueCells;case"total_cells":return e.totalCells;case"tick":return e.tick;case"meteor_cooldown":return e.meteorCooldown;case"gene_boost_cooldown":return e.geneBoostCooldown;case"swamp_cooldown":return e.swampCooldown;case"red_ratio":return e.totalCells>0?e.redCells/e.totalCells:0;case"blue_ratio":return e.totalCells>0?e.blueCells/e.totalCells:0;default:return parseFloat(s)||0}}compare(t,e,s){switch(e){case"==":return t===s;case"!=":return t!==s;case">":return t>s;case"<":return t<s;case">=":return t>=s;case"<=":return t<=s;default:return!1}}executeAction(t,e,s){if(t.type!=="cast"||!t.params)return;const i=t.params.skill,n=this.resolveSkillType(i);if(!n){this.log(`Unknown skill: ${i}`);return}const r=e.getSkillSystem();if(!r.canUse(n)){this.log(`Skill ${i} on cooldown`);return}let o,a;const l=e.getGrid();if(t.target==="highest_density_zone"){const d=C.findHighestDensityZone(l.getCellsArray(),u.RED,l.width,l.height,10);o=d.x,a=d.y}else t.target,o=Math.floor(l.width/2),a=Math.floor(l.height/2);r.executeSkill(n,l,{x:o,y:a})&&this.log(`Executed: CAST ${i} AT (${o}, ${a})`)}resolveSkillType(t){switch(t){case"meteor":return E.METEOR;case"gene_boost":case"geneboost":return E.GENE_BOOST;case"swamp":return E.SWAMP_TERRAIN;default:return null}}log(t){const e=new Date().toLocaleTimeString();this.executionLog.push(`[${e}] ${t}`),this.executionLog.length>this.maxLogSize&&this.executionLog.shift()}static getExampleScript(){return`// Gene Macro Script Example
// Conditions: IF blue_ratio > 0.4 AND meteor_cooldown == 0
// Action: CAST meteor AT highest_density_zone
IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone
IF red_cells < 500 AND gene_boost_cooldown == 0 THEN CAST gene_boost AT center`}}class Y{constructor(t){this.imageData=null,this.cellSize=4,this.offsetX=0,this.offsetY=0,this.showGrid=!1,this.gridWidth=100,this.gridHeight=100,this.colorTable=[[10,14,23],[230,57,70],[69,123,157],[45,49,66],[45,106,79],[249,199,79],[155,93,229]],this.canvas=t,this.ctx=t.getContext("2d",{alpha:!1}),this.resize()}resize(){const t=window.devicePixelRatio||1,e=this.canvas.getBoundingClientRect();this.canvas.width=e.width*t,this.canvas.height=e.height*t,this.ctx.scale(t,t),this.recalculateLayout()}recalculateLayout(){const t=this.canvas.getBoundingClientRect(),e=t.width,s=t.height;this.cellSize=Math.max(1,Math.floor(Math.min(e/this.gridWidth,s/this.gridHeight))),this.offsetX=Math.floor((e-this.cellSize*this.gridWidth)/2),this.offsetY=Math.floor((s-this.cellSize*this.gridHeight)/2)}setGridSize(t,e){this.gridWidth=t,this.gridHeight=e,this.recalculateLayout()}setShowGrid(t){this.showGrid=t}getCellSize(){return this.cellSize}screenToGrid(t,e){const s=this.canvas.getBoundingClientRect(),i=Math.floor((t-s.left-this.offsetX)/this.cellSize),n=Math.floor((e-s.top-this.offsetY)/this.cellSize);return i>=0&&i<this.gridWidth&&n>=0&&n<this.gridHeight?{x:i,y:n}:null}render(t,e){const s=this.canvas.getBoundingClientRect(),i=s.width,n=s.height;(!this.imageData||this.imageData.width!==this.canvas.width||this.imageData.height!==this.canvas.height)&&(this.imageData=this.ctx.createImageData(this.canvas.width,this.canvas.height));const r=this.imageData.data,o=window.devicePixelRatio||1,a=this.imageData.width,l=10,c=14,d=23;for(let v=0;v<r.length;v+=4)r[v]=l,r[v+1]=c,r[v+2]=d,r[v+3]=255;const m=t.getCellsArray(),f=t.getTerrainArray(),p=t.getBuffsArray(),h=this.cellSize*o,b=this.offsetX*o,T=this.offsetY*o;for(let v=0;v<this.gridHeight;v++)for(let w=0;w<this.gridWidth;w++){const x=v*this.gridWidth+w,R=f[x];if(R!==y.NORMAL){const B=R===y.WALL?this.colorTable[3]:this.colorTable[4];this.fillRect(r,a,w,v,h,b,T,B)}}for(let v=0;v<this.gridHeight;v++)for(let w=0;w<this.gridWidth;w++){const x=v*this.gridWidth+w,R=m[x];if(R!==u.EMPTY){let B=R;p[x]===k.GENE_BOOST&&(B=5),this.fillRect(r,a,w,v,h,b,T,this.colorTable[B])}}if(e&&e.alive){const v=this.colorTable[6];for(let w=0;w<e.size;w++)for(let x=0;x<e.size;x++)this.fillRect(r,a,e.x+x,e.y+w,h,b,T,v)}this.ctx.putImageData(this.imageData,0,0),this.showGrid&&this.cellSize>=4&&this.drawGridOverlay(i,n)}fillRect(t,e,s,i,n,r,o,a){const l=Math.floor(r+s*n),c=Math.floor(o+i*n),d=l+Math.ceil(n),m=c+Math.ceil(n);for(let f=c;f<m;f++)for(let p=l;p<d;p++)if(p>=0&&p<e&&f>=0&&f<this.imageData.height){const h=(f*e+p)*4;t[h]=a[0],t[h+1]=a[1],t[h+2]=a[2],t[h+3]=255}}drawGridOverlay(t,e){this.ctx.strokeStyle=A.GRID_LINE,this.ctx.lineWidth=.5,this.ctx.beginPath();for(let s=0;s<=this.gridWidth;s++){const i=this.offsetX+s*this.cellSize;this.ctx.moveTo(i,this.offsetY),this.ctx.lineTo(i,this.offsetY+this.gridHeight*this.cellSize)}for(let s=0;s<=this.gridHeight;s++){const i=this.offsetY+s*this.cellSize;this.ctx.moveTo(this.offsetX,i),this.ctx.lineTo(this.offsetX+this.gridWidth*this.cellSize,i)}this.ctx.stroke()}drawHighlight(t,e,s=0,i="#ffffff"){const n=window.devicePixelRatio||1;if(this.ctx.strokeStyle=i,this.ctx.lineWidth=2*n,s>0){const r=this.offsetX+(t+.5)*this.cellSize,o=this.offsetY+(e+.5)*this.cellSize,a=s*this.cellSize;this.ctx.beginPath(),this.ctx.arc(r,o,a,0,Math.PI*2),this.ctx.stroke()}else{const r=this.offsetX+t*this.cellSize,o=this.offsetY+e*this.cellSize;this.ctx.strokeRect(r,o,this.cellSize,this.cellSize)}}getCanvas(){return this.canvas}destroy(){this.imageData=null}}class q{constructor(t){this.maxPoints=500,this.canvas=t,this.ctx=t.getContext("2d"),this.resize()}resize(){const t=window.devicePixelRatio||1,e=this.canvas.getBoundingClientRect();this.canvas.width=e.width*t,this.canvas.height=e.height*t,this.ctx.scale(t,t)}render(t,e){const s=this.canvas.getBoundingClientRect(),i=s.width,n=s.height,r=this.ctx,o={top:10,right:10,bottom:25,left:45},a=i-o.left-o.right,l=n-o.top-o.bottom;if(r.fillStyle="#0d1117",r.fillRect(0,0,i,n),t.length<2){r.fillStyle="#555",r.font="12px system-ui",r.textAlign="center",r.fillText("等待數據...",i/2,n/2);return}let c=1;for(const h of t)c=Math.max(c,h.red,h.blue);c=Math.ceil(c/100)*100;const d=a/Math.max(1,t.length-1),m=l/c;r.strokeStyle="#1c2333",r.lineWidth=1;for(let h=0;h<=4;h++){const b=o.top+l*h/4;r.beginPath(),r.moveTo(o.left,b),r.lineTo(o.left+a,b),r.stroke();const T=Math.round(c*(1-h/4));r.fillStyle="#666",r.font="10px system-ui",r.textAlign="right",r.fillText(T.toString(),o.left-5,b+3)}r.fillStyle="#666",r.textAlign="center";const f=t[0].tick,p=t[t.length-1].tick;for(let h=0;h<=4;h++){const b=o.left+a*h/4,T=Math.round(f+(p-f)*h/4);r.fillText(T.toString(),b,n-5)}this.drawLine(t,"red",A[u.RED],o,d,m,c,l),this.drawLine(t,"blue",A[u.BLUE],o,d,m,c,l),r.font="11px system-ui",r.fillStyle=A[u.RED],r.textAlign="left",r.fillText("● 紅軍",o.left+5,o.top+12),r.fillStyle=A[u.BLUE],r.fillText("● 藍軍",o.left+60,o.top+12)}drawLine(t,e,s,i,n,r,o,a){const l=this.ctx;l.strokeStyle=s,l.lineWidth=1.5,l.beginPath();for(let c=0;c<t.length;c++){const d=i.left+c*n,m=i.top+a-t[c][e]*r;c===0?l.moveTo(d,m):l.lineTo(d,m)}l.stroke(),l.globalAlpha=.1,l.fillStyle=s,l.lineTo(i.left+(t.length-1)*n,i.top+a),l.lineTo(i.left,i.top+a),l.closePath(),l.fill(),l.globalAlpha=1}getCanvas(){return this.canvas}}const U=`
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,$=`
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_terrain;
uniform sampler2D u_buffs;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

float getCell(sampler2D tex, vec2 coord) {
  return texture2D(tex, coord / u_resolution).r;
}

void main() {
  vec2 coord = v_texCoord * u_resolution;
  float current = texture2D(u_state, v_texCoord).r;
  float terrain = texture2D(u_terrain, v_texCoord).r;
  float buff = texture2D(u_buffs, v_texCoord).r;

  if (terrain > 0.4 && terrain < 0.6) {
    // Wall
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Count red neighbors
  float redCount = 0.0;
  float blueCount = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      vec2 nc = (coord + vec2(float(dx), float(dy))) / u_resolution;
      float n = texture2D(u_state, nc).r;
      if (n > 0.4 && n < 0.6) redCount += 1.0;
      else if (n > 0.6) blueCount += 1.0;
    }
  }

  // Is swamp
  float isSwamp = terrain > 0.6 ? 1.0 : 0.0;
  float birthCount = 3.0 + isSwamp;
  float survMax = 3.0 + step(0.4, buff);

  float newState = 0.0;

  if (current > 0.1) {
    // Alive
    float sameNeighbors = current < 0.6 ? redCount : blueCount;
    if (sameNeighbors >= 2.0 && sameNeighbors <= survMax) {
      newState = current;
    }
  } else {
    // Empty - reproduction
    bool redBirth = redCount == birthCount;
    bool blueBirth = blueCount == birthCount;
    if (redBirth && blueBirth) {
      newState = redCount > blueCount ? 0.5 : (blueCount > redCount ? 0.7 : (fract(coord.x * 0.1 + coord.y * 0.2) > 0.5 ? 0.5 : 0.7));
    } else if (redBirth) {
      newState = 0.5;
    } else if (blueBirth) {
      newState = 0.7;
    }
  }

  gl_FragColor = vec4(newState, 0.0, 0.0, 1.0);
}
`,J=`
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_terrain;
uniform sampler2D u_buffs;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
  float state = texture2D(u_state, v_texCoord).r;
  float terrain = texture2D(u_terrain, v_texCoord).r;
  float buff = texture2D(u_buffs, v_texCoord).r;

  vec3 color;

  if (terrain > 0.4 && terrain < 0.6) {
    color = vec3(0.176, 0.192, 0.259); // Wall
  } else if (terrain > 0.6) {
    color = vec3(0.176, 0.416, 0.310); // Swamp
  } else if (state > 0.4 && state < 0.6) {
    color = buff > 0.4 ? vec3(0.976, 0.780, 0.310) : vec3(0.902, 0.224, 0.275); // Red / GeneBoost
  } else if (state > 0.6) {
    color = vec3(0.271, 0.482, 0.616); // Blue
  } else {
    color = vec3(0.039, 0.055, 0.090); // Empty
  }

  gl_FragColor = vec4(color, 1.0);
}
`;class V{constructor(t){this.gl=null,this.computeProgram=null,this.renderProgram=null,this.stateTextures=[null,null],this.terrainTexture=null,this.buffTexture=null,this.framebuffers=[null,null],this.currentBuffer=0,this.gridWidth=0,this.gridHeight=0,this.available=!1,this.canvas=t,this.init()}isAvailable(){return this.available}init(){const t=this.canvas.getContext("webgl",{alpha:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t){console.warn("WebGL not available");return}if(this.gl=t,t.getExtension("OES_texture_float")||console.warn("Float textures not supported, using UNSIGNED_BYTE fallback"),this.computeProgram=this.createProgram(U,$),this.renderProgram=this.createProgram(U,J),!this.computeProgram||!this.renderProgram){console.warn("Failed to create WebGL programs");return}this.available=!0}createShader(t,e){const s=this.gl,i=s.createShader(t);return i?(s.shaderSource(i,e),s.compileShader(i),s.getShaderParameter(i,s.COMPILE_STATUS)?i:(console.error("Shader compile error:",s.getShaderInfoLog(i)),s.deleteShader(i),null)):null}createProgram(t,e){const s=this.gl,i=this.createShader(s.VERTEX_SHADER,t),n=this.createShader(s.FRAGMENT_SHADER,e);if(!i||!n)return null;const r=s.createProgram();return r?(s.attachShader(r,i),s.attachShader(r,n),s.linkProgram(r),s.getProgramParameter(r,s.LINK_STATUS)?r:(console.error("Program link error:",s.getProgramInfoLog(r)),null)):null}initGrid(t,e){if(!this.gl||!this.available)return;this.gridWidth=t,this.gridHeight=e;const s=this.gl;for(let i=0;i<2;i++)this.stateTextures[i]=this.createDataTexture(t,e),this.framebuffers[i]=s.createFramebuffer(),s.bindFramebuffer(s.FRAMEBUFFER,this.framebuffers[i]),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,this.stateTextures[i],0);this.terrainTexture=this.createDataTexture(t,e),this.buffTexture=this.createDataTexture(t,e),this.currentBuffer=0}createDataTexture(t,e){const s=this.gl,i=s.createTexture();s.bindTexture(s.TEXTURE_2D,i);const n=s.getExtension("OES_texture_float")?s.FLOAT:s.UNSIGNED_BYTE;return s.texImage2D(s.TEXTURE_2D,0,s.RGBA,t,e,0,s.RGBA,n,null),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,s.NEAREST),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),i}uploadGrid(t){if(!this.gl||!this.available)return;const e=this.gl,s=t.getCellsArray(),i=t.getTerrainArray(),n=t.getBuffsArray(),r=this.gridWidth*this.gridHeight,o=new Float32Array(r*4),a=new Float32Array(r*4),l=new Float32Array(r*4);for(let c=0;c<r;c++)o[c*4]=s[c]===u.RED?.5:s[c]===u.BLUE?.7:0,o[c*4+1]=0,o[c*4+2]=0,o[c*4+3]=1,a[c*4]=i[c]===y.WALL?.5:i[c]===y.SWAMP?.7:0,a[c*4+1]=0,a[c*4+2]=0,a[c*4+3]=1,l[c*4]=n[c]===k.GENE_BOOST?.5:0,l[c*4+1]=0,l[c*4+2]=0,l[c*4+3]=1;e.bindTexture(e.TEXTURE_2D,this.stateTextures[0]),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,o),e.bindTexture(e.TEXTURE_2D,this.stateTextures[1]),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,o),e.bindTexture(e.TEXTURE_2D,this.terrainTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,a),e.bindTexture(e.TEXTURE_2D,this.buffTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,l)}compute(){if(!this.gl||!this.available||!this.computeProgram)return;const t=this.gl,e=this.currentBuffer,s=1-this.currentBuffer;t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffers[s]),t.viewport(0,0,this.gridWidth,this.gridHeight),t.useProgram(this.computeProgram),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.stateTextures[e]),t.uniform1i(t.getUniformLocation(this.computeProgram,"u_state"),0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.terrainTexture),t.uniform1i(t.getUniformLocation(this.computeProgram,"u_terrain"),1),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.buffTexture),t.uniform1i(t.getUniformLocation(this.computeProgram,"u_buffs"),2),t.uniform2f(t.getUniformLocation(this.computeProgram,"u_resolution"),this.gridWidth,this.gridHeight),this.drawQuad(),this.currentBuffer=s}renderDisplay(){if(!this.gl||!this.available||!this.renderProgram)return;const t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.canvas.width,this.canvas.height),t.useProgram(this.renderProgram),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.stateTextures[this.currentBuffer]),t.uniform1i(t.getUniformLocation(this.renderProgram,"u_state"),0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.terrainTexture),t.uniform1i(t.getUniformLocation(this.renderProgram,"u_terrain"),1),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.buffTexture),t.uniform1i(t.getUniformLocation(this.renderProgram,"u_buffs"),2),t.uniform2f(t.getUniformLocation(this.renderProgram,"u_resolution"),this.gridWidth,this.gridHeight),this.drawQuad()}drawQuad(){const t=this.gl,e=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,e),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),t.STATIC_DRAW);const s=0;t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0),t.drawArrays(t.TRIANGLES,0,6),t.deleteBuffer(e)}readBackState(){if(!this.gl||!this.available)return{cells:new Uint8Array(0),redCount:0,blueCount:0};const t=this.gl,e=this.gridWidth*this.gridHeight;t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffers[this.currentBuffer]);const s=new Float32Array(e*4);t.readPixels(0,0,this.gridWidth,this.gridHeight,t.RGBA,t.FLOAT,s);const i=new Uint8Array(e);let n=0,r=0;for(let o=0;o<e;o++){const a=s[o*4];a>.4&&a<.6?(i[o]=u.RED,n++):a>.6?(i[o]=u.BLUE,r++):i[o]=u.EMPTY}return{cells:i,redCount:n,blueCount:r}}destroy(){if(this.gl){for(let t=0;t<2;t++)this.stateTextures[t]&&this.gl.deleteTexture(this.stateTextures[t]),this.framebuffers[t]&&this.gl.deleteFramebuffer(this.framebuffers[t]);this.terrainTexture&&this.gl.deleteTexture(this.terrainTexture),this.buffTexture&&this.gl.deleteTexture(this.buffTexture),this.computeProgram&&this.gl.deleteProgram(this.computeProgram),this.renderProgram&&this.gl.deleteProgram(this.renderProgram)}}}const j=`
struct Params {
  width: u32,
  height: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> currentState: array<f32>;
@group(0) @binding(2) var<storage, read_write> nextState: array<f32>;
@group(0) @binding(3) var<storage, read> terrain: array<f32>;
@group(0) @binding(4) var<storage, read> buffs: array<f32>;

fn getIndex(x: i32, y: i32) -> u32 {
  return u32(y) * params.width + u32(x);
}

fn countNeighbors(cells: array<f32>, cx: i32, cy: i32, targetState: f32) -> u32 {
  var count: u32 = 0u;
  for (var dy: i32 = -1; dy <= 1; dy = dy + 1) {
    for (var dx: i32 = -1; dx <= 1; dx = dx + 1) {
      if (dx == 0 && dy == 0) { continue; }
      let nx = cx + dx;
      let ny = cy + dy;
      if (nx >= 0 && nx < i32(params.width) && ny >= 0 && ny < i32(params.height)) {
        let n = cells[getIndex(nx, ny)];
        if (abs(n - targetState) < 0.1) {
          count = count + 1u;
        }
      }
    }
  }
  return count;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = i32(gid.x);
  let y = i32(gid.y);

  if (x >= i32(params.width) || y >= i32(params.height)) { return; }

  let idx = getIndex(x, y);
  let current = currentState[idx];
  let t = terrain[idx];
  let buff = buffs[idx];

  // Wall terrain
  if (t > 0.4 && t < 0.6) {
    nextState[idx] = 0.0;
    return;
  }

  let redN = countNeighbors(currentState, x, y, 0.5);
  let blueN = countNeighbors(currentState, x, y, 0.7);
  let isSwamp = t > 0.6;
  let birthCount: u32 = if isSwamp { 4u } else { 3u };
  let survMax: u32 = if buff > 0.4 { 4u } else { 3u };

  var newState: f32 = 0.0;

  if (current > 0.1) {
    // Alive - check survival
    let sameN = if current < 0.6 { redN } else { blueN };
    if (sameN >= 2u && sameN <= survMax) {
      newState = current;
    }
  } else {
    // Empty - check reproduction
    let redBirth = redN == birthCount;
    let blueBirth = blueN == birthCount;
    if (redBirth && blueBirth) {
      newState = if redN > blueN { 0.5 } else if blueN > redN { 0.7 } else { 0.5 };
    } else if (redBirth) {
      newState = 0.5;
    } else if (blueBirth) {
      newState = 0.7;
    }
  }

  nextState[idx] = newState;
}
`,Z=`
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) idx: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
  );
  var output: VertexOutput;
  output.position = vec4(pos[idx], 0.0, 1.0);
  output.texCoord = pos[idx] * 0.5 + 0.5;
  return output;
}

struct Params {
  width: u32,
  height: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var stateTex: texture_2d<f32>;
@group(0) @binding(2) var stateSampler: sampler;

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
  let coord = vec2<i32>(input.texCoord * vec2<f32>(f32(params.width), f32(params.height)));
  let state = textureLoad(stateTex, coord, 0).r;

  var color: vec3<f32>;
  if (state > 0.4 && state < 0.6) {
    color = vec3(0.902, 0.224, 0.275); // Red
  } else if (state > 0.6) {
    color = vec3(0.271, 0.482, 0.616); // Blue
  } else {
    color = vec3(0.039, 0.055, 0.090); // Empty
  }
  return vec4(color, 1.0);
}
`;class K{constructor(t){this.device=null,this.context=null,this.computePipeline=null,this.renderPipeline=null,this.stateBuffers=[null,null],this.terrainBuffer=null,this.buffBuffer=null,this.stateTextures=[null,null],this.bindGroups=[null,null],this.paramBuffer=null,this.currentBuffer=0,this.gridWidth=0,this.gridHeight=0,this.available=!1,this.canvas=t}isAvailable(){return this.available}async init(){if(!("gpu"in navigator))return console.warn("WebGPU not supported"),!1;try{const t=await navigator.gpu.requestAdapter();if(!t)return console.warn("No WebGPU adapter found"),!1;if(this.device=await t.requestDevice(),this.context=this.canvas.getContext("webgpu"),!this.context)return console.warn("Failed to get WebGPU context"),!1;const e=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:e,alphaMode:"opaque"});const s=this.device.createShaderModule({code:j});this.computePipeline=this.device.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"main"}});const i=this.device.createShaderModule({code:Z});return this.renderPipeline=this.device.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:e}]},primitive:{topology:"triangle-list"}}),this.available=!0,!0}catch(t){return console.warn("WebGPU init failed:",t),!1}}initGrid(t,e){if(!this.device||!this.available)return;const s=this.device;this.gridWidth=t,this.gridHeight=e;const n=t*e*4;for(let r=0;r<2;r++)this.stateBuffers[r]=s.createBuffer({size:n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});this.terrainBuffer=s.createBuffer({size:n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.buffBuffer=s.createBuffer({size:n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.paramBuffer=s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});for(let r=0;r<2;r++)this.stateTextures[r]=s.createTexture({size:{width:t,height:e},format:"r32float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING});for(let r=0;r<2;r++){const o=r,a=1-r;this.bindGroups[r]=s.createBindGroup({layout:this.computePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.paramBuffer}},{binding:1,resource:{buffer:this.stateBuffers[o]}},{binding:2,resource:{buffer:this.stateBuffers[a]}},{binding:3,resource:{buffer:this.terrainBuffer}},{binding:4,resource:{buffer:this.buffBuffer}}]})}this.currentBuffer=0}uploadGrid(t){if(!this.device||!this.available)return;const e=t.getCellsArray(),s=t.getTerrainArray(),i=t.getBuffsArray(),n=this.gridWidth*this.gridHeight,r=new Float32Array(n),o=new Float32Array(n),a=new Float32Array(n);for(let c=0;c<n;c++)r[c]=e[c]===u.RED?.5:e[c]===u.BLUE?.7:0,o[c]=s[c]===y.WALL?.5:s[c]===y.SWAMP?.7:0,a[c]=i[c]===k.GENE_BOOST?.5:0;this.device.queue.writeBuffer(this.stateBuffers[0],0,r),this.device.queue.writeBuffer(this.stateBuffers[1],0,r),this.device.queue.writeBuffer(this.terrainBuffer,0,o),this.device.queue.writeBuffer(this.buffBuffer,0,a);const l=new Uint32Array([this.gridWidth,this.gridHeight]);this.device.queue.writeBuffer(this.paramBuffer,0,l)}compute(){if(!this.device||!this.computePipeline||!this.available)return;const t=this.device.createCommandEncoder(),e=t.beginComputePass();e.setPipeline(this.computePipeline),e.setBindGroup(0,this.bindGroups[this.currentBuffer]),e.dispatchWorkgroups(Math.ceil(this.gridWidth/16),Math.ceil(this.gridHeight/16)),e.end(),this.device.queue.submit([t.finish()]),this.currentBuffer=1-this.currentBuffer}renderDisplay(){!this.device||!this.renderPipeline||!this.context||this.available}async readBackState(){if(!this.device||!this.available)return{cells:new Uint8Array(0),redCount:0,blueCount:0};const t=this.gridWidth*this.gridHeight,e=t*4,s=this.device.createBuffer({size:e,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),i=this.device.createCommandEncoder();i.copyBufferToBuffer(this.stateBuffers[this.currentBuffer],0,s,0,e),this.device.queue.submit([i.finish()]),await s.mapAsync(GPUMapMode.READ);const n=new Float32Array(s.getMappedRange()),r=new Uint8Array(t);let o=0,a=0;for(let l=0;l<t;l++)n[l]>.4&&n[l]<.6?(r[l]=u.RED,o++):n[l]>.6&&(r[l]=u.BLUE,a++);return s.unmap(),s.destroy(),{cells:r,redCount:o,blueCount:a}}destroy(){for(let t=0;t<2;t++)this.stateBuffers[t]?.destroy(),this.stateTextures[t]?.destroy();this.terrainBuffer?.destroy(),this.buffBuffer?.destroy(),this.paramBuffer?.destroy()}}class Q{constructor(t,e,s=_){this.mainCanvas=t,this.chartCanvas=e,this.leviathan=null,this.webglRenderer=null,this.webgpuRenderer=null,this.renderMode="canvas2d",this.animFrameId=0,this.lastTime=0,this.accumulator=0,this.targetTickInterval=100,this.computing=!1,this.selectedSkill=null,this.mouseDown=!1,this.mouseGridPos=null,this.hoverGridPos=null,this.simulationConfig={...P},this.leviathanEnabled=!1,this.gameLoop=i=>{this.animFrameId=requestAnimationFrame(this.gameLoop);const n=i-this.lastTime;if(this.lastTime=i,this.statsTracker.tickFps(),!this.timeController.isPaused())for(this.accumulator+=n*this.timeController.getSpeed();this.accumulator>=this.targetTickInterval&&!this.computing;)this.accumulator-=this.targetTickInterval,this.simulateTick();this.render()},this.grid=new D({width:s,height:s}),this.engine=new O,this.skillSystem=new F,this.timeController=new z,this.statsTracker=new H,this.macroEngine=new I,this.canvasRenderer=new Y(t),this.canvasRenderer.setGridSize(s,s),this.chartRenderer=new q(e),this.initGPU(),this.setupInput()}async initGPU(){const t=document.createElement("canvas");this.webgpuRenderer=new K(t),await this.webgpuRenderer.init()?console.log("WebGPU available"):this.webgpuRenderer=null;const s=document.createElement("canvas");this.webglRenderer=new V(s),this.webglRenderer.isAvailable()?(console.log("WebGL available"),this.webglRenderer.initGrid(this.grid.width,this.grid.height)):this.webglRenderer=null}setupInput(){const t=this.mainCanvas;t.addEventListener("mousedown",e=>{this.mouseDown=!0,this.handleCanvasInteraction(e)}),t.addEventListener("mousemove",e=>{const s=this.canvasRenderer.screenToGrid(e.clientX,e.clientY);this.hoverGridPos=s,this.mouseDown&&this.handleCanvasInteraction(e)}),t.addEventListener("mouseup",()=>{this.mouseDown=!1}),t.addEventListener("mouseleave",()=>{this.mouseDown=!1,this.hoverGridPos=null}),t.addEventListener("touchstart",e=>{e.preventDefault(),this.mouseDown=!0;const s=e.touches[0];this.handleCanvasInteraction(s)}),t.addEventListener("touchmove",e=>{e.preventDefault();const s=e.touches[0];this.handleCanvasInteraction(s)}),t.addEventListener("touchend",()=>{this.mouseDown=!1}),window.addEventListener("keydown",e=>{switch(e.key){case" ":e.preventDefault(),this.togglePause();break;case"z":(e.ctrlKey||e.metaKey)&&(e.preventDefault(),this.undo());break;case"1":this.setSpeed(1);break;case"2":this.setSpeed(2);break;case"3":this.setSpeed(5);break}})}handleCanvasInteraction(t){const e=this.canvasRenderer.screenToGrid("clientX"in t?t.clientX:0,"clientY"in t?t.clientY:0);if(e)if(this.mouseGridPos=e,this.selectedSkill!==null)this.skillSystem.executeSkill(this.selectedSkill,this.grid,{x:e.x,y:e.y}),this.selectedSkill=null;else{const s=this.skillSystem.getActiveFaction();this.placeCellBrush(e.x,e.y,s)}}placeCellBrush(t,e,s){for(let n=-2;n<=2;n++)for(let r=-2;r<=2;r++)if(r*r+n*n<=2*2){const o=t+r,a=e+n;this.grid.inBounds(o,a)&&this.grid.getTerrain(o,a)!==y.WALL&&this.grid.setCell(o,a,s)}}start(){this.grid.placeInitialPattern(),this.lastTime=performance.now(),this.gameLoop(this.lastTime)}async simulateTick(){if(!this.computing){this.computing=!0,this.timeController.saveSnapshot(this.grid);try{const t=await this.engine.computeNext(this.grid,this.simulationConfig);this.grid.setCellsFromBuffer(t.cells),this.grid.setBuffsFromBuffer(t.buffs),this.grid.setBuffDurationsFromBuffer(t.buffDurations),this.timeController.incrementTick(),this.statsTracker.update(t.redCount,t.blueCount,this.timeController.getCurrentTick(),t.computeTime),this.skillSystem.tickCooldowns(),this.leviathanEnabled&&this.leviathan&&this.leviathan.update(this.grid),this.macroEngine.executeRules(this)}finally{this.computing=!1}}}render(){const t=this.leviathan?.getState()??null;if(this.renderMode==="canvas2d"&&this.canvasRenderer.render(this.grid,t),this.hoverGridPos)if(this.selectedSkill){const e=this.selectedSkill===E.METEOR?5:2;this.canvasRenderer.drawHighlight(this.hoverGridPos.x,this.hoverGridPos.y,e,"#ffd93d")}else this.canvasRenderer.drawHighlight(this.hoverGridPos.x,this.hoverGridPos.y,0,"rgba(255,255,255,0.5)");t&&t.alive,this.timeController.getCurrentTick()%2===0&&this.chartRenderer.render(this.statsTracker.getHistory(),this.timeController.getCurrentTick())}getGrid(){return this.grid}getSkillSystem(){return this.skillSystem}getTimeController(){return this.timeController}getStatsTracker(){return this.statsTracker}getMacroEngine(){return this.macroEngine}getTick(){return this.timeController.getCurrentTick()}togglePause(){this.timeController.togglePause()}setSpeed(t){this.timeController.setSpeed(t)}undo(){this.timeController.undo(this.grid)}selectSkill(t){this.selectedSkill=t}getSelectedSkill(){return this.selectedSkill}setFaction(t){this.skillSystem.setActiveFaction(t)}reset(){this.grid.clear(),this.grid.placeInitialPattern(),this.timeController.clearHistory(),this.statsTracker.clear(),this.skillSystem.resetAll(),this.leviathan&&this.leviathan.reset(0,Math.floor(this.grid.height/2))}resize(t,e){this.mainCanvas.style.width=t+"px",this.mainCanvas.style.height=e+"px",this.canvasRenderer.resize(),this.chartRenderer.resize()}setGridSize(t){this.grid=new D({width:t,height:t}),this.grid.placeInitialPattern(),this.canvasRenderer.setGridSize(t,t),this.timeController.clearHistory(),this.statsTracker.clear(),this.webglRenderer&&this.webglRenderer.initGrid(t,t)}enableLeviathan(t){this.leviathanEnabled=t,t&&!this.leviathan&&(this.leviathan=new X(0,Math.floor(this.grid.height/2)-1)),t||(this.leviathan=null)}getRenderMode(){return this.renderMode}setRenderMode(t){this.renderMode=t}addWall(t,e){S.addWall(this.grid,t,e)}addSwamp(t,e,s,i){S.addSwamp(this.grid,t,e,s,i)}exportMap(){return S.exportMap(this.grid)}importMap(t){const e=S.importMap(t);return e?(this.grid=e,this.canvasRenderer.setGridSize(e.width,e.height),!0):!1}getCellAt(t,e){return this.grid.getCell(t,e)}placeCell(t,e,s){this.grid.setCell(t,e,s)}destroy(){cancelAnimationFrame(this.animFrameId),this.engine.destroy(),this.canvasRenderer.destroy(),this.webglRenderer?.destroy(),this.webgpuRenderer?.destroy()}}class tt{constructor(t){this.container=t,this.container.innerHTML=`
      <div class="data-panel">
        <div class="data-row">
          <span class="data-label">回合</span>
          <span class="data-value" id="stat-tick">0</span>
        </div>
        <div class="data-row">
          <span class="data-label" style="color:${A[u.RED]}">紅軍</span>
          <span class="data-value" id="stat-red" style="color:${A[u.RED]}">0</span>
        </div>
        <div class="data-row">
          <span class="data-label" style="color:${A[u.BLUE]}">藍軍</span>
          <span class="data-value" id="stat-blue" style="color:${A[u.BLUE]}">0</span>
        </div>
        <div class="data-row">
          <span class="data-label">FPS</span>
          <span class="data-value" id="stat-fps">0</span>
        </div>
        <div class="data-row">
          <span class="data-label">計算</span>
          <span class="data-value" id="stat-compute">0ms</span>
        </div>
        <div class="data-row">
          <span class="data-label">速度</span>
          <span class="data-value" id="stat-speed">1x</span>
        </div>
      </div>
    `,this.tickEl=this.container.querySelector("#stat-tick"),this.redEl=this.container.querySelector("#stat-red"),this.blueEl=this.container.querySelector("#stat-blue"),this.fpsEl=this.container.querySelector("#stat-fps"),this.computeEl=this.container.querySelector("#stat-compute"),this.speedEl=this.container.querySelector("#stat-speed")}update(t,e){this.tickEl.textContent=t.tick.toString(),this.redEl.textContent=t.redCount.toLocaleString(),this.blueEl.textContent=t.blueCount.toLocaleString(),this.fpsEl.textContent=t.fps.toString(),this.computeEl.textContent=t.computeTime.toFixed(1)+"ms",this.speedEl.textContent=e+"x"}getElement(){return this.container}}class et{constructor(t,e){this.buttons=new Map,this.cooldownOverlays=new Map,this.activeFaction=u.RED,this.container=t,this.onSkillSelect=e,this.build()}build(){this.container.innerHTML=`
      <div class="skill-panel">
        <div class="skill-header">
          <span>戰術技能</span>
          <button class="faction-toggle" id="faction-toggle" style="background:${A[u.RED]};border:none;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:12px;">
            紅軍
          </button>
        </div>
        <div class="skill-buttons" id="skill-buttons"></div>
      </div>
    `;const t=this.container.querySelector("#skill-buttons");this.factionBtn=this.container.querySelector("#faction-toggle");const e=[{type:E.METEOR,icon:"☄️",name:"隕石"},{type:E.GENE_BOOST,icon:"🧬",name:"強化"},{type:E.SWAMP_TERRAIN,icon:"🌿",name:"沼澤"}];for(const s of e){const i=document.createElement("div");i.className="skill-btn-wrapper",i.style.cssText="position:relative;display:inline-block;margin:3px;";const n=document.createElement("button");n.className="skill-btn",n.innerHTML=`<span class="skill-icon">${s.icon}</span><span class="skill-name">${s.name}</span>`,n.style.cssText=`
        background: #1c2333;
        border: 2px solid #2d3748;
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 60px;
        transition: all 0.15s;
      `,n.title=s.name;const r=document.createElement("div");r.className="cooldown-overlay",r.style.cssText=`
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ff6b6b;
        font-weight: bold;
        font-size: 14px;
        pointer-events: none;
        display: none;
      `,n.addEventListener("click",()=>{this.onSkillSelect(s.type),n.style.borderColor="#ffd93d",setTimeout(()=>{n.style.borderColor="#2d3748"},300)}),n.addEventListener("mouseenter",()=>{n.style.background="#2d3748"}),n.addEventListener("mouseleave",()=>{n.style.background="#1c2333"}),i.appendChild(n),i.appendChild(r),t.appendChild(i),this.buttons.set(s.type,n),this.cooldownOverlays.set(s.type,r)}this.factionBtn.addEventListener("click",()=>{this.activeFaction=this.activeFaction===u.RED?u.BLUE:u.RED,this.factionBtn.textContent=this.activeFaction===u.RED?"紅軍":"藍軍",this.factionBtn.style.background=A[this.activeFaction]})}getActiveFaction(){return this.activeFaction}updateSkills(t){for(const e of t){const s=this.buttons.get(e.type),i=this.cooldownOverlays.get(e.type);!s||!i||(e.currentCooldown>0?(i.style.display="flex",i.textContent=e.currentCooldown.toString(),s.style.opacity="0.6",s.style.cursor="not-allowed"):(i.style.display="none",s.style.opacity="1",s.style.cursor="pointer"))}}getElement(){return this.container}}class st{constructor(t,e){this.speedButtons=[],this.pauseBtn=null,this.container=t,this.onPause=e.onPause,this.onSpeedChange=e.onSpeedChange,this.onUndo=e.onUndo,this.onReset=e.onReset,this.build()}build(){this.container.innerHTML=`
      <div class="time-control-panel">
        <button id="tc-pause" class="tc-btn" title="暫停/播放">⏸️</button>
        <div class="tc-speed-group">
          ${W.filter(i=>i>0).map(i=>`
            <button class="tc-btn tc-speed" data-speed="${i}">${i}x</button>
          `).join("")}
        </div>
        <button id="tc-undo" class="tc-btn" title="時空回溯 (Undo)">⏪</button>
        <button id="tc-reset" class="tc-btn" title="重置">🔄</button>
      </div>
    `,this.pauseBtn=this.container.querySelector("#tc-pause");const t=this.container.querySelector("#tc-undo"),e=this.container.querySelector("#tc-reset");this.pauseBtn.addEventListener("click",()=>this.onPause()),t.addEventListener("click",()=>this.onUndo()),e.addEventListener("click",()=>this.onReset()),this.container.querySelectorAll(".tc-speed").forEach(i=>{const n=i,r=parseInt(n.dataset.speed||"1");n.addEventListener("click",()=>{this.onSpeedChange(r),this.updateSpeedSelection(r)}),this.speedButtons.push(n)}),this.updateSpeedSelection(1)}updateSpeedSelection(t){for(const e of this.speedButtons){const s=parseInt(e.dataset.speed||"1");e.style.background=s===t?"#457b9d":"#1c2333",e.style.color=s===t?"#fff":"#888"}}setPaused(t){this.pauseBtn&&(this.pauseBtn.textContent=t?"▶️":"⏸️",this.pauseBtn.style.background=t?"#2d6a4f":"#1c2333")}getElement(){return this.container}}class it{constructor(t,e){this.container=t,this.macroEngine=e,this.build()}build(){this.container.innerHTML=`
      <div class="macro-panel">
        <div class="macro-header">
          <span>基因宏腳本</span>
          <label class="macro-toggle">
            <input type="checkbox" id="macro-enable" /> 啟用
          </label>
        </div>
        <textarea id="macro-script" rows="5" placeholder="// 輸入巨集腳本...
// 範例:
// IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone"
          style="width:100%;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:8px;font-family:monospace;font-size:11px;resize:vertical;"></textarea>
        <div class="macro-actions">
          <button id="macro-run" style="background:#238636;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;">解析並執行</button>
          <button id="macro-example" style="background:#1c2333;color:#888;border:1px solid #30363d;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;">載入範例</button>
        </div>
        <div id="macro-log" style="max-height:80px;overflow-y:auto;background:#0d1117;border:1px solid #30363d;border-radius:4px;padding:6px;margin-top:4px;font-family:monospace;font-size:10px;color:#8b949e;"></div>
      </div>
    `,this.textarea=this.container.querySelector("#macro-script"),this.enableCheckbox=this.container.querySelector("#macro-enable"),this.runBtn=this.container.querySelector("#macro-run"),this.logEl=this.container.querySelector("#macro-log"),this.enableCheckbox.addEventListener("change",()=>{this.macroEngine.setEnabled(this.enableCheckbox.checked)}),this.runBtn.addEventListener("click",()=>{const e=this.textarea.value,s=this.macroEngine.parseScript(e);this.updateLog(),s?(this.runBtn.textContent="✓ 已解析",this.runBtn.style.background="#238636",setTimeout(()=>{this.runBtn.textContent="解析並執行"},1500)):(this.runBtn.textContent="✗ 解析失敗",this.runBtn.style.background="#da3633",setTimeout(()=>{this.runBtn.textContent="解析並執行",this.runBtn.style.background="#238636"},1500))}),this.container.querySelector("#macro-example").addEventListener("click",()=>{this.textarea.value=I.getExampleScript()})}updateLog(){const t=this.macroEngine.getLog();this.logEl.innerHTML=t.map(e=>`<div>${e}</div>`).join(""),this.logEl.scrollTop=this.logEl.scrollHeight}getElement(){return this.container}}class rt{constructor(){this.updateInterval=0,this.init()}init(){const t=document.getElementById("app");t.innerHTML=`
      <div class="app-layout">
        <!-- Top toolbar -->
        <div class="toolbar" id="toolbar">
          <div class="toolbar-left">
            <span class="logo">🧬 終極細胞自動機戰術模擬器</span>
          </div>
          <div class="toolbar-center" id="toolbar-center"></div>
          <div class="toolbar-right" id="toolbar-right"></div>
        </div>

        <!-- Main content area -->
        <div class="main-content">
          <!-- Left sidebar -->
          <div class="sidebar sidebar-left" id="sidebar-left">
            <div id="data-panel-container"></div>
            <div id="skill-panel-container"></div>
            <div id="settings-container">
              <div class="panel-section">
                <div class="panel-title">地圖設置</div>
                <div class="setting-row">
                  <label>網格大小</label>
                  <select id="grid-size-select" style="background:#1c2333;color:#e0e0e0;border:1px solid #30363d;border-radius:4px;padding:3px 6px;font-size:12px;">
                    <option value="100">100×100</option>
                    <option value="500">500×500</option>
                    <option value="1000">1000×1000 (GPU)</option>
                  </select>
                </div>
                <div class="setting-row">
                  <label>渲染模式</label>
                  <select id="render-mode-select" style="background:#1c2333;color:#e0e0e0;border:1px solid #30363d;border-radius:4px;padding:3px 6px;font-size:12px;">
                    <option value="canvas2d">Canvas 2D</option>
                    <option value="webgl">WebGL</option>
                    <option value="webgpu">WebGPU</option>
                  </select>
                </div>
                <div class="setting-row">
                  <label>
                    <input type="checkbox" id="leviathan-toggle" /> 
                    召喚 Leviathan Boss
                  </label>
                </div>
                <div class="setting-row">
                  <label>
                    <input type="checkbox" id="grid-lines-toggle" /> 
                    顯示網格線
                  </label>
                </div>
              </div>
              <div class="panel-section">
                <div class="panel-title">地圖序列化</div>
                <button id="export-map-btn" class="small-btn">匯出 JSON</button>
                <button id="import-map-btn" class="small-btn">匯入 JSON</button>
                <textarea id="map-json-input" rows="3" placeholder="貼上 JSON 地圖資料..." style="width:100%;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:4px;font-size:10px;margin-top:4px;resize:vertical;display:none;"></textarea>
              </div>
            </div>
          </div>

          <!-- Canvas area -->
          <div class="canvas-container" id="canvas-container">
            <canvas id="main-canvas"></canvas>
          </div>

          <!-- Right sidebar -->
          <div class="sidebar sidebar-right" id="sidebar-right">
            <div id="macro-panel-container"></div>
            <div class="panel-section">
              <div class="panel-title">歷史趨勢</div>
              <canvas id="chart-canvas" style="width:100%;height:120px;"></canvas>
            </div>
            <div class="panel-section">
              <div class="panel-title">操作說明</div>
              <div class="help-text">
                <p>🖱️ 點擊/拖曳放置細胞</p>
                <p>⌨️ Space: 暫停/播放</p>
                <p>⌨️ Ctrl+Z: 時空回溯</p>
                <p>⌨️ 1/2/3: 切換速度</p>
                <p>🎯 選擇技能後點擊地圖施放</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;const e=document.getElementById("main-canvas"),s=document.getElementById("chart-canvas");this.resizeCanvas(e),this.game=new Q(e,s,_),this.dataPanel=new tt(document.getElementById("data-panel-container")),this.skillPanel=new et(document.getElementById("skill-panel-container"),i=>this.onSkillSelect(i)),this.timeControl=new st(document.getElementById("toolbar-center"),{onPause:()=>this.game.togglePause(),onSpeedChange:i=>this.game.setSpeed(i),onUndo:()=>this.game.undo(),onReset:()=>this.game.reset()}),this.macroPanel=new it(document.getElementById("macro-panel-container"),this.game.getMacroEngine()),this.setupSettingsHandlers(e),this.game.start(),this.updateInterval=window.setInterval(()=>this.updateUI(),100),window.addEventListener("resize",()=>{this.resizeCanvas(e),this.game.resize(e.clientWidth,e.clientHeight)})}resizeCanvas(t){const e=document.getElementById("canvas-container");e&&(t.style.width=e.clientWidth+"px",t.style.height=e.clientHeight+"px")}onSkillSelect(t){this.game.getSelectedSkill()===t?this.game.selectSkill(null):this.game.selectSkill(t)}setupSettingsHandlers(t){const e=document.getElementById("grid-size-select");e.addEventListener("change",()=>{const a=parseInt(e.value);this.game.setGridSize(a),this.resizeCanvas(t),this.game.resize(t.clientWidth,t.clientHeight)});const s=document.getElementById("render-mode-select");s.addEventListener("change",()=>{this.game.setRenderMode(s.value)});const i=document.getElementById("leviathan-toggle");i.addEventListener("change",()=>{this.game.enableLeviathan(i.checked)}),document.getElementById("grid-lines-toggle");const n=document.getElementById("export-map-btn"),r=document.getElementById("import-map-btn"),o=document.getElementById("map-json-input");n.addEventListener("click",()=>{const a=this.game.exportMap();o.value=a,o.style.display="block"}),r.addEventListener("click",()=>{o.style.display=o.style.display==="none"?"block":"none"}),o.addEventListener("change",()=>{o.value.trim()&&(this.game.importMap(o.value)?r.textContent="✓ 已匯入":r.textContent="✗ 格式錯誤",setTimeout(()=>{r.textContent="匯入 JSON"},2e3))})}updateUI(){const t=this.game.getStatsTracker().getStats(),e=this.game.getTimeController().getSpeed();this.dataPanel.update(t,e);const s=this.game.getSkillSystem().getAllSkills();this.skillPanel.updateSkills(s);const i=this.game.getTimeController().isPaused();this.timeControl.setPaused(i),this.timeControl.updateSpeedSelection(e),this.game.getMacroEngine().isEnabled()&&this.macroPanel.updateLog()}}window.addEventListener("DOMContentLoaded",()=>{new rt});
//# sourceMappingURL=index-KIWpnfJi.js.map
