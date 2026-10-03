# Plataforma de confianza para entregas de software sobre Solana

## 1. Visión

Crear una plataforma construida sobre Solana para freelancers y software factories que conecte contratación, desarrollo, verificación de calidad, entrega de archivos y pago por módulos. **Solana es la base contractual y económica del producto**, mediante smart contracts y custodia y liberación condicionada de pagos. La plataforma entrega al desarrollador un pipeline CI/CD para trabajar sobre su proyecto, detectar problemas y verificar que lo que construye funciona; GitHub aporta trazabilidad mediante PRs.

«Construida sobre Solana» describe la base del producto, no que cada componente se ejecute dentro de la blockchain: el desarrollo, las pruebas y la distribución de archivos se realizan fuera de la cadena y se vinculan al acuerdo on-chain.

El contrato sirve a ambas partes: el cliente sabe que sus fondos no se liberan sin cumplir las condiciones pactadas, y el proveedor sabe que el pago del hito está financiado. La calidad se verifica fuera de Solana; el smart contract hace cumplir las condiciones de pago asociadas a esa verificación y a las reglas aceptadas inicialmente por ambas partes.

La plataforma busca reducir dos riesgos: que el desarrollador entregue sin cobrar y que el cliente pague sin recibir lo acordado. La empresa intermediaria obtiene ingresos mediante un fee transparente sobre los pagos liberados.

Este documento organiza la idea inicial. No es una aplicación a Colosseum ni implica que exista una implementación, auditoría o validación comercial. Las decisiones identificadas como propuestas deben confirmarse antes de construir.

Este es el documento de referencia del producto, con reglas, glosario y decisiones. La arquitectura se separa en [web con Next.js](arquitectura-web.md) y [agentes con Python/LangGraph](arquitectura-agentes.md). La [presentación breve](proyecto.html) sirve para revisar el concepto con la dirección del hackathon. [PROPUESTA-Dylan.md](../PROPUESTA-Dylan.md) se conserva como antecedente, no como fuente de reglas contradictorias. No se afirma aprobación del evento ni disponibilidad para fondos reales. Esta etapa es exclusivamente documental: no autoriza crear aplicaciones ni instalar dependencias.

## 2. Usuarios y problema

- **Cliente:** contrata un proyecto, acuerda alcance y financia los módulos.
- **Freelancer:** desarrolla y entrega el trabajo con evidencia verificable.
- **Software factory:** presta el mismo servicio como organización, con responsables definidos para firmar y cobrar.
- **Plataforma:** proporciona al desarrollador el pipeline CI/CD, conecta sus resultados con el acuerdo en Solana y coordina entregas y pagos, cobrando un fee por el servicio.

La experiencia se diseña para ambas partes: cliente y proveedor, que puede ser freelancer o software factory. El Frontier Agent evalúa código verificable y testeable, no el tipo de organización. Cualquiera sirve para la demostración; una factory define representantes autorizados y destinatario de cobro.

El acceso elegido es una wallet de Solana mediante **Phantom**. Debe demostrarse control de la dirección para autenticar la sesión; conectar no basta. Sign In With Solana es la referencia para el diseño, no una integración ya implementada. La firma de acceso no acepta el contrato ni autoriza pagos. Nunca se solicita frase de recuperación o clave privada. Recuperación, cambio de wallet, SDK y sesiones siguen por diseñar.

Hoy el alcance puede quedar desconectado del código, las entregas pueden ser difíciles de evaluar y el pago puede depender de confianza informal. La propuesta vincula cada módulo contratado con sus PRs, criterios de aceptación, pruebas, artefactos y liquidación.

**Promesa razonable:** mejorar trazabilidad y reducir riesgo. No garantizar software sin errores ni eliminar toda confianza humana.

## 3. Contrato y alcance por módulos

### Documento rector y preparación del acuerdo

La calidad de la entrega significa su adecuación a un **documento rector** que define lo acordado entre las partes. El frontend permite cargar el proyecto y ese documento en almacenamiento externo; un agente de IA lo procesa para ayudar a interpretar sus incisos y detectar ambigüedades. No se asume que la IA lo entienda sin errores ni que pueda decidir unilateralmente su significado.

Antes de activar el acuerdo, el agente conduce una conversación de aclaración, similar a un grill: recorre los incisos, identifica lo que se debe construir o cambiar y propone cómo comprobarlo mediante casos de prueba específicos. Ambas partes deben leer y acordar esos casos en esta etapa, no descubrir las condiciones de evaluación al entregar.

Cualquiera de las partes puede crear el proyecto e invitar a la otra; ninguna puede activar unilateralmente el acuerdo. El grill ocurre en un espacio compartido, con respuestas identificadas y desacuerdos visibles. Una respuesta de una parte no equivale al consentimiento de la contraparte.

Las condiciones ambiguas sobre código deben precisarse antes de activar el acuerdo. Por ejemplo, «búsqueda rápida» requiere una condición medible y un contexto de evaluación acordados, no una interpretación unilateral del agente.

Los casos de prueba se acuerdan como escenarios legibles, independientes del lenguaje de programación; las partes no acuerdan el código de las pruebas como definición contractual. La traducción de esos escenarios a pruebas ejecutables depende del proyecto y sigue pendiente de diseño.

