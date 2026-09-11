import { VERTEX_SHADER, IDENTITY_FRAGMENT_SHADER } from '../shaders/common';
import type { ShaderDef, StackItem } from '../types';

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
  private pingpong: [RenderTarget | null, RenderTarget | null] = [null, null];
  private identityProgram: CompiledProgram;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: true,
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
    for (let i = 0; i < 2; i++) {
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
  }

  private setParamUniforms(prog: CompiledProgram, params: Record<string, number>) {
    const gl = this.gl;
    for (const [key, value] of Object.entries(params)) {
      const loc = prog.uniforms[`u_${key}`];
      if (loc) gl.uniform1f(loc, value);
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

    let inputTexture = this.sourceTexture;
    let pingIndex = 0;

    for (let i = 0; i < enabled.length; i++) {
      const item = enabled[i];
      const def = shaderDefs[item.shaderId];
      const isLast = i === enabled.length - 1;
      const cacheKey = def.custom ? `custom:${item.instanceId}` : `builtin:${def.id}`;
      const fragSource = getFragmentSource(item, def);

      let prog: CompiledProgram;
      try {
        prog = this.compileProgram(cacheKey, fragSource);
      } catch (e) {
        prog = this.identityProgram;
      }

      if (isLast) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
      } else {
        const target = this.pingpong[pingIndex]!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.viewport(0, 0, width, height);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
      gl.useProgram(prog.program);
      this.setCommonUniforms(prog, width, height, time, 0);
      this.setParamUniforms(prog, item.params);
      this.drawQuad(prog);

      if (!isLast) {
        inputTexture = this.pingpong[pingIndex]!.texture;
        pingIndex = 1 - pingIndex;
      }
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
    gl.deleteBuffer(this.quadBuffer);
  }
}
