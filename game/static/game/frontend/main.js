import {
    DURATION_TRANSITION, DURATION_ANIMATION, DURATION_UI, DURATION_TIMEOUT,
    BEZIER_UI, BEZIER_OUT_BACK, BEZIER_OUT_BACK_REVERSE,
    hideElements, showElements, changeStyle,
    validateIndex,
    clearUpPieces,
    sleep,
} from "./utils.js";

import {
    createGameState, computeGameState,
    indefinite_recursion,
} from "./robot.js";

import { confettiShowersDown } from "./confetti.js";

let socket;
try {
    socket = io('https://crema.evalieben.cn:4604', {secure: true});
}catch (e) {
    location.reload();
}

const welcomePage = document.getElementById('welcome-page');
const menuView = document.getElementById('menu-viewport');
const btn_tutorial = document.getElementById('btn-tutorial');
const btn_singlePlayer = document.getElementById('btn-single-player');
const btn_multiplayer = document.getElementById('btn-multiplayer');
const home_btn = document.getElementById('home-btn');
const ui_multiplayer = document.getElementById('ui-multiplayer');
const label_roomId = document.getElementById('client-room-id');
const input_roomId = document.getElementById('input-room-id');
const prompt = document.getElementById('prompt');
const SVG_Players = document.getElementById('svg-players');
const playerIcon = document.getElementById('player-icon');
const colorPanel = document.getElementById('color-panel');
const btn_closePanel = document.getElementById('btn-close-panel');
const btn_changeColor = document.getElementById('btn-change-color');
const arrow_nowPlaying = document.getElementById('arrow-now-playing');
const pop_up_cue = document.getElementById('pop-up-cue');
const SVG_Pieces = document.getElementById('svg-pieces');
const squareContainer = document.getElementById('square-container');
const chessboard = document.getElementById('chess-board');

let playerId, playerNumber, playerColor;
let playersInfo, state;
let gameOver = true;
let iconPos = [], losers = [];
const cursor = {row: 0, column: 0, x: 0, y: 0, onChessboard: false};

socket.on('room-id', setRoomId);
socket.on('invalid-code', () => setAlert('无效的房间号'));
socket.on('room-is-full', () => setAlert('房间已满'));
socket.on('joining-room-failed', () => alert('未能加入房间，请刷新页面。'));
socket.on('client-standby', onClientStandby);
socket.on('host-standby', onHostStandby);
socket.on('update-players-info', updatePlayersInfo);
socket.on('initialize-game', initialize);
socket.on('update', updateGameState);
socket.on('test', info => console.log(info));

input_roomId.addEventListener('input', checkRoomId);
btn_multiplayer.onclick = multiplayerGameUI;
home_btn.onclick = goBack;

function checkRoomId() {
    if (input_roomId.value.length === 4) {
        input_roomId.setAttribute('disabled', 'disabled');
        socket.emit('join-room', input_roomId.value);
    }
}

function multiplayerGameUI() {
    btn_multiplayer.onclick = null;
    btn_multiplayer.animate(
        {
            left: ['calc((100% - 200px) / 2 + 110px)', 'calc((100% - 440px) / 2)'],
            top: ['400px', '110px'],
            width: ['160px', '400px'],
            height: ['27px', '200px'],
        },
        {
            duration: DURATION_UI,
            fill: 'forwards',
            easing: BEZIER_UI,
        }
    );
    btn_multiplayer.setAttribute('class', 'card');
    btn_multiplayer.firstElementChild.innerText = '';
    setTimeout(() => {
        hideElements([btn_tutorial, btn_singlePlayer]);
        showElements([ui_multiplayer, home_btn]);
    }, DURATION_TRANSITION);
}

