# Aseguramiento de software y pagos progresivos en Solana

Documento inicial de producto — 3 de octubre de 2026.

## Contexto

Proyecto desarrollado en el contexto de Colosseum de Solana, trabajando para Superteam Argentina y orientado a la competencia local. El nombre comercial está pendiente de definición.

## Propuesta

Una startup que actúa como intermediario entre clientes, desarrolladores independientes y software factories para verificar el cumplimiento de los requisitos de un producto de software y liberar pagos progresivos mediante Solana.

El cliente y el proveedor acuerdan funcionalidades, criterios de aceptación y montos. Los fondos quedan reservados en un escrow gobernado por un smart contract. A medida que se entregan y verifican funcionalidades, se libera el importe correspondiente; el saldo restante continúa reservado para las entregas pendientes.

**El escrow se libera progresivamente durante el proyecto. Cada desembolso corresponde a funcionalidades verificadas, sin esperar a que termine todo el producto.**

La IA evalúa funcionalidades y su cumplimiento frente a los requisitos acordados. La cantidad de código, los commits y las horas trabajadas no determinan el pago.

## Problema que resolvemos

- El cliente necesita saber que lo entregado cumple con lo contratado antes de pagar.
- El proveedor necesita certeza de que los fondos están disponibles y de que cobrará por entregas aceptadas.
- Las evaluaciones manuales pueden demorar cobros y producir desacuerdos sobre el avance.
- Los pagos internacionales y sus intermediarios pueden agregar fricción y costos.
- Los registros de requisitos, entregas, evaluaciones y pagos suelen estar dispersos.

## Por qué Solana

### 1. Pagos progresivos con comisiones de red bajas

La baja comisión de red de Solana permite plantear desembolsos frecuentes por funcionalidades o unidades de aceptación pequeñas. Esto ayuda a vincular el flujo de dinero con el avance funcional verificado y reduce la necesidad de agrupar todas las entregas en un único pago final.

El ahorro total deberá medirse en el piloto: además de las comisiones de red, existen costos de evaluación, infraestructura y conversión de moneda.

### 2. Ejecución de pagos mediante smart contracts

El programa en Solana define las reglas ejecutables del acuerdo: participantes, fondos, unidades de aceptación, montos y condiciones de liberación. Un bot puede enviar la transacción de pago cuando existe una evaluación válida, sin aprobación humana rutinaria para cada desembolso.

La ejecución debe impedir pagos duplicados, pagos superiores al saldo reservado y autorizaciones provenientes de evaluadores no permitidos.

### 3. Infraestructura de pagos global

La propuesta busca permitir que clientes y proveedores de distintos países contraten y cobren mediante una infraestructura común, priorizando la calidad y el cumplimiento del producto sobre la ubicación de quien lo desarrolla.

Solana facilita la transferencia internacional de activos digitales. Su uso no elimina las legislaciones, impuestos u obligaciones aplicables a las partes y a la plataforma; la operación comercial debe contemplarlos según las jurisdicciones elegidas.

### 4. Trazabilidad e integridad de la evidencia

Cada entrega se vincula con una versión concreta del software, una especificación acordada y un informe de evaluación. Sus huellas criptográficas y las referencias de pago se registran en la blockchain para permitir detectar alteraciones y auditar la secuencia de avances y desembolsos.

Registrar una huella no impide modificar el código fuera de la blockchain: permite comprobar si el artefacto presentado coincide con el que fue evaluado. Tampoco demuestra calidad por sí mismo; esa evidencia surge de la evaluación.

### 5. Automatización e integración con IA

Solana permite conectar el resultado de una evaluación externa con reglas programables de liquidación. La IA participa en la interpretación de requisitos, generación de pruebas y análisis funcional; las pruebas y el servicio evaluador producen la evidencia que habilita el pago.

La IA puede integrarse con otros medios de pago. La razón para usar Solana en este flujo es combinar automatización, escrow programable, transferencias frecuentes y registros auditables.

## Identidad mediante wallet y reputación por entregas

Cada usuario se identifica dentro de la plataforma mediante una wallet. La firma de un mensaje permite demostrar su control e iniciar sesión, sin que la evaluación de calidad necesite conocer el nombre, nacionalidad o identidad personal de quien está detrás.

El principio del producto es evaluar lo que cada participante entrega: funcionalidades que cumplen los requisitos, evidencia de calidad y cumplimiento de sus acuerdos. La wallet actúa como identificador para contratar, entregar, cobrar y construir un historial verificable.

