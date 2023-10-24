document.body.onload = function()
{
    $(".dot-1").css("animation", "dot-light 2s 0s forwards");
    $(".dot-2").css("animation", "dot-light 2s 0.75s forwards");
    $(".dot-3").css("animation", "dot-light 2s 1.5s forwards");
    $(".dot-4").css("animation", "dot-light 2s 2.25s forwards");
    setTimeout(function(){$(".item-1").css("width", "0");}, 4000);
    setTimeout(function(){$(".item-2").css("height", "0");}, 5000);
    setTimeout(function(){$(".item-3").css("height", "0");}, 5300);
    setTimeout(function(){$(".item-4").css("height", "0");}, 5500);
 
    setTimeout(function(){$(".header").css({"opacity":"1", "transform":"translate(0)"});}, 6100);
    setTimeout(function(){$(".p-1").css({"opacity":"1", "transform":"translate(0)"});}, 6300);
    setTimeout(function(){$(".p-2").css({"opacity":"1", "transform":"translate(0)"});}, 6500);
    setTimeout(function(){$(".p-3").css({"opacity":"1", "transform":"translate(0)"});}, 6700);
 
    setTimeout(function(){$(".preloader").css("visibility", "hidden");}, 7000);
}

// Объявляем переменную currentLanguage
let currentLanguage = 'ru';

// Объект с текстами на разных языках
const languages = {
    ru: {
        head_nav_home: 'Home',
        head_nav_lang: 'ru',
        head_nav_link: 'Ссылки',
        heading: 'Привет Всем 👋',
		informationAboutMe: 'Я <b>Колесников Никита</b>, специализируюсь на разработке приложений (<i>telegram bot, десктопных приложений</i>), используя <b>язык программирования Python</b>, и работе с <b>базами данных</b>. Вот некоторая информация о моих навыках и опыте:',
		skillsAndTechnologies:'Навыки и опыт',
		skillone: '&#9989;Языки программирования: <b>Python</b>',
        skilltwo: '&#9989;<i>Объектно-ориентированное программирование</i> (OOП)',
        skillthree: '&#9989;Библиотеки и фреймворки: <i>aiogram, pymysql, Django, pandas, numpy, pyqt6, tkinter, keras</i>',
        skillfour: '&#9989;Навыки работы с базами данных: <b>SQL (запросы, моделирование)</b>',
        skillfive:'&#9989;Опыт работы с <b>Linux Debian 11</b>',
        skillsix:'&#9989;Система контроля версий <b>Git</b>',
        skillseven:'&#10062;Полностью погрузитесь в <b>Docker</b>',
        contact:'Контакт',
        content: 'Я всегда <b>открыт для сотрудничества и обсуждения новых проектов.</b> Если у вас есть какие-либо вопросы или предложения, пожалуйста, не стесняйтесь обращаться ко мне:',
        thank: "Спасибо, что посетили мой веб-сайт!"
    },
    en: {
        head_nav_home: 'Home',
        head_nav_lang: 'en',
        head_nav_link: 'Link',
        heading: 'Hi there 👋',
		informationAboutMe: "I am <b>Nikita Kolesnikov</b>, I specialise in developing applications (<i>telegram bot, desktop applications</i>) using the <b>Python programming language</b>, and working with <b>databases</b>. Here's some information about my skills and experience:",
		skillsAndTechnologies:'Skills and experience',
		skillone: '&#9989;Programming Languages: <b>Python</b>',
        skilltwo: '&#9989;<i>Object-Oriented Programming (OOP)</i>',
        skillthree: '&#9989;Libraries and Frameworks: <i>aiogram, pymysql, Django, pandas, numpy, pyqt6, tkinter, keras</i>',
        skillfour: '&#9989;Database Skills: <b>SQL (queries, modeling)</b>',
        skillfive:'&#9989;Experience with <b>Linux Debian 11</b>',
        skillsix:'&#9989;Proficient in <b>Git (GitHub)</b>',
        skillseven:'&#10062;Fully dive into <b>Docker</b>',
        contact:'Contact',
        content: "I'm always <b>open to collaboration and discussion new projects.</b> If you have any questions or proposals, please feel free to reach out to me:",
        thank: "Thank you for visiting my Website!"
    }
};

// Функция для переключения языка
function switchLanguage() {
    currentLanguage = currentLanguage === 'ru' ? 'en' : 'ru';
    updateContent();
}

// Функция для обновления текста на странице
function updateContent() {
    document.getElementById('head_nav_home').innerHTML = languages[currentLanguage].head_nav_home;
    document.getElementById('head_nav_lang').innerHTML = languages[currentLanguage].head_nav_lang;
    document.getElementById('head_nav_link').innerHTML = languages[currentLanguage].head_nav_link;
    document.getElementById('heading').innerHTML = languages[currentLanguage].heading;
	document.getElementById('informationAboutMe').innerHTML  = languages[currentLanguage].informationAboutMe;
	document.getElementById('skillsAndTechnologies').innerHTML  = languages[currentLanguage].skillsAndTechnologies;
	document.getElementById('skillone').innerHTML  = languages[currentLanguage].skillone;
    document.getElementById('skilltwo').innerHTML  = languages[currentLanguage].skilltwo;
    document.getElementById('skillthree').innerHTML  = languages[currentLanguage].skillthree;
    document.getElementById('skillfour').innerHTML  = languages[currentLanguage].skillfour;
    document.getElementById('skillfive').innerHTML  = languages[currentLanguage].skillfive;
    document.getElementById('skillsix').innerHTML  = languages[currentLanguage].skillsix;
    document.getElementById('skillseven').innerHTML  = languages[currentLanguage].skillseven;
    document.getElementById('contact').innerHTML  = languages[currentLanguage].contact;
    document.getElementById('content').innerHTML = languages[currentLanguage].content;
    document.getElementById('thank').innerHTML = languages[currentLanguage].thank;
}

// Инициализация контента
updateContent();