function goBack() {
    changeStyle(prompt, {text: ''});
    hideElements([ui_multiplayer, home_btn]);
    setTimeout(() => {
        btn_multiplayer.animate(
            {
                left: ['calc((100% - 440px) / 2)', 'calc((100% - 200px) / 2 + 110px)'],
                top: ['110px', '400px'],
                width: ['400px', '160px'],
                height: ['200px', '27px'],
            },
            {
                duration: DURATION_UI,
                fill: 'forwards',
                easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            }
        );
        showElements([btn_tutorial, btn_singlePlayer]);
        setTimeout(() => {
            btn_multiplayer.setAttribute('class', 'card btn btn-float');
            btn_multiplayer.firstElementChild.innerText = '和朋友一起玩 ！';
            btn_multiplayer.onclick = multiplayerGameUI;
        }, DURATION_TRANSITION);
    }, DURATION_TRANSITION);
}

function handleColorPanel(op) {
    const width = parseInt(colorPanel.firstElementChild.getAttribute('width'), 10);
    const height = parseInt(colorPanel.firstElementChild.getAttribute('height'), 10);

    function popUp(i) {
        let x = Math.floor(width / 5) * ((i % 4) + 1);
        let y = Math.floor(200 / 3) * (Math.floor(i / 4) + 1);
        const piece = colorPanel.firstElementChild.children[i];
        if (piece.getAttribute('fill') === playerColor) {
            piece.setAttribute('stroke', 'white');
        } else {
            piece.setAttribute('stroke', 'none');
        }
        piece.animate(
            {
                opacity: [0, 1],
                transform: [`translate(50%, ${height - 10}px)`, `translate(${x}px, ${y}px)`],
            },
            {
                duration: DURATION_ANIMATION,
                easing: BEZIER_OUT_BACK,
                fill: "forwards",
            }
        );
        piece.style.display = 'initial';
        if (i < 3) {
            i++;
            setTimeout(popUp, 100, i);
            if (i !== 0) setTimeout(popUp, 150, i + 3);
        } else if (i === 3) {
            setTimeout(popUp, 150, 7);
        }
    }

    function popOff(i) {
        let x = Math.floor(width / 5) * ((i % 4) + 1);
        let y = Math.floor(200 / 3) * (Math.floor(i / 4) + 1);
        const piece = colorPanel.firstElementChild.children[i];
        piece.animate(
            {
                opacity: [1, 0],
                transform: [`translate(${x}px, ${y}px)`, `translate(50%, ${height - 10}px)`],
            },
            {
                duration: DURATION_ANIMATION,
                easing: BEZIER_OUT_BACK_REVERSE,
                fill: "forwards",
            }
        );
        setTimeout(() => piece.style.display = 'none', DURATION_ANIMATION);
        if (i < 3) {
            i++;
            setTimeout(popOff, 100, i);
            if (i !== 0) setTimeout(popOff, 150, i + 3);
        } else if (i === 3) {
            setTimeout(popOff, 150, 7);
        }
    }

    if (op === 'open') {
        return () => {
            btn_changeColor.onclick = null;
            btn_changeColor.animate(
                {
                    transform: ['none', 'rotate(0.75turn)'],
                },
                {
                    duration: DURATION_TRANSITION,
                    easing: 'ease-in',
                    fill: "forwards",
                }
            );
            showElements([colorPanel]);
            hideElements([btn_changeColor, playerIcon]);
            setTimeout(() => {
                showElements([btn_closePanel]);
                btn_closePanel.onclick = handleColorPanel('close');
                btn_closePanel.animate(
                    {
                        transform: ['none', 'rotate(0.75turn)']
                    },
                    {
                        duration: DURATION_ANIMATION,
                        easing: 'ease-out',
                        fill: "forwards",
                    }
                );
            }, DURATION_TRANSITION);
            popUp(0);
        }
    } else if (op === 'close') {
        return () => {
            btn_closePanel.onclick = null;
            btn_closePanel.animate(
                {
                    transform: ['rotate(0.75turn)', 'none'],
                },
                {
                    duration: DURATION_TRANSITION,
                    easing: 'ease-in',
                    fill: "forwards",
                }
            );
            hideElements([btn_closePanel]);
            setTimeout(() => {
                if (gameOver) showElements([btn_changeColor]);
                btn_changeColor.animate(
                    {
                        transform: ['rotate(0.75turn)', 'none'],
                    },
                    {
                        duration: DURATION_ANIMATION,
                        easing: 'ease-out',
                        fill: "forwards",
                    }
                );
            }, DURATION_TRANSITION);
            popOff(0);
            setTimeout(() => {
                hideElements([colorPanel]);
                showElements([playerIcon]);
                setTimeout(() => btn_changeColor.onclick = handleColorPanel('open'), DURATION_TRANSITION);
            }, 800);
        }
    }
}

