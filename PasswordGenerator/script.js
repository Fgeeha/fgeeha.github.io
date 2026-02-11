  // ===== i18n =====
  const translations = {
    en: {
      meta_title: "Secure Password Generator | Strong random passwords",
      title: "Secure Password Generator",
      controls: "Generation Parameters",
      password_length: "Password Length",
      password_count: "Number of Passwords",
      count_help: "Generate 1–20 passwords at once.",
      lowercase: "Lowercase Letters",
      uppercase: "Uppercase Letters",
      numbers: "Digits",
      symbols: "Symbols",
      ensure_group: "Guarantee one char from each selected group",
      exclude_ambiguous_chk: "Exclude ambiguous",
      exclude_similar_chk: "Exclude similar",
      no_repeats: "No immediate repeats",
      custom_sets: "Custom character sets",
      exclude_ambiguous: "Exclude (additional)",
      custom_hint: "Edit sets and/or add extra exclusions.",
      generate: "Generate",
      copy_all: "Copy all",
      download: "Download .txt",
      entropy_title: "User Entropy",
      entropy_box: "Move mouse, scroll, press keys",
      entropy_note: "We use CSPRNG (crypto.getRandomValues); your actions add extra entropy.",
      generated_password_title: "Generated Passwords",
      bits: "bits",
      copied: "Copied!",
      copied_n: "Passwords copied",
      empty_charset: "Please select at least one character group or provide custom characters.",
      summary_tpl: "Alphabet: {n} chars • ~{b} bits per {L}-char password",
      show: "Show",
      hide: "Hide"
    },
    ru: {
      meta_title: "Генератор надёжных паролей | Strong random passwords",
      title: "Генератор надёжных паролей",
      controls: "Параметры генерации",
      password_length: "Длина пароля",
      password_count: "Количество паролей",
      count_help: "Сгенерировать от 1 до 20 паролей.",
      lowercase: "Буквы в нижнем регистре",
      uppercase: "Буквы в верхнем регистре",
      numbers: "Цифры",
      symbols: "Символы",
      ensure_group: "Гарантировать символ из каждой выбранной группы",
      exclude_ambiguous_chk: "Исключить неоднозначные",
      exclude_similar_chk: "Исключить похожие",
      no_repeats: "Без подряд идущих повторов",
      custom_sets: "Пользовательские наборы символов",
      exclude_ambiguous: "Исключить (дополнительно)",
      custom_hint: "Меняйте наборы и/или добавьте исключения вручную.",
      generate: "Сгенерировать",
      copy_all: "Скопировать всё",
      download: "Скачать .txt",
      entropy_title: "Пользовательская энтропия",
      entropy_box: "Двигайте мышь, крутите колесо",
      entropy_note: "Используется CSPRNG (crypto.getRandomValues); ваши действия добавляют дополнительную энтропию.",
      generated_password_title: "Сгенерированные пароли",
      bits: "бит",
      copied: "Скопировано!",
      copied_n: "Пароли скопированы",
      empty_charset: "Выберите хотя бы одну группу символов или задайте свои.",
      summary_tpl: "Алфавит: {n} симв. • ~{b} бит на пароль длиной {L}",
      show: "Показать",
      hide: "Скрыть"
    }
  };
  let currentLang = (navigator.language||'ru').startsWith('ru') ? 'ru' : 'ru';
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function t(key){ return translations[currentLang][key] || key; }
  function applyTranslations(){
    document.documentElement.lang = currentLang;
    $$('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      if(translations[currentLang][k]) el.textContent = translations[currentLang][k];
    });
    document.title = t('meta_title');
    $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
    updateSummary();
  }
  $$('#year').forEach?null:0; // noop for safety
  $('#year').textContent = new Date().getFullYear();
  $$('.lang-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentLang = btn.dataset.lang; applyTranslations(); });
  });

  // ===== Entropy pool (user events) =====
  // We can't seed CSPRNG; we mix user-derived 32-bit value via XOR into random bytes.
  let userEntropy = 0 >>> 0;       // 32-bit pool
  let userEntropyBits = 0;         // approximate bits collected
  const ENTROPY_MAX_BITS = 128;    // cap UI at 128
  const bar = $('#entropy-bar');
  const help = $('#entropy-help');
  const box = $('#entropy-box');

  function mix32(x){ // xorshift32
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return x >>> 0;
  }
  function absorb(v){
    // Mix event value with time; each event ~0.5–1.5 bits (heuristic)
    const now = Math.floor(performance.now() * 1000) >>> 0;
    userEntropy = mix32(userEntropy ^ ((v>>>0) ^ now));
    userEntropyBits = Math.min(ENTROPY_MAX_BITS, userEntropyBits + 1);
    const pct = Math.round(userEntropyBits / ENTROPY_MAX_BITS * 100);
    bar.style.width = pct + '%';
    help.innerHTML = `${userEntropyBits} ${t('bits')}`;
  }
  window.addEventListener('mousemove', e => absorb((e.clientX<<16) ^ e.clientY));
  window.addEventListener('wheel', e => absorb((Math.abs(e.deltaY) + 7) * 2654435761));
  window.addEventListener('keydown', e => absorb((e.keyCode||0) * 1103515245));
  window.addEventListener('touchmove', e => {
    const t = e.touches[0]; if(t) absorb((t.clientX<<16)^t.clientY);
  });

  // ===== Crypto helpers =====
  function getRand32(){
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    // Mix with userEntropy (XOR) — doesn't reduce security and may help on weak platforms
    a[0] = (a[0] ^ userEntropy) >>> 0;
    return a[0] >>> 0;
  }
  function randIndex(max){
    // Rejection sampling to avoid modulo bias
    if(max <= 0) throw new Error('max<=0');
    const range = 0x100000000; // 2^32
    const limit = range - (range % max);
    while(true){
      const r = getRand32();
      if(r < limit) return r % max;
    }
  }

  // ===== Building charset =====
  const similar = new Set('oO0iIl1B8S5Z2'.split('')); // can tweak
  const ambiguous = new Set('{}[]()/\\\'"`~,;:.<>|^'.split(''));
  function buildSets(){
    const sets = [];
    const useL = $('#chk-l').checked;
    const useU = $('#chk-u').checked;
    const useD = $('#chk-d').checked;
    const useS = $('#chk-s').checked;
    if(useL) sets.push($('#set-l').value);
    if(useU) sets.push($('#set-u').value);
    if(useD) sets.push($('#set-d').value);
    if(useS) sets.push($('#set-s').value);

    let chars = [...new Set(sets.join('').split(''))]; // unique
    // Exclusions
    const ex = new Set($('#exclude').value.split(''));
    const avoidAmb = $('#avoid-amb').checked;
    const avoidSim = $('#avoid-sim').checked;

    chars = chars.filter(ch =>
      (!avoidAmb || !ambiguous.has(ch)) &&
      (!avoidSim || !similar.has(ch)) &&
      !ex.has(ch)
    );
    return chars;
  }

  // ===== Password generation =====
  function ensureAtLeastOneFromEach(groups){
    // Return an array with exactly one char from each non-empty group
    const picks = [];
    for(const g of groups){
      if(g.length>0){
        picks.push(g[randIndex(g.length)]);
      }
    }
    return picks;
  }

  function estimateBits(alpha, L){
    return Math.round(L * Math.log2(Math.max(2, alpha)));
  }

  function genOnce(L, options){
    const groupsRaw = [
      $('#chk-l').checked ? $('#set-l').value.split('') : [],
      $('#chk-u').checked ? $('#set-u').value.split('') : [],
      $('#chk-d').checked ? $('#set-d').value.split('') : [],
      $('#chk-s').checked ? $('#set-s').value.split('') : [],
    ].map(arr=>{
      // respect global exclusions toggles
      return arr.filter(ch => {
        if($('#avoid-amb').checked && ambiguous.has(ch)) return false;
        if($('#avoid-sim').checked && similar.has(ch)) return false;
        if($('#exclude').value.includes(ch)) return false;
        return true;
      });
    });

    const alphabet = buildSets();
    if(alphabet.length === 0) throw new Error('empty');

    const guarantee = $('#ensure-group').checked;
    const noRepeat = $('#no-repeat').checked;

    const result = new Array(L);
    let idx = 0;

    if(guarantee){
      const picks = ensureAtLeastOneFromEach(groupsRaw);
      // If nothing was selected in any group, do nothing
      for(const ch of picks){
        if(idx < L){
          result[idx++] = ch;
        }
      }
    }
    while(idx < L){
      const ch = alphabet[randIndex(alphabet.length)];
      if(noRepeat && idx>0 && result[idx-1] === ch) continue;
      result[idx++] = ch;
    }
    // Shuffle to avoid predictable placement of guaranteed chars (Fisher–Yates)
    for(let i=result.length-1; i>0; i--){
      const j = randIndex(i+1);
      const tmp = result[i]; result[i] = result[j]; result[j] = tmp;
    }
    return result.join('');
  }

  function renderPasswords(list){
    const $list = $('#list'); $list.innerHTML = '';
    list.forEach(pwd=>{
      const row = document.createElement('div'); row.className='pwd';
      const span = document.createElement('span'); span.textContent = pwd; span.className='value';
      const toggle = document.createElement('button'); toggle.className='btn'; toggle.type='button'; toggle.setAttribute('aria-label','toggle');
      toggle.textContent = t('hide'); // will start visible
      const copy = document.createElement('button'); copy.className='btn'; copy.type='button'; copy.textContent='Copy';

      // mask/unmask
      let masked = false;
      function applyMask(){
        if(masked){
          span.textContent = '•'.repeat(Math.min(64, pwd.length)) + (pwd.length>64?'…':'');
          toggle.textContent = t('show');
        }else{
          span.textContent = pwd;
          toggle.textContent = t('hide');
        }
      }
      toggle.addEventListener('click', ()=>{ masked = !masked; applyMask(); });
      // default show (unmasked). You can change to masked=true if you prefer.
      applyMask();

      copy.addEventListener('click', async ()=>{
        try{
          await navigator.clipboard.writeText(pwd);
          copy.textContent = t('copied');
          setTimeout(()=> copy.textContent = 'Copy', 900);
        }catch{
          // fallback
          const ta = document.createElement('textarea');
          ta.value = pwd; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
          copy.textContent = t('copied');
          setTimeout(()=> copy.textContent = 'Copy', 900);
        }
      });

      row.appendChild(span);
      row.appendChild(toggle);
      row.appendChild(copy);
      $('#list').appendChild(row);
    });
  }

  function updateSummary(){
    const L = clamp(parseInt($('#length').value||'16',10),4,128);
    const alpha = buildSets().length;
    const bits = estimateBits(alpha, L);
    const tpl = t('summary_tpl');
    $('#summary').textContent = tpl
      .replace('{n}', alpha)
      .replace('{b}', bits)
      .replace('{L}', L);
    $('#lengthHelp').innerHTML = `${L} · ~${bits} ${t('bits')}`;
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  // length slider sync
  const $len = $('#length');
  const $rng = $('#length-range');
  function syncLen(fromInput){
    const v = clamp(parseInt(fromInput.value||'16',10),4,128);
    $len.value = v; $rng.value = v;
    updateSummary();
  }
  $len.addEventListener('input', ()=> syncLen($len));
  $rng.addEventListener('input', ()=> syncLen($rng));
  syncLen($len);

  // react to toggles/sets to update summary
  ['chk-l','chk-u','chk-d','chk-s','avoid-amb','avoid-sim','set-l','set-u','set-d','set-s','exclude','ensure-group','no-repeat']
    .forEach(id => document.getElementById(id).addEventListener('input', updateSummary));

  // Generate
  $('#btn-gen').addEventListener('click', ()=>{
    const L = clamp(parseInt($('#length').value||'16',10),4,128);
    const count = clamp(parseInt($('#count').value||'3',10),1,20);
    const alpha = buildSets().length;
    if(alpha === 0){
      alert(t('empty_charset'));
      return;
    }
    const pwds = [];
    for(let i=0;i<count;i++){
      pwds.push(genOnce(L, {}));
    }
    renderPasswords(pwds);
    updateSummary();
  });

  // Copy all
  $('#btn-copy-all').addEventListener('click', async ()=>{
    const all = $$('#list .value').map(n=>n.textContent).join('\n');
    if(!all.trim()) return;
    try{
      await navigator.clipboard.writeText(all);
      $('#btn-copy-all').textContent = t('copied_n');
      setTimeout(()=> $('#btn-copy-all').textContent = t('copy_all'), 900);
    }catch(e){
      alert(t('copied_n'));
    }
  });

  // Download
  $('#btn-download').addEventListener('click', ()=>{
    const content = $$('#list .value').map(n=>n.textContent).join('\n');
    if(!content.trim()) return;
    const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g,'-');
    a.href = url; a.download = `passwords-${ts}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Init
  applyTranslations();
  // Generate initial suggestion
  $('#btn-gen').click();