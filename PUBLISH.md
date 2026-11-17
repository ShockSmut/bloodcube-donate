# BloodCube — донат-магазин (GitHub Pages)

Опубликованная версия сайта: **https://shocksmut.github.io/bloodcube-donate/**

Папка `bloodcube-donate` — это ровно та версия, что лежит в репозитории
https://github.com/ShockSmut/bloodcube-donate (ветка `main`, корень = корень сайта).

## Как обновить сайт

Git в системе не установлен, поэтому загрузка идёт через GitHub API (`gh`).
Любой изменённый файл заливается так:

```powershell
$env:NO_PROXY = "github.com,api.github.com"
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\путь\index.html"))
@{ message = "Update index.html"; content = $b64 } | ConvertTo-Json -Compress |
  Set-Content "$env:TEMP\body.json" -Encoding ASCII
gh api -X PUT "repos/ShockSmut/bloodcube-donate/contents/index.html" --input "$env:TEMP\body.json"
```

GitHub Pages пересобирается сам за ~30–60 секунд. Проверка статуса сборки:

```powershell
gh api repos/ShockSmut/bloodcube-donate/pages/builds/latest
```

Файлы в подпапках указываются путями `css/style.css`, `js/main.js`.

## Структура

| Файл | Назначение |
|------|------------|
| `index.html` | Сама страница (секции `#donates`, `#about`, `#rules`, `#contacts`) |
| `css/style.css` | Стили |
| `js/main.js` | Скрипты: скролл, модалка покупки, сезонные вкладки Frost |
| `robots.txt` | Разрешает индексацию поисковиками |
| `.gitattributes` | Переводы строк LF (важно для одинакового вида на Linux/CDN) |

## Что важно про «глобальность» (замечания на будущее)

1. **Домен.** Сейчас бесплатный адрес `shocksmut.github.io/bloodcube-donate/`.
   Свой домен подключается так: Settings → Pages → Custom domain + CNAME у регистратора
   на `shocksmut.github.io`. Затем заменить `<link rel="canonical">` в `index.html`.
2. **Поисковики.** Чтобы сайт появился в Google/Яндекс:
   - Google: [Search Console](https://search.google.com/search-console) → добавить
     `https://shocksmut.github.io/bloodcube-donate/` → подтвердить через HTML-тег
     (или файл) в репозитории → «Проверить URL» → «Запросить индексирование».
   - Яндекс: [Вебмастер](https://webmaster.yandex.ru) → аналогично.
   - Дополнительно, если нужна карта сайта: добавить `sitemap.xml` с одним URL.
3. **Соцсети.** Open Graph-теги уже добавлены (заголовок и описание для Telegram/Discord/VK).
   Для превью-картинки нужен файл `og.jpg` (~1200×630) и тег
   `<meta property="og:image" content="https://shocksmut.github.io/bloodcube-donate/og.jpg" />`.
4. **Самое главное: сайт пока только витрина.** Кнопки «Купить» открывают модалку и
   после ввода ника показывают уведомление (`js/main.js`, обработчик `buyForm` submit).
   Реальной оплаты нет. Для приёма денег нужно выбрать платёжный сервис
   (YooKassa, ЮMoney, Robokassa, FreeKassa и т.п.) и подключить к нему DonateBridge;
   тема оплаты в публичной части обсуждалась отдельно — там нужен серверный обработчик
   и секретный токен, который нельзя держать в `main.js` (весь JS на GitHub Pages
   виден всем).
5. **Сроки хостинга.** GitHub Pages для публичного репозитория бесплатен без ограничения
   времени; для приватного требует платный план (Pro/Team).

## Файлы-исходники

Этот репозиторий — копия папки `C:\Users\Admin\Documents\Проект по умолчанию\bloodcube-donate`.
Правки удобнее делать именно здесь, а потом заливать.

Плагин выдачи донатов (`DonateBridge`) остаётся у вас локально и на сайт не попал —
это отдельный серверный компонент, публиковать его не нужно.