- **Acceso mediante wallet:** el usuario demuestra control de su dirección con una firma; no necesita compartir su clave privada.
- **Reputación por resultados:** el historial vincula acuerdos, funcionalidades verificadas, pagos y resoluciones de disputas con la wallet.
- **Evaluación independiente de la identidad personal:** las mismas condiciones de aceptación se aplican a cualquier proveedor.
- **Participación global:** clientes, desarrolladores y software factories pueden interactuar mediante direcciones de wallet.
- **Privacidad de los entregables:** código, requisitos y datos confidenciales permanecen fuera de la cadena; el historial público debe limitarse a la información acordada y las referencias necesarias.

Una wallet ofrece una identidad seudónima: no demuestra por sí sola que corresponde a una persona única ni impide que alguien cree varias direcciones. El diseño de reputación deberá contemplar cuentas nuevas, acuerdos simulados y cambios de wallet. Además, las transacciones públicas pueden permitir vincular actividad; no se promete anonimato absoluto.

La identificación personal no es necesaria para evaluar funcionalidades. Cualquier requisito de identificación aplicable a la operación comercial se trata por separado según las jurisdicciones y servicios utilizados.

## Contrato y criterios de aceptación

El acuerdo debe incluir:

- Wallets de cliente y proveedor como identificadores dentro de la plataforma.
- Monto total, activo de pago y monto asignado a cada unidad de aceptación.
- Funcionalidades, requisitos y pruebas de aceptación versionados.
- Plazos, dependencias entre funcionalidades y reglas para corregir entregas.
- Evaluadores autorizados y condiciones para aceptar sus resultados.
- Reglas de disputa, cancelación y devolución del saldo pendiente.
- Referencia al documento contractual completo.

Las cláusulas expresables como reglas se ejecutan en el smart contract. Las condiciones legales y los requisitos extensos pueden mantenerse fuera de la cadena, asociados mediante una huella criptográfica. Los cambios de alcance requieren acuerdo de ambas partes y una nueva versión.

Un requisito como «recuperar contraseña» debe especificar comportamientos verificables: envío del enlace, vencimiento, uso único y protección frente a cambios de cuentas ajenas.

## Flujo de funcionamiento

1. **Acordar:** cliente y proveedor aprueban requisitos, criterios de aceptación y distribución del presupuesto.
2. **Financiar:** el cliente deposita los fondos acordados en escrow.
3. **Entregar:** el proveedor presenta una versión identificable y ejecutable del software.
4. **Verificar:** el servicio evaluador ejecuta pruebas y utiliza IA para analizar el cumplimiento funcional.
5. **Registrar:** se genera evidencia vinculada a la versión, los requisitos y los resultados de las pruebas.
6. **Liberar parcialmente:** el smart contract habilita el pago de las unidades aprobadas. El saldo de las pendientes permanece reservado.
7. **Repetir:** el proveedor continúa entregando y cobrando conforme se verifican nuevas funcionalidades.
8. **Cerrar:** al completar el acuerdo se liquida el saldo correspondiente; una cancelación o disputa aplica las reglas pactadas.

## Ejemplo de liberación progresiva

Ejemplo ilustrativo con un presupuesto de 1.000 unidades de una stablecoin. El activo definitivo está pendiente de elección.

| Funcionalidad acordada | Importe | Resultado | Pago acumulado | Saldo en escrow |
| --- | ---: | --- | ---: | ---: |
| Registro e inicio de sesión | 200 | Verificada | 200 | 800 |
| Recuperación de contraseña | 100 | Verificada | 300 | 700 |
| Catálogo y búsqueda | 300 | Verificada | 600 | 400 |
| Checkout | 250 | Falló; pendiente de corrección | 600 | 400 |
| Checkout corregido | 250 | Verificada | 850 | 150 |
| Historial de compras | 150 | Verificada | 1.000 | 0 |

Una entrega puede contener varias funcionalidades. Si las reglas acordadas permiten aceptarlas por separado, se pagan las aprobadas y se retiene el importe de las pendientes. Una misma unidad nunca se paga dos veces.

## Arquitectura conceptual

- **Aplicación:** creación de acuerdos, seguimiento de funcionalidades, informes y estado de pagos.
- **Integraciones:** repositorio, pipeline de pruebas y entorno de despliegue.
- **Evaluador externo:** ejecución aislada de la entrega, pruebas funcionales y análisis asistido por IA.
- **Servicio de autorización u oráculo:** firma resultados válidos e informa al programa de Solana qué unidades cumplieron sus condiciones.
- **Programa de escrow:** reserva fondos, verifica autorizaciones y ejecuta desembolsos parciales.
- **Almacenamiento de evidencia:** conserva especificaciones, informes y artefactos fuera de la cadena; sus huellas y referencias permiten auditarlos.

El smart contract no evalúa directamente una aplicación externa. Depende del resultado del evaluador autorizado. La descentralización de la red de pagos no implica que ese evaluador sea descentralizado; su modelo de confianza debe quedar explícito.

## Automatización y calidad

