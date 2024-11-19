

const SAMPLE_RATE = 20


function get_func() {
    let input = document.getElementById("funcinput");
    return input.value;
}


class MyOpenGLController {

    constructor(intervals) {
        this.intervals = intervals
        this.getContext();
        this.initShaderSrc();
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        this.initProgram();
        this.initMatrices();
        this.initBuffers();
        this.initCamera();
    }

    getContext() {
        this.canvas = document.getElementById('plotCanvas');
        this.gl = this.canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error('WebGL is not supported, try changing your browser');
        }
    }

    initShaderSrc() {
        this.vertexShaderSource = `
            attribute vec3 position;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            varying vec4 v_color;
    
            void main() {
                // Normalize the y position in the range [-5, 5] to [0, 1]
                float normalizedY = (position.x + 5.0) / 10.0;  // (-5 to 5) maps to (0 to 1)

                // Set the color with the normalized y value affecting the b component
                v_color = vec4(1.0, normalizedY, normalizedY, 1.0);

                // Transform the vertex position with the model, view, and projection matrices
                gl_Position = projectionMatrix * viewMatrix * modelViewMatrix * vec4(position, 1.0);
}
        `;
    
    
        this.fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
    
            void main() {
                gl_FragColor = v_color;
            }
        `;
    
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initMatrices() {
        this.fieldOfView = 45 * Math.PI / 180; // in radians
        this.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 100.0;
    
        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);
    
        this.modelViewMatrix = mat4.create();
        mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [-0.0, 0.0, -6.0]);
    
        this.viewMatrix = mat4.create();
    }
    
    initProgram() {
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        this.gl.linkProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link failed:', this.gl.getProgramInfoLog(this.program));
        }
    }

    initBuffers() {
        this.vertexBuffer = this.gl.createBuffer();
        this.indexBuffer = this.gl.createBuffer();
        this.axesBuffer = this.gl.createBuffer()
        
    }

    populateBuffers(vertices, indices) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(axisVertices(100)), this.gl.STATIC_DRAW);
        //console.log(axisVertices(...this.intervals), "wowww");
    }
    

    initCamera() {
        this.cameraPos = [0, 0, this.intervals[2][1]*10]; // Camera position
        this.cameraTarget = [0, 0, 0];    // Target point (where the camera looks)
        this.cameraUp = [0, 1, 0];        // Up direction
    }

    buildView(pos, target=ORIGIN) {
        this.cameraPos = pos
        this.cameraTarget = target

        // Update view matrix
        try {
            mat4.lookAt(this.viewMatrix, this.cameraPos, this.cameraTarget, this.cameraUp);
        } catch (error) {
            console.error('Error in mat4.lookAt:', error);
            //console.log('Inputs: CameraPos:', this.cameraPos, 'Target:', this.cameraTarget, 'Up:', this.cameraUp);
            throw error; // Re-throw to stop execution
        }
    }

    tesellateGraph(graph) {
        const rate = SAMPLE_RATE;
        let xinterval = this.intervals[0];
        let zinterval = this.intervals[2];
        const vertices = graph.sample(xinterval, zinterval, rate).flat()
        let samplesX = (xinterval[1]-xinterval[0])*rate + 1
        let samplesZ = (zinterval[1]-zinterval[0])*rate + 1
        
        // Generate indices for grid tessellation
        // Example indices for two triangles forming a quad
        const indices = tesellation(samplesX, samplesZ)
    
        return { vertices, indices };
    }

    checkProgram() {
        console.log('my Program:', this.program);
    
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
        }
        
        const uModelViewMatrix = this.gl.getUniformLocation(this.program, 'modelViewMatrix');
        const uProjectionMatrix = this.gl.getUniformLocation(this.program, 'projectionMatrix');
        const uViewMatrix = this.gl.getUniformLocation(this.program, 'viewMatrix');
    
        if (!uModelViewMatrix || !uProjectionMatrix || !uViewMatrix) {
            console.error('Error fetching uniform locations.');
        }
    
    }

    drawVertices(indices) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    
        const positionAttribLocation = this.gl.getAttribLocation(this.program, "position");
        this.gl.vertexAttribPointer(positionAttribLocation, 3, this.gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
        this.gl.enableVertexAttribArray(positionAttribLocation);
        
        // Draw the vertices using indexed elements
        this.gl.drawElements(this.gl.TRIANGLES, indices, this.gl.UNSIGNED_SHORT, 0);
        //console.log("Drawing vertices", indices);
        //
    }
    

    drawAxes() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axesBuffer)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,
             new Uint16Array([0, 1, 2, 3, 4, 5]), this.gl.STATIC_DRAW);
        
        
        const positionAttribLocation = this.gl.getAttribLocation(this.program, "position");
        this.gl.vertexAttribPointer(positionAttribLocation, 3, 
            this.gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
        this.gl.enableVertexAttribArray(positionAttribLocation);
        
        // Draw the axes
        this.gl.drawElements(this.gl.LINES, 6, this.gl.UNSIGNED_SHORT, 0)
        //
    }

    setupMatrices() {
        // Set the uniform matrices
        const projectionMatrixLocation = this.gl.getUniformLocation(this.program, "projectionMatrix");
        this.gl.uniformMatrix4fv(projectionMatrixLocation, false, this.projectionMatrix);
    
        const modelViewMatrixLocation  = this.gl.getUniformLocation(this.program, "modelViewMatrix");
        this.gl.uniformMatrix4fv(modelViewMatrixLocation, false, this.modelViewMatrix);
    
        const viewMatrixLocation = this.gl.getUniformLocation(this.program, "viewMatrix");
        this.gl.uniformMatrix4fv(viewMatrixLocation, false, this.viewMatrix);
        //
    }
    
    renderGraph(graph, angle) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.program);


        // construct the view matrix
        let radius = this.intervals[2][1]*5
        this.buildView([radius * Math.cos(angle), 50, radius * Math.sin(angle)]);
        //

        this.setupMatrices();
        let data = this.tesellateGraph(graph);
        //console.log(data.vertices, data.indices)
        this.populateBuffers(data.vertices, data.indices);
        this.drawVertices(data.indices.length);
        this.drawAxes();
        //console.log("camera position:", this.cameraPos)
        try {
            graph.update_func(get_func());
        } catch {   
            console.log("Not today!")
        }
        
    
        requestAnimationFrame(() => this.renderGraph(graph, angle+0.01));
    }

    mainloop(graph) {
        // do stuff here
        //
        this.renderGraph(graph, 0)
    }

}



function main() {
    let controller = new MyOpenGLController([[-5, 5], [-5, 5], [-5, 5]]);
    let mygraph = new FunctionGraph("x+z");
    controller.mainloop(mygraph);
}

// still my guitar gently weeps
main();
