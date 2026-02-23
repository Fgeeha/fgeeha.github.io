/* ================================================
   Furry Roulette — Script
   Vanilla JS, без фреймворков и библиотек.
   Логика: генерация SVG-колеса, анимация вращения
   через CSS transition, случайный выбор персонажа
   и цвета.
   ================================================ */

(function () {
    'use strict';

    /* ==========================================
       Данные
       ========================================== */

    /** Массив имён фурри-персонажей */
    const furries = [
        'Fox',
        'Wolf',
        'Tiger',
        'Dragon',
        'Cat',
        'Raccoon',
        'Lynx',
        'Bear',
        'Dog',
        'Bunny',
        'Deer',
        'Snow Leopard',
        'Panda',
        'Otter'
      ];
    /** Массив цветов (названия) */
    const colors = ['Red', 'Blue', 'Purple', 'Black', 'White', 'Neon Green', 'Pink'];

    /** Hex-значения для каждого цвета результата */
    const colorHex = {
        'Red':        '#ff4444',
        'Blue':       '#4488ff',
        'Purple':     '#a855f7',
        'Black':      '#555555',
        'White':      '#f0f0f0',
        'Neon Green': '#39ff14',
        'Pink':       '#ff69b4'
    };

    /** Русские названия цветов */
    const colorRu = {
        'Red':        'Красный',
        'Blue':       'Синий',
        'Purple':     'Фиолетовый',
        'Black':      'Чёрный',
        'White':      'Белый',
        'Neon Green': 'Неоново-зелёный',
        'Pink':       'Розовый'
    };

    /** Цвета сегментов колеса (яркие, контрастные) */
    const segmentColors = [
        '#ff4d6d',   /* Fox           */
        '#4361ee',   /* Wolf          */
        '#ffa62b',   /* Tiger         */
        '#a855f7',   /* Dragon        */
        '#06d6a0',   /* Cat           */
        '#ffd166',   /* Raccoon       */
        '#4cc9f0',   /* Lynx          */
        '#8d6e63',   /* Bear          */
        '#90dbf4',   /* Dog           */
        '#fbc4ab',   /* Bunny         */
        '#2ec4b6',   /* Deer          */
        '#adb5bd',   /* Snow Leopard  */
        '#6a994e',   /* Panda         */
        '#ffafcc'    /* Otter         */
      ];
      

    /** Эмодзи для каждого персонажа */
    const furryEmoji = {
        'Fox':           '\u{1F98A}', // 🦊
        'Wolf':          '\u{1F43A}', // 🐺
        'Tiger':         '\u{1F42F}', // 🐯
        'Dragon':        '\u{1F409}', // 🐉
        'Cat':           '\u{1F431}', // 🐱
        'Raccoon':       '\u{1F99D}', // 🦝
        'Lynx':          '\u{1F408}', // 🐈‍⬛ (ближайший аналог)
        'Bear':          '\u{1F43B}', // 🐻
        'Dog':           '\u{1F436}', // 🐶
        'Bunny':         '\u{1F430}', // 🐰
        'Deer':          '\u{1F98C}', // 🦌
        'Snow Leopard':  '\u{1F406}', // 🐆
        'Panda':         '\u{1F43C}', // 🐼
        'Otter':         '\u{1F9A6}'  // 🦦
      };
      

    /* ==========================================
       Константы SVG
       ========================================== */

    const SVG_NS  = 'http://www.w3.org/2000/svg';
    const CX      = 200;       /* Центр X */
    const CY      = 200;       /* Центр Y */
    const RADIUS  = 190;       /* Радиус колеса */
    const TOTAL   = furries.length;
    const SEG_DEG = 360 / TOTAL;  /* Угол одного сегмента (~51.43°) */

    /* ==========================================
       DOM-элементы
       ========================================== */

    const wheelSVG    = document.getElementById('wheel-svg');
    const wheelInner  = document.getElementById('wheel-inner');
    const spinBtn     = document.getElementById('spin-btn');
    const spinBtnText = spinBtn.querySelector('.spin-button__text');
    const resultEl    = document.getElementById('result');
    const resultCard  = document.getElementById('result-card');
    const resultNameEl  = document.getElementById('result-name');
    const colorSwatchEl = document.getElementById('color-swatch');
    const colorNameEl   = document.getElementById('color-name');

    /* ==========================================
       Состояние
       ========================================== */

    let currentRotation = 0;
    let isSpinning      = false;

    /* ==========================================
       Вспомогательные функции
       ========================================== */

    /**
     * Создает SVG-элемент с атрибутами
     * @param {string} tag — имя тега
     * @param {Object} attrs — объект атрибутов
     * @returns {SVGElement}
     */
    function svgEl(tag, attrs) {
        var el = document.createElementNS(SVG_NS, tag);
        if (attrs) {
            for (var key in attrs) {
                if (attrs.hasOwnProperty(key)) {
                    el.setAttribute(key, attrs[key]);
                }
            }
        }
        return el;
    }

    /**
     * Переводит градусы в радианы
     * @param {number} deg
     * @returns {number}
     */
    function degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    /**
     * Генерирует SVG path (d) для сегмента колеса
     * Сегменты начинаются от «12 часов» (top), по часовой стрелке.
     * @param {number} index — индекс сегмента (0..TOTAL-1)
     * @returns {string} — значение атрибута d
     */
    function segmentPath(index) {
        var startDeg = index * SEG_DEG - 90;        /* -90 чтобы начало от top */
        var endDeg   = startDeg + SEG_DEG;

        var startRad = degToRad(startDeg);
        var endRad   = degToRad(endDeg);

        var x1 = CX + RADIUS * Math.cos(startRad);
        var y1 = CY + RADIUS * Math.sin(startRad);
        var x2 = CX + RADIUS * Math.cos(endRad);
        var y2 = CY + RADIUS * Math.sin(endRad);

        var largeArc = SEG_DEG > 180 ? 1 : 0;

        return [
            'M', CX, CY,
            'L', x1.toFixed(2), y1.toFixed(2),
            'A', RADIUS, RADIUS, 0, largeArc, 1, x2.toFixed(2), y2.toFixed(2),
            'Z'
        ].join(' ');
    }

    /* ==========================================
       Построение SVG-колеса
       ========================================== */

    function buildWheel() {
        /* Определение SVG-фильтра для тени сегментов */
        var defs = svgEl('defs');
        var filter = svgEl('filter', { id: 'segShadow', x: '-10%', y: '-10%', width: '120%', height: '120%' });
        var feGauss = svgEl('feGaussianBlur', { 'in': 'SourceAlpha', stdDeviation: '2' });
        var feOffset = svgEl('feOffset', { dx: '0', dy: '1', result: 'shadow' });
        var feMerge = svgEl('feMerge');
        var feMerge1 = svgEl('feMergeNode', { 'in': 'shadow' });
        var feMerge2 = svgEl('feMergeNode', { 'in': 'SourceGraphic' });
        feMerge.appendChild(feMerge1);
        feMerge.appendChild(feMerge2);
        filter.appendChild(feGauss);
        filter.appendChild(feOffset);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
        wheelSVG.appendChild(defs);

        /* Группа сегментов */
        var segGroup = svgEl('g', { filter: 'url(#segShadow)' });

        furries.forEach(function (name, i) {
            /* --- Сегмент (path) --- */
            var path = svgEl('path', {
                d: segmentPath(i),
                fill: segmentColors[i],
                stroke: '#0b0b1a',
                'stroke-width': '2.5'
            });
            segGroup.appendChild(path);
        });

        wheelSVG.appendChild(segGroup);

        /* --- Текстовые метки --- */
        furries.forEach(function (name, i) {
            var midDeg = i * SEG_DEG + SEG_DEG / 2;
            var midRad = degToRad(midDeg - 90);

            var textR = RADIUS * 0.62;
            var tx = CX + textR * Math.cos(midRad);
            var ty = CY + textR * Math.sin(midRad);

            /* Определяем, нужно ли переворачивать текст */
            var rotDeg = midDeg;
            if (midDeg > 90 && midDeg <= 270) {
                rotDeg += 180;
            }

            var text = svgEl('text', {
                x: tx.toFixed(2),
                y: ty.toFixed(2),
                fill: '#ffffff',
                'font-size': '14',
                'font-weight': '700',
                'font-family': 'Segoe UI, system-ui, sans-serif',
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'paint-order': 'stroke',
                stroke: 'rgba(0,0,0,0.35)',
                'stroke-width': '3',
                'stroke-linejoin': 'round',
                transform: 'rotate(' + rotDeg + ', ' + tx.toFixed(2) + ', ' + ty.toFixed(2) + ')'
            });
            text.textContent = name;
            wheelSVG.appendChild(text);
        });

        /* --- Центральный круг --- */
        var centerShadow = svgEl('circle', {
            cx: CX,
            cy: CY,
            r: '38',
            fill: 'rgba(0,0,0,0.3)'
        });
        wheelSVG.appendChild(centerShadow);

        var centerCircle = svgEl('circle', {
            cx: CX,
            cy: CY,
            r: '35',
            fill: '#14142e',
            stroke: 'url(#centerGrad)',
            'stroke-width': '3'
        });

        /* Градиент для обводки центра */
        var centerGrad = svgEl('linearGradient', { id: 'centerGrad', x1: '0', y1: '0', x2: '1', y2: '1' });
        var stop1 = svgEl('stop', { offset: '0%', 'stop-color': '#b44aff' });
        var stop2 = svgEl('stop', { offset: '100%', 'stop-color': '#4ae8ff' });
        centerGrad.appendChild(stop1);
        centerGrad.appendChild(stop2);
        defs.appendChild(centerGrad);

        wheelSVG.appendChild(centerCircle);

        /* Лапка в центре */
        var centerEmoji = svgEl('text', {
            x: CX,
            y: CY + 2,
            fill: '#ffffff',
            'font-size': '26',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        });
        centerEmoji.textContent = '\u{1F43E}';
        wheelSVG.appendChild(centerEmoji);
    }

    /* ==========================================
       Вращение рулетки
       ========================================== */

    function spin() {
        if (isSpinning) return;
        isSpinning = true;

        /* Скрыть предыдущий результат */
        resultEl.classList.remove('visible');

        /* Случайный выбор персонажа и цвета */
        var furryIdx = Math.floor(Math.random() * TOTAL);
        var colorIdx = Math.floor(Math.random() * colors.length);

        /* Вычисление угла вращения */
        var targetSegCenter = furryIdx * SEG_DEG + SEG_DEG / 2;

        /* Небольшой случайный сдвиг внутри сегмента (не выходя за его границы) */
        var randomOffset = (Math.random() - 0.5) * SEG_DEG * 0.5;

        /* Дополнительные полные обороты для эффекта длительного вращения (5-9 оборотов) */
        var extraSpins = (5 + Math.floor(Math.random() * 5)) * 360;

        /*
         * Для попадания указателя (top) на сегмент furryIdx:
         * Нужно повернуть колесо так, чтобы центр сегмента оказался вверху.
         * Поворот по часовой стрелке на (360 - targetSegCenter) градусов
         * плюс накопленное смещение.
         */
        var needed = 360 - targetSegCenter + randomOffset;

        /* Нормализация: сколько нужно докрутить от текущего положения */
        var currentMod = ((currentRotation % 360) + 360) % 360;
        var delta = needed - currentMod;
        if (delta < 0) delta += 360;

        var spinAngle = delta + extraSpins;
        currentRotation += spinAngle;

        /* Применяем CSS-анимацию вращения */
        wheelInner.style.transition = 'transform 4s cubic-bezier(0.15, 0.7, 0.1, 1)';
        wheelInner.style.transform = 'rotate(' + currentRotation + 'deg)';

        /* Обновляем UI кнопки */
        spinBtn.disabled = true;
        spinBtnText.textContent = 'Крутится...';

        /* Показываем результат после завершения анимации */
        setTimeout(function () {
            /* Сбрасываем transition, чтобы не мешал при следующем вращении */
            wheelInner.style.transition = 'none';

            showResult(
                furries[furryIdx],
                colors[colorIdx],
                colorHex[colors[colorIdx]]
            );

            /* Возвращаем кнопку */
            spinBtn.disabled = false;
            spinBtnText.textContent = 'Крутить!';
            isSpinning = false;
        }, 4350);
    }

    /* ==========================================
       Отображение результата
       ========================================== */

    /**
     * Показывает карточку результата с анимацией.
     * @param {string} name — имя персонажа (English)
     * @param {string} colorName — название цвета (English)
     * @param {string} hex — hex-код цвета
     */
    function showResult(name, colorName, hex) {
        /* Имя персонажа с эмодзи */
        var emoji = furryEmoji[name] || '\u{1F43E}';
        resultNameEl.textContent = emoji + '  ' + name;
        resultNameEl.style.color = hex;
        resultNameEl.style.textShadow = '0 0 20px ' + hex + '80, 0 0 40px ' + hex + '40';

        /* Цвет: визуальный индикатор и название */
        colorSwatchEl.style.backgroundColor = hex;
        colorSwatchEl.style.boxShadow = '0 0 12px ' + hex + ', 0 0 4px ' + hex;

        var ruName = colorRu[colorName] || colorName;
        colorNameEl.textContent = ruName;
        colorNameEl.style.color = hex;

        /* Карточка: динамическая рамка и тень по цвету результата */
        resultCard.style.borderColor = hex + '60';
        resultCard.style.boxShadow =
            '0 0 25px ' + hex + '25, ' +
            '0 0 50px ' + hex + '10, ' +
            '0 8px 40px rgba(0, 0, 0, 0.4)';

        /* Показать с анимацией (через requestAnimationFrame для корректного триггера) */
        requestAnimationFrame(function () {
            resultEl.classList.add('visible');
        });
    }

    /* ==========================================
       Инициализация
       ========================================== */

    function init() {
        buildWheel();
        spinBtn.addEventListener('click', spin);
    }

    /* Запуск после загрузки DOM */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
