# Cinematic polish / quality pass

Open cinematic.html using a static HTTP server. The original index.html is preserved. cinematic.html composes the original scene with atmosphere.js and polish.js in a same-origin iframe; integration anchors are validated exactly once. This remains a compatibility adapter, not a modular rewrite of the original scene.

Added: optional SSAO before bloom, height-integrated aerial perspective on Standard/Physical materials, low-contrast procedural LED interference, smooth noise-based beam density, revised normal strength and floor clearcoat. LITE bypasses SSAO. Existing light palettes update the screen colors. Added animation respects reduced motion.

The loading overlay now waits for three render frames, reports GLSL compilation and runtime errors, checks HTTP status and times out instead of silently hiding failures. No hosting settings are changed.

Validation: JavaScript syntax checked with Node. LED, beam and height-fog shader pairs compiled and linked in isolated offline Chromium WebGL2 (SwiftShader) tests. This does not validate full Three.js integration, visual composition or frame rate. No measured GPU performance or successful browser rendering is claimed. SSAO adds rendering cost; use LITE on weaker devices. Height fog is analytic; beams remain shell-based approximations, not true volumetric ray marching.