El objetivo es un flujo automático para casos con criterios de aceptación verificables. La evaluación debe combinar pruebas reproducibles con análisis de IA y producir resultados de aprobación, rechazo o evaluación inconclusa.

- El proveedor no controla por completo el entorno ni todas las pruebas de aceptación.
- La versión evaluada queda identificada y vinculada al resultado.
- La IA no puede modificar unilateralmente requisitos ni montos.
- Un resultado ambiguo o una disputa retiene el pago afectado y activa el procedimiento acordado.
- Las claves del bot y del evaluador tienen permisos limitados.

La promesa es verificar los criterios acordados y pagar por su cumplimiento. Superar la evaluación no equivale a demostrar ausencia absoluta de errores.

## MVP para la competencia

Primer alcance propuesto: una API o integración con varias funcionalidades verificables y pagos parciales reales en Solana devnet.

La demo debe mostrar:

1. Acuerdo con al menos tres unidades de aceptación y montos independientes.
2. Depósito del presupuesto en escrow.
3. Primera entrega aprobada y primer desembolso automático.
4. Segunda entrega con una funcionalidad aprobada y otra fallida: pago parcial y saldo retenido.
5. Corrección de la funcionalidad fallida y nuevo desembolso, sin duplicar pagos anteriores.
6. Evidencia y transacciones consultables para cada avance.

Este alcance demuestra la relación entre calidad funcional, avance y flujo progresivo de fondos.

## Diferenciación y antecedentes de Colosseum

La revisión inicial de fuentes públicas encontró proyectos cercanos. Las descripciones representan lo anunciado por los equipos; sus implementaciones no fueron auditadas y la búsqueda no cubre todas las postulaciones locales.

| Proyecto | Antecedente relevante | Diferenciación propuesta |
| --- | --- | --- |
| [ContractGuardAI](https://colosseum.com/arena/projects/contractguardai) | IA para analizar contratos y escrow que libera pagos al verificar evidencia de hitos. | Evaluación especializada de funcionalidades de software, con evidencia reproducible por versión y desembolsos progresivos. |
| [DeTask](https://blog.colosseum.org/announcing-the-winners-of-the-solana-renaissance-hackathon/) | Ganador de DAOs & Communities en Renaissance 2024; presentado como plataforma de desarrollo con IA y trabajo de DAOs. | Profundizar la verificación funcional que autoriza cada pago. |
| [AgentLink](https://github.com/ArpitaGanatra/AgentLink) | Contratación, reputación y escrow para agentes de IA. | Atender acuerdos entre clientes, desarrolladores y software factories con criterios de aceptación de producto. |
| [BlackBox](https://colosseum.com/arena/projects/blackbox-1) | Workflows de IA privados, revisión y pagos en Solana. | Especializar el flujo en cumplimiento de requisitos de software contratado. |

La diferenciación debe demostrarse con la precisión del evaluador, la claridad de los requisitos y la ejecución de pagos parciales, además de la combinación de IA y blockchain.

## Validación comercial y decisiones pendientes

Se propone realizar un piloto con una software factory y un cliente para medir:

- Aceptación del mecanismo de evaluación por ambas partes.
- Entregas incorrectas aprobadas y entregas correctas rechazadas.
- Tiempo y costo de verificar cada unidad de aceptación.
- Tiempo entre entrega aprobada y desembolso.
- Frecuencia de disputas y cambios de alcance.
- Disposición a pagar por el servicio.

Quedan por definir el nombre, activo de pago, modelo de ingresos, mecanismo de arbitraje, reglas de financiación y modelo de confianza del evaluador. Estas decisiones deben conservar el principio central: **pagar progresivamente por funcionalidades verificadas**.

## Pitch inicial

> Conectamos clientes y proveedores de software identificados mediante wallets, con reputación basada en sus entregas. Nuestra IA evalúa las funcionalidades contra los requisitos pactados y un smart contract en Solana libera pagos progresivos desde un escrow. El cliente paga por cumplimiento demostrado y el proveedor cobra a medida que entrega valor, con evidencia auditable de cada avance. La calidad se evalúa por el producto entregado, sin depender de quién está detrás de la wallet.

## Referencias técnicas y de alcance

- [Comisiones de Solana](https://solana.com/docs/core/fees/fee-structure).
- [Programas y smart contracts en Solana](https://solana.com/docs/core/programs).
- [Requisitos de presentación en Colosseum](https://colosseum.com/hackathon).
- [GAFI: activos virtuales y proveedores de servicios](https://www.fatf-gafi.org/en/publications/Virtualassets/Virtual-assets-fatf-standards.html).
- [Ejemplo de obligaciones fiscales sobre activos digitales en Estados Unidos](https://www.irs.gov/filing/digital-assets).
