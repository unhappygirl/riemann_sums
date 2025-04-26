const SAMPLE_RATE = 5;

const WHITE = [1.0, 1.0, 1.0, 1];
const BLACK = [0, 0, 0, 0.6];
const PRISM_COLOR = [0, 0.2, 0.3, 0.6];
const GRAPH_COLOR = [0.3, 0, 0, 0.5];
const LINE_COLOR = [1, 0.2, 0.6, 0.3];

class MyBuilder {
  constructor(graph) {
    this.graph = graph;
  }

  buildGraph(xinterval, zinterval) {
    const rate = SAMPLE_RATE;
    const vertices = this.graph.sample(xinterval, zinterval, rate).flat();
    let samplesX = (xinterval[1] - xinterval[0]) * rate + 1;
    let samplesZ = (zinterval[1] - zinterval[0]) * rate + 1;

    // Generate indices for grid tessellation
    // Example indices for two triangles forming a quad
    const indices = graphTesellation(samplesX, samplesZ);

    return { vertices, indices };
  }

  buildRiemann(...args) {
    const data = this.graph.riemannPrisms(...args);
    document.getElementById("volume").innerText = data.volume;
    const vertices = data.vertices.flat();
    const amount = data.vertices.length / 8;
    const rectIndices = rectPrismTesellation(amount);
    const _lineIndices = riemannPrismEdgeIndices(data.vertices);
    return { vertices, rectIndices, _lineIndices, amount };
  }
}

function handle_string_num(str_num) {
  if (str_num === "") return 1;
  if (isNaN(str_num)) return 1;
  return Number(str_num);
}

