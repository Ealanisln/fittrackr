# ⚡ Quick Start - FitTrack

## 🎯 Objetivo

Tienes un MVP fitness tracker completo listo para desarrollar. Aquí está todo lo que necesitas para empezar.

---

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Inicia Docker

```bash
# Asegúrate de que Docker Desktop esté corriendo
docker-compose up -d

# Verifica que PostgreSQL y Redis estén corriendo
docker-compose ps
```

Deberías ver:
```
fittrack-postgres   running   0.0.0.0:5432->5432/tcp
fittrack-redis      running   0.0.0.0:6379->6379/tcp
```

### 2️⃣ Crea la Base de Datos

```bash
# Push del schema a PostgreSQL
pnpm db:push
```

Esto creará todas las tablas: `users`, `workouts`, `splits`, `integrations`, etc.

### 3️⃣ Inicia el Proyecto

```bash
# Inicia frontend + backend
pnpm dev
```

Accede a:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health check**: http://localhost:3001/health

---

## 📝 Próximos Pasos

### A. Migrar Tu Dashboard

Tu dashboard actual está en `/Users/ealanis/Downloads/workout_stats_dashboard.tsx`.

Vamos a:
1. Crear componentes en `apps/web/src/components/dashboard/`
2. Conectar con la API en lugar de datos hardcoded
3. Agregar filtros y búsqueda

### B. Importar Tus Datos

Tus datos están en `/Users/ealanis/Documents/json-tracker-data.json`.

Vamos a:
1. Crear un seed script
2. Importar los 7 workouts a la DB
3. Verificar en Prisma Studio

### C. Implementar Upload de Screenshots

Crear:
1. Componente de upload en el frontend
2. Endpoint `/api/upload` en el backend
3. Job worker para procesamiento OCR
4. Integración con OpenAI para parsear

---

## 🗂️ Estructura del Proyecto

```
fittrack/
├── apps/
│   ├── web/              → Frontend (React + Vite + TailwindCSS)
│   │   ├── src/
│   │   │   ├── components/   ← Aquí irá tu dashboard migrado
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/              → Backend (Express + TypeScript)
│       ├── src/
│       │   ├── routes/       ← API endpoints
│       │   ├── services/     ← Lógica de negocio
│       │   ├── jobs/         ← Workers de BullMQ
│       │   └── index.ts      ✅ Ya configurado
│       └── package.json
│
├── packages/
│   ├── database/         → Prisma ORM
│   │   ├── prisma/
│   │   │   └── schema.prisma ✅ Schema completo
│   │   └── src/index.ts      ✅ Cliente exportado
│   │
│   └── types/            → Tipos compartidos
│       └── src/index.ts      ✅ Zod schemas listos
│
├── docker-compose.yml    ✅ PostgreSQL + Redis
├── .env                  ✅ Variables configuradas
└── README.md             ✅ Documentación completa
```

---

## 🔧 Comandos Disponibles

```bash
# Desarrollo
pnpm dev                  # Frontend + Backend juntos
pnpm dev:web              # Solo frontend (puerto 5173)
pnpm dev:api              # Solo backend (puerto 3001)

# Base de Datos
pnpm db:push              # Push schema a DB (desarrollo)
pnpm db:migrate           # Crear migración (producción)
pnpm db:studio            # Abrir Prisma Studio (GUI)
pnpm db:seed              # Importar datos de prueba

# Docker
pnpm docker:up            # Iniciar PostgreSQL + Redis
pnpm docker:down          # Detener servicios

# Build
pnpm build                # Build para producción
pnpm typecheck            # Verificar tipos TypeScript
```

---

## 🎨 Stack Tecnológico

### Frontend
- **Vite** - Build tool ultra-rápido
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling (como en tu dashboard)
- **React Query** - State management & caching
- **React Router** - Navegación
- **Recharts** - Gráficas (las que ya usas)
- **Lucide Icons** - Iconos modernos

### Backend
- **Express** - Web framework
- **TypeScript** - Type safety
- **Better Auth** - Autenticación moderna
- **Prisma** - ORM type-safe
- **BullMQ** - Job queues (para OCR)
- **Tesseract.js** - OCR
- **OpenAI** - Parseo inteligente

### Infraestructura
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache + job queues
- **Docker** - Containerización
- **pnpm** - Package manager

---

## 💡 Tips

### Ver los Logs

```bash
# Logs del backend
pnpm dev:api

# Logs de Docker
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Resetear la Base de Datos

```bash
# Detener Docker
docker-compose down -v

# Reiniciar
docker-compose up -d
pnpm db:push
```

### Abrir Prisma Studio

```bash
pnpm db:studio
```

Esto abre una GUI en http://localhost:5555 donde puedes ver y editar todos tus datos.

---

## 🐛 Troubleshooting

### Docker no inicia

```bash
# macOS/Windows
# Abre Docker Desktop manualmente

# Linux
sudo systemctl start docker
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto 5173
lsof -i :5173

# Matar el proceso
kill -9 <PID>
```

### Prisma no genera el cliente

```bash
cd packages/database
pnpm db:generate
```

---

## 📚 Documentación

- `README.md` - Documentación general
- `SETUP.md` - Guía de setup detallada
- `PROJECT_SUMMARY.md` - Resumen completo del proyecto
- `QUICKSTART.md` - Esta guía rápida

---

## 🎯 Objetivo de Hoy

1. ✅ Proyecto creado
2. ⏳ Iniciar Docker
3. ⏳ Crear base de datos
4. ⏳ Ver que todo funciona

**Siguiente sesión**:
- Migrar tu dashboard
- Importar tus datos
- Implementar OCR

---

¿Listo? Ejecuta:

```bash
# 1. Inicia Docker
docker-compose up -d

# 2. Crea la DB
pnpm db:push

# 3. Inicia todo
pnpm dev
```

🚀 ¡Vamos!
