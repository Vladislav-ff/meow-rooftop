# Cinematic atmosphere

Open cinematic.html via HTTP/static hosting. index.html remains the original version for comparison. The launcher reads the original HTML, checks two integration anchors and injects atmosphere.js into an isolated same-origin iframe. It fails explicitly if those anchors change. No build step or additional CDN dependencies.

Implemented: procedural sky gradient and moon halo, PMREM neon environment, physical floor materials and micro-normal texture, softer directional balance, warm headliner key and purple rim, shader beam falloff, low-lying haze sheets, circular dust particles and restrained vignette. Existing light palettes and quality buttons remain connected. Reduced-motion preference freezes added shader animation. LITE hides haze and dust and disables grading.

Limits: beam shells and haze sheets are artistic approximations, not true volumetric ray marching; reflections are from a static synthetic environment, not live scene reflections. No browser/GPU visual test was available during authoring. GitHub Pages configuration is unchanged.