// class too large, fix by extract subclass
class MyOpenGLController {
  constructor(intervals, graph) {
    this.intervals = intervals;
    this.builder = new MyBuilder(graph);
    this.getContext();
    this.initShaderSrc();
    this.vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      this.vertexShaderSource
    );
    this.fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.fragmentShaderSource
    );
    this.initProgram();
    this.initMatrices();
    this.initBuffers();
    this.initCamera();
  }

  getContext() {
    this.canvas = document.getElementById("plotCanvas");
    this.gl =
      this.canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!this.gl) {
      console.error("WebGL is not supported, try changing your browser");
    }
  }

  initShaderSrc() {
    this.vertexShaderSource = vertexShader;
    this.fragmentShaderSource = fragmentShader;
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(
        "Shader compilation failed:",
        this.gl.getShaderInfoLog(shader)
      );
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  initMatrices() {
    this.fieldOfView = (45 * Math.PI) / 180; // in radians
    this.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.zNear = 0.1;
    this.zFar = 200.0;

    this.projectionMatrix = mat4.create();
    mat4.perspective(
      this.projectionMatrix,
      this.fieldOfView,
      this.aspect,
      this.zNear,
      this.zFar
    );

    this.viewMatrix = mat4.create();
  }

  initProgram() {
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error(
        "Program link failed:",
        this.gl.getProgramInfoLog(this.program)
      );
    }
  }

  initBuffers() {
    this.indexBuffer = this.gl.createBuffer();
    this.vertexBuffer = this.gl.createBuffer();
    this.normalBuffer = this.gl.createBuffer();
    this.axesBuffer = this.gl.createBuffer();
    this.riemannBuffer = this.gl.createBuffer();
    this.gridBuffer = this.gl.createBuffer();
  }

  bufferArray(buffer, type, src, mode, arr_func) {
    this.gl.bindBuffer(type, buffer);
    this.gl.bufferData(type, new arr_func(src), mode);
  }

  populateVertexBuffers(graphVertices, riemannVertices) {
    this.bufferArray(
      this.vertexBuffer,
      this.gl.ARRAY_BUFFER,
      graphVertices,
      this.gl.STATIC_DRAW,
      Float32Array
    );
    this.bufferArray(
      this.axesBuffer,
      this.gl.ARRAY_BUFFER,
      axisVertices(100),
      this.gl.STATIC_DRAW,
      Float32Array
    );
    this.bufferArray(
      this.riemannBuffer,
      this.gl.ARRAY_BUFFER,
      riemannVertices,
      this.gl.STATIC_DRAW,
      Float32Array
    );

    this.bufferArray(
      this.gridBuffer,
      this.gl.ARRAY_BUFFER,
      gridVertices([-100, 100], [-100, 100], 1).flat(),
      this.gl.STATIC_DRAW,
      Float32Array
    );
  }

  populateIndexBuffer(index_array) {
    this.bufferArray(
      this.indexBuffer,
      this.gl.ELEMENT_ARRAY_BUFFER,
      index_array,
      this.gl.STATIC_DRAW,
      Uint16Array
    );
  }

  populateNormalBuffer(normals_array) {
    this.bufferArray(
      this.normalBuffer,
      this.gl.ARRAY_BUFFER,
      normals_array,
      this.gl.STATIC_DRAW,
      Uint16Array
    );
  }

  initCamera() {
    this.cameraPos = [0, 0, this.intervals[2][1] * 10]; // Camera position
    this.cameraTarget = [0, 0, 0]; // Target point (where the camera looks)
    this.cameraUp = [0, 11, 0]; // Up direction
  }

  buildView(pos, up, target = ORIGIN) {
    this.cameraPos = pos;
    this.cameraTarget = target;

    
    try {
      mat4.lookAt(
        this.viewMatrix,
        this.cameraPos,
        this.cameraTarget,
        up
      );
    } catch (error) {
      console.error("Error in mat4.lookAt:", error);
      throw error; 
    }
  }

  checkProgram() {
    //console.log('my Program:', this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error("Program link error:", this.gl.getProgramInfoLog(program));
    }

    const uProjectionMatrix = this.gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );
    const uViewMatrix = this.gl.getUniformLocation(this.program, "viewMatrix");

    if (!uProjectionMatrix || !uViewMatrix) {
      console.error("Error fetching uniform locations.");
    }
  }
  draw(vertexBuffer, indices, mode, color, lighting = false, normals = null) {
    const colorPos = this.gl.getUniformLocation(this.program, "objectColor");
    this.gl.uniform4fv(colorPos, color);
    this.populateIndexBuffer(indices);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    const positionAttribLocation = this.gl.getAttribLocation(
      this.program,
      "position"
    );
    this.gl.vertexAttribPointer(
      positionAttribLocation,
      3,
      this.gl.FLOAT,
      false,
      3 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    this.gl.enableVertexAttribArray(positionAttribLocation);

    const lloc = this.gl.getUniformLocation(this.program, "lighting");
    if (lighting) {
      this.gl.uniform1i(lloc, lighting);
      this.populateNormalBuffer(normals);
    }

    this.gl.drawElements(mode, indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  setupMatrices() {
    
    const projectionMatrixLocation = this.gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );
    this.gl.uniformMatrix4fv(
      projectionMatrixLocation,
      false,
      this.projectionMatrix
    );

    const viewMatrixLocation = this.gl.getUniformLocation(
      this.program,
      "viewMatrix"
    );
    this.gl.uniformMatrix4fv(viewMatrixLocation, false, this.viewMatrix);
    //
  }


  handle_inputs(inputs) {
    inputs.xrects = handle_string_num(inputs.xrects);
    inputs.yrects = handle_string_num(inputs.yrects);
    inputs.x1 = handle_string_num(inputs.x1);
    inputs.x2 = handle_string_num(inputs.x2);
    inputs.y1 = handle_string_num(inputs.y1);
    inputs.y2 = handle_string_num(inputs.y2);
    return inputs
  }

  draw_all(graphData, riemannData, inputs) {
    this.draw(this.gridBuffer, lineIndices(804), this.gl.LINES, BLACK);
    this.draw(this.axesBuffer, lineIndices(6), this.gl.LINES, LINE_COLOR);
    this.draw(
      this.vertexBuffer,
      graphData.indices,
      this.gl.TRIANGLES,
      GRAPH_COLOR
    );
    if (inputs.sum) {
      
      this.draw(
        this.riemannBuffer,
        riemannData.rectIndices,
        this.gl.TRIANGLES,
        PRISM_COLOR,
        false,
        riemannPrismNormals(riemannData.amount)
      );

      this.draw(
        this.riemannBuffer,
        riemannData._lineIndices,
        this.gl.LINES,
        LINE_COLOR
      );
    }
  }

  render(graph, xDrag, yDrag) {
    //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.useProgram(this.program);
    if (isDragging || isTouching) {
      xDrag += deltaX;
      yDrag += deltaY;
    }
    let inputs = get_inputs();
    inputs = this.handle_inputs(inputs);


    // construct the view matrix
    let radius = this.intervals[2][1] * 5-inputs.zoom;
    this.buildView([
      radius * Math.cos(3*xDrag) * Math.sin(3*yDrag),
      radius * Math.cos(3*yDrag),
      radius * Math.sin(3*xDrag) * Math.sin(3*yDrag)
    ], [0, 1, 0]);
    //
    this.setupMatrices();

    let graphData = this.builder.buildGraph(
      this.intervals[0],
      this.intervals[2]
    );
    let riemannData = this.builder.buildRiemann(
      [inputs.x1, inputs.x2],
      [inputs.y1, inputs.y2],
      inputs.xrects,
      inputs.yrects,
      eval(inputs.sumType)
    );
    

    this.populateVertexBuffers(graphData.vertices, riemannData.vertices);
    this.draw_all(graphData, riemannData, inputs);

    try {
      graph.updateFunc(inputs.func);
    } catch {
      console.log("Not today!");
    }
    requestAnimationFrame(() => this.render(graph, xDrag, yDrag));
  }

  mainloop(graph) {
    this.gl.clearColor(...WHITE);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);


    this.render(graph, Math.PI/8, Math.PI/2 + Math.PI/16);
  }
}

function main() {
  let mygraph = new FunctionGraph("\\sqrt{x^2+y^2}");
  let controller = new MyOpenGLController(
    [
      [-20, 20],
      [-20, 20],
      [-20, 20],
    ],
    mygraph
  );
  controller.mainloop(mygraph);
}

// still my guitar gently weeps
main();
