const COLOR_PACK_0 = [
    '#F90716', '#FF5403', '#FFCA03', '#FFD615',
    '#FF577F', '#FF884B', '#FFC764', '#F78F1E',
    '#6E3CBC', '#7267CB', '#98BAE7', '#B8E4F0',
]

const COLOR_PACK_1 = [
    '#D2E1C8', '#FEE4A6', '#F9C4AA', '#F7F4E3',
    '#FEE3EC', '#F9C5D5', '#F999B7', '#F2789F',
    '#FFE6E6', '#FFABE1', '#A685E2', '#D9D7F1',
]

let layer, clientHeight, clientWidth, colorPack;

class Confetti {
    static arr = [];
    
    constructor(width) {
        this.width = width;
        this.top = randInt(-100, -400);
        this.left = randInt(clientWidth);
        this.element = document.createElement('div');
        this.element.style.backgroundColor = colorPack[randInt(11)];
        this.element.style.width = `${width}px`;
        this.element.style.height = `${Math.floor(width / 1.5)}px`;
        this.element.style.left = `${this.left}px`;
        this.element.style.top = `${this.top}px`;
        layer.appendChild(this.element);
        Confetti.arr.push(this);
    }
    
    static initialize() {
        let total = Math.round(clientWidth / 3);
        if (total > 400) total = 400;
        let numOfEachShape = Math.round(total / 3);
        
        let width = []
        for (let i = 0; i < total; i++) {
            if (i < numOfEachShape) width[i] = randInt(14, 10);
            else if (i < numOfEachShape * 2) width[i] = randInt(20, 16);
            else width[i] = randInt(26, 22);
        }
        
        width.sort(() => {
            return Math.random() - 0.5;
        });
        
        for (let i = 0; i < total; i++) {
            let rect = new Confetti(width[i]);
            
            if (i < numOfEachShape) {
                rect.element.style.borderRadius = `${width[i]}px`;
                rect.element.style.height = `${width[i]}px`;
            } else if (i < numOfEachShape * 2) {
                rect.element.style.width = '0';
                rect.element.style.height = '0';
                rect.element.style.backgroundColor = 'initial';
                rect.element.style.borderLeft = `${width[i] / 2}px solid transparent`;
                rect.element.style.borderRight = `${width[i] / 2}px solid transparent`;
                rect.element.style.borderBottom = `${width[i]}px solid ${colorPack[randInt(11)]}`;
            }
        }
        
        Confetti.arr.sort(() => {
            return Math.random() - 0.5;
        });
    }
}

function playAnimation() {
    Confetti.initialize();

    const total = Confetti.arr.length;

    Confetti.arr.forEach((shape, index) => {
        let duration = 2000, interval, leftTo, easing;
        
        shape.element.style.transform = `rotate(${Math.random() - 0.5}turn)`;
        
        if (index < total / 8) {
            shape.left = Math.floor(clientWidth / 2);
            shape.element.style.left = `${shape.left}px`;
            interval = randInt(300);
            leftTo = randInt(clientWidth + 1000, -1000);
            easing = 'cubic-bezier(0.12, 0.5, 0.45, 0.45)';
        } else {
            interval = randInt(3000);
            leftTo = randInt(shape.left + 100, shape.left - 100);
            easing = 'linear';
        }
        
        if (shape.width <= 14) duration += 1000;
        else if (shape.width <= 20) duration += 500;
        
        setTimeout(() => {
            shape.element.animate(
                {
                    left: [`${shape.left}px`, `${leftTo}px`],
                    top: [`${shape.top}px`, `${clientHeight}px`],
                    transform: ['none',
                        `rotateX(${randInt(5, -5)}turn) \
                         rotateY(${randInt(8, 5, true)}turn) \
                         rotateZ(${randInt(5, -5)}turn)`
                    ]
                },
                {
                    duration: duration,
                    easing: easing,
                }
            );
        }, interval)
    });
}

function randInt(max, min = 0, opposite = false) {
    let out = Math.round(Math.random() * (max - min)) + min;
    if (opposite) {
        return out * Math.pow(-1, Math.round(Math.random()))
    } else {
        return out
    }
}

export function confettiShowersDown(){
    layer = document.createElement('section');
    layer.setAttribute('id', 'confetti');
    document.getElementById('body').appendChild(layer);
    clientHeight = layer.clientHeight;
    clientWidth = layer.clientWidth;
    colorPack = [COLOR_PACK_0, COLOR_PACK_1][Math.round(Math.random())];
    playAnimation();
    setTimeout(layer.remove.bind(layer), 6000);
}