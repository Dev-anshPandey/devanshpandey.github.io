/** Original WebGL2 stable-fluid implementation. Velocity and pigment use separate
 * resolutions so the flow stays inexpensive while colored folds remain sharp. */
export function createFluidCursor(canvas: HTMLCanvasElement, dark: boolean) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
  const linear = !!gl.getExtension("OES_texture_float_linear");
  const programs: WebGLProgram[] = [],
    shaders: WebGLShader[] = [];
  const vertex = `#version 300 es
  precision highp float;
  out vec2 uv;
  void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const common = `#version 300 es
  precision highp float;precision highp sampler2D;
  in vec2 uv;out vec4 result;
  uniform sampler2D source,velocity,aux;
  uniform vec2 texel,point,motion;
  uniform vec3 pigment;
  uniform float dt,decay,aspect,radius;
  vec4 bilerp(sampler2D t,vec2 p){vec2 s=vec2(textureSize(t,0));vec2 q=p*s-.5;vec2 f=fract(q);vec2 a=(floor(q)+.5)/s;return mix(mix(texture(t,a),texture(t,a+vec2(1./s.x,0.)),f.x),mix(texture(t,a+vec2(0.,1./s.y)),texture(t,a+1./s),f.x),f.y);}
  `;
  function program(body: string) {
    const p = gl!.createProgram()!;
    for (const [type, code] of [
      [gl!.VERTEX_SHADER, vertex],
      [gl!.FRAGMENT_SHADER, common + body],
    ] as const) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, code);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(s);
        throw new Error("Fluid shader compilation failed");
      }
      gl!.attachShader(p, s);
      shaders.push(s);
    }
    gl!.linkProgram(p);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS))
      throw new Error("Fluid shader linking failed");
    programs.push(p);
    return p;
  }
  type Target = {
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    w: number;
    h: number;
  };
  type Pair = { read: Target; write: Target; swap: () => void };
  const targets: Target[] = [];
  function target(w: number, h: number): Target {
    const texture = gl!.createTexture()!,
      framebuffer = gl!.createFramebuffer()!;
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texParameteri(
      gl!.TEXTURE_2D,
      gl!.TEXTURE_MIN_FILTER,
      linear ? gl!.LINEAR : gl!.NEAREST,
    );
    gl!.texParameteri(
      gl!.TEXTURE_2D,
      gl!.TEXTURE_MAG_FILTER,
      linear ? gl!.LINEAR : gl!.NEAREST,
    );
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RGBA16F,
      w,
      h,
      0,
      gl!.RGBA,
      gl!.HALF_FLOAT,
      null,
    );
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, framebuffer);
    gl!.framebufferTexture2D(
      gl!.FRAMEBUFFER,
      gl!.COLOR_ATTACHMENT0,
      gl!.TEXTURE_2D,
      texture,
      0,
    );
    if (
      gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE
    ) {
      gl!.deleteTexture(texture);
      gl!.deleteFramebuffer(framebuffer);
      throw new Error("Fluid framebuffer unsupported");
    }
    gl!.viewport(0, 0, w, h);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    const t = { texture, framebuffer, w, h };
    targets.push(t);
    return t;
  }
  function pair(w: number, h: number): Pair {
    const p = {
      read: target(w, h),
      write: target(w, h),
      swap: () => {
        [p.read, p.write] = [p.write, p.read];
      },
    };
    return p;
  }
  let flow: Pair, dye: Pair, pressure: Pair, div: Target, curl: Target;
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  let splat: WebGLProgram,
    advect: WebGLProgram,
    rotation: WebGLProgram,
    confinement: WebGLProgram,
    divergence: WebGLProgram,
    jacobi: WebGLProgram,
    project: WebGLProgram,
    display: WebGLProgram,
    attenuate: WebGLProgram;
  const releaseTargets = () => {
    for (const t of targets) {
      gl.deleteTexture(t.texture);
      gl.deleteFramebuffer(t.framebuffer);
    }
    targets.length = 0;
  };
  const dispose = () => {
    releaseTargets();
    programs.forEach((p) => gl.deleteProgram(p));
    shaders.forEach((s) => gl.deleteShader(s));
    gl.deleteVertexArray(vao);
  };
  try {
    splat = program(
      `void main(){vec2 d=uv-point;d.x*=aspect;float k=exp(-dot(d,d)/radius);result=texture(source,uv)+vec4(pigment*k,0.);}`,
    );
    advect = program(
      `void main(){vec2 p=uv-dt*bilerp(velocity,uv).xy*texel;result=bilerp(source,p)/(1.+decay*dt);}`,
    );
    rotation = program(
      `void main(){float l=texture(source,uv-vec2(texel.x,0)).y;float r=texture(source,uv+vec2(texel.x,0)).y;float b=texture(source,uv-vec2(0,texel.y)).x;float t=texture(source,uv+vec2(0,texel.y)).x;result=vec4(.5*(r-l-t+b),0,0,1);}`,
    );
    confinement = program(
      `void main(){float l=texture(aux,uv-vec2(texel.x,0)).x;float r=texture(aux,uv+vec2(texel.x,0)).x;float b=texture(aux,uv-vec2(0,texel.y)).x;float t=texture(aux,uv+vec2(0,texel.y)).x;float c=texture(aux,uv).x;vec2 f=.5*vec2(abs(t)-abs(b),abs(r)-abs(l));f=f/(length(f)+.0001)*3.*c;f.y=-f.y;result=vec4(clamp(texture(source,uv).xy+dt*f,vec2(-1000),vec2(1000)),0,1);}`,
    );
    divergence = program(
      `void main(){vec2 c=texture(source,uv).xy;float l=texture(source,uv-vec2(texel.x,0)).x;float r=texture(source,uv+vec2(texel.x,0)).x;float b=texture(source,uv-vec2(0,texel.y)).y;float t=texture(source,uv+vec2(0,texel.y)).y;if(uv.x<texel.x)l=-c.x;if(uv.x>1.-texel.x)r=-c.x;if(uv.y<texel.y)b=-c.y;if(uv.y>1.-texel.y)t=-c.y;result=vec4(.5*(r-l+t-b),0,0,1);}`,
    );
    jacobi = program(
      `void main(){float l=texture(source,uv-vec2(texel.x,0)).x;float r=texture(source,uv+vec2(texel.x,0)).x;float b=texture(source,uv-vec2(0,texel.y)).x;float t=texture(source,uv+vec2(0,texel.y)).x;result=vec4((l+r+b+t-texture(aux,uv).x)*.25,0,0,1);}`,
    );
    project = program(
      `void main(){float l=texture(aux,uv-vec2(texel.x,0)).x;float r=texture(aux,uv+vec2(texel.x,0)).x;float b=texture(aux,uv-vec2(0,texel.y)).x;float t=texture(aux,uv+vec2(0,texel.y)).x;result=vec4(texture(source,uv).xy-vec2(r-l,t-b),0,1);}`,
    );
    attenuate = program(`void main(){result=texture(source,uv)*.8;}`);
    display = program(
      `void main(){vec3 c=texture(source,uv).rgb;float l=length(texture(source,uv-vec2(texel.x,0)).rgb);float r=length(texture(source,uv+vec2(texel.x,0)).rgb);float b=length(texture(source,uv-vec2(0,texel.y)).rgb);float t=length(texture(source,uv+vec2(0,texel.y)).rgb);vec3 n=normalize(vec3(r-l,t-b,.65));float shade=clamp(n.z+.25,.35,1.);c*=shade;float a=clamp(max(c.r,max(c.g,c.b)),0.,.92);vec3 rgb=c/max(a,.0001);result=vec4(clamp(rgb,0.,1.),a);}`,
    );
  } catch {
    dispose();
    return null;
  }
  type Uniforms = Record<string, number | number[] | Target>;
  function run(
    p: WebGLProgram,
    destination: Target | null,
    values: Uniforms = {},
  ) {
    gl!.useProgram(p);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, destination?.framebuffer || null);
    gl!.viewport(
      0,
      0,
      destination?.w || canvas.width,
      destination?.h || canvas.height,
    );
    let unit = 0;
    for (const [key, value] of Object.entries(values)) {
      const loc = gl!.getUniformLocation(p, key);
      if (loc === null) continue;
      if (typeof value === "number") gl!.uniform1f(loc, value);
      else if (Array.isArray(value)) {
        if (value.length === 2) gl!.uniform2fv(loc, value);
        else gl!.uniform3fv(loc, value);
      } else {
        gl!.activeTexture(gl!.TEXTURE0 + unit);
        gl!.bindTexture(gl!.TEXTURE_2D, value.texture);
        gl!.uniform1i(loc, unit++);
      }
    }
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }
  const resize = () => {
    releaseTargets();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    const aspect = innerWidth / innerHeight,
      low = matchMedia("(pointer: coarse)").matches;
    const dimensions = (short: number) =>
      aspect >= 1
        ? [Math.round(short * aspect), short]
        : [short, Math.round(short / aspect)];
    const [w, h] = dimensions(128),
      [dw, dh] = dimensions(low ? 384 : 1024);
    flow = pair(w, h);
    pressure = pair(w, h);
    div = target(w, h);
    curl = target(w, h);
    dye = pair(dw, dh);
  };
  try {
    resize();
  } catch {
    dispose();
    return null;
  }
  const inject = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: number[],
  ) => {
    const aspect = innerWidth / innerHeight;
    const isMobile = matchMedia("(pointer: coarse)").matches || aspect < 1;
    const radius = (isMobile ? 0.0022 : 0.0013) * (aspect > 1 ? aspect : 1);
    const common = { point: [x, 1 - y], aspect, radius };
    run(splat, flow.write, {
      ...common,
      source: flow.read,
      pigment: [dx * 6000, -dy * 6000, 0],
    });
    flow.swap();
    run(splat, dye.write, { ...common, source: dye.read, pigment: color });
    dye.swap();
  };
  const step = (dt: number) => {
    const texel = [1 / flow.read.w, 1 / flow.read.h];
    run(rotation, curl, { source: flow.read, texel });
    run(confinement, flow.write, { source: flow.read, aux: curl, texel, dt });
    flow.swap();
    run(divergence, div, { source: flow.read, texel });
    run(attenuate, pressure.write, { source: pressure.read });
    pressure.swap();
    for (let i = 0; i < 20; i++) {
      run(jacobi, pressure.write, { source: pressure.read, aux: div, texel });
      pressure.swap();
    }
    run(project, flow.write, { source: flow.read, aux: pressure.read, texel });
    flow.swap();
    run(advect, flow.write, {
      source: flow.read,
      velocity: flow.read,
      texel,
      dt,
      decay: 1.8,
    });
    flow.swap();
    run(advect, dye.write, {
      source: dye.read,
      velocity: flow.read,
      texel,
      dt,
      decay: 0.85,
    });
    dye.swap();
    gl!.clearColor(0, 0, 0, 0);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    run(display, null, {
      source: dye.read,
      texel: [1 / dye.read.w, 1 / dye.read.h],
    });
  };
  // Dark mode uses luminous dye; on white the same translucent colors stay pastel.
  void dark;
  return {
    inject,
    step,
    resize,
    dispose,
    clear: () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
  };
}