//---------------------------------------------------------------------------------//

class Square {
    static members = [];
    
    static createCanvas(left, top, classAttr) {
        let canvas = document.createElement('canvas');
        canvas.width = 90;
        canvas.height = 90;
        canvas.style.left = `${left}px`;
        canvas.style.top = `${top}px`;
        canvas.setAttribute('class', classAttr);
        squareContainer.appendChild(canvas);
        return canvas;
    }
    
    constructor(i, j) {
        this.row = i; this.column = j;
        this.container = [];
        this.invisibleCanvas = Square.createCanvas(90 * j, 90 * i, 'invisible-square');
        this.backgroundCanvas = Square.createCanvas(90 * j, 90 * i, 'bg-square');
        
        // 设置方格的容纳上限，达到此上限后棋子会溢出。
        if (i === 0 || i === 5 || j === 0 || j === 5) {
            if ((i + j) % 5 === 0) {
                this.size = 2;
            } else {
                this.size = 3;
            }
        } else {
            this.size = 4;
        }
        
        // 设置方格内棋子数为 1~4 时，每个棋子的摆放位点。
        let cx = j * 90 + 45, cy = i * 90 + 45;  // 方格中心点坐标
        this.spots = [[],
            [[cx, cy]],
            [[cx - 17, cy], [cx + 17, cy]],
            [[cx, cy - 15], [cx - 17, cy + 15], [cx + 17, cy + 15]],
            [[cx + 17, cy - 17], [cx - 17, cy - 17], [cx - 17, cy + 17], [cx + 17, cy + 17]]
        ]
        
        // 当鼠标移入/移出 invisibleCanvas 时，改变 backgroundCanvas 的颜色。
        this.invisibleCanvas.onmouseenter = () => {
            cursor.row = i; cursor.column = j;
            cursor.x = j * 90; cursor.y = i * 90;
            cursor.onChessboard = true;
            this.backgroundCanvas.setAttribute('class', 'bg-square-hover');
        }
        this.invisibleCanvas.onmouseleave = () =>  {
            cursor.onChessboard = false;
            this.backgroundCanvas.setAttribute('class', 'bg-square');
        }
    }
    
    static initialize() {
        /* 生成 6x6 方格 */
        Square.members = [];
        for (let i = 0; i < 6; i++) {
            Square.members.push([]);
            for (let j = 0; j < 6; j++) {
                Square.members[i].push(new Square(i, j));
            }
        }
        Square.members[0][0].backgroundCanvas.style.borderTopLeftRadius = '17px';
        Square.members[0][5].backgroundCanvas.style.borderTopRightRadius = '17px';
        Square.members[5][0].backgroundCanvas.style.borderBottomLeftRadius = '17px';
        Square.members[5][5].backgroundCanvas.style.borderBottomRightRadius = '17px';
    }
    
