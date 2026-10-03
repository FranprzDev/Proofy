# Arquitectura web — Next.js

Diseño documental. Existe un scaffold en `apps/web` (landing y marketplace placeholder, route handlers hacia el agente); Phantom/SIWS, persistencia y marketplace real siguen sin implementar. Las reglas de negocio están en [proyecto.md](proyecto.md); los agentes se describen en [arquitectura-agentes.md](arquitectura-agentes.md).

## Decisión

Usar **Next.js para frontend y backend inicial de la web**. No añadir NestJS. El sistema de agentes usa Python/LangGraph por separado. Mantener acceso Phantom, aprobación/pago automáticos, comisión porcentual y resolución humana de disputas.

## Experiencia web prevista

| Área | Responsabilidad | Estado |
| --- | --- | --- |
| Landing | Explicar problema, solución, funcionamiento y límites del producto | Alcance confirmado, sin implementar |
| Marketplace | Punto de encuentro y exploración dentro de la plataforma | Alcance confirmado; catálogo y operaciones concretas pendientes |
| Acceso | Conectar Phantom y autenticar control de la wallet | Elección confirmada; sesión e integración pendientes |
| Proyecto/acuerdo | Invitaciones, documento rector, conversación compartida y escenarios | Reglas definidas; pantallas pendientes |
| Hitos/evidencia | Alcance, revisiones, resultados, saldo y transacciones | Reglas definidas; implementación pendiente |
| Disputas | Presentación de motivos y evidencia, seguimiento de resolución humana | Rol confirmado; permisos y procedimiento pendientes |

Landing y marketplace son la primera estructura web prevista. No asumir todavía si el catálogo muestra proyectos, proveedores o ambos; ni que publicar, buscar, contratar o pagar estén implementados.

## Backend inicial

El backend Next.js atiende acciones y consultas de la experiencia web, valida entradas y permisos y se comunica con el componente Python cuando una operación requiere trabajo de agentes.

Responsabilidades previstas: autenticación/sesión, acceso a proyectos, versiones del acuerdo, aceptación bilateral inicial, carga documental con controles de acceso y exposición de resultados/evidencia.

No es el entorno donde se ejecuta código no confiable de PRs, ni convierte una respuesta del LLM en autorización libre para mover fondos. Persistencia, endpoints y estrategia de trabajos largos siguen por diseñar.

## Relación entre componentes

```text
Cliente / proveedor
  → Next.js: frontend + backend web
      ├─ Phantom: acceso y acciones explícitas de wallet
      ├─ Datos/documentos privados: proveedor por elegir
      └─ Python/LangGraph: solicitudes y consulta de resultados
            → Agente documental / agente CI/CD
  → Atestación autorizada + ejecutor → programa Solana
```

El diagrama es lógico: no fija HTTP, colas, streaming ni servidor Python concreto. La ejecución de pago es automática cuando hay aprobación válida y condiciones satisfechas; no se agrega botón obligatorio de cobro ni nueva aceptación humana por entrega.

## Pendientes antes de implementar

- Alcance de catálogo, publicación, búsqueda y contratación del marketplace.
- Sesiones Phantom, invitaciones, recuperación y representantes de factories.
- Persistencia y quién es dueño de cada dato; evitar estado duplicado entre web y agentes.
- Interfaz Next.js↔Python, autenticación de servicios, errores, reintentos e idempotencia.
- Almacenamiento, permisos, retención y recuperación de archivos.
- Versiones, despliegue y observabilidad sin exponer documentos o secretos.

El scaffold llama al agente solo desde el servidor con `X-API-Key` (ver [ADR 0001](adr/0001-agente-python-langgraph.md)).
