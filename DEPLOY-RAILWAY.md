# Deploy on Railway

Проєкт підготовлено до деплою на **2 сервіси Railway**: Backend (API) + Frontend (React).

## Що вже зроблено в коді

- [`server.js`](./server.js) — Express-сервер, обгортає Netlify Functions
- [`railway.toml`](./railway.toml) — конфіг backend-сервісу
- [`frontend/railway.toml`](./frontend/railway.toml) — конфіг frontend-сервісу
- `npm run start` — запуск API
- `frontend/npm run start` — віддача зібраного React-додатку

---

## Крок 1: Push коду на GitHub

```bash
cd "/home/l-30-1_3550/Desktop/uchoba/Modern client-side web technologies/1 lab"
git add .
git commit -m "Add Express server and Railway deployment config"
git push origin main
```

> Без push Railway не побачить зміни.

---

## Крок 2: Створити проєкт на Railway

1. Відкрийте [railway.app](https://railway.app) і увійдіть через GitHub.
2. **New Project** → **Deploy from GitHub repo**.
3. Оберіть репозиторій `WebTechCNU/labs-1-4-assignment-cryme666`.

---

## Крок 3: Backend-сервіс (API)

Railway створить перший сервіс автоматично. Налаштуйте його:

### Settings → Source

| Поле | Значення |
|------|----------|
| **Root Directory** | *(порожньо — корінь репо)* |

### Settings → Deploy

| Поле | Значення |
|------|----------|
| **Start Command** | `node server.js` |

*(або залиште `railway.toml` — там вже прописано)*

### Settings → Variables

Додайте змінні:

| Key | Value |
|-----|-------|
| `MONGO_URI` | ваш connection string з MongoDB Atlas |
| `DB_NAME` | `task-manager` |

### Settings → Networking

1. **Generate Domain**
2. Скопіюйте URL, наприклад:
   ```
   https://labs-1-4-assignment-cryme666-production.up.railway.app
   ```

### Перевірка backend

```bash
curl https://ВАШ-BACKEND-URL.up.railway.app/health
curl https://ВАШ-BACKEND-URL.up.railway.app/projects
```

Очікувано: `{"status":"ok"}` та JSON з projects.

---

## Крок 4: Frontend-сервіс (React)

У тому ж Railway Project:

1. **+ New** → **GitHub Repo** → той самий репозиторій.
2. Railway створить **другий сервіс**.

### Settings → Source

| Поле | Значення |
|------|----------|
| **Root Directory** | `frontend` |

### Settings → Deploy

| Поле | Значення |
|------|----------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |

### Settings → Variables

| Key | Value |
|-----|-------|
| `VITE_API_URL` | URL backend з кроку 3 (без `/` в кінці) |

Приклад:
```
VITE_API_URL=https://labs-1-4-assignment-cryme666-production.up.railway.app
```

> `VITE_API_URL` підставляється під час **build**. Після зміни — **Redeploy**.

### Settings → Networking

1. **Generate Domain** для frontend.
2. Відкрийте URL у браузері.

---

## Крок 5: MongoDB Atlas

У [MongoDB Atlas](https://cloud.mongodb.com/) → **Network Access**:

- Має бути **`0.0.0.0/0`** (Allow from anywhere), інакше Railway не підключиться.

---

## Крок 6: Фінальна перевірка

- [ ] Backend `/health` → `{"status":"ok"}`
- [ ] Backend `/projects` → JSON
- [ ] Frontend відкривається
- [ ] Створення project/task працює
- [ ] `.env` **не** закомічений у git

---

## Локальна перевірка перед деплоєм

```bash
# Термінал 1 — API
npm install
npm run dev:api

# Термінал 2 — Frontend
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 → API: http://localhost:3000

---

## Troubleshooting

| Проблема | Рішення |
|----------|---------|
| `Internal server error` на API | Перевірте `MONGO_URI` / `DB_NAME` у Railway Variables |
| Frontend не бачить API | Перевірте `VITE_API_URL`, зробіть Redeploy frontend |
| `bad auth` MongoDB | Пароль без `<>` дужок; спецсимволи URL-encode |
| Build frontend падає | Root Directory має бути `frontend` |
| CORS помилка | Backend має `cors` middleware (вже в `server.js`) |

---

## Альтернатива (завдання Lab 1)

Для здачі лабораторної також підходить **Netlify (backend) + GitHub Pages (frontend)** — безкоштовно. Railway — опційний варіант, якщо хочете все в одному місці.