    calculate() {
        /* 每个棋子移动到方格内的指定位点 */
        try {
            const spots = this.spots[this.container.length];
            spots.forEach((spot, index) => {
                this.container[index].moveTo(spot[0], spot[1]);
            }, this);
        } catch (e) {}
        
        // 如果达到最大容纳数量，则棋子向相邻方格移动
        if (this.container.length >= this.size) {
            const color = this.container[0].color;  // 获取当前方格内棋子的颜色
            const popList = [], neighbors = new Set();
            
            // 移除数量相当于方格容量的棋子
            for (let i = 0; i < this.size; i++) {
                popList.push(this.container.pop());
            }
            
            // 获取相邻的方格
            if (validateIndex(this.row, this.column + 1)) neighbors.add(Square.members[this.row][this.column + 1]);
            if (validateIndex(this.row + 1, this.column)) neighbors.add(Square.members[this.row + 1][this.column]);
            if (validateIndex(this.row, this.column - 1)) neighbors.add(Square.members[this.row][this.column - 1]);
            if (validateIndex(this.row - 1, this.column)) neighbors.add(Square.members[this.row - 1][this.column]);
            
            // 向相邻方格移动棋子
            const tasks = [];
            for (const neighbor of neighbors) {
                tasks.push(new Promise(resolve => {
                    setTimeout(async () => {
                        for (const piece of neighbor.container) {
                            piece.color = color;  // 改变相邻方格中棋子的颜色
                        }
                        neighbor.container.push(popList.shift());  // 向相邻方格添加棋子
                        if (!gameOver) await neighbor.calculate();  // 递归，等待相邻方格执行完成
                        resolve();
                    }, DURATION_TIMEOUT);
                }));
            }
            return Promise.all(tasks);
        } else {
            return new Promise(resolve => resolve());
        }
    }
    
    static getNumPieces(winnerColor) {
        let numPieces = 0;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                for (const piece of Square.members[i][j].container) {
                    if (piece.color === winnerColor) numPieces++;
                }
            }
        }
        return numPieces;
    }
}

class Piece {
    static COLOR = [
        '#54BAB9', '#65C18C', '#A2D2FF', '#92A9BD',
        '#A685E2', '#F999B7', '#FFC93C', '#F76E11',
    ];
    static candidate = [];
    
    constructor(candidate) {
        this.color = candidate.getAttribute('fill');
        this.element = candidate;
        this.x = 0;
        this.y = 0;
    }
    
    static createCandidate(color) {
        const candidate = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        candidate.setAttribute('class', 'piece candidate');
        candidate.setAttribute('fill', color);
        candidate.setAttribute('r', '14');
        SVG_Pieces.appendChild(candidate);
        candidate.animate(
            {
                r: [0, 14],
                opacity: [0, 1],
            },
            {
                duration: DURATION_TRANSITION,
                easing: BEZIER_UI,
                fill: 'forwards',
            }
        );
        Piece.candidate.push(candidate);
        return candidate;
    }
    
    static removeCandidates() {
        const candidates = document.getElementsByClassName('candidate');
        for (let candidate of candidates) {
            candidate.animate(
                {r: [14, 30], opacity: [1, 0]},
                {duration: DURATION_TRANSITION, easing: 'ease-out'}
            );
            setTimeout(() => {
                try {
                    SVG_Pieces.removeChild(candidate);
                } catch (e) {}
            }, DURATION_TRANSITION);
        }
    }

    static put(event) {
        if (event.button === 0) {
            const candidate = Piece.createCandidate(playerColor);

            function moveCandidate(event) {
                candidate.style.transform = `translate(${cursor.x + event.offsetX}px, ${cursor.y + event.offsetY}px)`;
            }

            moveCandidate(event);
        
            chessboard.onmousemove = moveCandidate;
        
            document.onmouseup = event => {
                chessboard.onmousemove = null;
                document.onmouseup = null;

                if (!cursor.onChessboard) {
                    Piece.removeCandidates();
                    return;
                }

                const square = Square.members[cursor.row][cursor.column];

                if (event.button === 0 && (!square.container[0] || playerColor === square.container[0].color)) {
                    chessboard.onmousedown = null;

                    candidate.setAttribute('class', 'piece');
                    const piece = new Piece(candidate);
                    square.container.push(piece);
                    piece.draw(cursor.x + event.offsetX, cursor.y + event.offsetY);
                    
                    socket.emit('new-piece', {
                        row: cursor.row,
                        column: cursor.column,
                        id: playerId,
                        number: playerNumber,
                    });
                } else Piece.removeCandidates();
            }
        }
    }
    
