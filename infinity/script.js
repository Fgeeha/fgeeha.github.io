const container = document.querySelector('.infinity-container');
const movingText = document.querySelector('.moving-text');
const T = 12000; // Slower animation (12 seconds instead of 8)
let startTime = null;

function createOnes(cx, cy, r, N) {
    for (let i = 0; i < N; i++) {
        const theta = i * 2 * Math.PI / N;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        const div = document.createElement('div');
        div.className = 'one';
        div.textContent = '1';
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.transform = `translate(-50%, -50%) rotate(${(theta * 180 / Math.PI + 90)}deg)`;
        container.appendChild(div);
    }
}

const N = 12;
createOnes(125, 100, 75, N);
createOnes(275, 100, 75, N);

function animate(time) {
    if (!startTime) startTime = time;
    const elapsed = (time - startTime) % T;
    const t = elapsed / T;

    let cx, cy, angle;
    if (t < 0.5) {
        cx = 125;
        cy = 100;
        angle = -360 * 2 * t;
    } else {
        cx = 275;
        cy = 100;
        angle = 180 + 360 * 2 * (t - 0.5);
    }

    const rad = angle * Math.PI / 180;
    const x = cx + 75 * Math.cos(rad);
    const y = cy + 75 * Math.sin(rad);

    movingText.style.left = `${x}px`;
    movingText.style.top = `${y}px`;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);