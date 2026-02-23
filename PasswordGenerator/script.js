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
      hide: "Hide",
      // Modes + mnemonic
      mode_random: "Classic (alphabet)",
      mode_mnemonic: "Mnemonic (ViPNet-style)",
      mn_title: "Mnemonic generator",
      mn_words: "Number of words",
      mn_words_hint: "4–5 words recommended.",
      mn_digits: "Random digits",
      mn_digits_hint: "Appended at the end.",
      mn_sep: "Letters separator",
      mn_none: "None", mn_dash: "Dash", mn_underscore: "Underscore", mn_dot: "Dot",
      mn_case: "Casing",
      mn_case_as_is: "As is", mn_case_upper: "UPPER", mn_case_lower: "lower", mn_case_title: "Title case", mn_case_alt: "Alternate",
      mn_translit: "Transliterate to Latin",
      mn_ensure_classes: "Keep class rules",
      mn_preview: "Preview phrase",
      phrase_label: "Phrase:"
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
      entropy_box: "Двигайте мышь, крутите колесо, нажимайте клавиши",
      entropy_note: "Используется CSPRNG (crypto.getRandomValues); ваши действия добавляют дополнительную энтропию.",
      generated_password_title: "Сгенерированные пароли",
      bits: "бит",
      copied: "Скопировано!",
      copied_n: "Пароли скопированы",
      empty_charset: "Выберите хотя бы одну группу символов или задайте свои.",
      summary_tpl: "Алфавит: {n} симв. • ~{b} бит на пароль длиной {L}",
      show: "Показать",
      hide: "Скрыть",
      // Modes + mnemonic
      mode_random: "Обычный (алфавит)",
      mode_mnemonic: "Фразовый (ViPNet-style)",
      mn_title: "Фразовый генератор",
      mn_words: "Количество слов",
      mn_words_hint: "Рекомендуется 4–5 слов.",
      mn_digits: "Случайных цифр",
      mn_digits_hint: "Добавляются в конец пароля.",
      mn_sep: "Разделитель букв",
      mn_none: "Нет", mn_dash: "Тире", mn_underscore: "Нижнее подчёркивание", mn_dot: "Точка",
      mn_case: "Регистр",
      mn_case_as_is: "Как в словах", mn_case_upper: "ВЕРХНИЙ", mn_case_lower: "нижний", mn_case_title: "Первая заглавная", mn_case_alt: "Чередовать",
      mn_translit: "Транслитерировать в латиницу",
      mn_ensure_classes: "Сохранить правила групп",
      mn_preview: "Показать фразу",
      phrase_label: "Фраза:"
    }
  };
  let currentLang = (navigator.language||'ru').startsWith('ru') ? 'ru' : 'en';
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
  $('#year').textContent = new Date().getFullYear();
  $$('.lang-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentLang = btn.dataset.lang; applyTranslations(); });
  });

  // ===== Entropy pool (user events) =====
  let userEntropy = 0 >>> 0;       // 32-bit pool
  let userEntropyBits = 0;         // approximate bits collected
  const ENTROPY_MAX_BITS = 128;    // cap UI at 128
  const bar = $('#entropy-bar');
  const helpEnt = $('#entropy-help');

  function mix32(x){ // xorshift32
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return x >>> 0;
  }
  function absorb(v){
    const now = Math.floor(performance.now() * 1000) >>> 0;
    userEntropy = mix32(userEntropy ^ ((v>>>0) ^ now));
    userEntropyBits = Math.min(ENTROPY_MAX_BITS, userEntropyBits + 1);
    const pct = Math.round(userEntropyBits / ENTROPY_MAX_BITS * 100);
    bar.style.width = pct + '%';
    helpEnt.innerHTML = `${userEntropyBits} ${t('bits')}`;
  }
  window.addEventListener('mousemove', e => absorb((e.clientX<<16) ^ e.clientY));
  window.addEventListener('wheel', e => absorb((Math.abs(e.deltaY) + 7) * 2654435761));
  window.addEventListener('keydown', e => absorb((e.keyCode||0) * 1103515245));
  window.addEventListener('touchmove', e => { const t1=e.touches[0]; if(t1) absorb((t1.clientX<<16)^t1.clientY); });

  // ===== Crypto helpers =====
  function getRand32(){
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    a[0] = (a[0] ^ userEntropy) >>> 0; // mix pool (harmless, may help)
    return a[0] >>> 0;
  }
  function randIndex(max){
    if(max <= 0) throw new Error('max<=0');
    const range = 0x100000000; // 2^32
    const limit = range - (range % max);
    while(true){
      const r = getRand32();
      if(r < limit) return r % max;
    }
  }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

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

    let chars = [...new Set(sets.join('').split(''))];
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

  // ===== Classic generator =====
  function ensureAtLeastOneFromEach(groups){
    const picks = [];
    for(const g of groups){
      if(g.length>0) picks.push(g[randIndex(g.length)]);
    }
    return picks;
  }
  function genOnce(L){
    const groupsRaw = [
      $('#chk-l').checked ? $('#set-l').value.split('') : [],
      $('#chk-u').checked ? $('#set-u').value.split('') : [],
      $('#chk-d').checked ? $('#set-d').value.split('') : [],
      $('#chk-s').checked ? $('#set-s').value.split('') : [],
    ].map(arr=>{
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
      for(const ch of picks){
        if(idx < L) result[idx++] = ch;
      }
    }
    while(idx < L){
      const ch = alphabet[randIndex(alphabet.length)];
      if(noRepeat && idx>0 && result[idx-1] === ch) continue;
      result[idx++] = ch;
    }
    // Shuffle (Fisher–Yates)
    for(let i=result.length-1; i>0; i--){
      const j = randIndex(i+1);
      const tmp = result[i]; result[i] = result[j]; result[j] = tmp;
    }
    return result.join('');
  }

  function estimateBits(alpha, L){
    return Math.round(L * Math.log2(Math.max(2, alpha)));
  }

  // ===== Mnemonic (ViPNet-style) =====
  const dict = {
    ru: {
      adj: ["тихий","быстрый","надёжный","яркий","умный","сильный","нежный","смелый","честный","ловкий","тёплый","чистый","мягкий","крепкий","новый"],
      noun: ["замок","ключ","щит","дракон","мост","корабль","огонь","ветер","камень","код","сад","лес","компас","парус","источник"],
      verb: ["держит","защищает","ведёт","охраняет","ускоряет","запускает","находит","строит","шифрует","прячет","поддерживает"],
      adv: ["надёжно","тихо","смело","уверенно","быстро","аккуратно","чётко","безопасно","верно"]
    },
    en: {
      adj: ["silent","brave","swift","solid","bright","clever","gentle","mighty","clean","warm","steady","bold","sharp"],
      noun: ["lock","key","shield","dragon","bridge","ship","flame","wind","stone","code","garden","forest","compass","sail","source"],
      verb: ["guards","leads","protects","secures","boosts","launches","finds","builds","encrypts","hides","supports"],
      adv: ["safely","bravely","swiftly","firmly","clearly","quietly","boldly"]
    }
  };
  function pick(arr){ return arr[randIndex(arr.length)]; }
  const templates = {
    ru: [
      d=>[pick(d.adj), pick(d.noun), pick(d.verb), pick(d.adv)],
      d=>[pick(d.adj), pick(d.adj), pick(d.noun), pick(d.verb)],
    ],
    en: [
      d=>[pick(d.adj), pick(d.noun), pick(d.verb), pick(d.adv)],
      d=>[pick(d.adj), pick(d.adj), pick(d.noun), pick(d.verb)],
    ]
  };
  function makePhrase(lang, nWords){
    const d = dict[lang] || dict.en;
    const out = [];
    while(out.length < nWords){
      const tpl = pick(templates[lang] || templates.en);
      out.push(...tpl(d));
    }
    return out.slice(0, nWords).join(' ');
  }
  const ru2lat = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
  };
  function translitInitial(ch){
    const low = ch.toLowerCase();
    if(ru2lat[low] !== undefined){
      let t = ru2lat[low];
      return t ? t[0] : '';
    }
    return ch;
  }
  function applyCase(s, mode, index){
    switch(mode){
      case 'upper': return s.toUpperCase();
      case 'lower': return s.toLowerCase();
      case 'title': return s.charAt(0).toUpperCase();
      case 'alt':   return (index % 2 === 0) ? s.toUpperCase() : s.toLowerCase();
      default:      return s;
    }
  }
  function initialsFromPhrase(phrase, opts){
    const words = phrase.split(/\s+/).filter(Boolean);
    const letters = words.map((w,i)=>{
      let ch = w[0] || '';
      if(opts.translit) ch = translitInitial(ch);
      return applyCase(ch, opts.caseMode, i);
    });
    return letters.join(opts.sep);
  }
  function randomDigits(n){
    let s = '';
    for(let i=0;i<n;i++) s += String(randIndex(10));
    return s;
  }
  function ensureClassesIfNeeded(pwd){
    const wantL = $('#chk-l').checked;
    const wantU = $('#chk-u').checked;
    const wantD = $('#chk-d').checked;
    const wantS = $('#chk-s').checked;
    const need = {
      l: wantL && !/[a-z]/.test(pwd),
      u: wantU && !/[A-Z]/.test(pwd),
      d: wantD && !/[0-9]/.test(pwd),
      s: wantS && !/[!@#$%^&*()_+\[\]{}|;:,.<>?~]/.test(pwd)
    };
    let res = pwd.split('');
    const setL = $('#set-l').value.split('');
    const setU = $('#set-u').value.split('');
    const setD = $('#set-d').value.split('');
    const setS = $('#set-s').value.split('');
    function put(flag, pool){
      if(!flag || pool.length===0) return;
      const pos = randIndex(res.length);
      res[pos] = pool[randIndex(pool.length)];
    }
    put(need.l, setL); put(need.u, setU); put(need.d, setD); put(need.s, setS);
    return res.join('');
  }

  // ===== UI helpers =====
  function updateSummary(){
    const L = clamp(parseInt($('#length').value||'16',10),4,128);
    const alpha = buildSets().length;
    const bits = Math.round(L * Math.log2(Math.max(2, alpha)));
    const tpl = t('summary_tpl');
    $('#summary').textContent = tpl.replace('{n}', alpha).replace('{b}', bits).replace('{L}', L);
    $('#lengthHelp').innerHTML = `${L} · ~${bits} ${t('bits')}`;
  }
  const $len = $('#length'); const $rng = $('#length-range');
  function syncLen(fromInput){
    const v = clamp(parseInt(fromInput.value||'16',10),4,128);
    $len.value = v; $rng.value = v; updateSummary();
  }
  $len.addEventListener('input', ()=> syncLen($len));
  $rng.addEventListener('input', ()=> syncLen($rng));
  syncLen($len);
  ['chk-l','chk-u','chk-d','chk-s','avoid-amb','avoid-sim','set-l','set-u','set-d','set-s','exclude','ensure-group','no-repeat']
    .forEach(id => document.getElementById(id).addEventListener('input', updateSummary));

  function renderPasswordsWithPhrases(items){
    const $list = $('#list'); $list.innerHTML = '';
    items.forEach(({pwd, phrase})=>{
      const row = document.createElement('div'); row.className='pwd';
      const span = document.createElement('span'); span.textContent = pwd; span.className='value';

      const toggle = document.createElement('button'); toggle.className='btn'; toggle.type='button';
      const copy = document.createElement('button'); copy.className='btn'; copy.type='button'; copy.textContent='Copy';
      toggle.textContent = t('hide');
      let masked = false;
      function applyMask(){
        if(masked){ span.textContent = '•'.repeat(Math.min(64, pwd.length)) + (pwd.length>64?'…':''); toggle.textContent = t('show'); }
        else { span.textContent = pwd; toggle.textContent = t('hide'); }
      }
      toggle.addEventListener('click', ()=>{ masked = !masked; applyMask(); });
      applyMask();

      copy.addEventListener('click', async ()=>{
        try{ await navigator.clipboard.writeText(pwd); copy.textContent = t('copied'); setTimeout(()=> copy.textContent='Copy', 900); }
        catch{ alert(t('copied')); }
      });

      row.appendChild(span);
      row.appendChild(toggle);
      row.appendChild(copy);

      if(phrase){
        const tag = document.createElement('span');
        tag.className='pill';
        tag.textContent = `${t('phrase_label')} ${phrase}`;
        tag.style.gridColumn = '1 / -1';
        tag.style.marginTop = '.25rem';
        row.appendChild(tag);
      }
      $list.appendChild(row);
    });
  }

  // Mode toggle
  function setModeUI(){
    const on = $('#mode-mnemonic').checked;
    $('#mnemonic-panel').style.display = on ? '' : 'none';
  }
  $('#mode-random').addEventListener('change', setModeUI);
  $('#mode-mnemonic').addEventListener('change', setModeUI);
  setModeUI();

  // Preview phrase
  $('#btn-mn-preview').addEventListener('click', ()=>{
    const nWords = clamp(parseInt($('#mn-words').value||'4',10),3,7);
    const phrase = makePhrase(currentLang, nWords);
    $('#mn-phrase').textContent = `${t('phrase_label')} ${phrase}`;
  });

  // Generate handler (both modes)
  $('#btn-gen').addEventListener('click', ()=>{
    const L = clamp(parseInt($('#length').value||'16',10),4,128);
    const count = clamp(parseInt($('#count').value||'3',10),1,20);
    const isMnemonic = $('#mode-mnemonic').checked;

    const results = [];
    if(isMnemonic){
      const nWords = clamp(parseInt($('#mn-words').value||'4',10),3,7);
      const nDigits = clamp(parseInt($('#mn-digits').value||'2',10),0,6);
      const sep = $('#mn-sep').value;
      const caseMode = $('#mn-case').value;
      const translit = $('#mn-translit').checked || (currentLang==='ru');

      for(let i=0;i<count;i++){
        const phrase = makePhrase(currentLang, nWords);
        let base = initialsFromPhrase(phrase, {sep, caseMode, translit});
        base += randomDigits(nDigits);

        if($('#mn-ensure-classes').checked){
          base = ensureClassesIfNeeded(base);
        }
        if(base.length < L){
          const alpha = buildSets();
          while(base.length < L && alpha.length){
            base += alpha[randIndex(alpha.length)];
          }
        }else if(base.length > L){
          base = base.slice(0, L);
        }
        results.push({pwd: base, phrase});
      }
      renderPasswordsWithPhrases(results);
      updateSummary();
      return;
    }

    // Classic
    const alpha = buildSets().length;
    if(alpha === 0){ alert(t('empty_charset')); return; }
    for(let i=0;i<count;i++){
      results.push({pwd: genOnce(L)});
    }
    renderPasswordsWithPhrases(results);
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
  // initial suggestion
  $('#btn-gen').click();