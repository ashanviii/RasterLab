import {
  VERTEX_SHADER,
  IDENTITY_FRAGMENT_SHADER,
  UNIVERSAL_FX_FRAGMENT_SHADER,
  MASK_COMPOSITE_FRAGMENT_SHADER,
} from '../shaders/common';
import type { ShaderDef, StackItem } from '../types';
import { resolveCharacterList } from '../lib/charsets';

interface CompiledProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
  attribPosition: number;
}

interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

interface MaskEntry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: WebGLTexture;
  dirty: boolean;
}

interface CharsetAtlasEntry {
  texture: WebGLTexture;
  count: number;
}

const PINGPONG_SLOTS = 3;

/**
 * Render height at which pixel-space effect params (cell size, block size, offsets, ...) look
 * exactly as authored -- u_pixelScale is 1.0 here. Preview typically renders below this (downscaled
 * to fit the screen) and exports often render above it (original/custom resolution), so scaling
 * pixel-space quantities by u_pixelScale keeps an effect's visual density the same in both.
 */
const PIXEL_SCALE_REFERENCE_HEIGHT = 1080;

export interface RenderOptions {
  width: number;
  height: number;
  time: number;
}

export class GLRenderer {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private programCache = new Map<string, CompiledProgram>();
  private quadBuffer: WebGLBuffer;
  private sourceTexture: WebGLTexture | null = null;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private pingpong: (RenderTarget | null)[] = new Array(PINGPONG_SLOTS).fill(null);
  private identityProgram: CompiledProgram;
  private universalFxProgram: CompiledProgram;
  private maskCompositeProgram: CompiledProgram;
  private masks = new Map<string, MaskEntry>();
  private charsetAtlases = new Map<string, CharsetAtlasEntry>();

