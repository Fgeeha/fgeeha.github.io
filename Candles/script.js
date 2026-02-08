(function () {
  'use strict';

  /* ===== НАСТРОЙКИ ===== */
  var TOTAL_SPOTS = 20;
  var PRE_LIT_COUNT = 7;

  // Время горения свечи (мс): от MIN до MAX (случайно для каждой)
  var BURN_TIME_MIN = 20000;  // 20 сек
  var BURN_TIME_MAX = 50000;  // 50 сек

  // Интервал обновления высоты свечи при горении (мс)
  var BURN_TICK = 1000;

  // Минимальная высота свечи перед угасанием (px)
  var MIN_CANDLE_HEIGHT = 8;

  /* ===== ЭЛЕМЕНТЫ ===== */
  var table = document.getElementById('candleTable');
  var messageArea = document.getElementById('messageArea');

  /* ===== СОСТОЯНИЕ ===== */
  var spots = [];  // массив объектов { el, state, timer, burnTimer, startHeight }

  // Христианские напутствия при постановке свечей
  var blessings = [
    'Свеча поставлена. Господь да услышит вашу молитву.',
    'Свеча поставлена. Да будет свет в вашем сердце.',
    'Свеча поставлена. Пусть будет на благо.',
    'Свеча поставлена. Мир вам и вашим близким.',
    'Свеча поставлена. Да хранит вас Господь.',
    'Свеча поставлена. Пусть огонь веры согревает душу.'
  ];

  // Цитаты из Писания, связанные со светом и свечами
  var verses = [
    { text: 'Вы — свет мира. Не может укрыться город, стоящий на верху горы.', ref: 'Мф. 5:14' },
    { text: 'И, зажегши свечу, не ставят её под сосудом, но на подсвечнике, и светит всем в доме.', ref: 'Мф. 5:15' },
    { text: 'Так да светит свет ваш пред людьми, чтобы они видели ваши добрые дела и прославляли Отца вашего Небесного.', ref: 'Мф. 5:16' },
    { text: 'И свет во тьме светит, и тьма не объяла его.', ref: 'Ин. 1:5' },
    { text: 'Я свет миру; кто последует за Мною, тот не будет ходить во тьме, но будет иметь свет жизни.', ref: 'Ин. 8:12' },
    { text: 'Вы были некогда тьма, а теперь — свет в Господе: поступайте, как чада света.', ref: 'Еф. 5:8' },
    { text: '...чтобы вам быть неукоризненными и чистыми, чадами Божиими, сияющими, как светила в мире.', ref: 'Флп. 2:15' }
  ];

  var preLitIndices = getRandomIndices(TOTAL_SPOTS, PRE_LIT_COUNT);

  init();

  /* ===== ИНИЦИАЛИЗАЦИЯ ===== */
  function init() {
    setHeaderVerse();

    for (var i = 0; i < TOTAL_SPOTS; i++) {
      var isPreLit = preLitIndices.indexOf(i) !== -1;
      var spotData = createSpot(i, isPreLit);
      spots.push(spotData);
      table.appendChild(spotData.el);

      // Предзажжённые свечи тоже со временем гаснут
      if (isPreLit) {
        // Стартовое время горения -- случайное, но предзажжённые уже частично прогорели
        var remainingTime = randomBetween(8000, 30000);
        startBurning(spotData, remainingTime, randomBetween(20, 35));
      }
    }
  }

  /* ===== СОЗДАНИЕ МЕСТА ===== */
  function createSpot(index, isLit) {
    var el = document.createElement('div');
    el.className = 'spot';
    el.dataset.index = index;

    var data = {
      el: el,
      state: 'empty',  // empty | lit | extinguished
      burnInterval: null
    };

    if (isLit) {
      data.state = 'lit';
      el.classList.add('spot--lit');
      el.appendChild(buildCandle(true));
    } else {
      el.classList.add('spot--free');
      el.addEventListener('click', function () {
        handleSpotClick(data);
      });
    }

    return data;
  }

  /* ===== ПОСТРОЕНИЕ СВЕЧИ ===== */
  function buildCandle(immediate) {
    var candle = document.createElement('div');
    candle.className = 'candle';

    var flameGroup = document.createElement('div');
    flameGroup.className = 'flame-group';

    var glow = document.createElement('div');
    glow.className = 'glow';

    var flame = document.createElement('div');
    flame.className = 'flame';

    var flameInner = document.createElement('div');
    flameInner.className = 'flame flame--inner';

    flameGroup.appendChild(glow);
    flameGroup.appendChild(flame);
    flameGroup.appendChild(flameInner);

    var wick = document.createElement('div');
    wick.className = 'candle__wick';

    var body = document.createElement('div');
    body.className = 'candle__body';

    candle.appendChild(flameGroup);
    candle.appendChild(wick);
    candle.appendChild(body);

    if (immediate) {
      candle.classList.add('candle--visible');
      flameGroup.classList.add('flame-group--active');
    }

    return candle;
  }

  /* ===== КЛИК ПО МЕСТУ ===== */
  function handleSpotClick(spotData) {
    if (spotData.state !== 'empty') {
      return;
    }

    // Проверяем, есть ли свободные места
    var freeCount = countFreeSpots();
    if (freeCount === 0) {
      showMessage('Свободных мест нет. Все свечи зажжены.', true);
      return;
    }

    spotData.state = 'lit';
    spotData.el.classList.remove('spot--free');

    // Создаём свечу с анимацией
    var candle = buildCandle(false);
    spotData.el.appendChild(candle);

    // Анимация появления
    requestAnimationFrame(function () {
      candle.classList.add('candle--visible');

      // Зажигаем пламя после появления
      setTimeout(function () {
        var flameGroup = candle.querySelector('.flame-group');
        flameGroup.classList.add('flame-group--active');
        spotData.el.classList.add('spot--lit');

        // Запускаем горение
        var burnTime = randomBetween(BURN_TIME_MIN, BURN_TIME_MAX);
        startBurning(spotData, burnTime, 40);
      }, 600);
    });

    // Показываем благословение и случайную цитату
    var blessing = blessings[Math.floor(Math.random() * blessings.length)];
    var verse = verses[Math.floor(Math.random() * verses.length)];
    showMessage(blessing, false, verse);
  }

  /* ===== ГОРЕНИЕ И УГАСАНИЕ ===== */
  function startBurning(spotData, totalTime, startHeight) {
    var candleBody = spotData.el.querySelector('.candle__body');
    if (!candleBody) return;

    var currentHeight = startHeight;
    var tickCount = Math.floor(totalTime / BURN_TICK);
    var heightStep = (currentHeight - MIN_CANDLE_HEIGHT) / tickCount;
    var elapsed = 0;

    candleBody.style.height = currentHeight + 'px';

    spotData.burnInterval = setInterval(function () {
      elapsed += BURN_TICK;
      currentHeight -= heightStep;

      if (currentHeight <= MIN_CANDLE_HEIGHT || elapsed >= totalTime) {
        currentHeight = MIN_CANDLE_HEIGHT;
        candleBody.style.height = currentHeight + 'px';
        clearInterval(spotData.burnInterval);
        extinguish(spotData);
        return;
      }

      candleBody.style.height = Math.round(currentHeight) + 'px';
    }, BURN_TICK);
  }

  /* ===== ЗАТУХАНИЕ СВЕЧИ ===== */
  function extinguish(spotData) {
    spotData.state = 'extinguished';

    var flameGroup = spotData.el.querySelector('.flame-group');
    if (flameGroup) {
      flameGroup.classList.remove('flame-group--active');
      flameGroup.classList.add('flame-group--dying');
    }

    spotData.el.classList.remove('spot--lit');
    spotData.el.classList.add('spot--extinguished');

    // Дымок после затухания
    setTimeout(function () {
      var smoke = document.createElement('div');
      smoke.className = 'smoke';
      if (flameGroup) {
        flameGroup.appendChild(smoke);
      }

      // Удаляем дым после анимации
      setTimeout(function () {
        if (smoke.parentNode) {
          smoke.parentNode.removeChild(smoke);
        }
      }, 2000);
    }, 300);

    // Через некоторое время свеча исчезает и место освобождается
    setTimeout(function () {
      freeUpSpot(spotData);
    }, 5000);
  }

  /* ===== ОСВОБОЖДЕНИЕ МЕСТА ===== */
  function freeUpSpot(spotData) {
    var candle = spotData.el.querySelector('.candle');
    if (candle) {
      // Плавное исчезновение
      candle.style.opacity = '0';
      setTimeout(function () {
        if (candle.parentNode) {
          candle.parentNode.removeChild(candle);
        }
      }, 500);
    }

    spotData.el.classList.remove('spot--extinguished', 'spot--used');
    spotData.state = 'empty';
    spotData.el.classList.add('spot--free');

    // Навешиваем обработчик заново
    spotData.el.addEventListener('click', function handler() {
      spotData.el.removeEventListener('click', handler);
      handleSpotClick(spotData);
    });
  }

  /* ===== ПОДСЧЁТ СВОБОДНЫХ МЕСТ ===== */
  function countFreeSpots() {
    var count = 0;
    for (var i = 0; i < spots.length; i++) {
      if (spots[i].state === 'empty') {
        count++;
      }
    }
    return count;
  }

  /* ===== СООБЩЕНИЕ ===== */
  function showMessage(text, isWarning, verse) {
    messageArea.innerHTML = '';

    var p = document.createElement('p');
    p.className = 'message-text';
    if (isWarning) {
      p.classList.add('message-text--warn');
    }
    p.textContent = text;
    messageArea.appendChild(p);

    // Добавляем цитату из Писания, если передана
    if (verse) {
      var q = document.createElement('blockquote');
      q.className = 'message-verse';
      q.textContent = '\u00AB' + verse.text + '\u00BB';

      var cite = document.createElement('cite');
      cite.className = 'message-verse__ref';
      cite.textContent = verse.ref;

      q.appendChild(cite);
      messageArea.appendChild(q);
    }
  }

  /* ===== СЛУЧАЙНАЯ ЦИТАТА В ШАПКЕ ===== */
  function setHeaderVerse() {
    var verseEl = document.querySelector('.header__verse');
    var refEl = document.querySelector('.header__verse-source');
    if (!verseEl || !refEl) return;

    var v = verses[Math.floor(Math.random() * verses.length)];
    verseEl.textContent = '\u00AB' + v.text + '\u00BB';
    refEl.textContent = v.ref;
  }

  /* ===== УТИЛИТЫ ===== */
  function getRandomIndices(total, count) {
    var indices = [];
    while (indices.length < count) {
      var r = Math.floor(Math.random() * total);
      if (indices.indexOf(r) === -1) {
        indices.push(r);
      }
    }
    return indices;
  }

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
})();
