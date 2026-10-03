# Reglas del acuerdo y la verificación

Este documento detalla decisiones confirmadas durante el grill de [la propuesta](proyecto.md). Describe el comportamiento esperado del producto, no una implementación existente ni un contrato legal. No fija stack, proveedor de IA, almacenamiento, activo de pago ni mecanismo de firma.

## 1. Preparación compartida

- La primera experiencia atiende a cliente y freelancer.
- Cualquiera crea el proyecto e invita a la contraparte; activar el acuerdo requiere a ambas partes.
- El frontend permite cargar el proyecto y documento rector en almacenamiento externo.
- Un agente de IA ayuda a procesar el documento y conduce el grill por inciso; no se asume comprensión infalible.
- El espacio de conversación es compartido: autor de cada respuesta y desacuerdos visibles.
- Una parte no responde ni acepta por la otra.
- Cada requisito ambiguo sobre código debe convertirse en una condición medible con contexto acordado antes de la activación.

## 2. Escenarios y cobertura

Los casos acordados son escenarios legibles independientes del lenguaje. Su implementación ejecutable se adapta al proyecto, pero no sustituye lo que las partes leyeron y aceptaron.

Cada inciso sobre código debe vincularse a escenarios y resultados esperados antes de activar el acuerdo. La matriz de cobertura debe permitir detectar requisitos omitidos.

Ejemplo ilustrativo, no requisito universal:

| Inciso | Escenario | Resultado esperado |
| --- | --- | --- |
| Solo administradores exportan datos | Un administrador solicita exportación | Obtiene los datos autorizados |
| Solo administradores exportan datos | Un usuario sin ese permiso solicita exportación | Se rechaza y no se exponen datos |

Si se acordó solamente el primer escenario, pasar esa prueba no demuestra cumplimiento del inciso completo. La omisión requiere corregir y acordar la verificación; no agregar obligaciones nuevas ni aprobar automáticamente.

El contrato puede incluir obligaciones fuera de la verificación del Frontier Agent. Deben identificarse explícitamente y nunca mostrarse como aprobadas por los tests. El alcance inicial del agente es código y comportamiento, no evaluación humana o mixta de documentación u obligaciones subjetivas.

## 3. Revisión y comentarios del Frontier Agent

El Frontier Agent informa; el freelancer corrige el código. El agente no modifica el código del producto ni autoriza merges o pagos por sí solo.

Puede bloquear el visto bueno por incumplimientos comprobados y por objeciones de su revisión técnica, incluso si los escenarios pasan. Las objeciones adicionales deben distinguirse de incumplimientos contractuales: no inventar un inciso para justificar un hallazgo.

La decisión de permitir este bloqueo se registra en [ADR 0001](adr/0001-bloqueo-por-revision-tecnica.md). No se ha acordado aún una política de severidad, límites de discrecionalidad ni impugnación de falsos positivos.

### Contenido de una observación

- Identificación del hito y revisión examinada.
- Inciso y escenario relacionados, cuando existan.
- Resultado esperado y resultado observado.
- Evidencia reproducible y pasos para comprobar el hallazgo.
- Explicación concreta del incumplimiento o de la objeción técnica adicional.
- Ubicación de código únicamente cuando esté fundamentada.

La seguridad es prioritaria y bloqueante. Las partes deben acordar una base mínima obligatoria antes de activar el acuerdo; falta concretar controles, umbrales y manejo de hallazgos. La revisión no garantiza ausencia de vulnerabilidades.

## 4. Resultados de verificación

Estas categorías describen resultados del producto, no estados on-chain definitivos:

| Resultado | Significado | Efecto sobre liquidación ordinaria |
| --- | --- | --- |
| Favorable | La revisión examinada obtiene el visto bueno técnico | Solo habilita continuar; todavía requiere aceptación y demás condiciones |
| Requiere corrección | Incumplimiento u objeción técnica bloqueante | Sin atestación favorable; el freelancer corrige y se verifica nuevamente |
| Inconcluso / en espera | No se pudo determinar el resultado, por ejemplo por entorno caído | Sin atestación favorable; no atribuir un fallo de código sin evidencia |

Una prueba omitida o un entorno inaccesible no se convierten en aprobaciones. Política de reintentos, costos y responsables de recuperar el entorno: pendiente.

