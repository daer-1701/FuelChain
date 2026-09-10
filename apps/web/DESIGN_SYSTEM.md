# FuelChain web — design system

Subject: integridad de la cadena de combustible importado (Bolivia).  
Audience: operadores, auditores, jurado.  
Job: dejar claro qué lote es, qué pasó, cuánto midió y si hay discrepancia.

## Dirección

**Despacho diurno / patio de tanques** — mesa de trabajo de aduana y medición, no consola SaaS oscura.

## Color

| Token | Hex | Rol |
|-------|-----|-----|
| haze | `#b9c9d1` | Fondo (cielo altiplano frío) |
| paper | `#f3f5f2` | Superficie de formulario |
| rail | `#7e929c` | Bordes / metal |
| mute | `#4d5f68` | Texto secundario |
| ink | `#102028` | Texto primario |
| diesel | `#d35a00` | Combustible / marca |
| seal | `#1a6e5f` | Verificado |
| alarm | `#b83228` | Discrepancia |

En CSS: `--void`=haze, `--steel`=paper, `--plate`=rail, `--fog`=mute, `--chalk`=ink, `--fuel`=diesel.

## Type

- **Chivo** — marca, títulos y códigos de lote (stencil industrial).
- **IBM Plex Sans** — UI y cuerpo (legible en mesa de trabajo).

## Layout

Mástil horizontal con marca dominante. Contenido como hoja de despacho, no dashboard de cards.  
Elemento memorable: **medidor de tanque** (barra de volumen) + códigos de lote en Chivo.  
Tablas densas con regla izquierda; radio mínimo (2–4px).

## Motion

Una revelación corta al cargar (`fc-reveal`). Respetar `prefers-reduced-motion`.

## Copy

Sentence case. Verbos claros. DEMO visible pero quieto. Sin culpabilidad automática.
