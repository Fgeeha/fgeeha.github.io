/* Свечка на удачу — логика зажигания */

(function () {
  'use strict';

  var scene = document.getElementById('scene');
  var candle = document.getElementById('candleWrapper');
  var btn = document.getElementById('lightBtn');
  var isLit = false;

  /* Зажечь свечу */
  function lightCandle() {
    if (isLit) return;           // повторный клик ничего не делает
    isLit = true;
    scene.classList.add('scene--lit');
  }

  /* Обработчики: клик по свече и по кнопке */
  candle.addEventListener('click', lightCandle);
  btn.addEventListener('click', lightCandle);
})();
