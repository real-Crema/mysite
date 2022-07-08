import {
    validateIndex,
} from "./utils.js";

let indefinite_recursion = false;

function createGameState(numberOfPlayers = 2) {
    let state = [];
    for (let i = 0; i < 6; i++) {
        state[i] = [];
        for (let j = 0; j < 6; j++) {
            state[i][j] = new Array(numberOfPlayers + 2);
            state[i][j].fill(0);
            if (i === 0 || i === 5 || j === 0 || j === 5) {
                if ((i + j) % 5 === 0) {
                    state[i][j][1] = 2;
                } else {
                    state[i][j][1] = 3;
                }
            } else {
                state[i][j][1] = 4;
            }
        }
    }
    return state;  // state[row][column][nextPlayer, size, numPieces...]
}

function computeGameState(state, newPiece) {
    // 将三维数组的最底层更新为下个玩家的编号。
    let nextPlayer = newPiece.number;
    nextPlayer === state[0][0].length - 3 ? nextPlayer = 0 : nextPlayer++;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            state[i][j][0] = nextPlayer;
        }
    }

    // 推导游戏状态的变化并判断胜负。
    compute(state, newPiece.row, newPiece.column, newPiece.number + 2);
    return getResult(state);
}

function compute(state, i, j, currentPlayerIndex) {
    const length = state[i][j].length;
    const size = state[i][j][1];
    let numPieces = ++state[i][j][currentPlayerIndex];
    if (numPieces >= size) {
        state[i][j][currentPlayerIndex] -= size;

        let neighborIndices = new Set();
        if (validateIndex(i, j + 1)) neighborIndices.add([i, j + 1]);
        if (validateIndex(i + 1, j)) neighborIndices.add([i + 1, j]);
        if (validateIndex(i, j - 1)) neighborIndices.add([i, j - 1]);
        if (validateIndex(i - 1, j)) neighborIndices.add([i - 1, j]);

        for (let index of neighborIndices) {
            let neighbor = state[index[0]][index[1]];
            for (let playerIndex = 2; playerIndex < length; playerIndex++) {
                if (playerIndex === currentPlayerIndex || neighbor[playerIndex] === 0) continue;
                neighbor[currentPlayerIndex] += neighbor[playerIndex];
                neighbor[playerIndex] = 0;
            }
            try {
                compute(state, index[0], index[1], currentPlayerIndex);
            } catch (e) {
                indefinite_recursion = true;
            }
        }
    }
}

function getResult(state) {
    /* 统计每个玩家当前的棋子数量 */
    let length = state[0][0].length;
    let result = new Array(length - 2);
    result.fill(0);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            for (let playerIndex = 2; playerIndex < length; playerIndex++) {
                result[playerIndex - 2] += state[i][j][playerIndex];
            }
        }
    }
    return result;
}

export {
    createGameState,
    computeGameState,
    indefinite_recursion,
}