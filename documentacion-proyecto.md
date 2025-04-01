# Documentación del Proyecto Cotizador de Eventos

## 1. Descripción General

Este proyecto es una aplicación web para cotizar eventos que permite a los usuarios crear, gestionar y analizar cotizaciones para diferentes tipos de eventos. La aplicación está construida con las siguientes tecnologías:

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **UI**: Componentes de Shadcn/UI con Tailwind CSS
- **Gráficos**: Recharts

La aplicación permite:
- Creación de cotizaciones detalladas para eventos
- Gestión de diferentes sectores y tipos de tickets
- Cálculo automático de costos, ingresos y rentabilidad
- Visualización de estadísticas en el dashboard
- Personalización de costos operativos
- Configuración de parámetros globales

## 2. Estructura del Proyecto

### Principales Directorios

- `/app`: Estructura principal de la aplicación utilizando App Router de Next.js
  - `/(auth)`: Rutas relacionadas con autenticación (login/registro)
  - `/(protected)`: Rutas que requieren autenticación (dashboard, settings)
  - `/api`: Endpoints de la API para el backend
- `/components`: Componentes reutilizables
  - `/ui`: Componentes de UI básicos (botones, inputs, etc.)
- `/prisma`: Esquema de base de datos y migraciones
- `/lib`: Utilidades y configuraciones
- `/hooks`: Custom hooks para la aplicación

### Modelos de Datos Principales

**User**: Usuarios de la aplicación
- Campos: id, name, email, password, role
- Relaciones: quotations, customOperationalCosts, employeeTypes

**Quotation**: Cotizaciones de eventos
- Campos: id, name, eventType, totalAmount, ticketPrice, platformFee, additionalServices, etc.
- Relaciones: user, ticketSectors, customCosts

**TicketSector**: Sectores de tickets en una cotización
- Campos: id, name, quotationId
- Relaciones: quotation, variations

**TicketVariation**: Variaciones de tickets dentro de un sector
- Campos: id, name, price, quantity, sectorId
- Relaciones: sector

**GlobalParameters**: Parámetros globales del sistema
- Campos: defaultPlatformFee, defaultTicketingFee, etc.

**CustomOperationalCost**: Costos operativos personalizados
- Campos: id, name, description, userId
- Relaciones: user, quotationCosts

## 3. Dashboard

El dashboard es el componente central de la aplicación, y es donde el usuario puede visualizar métricas clave y acceder a sus cotizaciones recientes.

### Características del Dashboard

- **Métricas clave**: 
  - Total de cotizaciones
  - Ingresos totales
  - Costos totales
  - Rentabilidad promedio

- **Cotizaciones recientes**: Lista de las 5 cotizaciones más recientes con información resumida:
  - Nombre del evento
  - Tipo de evento
  - Fecha de creación
  - Rentabilidad bruta

### Funcionamiento del Dashboard

1. **Carga de datos**: 
   - Cuando el usuario accede al dashboard, se realiza una llamada a `/api/quotations/stats`
   - Esta API devuelve las estadísticas calculadas en base a todas las cotizaciones del usuario
   - Durante la carga, se muestran esqueletos (skeletons) como indicadores de carga

2. **Estructura de componentes**:
   - Hay dos implementaciones: una en `app/(protected)/dashboard/page.tsx` y otra en `components/dashboard.tsx`
   - La versión del componente tiene una UI más elaborada con iconos y estilos mejorados

3. **Flujo de datos**:
   - El estado se gestiona mediante hooks de React (useState, useEffect)
   - Las estadísticas se almacenan en un estado local que se actualiza cuando se cargan los datos
   - La sesión del usuario se obtiene mediante useSession() de NextAuth

## 4. Proceso de Cotización

1. **Creación**: El usuario crea una nueva cotización especificando detalles básicos
2. **Configuración de sectores**: Se configuran sectores y variaciones de tickets
3. **Costos operativos**: Se agregan costos operativos (predefinidos y personalizados)
4. **Cálculo**: La aplicación calcula automáticamente ingresos, costos y rentabilidad
5. **Almacenamiento**: La cotización se guarda en la base de datos asociada al usuario
6. **Consulta**: Las cotizaciones pueden ser visualizadas, exportadas o modificadas posteriormente

## 5. Seguridad y Autenticación

- Autenticación basada en email/contraseña
- Middleware para proteger rutas privadas
- Roles de usuario (usuario normal y administrador)
- Sesiones gestionadas por NextAuth.js

## 6. APIs Principales

- `/api/auth`: Endpoints relacionados con autenticación
- `/api/quotations`: CRUD de cotizaciones
- `/api/quotations/stats`: Estadísticas para el dashboard
- `/api/calculate-quotation`: Cálculos relacionados con cotizaciones
- `/api/global-settings`: Gestión de parámetros globales
- `/api/custom-operational-costs`: Gestión de costos operativos personalizados
- `/api/employee-types`: Gestión de tipos de empleados 