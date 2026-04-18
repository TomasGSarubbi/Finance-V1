# Setup - Cueva Financiera

## Requisitos
- Node.js 18+
- PostgreSQL 14+

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos
Editar `.env` con tu conexión PostgreSQL:
```
DATABASE_URL="postgresql://usuario:password@localhost:5432/cueva_financiera"
JWT_SECRET="cambia-esto-en-produccion"
```

### 3. Crear base de datos y correr migraciones
```bash
# Crear la base de datos en PostgreSQL primero:
createdb cueva_financiera

# Correr migraciones
npx prisma migrate dev --name init

# O si preferís hacer push directo (sin historial de migraciones):
npx prisma db push
```

### 4. Cargar datos iniciales (seed)
```bash
npm run db:seed
```

Esto crea:
- **Admin**: usuario=`admin`, password=`admin123`
- **Operador**: usuario=`operador`, password=`oper123`
- Cotizaciones base para USD, USDT, EUR
- Saldos iniciales de caja
- 5 operaciones de ejemplo

### 5. Levantar el servidor
```bash
npm run dev
```

Acceder en: http://localhost:3000

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run db:seed` | Cargar datos de ejemplo |
| `npm run db:studio` | Abrir Prisma Studio (UI para DB) |

## Deploy en Vercel

1. Pushear a GitHub
2. Conectar repo en Vercel
3. Agregar variable de entorno `DATABASE_URL` (PostgreSQL en producción)
4. Agregar `JWT_SECRET` con un valor seguro
5. Deploy automático
