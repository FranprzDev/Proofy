# Proofy

**Del alcance acordado a la evidencia verificable. De la evidencia al pago por hitos en Solana.**

Proofy conecta contratos de software, pruebas y pagos para clientes, freelancers y software factories. **Frontier Agent** transforma requisitos en escenarios de prueba y evalúa entregas contra evidencia de CI/CD; un programa de escrow en Solana controla la liberación de fondos por hito.

El objetivo es reducir dos riesgos: entregar sin cobrar y pagar sin recibir lo acordado. Las pruebas verifican fuera de la cadena; Solana hace cumplir las reglas de pago dentro de ella.

> **Prototipo en desarrollo · integración de pagos limitada a devnet · no auditado.** Este repositorio no representa un flujo comercial completo ni una garantía de calidad, validez jurídica o seguridad para fondos reales.

[Inicio rápido](#inicio-rápido) · [Cómo funciona](#cómo-funciona) · [Arquitectura](#arquitectura) · [Verificación](#verificación) · [Documentación](#documentación)

## Cómo funciona

El flujo de producto que guía la implementación es:

1. **Definir el alcance.** Las partes aportan un documento rector con módulos, entregables y criterios de aceptación.
2. **Aclarar y acordar.** El agente documental identifica ambigüedades y propone escenarios verificables. Una propuesta de IA no sustituye el consentimiento bilateral.
3. **Financiar los hitos.** El acuerdo vincula las partes y el hash del contrato; los fondos se depositan en un vault del programa de escrow.
4. **Entregar con evidencia.** Cada entrega vincula la versión contractual, el hito, la revisión del código y los resultados de las pruebas.
5. **Evaluar y liquidar.** El agente de CI/CD emite un veredicto. La autorización de atestación pasa por controles deterministas antes de que un firmante autorizado pueda liberar el pago.

**Un PR no es un hito pagable. Un check verde no demuestra por sí solo cumplimiento contractual.** Evidencia incompleta, una revisión distinta o un resultado inconcluso no habilitan el pago.

## Estado actual

| Componente | Implementado en el repositorio | Límite actual |
| --- | --- | --- |
| Web | Landing, marketplace, carga y análisis de PDF en `/contrato` | No equivale a contratación y entrega completas de extremo a extremo |
| Autenticación | Wallet, Sign-In With Solana y sesión firmada | Iniciar sesión no acepta un contrato ni autoriza pagos |
| Agente documental | Lectura de requisitos, ambigüedades y planes de pruebas TesterArmy | Necesita un LLM configurado; el resultado es una propuesta |
| Agente de CI/CD | Revisión de evidencia dinámica y estática, hallazgos y control de autorización | Sin LLM, revisión inconclusa; no ejecuta código del PR ni arbitra disputas |
| Escrow | Programa Anchor para SOL nativo: aceptación, financiación, liberación y disputas | Hasta 8 hitos por acuerdo; no auditado |
| Integración de pago | Endpoint servidor que consulta el agente y envía una liberación autorizada | Solo devnet; requiere configuración on-chain y firmante servidor |
| Automatización | CI de web/agente, E2E y workflow del programa | No prueba despliegue ni pagos reales |

La aceptación bilateral completa en la interfaz, el onboarding de repositorios y la operación comercial integrada siguen pendientes. La presencia de código no confirma un despliegue activo.

## Arquitectura

```text
Cliente / proveedor
        │ wallet + sesión SIWS
        ▼
Next.js ─── route handlers ───► Frontier Agent
        │                      Python · FastAPI · LangGraph
        │                      documento → plan de pruebas
        │                      evidencia CI/CD → veredicto
        │
        └── firmante servidor ─► Escrow en Solana
                                acuerdo · vault · hitos · disputas

GitHub + TesterArmy ───────────► evidencia fuera de la cadena
```

- **On-chain:** estado del acuerdo, compromiso del contrato, custodia de SOL, pagos y disputas según las autoridades del programa.
- **Off-chain:** documento rector, código, pruebas, reportes, revisión de IA y archivos. Solana no ejecuta pruebas ni distribuye repositorios.
- **Confianza explícita:** un atestador autorizado libera hitos y un administrador de plataforma resuelve disputas. No es verificación de IA ejecutada de forma trustless en la blockchain.

| Ruta | Responsabilidad |
| --- | --- |
| [`apps/web/`](apps/web/) | Next.js App Router, React, TypeScript, Tailwind y Solana Kit |
| [`services/agent/`](services/agent/) | Frontier Agent: Python, FastAPI, LangGraph, CLI y tests |
| [`programs/frontier-escrow/`](programs/frontier-escrow/) | Rust/Anchor, IDL y tests LiteSVM |
| [`e2e/`](e2e/) | TesterArmy y reportes de evidencia |
| [`apps/intro-video/`](apps/intro-video/) | Presentación Remotion, independiente de la aplicación |
| [`docs/`](docs/) | Producto, arquitectura, API y decisiones |
| [`.github/workflows/`](.github/workflows/) | CI y E2E |

## Inicio rápido

### Requisitos

- Node.js 22+ y la versión de pnpm indicada en `packageManager` de cada aplicación.
- Python 3.12+, `uv` y `make`.
- Phantom para usar las rutas web autenticadas.
- API key del proveedor de IA para análisis real; los tests unitarios usan modelos simulados.

Para compilar el programa: Rust, Solana CLI y Anchor. Las versiones de CI están en [el workflow del programa](.github/workflows/program.yml).

### 1. Instalar y configurar

```bash
git clone https://github.com/FranprzDev/Proofy.git
cd Proofy
make setup
cp services/agent/.env.example services/agent/.env
cp apps/web/.env.example apps/web/.env.local
```

Configurar los archivos copiados:

| Variable | Archivo | Uso |
| --- | --- | --- |
| `AGENT_API_KEY` | Ambos | Misma clave no vacía para llamadas servidor web → agente |
| `AGENT_API_URL` | Web | `http://localhost:8000` en desarrollo |
| `SESSION_SECRET` | Web | Secreto de al menos 32 caracteres; generar con `openssl rand -hex 32` |
| `LLM_ENABLED` | Agente | `true` para análisis y revisión con IA; por defecto `false` |
| `LLM_MODEL` | Agente | `<provider>:<model>` disponible para tu cuenta |
| `GOOGLE_API_KEY` | Agente | Credencial de Google si se usa ese proveedor |

Consultar los ejemplos completos de [web](apps/web/.env.example) y [agente](services/agent/.env.example). No publicar archivos `.env` ni claves privadas. `AGENT_API_KEY`, `SESSION_SECRET` y `ATTESTOR_SECRET_KEY` son exclusivos del servidor: nunca usar `NEXT_PUBLIC_` para ellos.

### 2. Iniciar los servicios

En dos terminales separadas, desde la raíz:

```bash
make dev-agent
```

```bash
make dev-web
```

Abrir `http://localhost:3000`, conectar Phantom y firmar el mensaje de acceso. Visitar `/contrato` para cargar un PDF. El agente expone `/docs` y `/health` en `http://localhost:8000`.

Con `LLM_ENABLED=false`, el agente documental informa `llm_unavailable`: no inventa una evaluación. Iniciar sesión no requiere SOL; financiar acuerdos y enviar transacciones sí requiere fondos de prueba.

### 3. Opcional: E2E y pagos en devnet

- **TesterArmy:** instalar dependencias en `e2e/`, copiar `e2e/.env.example` a `e2e/.env` y configurar `GOOGLE_GENERATIVE_AI_API_KEY`. El agente usa `E2E_PROJECT_DIR` para localizar el proyecto; `E2E_ALLOW_RUN=true` habilita ejecución desde sus herramientas. Las ejecuciones pueden consumir llamadas pagas al modelo.
- **Escrow:** compilar y preparar el programa y su cuenta de configuración según [la guía del programa](programs/frontier-escrow/README.md). Configurar RPC, program ID y `ATTESTOR_SECRET_KEY` con una clave de prueba autorizada como atestador. No reutilizar claves con fondos reales.

Son pasos adicionales a `make setup`: arrancar la web no despliega ni inicializa el programa.

## Verificación

Desde la raíz:

```bash
make check                      # lint, tipos, tests del agente y build web
(cd apps/web && pnpm test)       # tests web, no incluidos en make check
make gen-api                    # regenerar OpenAPI y tipos tras cambiar la API
```

Las pruebas unitarias no requieren claves reales de IA. Para suites opcionales, con sus requisitos instalados:

```bash
anchor build
cargo test -p frontier-escrow    # necesita el binario .so construido
(cd e2e && pnpm exec playwright install chromium && pnpm test:e2e)
```

CI verifica web/agente y consistencia de OpenAPI; E2E publica reportes y artefactos y necesita el secreto de IA correspondiente. El workflow del programa se ejecuta cuando cambian sus rutas relevantes.

## Documentación

| Documento | Contenido |
| --- | --- |
| [Producto y reglas](docs/proyecto.md) | Visión, documento rector, hitos, consentimiento y decisiones |
| [Arquitectura web](docs/arquitectura-web.md) | Fronteras y responsabilidades de Next.js |
| [Arquitectura de agentes](docs/arquitectura-agentes.md) | Preparación documental, revisión y evidencias |
| [API](docs/api-endpoints.md) | Endpoints y contratos de integración |
| [Guía del agente](services/agent/README.md) | Herramientas, comandos `plan`/`review` y códigos de salida |
| [Guía web](apps/web/README.md) | SIWS, cliente servidor y liberación de hitos |
| [Guía del escrow](programs/frontier-escrow/README.md) | Cuentas, PDAs, instrucciones y restricciones |
| [Decisiones de arquitectura](docs/adr/) | Fundamentos de las elecciones técnicas |

Algunos documentos conservan propuestas y descripciones de etapas anteriores. Distinguirlas de lo implementado y de lo verificado en ejecución: este README resume el código publicado, no acredita producción.

## Contribuir

Abrir una rama y un PR acotado con motivación y checks ejecutados. Si cambia la API, regenerar OpenAPI y tipos; si cambia el programa, mantener la IDL sincronizada. No incluir secretos ni datos privados de contratos.

**Licencia:** no hay una licencia general en el repositorio. No asumir permisos de redistribución o uso comercial; las dependencias mantienen sus propias licencias.