  constructor(canvas: HTMLCanvasElement, opts?: { preserveDrawingBuffer?: boolean }) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      // Only export renderers need this (they read pixels back after an `await`, once the browser
      // may have already cleared an unpreserved buffer). The live canvas redraws every RAF frame and
      // never reads its own pixels back, so forcing the browser to retain/copy the buffer here was
      // pure overhead -- a well-known source of WebGL jank on a continuously-rendered canvas.
      preserveDrawingBuffer: opts?.preserveDrawingBuffer ?? false,
      // Every pass in this renderer draws a full-viewport quad with no internal edges, so MSAA has
      // nothing to smooth -- it only added cost to the final resolve.
      antialias: false,
    });
    if (!gl) throw new Error('WebGL is not supported in this browser.');
    this.gl = gl;

    const quad = gl.createBuffer();
    if (!quad) throw new Error('Failed to allocate GPU buffer.');
    this.quadBuffer = quad;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    this.identityProgram = this.compileProgram('__identity__', IDENTITY_FRAGMENT_SHADER);
    this.universalFxProgram = this.compileProgram('__universalfx__', UNIVERSAL_FX_FRAGMENT_SHADER);
    this.maskCompositeProgram = this.compileProgram('__maskcomposite__', MASK_COMPOSITE_FRAGMENT_SHADER);
  }

  getGL() {
    return this.gl;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(info || 'Shader compile failed.');
    }
    return shader;
  }

  compileProgram(cacheKey: string, fragmentSource: string): CompiledProgram {
    const cached = this.programCache.get(cacheKey);
    if (cached) return cached;

    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    let fs: WebGLShader;
    try {
      fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    } catch (e) {
      gl.deleteShader(vs);
      throw e;
    }

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create GL program.');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(info || 'Program link failed.');
    }

    const uniforms: Record<string, WebGLUniformLocation> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (!info) continue;
      const loc = gl.getUniformLocation(program, info.name);
      if (loc) uniforms[info.name] = loc;
    }

    const compiled: CompiledProgram = {
      program,
      uniforms,
      attribPosition: gl.getAttribLocation(program, 'a_position'),
    };
    this.programCache.set(cacheKey, compiled);
    return compiled;
  }

  /** Try compiling a fragment shader without persisting it into the cache. Throws on error. */
  testCompile(fragmentSource: string) {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create GL program.');
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    const info = gl.getProgramInfoLog(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(program);
    if (!ok) throw new Error(info || 'Program link failed.');
  }

  invalidateProgram(cacheKey: string) {
    const cached = this.programCache.get(cacheKey);
    if (cached) {
      this.gl.deleteProgram(cached.program);
      this.programCache.delete(cacheKey);
    }
  }

  setImage(image: TexImageSource, width: number, height: number) {
    const gl = this.gl;
    if (!this.sourceTexture) {
      this.sourceTexture = gl.createTexture();
    }
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.sourceWidth = width;
    this.sourceHeight = height;
  }

  private createRenderTarget(width: number, height: number): RenderTarget {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture.');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) throw new Error('Failed to create framebuffer.');
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { framebuffer, texture, width, height };
  }

  private ensurePingPong(width: number, height: number) {
    const gl = this.gl;
    for (let i = 0; i < PINGPONG_SLOTS; i++) {
      const existing = this.pingpong[i];
      if (!existing || existing.width !== width || existing.height !== height) {
        if (existing) {
          gl.deleteFramebuffer(existing.framebuffer);
          gl.deleteTexture(existing.texture);
        }
        this.pingpong[i] = this.createRenderTarget(width, height);
      }
    }
  }

  /** Pick a ping-pong slot index not in `exclude` (used so a pass never reads and writes the same buffer). */
  private pickSlot(exclude: number[]): number {
    for (let i = 0; i < PINGPONG_SLOTS; i++) {
      if (!exclude.includes(i)) return i;
    }
    throw new Error('No free ping-pong slot.');
  }

  private drawQuad(prog: CompiledProgram) {
    const gl = this.gl;
    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(prog.attribPosition);
    gl.vertexAttribPointer(prog.attribPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private setCommonUniforms(prog: CompiledProgram, width: number, height: number, time: number, unit: number) {
    const gl = this.gl;
    if (prog.uniforms['u_texture']) gl.uniform1i(prog.uniforms['u_texture'], unit);
    if (prog.uniforms['u_resolution']) gl.uniform2f(prog.uniforms['u_resolution'], width, height);
    if (prog.uniforms['u_time']) gl.uniform1f(prog.uniforms['u_time'], time);
    if (prog.uniforms['u_pixelScale']) {
      gl.uniform1f(prog.uniforms['u_pixelScale'], height / PIXEL_SCALE_REFERENCE_HEIGHT);
    }
  }

  private setParamUniforms(prog: CompiledProgram, params: Record<string, number>) {
    const gl = this.gl;
    for (const [key, value] of Object.entries(params)) {
      const loc = prog.uniforms[`u_${key}`];
      if (loc) gl.uniform1f(loc, value);
    }
  }

  private createMaskTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create mask texture.');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  private getOrCreateMask(instanceId: string): MaskEntry {
    let entry = this.masks.get(instanceId);
    if (!entry) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, this.sourceWidth || 512);
      canvas.height = Math.max(1, this.sourceHeight || 512);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create mask 2D context.');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      entry = { canvas, ctx, texture: this.createMaskTexture(), dirty: true };
      this.masks.set(instanceId, entry);
    }
    return entry;
  }

  /**
   * Paint one soft brush dab at normalized image position (u, v). radiusFrac is a fraction of the
   * mask's width. opacity (0-1) is the dab's peak strength — lower values build up more gradually
   * as strokes overlap instead of snapping straight to fully erased/added.
   */
  paintMask(instanceId: string, u: number, v: number, radiusFrac: number, erase: boolean, opacity = 0.85) {
    const entry = this.getOrCreateMask(instanceId);
    const { canvas, ctx } = entry;
    const x = u * canvas.width;
    const y = v * canvas.height;
    const r = Math.max(1, radiusFrac * canvas.width);
    const color = erase ? '0,0,0' : '255,255,255';
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${color},${Math.max(0, Math.min(1, opacity))})`);
    grad.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    entry.dirty = true;
  }

  /** Fill a stack item's whole mask with a single value: 1 = fully visible, 0 = fully hidden. */
  clearMask(instanceId: string, value: 0 | 1) {
    const entry = this.getOrCreateMask(instanceId);
    entry.ctx.fillStyle = value === 1 ? '#fff' : '#000';
    entry.ctx.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
    entry.dirty = true;
  }

  private uploadMasksIfDirty() {
    const gl = this.gl;
    let any = false;
    for (const entry of this.masks.values()) {
      if (!entry.dirty) continue;
      any = true;
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      // Match the same UNPACK_FLIP_Y_WEBGL orientation used for the source image in setImage(),
      // so a painted mask lines up with the rendered image instead of being mirrored vertically.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.canvas);
      entry.dirty = false;
    }
    if (any) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  private pruneMasks(stack: StackItem[]) {
    const ids = new Set(stack.map((i) => i.instanceId));
    for (const [instanceId, entry] of this.masks) {
      if (!ids.has(instanceId)) {
        this.gl.deleteTexture(entry.texture);
        this.masks.delete(instanceId);
      }
    }
  }

  /**
   * Renders a horizontal strip of characters (one cell per glyph) into a texture, sampled by the
   * ASCII Art shader's luminance-bucket index. Cached by the exact character sequence so switching
   * back to a previously-used charset (e.g. toggling Character Set) doesn't re-render it.
   */
  private getOrCreateCharsetAtlas(chars: string[]): CharsetAtlasEntry {
    const key = chars.join(' ');
    const existing = this.charsetAtlases.get(key);
    if (existing) return existing;

    const gl = this.gl;
    const cell = 64;
    const canvas = document.createElement('canvas');
    canvas.width = cell * chars.length;
    canvas.height = cell;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create charset atlas 2D context.');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(cell * 0.72)}px monospace`;
    chars.forEach((ch, i) => ctx.fillText(ch, i * cell + cell / 2, cell / 2 + 1));

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create charset atlas texture.');
    // Bind on the atlas's own texture unit (1), not whatever unit happens to be active -- the
    // caller has TEXTURE0 (the source image) active at this point, and binding here without
    // switching units would silently repoint u_texture at the atlas instead of the source image.
    // On a cache hit this function returns above before touching GL state, which is why this only
    // ever showed up on a fresh renderer (i.e. every export) the first time a charset was needed,
    // never in the continuously-rerendering live preview.
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Match the orientation convention used for the source image / masks so v=0 is the same edge.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    const entry: CharsetAtlasEntry = { texture, count: chars.length };
    this.charsetAtlases.set(key, entry);
    return entry;
  }

  private pruneCharsetAtlases(neededKeys: Set<string>) {
    for (const [key, entry] of this.charsetAtlases) {
      if (!neededKeys.has(key)) {
        this.gl.deleteTexture(entry.texture);
        this.charsetAtlases.delete(key);
      }
    }
  }

  render(
    stack: StackItem[],
    shaderDefs: Record<string, ShaderDef>,
    getFragmentSource: (item: StackItem, def: ShaderDef) => string,
    opts: RenderOptions
  ) {
    const gl = this.gl;
    const { width, height, time } = opts;

    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;

    if (!this.sourceTexture) {
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    const enabled = stack.filter((s) => s.enabled && shaderDefs[s.shaderId]);

    if (enabled.length === 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
      gl.useProgram(this.identityProgram.program);
      this.setCommonUniforms(this.identityProgram, width, height, time, 0);
      this.drawQuad(this.identityProgram);
      return;
    }

    this.ensurePingPong(width, height);
    this.pruneMasks(stack);
    this.uploadMasksIfDirty();

    const neededCharsetKeys = new Set<string>();
    for (const item of enabled) {
      const def = shaderDefs[item.shaderId];
      if (def.usesCharsetAtlas) {
        const chars = resolveCharacterList(item.params.characterSet ?? 0, item.textParams?.customChars);
        neededCharsetKeys.add(chars.join(' '));
      }
    }
    this.pruneCharsetAtlases(neededCharsetKeys);

    let inputTexture = this.sourceTexture;
    let inputSlot = -1; // -1 means "the persistent source texture", not a pool slot

    for (let i = 0; i < enabled.length; i++) {
      const item = enabled[i];
      const def = shaderDefs[item.shaderId];
      const isLast = i === enabled.length - 1;
      const cacheKey = def.custom ? `custom:${item.instanceId}` : `builtin:${def.id}`;

      // Skip regenerating the fragment source (a string build for every custom shader) when the
      // compiled program is already cached -- it would just be thrown away below.
      let prog: CompiledProgram | undefined = this.programCache.get(cacheKey);
      if (!prog) {
        try {
          prog = this.compileProgram(cacheKey, getFragmentSource(item, def));
        } catch (e) {
          prog = this.identityProgram;
        }
      }

      const originalInputTexture = inputTexture;
      const originalInputSlot = inputSlot;

      // Pass A: the shader's own effect, into a ping-pong slot distinct from its own input.
      const aSlot = this.pickSlot(originalInputSlot >= 0 ? [originalInputSlot] : []);
      const afterShader = this.pingpong[aSlot]!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, afterShader.framebuffer);
      gl.viewport(0, 0, width, height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
      gl.useProgram(prog.program);
      this.setCommonUniforms(prog, width, height, time, 0);
      this.setParamUniforms(prog, item.params);
      if (def.usesCharsetAtlas) {
        const chars = resolveCharacterList(item.params.characterSet ?? 0, item.textParams?.customChars);
        const atlas = this.getOrCreateCharsetAtlas(chars);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, atlas.texture);
        if (prog.uniforms['u_charsetAtlas']) gl.uniform1i(prog.uniforms['u_charsetAtlas'], 1);
        if (prog.uniforms['u_charsetCount']) gl.uniform1f(prog.uniforms['u_charsetCount'], atlas.count);
      }
      this.drawQuad(prog);

      let currentTexture = afterShader.texture;
      let currentSlot = aSlot;

      // Pass A2 (optional): composite the effect back over its original input using this item's painted mask.
      const maskEntry = this.masks.get(item.instanceId);
      if (maskEntry) {
        const exclude = originalInputSlot >= 0 ? [originalInputSlot, aSlot] : [aSlot];
        const mSlot = this.pickSlot(exclude);
        const maskTarget = this.pingpong[mSlot]!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, maskTarget.framebuffer);
        gl.viewport(0, 0, width, height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, originalInputTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, maskEntry.texture);
        gl.useProgram(this.maskCompositeProgram.program);
        this.setCommonUniforms(this.maskCompositeProgram, width, height, time, 0);
        if (this.maskCompositeProgram.uniforms['u_base']) gl.uniform1i(this.maskCompositeProgram.uniforms['u_base'], 1);
        if (this.maskCompositeProgram.uniforms['u_mask']) gl.uniform1i(this.maskCompositeProgram.uniforms['u_mask'], 2);
        this.drawQuad(this.maskCompositeProgram);

        currentTexture = maskTarget.texture;
        currentSlot = mSlot;
      }

      // Pass B: universal Color/Light post-process, to the screen if this is the last item.
      if (isLast) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
      } else {
        const bSlot = this.pickSlot([currentSlot]);
        const target = this.pingpong[bSlot]!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.viewport(0, 0, width, height);
        inputTexture = target.texture;
        inputSlot = bSlot;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.useProgram(this.universalFxProgram.program);
      this.setCommonUniforms(this.universalFxProgram, width, height, time, 0);
      this.setParamUniforms(this.universalFxProgram, item.params);
      this.drawQuad(this.universalFxProgram);
    }
  }

  toBlob(type = 'image/png', quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  getSourceSize() {
    return { width: this.sourceWidth, height: this.sourceHeight };
  }

  dispose() {
    const gl = this.gl;
    this.programCache.forEach((p) => gl.deleteProgram(p.program));
    this.programCache.clear();
    if (this.sourceTexture) gl.deleteTexture(this.sourceTexture);
    this.pingpong.forEach((t) => {
      if (t) {
        gl.deleteFramebuffer(t.framebuffer);
        gl.deleteTexture(t.texture);
      }
    });
    this.masks.forEach((entry) => gl.deleteTexture(entry.texture));
    this.masks.clear();
    this.charsetAtlases.forEach((entry) => gl.deleteTexture(entry.texture));
    this.charsetAtlases.clear();
    gl.deleteBuffer(this.quadBuffer);
  }
}
