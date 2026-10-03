# Plataforma de confianza para entregas de software sobre Solana

## 1. Visión

Crear una plataforma construida sobre Solana para freelancers y software factories que conecte contratación, desarrollo, verificación de calidad, entrega de archivos y pago por módulos. **Solana es la base contractual y económica del producto**, mediante smart contracts y custodia y liberación condicionada de pagos. La plataforma entrega al desarrollador un pipeline CI/CD para trabajar sobre su proyecto, detectar problemas y verificar que lo que construye funciona; GitHub aporta trazabilidad mediante PRs.

«Construida sobre Solana» describe la base del producto, no que cada componente se ejecute dentro de la blockchain: el desarrollo, las pruebas y la distribución de archivos se realizan fuera de la cadena y se vinculan al acuerdo on-chain.

El contrato sirve a ambas partes: el cliente sabe que sus fondos no se liberan sin cumplir las condiciones pactadas, y el proveedor sabe que el pago del hito está financiado. La calidad se verifica fuera de Solana; el smart contract hace cumplir las condiciones de pago asociadas a esa verificación y a la aceptación.

La plataforma busca reducir dos riesgos: que el desarrollador entregue sin cobrar y que el cliente pague sin recibir lo acordado. La empresa intermediaria obtiene ingresos mediante un fee transparente sobre los pagos liberados.

Este documento organiza la idea inicial. No es una aplicación a Colosseum ni implica que exista una implementación, auditoría o validación comercial. Las decisiones identificadas como propuestas deben confirmarse antes de construir.

Las reglas confirmadas durante el grill se detallan en [reglas del acuerdo y la verificación](reglas-del-acuerdo.md). El [glosario](../GLOSSARY.md) define los términos del producto.

## 2. Usuarios y problema

- **Cliente:** contrata un proyecto, acuerda alcance y financia los módulos.
- **Freelancer:** desarrolla y entrega el trabajo con evidencia verificable.
- **Software factory:** presta el mismo servicio como organización, con responsables definidos para firmar y cobrar.
- **Plataforma:** proporciona al desarrollador el pipeline CI/CD, conecta sus resultados con el acuerdo en Solana y coordina entregas y pagos, cobrando un fee por el servicio.

La primera experiencia se diseña para ambas partes del contrato: un cliente y un freelancer. Las software factories forman parte de la visión posterior, no del usuario proveedor inicial.

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

1. Cliente y freelancer cargan el proyecto y su documento rector; con ayuda del agente de IA aclaran los incisos, definen el alcance y leen y acuerdan los casos de prueba y criterios de aceptación.
2. Ambos aceptan la misma versión del acuerdo y sus condiciones económicas.
3. Se crea el acuerdo on-chain y el cliente deposita los fondos del hito en escrow.
4. El proveedor desarrolla el módulo mediante PRs enlazados al hito.
5. CI ejecuta los controles estáticos y dinámicos sobre una revisión identificada.
6. Se prepara un manifiesto de entrega con código, artefactos y resultados verificables.
7. El cliente revisa el resultado contra los criterios pactados y acepta o solicita correcciones justificadas.
8. Con verificaciones vigentes y aceptación autorizada, el freelancer pulsa «Solicitar liquidación». El programa comprueba las condiciones y, si se cumplen, liquida el hito: pago al proveedor y fee a la plataforma. El botón no reemplaza las autorizaciones ni inicia un pago incondicional.
9. Se confirma la transacción y queda accesible la entrega acordada.

La liberación ordinaria corresponde al pago del cliente hacia el proveedor, con el fee acordado para la plataforma. Una devolución al cliente es un reembolso y se rige por las condiciones de cancelación o resolución de disputa; no es la liquidación ordinaria del trabajo.

El financiamiento debe preceder al trabajo cubierto. Si se financia un hito a la vez, el proveedor conoce que los siguientes aún no están garantizados.

**Merge, entrega, aceptación y pago son eventos distintos.** El orden exacto de integración y aceptación depende del acuerdo. Para el MVP se propone una entrega revisable antes del pago, sin asumir que un merge transfiere automáticamente derechos legales.

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

El Frontier Agent verifica código y comportamiento contra los escenarios legibles acordados. No evalúa inicialmente obligaciones ajenas a ese alcance ni sustituye la aceptación del cliente.

El Frontier Agent informa los incumplimientos mediante comentarios y señala qué debe corregir el desarrollador; no modifica el código del producto. Mientras no se corrijan y verifiquen los incumplimientos, no emite una atestación técnica favorable y el hito no queda habilitado para su liquidación ordinaria. Una nueva revisión debe verificarse nuevamente; obtener esa atestación no sustituye las demás autorizaciones de pago.

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
  → revisión técnica y aceptación contractual
  → integración y entrega conforme al acuerdo
  → liquidación autorizada en Solana
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

La propuesta de MVP exige **aceptación firmada del cliente y atestación técnica de la plataforma**, vinculadas al mismo hito, versión y manifiesto. El proveedor autoriza inicialmente el acuerdo y sus reglas; las funciones exactas de cada firma se definirán antes de implementar.

La plataforma actúa como verificador de evidencia, no como juez infalible ni custodio con retiro libre. Esta dependencia debe explicitarse: se trata de un modelo híbrido de confianza, no de un sistema completamente trustless.

La verificación técnica y la resolución de disputas son responsabilidades separadas. Ejecutar las pruebas o emitir una atestación técnica no convierte automáticamente al verificador en árbitro. Sigue pendiente elegir quién resuelve las disputas y bajo qué procedimiento y autorizaciones.

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
  → Verificado → Aceptado → Liquidado
