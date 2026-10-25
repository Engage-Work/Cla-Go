# Third-Party Notices

All files under `lib/` in this project are third-party open source code, distributed with the project; copyright belongs to their original authors.
`js/`, `css/` and `index.html` are original code of this project, licensed under the root `LICENSE` (MIT).

## three.js

- Files: `lib/three.min.js` (r147), `lib/CopyShader.js`, `lib/LuminosityHighPassShader.js`,
  `lib/FXAAShader.js`, `lib/EffectComposer.js`, `lib/RenderPass.js`, `lib/ShaderPass.js`,
  `lib/UnrealBloomPass.js`, `lib/Sky.js`
- Source: <https://github.com/mrdoob/three.js>
- Copyright: Copyright © 2010-2022 three.js authors
- License: MIT

The files above are three.js itself and its official examples/js code. They were only placed locally (for offline use); their contents are unmodified.

### Algorithm references

- `FXAAShader.js`: the FXAA algorithm was introduced by NVIDIA (<https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf>);
  the three.js GLSL port is likewise MIT licensed.
- `Sky.js`: based on the analytic daylight model by Preetham et al.
  (*A Practical Analytic Model for Daylight*); the three.js implementation is MIT licensed.
- `UnrealBloomPass.js`: the bloom effect follows the Unreal Engine post-processing documentation; the three.js implementation is MIT licensed.

## Full MIT License text

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
