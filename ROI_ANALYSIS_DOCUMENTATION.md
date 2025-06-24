# Análisis de Retorno sobre la Inversión (ROI) - Documentación

## Resumen

Se ha implementado un sistema completo de análisis de ROI (Return on Investment) y métricas financieras avanzadas en el cotizador de eventos. Este sistema proporciona insights profundos sobre la rentabilidad y viabilidad financiera de cada evento.

## Nuevas Métricas Implementadas

### 1. Métricas de ROI

#### ROI Básico
- **Cálculo**: `(Margen Bruto / Costos Totales) × 100`
- **Descripción**: Porcentaje de retorno sobre la inversión total
- **Uso**: Mide la eficiencia de la inversión en el evento



#### ROI por Ticket
- **Cálculo**: `Margen Bruto / Cantidad de Tickets`
- **Descripción**: Ganancia neta por cada ticket vendido
- **Uso**: Optimización de precios por ticket

#### Múltiplo de Inversión
- **Cálculo**: `Ingresos Totales / Costos Totales`
- **Descripción**: Cuántas veces se recupera la inversión inicial
- **Uso**: Medida de eficiencia del capital invertido

#### Margen de Contribución
- **Cálculo**: `(Margen Bruto / Ingresos Totales) × 100`
- **Descripción**: Porcentaje del margen bruto sobre los ingresos
- **Uso**: Análisis de la contribución de los ingresos al resultado

#### Break-even en Tickets
- **Cálculo**: Cantidad de tickets necesaria para cubrir todos los costos
- **Descripción**: Punto de equilibrio en unidades vendidas
- **Uso**: Planificación de ventas mínimas



### 2. Métricas Financieras Adicionales

#### Margen sobre Ventas
- **Cálculo**: `(Margen Bruto / Valor Total de Tickets) × 100`
- **Descripción**: Rentabilidad sobre las ventas totales (no solo servicios)
- **Uso**: Análisis de rentabilidad del evento completo

#### Eficiencia Operativa
- **Cálculo**: `Ingresos Totales / Costos Operativos`
- **Descripción**: Cuántos ingresos se generan por cada peso de costo operativo
- **Uso**: Optimización de operaciones

#### Costo por Ticket
- **Cálculo**: `Costos Totales / Cantidad de Tickets`
- **Descripción**: Costo promedio por ticket vendido
- **Uso**: Análisis de estructura de costos

#### Revenue por Ticket
- **Cálculo**: `Ingresos Totales / Cantidad de Tickets`
- **Descripción**: Ingreso promedio por ticket (de servicios)
- **Uso**: Optimización de pricing de servicios

#### Ratio Costos Operativos
- **Cálculo**: `(Costos Operativos / Costos Totales) × 100`
- **Descripción**: Porcentaje de costos operativos vs costos totales
- **Uso**: Análisis de estructura de costos

#### Ratio Costos de Plataforma
- **Cálculo**: `((Costo Plataforma + Costo Line) / Costos Totales) × 100`
- **Descripción**: Porcentaje de costos de plataforma vs costos totales
- **Uso**: Análisis de costos fijos vs variables

## Cambios Implementados

### 1. Base de Datos (Prisma Schema)
```sql
-- Nuevos campos agregados al modelo Quotation
roiMetrics         Json?  -- Almacena todas las métricas de ROI como JSON
financialMetrics   Json?  -- Almacena todas las métricas financieras como JSON
eventDurationDays  Int @default(1)  -- Duración del evento en días
```

### 2. Lógica de Cálculo (lib/calculations.ts)
- Nuevas interfaces `ROIMetrics` y `FinancialMetrics`
- Función `calculateQuotation` actualizada con cálculos de ROI
- Soporte para duración de eventos en los cálculos

### 3. API (app/api/calculate-quotation/route.ts)
- Cálculos de ROI integrados en el procesamiento de cotizaciones
- Guardado de métricas en base de datos
- Validación de esquemas para nuevas métricas

### 4. API de Cotizaciones (app/api/quotations/route.ts)
- Esquemas de validación actualizados
- Guardado de métricas de ROI en cotizaciones
- Recuperación de métricas en consultas GET

### 5. Interfaz de Usuario (components/quotation-results.tsx)
- Nueva sección "Análisis de Retorno sobre la Inversión (ROI)"
- Nueva sección "Métricas Financieras Adicionales"
- Visualización completa de todas las métricas
- Formateo apropiado de números y porcentajes

## Beneficios del Sistema

### Para el Negocio
1. **Análisis de Rentabilidad**: Comprensión profunda de qué eventos son más rentables
2. **Optimización de Precios**: Datos para ajustar precios de servicios
3. **Planificación Financiera**: Proyecciones y análisis de break-even
4. **Toma de Decisiones**: Métricas objetivas para evaluar oportunidades

### Para los Usuarios
1. **Transparencia**: Visibilidad completa de la rentabilidad
2. **Comparación**: Capacidad de comparar diferentes escenarios
3. **Planificación**: Herramientas para planificar eventos rentables
4. **Aprendizaje**: Comprensión de factores que afectan la rentabilidad

## Fórmulas de Referencia

### ROI Básico
```
ROI = (Ganancia Neta / Inversión) × 100
    = (Margen Bruto / Costos Totales) × 100
```

### Break-even
```
Break-even Tickets = Costos Totales / (Revenue por Ticket + Servicios Adicionales por Ticket)
```

### Eficiencia Operativa
```
Eficiencia = Ingresos Totales / Costos Operativos
```

## Notas Técnicas

- Todas las métricas se calculan automáticamente al procesar una cotización
- Los datos se almacenan en formato JSON para flexibilidad
- La interfaz muestra métricas solo cuando están disponibles
- Los cálculos manejan casos edge (división por cero, valores negativos)
- Se enfoca en métricas fundamentales de ROI sin complejidades temporales

## Próximas Mejoras Sugeridas

1. **Gráficos de ROI**: Visualizaciones gráficas de las métricas
2. **Análisis Comparativo**: Comparación de ROI entre diferentes cotizaciones
3. **Alertas**: Notificaciones cuando el ROI está por debajo de umbrales
4. **Exportación**: Incluir métricas de ROI en reportes PDF
5. **Benchmarking**: Comparación con promedios históricos o de la industria 