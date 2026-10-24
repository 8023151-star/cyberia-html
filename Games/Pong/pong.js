(() => {
  'use strict';
  const canvas=document.querySelector('#pong-canvas'),ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height,PW=13,PH=96,R=9,WIN=7;
  const setup=document.querySelector('#setup'),result=document.querySelector('#result');
  const sidePick=document.querySelector('#side-pick'),start=document.querySelector('#start');
  const left={x:24,y:(H-PH)/2,score:0},right={x:W-24-PW,y:(H-PH)/2,score:0};
  const ball={x:W/2,y:H/2,vx:340,vy:110};
  const keys={KeyW:false,KeyD:false,KeyS:false,ArrowUp:false,ArrowDown:false};
  let mode=null,playerSide=null,running=false,serveWait=0,last=0;
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function updateLabels(){
    document.querySelector('#left-name').textContent=mode==='bot'?(playerSide==='left'?'YOU':'BOT'):'LEFT';
    document.querySelector('#right-name').textContent=mode==='bot'?(playerSide==='right'?'YOU':'BOT'):'RIGHT';
    document.querySelector('#left-score').textContent=left.score;
    document.querySelector('#right-score').textContent=right.score;
  }
  function serve(direction){ball.x=W/2;ball.y=H/2;ball.vx=direction*(340+Math.min((left.score+right.score)*15,120));ball.vy=(Math.random()*2-1)*170;serveWait=.6;}
  function startGame(){
    left.y=right.y=(H-PH)/2;left.score=right.score=0;updateLabels();
    setup.hidden=true;result.hidden=true;running=true;serve(Math.random()<.5?-1:1);
    last=performance.now();
  }
  function showMenu(){running=false;result.hidden=true;setup.hidden=false;}
  function finish(side){
    running=false;
    const label=mode==='bot'?(side===playerSide?'You win!':'Bot wins!'):(side==='left'?'Left player wins!':'Right player wins!');
    document.querySelector('#result-title').textContent=label;
    document.querySelector('#result-text').textContent='Final score: '+left.score+' – '+right.score;
    result.hidden=false;
  }
  function score(side){
    const scorer=side==='left'?left:right;
    scorer.score++;updateLabels();
    if(scorer.score>=WIN){finish(side);return;}
    serve(side==='left'?1:-1);
  }
  function movePaddle(paddle,side,dt){
    if(mode==='bot'&&playerSide!==side){
      const target=ball.vx*(side==='left'?-1:1)>0?ball.y:H/2;
      const center=paddle.y+PH/2;
      paddle.y+=clamp(target-center,-340*dt,340*dt);
    }else{
      const up=side==='left'?keys.KeyW:keys.ArrowUp;
      const down=side==='left'?(keys.KeyD||keys.KeyS):keys.ArrowDown;
      paddle.y+=((down?1:0)-(up?1:0))*440*dt;
    }
    paddle.y=clamp(paddle.y,0,H-PH);
  }
  function bounce(paddle,toRight){
    const hit=clamp((ball.y-(paddle.y+PH/2))/(PH/2),-.9,.9);
    const speed=Math.min(690,Math.hypot(ball.vx,ball.vy)*1.05);
    ball.vx=(toRight?1:-1)*speed*Math.cos(hit*.95);
    ball.vy=speed*Math.sin(hit*.95);
    ball.x=toRight?paddle.x+PW+R:paddle.x-R;
  }
  function update(dt){
    movePaddle(left,'left',dt);movePaddle(right,'right',dt);
    if(serveWait>0){serveWait-=dt;return;}
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    if(ball.y-R<0){ball.y=R;ball.vy=Math.abs(ball.vy);}
    if(ball.y+R>H){ball.y=H-R;ball.vy=-Math.abs(ball.vy);}
    if(ball.vx<0&&ball.x-R<=left.x+PW&&ball.x>left.x&&ball.y+R>=left.y&&ball.y-R<=left.y+PH)bounce(left,true);
    if(ball.vx>0&&ball.x+R>=right.x&&ball.x<right.x+PW&&ball.y+R>=right.y&&ball.y-R<=right.y+PH)bounce(right,false);
    if(ball.x+R<0)score('right');
    else if(ball.x-R>W)score('left');
  }
  function draw(){
    ctx.fillStyle='#06112f';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#40547b';ctx.setLineDash([12,14]);ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#1c3157';ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,W-3,H-3);
    ctx.fillStyle='#7cf0cf';ctx.fillRect(left.x,left.y,PW,PH);
    ctx.fillStyle='#ad8aff';ctx.fillRect(right.x,right.y,PW,PH);
    ctx.beginPath();ctx.arc(ball.x,ball.y,R,0,Math.PI*2);ctx.fillStyle='#f7f9ff';ctx.fill();
  }
  function frame(now){
    const dt=Math.min((now-(last||now))/1000,.035);last=now;
    if(running)update(dt);
    draw();requestAnimationFrame(frame);
  }
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    mode=button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b===button));
    sidePick.hidden=mode!=='bot';start.disabled=mode==='bot'&&!playerSide;
  }));
  document.querySelectorAll('[data-side]').forEach(button=>button.addEventListener('click',()=>{
    playerSide=button.dataset.side;
    document.querySelectorAll('[data-side]').forEach(b=>b.classList.toggle('selected',b===button));
    start.disabled=false;
  }));
  document.addEventListener('keydown',e=>{if(e.code in keys){keys[e.code]=true;e.preventDefault();}});
  document.addEventListener('keyup',e=>{if(e.code in keys){keys[e.code]=false;e.preventDefault();}});
  window.addEventListener('blur',()=>{for(const key in keys)keys[key]=false;});
  document.querySelectorAll('[data-key]').forEach(button=>{
    const key=button.dataset.key;
    button.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;button.setPointerCapture(e.pointerId);});
    const release=()=>{keys[key]=false;};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  start.addEventListener('click',startGame);
  document.querySelector('#rematch').addEventListener('click',startGame);
  document.querySelector('#restart').addEventListener('click',()=>{if(mode)startGame();});
  document.querySelector('#menu').addEventListener('click',showMenu);
  document.querySelector('#change-mode').addEventListener('click',showMenu);
  updateLabels();requestAnimationFrame(frame);
})();