    draw(x, y) {
        this.element.style.transform = `translate(${x}px, ${y}px)`;
        this.x = x;
        this.y = y;
    }
    
    moveTo(x, y) {
        const style = window.getComputedStyle(this.element);
        const fill = style.getPropertyValue('fill');
        this.element.animate(
            {
                transform: [`translate(${this.x}px, ${this.y}px)`, `translate(${x}px, ${y}px)`],
                fill: [fill, this.color],
            },
            {
                duration: DURATION_ANIMATION,
                fill: 'forwards',
                easing: BEZIER_OUT_BACK,
            }
        );
        this.x = x;
        this.y = y;
    }
}

function drawSeparationLines() {
    let separationLineCanvas = document.getElementById('canvas-separation-lines');
    let ctx = separationLineCanvas.getContext('2d');
    ctx.strokeStyle = '#e1e1e1';
    ctx.beginPath();
    for (let i = 90; i < 540; i += 90) {
        for (let j = 90; j < 540; j += 90) {
            ctx.moveTo(0, i);
            ctx.lineTo(540, i);
            ctx.moveTo(j, 0);
            ctx.lineTo(j, 540);
        }
    }
    ctx.stroke();
}

//---------------------------------------------------------------------------------//

function setRoomId(room, id) {
    changeStyle(label_roomId, {text: room});
    playerId = id;
}

function setAlert(text) {
    changeStyle(prompt, {text: text, color: 'tomato'});
    input_roomId.removeAttribute('disabled');
}

function onClientStandby() {
    changeStyle(prompt, {text: '已加入，正在等待游戏开始。'});
    changeStyle(home_btn, {text: '离开房间', color: 'ghostwhite', bg: 'coral'});
    changeStyle(label_roomId, {text: '----', color: 'silver'});
    
    home_btn.onclick = () => {
        home_btn.onclick = goBack;
        socket.emit('client-leave');
        input_roomId.removeAttribute('disabled');
        changeStyle(prompt, {text: ''});
        changeStyle(home_btn, {text: '返回'});
    }
}

function onHostStandby(num) {
    if (!num) {
        home_btn.onclick = goBack;
        input_roomId.removeAttribute('disabled');
        changeStyle(prompt, {text: ''});
        changeStyle(home_btn, {text: '返回'});
    } else {
        input_roomId.setAttribute('disabled', 'disabled');
        changeStyle(prompt, {text: `已有 ${num} 人加入。`});
        changeStyle(home_btn, {text: '开始游戏', color: 'ghostwhite', bg: '#79B4B7'});
        home_btn.onclick = () => {
            socket.emit('start-game');
        }
    }
}

function updatePlayersInfo(players) {
    if (!gameOver) return;
    playersInfo = players;
    playerIcon.animate(
        { fill: [playerColor, playersInfo[playerId]] },
        { duration: DURATION_ANIMATION, fill: "forwards" }
    );
    playerColor = playersInfo[playerId];

    const allColors = Object.values(playersInfo);
    const pieces = colorPanel.firstElementChild.children;
    for (const piece of pieces) {
        if (piece.getAttribute('fill') === playerColor) continue;
        if (allColors.includes(piece.getAttribute('fill'))) {
            piece.onclick = null;
            piece.setAttribute('class', 'piece btn-piece-forbidden');
        } else {
            piece.onclick = changeColor;
            piece.setAttribute('class', 'piece btn-piece');
        }
    }
}

