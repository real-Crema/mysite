const COLOR = [
    '#F76E11', '#54BAB9', '#A2D2FF', '#92A9BD',
    '#A685E2', '#F999B7', '#FFC93C', '#65C18C'
];

function makeId(state) {
    let result = '';
    let chars = '0123456789';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * 10));
    }
    for (const roomId in state) {
        if (result === roomId) {
            return makeId(state);
        }
    }
    return result;
}

function allotColor(players) {
    let result = COLOR[Math.floor(Math.random() * 8)];
    for (const id in players) {
        if (result === players[id]) {
            return allotColor(players);
        }
    }
    return result;
}

module.exports = {
    makeId,
    allotColor,
}