(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();var h=(p=>(p[p.EMPTY=0]="EMPTY",p[p.RED=1]="RED",p[p.BLUE=2]="BLUE",p))(h||{}),T=(p=>(p[p.NORMAL=0]="NORMAL",p[p.WALL=1]="WALL",p[p.SWAMP=2]="SWAMP",p))(T||{}),B=(p=>(p[p.NONE=0]="NONE",p[p.GENE_BOOST=1]="GENE_BOOST",p))(B||{}),x=(p=>(p.METEOR="meteor",p.GENE_BOOST="gene_boost",p.SWAMP_TERRAIN="swamp",p))(x||{});const D={survivalMin:2,survivalMax:3,birthCount:3},_=100,k={0:"#0a0e17",1:"#e63946",2:"#457b9d",WALL:"#2d3142",SWAMP:"#2d6a4f",GRID_LINE:"#151b2b",LEVIATHAN:"#9b5de5",GENE_BOOST:"#f9c74f"},N={meteor:{type:"meteor",name:"隕石打擊",description:"清除半徑5格內的所有細胞",cooldown:30,icon:"☄️"},gene_boost:{type:"gene_boost",name:"基因強化",description:"3x3區域內我方細胞20回合內不會擁擠死亡",cooldown:20,icon:"🧬"},swamp:{type:"swamp",name:"沼澤地形",description:"將區域轉化為沼澤，改變繁殖條件",cooldown:15,icon:"🌿"}},O=[0,1,2,5],W=50,L=500;class P{constructor(t){this.width=t.width,this.height=t.height;const e=this.width*this.height;this.cells=new Uint8Array(e),this.terrain=new Uint8Array(e),this.buffs=new Uint8Array(e),this.buffDurations=new Int16Array(e)}idx(t,e){return e*this.width+t}inBounds(t,e){return t>=0&&t<this.width&&e>=0&&e<this.height}getCell(t,e){return this.inBounds(t,e)?this.cells[this.idx(t,e)]:h.EMPTY}setCell(t,e,s){this.inBounds(t,e)&&(this.cells[this.idx(t,e)]=s)}getTerrain(t,e){return this.inBounds(t,e)?this.terrain[this.idx(t,e)]:T.NORMAL}setTerrain(t,e,s){this.inBounds(t,e)&&(this.terrain[this.idx(t,e)]=s)}getBuff(t,e){return this.inBounds(t,e)?this.buffs[this.idx(t,e)]:B.NONE}setBuff(t,e,s,i){if(!this.inBounds(t,e))return;const r=this.idx(t,e);this.buffs[r]=s,this.buffDurations[r]=i}clearBuff(t,e){if(!this.inBounds(t,e))return;const s=this.idx(t,e);this.buffs[s]=B.NONE,this.buffDurations[s]=0}tickBuffs(){for(let t=0;t<this.buffDurations.length;t++)this.buffDurations[t]>0&&(this.buffDurations[t]--,this.buffDurations[t]<=0&&(this.buffs[t]=B.NONE))}countNeighbors(t,e,s){let i=0;for(let r=-1;r<=1;r++)for(let n=-1;n<=1;n++){if(n===0&&r===0)continue;const a=t+n,l=e+r;this.inBounds(a,l)&&this.cells[this.idx(a,l)]===s&&i++}return i}countRed(){let t=0;for(let e=0;e<this.cells.length;e++)this.cells[e]===h.RED&&t++;return t}countBlue(){let t=0;for(let e=0;e<this.cells.length;e++)this.cells[e]===h.BLUE&&t++;return t}getCellsArray(){return this.cells}getTerrainArray(){return this.terrain}getBuffsArray(){return this.buffs}getBuffDurationsArray(){return this.buffDurations}setCellsFromBuffer(t){this.cells.set(t)}setBuffsFromBuffer(t){this.buffs.set(t)}setBuffDurationsFromBuffer(t){this.buffDurations.set(t)}clear(){this.cells.fill(0),this.terrain.fill(0),this.buffs.fill(0),this.buffDurations.fill(0)}clone(){const t=new P({width:this.width,height:this.height});return t.cells.set(this.cells),t.terrain.set(this.terrain),t.buffs.set(this.buffs),t.buffDurations.set(this.buffDurations),t}placeCellsRandom(t=.3){for(let e=0;e<this.height;e++)for(let s=0;s<this.width;s++)if(Math.random()<t){const i=Math.random()<.5?h.RED:h.BLUE;this.setCell(s,e,i)}}placeInitialPattern(){const t=Math.floor(this.width/2),e=.25;for(let s=0;s<this.height;s++)for(let i=0;i<t-5;i++)Math.random()<e&&this.setCell(i,s,h.RED);for(let s=0;s<this.height;s++)for(let i=t+5;i<this.width;i++)Math.random()<e&&this.setCell(i,s,h.BLUE)}toJSON(){return{width:this.width,height:this.height,cells:Array.from(this.cells),terrain:Array.from(this.terrain),version:"1.0.0"}}static fromJSON(t){const e=new P({width:t.width,height:t.height});return e.cells.set(new Uint8Array(t.cells)),e.terrain.set(new Uint8Array(t.terrain)),e}exportJSON(){return JSON.stringify(this.toJSON())}static importJSON(t){const e=JSON.parse(t);return P.fromJSON(e)}createDiffSnapshot(){return{cells:new Uint8Array(this.cells),terrain:new Uint8Array(this.terrain),buffs:new Uint8Array(this.buffs),buffDurations:new Int16Array(this.buffDurations)}}restoreFromSnapshot(t){this.cells.set(t.cells),this.terrain.set(t.terrain),this.buffs.set(t.buffs),this.buffDurations.set(t.buffDurations)}}class S{static countNeighbors(t,e,s,i,r,n){let a=0;for(let l=-1;l<=1;l++)for(let o=-1;o<=1;o++){if(o===0&&l===0)continue;const c=e+o,d=s+l;c>=0&&c<i&&d>=0&&d<r&&t[d*i+c]===n&&a++}return a}static getEffectiveBirthCount(t,e){switch(e){case T.SWAMP:return t+1;default:return t}}static getEffectiveSurvivalMax(t,e){switch(e){case B.GENE_BOOST:return t+1;default:return t}}static computeCell(t,e,s,i,r,n,a,l=D){const o=r*n+i,c=t[o],d=e[o],m=s[o];if(d===T.WALL)return h.EMPTY;const f=S.countNeighbors(t,i,r,n,a,h.RED),g=S.countNeighbors(t,i,r,n,a,h.BLUE);if(c!==h.EMPTY){const u=c===h.RED?f:g,b=S.getEffectiveSurvivalMax(l.survivalMax,m);return u<l.survivalMin||u>b?h.EMPTY:c}else{const u=S.getEffectiveBirthCount(l.birthCount,d),b=f===u,E=g===u;return b&&E?f>g?h.RED:g>f?h.BLUE:Math.random()<.5?h.RED:h.BLUE:b?h.RED:E?h.BLUE:h.EMPTY}}static computeNextGeneration(t,e,s,i,r,n=D){const a=i*r,l=new Uint8Array(a);for(let o=0;o<r;o++)for(let c=0;c<i;c++){const d=o*i+c;if(e[d]===T.WALL){l[d]=h.EMPTY;continue}l[d]=S.computeCell(t,e,s,c,o,i,r,n)}return l}static computeWithDiffs(t,e,s,i,r,n=D){const a=i*r,l=new Uint8Array(a),o=[],c=[];for(let d=0;d<r;d++)for(let m=0;m<i;m++){const f=d*i+m,g=e[f];let u;g===T.WALL?u=h.EMPTY:u=S.computeCell(t,e,s,m,d,i,r,n),u!==t[f]&&(o.push(f),c.push(t[f])),l[f]=u}return{newCells:l,changeIndices:o,oldValues:c}}static countCells(t){let e=0,s=0,i=0;for(let r=0;r<t.length;r++)switch(t[r]){case h.RED:e++;break;case h.BLUE:s++;break;default:i++;break}return{red:e,blue:s,empty:i}}static findHighestDensityZone(t,e,s,i,r=10){let n=0,a=0,l=0;const o=Math.floor(r/2);for(let c=o;c<i-o;c+=o)for(let d=o;d<s-o;d+=o){let m=0;for(let f=-o;f<o;f++)for(let g=-o;g<o;g++){const u=d+g,b=c+f;u>=0&&u<s&&b>=0&&b<i&&t[b*s+u]===e&&m++}m>l&&(l=m,n=d,a=c)}return{x:n,y:a,count:l}}}class G{constructor(){this.worker=null,this.requestId=0,this.pendingResolve=null,this.useWorker=!1,this.workerReady=!1,this.initWorker()}initWorker(){try{this.worker=new Worker(new URL("/cellular-automata-tactics-simulator/assets/GameWorker-C8ru4sYW.js",import.meta.url),{type:"module"}),this.worker.onmessage=t=>this.handleWorkerMessage(t),this.worker.onerror=t=>{console.warn("Worker error, falling back to main thread:",t),this.useWorker=!1},this.useWorker=!0,this.workerReady=!0}catch(t){console.warn("Web Worker not available, using main thread:",t),this.useWorker=!1}}handleWorkerMessage(t){const e=t.data;e.type==="result"&&e.id===this.requestId&&this.pendingResolve&&(this.pendingResolve({cells:new Uint8Array(e.cells),buffs:new Uint8Array(e.buffs),buffDurations:new Int16Array(e.buffDurations),changes:new Uint8Array(e.changes),redCount:e.redCount,blueCount:e.blueCount,computeTime:e.computeTime}),this.pendingResolve=null)}async computeNext(t,e=D){return this.useWorker&&this.worker&&this.workerReady?this.computeWithWorker(t,e):this.computeMainThread(t,e)}computeWithWorker(t,e){return new Promise(s=>{this.requestId++,this.pendingResolve=s;const i=new Uint8Array(t.getCellsArray()),r=new Uint8Array(t.getTerrainArray()),n=new Uint8Array(t.getBuffsArray()),a=new Int16Array(t.getBuffDurationsArray());this.worker.postMessage({id:this.requestId,type:"compute",cells:i.buffer,terrain:r.buffer,buffs:n.buffer,buffDurations:a.buffer,width:t.width,height:t.height,config:e},[i.buffer,r.buffer,n.buffer,a.buffer])})}computeMainThread(t,e){const s=performance.now(),i=t.getCellsArray(),r=t.getTerrainArray(),n=t.getBuffsArray(),a=t.getBuffDurationsArray(),l=t.width,o=t.height,c=l*o,d=new Uint8Array(n),m=new Int16Array(a);for(let v=0;v<c;v++)m[v]>0&&(m[v]--,m[v]<=0&&(d[v]=B.NONE));const{newCells:f,changeIndices:g,oldValues:u}=S.computeWithDiffs(i,r,d,l,o,e),b=[];for(let v=0;v<g.length;v++)b.push(g[v],u[v],f[g[v]]);const E=new Uint8Array(b),y=S.countCells(f),w=performance.now()-s;return{cells:f,buffs:d,buffDurations:m,changes:E,redCount:y.red,blueCount:y.blue,computeTime:w}}computeSync(t,e=D){return this.computeMainThread(t,e)}destroy(){this.worker&&(this.worker.terminate(),this.worker=null),this.useWorker=!1,this.workerReady=!1}}class F{constructor(){this.skills=new Map,this.activeFaction=h.RED;for(const t of Object.values(x)){const e=N[t];this.skills.set(t,{...e,currentCooldown:0})}}setActiveFaction(t){this.activeFaction=t}getActiveFaction(){return this.activeFaction}getSkill(t){return this.skills.get(t)}getAllSkills(){return Array.from(this.skills.values())}canUse(t){const e=this.skills.get(t);return e!==void 0&&e.currentCooldown<=0}tickCooldowns(){for(const t of this.skills.values())t.currentCooldown>0&&t.currentCooldown--}executeSkill(t,e,s){if(!this.canUse(t))return!1;const i=this.skills.get(t);let r=!1;switch(t){case x.METEOR:r=this.executeMeteor(e,s);break;case x.GENE_BOOST:r=this.executeGeneBoost(e,s);break;case x.SWAMP_TERRAIN:r=this.executeSwamp(e,s);break}return r&&(i.currentCooldown=i.cooldown),r}executeMeteor(t,e){for(let i=-5;i<=5;i++)for(let r=-5;r<=5;r++)if(r*r+i*i<=5*5){const n=e.x+r,a=e.y+i;t.inBounds(n,a)&&t.getTerrain(n,a)!==T.WALL&&t.setCell(n,a,h.EMPTY)}return!0}executeGeneBoost(t,e){let s=!1;for(let i=-1;i<=1;i++)for(let r=-1;r<=1;r++){const n=e.x+r,a=e.y+i;t.inBounds(n,a)&&t.getCell(n,a)===this.activeFaction&&(t.setBuff(n,a,1,20),s=!0)}return s}executeSwamp(t,e){let s=!1;for(let i=-2;i<=2;i++)for(let r=-2;r<=2;r++){const n=e.x+r,a=e.y+i;t.inBounds(n,a)&&t.getTerrain(n,a)!==T.WALL&&(t.setTerrain(n,a,T.SWAMP),s=!0)}return s}setCooldown(t,e){const s=this.skills.get(t);s&&(s.currentCooldown=e)}resetAll(){for(const t of this.skills.values())t.currentCooldown=0}}class z{constructor(){this.speed=1,this.paused=!1,this.history=[],this.future=[],this.currentTick=0}getSpeed(){return this.speed}setSpeed(t){this.speed=t}isPaused(){return this.paused}setPaused(t){this.paused=t}togglePause(){return this.paused=!this.paused,this.paused}getCurrentTick(){return this.currentTick}setCurrentTick(t){this.currentTick=t}incrementTick(){this.currentTick++}saveSnapshot(t){const e={cells:new Uint8Array(t.getCellsArray()),terrain:new Uint8Array(t.getTerrainArray()),buffs:new Uint8Array(t.getBuffsArray()),buffDurations:new Int16Array(t.getBuffDurationsArray()),tick:this.currentTick};this.history.push(e),this.history.length>W&&this.history.shift(),this.future=[]}undo(t){if(this.history.length===0)return!1;const e={cells:new Uint8Array(t.getCellsArray()),terrain:new Uint8Array(t.getTerrainArray()),buffs:new Uint8Array(t.getBuffsArray()),buffDurations:new Int16Array(t.getBuffDurationsArray()),tick:this.currentTick};this.future.push(e);const s=this.history.pop();return t.setCellsFromBuffer(s.cells),t.getTerrainArray().set(s.terrain),t.getBuffsArray().set(s.buffs),t.getBuffDurationsArray().set(s.buffDurations),this.currentTick=s.tick,!0}redo(t){if(this.future.length===0)return!1;const e={cells:new Uint8Array(t.getCellsArray()),terrain:new Uint8Array(t.getTerrainArray()),buffs:new Uint8Array(t.getBuffsArray()),buffDurations:new Int16Array(t.getBuffDurationsArray()),tick:this.currentTick};this.history.push(e);const s=this.future.pop();return t.setCellsFromBuffer(s.cells),t.getTerrainArray().set(s.terrain),t.getBuffsArray().set(s.buffs),t.getBuffDurationsArray().set(s.buffDurations),this.currentTick=s.tick,!0}canUndo(){return this.history.length>0}canRedo(){return this.future.length>0}getHistoryLength(){return this.history.length}getFutureLength(){return this.future.length}clearHistory(){this.history=[],this.future=[],this.currentTick=0}}class H{constructor(){this.redCount=0,this.blueCount=0,this.tick=0,this.fps=0,this.computeTime=0,this.history=[],this.frameCount=0,this.lastFpsTime=performance.now()}update(t,e,s,i){this.redCount=t,this.blueCount=e,this.tick=s,this.computeTime=i,this.history.push({tick:s,red:t,blue:e}),this.history.length>L&&(this.history=this.history.slice(-L))}tickFps(){this.frameCount++;const t=performance.now(),e=t-this.lastFpsTime;e>=1e3&&(this.fps=Math.round(this.frameCount*1e3/e),this.frameCount=0,this.lastFpsTime=t)}getRedCount(){return this.redCount}getBlueCount(){return this.blueCount}getTick(){return this.tick}getFps(){return this.fps}getComputeTime(){return this.computeTime}getHistory(){return this.history}getStats(){return{tick:this.tick,redCount:this.redCount,blueCount:this.blueCount,fps:this.fps,computeTime:this.computeTime}}clear(){this.redCount=0,this.blueCount=0,this.tick=0,this.fps=0,this.computeTime=0,this.history=[],this.frameCount=0,this.lastFpsTime=performance.now()}}class C{static addWall(t,e,s){t.inBounds(e,s)&&(t.setTerrain(e,s,T.WALL),t.setCell(e,s,0))}static addWallLine(t,e,s,i,r){const n=Math.abs(i-e),a=Math.abs(r-s),l=e<i?1:-1,o=s<r?1:-1;let c=n-a,d=e,m=s;for(;C.addWall(t,d,m),!(d===i&&m===r);){const f=2*c;f>-a&&(c-=a,d+=l),f<n&&(c+=n,m+=o)}}static addWallRect(t,e,s,i,r){for(let n=0;n<i;n++)C.addWall(t,e+n,s),C.addWall(t,e+n,s+r-1);for(let n=0;n<r;n++)C.addWall(t,e,s+n),C.addWall(t,e+i-1,s+n)}static addSwamp(t,e,s,i,r){for(let n=0;n<r;n++)for(let a=0;a<i;a++){const l=e+a,o=s+n;t.inBounds(l,o)&&t.getTerrain(l,o)!==T.WALL&&t.setTerrain(l,o,T.SWAMP)}}static clearTerrain(t,e,s){t.inBounds(e,s)&&t.setTerrain(e,s,T.NORMAL)}static generateRandomTerrain(t,e=5,s=3){for(let i=0;i<e;i++){const r=Math.floor(Math.random()*t.width),n=Math.floor(Math.random()*t.height),a=Math.min(t.width-1,r+Math.floor(Math.random()*20)-10),l=Math.min(t.height-1,n+Math.floor(Math.random()*20)-10);C.addWallLine(t,Math.max(0,r),Math.max(0,n),Math.max(0,a),Math.max(0,l))}for(let i=0;i<s;i++){const r=Math.floor(Math.random()*(t.width-10)),n=Math.floor(Math.random()*(t.height-10)),a=5+Math.floor(Math.random()*10),l=5+Math.floor(Math.random()*10);C.addSwamp(t,r,n,a,l)}}static exportMap(t){return t.exportJSON()}static importMap(t){try{return P.importJSON(t)}catch{return console.error("Failed to parse map JSON"),null}}static validateMap(t){return!(!t.width||!t.height||!t.cells||t.cells.length!==t.width*t.height||!t.terrain||t.terrain.length!==t.width*t.height)}}class X{constructor(t,e){this.pathRecalcInterval=5,this.tickCounter=0,this.state={x:t,y:e,size:3,hp:100,maxHp:100,targetX:t,targetY:e,alive:!0,path:[],moveTimer:0}}getState(){return{...this.state}}isAlive(){return this.state.alive}getPosition(){return{x:this.state.x,y:this.state.y}}update(t){this.state.alive&&(this.tickCounter++,(this.tickCounter%this.pathRecalcInterval===0||this.state.path.length===0)&&(this.findTarget(t),this.calculatePath(t)),this.state.path.length>0&&this.moveAlongPath(t),this.consumeCells(t),this.state.hp=Math.max(0,this.state.hp-.1),this.state.hp<=0&&(this.state.alive=!1))}findTarget(t){const e=t.getCellsArray();S.findHighestDensityZone(e,h.EMPTY,t.width,t.height,15);let s=0,i=0,r=0;const n=15,a=Math.floor(n/2),l=Math.max(1,Math.floor(n/2));for(let o=a;o<t.height-a;o+=l)for(let c=a;c<t.width-a;c+=l){let d=0;for(let m=-a;m<a;m++)for(let f=-a;f<a;f++){const g=c+f,u=o+m;g>=0&&g<t.width&&u>=0&&u<t.height&&e[u*t.width+g]!==h.EMPTY&&d++}d>r&&(r=d,s=c,i=o)}this.state.targetX=s,this.state.targetY=i}calculatePath(t){const e=this.state.x,s=this.state.y,i=this.state.targetX,r=this.state.targetY,n=[],a=new Set,l=(f,g)=>g*t.width+f,o=(f,g)=>Math.abs(f-i)+Math.abs(g-r),c={x:e,y:s,g:0,h:o(e,s),f:o(e,s),parent:null};n.push(c);let d=0;const m=2e3;for(;n.length>0&&d<m;){d++;let f=0;for(let u=1;u<n.length;u++)n[u].f<n[f].f&&(f=u);const g=n.splice(f,1)[0];if(Math.abs(g.x-i)<=2&&Math.abs(g.y-r)<=2){const u=[];let b=g;for(;b;)u.unshift({x:b.x,y:b.y}),b=b.parent;this.state.path=u;return}a.add(l(g.x,g.y));for(let u=-1;u<=1;u++)for(let b=-1;b<=1;b++){if(b===0&&u===0)continue;const E=g.x+b,y=g.y+u;if(!t.inBounds(E,y)||a.has(l(E,y))||t.getTerrain(E,y)===T.WALL)continue;const w=g.g+(b!==0&&u!==0?1.414:1),v=o(E,y),R=w+v,A=n.find(M=>M.x===E&&M.y===y);A?w<A.g&&(A.g=w,A.f=R,A.parent=g):n.push({x:E,y,g:w,h:v,f:R,parent:g})}}this.state.path=[{x:i,y:r}]}moveAlongPath(t){if(this.state.path.length<=1)return;const e=this.state.path[1],s=Math.sign(e.x-this.state.x),i=Math.sign(e.y-this.state.y),r=this.state.x+s,n=this.state.y+i;if(this.canMoveTo(t,r,n)){if(this.state.x=r,this.state.y=n,this.state.path.length>0){const a=this.state.path[0];a.x===r&&a.y===n&&this.state.path.shift()}}else this.state.path=[]}canMoveTo(t,e,s){for(let i=0;i<this.state.size;i++)for(let r=0;r<this.state.size;r++){const n=e+r,a=s+i;if(!t.inBounds(n,a)||t.getTerrain(n,a)===T.WALL)return!1}return!0}consumeCells(t){for(let e=0;e<this.state.size;e++)for(let s=0;s<this.state.size;s++){const i=this.state.x+s,r=this.state.y+e;t.inBounds(i,r)&&t.getCell(i,r)!==h.EMPTY&&(t.setCell(i,r,h.EMPTY),this.state.hp=Math.min(this.state.maxHp,this.state.hp+2))}}takeDamage(t){this.state.hp=Math.max(0,this.state.hp-t),this.state.hp<=0&&(this.state.alive=!1)}reset(t,e){this.state={x:t,y:e,size:3,hp:100,maxHp:100,targetX:t,targetY:e,alive:!0,path:[],moveTimer:0},this.tickCounter=0}}class I{constructor(){this.rules=[],this.rawScript="",this.enabled=!1,this.executionLog=[],this.maxLogSize=100}isEnabled(){return this.enabled}setEnabled(t){this.enabled=t}getScript(){return this.rawScript}getLog(){return this.executionLog}parseScript(t){this.rawScript=t,this.rules=[],this.executionLog=[];const e=t.split(`
`).map(s=>s.trim()).filter(s=>s.length>0&&!s.startsWith("//")&&!s.startsWith("#"));for(const s of e)try{const i=this.parseLine(s);i&&this.rules.push(i)}catch(i){return this.log(`Parse error: ${s} - ${i}`),!1}return this.log(`Parsed ${this.rules.length} rule(s)`),!0}parseLine(t){const s=t.toUpperCase().match(/^IF\s+(.+?)\s+THEN\s+(.+)$/);if(!s)return null;const i=s[1],r=s[2],a=i.split(/\s+AND\s+/).map(c=>{const d=c.trim(),m=d.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/);if(!m)throw new Error(`Invalid condition: ${d}`);return{left:m[1].toLowerCase(),operator:m[2],right:m[3].trim()}}),l=r.match(/^CAST\s+(\w+)\s+AT\s+(\w+)$/);if(!l)throw new Error(`Invalid action: ${r}`);const o={type:"cast",target:l[2].toLowerCase(),params:{skill:l[1].toLowerCase()}};return{conditions:a,action:o}}executeRules(t){if(!this.enabled||this.rules.length===0)return;const e=this.buildContext(t);for(const s of this.rules)this.evaluateConditions(s.conditions,e)&&this.executeAction(s.action,t,e)}buildContext(t){const s=t.getGrid().getCellsArray(),i=S.countCells(s),r=i.red+i.blue+i.empty,n=t.getSkillSystem();return{redCells:i.red,blueCells:i.blue,totalCells:r,tick:t.getTick(),meteorCooldown:n.getSkill(x.METEOR)?.currentCooldown??999,geneBoostCooldown:n.getSkill(x.GENE_BOOST)?.currentCooldown??999,swampCooldown:n.getSkill(x.SWAMP_TERRAIN)?.currentCooldown??999}}evaluateConditions(t,e){for(const s of t){const i=this.resolveValue(s.left,e),r=this.resolveValue(s.right,e);if(!this.compare(i,s.operator,r))return!1}return!0}resolveValue(t,e){const s=t.trim().toLowerCase();if(s.endsWith("%"))return parseFloat(s)/100;switch(s){case"red_cells":return e.redCells;case"blue_cells":return e.blueCells;case"total_cells":return e.totalCells;case"tick":return e.tick;case"meteor_cooldown":return e.meteorCooldown;case"gene_boost_cooldown":return e.geneBoostCooldown;case"swamp_cooldown":return e.swampCooldown;case"red_ratio":return e.totalCells>0?e.redCells/e.totalCells:0;case"blue_ratio":return e.totalCells>0?e.blueCells/e.totalCells:0;default:return parseFloat(s)||0}}compare(t,e,s){switch(e){case"==":return t===s;case"!=":return t!==s;case">":return t>s;case"<":return t<s;case">=":return t>=s;case"<=":return t<=s;default:return!1}}executeAction(t,e,s){if(t.type!=="cast"||!t.params)return;const i=t.params.skill,r=this.resolveSkillType(i);if(!r){this.log(`Unknown skill: ${i}`);return}const n=e.getSkillSystem();if(!n.canUse(r)){this.log(`Skill ${i} on cooldown`);return}let a,l;const o=e.getGrid();if(t.target==="highest_density_zone"){const d=S.findHighestDensityZone(o.getCellsArray(),h.RED,o.width,o.height,10);a=d.x,l=d.y}else t.target,a=Math.floor(o.width/2),l=Math.floor(o.height/2);n.executeSkill(r,o,{x:a,y:l})&&this.log(`Executed: CAST ${i} AT (${a}, ${l})`)}resolveSkillType(t){switch(t){case"meteor":return x.METEOR;case"gene_boost":case"geneboost":return x.GENE_BOOST;case"swamp":return x.SWAMP_TERRAIN;default:return null}}log(t){const e=new Date().toLocaleTimeString();this.executionLog.push(`[${e}] ${t}`),this.executionLog.length>this.maxLogSize&&this.executionLog.shift()}static getExampleScript(){return`// Gene Macro Script Example
// Conditions: IF blue_ratio > 0.4 AND meteor_cooldown == 0
// Action: CAST meteor AT highest_density_zone
IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone
IF red_cells < 500 AND gene_boost_cooldown == 0 THEN CAST gene_boost AT center`}}const Y={decisionInterval:6,placeProbability:.85,skillProbability:.35,scanRadius:14};class ${constructor(t={}){this.enabled=!1,this.decisionLog=[],this.maxLog=50,this.lastFaction=h.RED,this.tickCounter=0,this.skillsCast=0,this.cellsPlaced=0,this.config={...Y,...t}}isEnabled(){return this.enabled}setEnabled(t){this.enabled!==t&&(this.enabled=t,t?this.decisionLog.unshift({tick:0,faction:h.RED,action:"idle",x:0,y:0,reason:"🎬 觀眾模式啟動 — AI 接手操控"}):this.decisionLog.unshift({tick:0,faction:h.RED,action:"idle",x:0,y:0,reason:"⏸️ 觀眾模式關閉 — 玩家接手"}))}getConfig(){return this.config}updateConfig(t){this.config={...this.config,...t}}getLog(){return this.decisionLog}clearLog(){this.decisionLog=[],this.skillsCast=0,this.cellsPlaced=0}getStats(){return{skillsCast:this.skillsCast,cellsPlaced:this.cellsPlaced}}onTick(t,e,s){return this.tickCounter++,!this.enabled||this.tickCounter%this.config.decisionInterval!==0?null:this.makeDecision(t,e,s)}forceDecision(t,e,s){return this.makeDecision(t,e,s)}makeDecision(t,e,s){const i=S.countCells(e.getCellsArray()),r=i.red+i.blue+i.empty,n=r>0?i.red/r:.5,a=r>0?i.blue/r:.5,l=Math.abs(n-a);let o;l>.18&&Math.random()<.75?o=n<a?h.RED:h.BLUE:o=this.lastFaction===h.RED?h.BLUE:h.RED,this.lastFaction=o,s.setActiveFaction(o);const c=o===h.RED?h.BLUE:h.RED,d=S.findHighestDensityZone(e.getCellsArray(),c,e.width,e.height,this.config.scanRadius),m=S.findHighestDensityZone(e.getCellsArray(),o,e.width,e.height,this.config.scanRadius),f=S.findHighestDensityZone(e.getCellsArray(),h.EMPTY,e.width,e.height,this.config.scanRadius);if(Math.random()<this.config.skillProbability){const u=this.chooseSkill(o,c,e,s,i,l);if(u){const b=this.chooseSkillTarget(u.skill,o,c,e,d,m,f);if(s.executeSkill(u.skill,e,b)){this.skillsCast++;const y={tick:t,faction:o,action:"skill",skill:u.skill,x:b.x,y:b.y,reason:u.reason};return this.pushDecision(y),y}}}if(Math.random()<this.config.placeProbability){const u=this.chooseDropPoint(o,c,e,m,f,i);if(u){this.dropCluster(e,u.x,u.y,o),this.cellsPlaced+=9;const b=this.dropReason(o,u,i),E={tick:t,faction:o,action:"place",x:u.x,y:u.y,reason:b};return this.pushDecision(E),E}}const g={tick:t,faction:o,action:"idle",x:0,y:0,reason:"觀望局勢"};return this.pushDecision(g),g}chooseSkill(t,e,s,i,r,n){const a=[];if(i.canUse(x.GENE_BOOST)){const l=t===h.RED?r.red:r.blue,o=l*(1+n);a.push({skill:x.GENE_BOOST,score:o,reason:`🧬 強化我方密集區（${l} 細胞）`})}if(i.canUse(x.METEOR)){const l=t===h.RED?r.blue:r.red,o=l*(1+n*2);a.push({skill:x.METEOR,score:o,reason:`☄️ 隕石轟炸敵軍（${l} 細胞）`})}if(i.canUse(x.SWAMP_TERRAIN)&&a.push({skill:x.SWAMP_TERRAIN,score:40+Math.random()*30,reason:"🌿 部署沼澤切斷補給線"}),a.length===0)return null;for(const l of a)l.score+=Math.random()*50;return a.sort((l,o)=>o.score-l.score),a[0]}chooseSkillTarget(t,e,s,i,r,n,a){switch(t){case x.METEOR:return{x:this.clamp(r.x+(Math.random()<.5?0:1),5,i.width-6),y:this.clamp(r.y+(Math.random()<.5?0:1),5,i.height-6)};case x.GENE_BOOST:return{x:this.clamp(n.x,1,i.width-2),y:this.clamp(n.y,1,i.height-2)};case x.SWAMP_TERRAIN:return{x:this.clamp(Math.floor((n.x+r.x)/2),2,i.width-3),y:this.clamp(Math.floor((n.y+r.y)/2),2,i.height-3)}}}chooseDropPoint(t,e,s,i,r,n){return Math.random()<.7?{x:this.clamp(i.x+this.randOffset(8),3,s.width-4),y:this.clamp(i.y+this.randOffset(8),3,s.height-4)}:{x:this.clamp(r.x+this.randOffset(6),3,s.width-4),y:this.clamp(r.y+this.randOffset(6),3,s.height-4)}}dropReason(t,e,s){const i=t===h.RED?"🔴 紅軍":"🔵 藍軍",r=t===h.RED?s.red:s.blue;return s.empty>(s.red+s.blue)*2?`${i} 擴張領地（空地 ${s.empty} 格）`:`${i} 增援前線（${r} 細胞）`}dropCluster(t,e,s,i){for(let r=-1;r<=1;r++)for(let n=-1;n<=1;n++){const a=e+n,l=s+r;t.inBounds(a,l)&&t.getTerrain(a,l)!==T.WALL&&t.setCell(a,l,i)}}pushDecision(t){this.decisionLog.unshift(t),this.decisionLog.length>this.maxLog&&(this.decisionLog.length=this.maxLog)}clamp(t,e,s){return Math.max(e,Math.min(s,t))}randOffset(t){return Math.floor((Math.random()-.5)*2*t)}}class q{constructor(t){this.imageData=null,this.cellSize=4,this.offsetX=0,this.offsetY=0,this.showGrid=!1,this.gridWidth=100,this.gridHeight=100,this.colorTable=[[10,14,23],[230,57,70],[69,123,157],[45,49,66],[45,106,79],[249,199,79],[155,93,229]],this.canvas=t,this.ctx=t.getContext("2d",{alpha:!1}),this.resize()}resize(){const t=window.devicePixelRatio||1,e=this.canvas.getBoundingClientRect();this.canvas.width=e.width*t,this.canvas.height=e.height*t,this.ctx.scale(t,t),this.recalculateLayout()}recalculateLayout(){const t=this.canvas.getBoundingClientRect(),e=t.width,s=t.height;this.cellSize=Math.max(1,Math.floor(Math.min(e/this.gridWidth,s/this.gridHeight))),this.offsetX=Math.floor((e-this.cellSize*this.gridWidth)/2),this.offsetY=Math.floor((s-this.cellSize*this.gridHeight)/2)}setGridSize(t,e){this.gridWidth=t,this.gridHeight=e,this.recalculateLayout()}setShowGrid(t){this.showGrid=t}getCellSize(){return this.cellSize}screenToGrid(t,e){const s=this.canvas.getBoundingClientRect(),i=Math.floor((t-s.left-this.offsetX)/this.cellSize),r=Math.floor((e-s.top-this.offsetY)/this.cellSize);return i>=0&&i<this.gridWidth&&r>=0&&r<this.gridHeight?{x:i,y:r}:null}render(t,e){const s=this.canvas.getBoundingClientRect(),i=s.width,r=s.height;(!this.imageData||this.imageData.width!==this.canvas.width||this.imageData.height!==this.canvas.height)&&(this.imageData=this.ctx.createImageData(this.canvas.width,this.canvas.height));const n=this.imageData.data,a=window.devicePixelRatio||1,l=this.imageData.width,o=10,c=14,d=23;for(let y=0;y<n.length;y+=4)n[y]=o,n[y+1]=c,n[y+2]=d,n[y+3]=255;const m=t.getCellsArray(),f=t.getTerrainArray(),g=t.getBuffsArray(),u=this.cellSize*a,b=this.offsetX*a,E=this.offsetY*a;for(let y=0;y<this.gridHeight;y++)for(let w=0;w<this.gridWidth;w++){const v=y*this.gridWidth+w,R=f[v];if(R!==T.NORMAL){const A=R===T.WALL?this.colorTable[3]:this.colorTable[4];this.fillRect(n,l,w,y,u,b,E,A)}}for(let y=0;y<this.gridHeight;y++)for(let w=0;w<this.gridWidth;w++){const v=y*this.gridWidth+w,R=m[v];if(R!==h.EMPTY){let A=R;g[v]===B.GENE_BOOST&&(A=5),this.fillRect(n,l,w,y,u,b,E,this.colorTable[A])}}if(e&&e.alive){const y=this.colorTable[6];for(let w=0;w<e.size;w++)for(let v=0;v<e.size;v++)this.fillRect(n,l,e.x+v,e.y+w,u,b,E,y)}this.ctx.putImageData(this.imageData,0,0),this.showGrid&&this.cellSize>=4&&this.drawGridOverlay(i,r)}fillRect(t,e,s,i,r,n,a,l){const o=Math.floor(n+s*r),c=Math.floor(a+i*r),d=o+Math.ceil(r),m=c+Math.ceil(r);for(let f=c;f<m;f++)for(let g=o;g<d;g++)if(g>=0&&g<e&&f>=0&&f<this.imageData.height){const u=(f*e+g)*4;t[u]=l[0],t[u+1]=l[1],t[u+2]=l[2],t[u+3]=255}}drawGridOverlay(t,e){this.ctx.strokeStyle=k.GRID_LINE,this.ctx.lineWidth=.5,this.ctx.beginPath();for(let s=0;s<=this.gridWidth;s++){const i=this.offsetX+s*this.cellSize;this.ctx.moveTo(i,this.offsetY),this.ctx.lineTo(i,this.offsetY+this.gridHeight*this.cellSize)}for(let s=0;s<=this.gridHeight;s++){const i=this.offsetY+s*this.cellSize;this.ctx.moveTo(this.offsetX,i),this.ctx.lineTo(this.offsetX+this.gridWidth*this.cellSize,i)}this.ctx.stroke()}drawHighlight(t,e,s=0,i="#ffffff"){const r=window.devicePixelRatio||1;if(this.ctx.strokeStyle=i,this.ctx.lineWidth=2*r,s>0){const n=this.offsetX+(t+.5)*this.cellSize,a=this.offsetY+(e+.5)*this.cellSize,l=s*this.cellSize;this.ctx.beginPath(),this.ctx.arc(n,a,l,0,Math.PI*2),this.ctx.stroke()}else{const n=this.offsetX+t*this.cellSize,a=this.offsetY+e*this.cellSize;this.ctx.strokeRect(n,a,this.cellSize,this.cellSize)}}getCanvas(){return this.canvas}destroy(){this.imageData=null}}class J{constructor(t){this.maxPoints=500,this.canvas=t,this.ctx=t.getContext("2d"),this.resize()}resize(){const t=window.devicePixelRatio||1,e=this.canvas.getBoundingClientRect();this.canvas.width=e.width*t,this.canvas.height=e.height*t,this.ctx.scale(t,t)}render(t,e){const s=this.canvas.getBoundingClientRect(),i=s.width,r=s.height,n=this.ctx,a={top:10,right:10,bottom:25,left:45},l=i-a.left-a.right,o=r-a.top-a.bottom;if(n.fillStyle="#0d1117",n.fillRect(0,0,i,r),t.length<2){n.fillStyle="#555",n.font="12px system-ui",n.textAlign="center",n.fillText("等待數據...",i/2,r/2);return}let c=1;for(const u of t)c=Math.max(c,u.red,u.blue);c=Math.ceil(c/100)*100;const d=l/Math.max(1,t.length-1),m=o/c;n.strokeStyle="#1c2333",n.lineWidth=1;for(let u=0;u<=4;u++){const b=a.top+o*u/4;n.beginPath(),n.moveTo(a.left,b),n.lineTo(a.left+l,b),n.stroke();const E=Math.round(c*(1-u/4));n.fillStyle="#666",n.font="10px system-ui",n.textAlign="right",n.fillText(E.toString(),a.left-5,b+3)}n.fillStyle="#666",n.textAlign="center";const f=t[0].tick,g=t[t.length-1].tick;for(let u=0;u<=4;u++){const b=a.left+l*u/4,E=Math.round(f+(g-f)*u/4);n.fillText(E.toString(),b,r-5)}this.drawLine(t,"red",k[h.RED],a,d,m,c,o),this.drawLine(t,"blue",k[h.BLUE],a,d,m,c,o),n.font="11px system-ui",n.fillStyle=k[h.RED],n.textAlign="left",n.fillText("● 紅軍",a.left+5,a.top+12),n.fillStyle=k[h.BLUE],n.fillText("● 藍軍",a.left+60,a.top+12)}drawLine(t,e,s,i,r,n,a,l){const o=this.ctx;o.strokeStyle=s,o.lineWidth=1.5,o.beginPath();for(let c=0;c<t.length;c++){const d=i.left+c*r,m=i.top+l-t[c][e]*n;c===0?o.moveTo(d,m):o.lineTo(d,m)}o.stroke(),o.globalAlpha=.1,o.fillStyle=s,o.lineTo(i.left+(t.length-1)*r,i.top+l),o.lineTo(i.left,i.top+l),o.closePath(),o.fill(),o.globalAlpha=1}getCanvas(){return this.canvas}}const U=`
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,V=`
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
`,j=`
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
`;class Z{constructor(t){this.gl=null,this.computeProgram=null,this.renderProgram=null,this.stateTextures=[null,null],this.terrainTexture=null,this.buffTexture=null,this.framebuffers=[null,null],this.currentBuffer=0,this.gridWidth=0,this.gridHeight=0,this.available=!1,this.canvas=t,this.init()}isAvailable(){return this.available}init(){const t=this.canvas.getContext("webgl",{alpha:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t){console.warn("WebGL not available");return}if(this.gl=t,t.getExtension("OES_texture_float")||console.warn("Float textures not supported, using UNSIGNED_BYTE fallback"),this.computeProgram=this.createProgram(U,V),this.renderProgram=this.createProgram(U,j),!this.computeProgram||!this.renderProgram){console.warn("Failed to create WebGL programs");return}this.available=!0}createShader(t,e){const s=this.gl,i=s.createShader(t);return i?(s.shaderSource(i,e),s.compileShader(i),s.getShaderParameter(i,s.COMPILE_STATUS)?i:(console.error("Shader compile error:",s.getShaderInfoLog(i)),s.deleteShader(i),null)):null}createProgram(t,e){const s=this.gl,i=this.createShader(s.VERTEX_SHADER,t),r=this.createShader(s.FRAGMENT_SHADER,e);if(!i||!r)return null;const n=s.createProgram();return n?(s.attachShader(n,i),s.attachShader(n,r),s.linkProgram(n),s.getProgramParameter(n,s.LINK_STATUS)?n:(console.error("Program link error:",s.getProgramInfoLog(n)),null)):null}initGrid(t,e){if(!this.gl||!this.available)return;this.gridWidth=t,this.gridHeight=e;const s=this.gl;for(let i=0;i<2;i++)this.stateTextures[i]=this.createDataTexture(t,e),this.framebuffers[i]=s.createFramebuffer(),s.bindFramebuffer(s.FRAMEBUFFER,this.framebuffers[i]),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,this.stateTextures[i],0);this.terrainTexture=this.createDataTexture(t,e),this.buffTexture=this.createDataTexture(t,e),this.currentBuffer=0}createDataTexture(t,e){const s=this.gl,i=s.createTexture();s.bindTexture(s.TEXTURE_2D,i);const r=s.getExtension("OES_texture_float")?s.FLOAT:s.UNSIGNED_BYTE;return s.texImage2D(s.TEXTURE_2D,0,s.RGBA,t,e,0,s.RGBA,r,null),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,s.NEAREST),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),i}uploadGrid(t){if(!this.gl||!this.available)return;const e=this.gl,s=t.getCellsArray(),i=t.getTerrainArray(),r=t.getBuffsArray(),n=this.gridWidth*this.gridHeight,a=new Float32Array(n*4),l=new Float32Array(n*4),o=new Float32Array(n*4);for(let c=0;c<n;c++)a[c*4]=s[c]===h.RED?.5:s[c]===h.BLUE?.7:0,a[c*4+1]=0,a[c*4+2]=0,a[c*4+3]=1,l[c*4]=i[c]===T.WALL?.5:i[c]===T.SWAMP?.7:0,l[c*4+1]=0,l[c*4+2]=0,l[c*4+3]=1,o[c*4]=r[c]===B.GENE_BOOST?.5:0,o[c*4+1]=0,o[c*4+2]=0,o[c*4+3]=1;e.bindTexture(e.TEXTURE_2D,this.stateTextures[0]),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,a),e.bindTexture(e.TEXTURE_2D,this.stateTextures[1]),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,a),e.bindTexture(e.TEXTURE_2D,this.terrainTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,l),e.bindTexture(e.TEXTURE_2D,this.buffTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.gridWidth,this.gridHeight,0,e.RGBA,e.FLOAT,o)}compute(){if(!this.gl||!this.available||!this.computeProgram)return;const t=this.gl,e=this.currentBuffer,s=1-this.currentBuffer;t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffers[s]),t.viewport(0,0,this.gridWidth,this.gridHeight),t.useProgram(this.computeProgram),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.stateTextures[e]),t.uniform1i(t.getUniformLocation(this.computeProgram,"u_state"),0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.terrainTexture),t.uniform1i(t.getUniformLocation(this.computeProgram,"u_terrain"),1),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.buffTexture),t.uniform1i(t.getUniformLocation(this.computeProgram,"u_buffs"),2),t.uniform2f(t.getUniformLocation(this.computeProgram,"u_resolution"),this.gridWidth,this.gridHeight),this.drawQuad(),this.currentBuffer=s}renderDisplay(){if(!this.gl||!this.available||!this.renderProgram)return;const t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.canvas.width,this.canvas.height),t.useProgram(this.renderProgram),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.stateTextures[this.currentBuffer]),t.uniform1i(t.getUniformLocation(this.renderProgram,"u_state"),0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.terrainTexture),t.uniform1i(t.getUniformLocation(this.renderProgram,"u_terrain"),1),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.buffTexture),t.uniform1i(t.getUniformLocation(this.renderProgram,"u_buffs"),2),t.uniform2f(t.getUniformLocation(this.renderProgram,"u_resolution"),this.gridWidth,this.gridHeight),this.drawQuad()}drawQuad(){const t=this.gl,e=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,e),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),t.STATIC_DRAW);const s=0;t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0),t.drawArrays(t.TRIANGLES,0,6),t.deleteBuffer(e)}readBackState(){if(!this.gl||!this.available)return{cells:new Uint8Array(0),redCount:0,blueCount:0};const t=this.gl,e=this.gridWidth*this.gridHeight;t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffers[this.currentBuffer]);const s=new Float32Array(e*4);t.readPixels(0,0,this.gridWidth,this.gridHeight,t.RGBA,t.FLOAT,s);const i=new Uint8Array(e);let r=0,n=0;for(let a=0;a<e;a++){const l=s[a*4];l>.4&&l<.6?(i[a]=h.RED,r++):l>.6?(i[a]=h.BLUE,n++):i[a]=h.EMPTY}return{cells:i,redCount:r,blueCount:n}}destroy(){if(this.gl){for(let t=0;t<2;t++)this.stateTextures[t]&&this.gl.deleteTexture(this.stateTextures[t]),this.framebuffers[t]&&this.gl.deleteFramebuffer(this.framebuffers[t]);this.terrainTexture&&this.gl.deleteTexture(this.terrainTexture),this.buffTexture&&this.gl.deleteTexture(this.buffTexture),this.computeProgram&&this.gl.deleteProgram(this.computeProgram),this.renderProgram&&this.gl.deleteProgram(this.renderProgram)}}}const K=`
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
`,Q=`
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
`;class tt{constructor(t){this.device=null,this.context=null,this.computePipeline=null,this.renderPipeline=null,this.stateBuffers=[null,null],this.terrainBuffer=null,this.buffBuffer=null,this.stateTextures=[null,null],this.bindGroups=[null,null],this.paramBuffer=null,this.currentBuffer=0,this.gridWidth=0,this.gridHeight=0,this.available=!1,this.canvas=t}isAvailable(){return this.available}async init(){if(!("gpu"in navigator))return console.warn("WebGPU not supported"),!1;try{const t=await navigator.gpu.requestAdapter();if(!t)return console.warn("No WebGPU adapter found"),!1;if(this.device=await t.requestDevice(),this.context=this.canvas.getContext("webgpu"),!this.context)return console.warn("Failed to get WebGPU context"),!1;const e=navigator.gpu.getPreferredCanvasFormat();this.context.configure({device:this.device,format:e,alphaMode:"opaque"});const s=this.device.createShaderModule({code:K});this.computePipeline=this.device.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"main"}});const i=this.device.createShaderModule({code:Q});return this.renderPipeline=this.device.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:e}]},primitive:{topology:"triangle-list"}}),this.available=!0,!0}catch(t){return console.warn("WebGPU init failed:",t),!1}}initGrid(t,e){if(!this.device||!this.available)return;const s=this.device;this.gridWidth=t,this.gridHeight=e;const r=t*e*4;for(let n=0;n<2;n++)this.stateBuffers[n]=s.createBuffer({size:r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});this.terrainBuffer=s.createBuffer({size:r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.buffBuffer=s.createBuffer({size:r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.paramBuffer=s.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});for(let n=0;n<2;n++)this.stateTextures[n]=s.createTexture({size:{width:t,height:e},format:"r32float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING});for(let n=0;n<2;n++){const a=n,l=1-n;this.bindGroups[n]=s.createBindGroup({layout:this.computePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.paramBuffer}},{binding:1,resource:{buffer:this.stateBuffers[a]}},{binding:2,resource:{buffer:this.stateBuffers[l]}},{binding:3,resource:{buffer:this.terrainBuffer}},{binding:4,resource:{buffer:this.buffBuffer}}]})}this.currentBuffer=0}uploadGrid(t){if(!this.device||!this.available)return;const e=t.getCellsArray(),s=t.getTerrainArray(),i=t.getBuffsArray(),r=this.gridWidth*this.gridHeight,n=new Float32Array(r),a=new Float32Array(r),l=new Float32Array(r);for(let c=0;c<r;c++)n[c]=e[c]===h.RED?.5:e[c]===h.BLUE?.7:0,a[c]=s[c]===T.WALL?.5:s[c]===T.SWAMP?.7:0,l[c]=i[c]===B.GENE_BOOST?.5:0;this.device.queue.writeBuffer(this.stateBuffers[0],0,n),this.device.queue.writeBuffer(this.stateBuffers[1],0,n),this.device.queue.writeBuffer(this.terrainBuffer,0,a),this.device.queue.writeBuffer(this.buffBuffer,0,l);const o=new Uint32Array([this.gridWidth,this.gridHeight]);this.device.queue.writeBuffer(this.paramBuffer,0,o)}compute(){if(!this.device||!this.computePipeline||!this.available)return;const t=this.device.createCommandEncoder(),e=t.beginComputePass();e.setPipeline(this.computePipeline),e.setBindGroup(0,this.bindGroups[this.currentBuffer]),e.dispatchWorkgroups(Math.ceil(this.gridWidth/16),Math.ceil(this.gridHeight/16)),e.end(),this.device.queue.submit([t.finish()]),this.currentBuffer=1-this.currentBuffer}renderDisplay(){!this.device||!this.renderPipeline||!this.context||this.available}async readBackState(){if(!this.device||!this.available)return{cells:new Uint8Array(0),redCount:0,blueCount:0};const t=this.gridWidth*this.gridHeight,e=t*4,s=this.device.createBuffer({size:e,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),i=this.device.createCommandEncoder();i.copyBufferToBuffer(this.stateBuffers[this.currentBuffer],0,s,0,e),this.device.queue.submit([i.finish()]),await s.mapAsync(GPUMapMode.READ);const r=new Float32Array(s.getMappedRange()),n=new Uint8Array(t);let a=0,l=0;for(let o=0;o<t;o++)r[o]>.4&&r[o]<.6?(n[o]=h.RED,a++):r[o]>.6&&(n[o]=h.BLUE,l++);return s.unmap(),s.destroy(),{cells:n,redCount:a,blueCount:l}}destroy(){for(let t=0;t<2;t++)this.stateBuffers[t]?.destroy(),this.stateTextures[t]?.destroy();this.terrainBuffer?.destroy(),this.buffBuffer?.destroy(),this.paramBuffer?.destroy()}}class et{constructor(t,e,s=_){this.mainCanvas=t,this.chartCanvas=e,this.leviathan=null,this.autoPlayScheduledTicks=0,this.autoPlaySpeedDuringRun=5,this.webglRenderer=null,this.webgpuRenderer=null,this.renderMode="canvas2d",this.animFrameId=0,this.lastTime=0,this.accumulator=0,this.targetTickInterval=100,this.computing=!1,this.selectedSkill=null,this.mouseDown=!1,this.mouseGridPos=null,this.hoverGridPos=null,this.simulationConfig={...D},this.leviathanEnabled=!1,this.gameLoop=i=>{this.animFrameId=requestAnimationFrame(this.gameLoop);const r=i-this.lastTime;if(this.lastTime=i,this.statsTracker.tickFps(),!this.timeController.isPaused())for(this.accumulator+=r*this.timeController.getSpeed();this.accumulator>=this.targetTickInterval&&!this.computing;)this.accumulator-=this.targetTickInterval,this.simulateTick();this.render()},this.grid=new P({width:s,height:s}),this.engine=new G,this.skillSystem=new F,this.timeController=new z,this.statsTracker=new H,this.macroEngine=new I,this.autoPlayer=new $,this.canvasRenderer=new q(t),this.canvasRenderer.setGridSize(s,s),this.chartRenderer=new J(e),this.initGPU(),this.setupInput()}async initGPU(){const t=document.createElement("canvas");this.webgpuRenderer=new tt(t),await this.webgpuRenderer.init()?console.log("WebGPU available"):this.webgpuRenderer=null;const s=document.createElement("canvas");this.webglRenderer=new Z(s),this.webglRenderer.isAvailable()?(console.log("WebGL available"),this.webglRenderer.initGrid(this.grid.width,this.grid.height)):this.webglRenderer=null}setupInput(){const t=this.mainCanvas;t.addEventListener("mousedown",e=>{this.mouseDown=!0,this.handleCanvasInteraction(e)}),t.addEventListener("mousemove",e=>{const s=this.canvasRenderer.screenToGrid(e.clientX,e.clientY);this.hoverGridPos=s,this.mouseDown&&this.handleCanvasInteraction(e)}),t.addEventListener("mouseup",()=>{this.mouseDown=!1}),t.addEventListener("mouseleave",()=>{this.mouseDown=!1,this.hoverGridPos=null}),t.addEventListener("touchstart",e=>{e.preventDefault(),this.mouseDown=!0;const s=e.touches[0];this.handleCanvasInteraction(s)}),t.addEventListener("touchmove",e=>{e.preventDefault();const s=e.touches[0];this.handleCanvasInteraction(s)}),t.addEventListener("touchend",()=>{this.mouseDown=!1}),window.addEventListener("keydown",e=>{switch(e.key){case" ":e.preventDefault(),this.togglePause();break;case"z":(e.ctrlKey||e.metaKey)&&(e.preventDefault(),this.undo());break;case"1":this.setSpeed(1);break;case"2":this.setSpeed(2);break;case"3":this.setSpeed(5);break}})}handleCanvasInteraction(t){const e=this.canvasRenderer.screenToGrid("clientX"in t?t.clientX:0,"clientY"in t?t.clientY:0);if(e)if(this.mouseGridPos=e,this.selectedSkill!==null)this.skillSystem.executeSkill(this.selectedSkill,this.grid,{x:e.x,y:e.y}),this.selectedSkill=null;else{const s=this.skillSystem.getActiveFaction();this.placeCellBrush(e.x,e.y,s)}}placeCellBrush(t,e,s){for(let r=-2;r<=2;r++)for(let n=-2;n<=2;n++)if(n*n+r*r<=2*2){const a=t+n,l=e+r;this.grid.inBounds(a,l)&&this.grid.getTerrain(a,l)!==T.WALL&&this.grid.setCell(a,l,s)}}start(){this.grid.placeInitialPattern(),this.lastTime=performance.now(),this.gameLoop(this.lastTime)}async simulateTick(){if(!this.computing){this.computing=!0,this.timeController.saveSnapshot(this.grid);try{const t=await this.engine.computeNext(this.grid,this.simulationConfig);this.grid.setCellsFromBuffer(t.cells),this.grid.setBuffsFromBuffer(t.buffs),this.grid.setBuffDurationsFromBuffer(t.buffDurations),this.timeController.incrementTick(),this.statsTracker.update(t.redCount,t.blueCount,this.timeController.getCurrentTick(),t.computeTime),this.skillSystem.tickCooldowns(),this.leviathanEnabled&&this.leviathan&&this.leviathan.update(this.grid),this.macroEngine.executeRules(this),(this.autoPlayer.isEnabled()||this.autoPlayScheduledTicks>0)&&(this.autoPlayer.onTick(this.timeController.getCurrentTick(),this.grid,this.skillSystem),this.autoPlayScheduledTicks>0&&(this.autoPlayScheduledTicks--,this.autoPlayScheduledTicks===0&&!this.autoPlayer.isEnabled()&&this.timeController.setPaused(!0)))}finally{this.computing=!1}}}render(){const t=this.leviathan?.getState()??null;if(this.renderMode==="canvas2d"&&this.canvasRenderer.render(this.grid,t),this.hoverGridPos)if(this.selectedSkill){const e=this.selectedSkill===x.METEOR?5:2;this.canvasRenderer.drawHighlight(this.hoverGridPos.x,this.hoverGridPos.y,e,"#ffd93d")}else this.canvasRenderer.drawHighlight(this.hoverGridPos.x,this.hoverGridPos.y,0,"rgba(255,255,255,0.5)");t&&t.alive,this.timeController.getCurrentTick()%2===0&&this.chartRenderer.render(this.statsTracker.getHistory(),this.timeController.getCurrentTick())}getGrid(){return this.grid}getSkillSystem(){return this.skillSystem}getTimeController(){return this.timeController}getStatsTracker(){return this.statsTracker}getMacroEngine(){return this.macroEngine}getAutoPlayer(){return this.autoPlayer}setAutoPlayEnabled(t){this.autoPlayer.setEnabled(t),t&&(this.timeController.isPaused()&&this.timeController.setPaused(!1),this.timeController.getSpeed()<2&&this.timeController.setSpeed(5))}runAutoTicks(t){this.autoPlayScheduledTicks=Math.max(1,t),this.autoPlayer.setEnabled(!0);const e=this.timeController.getSpeed();this.autoPlaySpeedDuringRun=e>=2?e:5,this.timeController.setSpeed(this.autoPlaySpeedDuringRun),this.timeController.setPaused(!1)}getTick(){return this.timeController.getCurrentTick()}togglePause(){this.timeController.togglePause()}setSpeed(t){this.timeController.setSpeed(t)}undo(){this.timeController.undo(this.grid)}selectSkill(t){this.selectedSkill=t}getSelectedSkill(){return this.selectedSkill}setFaction(t){this.skillSystem.setActiveFaction(t)}reset(){this.grid.clear(),this.grid.placeInitialPattern(),this.timeController.clearHistory(),this.statsTracker.clear(),this.skillSystem.resetAll(),this.autoPlayer.clearLog(),this.autoPlayScheduledTicks=0,this.leviathan&&this.leviathan.reset(0,Math.floor(this.grid.height/2))}resize(t,e){this.mainCanvas.style.width=t+"px",this.mainCanvas.style.height=e+"px",this.canvasRenderer.resize(),this.chartRenderer.resize()}setGridSize(t){this.grid=new P({width:t,height:t}),this.grid.placeInitialPattern(),this.canvasRenderer.setGridSize(t,t),this.timeController.clearHistory(),this.statsTracker.clear(),this.webglRenderer&&this.webglRenderer.initGrid(t,t)}enableLeviathan(t){this.leviathanEnabled=t,t&&!this.leviathan&&(this.leviathan=new X(0,Math.floor(this.grid.height/2)-1)),t||(this.leviathan=null)}getRenderMode(){return this.renderMode}setRenderMode(t){this.renderMode=t}addWall(t,e){C.addWall(this.grid,t,e)}addSwamp(t,e,s,i){C.addSwamp(this.grid,t,e,s,i)}exportMap(){return C.exportMap(this.grid)}importMap(t){const e=C.importMap(t);return e?(this.grid=e,this.canvasRenderer.setGridSize(e.width,e.height),!0):!1}getCellAt(t,e){return this.grid.getCell(t,e)}placeCell(t,e,s){this.grid.setCell(t,e,s)}destroy(){cancelAnimationFrame(this.animFrameId),this.engine.destroy(),this.canvasRenderer.destroy(),this.webglRenderer?.destroy(),this.webgpuRenderer?.destroy()}}class st{constructor(t){this.container=t,this.container.innerHTML=`
      <div class="data-panel">
        <div class="data-row">
          <span class="data-label">回合</span>
          <span class="data-value" id="stat-tick">0</span>
        </div>
        <div class="data-row">
          <span class="data-label" style="color:${k[h.RED]}">紅軍</span>
          <span class="data-value" id="stat-red" style="color:${k[h.RED]}">0</span>
        </div>
        <div class="data-row">
          <span class="data-label" style="color:${k[h.BLUE]}">藍軍</span>
          <span class="data-value" id="stat-blue" style="color:${k[h.BLUE]}">0</span>
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
    `,this.tickEl=this.container.querySelector("#stat-tick"),this.redEl=this.container.querySelector("#stat-red"),this.blueEl=this.container.querySelector("#stat-blue"),this.fpsEl=this.container.querySelector("#stat-fps"),this.computeEl=this.container.querySelector("#stat-compute"),this.speedEl=this.container.querySelector("#stat-speed")}update(t,e){this.tickEl.textContent=t.tick.toString(),this.redEl.textContent=t.redCount.toLocaleString(),this.blueEl.textContent=t.blueCount.toLocaleString(),this.fpsEl.textContent=t.fps.toString(),this.computeEl.textContent=t.computeTime.toFixed(1)+"ms",this.speedEl.textContent=e+"x"}getElement(){return this.container}}class it{constructor(t,e){this.buttons=new Map,this.cooldownOverlays=new Map,this.activeFaction=h.RED,this.container=t,this.onSkillSelect=e,this.build()}build(){this.container.innerHTML=`
      <div class="skill-panel">
        <div class="skill-header">
          <span>戰術技能</span>
          <button class="faction-toggle" id="faction-toggle" style="background:${k[h.RED]};border:none;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:12px;">
            紅軍
          </button>
        </div>
        <div class="skill-buttons" id="skill-buttons"></div>
      </div>
    `;const t=this.container.querySelector("#skill-buttons");this.factionBtn=this.container.querySelector("#faction-toggle");const e=[{type:x.METEOR,icon:"☄️",name:"隕石"},{type:x.GENE_BOOST,icon:"🧬",name:"強化"},{type:x.SWAMP_TERRAIN,icon:"🌿",name:"沼澤"}];for(const s of e){const i=document.createElement("div");i.className="skill-btn-wrapper",i.style.cssText="position:relative;display:inline-block;margin:3px;";const r=document.createElement("button");r.className="skill-btn",r.innerHTML=`<span class="skill-icon">${s.icon}</span><span class="skill-name">${s.name}</span>`,r.style.cssText=`
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
      `,r.title=s.name;const n=document.createElement("div");n.className="cooldown-overlay",n.style.cssText=`
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
      `,r.addEventListener("click",()=>{this.onSkillSelect(s.type),r.style.borderColor="#ffd93d",setTimeout(()=>{r.style.borderColor="#2d3748"},300)}),r.addEventListener("mouseenter",()=>{r.style.background="#2d3748"}),r.addEventListener("mouseleave",()=>{r.style.background="#1c2333"}),i.appendChild(r),i.appendChild(n),t.appendChild(i),this.buttons.set(s.type,r),this.cooldownOverlays.set(s.type,n)}this.factionBtn.addEventListener("click",()=>{this.activeFaction=this.activeFaction===h.RED?h.BLUE:h.RED,this.factionBtn.textContent=this.activeFaction===h.RED?"紅軍":"藍軍",this.factionBtn.style.background=k[this.activeFaction]})}getActiveFaction(){return this.activeFaction}updateSkills(t){for(const e of t){const s=this.buttons.get(e.type),i=this.cooldownOverlays.get(e.type);!s||!i||(e.currentCooldown>0?(i.style.display="flex",i.textContent=e.currentCooldown.toString(),s.style.opacity="0.6",s.style.cursor="not-allowed"):(i.style.display="none",s.style.opacity="1",s.style.cursor="pointer"))}}getElement(){return this.container}}class rt{constructor(t,e){this.speedButtons=[],this.pauseBtn=null,this.container=t,this.onPause=e.onPause,this.onSpeedChange=e.onSpeedChange,this.onUndo=e.onUndo,this.onReset=e.onReset,this.build()}build(){this.container.innerHTML=`
      <div class="time-control-panel">
        <button id="tc-pause" class="tc-btn" title="暫停/播放">⏸️</button>
        <div class="tc-speed-group">
          ${O.filter(i=>i>0).map(i=>`
            <button class="tc-btn tc-speed" data-speed="${i}">${i}x</button>
          `).join("")}
        </div>
        <button id="tc-undo" class="tc-btn" title="時空回溯 (Undo)">⏪</button>
        <button id="tc-reset" class="tc-btn" title="重置">🔄</button>
      </div>
    `,this.pauseBtn=this.container.querySelector("#tc-pause");const t=this.container.querySelector("#tc-undo"),e=this.container.querySelector("#tc-reset");this.pauseBtn.addEventListener("click",()=>this.onPause()),t.addEventListener("click",()=>this.onUndo()),e.addEventListener("click",()=>this.onReset()),this.container.querySelectorAll(".tc-speed").forEach(i=>{const r=i,n=parseInt(r.dataset.speed||"1");r.addEventListener("click",()=>{this.onSpeedChange(n),this.updateSpeedSelection(n)}),this.speedButtons.push(r)}),this.updateSpeedSelection(1)}updateSpeedSelection(t){for(const e of this.speedButtons){const s=parseInt(e.dataset.speed||"1");e.style.background=s===t?"#457b9d":"#1c2333",e.style.color=s===t?"#fff":"#888"}}setPaused(t){this.pauseBtn&&(this.pauseBtn.textContent=t?"▶️":"⏸️",this.pauseBtn.style.background=t?"#2d6a4f":"#1c2333")}getElement(){return this.container}}class nt{constructor(t,e){this.container=t,this.macroEngine=e,this.build()}build(){this.container.innerHTML=`
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
    `,this.textarea=this.container.querySelector("#macro-script"),this.enableCheckbox=this.container.querySelector("#macro-enable"),this.runBtn=this.container.querySelector("#macro-run"),this.logEl=this.container.querySelector("#macro-log"),this.enableCheckbox.addEventListener("change",()=>{this.macroEngine.setEnabled(this.enableCheckbox.checked)}),this.runBtn.addEventListener("click",()=>{const e=this.textarea.value,s=this.macroEngine.parseScript(e);this.updateLog(),s?(this.runBtn.textContent="✓ 已解析",this.runBtn.style.background="#238636",setTimeout(()=>{this.runBtn.textContent="解析並執行"},1500)):(this.runBtn.textContent="✗ 解析失敗",this.runBtn.style.background="#da3633",setTimeout(()=>{this.runBtn.textContent="解析並執行",this.runBtn.style.background="#238636"},1500))}),this.container.querySelector("#macro-example").addEventListener("click",()=>{this.textarea.value=I.getExampleScript()})}updateLog(){const t=this.macroEngine.getLog();this.logEl.innerHTML=t.map(e=>`<div>${e}</div>`).join(""),this.logEl.scrollTop=this.logEl.scrollHeight}getElement(){return this.container}}class at{constructor(t,e,s){this.updateTimer=0,this.container=t,this.autoPlayer=e,this.handlers=s,this.build(),this.updateTimer=window.setInterval(()=>this.refreshLog(),250)}build(){this.container.innerHTML=`
      <div class="autoplay-panel">
        <div class="autoplay-header">
          <span class="autoplay-title">🎬 觀眾模式</span>
          <span class="autoplay-badge" id="autoplay-badge">OFF</span>
        </div>
        <div class="autoplay-status" id="autoplay-status">
          AI 待命中 — 開啟後會自動操控紅藍軍互打
        </div>
        <div class="autoplay-actions">
          <button id="autoplay-toggle" class="autoplay-btn primary">
            ▶️ 開啟觀眾模式
          </button>
          <div class="autoplay-run">
            <input id="autoplay-ticks" type="number" value="100" min="10" max="9999" step="10"
              style="width:70px;background:#0d1117;color:#e0e0e0;border:1px solid #30363d;border-radius:4px;padding:4px;font-size:12px;" />
            <button id="autoplay-run" class="autoplay-btn">🎲 自動打 N 回合</button>
          </div>
          <button id="autoplay-reset" class="autoplay-btn small">🔄 重置場地</button>
        </div>
        <div class="autoplay-stats" id="autoplay-stats">技能施放: 0 · 細胞投放: 0</div>
        <div class="autoplay-log-title">🤖 AI 決策紀錄</div>
        <div id="autoplay-log" class="autoplay-log"></div>
      </div>
    `,this.toggleBtn=this.container.querySelector("#autoplay-toggle"),this.runBtn=this.container.querySelector("#autoplay-run"),this.resetBtn=this.container.querySelector("#autoplay-reset"),this.tickInput=this.container.querySelector("#autoplay-ticks"),this.logEl=this.container.querySelector("#autoplay-log"),this.statusEl=this.container.querySelector("#autoplay-status"),this.statsEl=this.container.querySelector("#autoplay-stats"),this.toggleBtn.addEventListener("click",()=>{const t=!this.autoPlayer.isEnabled();this.handlers.onToggle(t)}),this.runBtn.addEventListener("click",()=>{const t=parseInt(this.tickInput.value)||100;this.handlers.onRunTicks(t)}),this.resetBtn.addEventListener("click",()=>{this.handlers.onReset()})}syncState(){const t=this.autoPlayer.isEnabled(),e=this.container.querySelector("#autoplay-badge");t?(this.toggleBtn.innerHTML="⏸️ 暫停觀眾模式",this.toggleBtn.classList.add("active"),e.textContent="ON",e.classList.add("on"),this.statusEl.textContent="🟢 AI 正在操控中 — 觀戰享受",this.statusEl.classList.add("on")):(this.toggleBtn.innerHTML="▶️ 開啟觀眾模式",this.toggleBtn.classList.remove("active"),e.textContent="OFF",e.classList.remove("on"),this.statusEl.textContent="AI 待命中 — 開啟後會自動操控紅藍軍互打",this.statusEl.classList.remove("on")),this.refreshLog()}refreshLog(){const t=this.autoPlayer.getLog();t.length===0?this.logEl.innerHTML='<div class="autoplay-log-empty">（尚無決策）</div>':this.logEl.innerHTML=t.map(s=>this.renderDecision(s)).join("");const e=this.autoPlayer.getStats();this.statsEl.textContent=`技能施放: ${e.skillsCast} · 細胞投放: ${e.cellsPlaced}`}renderDecision(t){const e=t.faction===1?'<span class="ap-tag red">紅</span>':'<span class="ap-tag blue">藍</span>';let s="👀";t.action==="skill"?t.skill==="meteor"?s="☄️":t.skill==="gene_boost"?s="🧬":t.skill==="swamp"&&(s="🌿"):t.action==="place"&&(s="🖱️");const i=`<span class="ap-tick">t${t.tick}</span>`,r=t.action==="idle"?"":`<span class="ap-pos">(${t.x},${t.y})</span>`;return`<div class="ap-row">
      ${i} ${s} ${e} ${r}
      <span class="ap-reason">${t.reason}</span>
    </div>`}destroy(){clearInterval(this.updateTimer)}}class ot{constructor(){this.updateInterval=0,this.init()}init(){const t=document.getElementById("app");t.innerHTML=`
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
            <div id="autoplay-panel-container"></div>
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
                <p>🎬 觀眾模式：放手讓 AI 自己打</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;const e=document.getElementById("main-canvas"),s=document.getElementById("chart-canvas");this.resizeCanvas(e),this.game=new et(e,s,_),this.dataPanel=new st(document.getElementById("data-panel-container")),this.skillPanel=new it(document.getElementById("skill-panel-container"),i=>this.onSkillSelect(i)),this.timeControl=new rt(document.getElementById("toolbar-center"),{onPause:()=>this.game.togglePause(),onSpeedChange:i=>this.game.setSpeed(i),onUndo:()=>this.game.undo(),onReset:()=>this.game.reset()}),this.macroPanel=new nt(document.getElementById("macro-panel-container"),this.game.getMacroEngine()),this.autoPlayPanel=new at(document.getElementById("autoplay-panel-container"),this.game.getAutoPlayer(),{onToggle:i=>{this.game.setAutoPlayEnabled(i),this.autoPlayPanel.syncState()},onRunTicks:i=>{this.game.runAutoTicks(i),this.autoPlayPanel.syncState()},onReset:()=>{this.game.reset(),this.autoPlayPanel.syncState()}}),this.game.setAutoPlayEnabled(!0),this.autoPlayPanel.syncState(),this.setupSettingsHandlers(e),this.game.start(),this.updateInterval=window.setInterval(()=>this.updateUI(),100),window.addEventListener("resize",()=>{this.resizeCanvas(e),this.game.resize(e.clientWidth,e.clientHeight)})}resizeCanvas(t){const e=document.getElementById("canvas-container");e&&(t.style.width=e.clientWidth+"px",t.style.height=e.clientHeight+"px")}onSkillSelect(t){this.game.getSelectedSkill()===t?this.game.selectSkill(null):this.game.selectSkill(t)}setupSettingsHandlers(t){const e=document.getElementById("grid-size-select");e.addEventListener("change",()=>{const l=parseInt(e.value);this.game.setGridSize(l),this.resizeCanvas(t),this.game.resize(t.clientWidth,t.clientHeight)});const s=document.getElementById("render-mode-select");s.addEventListener("change",()=>{this.game.setRenderMode(s.value)});const i=document.getElementById("leviathan-toggle");i.addEventListener("change",()=>{this.game.enableLeviathan(i.checked)}),document.getElementById("grid-lines-toggle");const r=document.getElementById("export-map-btn"),n=document.getElementById("import-map-btn"),a=document.getElementById("map-json-input");r.addEventListener("click",()=>{const l=this.game.exportMap();a.value=l,a.style.display="block"}),n.addEventListener("click",()=>{a.style.display=a.style.display==="none"?"block":"none"}),a.addEventListener("change",()=>{a.value.trim()&&(this.game.importMap(a.value)?n.textContent="✓ 已匯入":n.textContent="✗ 格式錯誤",setTimeout(()=>{n.textContent="匯入 JSON"},2e3))})}updateUI(){const t=this.game.getStatsTracker().getStats(),e=this.game.getTimeController().getSpeed();this.dataPanel.update(t,e);const s=this.game.getSkillSystem().getAllSkills();this.skillPanel.updateSkills(s);const i=this.game.getTimeController().isPaused();this.timeControl.setPaused(i),this.timeControl.updateSpeedSelection(e),this.game.getMacroEngine().isEnabled()&&this.macroPanel.updateLog()}}window.addEventListener("DOMContentLoaded",()=>{new ot});
//# sourceMappingURL=index-BE6jIs7V.js.map
