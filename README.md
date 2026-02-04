# **Референсная ветка для старта разработки плагинов визуализации ModusBI**

---

## **📌 Возможности**
- Интеграция с ModusBI через стандартный API плагинов.

---

## **🛠 Технологии**
- [React](https://github.com/facebook/react) ^16.13.1
- [Redux](https://github.com/reduxjs/redux)
- [Webpack](https://github.com/webpack/webpack)
- [ECharts](https://echarts.apache.org/)

---

## **⚙️ Зависимости**
- **Node.js** 14.21.3 (рекомендуется)
- **npm** 6.14.18 или выше

---

## **📚 Документация**
- [Общее описание плагинов ModusBI](https://kb.modusbi.ru/web/docs_product/content-view)
- [Руководство по Plugins API](https://kb.modusbi.ru/web/docs_product/content-view/-/kb_asset_publisher/contentView/content/id/599400)

---

## **🚀 Быстрый старт**

### **1. Установка**
1. Склонируйте репозиторий:
   ```bash
   git clone [URL репозитория]
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```

### **2. Настройка окружения**
- Скачайте **ядро ModusBI** (инструкция [здесь](https://kb.modusbi.ru/web/docs_product/content-view/-/kb_asset_publisher/contentView/content/id/599400)).
- Поместите содержимое архива в папку `prebuild` в корне проекта.

### **3. Запуск разработки**
```bash
npm run start:dev
```  
Сервер запустится на порту `7000` (настройки в `/config/index.js`).

### **4. Сборка**
- **Производственная сборка**:
  ```bash
  npm run build:prod
  ```  
  > Для Unix-систем используйте `npm run build:prod:unix`.

- **Создание дистрибутива**:
    1. Добавьте файл `manifest.json` в папку `/build` (шаблон — `./manifest.example.json`).
    2. Запустите сборку:
       ```bash
       npm run build:plugin
       ```  
  Готовый дистрибутив можно загружать на портал ModusBI.

---

## **❓ FAQ**
**Q: Как изменить порт разработки?**  
A: Отредактируйте `server_port` в `/config/index.js`.

**Q: Нет доступа к ядру портала?**  
A: Обратитесь к администратору портала.

---

## **📌 Контакты**
- [Официальный сайт](https://modusbi.ru/)
- [RUTUBE](https://rutube.ru/channel/43575679)
- [Telegram-канал](https://t.me/bi_pro)

---

### **🔹 Лицензия**
[LICENSE](./LICENSE.docx)

