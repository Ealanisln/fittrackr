# 🚀 Setup Guide - FitTrack

## ✅ Completado

1. ✅ Estructura de monorepo creada
2. ✅ Frontend configurado (Vite + React + TypeScript + TailwindCSS)
3. ✅ Backend configurado (Express + TypeScript)
4. ✅ Prisma schema creado
5. ✅ Docker Compose configurado
6. ✅ Dependencias instaladas

## 🔄 Pasos Siguientes

### 1. Iniciar Docker (PostgreSQL + Redis)

```bash
# Asegúrate de que Docker Desktop esté corriendo
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps
```

### 2. Configurar Base de Datos

```bash
# Push del schema a PostgreSQL
pnpm db:push

# O crear una migración
pnpm db:migrate

# Abrir Prisma Studio (opcional)
pnpm db:studio
```

### 3. Configurar Variables de Entorno

Edita `.env` y `apps/api/.env` con tus valores:

```env
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="$(openssl rand -base64 32)"  # Genera un secreto
```

### 4. Iniciar Servidores de Desarrollo

```bash
# Iniciar todo (frontend + backend)
pnpm dev

# O iniciar individualmente
pnpm dev:web   # Frontend en http://localhost:5173
pnpm dev:api   # Backend en http://localhost:3001
```

## 📝 Siguiente: Migrar Dashboard

Una vez que todo esté corriendo, vamos a:

1. Migrar el dashboard existente (`workout_stats_dashboard.tsx`)
2. Crear componentes React reutilizables
3. Conectar con la API
4. Implementar el servicio OCR

## 🔍 Verificar Instalación

```bash
# Verificar que Prisma funciona
pnpm --filter @fittrack/database db:generate

# Verificar que el backend compila
pnpm --filter @fittrack/api typecheck

# Verificar que el frontend compila
pnpm --filter @fittrack/web build
```

## 🐛 Troubleshooting

### Docker no inicia
```bash
# En macOS/Windows: Abre Docker Desktop
# En Linux:
sudo systemctl start docker
```

### Prisma Client no genera
```bash
cd packages/database
pnpm db:generate
```

### Puerto 5173 o 3001 ya en uso
```bash
# Cambiar puertos en:
# - Frontend: apps/web/vite.config.ts
# - Backend: apps/api/.env (PORT=3001)
```

## 📦 Estructura Actual

```
fittrack/
├── apps/
│   ├── web/                    ✅ Frontend configurado
│   │   ├── src/
│   │   ├── tailwind.config.js  ✅ Tailwind configurado
│   │   └── package.json        ✅ Deps instaladas
│   │
│   └── api/                    ✅ Backend configurado
│       ├── src/
│       │   ├── index.ts        ✅ Express server
│       │   ├── routes/         📁 Vacío (siguiente paso)
│       │   ├── services/       📁 Vacío (siguiente paso)
│       │   └── jobs/           📁 Vacío (siguiente paso)
│       └── package.json        ✅ Deps instaladas
│
├── packages/
│   ├── database/               ✅ Prisma configurado
│   │   ├── prisma/schema.prisma ✅ Schema completo
│   │   └── src/index.ts        ✅ Cliente exportado
│   │
│   └── types/                  ✅ Tipos compartidos
│       └── src/index.ts        ✅ Zod schemas
│
├── docker-compose.yml          ✅ PostgreSQL + Redis
├── .env.example                ✅ Template creado
└── README.md                   ✅ Documentación
```

## 🎯 Próximos Pasos (en orden)

1. **Iniciar Docker** y verificar que PostgreSQL esté corriendo
2. **Push del schema** a la base de datos
3. **Migrar el dashboard** existente al proyecto
4. **Implementar API endpoints** para workouts
5. **Implementar servicio OCR** con Tesseract.js + OpenAI
6. **Configurar Better Auth** para autenticación
7. **Crear interfaz de upload** para screenshots

¿Listo para continuar? 🚀
