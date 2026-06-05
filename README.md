# Olimpiadas Deportivas 🏅

Sistema de gestión de olimpiadas deportivas y competencias entre instituciones.

## 🚀 Características

- ✅ Sistema de autenticación con usuario/contraseña
- ✅ Gestión de disciplinas deportivas
- ✅ Gestión de series de competencia
- ✅ Gestión de equipos participantes con relaciones entre tablas
- ⏳ Gestión de fechas y jornadas
- ⏳ Programación de partidos/encuentros
- ⏳ Registro de resultados
- ⏳ Generación de tablas de posiciones

## 📋 Requisitos Previos

- Node.js 18+
- npm o pnpm
- MySQL 8.0+
- Base de datos: `campeonato_bd` en `209.74.89.191:3306`

## 🔧 Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   # o
   pnpm install
   ```

3. Configurar variables de entorno en `.env.local`:
   ```env
   DB_HOST=209.74.89.191
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD="#21592159xD"
   DB_NAME=campeonato_bd
   ```

4. Inicializar base de datos:
   - Acceder a: `http://localhost:3000/api/init-db` (POST)

## 🎮 Uso

### Inicio rápido
```bash
npm run dev
```
Acceder a: `http://localhost:3000/login`

### Credenciales de prueba
- Usuario: `admin`
- Contraseña: `admin123`

## 📊 Módulos Principales

### 1. **Disciplinas** 🏅
- Crear nuevas disciplinas (Fútbol, Basquetbol, Voleibol, etc.)
- Listar disciplinas activas
- Endpoint: `GET/POST /api/disciplinas`
- Tabla: `TblDisciplina`

### 2. **Series** 📊
- Crear series independientes de disciplinas
- Asociar series a torneos o categorías
- Endpoint: `GET/POST /api/series`
- Tabla: `TblSeries`

### 3. **Equipos** ⚽
- Inscribir equipos en disciplinas y series específicas
- Seleccionar disciplina y serie mediante **dropdowns funcionales**
- Validación de equipos únicos por combinación (nombre, disciplina, serie)
- Visualización con datos relacionados (disciplina_nombre, serie_nombre)
- Resumen organizado por disciplina y serie
- Endpoint: `GET/POST /api/equipos`
- Tabla: `TblEquipo` (con FK a `TblDisciplina` y `TblSeries`)

**Funcionalidades del módulo Equipos:**
- ✅ Dropdowns dinámicos que cargan datos de `/api/disciplinas` y `/api/series`
- ✅ Formulario con validaciones en cliente
- ✅ Lista de equipos con información relacionada
- ✅ Resumen agrupado por disciplina y serie
- ✅ Manejo de errores (duplicados, validaciones, etc.)
- ✅ Interfaz responsiva con componentes shadcn/ui

### 4. **Fechas** 📅
- Crear jornadas/fechas de competencia (una fecha única por jornada)
- Fechas únicas y no repetibles (UNIQUE constraint)
- Listar fechas ordenadas cronológicamente
- Editar y eliminar fechas
- Endpoint: `GET/POST/PUT/DELETE /api/fechas`
- Tabla: `TblFecha`

**Funcionalidades del módulo Fechas:**
- ✅ Formulario para crear nuevas fechas
- ✅ Campo de fecha única (no rango)
- ✅ Validación: nombre y fecha únicos
- ✅ Tarjetas de visualización de fechas
- ✅ Botones para editar y eliminar
- ✅ Modal de confirmación para eliminación
- ✅ Fecha mostrada en formato legible (ej: "1 may 2026")

### 5. **Partidos** 🎯
- Programar encuentros entre equipos
- Registrar resultados
- Gestionar datos estadísticos
- **🍫 NUEVO: Generador de Partidos "Chocolate"**
  - Mezcla automáticamente equipos por serie
  - Genera partidos balanceados
  - Agrupa por disciplina y fecha
- Endpoint: `GET/POST /api/partidos`, `POST /api/generar-partidos`
- Tabla: `TblPartido` (en contexto)

### 6. **Estadios** 🏟️ (En desarrollo)
- Registrar lugares de competencia
- Capacidades y servicios

## 🗄️ Estructura de Base de Datos

### Tablas Principales

