# Roadmap de Jeseb Hub

Este documento recoge las funcionalidades que se consideran para la evolución de Jeseb Hub. Es una guía de prioridades y alcance inicial, no una fecha de entrega: el orden puede cambiar según las necesidades del proyecto y la experiencia de sus usuarios.

## Prioridades

### 1. Deudas y deudores

Registrar el dinero que el usuario debe y el que otras personas le deben, con saldos e historial de abonos.

- **MVP:** crear una deuda indicando si el usuario debe o le deben, la persona, el monto, la descripción y las fechas relevantes.
- **Abonos:** registrar pagos parciales, consultar su historial y calcular el saldo pendiente.
- **Seguimiento:** distinguir deudas pendientes, vencidas y saldadas; mostrar un resumen útil.
- **Más adelante:** evaluar intereses, recordatorios y exportación.

Los saldos deben derivarse de los montos originales y los abonos registrados, conservando un historial claro de los movimientos.

### 2. Presupuestos

Definir límites de gasto por categoría y periodo, empezando por el presupuesto mensual.

- Comparar el gasto registrado con el límite y mostrar cuánto queda disponible.
- Avisar o destacar cuando el gasto se acerque al límite o lo supere.
- Integrar el resumen con las transacciones y reportes existentes.

### 3. Metas de ahorro

Permitir que cada usuario defina objetivos de ahorro y siga su progreso.

- **MVP:** nombre, monto objetivo, fecha opcional y aportes registrados.
- Mostrar el monto acumulado y el porcentaje de progreso.
- Más adelante, evaluar estimaciones de fecha de cumplimiento e integración con cuentas o presupuestos.

### 4. Suscripciones y gastos recurrentes

Ayudar a controlar pagos regulares como datos móviles, internet, gimnasio u otros servicios.

- **MVP:** registrar un gasto recurrente con monto, frecuencia, categoría y próxima fecha de cobro.
- Mostrar los próximos cobros y el costo estimado por periodo (por ejemplo, mensual o anual).
- Más adelante, evaluar sugerencias para detectar recurrencias a partir de transacciones existentes y permitir confirmarlas como recurrentes.

### 5. Comparador colaborativo de precios

Crear un catálogo compartido de productos, tiendas y precios aportados por los usuarios, junto con listas de compra personales para comparar dónde conviene comprar.

- **Base:** definir cómo identificar productos (marca, presentación y unidad de medida), tiendas y precios con fecha de actualización.
- **Colaboración:** permitir aportes de usuarios y diseñar mecanismos proporcionales para corregir datos desactualizados o duplicados.
- **Listas de compra:** cada usuario crea sus propias listas y consulta precios disponibles en distintas tiendas.
- **Comparación:** mostrar precios comparables —incluido el precio por unidad cuando corresponda— y el total estimado por tienda.
- **Más adelante:** evaluar historial de precios, avisos de cambios y funciones de ubicación si resultan necesarias.

El catálogo de productos y precios sería compartido entre usuarios; las listas de compra, en cambio, serían privadas de cada usuario. La validación y moderación de aportes deben definirse antes de abrir la contribución ampliamente.

## Por definir: gastos compartidos

La idea de repartir gastos y saldar balances entre varias personas queda fuera de las prioridades actuales. Su utilidad y el modelo de participación (por ejemplo, si todas las personas necesitan una cuenta) todavía no están claros. Se reconsiderará cuando haya suficiente uso y feedback para validar la necesidad y elegir un alcance adecuado.

## Criterios transversales

- Mantener el aislamiento de los datos privados por usuario y no compartir información personal en el catálogo colaborativo.
- Conservar la precisión monetaria y las convenciones de fechas del proyecto.
- Añadir traducciones en inglés y español para las nuevas interfaces.
- Dividir cada iniciativa en entregas pequeñas y verificar su encaje con la arquitectura existente antes de implementarla.

## Cómo mantener este roadmap

Actualizar este documento cuando cambien las prioridades o se valide una decisión de producto. Al iniciar una iniciativa, convertir su alcance en tareas concretas (por ejemplo, issues) y registrar aquí su estado general; evitar tratar las ideas futuras como compromisos de entrega.
