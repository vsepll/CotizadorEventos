# Dudas Pendientes sobre el Proyecto

## Sobre el Dashboard

1. **Múltiples implementaciones**: He notado que hay dos implementaciones del dashboard, una en `app/(protected)/dashboard/page.tsx` y otra como componente en `components/dashboard.tsx`. ¿Cuál se está utilizando actualmente y cuál es el plan para mantenerlas?

Sinceramente, no se cual se esta usando actualmente

2. **Métricas adicionales**: ¿Hay métricas o gráficos adicionales que se deseen implementar en el dashboard en el futuro? Por ejemplo:
   - Distribución de eventos por tipo
   - Tendencia de rentabilidad a lo largo del tiempo
   - Comparación de ingresos vs. costos por mes

   Si, quiero implementar todos estos graficos en una seccion separada dentro del dashboard. Una tab llamada "Graficas"

3. **Filtrado de estadísticas**: ¿Se requiere implementar filtros para las estadísticas (por fecha, tipo de evento, etc.)?

Dentro de la tab "graficas", si

## Sobre las Cotizaciones

1. **Fórmulas de cálculo**: ¿Podría aclarar exactamente cómo se calculan los siguientes valores?
   - Rentabilidad bruta
   - Costos de línea
   - Costos de Palco4

No sabria explicarlo, debes buscarlo tu.

2. **Personalización adicional**: ¿Hay campos adicionales que se requieran en las cotizaciones?
no

3. **Exportación**: ¿Se necesitan formatos adicionales de exportación además de PDF?
no
## Sobre la Arquitectura

1. **Rendimiento**: ¿Hay preocupaciones sobre el rendimiento actual de la aplicación, especialmente al cargar el dashboard o al calcular cotizaciones complejas?
no
2. **Escalabilidad**: ¿Se espera un crecimiento significativo en el número de usuarios o cotizaciones a corto plazo?
no
3. **Integraciones**: ¿Se planea integrar con sistemas externos (CRM, contabilidad, etc.)?
no
## Sobre el Modelo de Datos

1. **Relaciones adicionales**: ¿Se necesitan relaciones o entidades adicionales en el modelo de datos para requisitos futuros?
no
2. **Modificaciones planeadas**: ¿Hay cambios planeados para el esquema de la base de datos?
no
## Sobre la UI/UX

1. **Consistencia**: ¿Se requiere estandarizar más componentes o estilos en la aplicación?
no
2. **Modo móvil**: ¿Qué tan importante es la experiencia en dispositivos móviles para este proyecto?
nada importante
3. **Personalización**: ¿Se planea permitir personalización de UI por usuario?
no
## Sobre las Mejoras al Dashboard

1. **KPIs adicionales**: ¿Qué KPIs o información adicional sería útil mostrar en el dashboard?
Este punto es crucial. Quiero que apartir de un parametro global llamado costo fijo, calculemos una rentabilidad global teniendo en cuenta la rentabilidad "local" de cada evento y ese costo fijo de mantencion dde la empresa
2. **Interactividad**: ¿Qué nivel de interactividad se requiere en el dashboard (filtros, períodos, etc.)?
lo minimo indispensable
3. **Acciones rápidas**: ¿Sería útil agregar botones de acción rápida desde el dashboard? 
no