Antes de activar el acuerdo, cada inciso relativo al código debe estar asociado a escenarios acordados. La relación inciso → escenarios → resultados esperados permite revisar la cobertura entre ambas partes.

El documento rector, los incisos y los casos de prueba acordados deben permanecer vinculados a la versión del acuerdo. Las pruebas son evidencia de cumplimiento, no reemplazan el documento rector: si omiten una condición pactada, que pasen no demuestra que esa condición se cumpla. La omisión requiere corregir y acordar la verificación, sin introducir obligaciones nuevas ni aprobar automáticamente la entrega.

El alcance inicial de verificación se limita al código y su comportamiento mediante el Frontier Agent, el agente de IA de verificación del producto. El acuerdo puede incluir otras obligaciones, pero debe mostrar explícitamente cuáles no verifica el Frontier Agent. No incluye evaluación humana o mixta de documentación comprensible, aspectos subjetivos del diseño u otras obligaciones no verificables por ese mecanismo. Estas obligaciones no se consideran cumplidas por tener checks verdes. La activación del acuerdo en la plataforma no se presenta como garantía de validez jurídica.

### Condiciones por módulo

Antes de empezar, ambas partes acuerdan:

- Identidad de las partes y responsables autorizados.
- Repositorio y permisos de acceso.
- Módulos, dependencias, entregables y exclusiones.
- Criterios de aceptación funcionales y técnicos por módulo.
- Evaluador autorizado y consentimiento inicial para aprobar y liquidar automáticamente los hitos válidos, sin nueva aprobación manual por entrega.
- Importe, activo de pago, fee y quién paga los costos de red.
- Fechas, período de revisión y procedimiento de corrección.
- Reglas de cancelación, inactividad, disputa y reembolso.
- Propiedad intelectual, licencias, confidencialidad y entrega de accesos.
- Qué significa entregar: código, documentación, compilado, despliegue o una combinación.

Cada módulo constituye un hito contractual. Puede tener uno o varios PRs: **un PR técnico no equivale automáticamente a un hito pagable**.

Los cambios de alcance requieren una nueva versión aceptada por ambas partes. No se agregan obligaciones unilateralmente ni se reutiliza la aceptación de una versión anterior.

## 4. Papel de Solana y distribución de archivos

### Solana no distribuye archivos ni ejecuta controles de calidad