## 5. Vigencia y cambios

El visto bueno corresponde al hito, versión del acuerdo y revisión exacta examinados, no a una rama cambiante.

Si cambia código ya aprobado, la aprobación anterior no sirve para la nueva revisión. No se habilita liquidación ordinaria hasta restaurar lo aprobado o acordar un nuevo hito específico para el cambio. La revisión resultante requiere verificación.

No basta con decir «volví a lo anterior» ni reutilizar evidencia de otro SHA. Queda pendiente definir la comprobación de restauración tras revert, rebase o squash, y cómo se representan las dependencias de un nuevo hito.

Esta regla impide usar evidencia obsoleta para pagos pendientes; no define reversión automática de un pago ya liquidado ni garantías posteriores.

Una corrección cumple una obligación existente. Agregar una obligación requiere un cambio de alcance aceptado por ambas partes, con escenarios, importe y plazo acordados.

## 6. Rechazo y derivación humana

Ante rechazo del cliente se solicitan motivos vinculados al acuerdo. Las partes intentan aclarar y acordar cómo resolver el desacuerdo.

Si no llegan a un acuerdo, se deriva a revisión humana para buscar una resolución justa basada en el acuerdo y la evidencia. La verificación técnica y el arbitraje siguen separados: el Frontier Agent no se convierte automáticamente en árbitro.

Durante una disputa activa no se permiten liquidaciones ordinarias. La derivación no concede automáticamente facultades de pago o reembolso a una persona; identidad del responsable, autorizaciones, plazos, costos y resultados posibles siguen pendientes.

## 7. Solicitud de liquidación

El freelancer pulsa **Solicitar liquidación**. No se elige un pago automático únicamente por aprobar los tests.

El programa debe comprobar las condiciones correspondientes al mismo hito y entrega:

- Financiamiento suficiente e importes acordados.
- Atestación técnica favorable y vigente.
- Aceptación autorizada del cliente.
- Ausencia de disputa activa.
- Hito no liquidado previamente.
- Autoridades y demás condiciones del acuerdo.

Si se cumplen, la liquidación paga al proveedor y cobra el fee pactado. Un comentario favorable del agente, un botón pulsado o un merge no prueban que la transferencia se haya completado; debe confirmarse la transacción.

## 8. Ejemplos de comprobación del producto

Son ejemplos derivados de las reglas, no una suite ejecutable ni casos contractuales ya aprobados por usuarios finales:

1. Una parte acepta y la otra no: el acuerdo no se activa.
2. «Búsqueda rápida» sin medida ni contexto: requiere aclaración antes de activar.
3. Inciso de código sin escenarios: cobertura incompleta antes de activar.
4. Todos los tests pasan, pero omiten una condición del documento: no se afirma cumplimiento completo.
5. Una obligación está fuera del alcance: se muestra como no verificada, no aprobada.
6. Revisión técnica bloqueante con tests verdes: no se emite atestación favorable y se explica la objeción.
7. Entorno caído: verificación inconclusa, sin liquidación ni acusación infundada de código incorrecto.
8. Nuevo commit posterior al visto bueno: no se reutiliza la aprobación anterior.
9. Cliente solicita una función nueva: cambio de alcance, no corrección gratuita.
10. Rechazo sin acuerdo posterior: derivación humana, sin arbitraje automático del agente.
11. Solicitud de liquidación sin aceptación o con disputa activa: no se liquida.
12. Evento de solicitud repetido tras liquidación: no se paga dos veces.

## 9. Decisiones todavía abiertas

- Política de bloqueo técnico adicional: límites, severidad y posibilidad de impugnación.
- Controles y umbrales mínimos de seguridad.
- Conversión verificable de escenarios legibles en pruebas ejecutables y permisos para mantenerlas.
- Restauración de revisiones aprobadas y dependencia de nuevos hitos.
- Reintentos y costos de verificaciones inconclusas.
- Identidad, procedimiento y poderes de la revisión humana; inactividad y abandono.
- Formato y autoridad emisora de atestaciones y aceptación; vigencia, invalidación y recuperación.
- Condiciones económicas, retención de archivos y políticas de actualización del programa.

Nada de lo anterior se considera decidido por haber sido mencionado como pendiente.