async function initialize() {
    const squares = Square.members;  // squares 引用上一局留下的数组，以便清空棋盘。
    Square.initialize();  // Square.members 将指向一个新的空数组。
    drawSeparationLines();
    playerNumber = Object.keys(playersInfo).indexOf(playerId);
    state = createGameState(Object.keys(playersInfo).length);
    pop_up_cue.setAttribute('fill', playerColor);
    gameOver = false;
    iconPos = [];
    losers = [];

    hideElements([menuView, btn_changeColor]);
    if (btn_closePanel.onclick !== null) {
        hideElements([colorPanel]);
        setTimeout(btn_closePanel.onclick, DURATION_TRANSITION, null);
    }
    welcomePage.animate(
        {
            backdropFilter: ['blur(7px) opacity(1)', 'opacity(0)'],
            '-webkit-backdropFilter': ['blur(7px) opacity(1)', 'opacity(0)'],
        },
        {
            duration: DURATION_TRANSITION,
            fill: "forwards"
        }
    );

    await sleep(DURATION_TRANSITION);
    welcomePage.style.display = 'none';
    showElements([arrow_nowPlaying]);

    const players = Object.keys(playersInfo);
    const numPlayers = players.length;
    const interval = Math.round(540 / (numPlayers + 1));
    for (let i = 0; i < numPlayers; i++) {
        const cx = interval * (i + 1);
        iconPos[i] = cx;
        if (playerId === players[i]) {
            SVG_Players.appendChild(playerIcon);
            playerIcon.animate(
                {cx: [270, cx]},
                {duration: DURATION_ANIMATION, fill: "forwards", easing: BEZIER_UI}
            );
            playerIcon.style.transformOrigin = `${cx}px 50%`;
            continue;
        }
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        icon.setAttribute('class', 'piece');
        icon.setAttribute('fill', playersInfo[players[i]]);
        icon.setAttribute('cx', `${cx}`);
        icon.setAttribute('cy', '50%');
        icon.setAttribute('r', '20');
        icon.style.transformOrigin = `${cx}px 50%`;
        SVG_Players.appendChild(icon);
        icon.animate(
            {r: [0, 20], opacity: [0, 1]},
            {duration: DURATION_ANIMATION, fill: "forwards", easing: BEZIER_UI}
        );
    }
    await clearUpPieces(squares);
    await sleep(500);
    readyToPlay(0)
}

async function updateGameState(newPiece) {
    const square = Square.members[newPiece.row][newPiece.column];

    if (newPiece.id !== playerId) {  // 检查是否是自己下的棋子。如果不是，那么绘制新的棋子。
        const x = newPiece.column * 90 + 45, y = newPiece.row * 90 + 45;
        const candidate = Piece.createCandidate(playersInfo[newPiece.id]);
        candidate.setAttribute('class', 'piece');
        const piece = new Piece(candidate);
        square.container.push(piece);
        piece.draw(x, y);
    }
    
    let result;
    setTimeout(() => {
        result = computeGameState(state, newPiece);
        if (indefinite_recursion) {
            const winnerNumber = result.findIndex((num) => num > 0);
            const winnerColor = playersInfo[Object.keys(playersInfo)[winnerNumber]];
            let numPieces = result[winnerNumber];
            
            const intervalId = setInterval(() => {
                let newNum = Square.getNumPieces(winnerColor);
                if (numPieces === newNum) {
                    setTimeout(() => {gameOver = true}, 1000);
                    clearInterval(intervalId);
                } else {
                    numPieces = newNum;
                }
            }, 600);
        }
    });
    
    await square.calculate();

    if (result !== undefined) {
        // 剩余棋子数为零则判定为负。
        for (let i in result) {
            if (result[i] === 0) {
                const player = Object.keys(playersInfo)[i];
                if (!losers.includes(player)) {
                    losers.push(player);
                    SVG_Players.children[i].animate(
                        {fillOpacity: ['1', '0.5']},
                        {duration: DURATION_ANIMATION, fill: "forwards"}
                    );
                }
            }
        }

        // 检测游戏是否结束
        if (Object.keys(playersInfo).length - losers.length === 1) {
            gameOver = true;
            const winner = SVG_Players.children[result.findIndex((num) => num > 0)];
            setTimeout(handleGameOver, 600, winner);
            return;
        }
    }
    
    setTimeout(readyToPlay, 500, newPiece.number + 1);
}