```

Desde la entrega puede solicitarse una corrección y producirse una nueva revisión. Una disputa congela las salidas ordinarias; cancelación, reembolso y resolución requieren las autorizaciones pactadas.

Una corrección atiende una obligación de la versión acordada. Una obligación nueva constituye un cambio de alcance y requiere acuerdo sobre sus escenarios, importe y plazo; no se presenta como corrección gratuita.

Si el cliente rechaza una entrega técnicamente verificada, debe indicar motivos vinculados al acuerdo. Se busca primero un acuerdo entre las partes y, si el desacuerdo persiste, se deriva a una persona para su revisión. La derivación humana no concede por sí sola autoridad para mover fondos: siguen pendientes la identidad del responsable, sus facultades y el procedimiento de resolución. El Frontier Agent no arbitra automáticamente.

Antes de usar fondos reales deben definirse:

- Plazo de revisión y recordatorios.
- Qué ocurre si el cliente desaparece y cómo se tramita un rechazo sin fundamento dentro de la derivación humana acordada.
- Qué ocurre si el proveedor abandona o incumple.
- Quién arbitra, qué evidencia considera y qué resultados puede autorizar.
- Si existen pagos parciales, retenciones o garantías posteriores.
- Procedimiento de recuperación frente a fallos de la plataforma.

**No se propone liberar fondos automáticamente por silencio en el MVP.** Sin una política de inactividad y resolución, el escrow puede quedar bloqueado; esta es una condición pendiente, no un problema resuelto por la blockchain.

## 11. Entrega de archivos y propiedad intelectual

La entrega debe incluir un manifiesto versionado: repositorio, revisiones, archivos, hashes, instrucciones de ejecución, dependencias, documentación, resultados de pruebas y permisos de acceso comprometidos.

Propuesta inicial: repositorio privado bajo control del cliente, acceso del proveedor y almacenamiento privado de artefactos. El cliente obtiene visibilidad para revisar; el escrow reduce el riesgo de impago, pero no impide copiar código que ya puede ver.

El acceso al código, el derecho de uso y la transferencia de propiedad intelectual son cosas distintas. Sus condiciones se pactan legalmente; el programa registra compromisos y pagos, no reemplaza ese acuerdo.

Los archivos privados no se publican en la cadena. Si se requiere cifrado, se definirán responsables de claves, destinatarios y recuperación. Una URL temporal tampoco garantiza disponibilidad futura.

## 12. Sustentabilidad: fee de la plataforma

Propuesta: cobrar un porcentaje del importe bruto de cada hito efectivamente liquidado. La tasa y el destinatario se fijan en el acuerdo y no cambian retroactivamente.

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

1. Un cliente y un freelancer, con una experiencia para ambas partes.
2. Un proyecto con dos módulos dependientes y criterios explícitos.
3. Un programa compartido y escrow por hito en entorno local/devnet.
4. Integración con un repositorio GitHub y una pequeña stack de PRs.
5. Checks estáticos y un recorrido E2E representativo.
6. Manifiesto de entrega ligado a una revisión exacta.
7. Aceptación del cliente, atestación técnica y liquidación con fee.
8. Demostración de rechazo: prueba fallida o revisión modificada no permite cobrar.
9. Demostración de que repetir el evento no duplica el pago.

No incluye inicialmente un marketplace, almacenamiento fragmentado propio, arbitraje descentralizado, onboarding fiat completo ni compatibilidad con todos los lenguajes.

La demo no equivale a auditoría de seguridad ni autorización para operar fondos reales. La disponibilidad de wallet, fondos de prueba y pago de transacciones debe explicarse; para clientes sin experiencia cripto, la fricción de onboarding es una hipótesis comercial pendiente.

## 14. Validaciones y decisiones pendientes

- **Hackathon:** identificar evento, reglas, fechas y requisitos antes de preparar una entrega.
- **Colosseum:** utilizar Copilot para investigar precedentes y el hub para evaluar herramientas; este documento no afirma haber realizado ese estudio.
- **Demanda:** entrevistar clientes y proveedores sobre impagos, aceptación y disposición a pagar.
- **Diferenciación:** comparar con escrow freelance, gestión de entregas y QA existentes antes de afirmar novedad.
- **Pagos:** elegir activo, responsables de fees y acceso para usuarios sin wallet; verificar elegibilidad y costos si intervienen terceros.
- **Confianza:** cerrar atestaciones, autoridades, disputas, inactividad y actualización del programa.
- **Legal:** revisar propiedad intelectual, privacidad, tratamiento de fondos, impuestos y obligaciones según jurisdicción con asesoramiento especializado.
- **Entrega:** decidir control del repositorio, retención de archivos y momento de transferencia de derechos.
- **Calidad:** concretar los criterios medibles por proyecto, la traducción de escenarios a pruebas, quién puede cambiar checks obligatorios y los límites del bloqueo por revisión técnica adicional del Frontier Agent.
- **Seguridad:** acordar controles mínimos, umbrales y respuesta a hallazgos.
- **Revisiones:** definir cómo comprobar la restauración del código aprobado y el vínculo con nuevos hitos, sin reutilizar aprobaciones de otra revisión.
- **Economía:** validar si el fee cubre CI, E2E, soporte y disputas.

## 15. Síntesis

La plataforma vincula **alcance acordado → módulos → stacked PRs → evidencia estática y dinámica → aceptación → pago y fee en Solana**.

Su valor no está en registrar un PR en blockchain, sino en conectar lo contratado, lo construido, lo verificado y lo pagado mediante un proceso auditable, con límites de confianza explícitos.
