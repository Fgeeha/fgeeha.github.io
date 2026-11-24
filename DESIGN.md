# Design: fgeeha.github.io

Зафиксированная система оформления. Страницы портфолио делят её и отличаются только композицией. Менять осознанно: этот файл и есть правило.

Охват: `/`, `/projects/`, `/projects/cat-is-not-helper/`, `/projects/max-action/`, `/study/`. Учебники в `study/*.html`, `cv`, `research`, `social` и мини-проекты живут на собственных стилях.

## System
- Тёмная терминальная тема: один моноширинный шрифт, один зелёный акцент.
- Главная открывается фотографией и именем, дальше идут списки строками: навыки, проекты, мини-проекты.

## Tokens
`CSS/tokens.css` — источник истины. Роли:
```css
:root {
  --color-paper: oklch(12.5% 0.012 150);  --color-paper-2: oklch(16% 0.016 150);  --color-paper-3: oklch(20.5% 0.022 150);
  --color-ink: oklch(94% 0.03 140);  --color-ink-2: oklch(82% 0.05 142);  --color-muted: oklch(64% 0.06 145);
  --color-rule: oklch(27% 0.028 148);  --color-rule-2: oklch(38% 0.045 146);
  --color-accent: oklch(87% 0.2 142);  --color-accent-ink: oklch(14% 0.02 150);  --color-focus: oklch(87% 0.2 142);
  --color-accent-wash: oklch(23% 0.06 145);
  --font-display: "Martian Mono", ui-monospace, monospace;  --font-body: var(--font-display);
  --radius-card: 0;  --radius-pill: 0;  --rule-hair: 1px;  --shadow-card: none;
}
```
Шкала отступов, кегли, кривые и длительности лежат в `CSS/tokens.css`. Любой цвет и шрифт на странице идёт через токен.

## Type
- Один шрифт, Martian Mono, веса 400, 500, 700. Заголовки шире (`--stretch-display`), текст уже (`--stretch-body`).
- `h1` до 3.75rem, `h2` на `--text-section`, названия строк на `--text-title`.
- Подписи и теги: тот же шрифт на шаг меньше, без капса и разрядки.

## Controls
- Primary: заливка акцентом, текст `--color-accent-ink`, прямые углы, 48px. Одна на страницу.
- Secondary: рамка 1px `--color-ink-2`, те же углы и высота.
- Служебные кнопки (язык в шапке, «Копировать» у блока кода): тот же вид, 44px.
- Ссылки: `--color-ink-2`, пунктирное подчёркивание, акцент при наведении.
- Раскрывающиеся блоки и меню: нативный `<details>`.

## Surfaces
- Один тон в трёх ступенях светлоты; разделение волосными линиями `--color-rule`, без теней и скруглений.
- Фотография одна: берег с маяком в duotone (`[data-slot]` в `CSS/base.css`). Скриншоты продуктов стоят как есть, в рамке 1px.

## Motion
- Character: still. Состояния переключаются ступенчато (`steps(1)`), анимаций появления нет.

## Exports
`CSS/tokens.css` в этом репозитории.
