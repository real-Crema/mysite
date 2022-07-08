const DURATION_TRANSITION = 180;
const DURATION_ANIMATION = 400;
const DURATION_UI = 300;
const DURATION_TIMEOUT = 500;
const BEZIER_UI = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const BEZIER_OUT_BACK = 'cubic-bezier(0.18, 0.89, 0.32, 1.28)';
const BEZIER_OUT_BACK_REVERSE = 'cubic-bezier(0.68, -0.28, 0.82, 0.11)';

function hideElements(elements) {
    for (let element of elements) {
        element.animate(
            {opacity: [1, 0]},
            {duration: DURATION_TRANSITION, fill: 'forwards'}
        )
        setTimeout(() => {
            element.style.display = 'none';
        }, DURATION_TRANSITION);
    }
}

function showElements(elements) {
    for (let element of elements) {
        element.animate(
            {opacity: [0, 1],},
            {duration: DURATION_TRANSITION, fill: 'forwards'}
        )
        element.style.display = 'initial';
    }
}

function changeStyle(element, {
                         text = element.innerText,
                         color = element.style.color,
                         bg = element.style.backgroundColor,
                     } = {}) {
    const className = element.className;
    element.animate(
        { color: [element.style.color, 'transparent'] },
        { duration: DURATION_TRANSITION, fill: 'forwards' }
    );
    setTimeout(() => {
        element.innerText = text;
        element.animate(
            {
                color: ['transparent', color],
                backgroundColor: [element.style.backgroundColor, bg]
            },
            { duration: DURATION_TRANSITION, fill: 'forwards' }
        );
        element.setAttribute('class', className);
    }, DURATION_TRANSITION);
}

function validateIndex(i, j) {
    return i >= 0 && i < 6 && j >= 0 && j < 6;
}

async function clearUpPieces(squares, count=0) {
    if (count > 10) return;

    const indices = [];
    let i, j;
    if (count < 6) {
        i = count; j = 0;
    } else {
        i = 5; j = count - 5;
    }
    do {
        indices.push([i, j]);
    } while (validateIndex(--i, ++j));

    let numPieces = 0;
    for (const index of indices) {
        const container = squares[index[0]][index[1]].container;
        for (const piece of container) {
            numPieces++;
            const element = piece.element;
            element.animate(
                {
                    fillOpacity: [1, 0],
                    r: [14, 0],
                }, {
                    duration: DURATION_ANIMATION,
                    easing: BEZIER_OUT_BACK_REVERSE,
                    fill: "forwards",
                }
            );
            setTimeout(element.remove.bind(element), DURATION_ANIMATION);
        }
    }

    if (numPieces === 0) {
        await clearUpPieces(squares, count + 1);
    } else {
        return new Promise(resolve => {
            setTimeout(async () => {
                await clearUpPieces(squares, count + 1);
                resolve();
            }, 120);
        });
    }
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export {
    DURATION_TRANSITION, DURATION_ANIMATION, DURATION_UI, DURATION_TIMEOUT,
    BEZIER_UI, BEZIER_OUT_BACK, BEZIER_OUT_BACK_REVERSE,
    hideElements, showElements, changeStyle,
    validateIndex,
    clearUpPieces,
    sleep,
}