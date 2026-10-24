(() => {
  'use strict';
  const ROWS = 6, COLS = 7;
  const setup = document.querySelector('#setup');
  const playArea = document.querySelector('#play-area');
  const boardEl = document.querySelector('#board');
  const sidePick = document.querySelector('#side-pick');
  const start = document.querySelector('#start');
  const status = document.querySelector('#status');
  const result = document.querySelector('#result');
  let mode = null, human = null, turn = 1, active = false, botTimer = null;
  let board = blankBoard();
  function blankBoard() { return Array.from({length:ROWS}, () => Array(COLS).fill(0)); }
  function availableRow(col) { for (let row=ROWS-1;row>=0;row--) if (!board[row][col]) return row; return -1; }
  function fourFrom(row,col,color) {
    for (const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]) {
      const cells = [[row,col]];
      for (const sign of [-1,1]) for (let n=1;n<4;n++) {
        const r=row+dr*n*sign,c=col+dc*n*sign;
        if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==color) break;
        cells.push([r,c]);
      }
      if (cells.length>=4) return cells;
    }
    return null;
  }
  function name(color) { return mode==='bot' ? (color===human?'You':'Bot') : (color===1?'Red':'Yellow'); }
  function render() {
    boardEl.replaceChildren();
    for (let row=0;row<ROWS;row++) for (let col=0;col<COLS;col++) {
      const cell=document.createElement('button');
      cell.type='button'; cell.className='cell'+(board[row][col]===1?' red':board[row][col]===2?' yellow':'');
      cell.dataset.col=String(col);
      cell.setAttribute('role','gridcell');
      cell.setAttribute('aria-label','Column '+(col+1)+', row '+(row+1)+(board[row][col]?', '+(board[row][col]===1?'red':'yellow'):''));
      cell.disabled=!active||availableRow(col)===-1||(mode==='bot'&&turn!==human);
      boardEl.appendChild(cell);
    }
    document.querySelector('#red-label').textContent=mode==='bot'?(human===1?'You (red)':'Bot (red)'):'Red';
    document.querySelector('#yellow-label').textContent=mode==='bot'?(human===2?'You (yellow)':'Bot (yellow)'):'Yellow';
    if (active) status.textContent=name(turn)+"'s turn";
  }
  function finish(winner,cells) {
    active=false;
    render();
    if (cells) for (const [row,col] of cells) boardEl.children[row*COLS+col].classList.add('winning');
    document.querySelector('#result-title').textContent=winner?name(winner)+' wins!':"It's a draw!";
    document.querySelector('#result-text').textContent=winner?'Four in a row. Nice game.':'The board is full. Try another round.';
    status.textContent=winner?name(winner)+' wins':'Draw';
    result.hidden=false;
  }
  function play(col) {
    if (!active) return;
    const row=availableRow(col);
    if (row<0) return;
    board[row][col]=turn;
    const winning=fourFrom(row,col,turn);
    if (winning) { finish(turn,winning); return; }
    if (board[0].every(Boolean)) { finish(0,null); return; }
    turn=3-turn;
    render();
    if (mode==='bot'&&turn!==human) botTimer=setTimeout(botMove,420);
  }
  function winningColumn(color) {
    for (let col=0;col<COLS;col++) {
      const row=availableRow(col);
      if (row<0) continue;
      board[row][col]=color;
      const wins=!!fourFrom(row,col,color);
      board[row][col]=0;
      if (wins) return col;
    }
    return -1;
  }
  function botMove() {
    if (!active||mode!=='bot'||turn===human) return;
    const valid=[...Array(COLS).keys()].filter(col=>availableRow(col)>=0);
    const win=winningColumn(turn),block=winningColumn(human);
    let col=win>=0?win:block>=0?block:null;
    if (col===null) {
      const ranked=valid.map(c=>({col:c,score:(3-Math.abs(3-c))*3+Math.random()*2+(board[availableRow(c)+1]?.[c]===turn?2:0)}));
      ranked.sort((a,b)=>b.score-a.score);
      col=ranked[0].col;
    }
    play(col);
  }
  function newGame() {
    clearTimeout(botTimer); board=blankBoard(); turn=1; active=true;
    setup.hidden=true; playArea.hidden=false; result.hidden=true;
    render();
    if (mode==='bot'&&human===2) botTimer=setTimeout(botMove,420);
  }
  function showSetup() {
    clearTimeout(botTimer); active=false; result.hidden=true; playArea.hidden=true; setup.hidden=false;
  }
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    mode=button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b===button));
    sidePick.hidden=mode!=='bot';
    start.disabled=mode==='bot'&&!human;
  }));
  document.querySelectorAll('[data-color]').forEach(button=>button.addEventListener('click',()=>{
    human=Number(button.dataset.color);
    document.querySelectorAll('[data-color]').forEach(b=>b.classList.toggle('selected',b===button));
    start.disabled=false;
  }));
  boardEl.addEventListener('click',event=>{
    const col=event.target.closest('.cell')?.dataset.col;
    if (col!==undefined&&!(mode==='bot'&&turn!==human)) play(Number(col));
  });
  start.addEventListener('click',newGame);
  document.querySelector('#rematch').addEventListener('click',newGame);
  document.querySelector('#play-again').addEventListener('click',newGame);
  document.querySelector('#change-mode').addEventListener('click',showSetup);
  document.querySelector('#result-change').addEventListener('click',showSetup);
})();