function readyToPlay(playerNumber) {
    const players = Object.keys(playersInfo);
    if (playerNumber < players.length) {
        if (losers.includes(players[playerNumber])) {
            readyToPlay(playerNumber + 1);
            return;
        } else if (playerId === players[playerNumber]) {
            pop_up_cue.setAttribute('r', '100');
            pop_up_cue.animate(
                {
                    opacity: [0, 1, 1, 0],
                    transform: ['scale(0)', "scale(1)", "scale(1)", "scale(0)"],
                    offset: [0, 0.4, 0.8, 1],
                    easing: [BEZIER_UI, 'linear', 'linear'],
                },
                { duration: 1000, fill: "forwards" }
            );
            setTimeout(() => {
                chessboard.onmousedown = Piece.put;
            }, 1000);
        }
        const left = window.getComputedStyle(arrow_nowPlaying).getPropertyValue('left');
        arrow_nowPlaying.animate(
            { left: [left, `${iconPos[playerNumber] - 15}px`] },
            { duration: DURATION_ANIMATION, fill: "forwards", easing: BEZIER_UI }
        );
    } else {
        readyToPlay(0);
    }
}

function handleGameOver(winnerIcon) {
    SVG_Players.animate(
        {height: ['60px', '540px'], top: ['0', '-570px']},
        {duration: 1000, easing: BEZIER_UI, fill: "forwards"}
    );
    setTimeout(() => {
        winnerIcon.animate(
            {transform: ['scale(1)', "scale(5)"]},
            {duration: 600, easing: BEZIER_OUT_BACK, fill: 'forwards'}
        );
    }, 900);
    hideElements([arrow_nowPlaying]);
    setTimeout(confettiShowersDown, 900);
    setTimeout(() => {
        hideElements([SVG_Players]);
        showElements([menuView, btn_changeColor]);
        welcomePage.style.display = 'initial';
        welcomePage.animate(
            {
                backdropFilter: ['opacity(0)', 'blur(7px) opacity(1)'],
                '-webkit-backdropFilter': ['opacity(0)', 'blur(7px) opacity(1)'],
            },
            {duration: DURATION_TRANSITION, fill: "forwards"}
        );
        setTimeout(() => {
            for (let i = 0; i < Object.keys(playersInfo).length; i++) {
                if (i !== playerNumber) SVG_Players.children[i].remove();
            }
            arrow_nowPlaying.animate({left: 'calc((100% - 30px) / 2)'}, {fill: "forwards"});
            playerIcon.animate({transform: 'none', cx: '270', fillOpacity: '1', r: '20'}, {fill: "forwards"});
            SVG_Players.animate({height: '60px', top: '0'}, {fill: "forwards"});
            showElements([SVG_Players]);
        }, DURATION_TRANSITION);
    }, 4500);
}

//---------------------------------------------------------------------------------//

function changeColor(event) {
    const piece = event.target;
    const color = piece.getAttribute('fill');
    piece.setAttribute('stroke', 'white');
    event.target.animate(
        {strokeWidth: ['0', '4']},
        {duration: DURATION_TRANSITION, fill: "forwards"}
    );
    if (color !== playerColor) socket.emit('change-color', color);
    btn_closePanel.onclick(null);
}

function initColorPanel() {
    for (let color of Piece.COLOR) {
        const piece = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        piece.setAttribute('class', 'piece btn-piece');
        piece.setAttribute('fill', color);
        piece.setAttribute('stroke-width', '4');
        piece.setAttribute('r', '20');
        piece.style.transformOrigin = '0 0';
        piece.style.display = 'none';
        colorPanel.firstElementChild.appendChild(piece);
        piece.onclick = changeColor;
    }
}

drawSeparationLines();
Square.initialize();
initColorPanel();

btn_changeColor.onclick = handleColorPanel('open');

playerColor = Piece.COLOR[Math.floor(Math.random() * 8)];
playerIcon.style.fill = playerColor;
socket.emit('create-room', playerColor);