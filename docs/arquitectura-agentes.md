# Arquitectura de agentes — Python + LangGraph

Diseño documental del **Frontier Agent**. Complementa [proyecto.md](proyecto.md) y [arquitectura-web.md](arquitectura-web.md). No es una implementación ni una evaluación funcionando.

## Decisión

Python con LangGraph organiza dos agentes especializados del producto: documental y CI/CD. Reemplaza la propuesta previa de NestJS/LangGraph. Next.js conserva frontend/backend web inicial; no se elige aún un framework HTTP Python, proveedor LLM, almacenamiento o SDK.

## 1. Agente documental

**Entrada:** documento rector, información del proyecto y respuestas identificadas de ambas partes.

**Trabajo:** ayudar a interpretar incisos, detectar ambigüedades, conducir el grill compartido, proponer condiciones medibles y escenarios legibles y hacer visible la cobertura inciso→escenarios→resultado esperado.

**Salida prevista:** propuesta de requisitos y escenarios ligada a una versión, pendientes y obligaciones fuera del alcance verificable. Ambas partes deben leer y aceptar el acuerdo antes de activarlo; el agente no acepta por ellas.

No se presupone que la IA comprende el contrato sin errores. No redefine unilateralmente montos, alcance ni obligaciones; no convierte tests en sustituto del documento rector.

## 2. Agente CI/CD

**Entrada:** versión acordada del contrato y escenarios, hito, repositorio/revisión exacta y evidencia procedente del pipeline.

**Trabajo:** coordinar verificación, revisar resultados y código, relacionar hallazgos con incisos y escenarios y comentar qué debe corregir el proveedor. Los detalles de generación/mantenimiento de pruebas se acordarán al implementar.

**Salida prevista:** resultado favorable, requiere corrección o inconcluso; observaciones y evidencia vinculadas al mismo hito, versión y revisión.

- Favorable válido: atestación autorizada y aprobación del hito; se inicia pago automático si el programa acepta las condiciones.
- Incumplimiento u objeción técnica bloqueante: comentarios; proveedor corrige; nueva evaluación, sin pago previo.
- Inconcluso, test omitido o entorno caído: en espera, sin visto bueno ni pago; no atribuir fallo de código sin evidencia.

El agente no implementa el código del proveedor, no modifica resultados para aprobar ni arbitra disputas. Puede bloquear por revisión adicional aun con tests verdes, explicando si corresponde a un inciso o a una objeción adicional; límites y apelación pendientes.

## Relación entre los agentes

```text
Next.js: carga + conversación compartida
  → Agente documental (Python/LangGraph)
  → Propuesta de contrato/escenarios
  → Aceptación bilateral inicial y versión acordada
  → Desarrollo del proveedor + PRs
  → Agente CI/CD (Python/LangGraph) ↔ pipeline aislado
  → Resultado y evidencia de revisión exacta
  → Atestación autorizada → aprobación y pago automáticos
```

La secuencia expresa el ciclo de negocio, no obliga a ejecutar ambos agentes en una única invocación. Un cambio contractual requiere una nueva versión aceptada; un cambio de código requiere evidencia vigente. Ambos comparten referencias estables, no interpretaciones divergentes del acuerdo.

## Límites de seguridad y confianza

- Código no confiable se ejecuta en CI aislado, no dentro de Next.js ni del proceso privilegiado del agente Python.
- Claves de atestación y pago permanecen fuera del código bajo prueba y con permisos restringidos.
- Separar análisis del agente, validación/autorización y ejecución de liquidación; un texto favorable no basta para pagar.
- Una persona de la plataforma resuelve disputas. El orden disputa/pago y sus poderes deben diseñarse antes de operar fondos reales.
- No publicar documentos, secretos o payloads privados en logs, prompts públicos o cadena.
- El prototipo debe permanecer inconcluso cuando falte evidencia; nunca simular una aprobación real.

## Decisiones de implementación todavía pendientes

Esquemas de estado y entradas/salidas, grafos, checkpoints/persistencia, modelos y herramientas, API con Next.js, integración GitHub/CI, webhooks, permisos de cambio de pruebas, reintentos y costos. Ninguna dependencia ni servicio se instala en esta etapa.

Referencias para la fase futura: [LangGraph Python](https://docs.langchain.com/oss/python/langgraph/overview) y [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api). Verificar versiones al implementar.
