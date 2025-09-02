const translations = {
    en: {
        title: "Secure Password Generator",
        password_length: "Password Length",
        password_count: "Number of Passwords",
        lowercase: "Lowercase Characters",
        uppercase: "Uppercase Characters",
        numbers: "Numbers",
        symbols: "Symbols",
        exclude_similar: "Exclude Similar Characters",
        exclude_ambiguous: "Exclude Ambiguous Characters",
        generate: "Generate Password",
        generated_password_title: "Generated Passwords",
        no_characters: "Please provide characters to generate password.",
        copied: "Copied!",
        about_project: "This project generates secure passwords based on your input and mouse movements.",
        footer_note: "Password Generator",
        scroll_entropy_title: "Scroll Influence"
    },
    ru: {
        title: "Генератор надёжных паролей",
        password_length: "Длина пароля",
        password_count: "Количество паролей",
        lowercase: "Буквы в нижнем регистре",
        uppercase: "Буквы в верхнем регистре",
        numbers: "Цифры",
        symbols: "Символы",
        exclude_similar: "Исключить похожие символы",
        exclude_ambiguous: "Исключить неоднозначные символы",
        generate: "Сгенерировать пароль",
        generated_password_title: "Сгенерированные пароли",
        no_characters: "Пожалуйста, укажите символы для генерации пароля.",
        copied: "Скопировано!",
        about_project: "Этот проект создаёт безопасные пароли на основе ваших параметров и движений мыши.",
        footer_note: "Генератор паролей",
        scroll_entropy_title: "Влияние прокрутки"
    }
};

let currentLang = 'ru';

function applyTranslations(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// Entropy collection from mouse movements
const entropyPool = new Uint32Array(1);
window.addEventListener('mousemove', (e) => {
    entropyPool[0] = (entropyPool[0] + e.clientX + e.clientY + Math.floor(performance.now())) >>> 0;
});

const scrollDisplay = document.getElementById('scroll-entropy');
let scrollEntropy = 0;
window.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaY);
    scrollEntropy += delta;
    scrollDisplay.textContent = scrollEntropy.toFixed(0);
    entropyPool[0] = (entropyPool[0] + delta + Math.floor(performance.now())) >>> 0;
});

function getRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    array[0] = (array[0] ^ entropyPool[0]) >>> 0;
    return array[0] % max;
}

function generatePassword() {
    const length = parseInt(document.getElementById('password-length').value, 10);
    let chars = '';
    ['lowercase-characters', 'uppercase-characters', 'numbers', 'symbols'].forEach(id => {
        chars += document.getElementById(id).value;
    });

    const excludeSimilar = document.getElementById('exclude-similar-characters').value;
    const excludeAmbiguous = document.getElementById('exclude-ambiguous-characters').value;
    const excludeSet = new Set((excludeSimilar + excludeAmbiguous).split(''));
    chars = chars.split('').filter(ch => !excludeSet.has(ch)).join('');

    const list = document.getElementById('generated-passwords');
    list.innerHTML = '';

    if (!chars.length) {
        const li = document.createElement('li');
        li.textContent = translations[currentLang].no_characters;
        list.appendChild(li);
        return;
    }

    const count = parseInt(document.getElementById('password-count').value, 10);
    for (let j = 0; j < count; j++) {
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars[getRandomInt(chars.length)];
        }
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'generated-password-btn';
        btn.textContent = password;
        li.appendChild(btn);
        list.appendChild(li);
    }
}

document.getElementById('generate-password').addEventListener('click', generatePassword);

document.getElementById('generated-passwords').addEventListener('click', (e) => {
    if (e.target.classList.contains('generated-password-btn')) {
        const text = e.target.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert(translations[currentLang].copied);
        });
    }
});

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        applyTranslations(currentLang);
        generatePassword();
    });
});

document.getElementById('year').textContent = new Date().getFullYear();
applyTranslations(currentLang);
generatePassword();