/* 适配移动端屏幕大小 */

const menuView = document.getElementById('menu-viewport');
const gameView = document.getElementById('game-viewport');
const infoView = document.getElementById('info-viewport');

// 游戏视窗的像素数（固定为 540px）。
const viewWidth = menuView.clientWidth;
const viewHeight = menuView.clientHeight;

let ratio = 1.0;

adjustGameView({target:window});

window.onresize = adjustGameView;

function adjustGameView(event) {
    const window = event.target;

    // 浏览器内容的像素数（缩放后）。
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    // 浏览器窗口的像素数（未缩放）。
    const outerWidth = window.outerWidth;
    const outerHeight = window.outerHeight;

    let newRatio = 1.0;

    if (Math.min(outerWidth, outerHeight) <= 820){
        newRatio = Math.min(
            innerWidth / (viewWidth + 60), innerHeight / (viewHeight + infoView.clientHeight + 30)
        ).toFixed(1);
    }

    if (ratio !== newRatio) {
        ratio = newRatio;
    } else {
        return;
    }

    for (const viewport of [menuView, gameView, infoView]) {
        viewport.style.transform = `scale(${ratio})`;
    }

    const dH = infoView.offsetHeight * (ratio - 1) / 2;
    const bbox = gameView.getBoundingClientRect();

    infoView.style.top = `${Math.floor(bbox.bottom + dH + 30)}px`;
}