No basaremos la distribución de archivos en supuestos shards de almacenamiento nativos de Solana. Su modelo documentado utiliza cuentas para almacenar estado y programas para ejecutar instrucciones; no constituye por sí mismo un servicio de distribución de repositorios. Véase [conceptos de Solana](https://solana.com/docs/core).

La separación propuesta es:

| En Solana | Fuera de Solana |
| --- | --- |
| Identificadores y estado del acuerdo | Código y ramas en GitHub |
| Compromiso criptográfico de la versión acordada | Texto contractual y especificaciones privadas |
| Custodia programática de fondos por hito | Archivos, compilados y documentación |
| Aceptaciones y autorizaciones de liquidación | Reportes, logs y evidencias E2E |
| Hashes de manifiestos de entrega y evidencia | Almacenamiento, descarga y permisos de acceso |
| Pago al proveedor y fee a la plataforma | Datos personales y comunicaciones |

Un hash permite comprobar que un archivo coincide con el comprometido; **no demuestra calidad, disponibilidad, propiedad intelectual ni entrega efectiva**. Se necesita retención, acceso verificable y una política de recuperación de archivos.

La distribución de archivos queda fuera de la integración con Solana. No se propone fragmentación de archivos ni una red de almacenamiento propia: el código y los artefactos se entregan mediante GitHub y almacenamiento externo.

### Programa compartido, acuerdos independientes

La intención original es crear un programa al firmar cada contrato. Como simplificación propuesta, se despliega **un programa reutilizable** y se crea una cuenta de acuerdo por contrato, con cuentas de hitos y bóvedas asociadas. Solana separa los programas del estado mutable en cuentas: [documentación de programas](https://solana.com/docs/core/programs).

Esto evita desplegar una copia del programa por cliente. La elección final requiere definir autoridades, aislamiento de fondos y política de actualización; una actualización no debe permitir modificar acuerdos ni retirar fondos arbitrariamente.

## 5. Flujo de contratación, entrega y pago

1. Cliente y proveedor cargan el proyecto y su documento rector; con ayuda del agente de IA aclaran los incisos, definen el alcance y leen y acuerdan los casos de prueba y criterios de aceptación.
2. Ambos aceptan la misma versión del acuerdo y sus condiciones económicas.
3. Se crea el acuerdo on-chain y el cliente deposita los fondos del hito en escrow.
4. El proveedor desarrolla el módulo mediante PRs enlazados al hito.
5. CI ejecuta los controles estáticos y dinámicos sobre una revisión identificada.
6. Se prepara un manifiesto de entrega con código, artefactos y resultados verificables.
7. El Frontier Agent verifica los criterios y produce el resultado técnico: favorable, requiere corrección o inconcluso. Un resultado favorable válido aprueba automáticamente el hito.
8. La plataforma inicia automáticamente la transacción de liquidación. El programa comprueba financiamiento, atestación vigente, autoridades, dependencias, ausencia de disputa activa y que el hito no fue pagado. Si cumple, transfiere pago al proveedor y comisión acordada. No requiere aceptación manual por entrega ni botón de cobro.
9. Se confirma la transacción y queda accesible la entrega acordada.

La liberación ordinaria corresponde al pago del cliente hacia el proveedor, con el fee acordado para la plataforma. Una devolución al cliente es un reembolso y se rige por las condiciones de cancelación o resolución de disputa; no es la liquidación ordinaria del trabajo.

El financiamiento debe preceder al trabajo cubierto. Si se financia un hito a la vez, el proveedor conoce que los siguientes aún no están garantizados.

**Merge, entrega, atestación, aprobación y pago son eventos distintos**, aunque aprobación y liquidación se automaticen. Ambas partes autorizan inicialmente las reglas. Un merge no demuestra pago ni transfiere automáticamente derechos legales.

El pago corresponde al cumplimiento funcional, no a líneas de código, commits u horas. Cada hito tiene importe propio; pagar varios hitos no equivale a pagar parcialmente un único hito.

## 6. Desarrollo mediante stacked PRs

Se utilizarán PRs apilados para descomponer el trabajo en cambios pequeños y dependientes. No se los presenta como una invención reciente ni como garantía de calidad por sí mismos.

Ejemplo conceptual:

```text
Hito: módulo de facturación
  PR A: modelo de datos
    PR B: reglas y API, depende de A
      PR C: interfaz e integración, depende de B
```

Cada PR debe registrar el hito asociado, el cambio de alcance que implementa, sus dependencias y las pruebas correspondientes. El conjunto debe cubrir los criterios contractuales del módulo.

- Revisar cada diff contra su base correcta, sin confundir cambios heredados con cambios propios.
- Ejecutar pruebas sobre el resultado integrado relevante, no solo sobre cada diff aislado.
- Invalidar evidencias y aprobaciones aplicables cuando cambie el código o una dependencia.
- Si cambia código ya aprobado, bloquear la liquidación ordinaria hasta restaurar lo aprobado o acordar un nuevo hito específico para el cambio. La revisión resultante debe verificarse; no se reutiliza una aprobación de otro SHA. Sigue pendiente precisar cómo demostrar la restauración después de revert, rebase o squash.
- Mantener una asociación estable entre hito, repositorio, PRs y revisiones, incluso después de rebase o squash.
- No liberar varios pagos por el mismo entregable ni pagar un módulo cuyos prerrequisitos no están aceptados.

La herramienta para gestionar stacks queda pendiente; el producto no necesita construir su propio gestor de Git para validar la idea.

## 7. Calidad: análisis estático y dinámico

### 7.1. Controles estáticos

Inspeccionan código y configuración sin ejecutar los flujos de negocio de la aplicación:

- Lint y convenciones del lenguaje.
- Verificación de formato.
- Tipado y análisis del compilador cuando corresponda.
- Análisis de seguridad del código y detección de secretos.
- Revisión de dependencias y licencias según la política acordada.
- Revisión técnica de diseño, manejo de errores y buenas prácticas relevantes.

Estos controles pueden señalar patrones asociados a fugas de memoria, pero no garantizan detectarlas. Las fugas, el consumo de recursos y la concurrencia también requieren pruebas de ejecución cuando sean relevantes.

### 7.2. Controles dinámicos

Ejecutan la aplicación o sus componentes:

- Pruebas unitarias e integración para reglas y contratos entre componentes.
- E2E para los recorridos de usuario acordados.
- Casos negativos: permisos, entradas inválidas, fallos de servicios y recuperación.
- Pruebas de recursos, rendimiento o memoria cuando formen parte del alcance.
- Verificación del flujo de contrato, financiamiento, aceptación, pago y fee en un entorno de prueba.

La propuesta incluye **el Frontier Agent integrado en el pipeline que recibe el desarrollador** para ayudar a diseñar, ejecutar y analizar E2E sobre el entorno del PR candidato a merge. Su objetivo es acompañar el desarrollo hasta que el módulo funcione conforme a los criterios acordados, no solamente evaluar una entrega al final.

El Frontier Agent verifica código y comportamiento contra los escenarios legibles acordados. No evalúa inicialmente obligaciones ajenas a ese alcance. La aceptación bilateral ocurre al acordar las reglas; la aprobación de cada hito es automática.

El Frontier Agent informa los incumplimientos mediante comentarios y señala qué debe corregir el desarrollador; no modifica el código del producto. Mientras no se corrijan y verifiquen los incumplimientos, no emite una atestación técnica favorable y el hito no queda habilitado para su liquidación ordinaria. Una nueva revisión debe verificarse nuevamente; obtener esa atestación desencadena la liquidación automática, sujeta a las condiciones del programa.

Sus límites deben quedar claros:

- Verifica los escenarios y criterios aceptados previamente; además, puede impedir el visto bueno ante una objeción de su revisión técnica del código, aunque los escenarios pasen. Esta facultad fue confirmada y no se limita a recomendaciones opcionales.
- Cada objeción debe explicar qué problema encuentra y su relación con el contrato. Si no corresponde a un inciso existente, debe distinguirse como objeción técnica adicional, no atribuirla a una obligación que las partes nunca acordaron. Los límites de esta facultad, la clasificación de severidad y la impugnación de falsos positivos siguen pendientes.
- Puede sugerir y mantener pruebas; no modificar sus resultados ni rebajar controles para aprobar.
- Las pruebas críticas son reproducibles, versionadas y revisables por humanos.
- Un resultado inconcluso, una prueba omitida o un entorno caído deja la verificación en espera y no habilita liquidación; no demuestra por sí mismo que el código sea incorrecto.
- Sus informes no autorizan pagos ni merges por sí solos.

Cada observación identifica el inciso y escenario afectados cuando corresponda, el resultado esperado, el observado y evidencia reproducible. Debe explicar específicamente por qué no cumple el contrato o por qué existe una objeción técnica adicional. Solo señala una ubicación de código cuando pueda fundamentarla.

La seguridad es una condición central y bloqueante de la verificación. Debe acordarse una base mínima obligatoria antes de activar el acuerdo; sus controles concretos, umbrales y tratamiento de hallazgos siguen pendientes. No se promete detectar todas las vulnerabilidades.

## 8. Pipeline CI/CD propuesto

El pipeline es parte del producto que la plataforma proporciona al freelancer o software factory para integrarlo en el repositorio del proyecto. No es únicamente un control interno del intermediario ni exige que el software del cliente sea una aplicación blockchain.

El desarrollador lo utiliza durante el trabajo: recibe resultados de análisis estático y pruebas dinámicas, corrige problemas y vuelve a ejecutar los controles. Al preparar la entrega, ese mismo proceso produce la evidencia técnica vinculada al hito en Solana.

La configuración se adapta al lenguaje, entorno y criterios del proyecto. El desarrollador puede proponer ajustes, pero no eliminar unilateralmente los controles pactados para habilitar un pago.

```text
Desarrollo del módulo → PR / actualización de PR
  → lint + formato + tipos + análisis estático
  → build + unitarias + integración
  → entorno efímero del resultado integrado
  → E2E contra criterios pactados
  → si falla: reporte al desarrollador → corrección → nueva ejecución
  → si pasa: reporte y manifiesto de evidencia
  → revisión técnica y atestación válida → aprobación automática
  → integración y entrega conforme al acuerdo
  → envío automático de liquidación → confirmación en Solana
```

GitHub permite exigir status checks antes del merge mediante protección de ramas. Eso demuestra el resultado de los controles configurados, no cumplimiento contractual completo: [status checks](https://docs.github.com/en/pull-requests/reference/status-checks).

Si se incorpora merge queue, los workflows deben cubrir `merge_group` y probar la revisión integrada correspondiente: [checks requeridos y merge queue](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

### Seguridad y vigencia de la evidencia

- Ejecutar código de PRs en entornos aislados, con datos sintéticos y permisos mínimos.
- No exponer claves de liquidación, secretos de producción ni wallets con fondos reales al código bajo prueba.
- No ejecutar código no confiable en jobs privilegiados.
- Verificar origen de webhooks y checks; deduplicar eventos y reconciliar su estado con GitHub.
- Vincular resultados a repositorio, hito, SHA probado, base integrada, versión del workflow y criterios.
- No permitir que el proveedor cambie unilateralmente las pruebas obligatorias.
- Registrar timestamps, hashes de artefactos y ubicación de reportes sin publicar secretos.

## 9. Confianza y autorización on-chain

Solana no observa GitHub ni decide si una aplicación cumple lo prometido. Una integración fuera de la cadena debe verificar la evidencia y comunicar una atestación al programa.

El MVP exige **aceptación bilateral inicial de las reglas y atestación técnica autorizada por hito**, vinculada al acuerdo, versión, revisión y manifiesto. No requiere otra aceptación humana rutinaria. Aprobación válida → envío automático de liquidación.

Solana no envía transacciones espontáneamente: un ejecutor de la plataforma inicia el pago. El programa valida las condiciones; un comentario del LLM no basta. Se confirma y reconcilia el resultado antes de comunicar pago completado. Un envío incierto exige consultar la cadena antes de reintentar, evitando duplicados. Formato de atestación, claves, ejecutor y recuperación siguen por implementar.

La plataforma actúa como verificador de evidencia, no como juez infalible ni custodio con retiro libre. Esta dependencia debe explicitarse: se trata de un modelo híbrido de confianza, no de un sistema completamente trustless.

La verificación técnica y la resolución de disputas son responsabilidades separadas. Ejecutar las pruebas o emitir una atestación técnica no convierte automáticamente al verificador en árbitro. Las disputas las resuelve una persona de la plataforma. Identidad concreta, facultades y procedimiento deben definirse antes de operar fondos reales.

Invariantes del programa:

- Solo las autoridades pactadas pueden aceptar, disputar o liquidar.
- No liberar un hito sin financiamiento suficiente y evidencia correspondiente.
- No reutilizar firmas o atestaciones en otro acuerdo o revisión.
- No pagar dos veces; saldo e importes se verifican on-chain.
- Transferir al proveedor y cobrar el fee dentro de la misma transacción de liquidación.
- Evitar que una disputa active permita liquidaciones ordinarias.
- Registrar la liquidación solo si las transferencias se completan correctamente.

## 10. Estados, correcciones y disputas

Estados conceptuales del hito:

```text
Borrador → Acordado → Financiado → En desarrollo → Entregado
  → Verificado / Aprobado automáticamente → Liquidado
```

Desde la entrega puede solicitarse una corrección y producirse una nueva revisión. Una disputa congela las salidas ordinarias; cancelación, reembolso y resolución requieren las autorizaciones pactadas.

Una corrección atiende una obligación de la versión acordada. Una obligación nueva constituye un cambio de alcance y requiere acuerdo sobre sus escenarios, importe y plazo; no se presenta como corrección gratuita.

Si surge un desacuerdo, se presentan motivos vinculados al acuerdo y se busca aclararlo entre las partes. Una persona de la plataforma resuelve las disputas; el Frontier Agent no arbitra automáticamente ni implementa el código del proveedor. La persona no obtiene retiro libre de fondos: sus autorizaciones y resultados posibles deben diseñarse.

El orden entre disputa y pago automático debe implementarse explícitamente: cuándo se registra el reclamo, si existe ventana y qué ocurre después de liquidar. No se inventa aquí un plazo. Una disputa puede congelar fondos aún pendientes, no revertir automáticamente una transferencia ya completada.

Antes de usar fondos reales deben definirse:

- Plazo de revisión y recordatorios.
- Qué ocurre si el cliente desaparece y cómo se tramita un rechazo sin fundamento dentro de la derivación humana acordada.
- Qué ocurre si el proveedor abandona o incumple.
- Qué persona de la plataforma resuelve, qué evidencia considera y qué resultados puede autorizar.
- Si existen pagos parciales, retenciones o garantías posteriores.
- Procedimiento de recuperación frente a fallos de la plataforma.

**El pago automático se basa en aprobación válida, no en silencio.** Sin una política de inactividad y resolución, el escrow puede quedar bloqueado; esta es una condición pendiente, no un problema resuelto por la blockchain.

## 11. Entrega de archivos y propiedad intelectual

La entrega debe incluir un manifiesto versionado: repositorio, revisiones, archivos, hashes, instrucciones de ejecución, dependencias, documentación, resultados de pruebas y permisos de acceso comprometidos.

Propuesta inicial: repositorio privado bajo control del cliente, acceso del proveedor y almacenamiento privado de artefactos. El cliente obtiene visibilidad para revisar; el escrow reduce el riesgo de impago, pero no impide copiar código que ya puede ver.

El acceso al código, el derecho de uso y la transferencia de propiedad intelectual son cosas distintas. Sus condiciones se pactan legalmente; el programa registra compromisos y pagos, no reemplaza ese acuerdo.

Los archivos privados no se publican en la cadena. Si se requiere cifrado, se definirán responsables de claves, destinatarios y recuperación. Una URL temporal tampoco garantiza disponibilidad futura.

## 12. Sustentabilidad: fee de la plataforma

La comisión elegida es un porcentaje del importe acordado, fijado en el contrato y aplicado a los hitos liquidados. El porcentaje numérico no se ha elegido. Base de cálculo propuesta: importe bruto de cada hito efectivamente liquidado. La tasa y el destinatario se fijan en el acuerdo y no cambian retroactivamente.

```text
fee = importe_bruto × tasa_acordada
neto_proveedor = importe_bruto − fee
```

Ejemplo ilustrativo, no tarifa decidida: sobre 1.000 unidades y un fee del 3 %, la plataforma recibe 30 y el proveedor 970. Los costos de red y operación deben mostrarse aparte; si el fee se cobra adicionalmente al cliente, esa variante debe quedar explícita en el presupuesto.

La implementación utilizará unidades enteras del activo y una regla de redondeo acordada, no coma flotante.

Costos que condicionan el margen:

- Ejecución de CI, agentes E2E y entornos efímeros.
- Almacenamiento, retención y transferencia de artefactos.
- RPC, transacciones y creación de cuentas.
- Soporte, seguridad y gestión de disputas.
- Adquisición de clientes y posibles servicios de entrada/salida de fondos.

```text
margen_por_hito = fee_cobrado − costos_variables_del_hito
```

La comisión por éxito puede no cubrir verificaciones repetidas sobre entregas rechazadas. Deben evaluarse límites de ejecución, precio mínimo o suscripción para factories, sin decidirlos todavía. No se requiere un token propio para este modelo.

## 13. MVP y demostración de hackathon

Propuesta de alcance mínimo:

1. Un cliente y un proveedor, freelancer o factory, con acceso Phantom y experiencia para ambas partes.
2. Un proyecto con dos módulos dependientes y criterios explícitos.
3. Un programa compartido y escrow por hito en entorno local/devnet.
4. Integración con un repositorio GitHub y una pequeña stack de PRs.
5. Checks estáticos y un recorrido E2E representativo.
6. Manifiesto de entrega ligado a una revisión exacta.
7. Aceptación inicial del acuerdo, atestación válida, aprobación y liquidación automáticas con comisión porcentual.
8. Demostración de rechazo: prueba fallida o revisión modificada no permite cobrar.
9. Demostración de que repetir el evento no duplica el pago.

La web inicial contempla landing y marketplace. Funciones concretas de publicación, búsqueda, contratación y persistencia del marketplace se definirán antes de implementarlas. No incluye almacenamiento fragmentado propio, arbitraje descentralizado, onboarding fiat completo ni compatibilidad con todos los lenguajes.

La demo no equivale a auditoría de seguridad ni autorización para operar fondos reales. La disponibilidad de wallet, fondos de prueba y pago de transacciones debe explicarse; para clientes sin experiencia cripto, la fricción de onboarding es una hipótesis comercial pendiente.

## 14. Validaciones y decisiones pendientes

- **Hackathon:** identificar evento, reglas, fechas y requisitos antes de preparar una entrega.
- **Colosseum:** utilizar Copilot para investigar precedentes y el hub para evaluar herramientas; este documento no afirma haber realizado ese estudio.
- **Demanda:** entrevistar clientes y proveedores sobre impagos, aceptación y disposición a pagar.
- **Diferenciación:** comparar con escrow freelance, gestión de entregas y QA existentes antes de afirmar novedad.
- **Pagos:** elegir activo, porcentaje concreto, financiamiento total/por hito y responsables de costos; acceso Phantom decidido, recuperación y usuarios sin wallet por diseñar.
- **Confianza:** cerrar atestaciones, autoridades, disputas, inactividad y actualización del programa.
- **Automatización y disputas:** implementar el orden entre reclamo y envío de pago, poderes del humano de plataforma y recuperación de transacciones inciertas; no se ha fijado una ventana de disputa.
- **Legal:** revisar propiedad intelectual, privacidad, tratamiento de fondos, impuestos y obligaciones según jurisdicción con asesoramiento especializado.
- **Entrega:** decidir control del repositorio, retención de archivos y momento de transferencia de derechos.
- **Calidad:** concretar los criterios medibles por proyecto, la traducción de escenarios a pruebas, quién puede cambiar checks obligatorios y los límites del bloqueo por revisión técnica adicional del Frontier Agent.
- **Seguridad:** acordar controles mínimos, umbrales y respuesta a hallazgos.
- **Revisiones:** definir cómo comprobar la restauración del código aprobado y el vínculo con nuevos hitos, sin reutilizar aprobaciones de otra revisión.
- **Economía:** validar si el fee cubre CI, E2E, soporte y disputas.

## 15. Síntesis

La plataforma vincula **alcance aceptado inicialmente → módulos → stacked PRs → evidencia → aprobación automática → pago automático y comisión en Solana**.

Su valor no está en registrar un PR en blockchain, sino en conectar lo contratado, lo construido, lo verificado y lo pagado mediante un proceso auditable, con límites de confianza explícitos.

## 16. Arquitectura e información para implementación

```text
Cliente + proveedor → Next.js + Phantom
  → Frontend y backend web: landing / marketplace / acuerdo / seguimiento
  → Python + LangGraph: Frontier Agent
     ├─ Agente documental: documento / grill / incisos / escenarios
     └─ Agente CI/CD: revisión / tests / evidencia / comentarios / resultado
          ↔ GitHub: PRs y SHA
          ↔ Pipeline aislado: ejecución de código y pruebas
  ↔ Almacenamiento privado: documentos, artefactos y evidencia
  → Servicio de autorización: valida evidencia y emite atestación
  → Ejecutor automático: envía transacción
  → Programa Solana: valida condiciones, paga neto + comisión
  → Confirmación y reconciliación
```

Responsabilidades conceptuales, no servicios implementados. **Next.js** incluye frontend y backend web inicial. **Python con LangGraph** orquesta el Frontier Agent compuesto por agente documental y agente CI/CD; reemplaza la idea previa de NestJS. La documentación específica de cada parte describe sus límites, no una aplicación existente.

Proyecto, roles, versiones, incisos, escenarios, hitos, revisiones, manifiestos, evaluaciones, disputas y transacciones son la información mínima a modelar. Proveedor IA, almacenamiento, base de datos, SDK de wallet/Solana, versiones e interfaz entre Next.js y Python siguen pendientes. Revisión y claves de pago deben separarse.

Ejemplo económico ilustrativo con presupuesto financiado de 1.000 unidades, antes de descontar comisión:

| Hito | Bruto | Resultado | Bruto liquidado acumulado | Saldo reservado |
| --- | ---: | --- | ---: | ---: |
| Registro e inicio de sesión | 300 | Aprobado y liquidado | 300 | 700 |
| Recuperación de contraseña | 200 | Requiere corrección | 300 | 700 |
| Recuperación corregida | 200 | Mismo hito aprobado | 500 | 500 |
| Catálogo y búsqueda | 500 | Pendiente | 500 | 500 |

La corrección no crea un cobro adicional. Bruto liquidado = neto del proveedor + comisión. Financiar todo o por hito sigue por precisar; solo trabajo financiado tiene fondos garantizados.

## 17. Resultados y comprobaciones del producto

| Resultado | Efecto |
| --- | --- |
| Favorable | Atestación válida, aprobación automática y envío del pago si las condiciones se cumplen |
| Requiere corrección | Observaciones; proveedor corrige; nueva verificación sin pago previo |
| Inconcluso / en espera | No se aprueba ni paga; no atribuir fallo del código sin evidencia |

Ejemplos para convertir en tests del prototipo, no suite ejecutable existente:

1. Aceptación inicial de una sola parte: no activar.
2. Inciso ambiguo o sin escenarios: completar acuerdo antes de activar.
3. Tests que omiten una condición: no afirmar cumplimiento completo.
4. Obligación fuera de alcance: mostrar no verificada, nunca aprobada por tests.
5. Objeción técnica bloqueante con tests verdes: explicar hallazgo y no atestar favorablemente.
6. Entorno caído: inconcluso, sin pago.
7. Revisión modificada: no reutilizar evidencia anterior.
8. Obligación nueva: cambio de alcance bilateral, no corrección gratuita.
9. Firma no autorizada, saldo insuficiente, dependencias incumplidas o disputa activa: rechazar liquidación.
10. Evaluación válida y todas las condiciones cumplidas: pago automático y comisión correcta sin aprobación manual por entrega.
11. Evento duplicado o confirmación incierta: reconciliar y no pagar dos veces.
12. Disputa: atención humana de plataforma bajo permisos explícitos, no arbitraje automático del agente.

La restauración tras revert/rebase y los efectos posteriores a pagos liquidados necesitan política; no se promete devolución automática.

## 18. Línea de trabajo para comenzar el prototipo

Estas tareas describen una fase futura. El stack elegido es Next.js para web/backend y Python/LangGraph para agentes; no se crea estructura de código en esta etapa documental:

1. Modelar datos, versiones, roles y trazabilidad de hitos.
2. Preparar landing y marketplace en Next.js, y luego acceso Phantom con autenticación verificada, sesión e invitaciones.
3. Construir carga documental en Next.js y agente documental en Python/LangGraph para grill, escenarios y aceptación bilateral inicial.
4. Integrar un repositorio/lenguaje inicial y pipeline aislado con reportes reproducibles.
5. Implementar agente CI/CD del Frontier Agent en Python/LangGraph para evaluación/comentarios, no modificación del código del producto.
6. Construir escrow y atestaciones en local/devnet con importes, comisión, autoridades y deduplicación.
7. Automatizar envío, confirmación y reconciliación de liquidaciones.
8. Definir y probar procedimiento humano de disputa y su orden respecto del pago.
9. Ejecutar los ejemplos anteriores como verificaciones end-to-end de la demo.

Se puede iniciar con servicios simulados y fondos de prueba. Cerrar cada política abierta antes de implementar su lógica dependiente; no convertir un default del prototipo en contrato comercial. No mainnet ni fondos reales sin revisión adicional.

Métricas del piloto: entregas incorrectas aprobadas, correctas rechazadas, tiempo/costo de evaluación, demora aprobación→pago, disputas, cambios de alcance, margen y disposición a pagar. No se afirma novedad competitiva ni se adoptan como verificadas las referencias de Dylan.

## 19. Glosario integrado

| Término | Definición |
| --- | --- |
| Documento rector | Referencia versionada de obligaciones acordadas |
| Inciso | Cláusula individual que se aclara y vincula a escenarios |
| Caso acordado | Escenario legible independiente del lenguaje, aceptado por ambas partes |
| Calidad | Adecuación al documento rector según verificaciones acordadas |
| Hito | Unidad contractual de trabajo y pago; puede abarcar varios PRs |
| Frontier Agent | Sistema con agente documental y agente CI/CD en Python/LangGraph; informa, no desarrolla el código del proveedor ni arbitra |
| Atestación técnica | Declaración verificable sobre resultado, hito y revisión; no shard/shred ni pago |
| Aceptación del acuerdo | Consentimiento bilateral inicial sobre versión y reglas automáticas |
| Aprobación del hito | Resultado automático basado en evaluación válida, sin aceptación manual rutinaria |
| Liquidación | Transferencia del pago y comisión, registrada tras éxito de la transacción |
| Escrow | Fondos reservados bajo reglas del programa |
| Corrección | Cambio necesario para cumplir una obligación existente |
| Cambio de alcance | Cambio de obligaciones que exige nueva aceptación bilateral |
| Inconcluso | Evaluación sin evidencia suficiente para aprobar o rechazar |
| Objeción adicional | Hallazgo técnico bloqueante que no corresponde a un inciso explícito |
| Disputa | Desacuerdo resuelto por una persona de la plataforma con procedimiento definido |

## 20. Decisión integrada sobre bloqueo técnico

Se eligió permitir que el Frontier Agent bloquee por revisión técnica aunque pasen los escenarios, en lugar de convertir todo hallazgo adicional en sugerencia opcional. El objetivo es detectar problemas fuera de la cobertura de tests. Esto introduce dependencia del juicio del verificador y exige límites, severidades e impugnación. Cada bloqueo distingue incumplimiento contractual de objeción adicional y no inventa incisos. No otorga poder de arbitraje ni retiro libre de fondos.

## 21. Referencia de acceso y cierre

[Phantom: Sign In With Solana](https://github.com/phantom/sign-in-with-solana) es la referencia para diseñar el acceso. Verificar documentación actual al implementar.

Producto acordado: código verificable de freelancers o factories, criterios claros aceptados previamente, evaluación del Frontier Agent, aprobación y pago automáticos, comisión porcentual y resolución humana de disputas. La definición permite iniciar el prototipo local/devnet, conservando visibles los parámetros técnicos y operativos pendientes.

## 22. Trazabilidad de lo acordado durante la conversación

Esta matriz permite comprobar que la división documental conserva los acuerdos. Resume decisiones vigentes, no añade requisitos nuevos ni afirma implementación. Las propuestas no confirmadas y los detalles técnicos abiertos no se convierten en decisiones por aparecer en este documento.

### Decisiones vigentes

| Acuerdo de la conversación | Dónde está documentado |
| --- | --- |
| La experiencia sirve a cliente y proveedor; freelancer o factory sirven para el ejemplo. Se evalúa código, no tipo de organización | Sección 2 |
| Cualquiera crea el proyecto e invita; ninguna parte activa unilateralmente el acuerdo | Sección 3 |
| Documento rector cargado en almacenamiento externo y procesado con ayuda de IA | Sección 3; agente documental en arquitectura-agentes.md |
| Grill compartido por inciso, con autor de respuestas y desacuerdos visibles | Sección 3 |
| Calidad significa adecuación al documento rector; no satisfacción ilimitada ni ausencia garantizada de bugs | Secciones 2 y 3 |
| Los casos se leen y acuerdan como escenarios legibles, independientes del lenguaje, antes de activar el contrato | Sección 3 |
| Cada inciso sobre código tiene escenarios y resultados esperados; «rápida» debe tener condición medible y contexto | Sección 3 |
| Tests incompletos no sustituyen el documento rector; se corrige y acuerda la verificación sin inventar obligaciones | Sección 3 |
| Enfoque inicial en código y comportamiento; otras obligaciones se muestran explícitamente fuera de la verificación del agente | Sección 3 |
| El nombre del sistema de agentes es Frontier Agent, no bot; el visto bueno es atestación, no shard/shred | Secciones 7 y 19 |
| El pipeline acompaña al desarrollador durante el trabajo, no evalúa únicamente al entregar | Secciones 1, 7 y 8 |
| El agente informa y comenta qué corregir; el proveedor modifica el código | Sección 7; arquitectura-agentes.md, agente CI/CD |
| Cada observación explica específicamente el incumplimiento con inciso/escenario, esperado, observado y evidencia reproducible | Sección 7 |
| El agente puede bloquear por revisión técnica aunque los escenarios pasen; debe explicar la objeción | Secciones 7 y 20 |
| La seguridad es prioritaria y bloqueante | Secciones 7 y 8 |
| Entorno caído o resultado inconcluso deja en espera, sin aprobación ni pago | Secciones 7 y 17 |
| Cambio de código invalida aprobación; antes de liquidar se restaura lo aprobado o se acuerda nuevo hito, con nueva verificación | Sección 6 |
| Corregir una obligación existente no es agregar alcance; alcance nuevo exige acuerdo, escenarios, importe y plazo | Secciones 3 y 10 |
| Contrato y criterios claros se aceptan inicialmente por ambas partes; no hay aceptación manual rutinaria de cada entrega | Secciones 3, 5 y 9 |
| Aprobación de hito válido y pago automáticos, sin botón obligatorio de cobro | Secciones 5 y 9 |
| Humanos de la plataforma resuelven disputas; el agente no arbitra | Secciones 9 y 10 |
| Comisión porcentual del importe acordado; tasa numérica todavía no elegida | Sección 12 |
| Acceso mediante wallet Solana con Phantom; conectar y autenticar/aceptar/pagar son acciones distintas | Sección 2; arquitectura-web.md |
| Next.js para frontend y backend inicial con landing y marketplace | Secciones 13 y 16; arquitectura-web.md |
| Python + LangGraph para Frontier Agent con dos agentes: documental y CI/CD | Secciones 16 y 19; arquitectura-agentes.md |
| Esta etapa solo entrega documentos y HTML; no crear aplicaciones, instalar dependencias ni ejecutar agentes | Introducción; arquitectura-web.md y arquitectura-agentes.md |

### Decisiones anteriores reemplazadas explícitamente

| Alternativa anterior | Decisión vigente |
| --- | --- |
| Empezar exclusivamente con freelancer y dejar factories para después | El ejemplo admite cualquiera; mismos criterios para el código |
| Cliente acepta cada entrega y freelancer pulsa «Solicitar liquidación» | Aprobación y pago automáticos conforme a reglas aceptadas inicialmente |
| Marketplace fuera del alcance inicial | Landing y marketplace incluidos en la web inicial; operaciones concretas pendientes |
| NestJS con LangGraph como backend de agentes | Python con LangGraph; Next.js mantiene frontend/backend web |
| Crear estructura básica de aplicaciones en esta fase | Solo documentación, por aclaración explícita posterior |

### Pendientes que no se presentarán como acordados

Porcentaje concreto, activo, financiamiento total/por hito, base final del cobro de comisión, poderes humanos y orden disputa/pago, límites del veto técnico, controles mínimos concretos, recuperación de wallets, operaciones del marketplace, proveedor IA, persistencia, SDK, endpoints, modelos de estado y despliegue. Secciones 14 y 16 y ambos documentos de arquitectura conservan estos puntos abiertos.

Las métricas y ejemplos tomados como mejoras de la comparación con Dylan están identificados como propuestas o líneas de validación. Sus antecedentes competitivos no se presentan como investigación verificada. Su documento original permanece intacto.
