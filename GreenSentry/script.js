// Тема
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const saved = localStorage.getItem('gs-theme');
if(saved) root.setAttribute('data-theme', saved);
if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    const now = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', now);
    localStorage.setItem('gs-theme', now);
  });
}

// Бургер-меню
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
if(burger && menu){
  burger.addEventListener('click', ()=>{
    const open = menu.style.display === 'flex';
    menu.style.display = open ? 'none' : 'flex';
  });
}

// Год в футере
document.getElementById('year').textContent = new Date().getFullYear();

// Форма контактов: демо-обработчик (без сервера)
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
if(contactForm){
  contactForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(contactForm).entries());
    // Имитация отправки
    setTimeout(()=>{
      formNote.textContent = 'Спасибо! Мы свяжемся с вами в течение 1 рабочего дня.';
      contactForm.reset();
    }, 500);
  });
}

// Модалка инвайта
const inviteEmail = document.getElementById('inviteEmail');
const inviteNote = document.getElementById('inviteNote');
const inviteSubmit = document.getElementById('inviteSubmit');
if(inviteSubmit){
  inviteSubmit.addEventListener('click', (e)=>{
    e.preventDefault();
    const email = inviteEmail.value.trim();
    if(!email || !/^\S+@\S+\.\S+$/.test(email)){
      inviteNote.textContent = 'Введите корректный email.';
      return;
    }
    inviteNote.textContent = 'Готово! Добавили в список ожидания.';
    inviteEmail.value = '';
  });
}
