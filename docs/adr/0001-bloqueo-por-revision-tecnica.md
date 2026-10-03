---
status: accepted
---

# Permitir bloqueo por revisión técnica además de escenarios

La aprobación basada únicamente en escenarios puede dejar fuera problemas del código que detecte la revisión del Frontier Agent. Se decidió permitir que el agente impida el visto bueno por una objeción técnica aunque los escenarios acordados pasen, en lugar de tratar toda observación adicional como sugerencia opcional.

## Consecuencias

El visto bueno no depende exclusivamente de tests verdes. Cada bloqueo debe explicar el problema y distinguir un incumplimiento de un inciso de una objeción adicional sin fundamento contractual explícito. Esta decisión introduce dependencia del juicio del verificador; faltan acordar sus límites, severidades y el mecanismo de impugnación. No otorga al agente facultad de arbitrar disputas ni mover fondos.
