const rockets=[
{name:"V-01",cls:"ORBITAL",height:"42 M",thrust:"1.2 MN",engines:4,color:"#ff4e2c",desc:"Fast orbital launcher"},
{name:"V-02",cls:"HEAVY",height:"76 M",thrust:"6.8 MN",engines:9,color:"#ff6a3d",desc:"Heavy lift vehicle"},
{name:"V-03",cls:"REUSABLE",height:"58 M",thrust:"3.4 MN",engines:7,color:"#ff3d7a",desc:"Reusable deep-space vehicle"}
];
const missions={orbit:{name:"EARTH ORBIT",target:220,topSpeed:27600,duration:34},moon:{name:"LUNAR TRANSFER",target:384400,topSpeed:39500,duration:46},mars:{name:"MARS TRANSFER",target:225000000,topSpeed:42500,duration:58}};
let rocketIndex=0, missionKey="orbit", running=false, start=0, raf=0, maxAlt=0,maxVel=0;
const $=id=>document.getElementById(id);
function renderRocket(){
 const r=rockets[rocketIndex];
 $("vehicleName").textContent=r.name;$("vehicleClass").textContent=r.cls;$("vehicleHeight").textContent=r.height;$("vehicleThrust").textContent=r.thrust;
 $("rocketVisual").innerHTML=`<div class="rocket"><div class="nose"></div><div class="window"></div><div class="fin left"></div><div class="fin right"></div><div class="engine"></div><div class="flame"></div></div>`;
 $("rocketVisual").querySelector(".rocket").style.setProperty("--rocket",r.color);
 $("rocketSelector").innerHTML=rockets.map((x,i)=>`<button class="rocket-pill ${i===rocketIndex?"active":""}" data-i="${i}"><b>${x.name}</b><small>${x.cls}</small></button>`).join("");
 document.querySelectorAll(".rocket-pill").forEach(b=>b.onclick=()=>{rocketIndex=+b.dataset.i;renderRocket()});
}
function setMission(k){
 missionKey=k;
 document.querySelectorAll(".mission-card").forEach(b=>b.classList.toggle("selected",b.dataset.mission===k));
 $("missionName").textContent=missions[k].name;$("trajectoryLabel").textContent=missions[k].name;
}
$("prevRocket").onclick=()=>{rocketIndex=(rocketIndex+2)%3;renderRocket()};
$("nextRocket").onclick=()=>{rocketIndex=(rocketIndex+1)%3;renderRocket()};
document.querySelectorAll(".mission-card").forEach(b=>b.onclick=()=>setMission(b.dataset.mission));
function systems(){
 const names=["GUIDANCE","AVIONICS","FUEL SYSTEM","THERMAL","TELEMETRY","NAVIGATION"];
 $("systemList").innerHTML=names.map(n=>`<div class="system-row"><span>${n}</span><i></i></div>`).join("");
}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function fmt(n){return n>=1e6?(n/1e6).toFixed(2)+"M":n>=1000?(n/1000).toFixed(1)+"K":Math.round(n).toString()}
function drawTrajectory(progress,alt){
 const c=$("trajectoryCanvas"),dpr=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;
 const x=c.getContext("2d");x.scale(dpr,dpr);x.clearRect(0,0,w,h);
 x.strokeStyle="#ffffff0c";x.lineWidth=1;
 for(let i=1;i<7;i++){x.beginPath();x.moveTo(0,h*i/7);x.lineTo(w,h*i/7);x.stroke()}
 for(let i=1;i<9;i++){x.beginPath();x.moveTo(w*i/9,0);x.lineTo(w*i/9,h);x.stroke()}
 const cx=w*.5,cy=h*.57,R=Math.min(w,h)*.31;
 x.strokeStyle="#ffffff18";x.beginPath();x.arc(cx,cy,R,0,Math.PI*2);x.stroke();
 x.strokeStyle="#4d6c88";x.beginPath();x.arc(cx,cy,R*.68,0,Math.PI*2);x.stroke();
 const p=Math.min(1,progress),ang=-Math.PI*.85+Math.PI*1.7*p;
 const rx=cx+Math.cos(ang)*R,ry=cy+Math.sin(ang)*R;
 x.fillStyle="#3b80ff";x.beginPath();x.arc(cx,cy,16,0,Math.PI*2);x.fill();
 x.fillStyle="#9cc6ff";x.beginPath();x.arc(cx-5,cy-4,8,0,Math.PI*2);x.fill();
 x.strokeStyle="#ff5b3c";x.lineWidth=2;x.beginPath();x.arc(cx,cy,R, -Math.PI*.85,ang);x.stroke();
 x.fillStyle="#ff765a";x.shadowBlur=14;x.shadowColor="#ff5b3c";x.beginPath();x.arc(rx,ry,5,0,Math.PI*2);x.fill();x.shadowBlur=0;
 x.fillStyle="#76818d";x.font="9px system-ui";x.fillText(missionKey==="orbit"?"LEO":"TRANSFER",10,16);x.fillText("EARTH",cx-17,cy+4);
}
function setEngines(on){
 document.querySelectorAll(".engine-row").forEach((r,i)=>{r.classList.toggle("on",on);r.querySelector("b").textContent=on?"ACTIVE":"OFF"});
}
function launch(){
 if(running)return;
 running=true;start=performance.now();maxAlt=0;maxVel=0;
 $("fleetScreen").classList.remove("active");$("controlScreen").classList.add("active");
 $("statusText").textContent="IGNITION";setEngines(true);
 let lastPhase="";
 const duration=missions[missionKey].duration*1000;
 function tick(now){
  const t=now-start,p=Math.min(1,t/duration),m=missions[missionKey];
  const ease=p<.12?Math.pow(p/.12,2)*.12:p<.82?.12+(p-.12)/.7*.7:.82+(p-.82)/.18*.18;
  let alt=m.target*ease;
  if(missionKey==="orbit") alt=Math.min(m.target,m.target*(1-Math.pow(1-p,3)));
  const vel=m.topSpeed*Math.min(1,Math.pow(Math.sin(Math.min(1,p)*Math.PI/2),.7));
  const thrust=p<.18?Math.min(100,p/.18*100):p>.82?Math.max(0,(1-p)/.18*100):100;
  const fuel=Math.max(2,100-p*(missionKey==="mars"?62:78));
  const g=1+Math.sin(p*Math.PI)*2.5;
  $("altitude").textContent=alt>=1000?(alt/1000).toFixed(1):alt.toFixed(1);
  $("velocity").textContent=Math.round(vel).toLocaleString("fr-FR");$("mach").textContent=(vel/1234).toFixed(2);
  $("thrust").textContent=Math.round(thrust);$("fuel").textContent=Math.round(fuel);$("gforce").textContent=g.toFixed(1);
  $("progressBar").style.width=(p*100)+"%";$("range").textContent=fmt(alt)+" KM";
  maxAlt=Math.max(maxAlt,alt);maxVel=Math.max(maxVel,vel);drawTrajectory(p,alt);
  let phase=p<.06?"LIFTOFF":p<.22?"MAX-Q":p<.42?"STAGE 1":p<.55?"SEPARATION":p<.78?"STAGE 2":"ORBIT INSERTION";
  if(missionKey==="moon"&&p>.78)phase="LUNAR TRANSFER";if(missionKey==="mars"&&p>.78)phase="DEEP SPACE";
  $("phaseLabel").textContent=phase;$("missionPhase").textContent=p<.3?"T−"+Math.max(0,Math.ceil((.3-p)*20)):phase;
  $("orbitStatus").textContent=p<.5?"ASCENT":"FLIGHT NOMINAL";$("statusText").textContent=p<.9?"NOMINAL":"TARGET LOCK";
  if(phase!==lastPhase){lastPhase=phase;if(["MAX-Q","SEPARATION","ORBIT INSERTION"].includes(phase))toast("EVENT: "+phase)}
  $("missionTime").textContent=new Date(t).toISOString().substring(11,19);
  if(p<1){raf=requestAnimationFrame(tick)}else finish();
 }
 raf=requestAnimationFrame(tick);
}
function finish(){
 running=false;setEngines(false);$("controlScreen").classList.remove("active");$("resultScreen").classList.add("active");
 const m=missions[missionKey];$("resultTitle").textContent=missionKey==="orbit"?"ORBIT ACHIEVED":missionKey==="moon"?"LUNAR TRAJECTORY":"MARS TRAJECTORY";
 $("resultText").textContent=`${rockets[rocketIndex].name} successfully completed the ${m.name.toLowerCase()} mission.`;
 $("resultTime").textContent=$("missionTime").textContent;$("resultAltitude").textContent=fmt(maxAlt)+" KM";$("resultVelocity").textContent=Math.round(maxVel).toLocaleString("fr-FR")+" KM/H";
}
$("startMission").onclick=launch;
$("abortBtn").onclick=()=>{if(running){cancelAnimationFrame(raf);running=false;setEngines(false);$("controlScreen").classList.remove("active");$("fleetScreen").classList.add("active");toast("MISSION ABORTED")}};
$("returnBtn").onclick=()=>{$("resultScreen").classList.remove("active");$("fleetScreen").classList.add("active");$("missionTime").textContent="00:00:00"};
$("fullscreenBtn").onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
systems();renderRocket();setMission("orbit");
window.addEventListener("resize",()=>{if($("controlScreen").classList.contains("active"))drawTrajectory(0,0)});
