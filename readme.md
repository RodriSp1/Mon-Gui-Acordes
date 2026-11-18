<div align="center">

# MONGUI
**ESTUDIO WEB DE ACORDES, RASGUEOS Y LÁMINAS MUSICALES**

![HTML5](https://img.shields.io/badge/HTML5-0A0A0A?style=for-the-badge&logo=html5&logoColor=FACC15)
![JavaScript](https://img.shields.io/badge/JavaScript-0A0A0A?style=for-the-badge&logo=javascript&logoColor=FACC15)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-0A0A0A?style=for-the-badge&logo=tailwindcss&logoColor=FACC15)
![Canvas API](https://img.shields.io/badge/Canvas_2D-0A0A0A?style=for-the-badge&logoColor=FFFFFF)

[![Instagram](https://img.shields.io/badge/Instagram-@ronits.ss-FACC15?style=flat-square&logo=instagram&logoColor=000000)](https://instagram.com/ronits.ss)

---

Herramienta web minimalista diseñada para músicos, creadores de contenido y estudiantes que necesitan armar diagramas de acordes, escribir patrones de rasgueo y exportar láminas limpias en PNG listas para compartir.

</div>

## Características principales

- **Editor multi-instrumento:** Soporte nativo para **Guitarra** (6 cuerdas), **Ukelele** (4 cuerdas) y **Flauta dulce** (8 orificios con posiciones abiertas, cerradas y medio tapadas).
- **Control táctil de precisión:** Coloca dedos, dibuja cejillas deslizando sobre el diapasón y alterna cuerdas al aire (`O`) o apagadas (`✕`) tanto en computadora como en pantalla táctil móvil.
- **Constructor de rasgueos:** Secuencias paso a paso con bajo primario (`B1`), bajo secundario (`B2`), rasgueos (`↓`, `↑`), acentos (`↓>`, `↑>`), muteos (`✕`), pausas (`—`) y divisiones de compás (`|`).
- **Memoria local y respaldo JSON:** Guarda automáticamente tus acordes y canciones en el navegador (`localStorage`) con opción para exportar e importar copias de seguridad en `.json`.
- **Exportación PNG en alta resolución:** Descarga diagramas individuales o láminas completas con los acordes centrados por fila y la marca `@ronits.ss`.

---

## Patrones de rasgueo incluidos

| Género / Compás | Secuencia base | Uso recomendado |
| :--- | :--- | :--- |
| **Corridos Tumbados (6/8)** | `B1` `↓` `↑` `\|` `B2` `↓` `↑` | Requinto, guitarra docerola y sierreño moderno |
| **Sierreño / Campirano (3/4)** | `B1` `↓` `↓` `\|` `B2` `↓` `↓` | Música campirana y regional |
| **Ranchera / Vals (3/4)** | `B1` `↓>` `↓` `\|` `B2` `↓>` `↓` | Rancheras tradicionales y vals |
| **Bolero / Norteño (4/4)** | `B1` `↓` `↑` `\|` `B2` `↓` `↑` | Boleros y acompañamiento norteño |
| **Pop / Rock (4/4)** | `↓` `↓` `↑` `—` `↑` `↓` `↑` | Ritmo estándar contemporáneo |
| **Balada (4/4)** | `↓` `↓` `↑` `↓` `↑` | Canciones acústicas lentas |
| **Reggae / Mute (4/4)** | `✕` `↓>` `✕` `↓>` | Acompañamiento percusivo apagado |

---

## Instalación y uso

No requiere dependencias, servidores ni compilación.

```bash
# Clona el repositorio
git clone https://github.com/tu-usuario/mongui.git

# Entra a la carpeta y abre index.html en tu navegador
cd mongui
```

### Personalizar el logotipo
1. Guarda tu imagen con el nombre **`logo.png`** dentro de la misma carpeta que `index.html`.
2. También puedes hacer clic directamente sobre el recuadro del logo en la barra superior de la aplicación para cargar cualquier imagen desde tu dispositivo.

---

## Estructura del proyecto

```text
mongui/
├── index.html    # Aplicación completa (interfaz, motor Canvas 2D y almacenamiento local)
├── logo.png      # Logotipo personalizado opcional
└── README.md     # Documentación del proyecto
```

---

<div align="center">

Creado por **[@ronits.ss](https://instagram.com/ronits.ss)**

</div>