```
usuarios
├── id (PK)
├── usuario (UNIQUE)
├── contraseña
├── email
├── nombre_completo
├── rol
└── timestamps

TblDisciplina
├── id (PK)
├── nombre (UNIQUE)
├── activa (BOOLEAN)
├── fecha_creacion (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)

TblSeries
├── id (PK)
├── nombre (UNIQUE)
├── activa (BOOLEAN)
├── fecha_creacion (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)

TblEquipo
├── id (PK)
├── nombre (VARCHAR)
├── activa (BOOLEAN)
├── fecha_creacion (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)

TblEquipoDisciplina
├── id (PK)
├── equipo_id (FK → TblEquipo)
├── disciplina_id (FK → TblDisciplina)
├── serie_id (FK → TblSeries)
├── fecha_creacion (TIMESTAMP)
├── UNIQUE KEY (equipo_id, disciplina_id, serie_id)
└── ON DELETE CASCADE

TblFecha
├── id (PK)
├── nombre (VARCHAR UNIQUE)
├── fecha (DATE UNIQUE)
├── activa (BOOLEAN)
├── fecha_creacion (TIMESTAMP)
└── fecha_actualizacion (TIMESTAMP)
```

### Stored Procedures

- `sp_InsertarDisciplina(p_nombre, @p_id, @p_mensaje)` - Crear disciplina
- `sp_ObtenerDisciplinas()` - Listar disciplinas activas
- `sp_InsertarSerie(p_nombre, @p_id, @p_mensaje)` - Crear serie
- `sp_ObtenerSeries()` - Listar series activas
- `sp_InsertarEquipo(p_nombre, @p_id, @p_mensaje)` - Crear equipo
- `sp_InsertarEquipoDisciplina(p_equipo_id, p_disciplina_id, p_serie_id, @p_id, @p_mensaje)` - Asignar equipo a disciplina
- `sp_ObtenerEquipos()` - Listar equipos con todas sus participaciones
- `sp_InsertarFecha(p_nombre, p_fecha, @p_id, @p_mensaje)` - Crear fecha
- `sp_ObtenerFechas()` - Listar fechas activas ordenadas por fecha

## 🔐 Autenticación

- Sistema token-based con JWT
- Almacenamiento: localStorage (cliente) + cookies (servidor)
- Middleware protege rutas privadas
- Redirección automática a login si no hay autenticación
- Rutas públicas: `/login`, `/api/auth/login`, `/api/init-db`, `/api/verify-db`, `/api/disciplinas`, `/api/series`, `/api/equipos`

## 📁 Estructura del Proyecto

```
app/
├── api/
│   ├── auth/login/
│   │   └── route.ts             # Endpoint de autenticación
│   ├── init-db/
│   │   └── route.ts             # Inicialización de BD
│   ├── disciplinas/
│   │   └── route.ts             # CRUD disciplinas
│   ├── series/
│   │   └── route.ts             # CRUD series
│   ├── equipos/
│   │   └── route.ts             # CRUD equipos
│   ├── fechas/
│   │   └── route.ts             # CRUD fechas
│   ├── verify-db/               # Verificación de conexión
│   ├── reset-series/            # Limpieza de datos
│   └── logo/                    # Gestión de logos
├── dashboard/
│   └── page.tsx
├── login/
│   └── page.tsx
└── layout.tsx

components/
├── auth/
│   └── login-form.tsx           # Formulario de login
├── championship/
│   ├── dashboard.tsx            # Dashboard principal
│   ├── header.tsx               # Navegación y header
│   ├── forms/
│   │   ├── disciplina-form.tsx
│   │   ├── equipo-form.tsx
│   │   ├── estadio-form.tsx
│   │   ├── fecha-form.tsx
│   │   └── partido-form.tsx
│   ├── lists/
│   │   ├── disciplina-list.tsx
│   │   ├── equipo-list.tsx
│   │   ├── estadio-list.tsx
│   │   ├── fecha-list.tsx
│   │   ├── partido-list.tsx
│   │   └── eliminatoria-list.tsx
│   ├── modals/
│   │   ├── calendar-modal.tsx
│   │   └── resultado-modal.tsx
│   └── sections/
│       ├── disciplinas-section.tsx
│       ├── equipos-section.tsx      # ✨ Módulo con multi-disciplinas
│       ├── estadios-section.tsx
│       ├── fechas-section.tsx        # ✨ Módulo de fechas
│       ├── partidos-section.tsx
│       ├── series-section.tsx
│       └── eliminatorias-section.tsx
└── ui/                          # Componentes shadcn/ui

lib/
├── db.ts                        # Configuración de MySQL
├── championship-context.tsx     # Context API para estado global
└── utils.ts                     # Utilidades

middleware.ts                   # Protección de rutas
```

## 🛠️ Comandos Disponibles

```bash
npm run dev         # Inicia servidor de desarrollo (puerto 3000)
npm run build       # Crea build de producción
npm start          # Inicia servidor de producción
npm run lint       # Ejecuta linter
```

## 📝 Ejemplos de Uso de la API

### Crear Disciplina
```bash
curl -X POST http://localhost:3000/api/disciplinas \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Futbol"}'
```

### Listar Disciplinas
```bash
curl http://localhost:3000/api/disciplinas
```

### Crear Equipo
```bash
curl -X POST http://localhost:3000/api/equipos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Atletico Campeones",
    "disciplinas": [
      {"disciplina_id": 1, "serie_id": 1},
      {"disciplina_id": 2, "serie_id": 2}
    ]
  }'
```

### Crear Fecha
```bash
curl -X POST http://localhost:3000/api/fechas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Fecha 1",
    "fecha": "2026-05-01"
  }'
```

### Editar Fecha
```bash
curl -X PUT http://localhost:3000/api/fechas \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "nombre": "Fecha 1 - Actualizada",
    "fecha": "2026-05-02"
  }'
```

### Eliminar Fecha
```bash
curl -X DELETE http://localhost:3000/api/fechas?id=1
```

### Listar Equipos (con datos relacionados)
```bash
curl http://localhost:3000/api/equipos
```

### Generar Partidos (Chocolate)
```bash
curl -X POST http://localhost:3000/api/generar-partidos \
  -H "Content-Type: application/json" \
  -d '{
    "fechaId": "1",
    "disciplinaId": "1"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "partidos": [
      {
        "equipo1_id": 1,
        "equipo1_nombre": "Team A",
        "equipo2_id": 2,
        "equipo2_nombre": "Team B",
        "serie_id": 1,
        "serie_nombre": "SERIE A",
        "fecha_id": "1"
      }
    ],
    "total": 12
  }
}
```

**Respuesta ejemplo:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Deportivo Unidos",
      "disciplina_id": 1,
      "serie_id": 1,
      "disciplina_nombre": "Futbol",
      "serie_nombre": "SERIE A"
    }
  ]
}
```

## ✅ Verificación de la Implementación

### Tests API Realizados

**GET /api/equipos** ✅
- Retorna lista de equipos con datos relacionados
- JOINs correctos a TblDisciplina y TblSeries
- Datos de prueba visibles

**POST /api/equipos** ✅
- Crea equipos correctamente
- Valida campos requeridos
- Retorna ID de creación exitosa
- Evita duplicados por UNIQUE constraint

**EquiposSection Component** ✅
- Dropdowns cargando datos dinámicamente
- Formulario con validaciones
- Lista de equipos con display correcto
- Resumen agrupado por disciplina

**Database Schema** ✅
- TblEquipo creada correctamente
- Foreign keys activas
- Índices creados
- Stored procedures funcionando

## 📝 Notas Importantes

- Las contraseñas se almacenan sin encriptar en desarrollo (CAMBIAR EN PRODUCCIÓN)
- Los tokens expiran después de una sesión
- Las disciplinas y series son únicas globalmente
- Los equipos son únicos por combinación (nombre, disciplina, serie)
- Los dropdowns se cargan dinámicamente desde las respectivas APIs
- Las relaciones entre tablas se mantienen mediante INNER JOINs en los SPs
- La tabla TblEquipo tiene DELETE CASCADE en ambos foreign keys

## 🚦 Estado del Proyecto

**✅ Completado:**
- Autenticación de usuarios (login/token)
- Gestión de Disciplinas (CRUD)
- Gestión de Series (CRUD)
- Gestión de Equipos (CRUD con relaciones multi-disciplina)
- Gestión de Fechas (CRUD con fechas únicas)
- Generador de Partidos "Chocolate" (mezcla automática por serie)
- Base de datos con relaciones FK
- Middleware de protección
- UI con componentes shadcn/ui

**⏳ En Desarrollo:**
- Gestión de Partidos (creación manual)
- Gestión de Estadios
- Tablas de posiciones
- Sistema de eliminatorias
- Resultados de encuentros

## 🔍 Archivos Clave Modificados

- `app/api/generar-partidos/route.ts` - 🆕 API para generar partidos (Chocolate)
- `components/championship/sections/partidos-section.tsx` - ✏️ UI con botón Chocolate
- `middleware.ts` - ✏️ Ruta pública `/api/generar-partidos`
- `README.md` - ✏️ Documentación actualizada

## 📞 Soporte

Para reportar bugs o sugerencias, contactar al equipo de desarrollo.
