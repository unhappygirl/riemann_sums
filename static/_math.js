
const ORIGIN = [0, 0, 0]

const TRAPEZOIDAL = 38
const LEFT = 39
const RIGHT = 40
const MIDDLE = 79

class FunctionGraph {
    constructor(expr) {
        this.expr = expr
        this.func = this.parse(this.expr)
    }

    bounds(xinterval, zinterval) {
        var lx, ux, lz, uz;
        var [lx, ux] = xinterval
        var [lz, uz] = zinterval
        return {lx, ux, lz, uz}
    }

    isImplicit() {
        return this.expr.includes("=");
    }

    riemannTypeResolution(point, dx, dz, type) {
        let [x, z] = point
        let height;
        switch (type) {
            case TRAPEZOIDAL:
                tp = 1;
        
            case RIGHT:
                height = this.func(x+dx, z+dz);
                break;
            
            case MIDDLE:
                height = this.func(x+dx/2, z+dz/2);
                break;

            default:
                height = this.func(x, z);
        }
        return height;
    }

    parse(expr) {
        try {
            eval(`(x, z) => ${expr}`)(0, 0)
        } catch {
            return this.func
        }
        return eval(`(x, z) => ${expr}`)
    }

    updateFunc(expr) {
        this.expr = expr
        if (!this.isImplicit()) {
            this.func = this.parse(expr)
        }
    }

    nonImplicitSample(xinterval, zinterval, rate) {
        let d = 1 / rate
        let samples = [];
        const _bounds = this.bounds(xinterval, zinterval);
        for (let x = _bounds.lx; x < _bounds.ux; x += d) {
            for (let z = _bounds.lz; z < _bounds.uz; z += d) {
                samples.push([x, this.func(x, z), z])

            }
        }
        return samples;
    }

    implicitSample(xinterval, zinterval, rate) {
        return [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6];
    }

    sample(...args) {
        if (!this.isImplicit()) {
            return this.nonImplicitSample(...args);
        }
        return this.implicitSample(...args);
    }

    riemannPrisms(xinterval, zinterval, xrate, zrate, type) {
        const dx = 1 / xrate
        const dz = 1 / zrate
        let vertices = [];
        const _bounds = this.bounds(xinterval, zinterval);
        let volume = 0;
        for (let x = _bounds.lx; x < _bounds.ux; x += dx) {
            for (let z = _bounds.lz; z < _bounds.uz; z += dz) {
                let h = this.riemannTypeResolution([x, z], dx, dz, type)
                volume += dx*dz*h;
                for (let n = 0; n < 2; n++) {    
                    vertices.push([x, h*n, z],
                             [x+dx, h*n, z],
                             [x+dx, h*n, z+dz],
                             [x, h*n, z+dz],
                    )
                }
            }
        }
        return {vertices, volume};
    }
}



// 
function graphTesellation(samplesX, samplesY) {
    let indices = [];
    for (let i = 0; i < samplesX - 1; i++) {
        for (let j = 0; j < samplesY - 1; j++) {
            const i0 = i * samplesY + j;
            const i1 = i0 + 1;
            const i2 = (i + 1) * samplesY + j;
            const i3 = i2 + 1;

            // Two triangles per quad
            indices.push(i0, i1, i2);
            indices.push(i2, i1, i3);
        }
    }
    return indices;
}

function rectPrismTesellation(rectAmount) {
    let indices = [];
    let normals = [];
    for (let i = 0; i < rectAmount; i++) {
        const offset = i * 8; // Each prism has 8 vertices (4 bottom + 4 top)

        // Bottom face
        indices.push(offset + 0, offset + 1, offset + 2);
        indices.push(offset + 0, offset + 2, offset + 3);
        // 

        // Top face
        indices.push(offset + 4, offset + 5, offset + 6);
        indices.push(offset + 4, offset + 6, offset + 7);
        // 

        // Front face
        indices.push(offset + 0, offset + 1, offset + 5);
        indices.push(offset + 0, offset + 5, offset + 4);
        // 

        // Back face
        indices.push(offset + 2, offset + 3, offset + 7);
        indices.push(offset + 2, offset + 7, offset + 6);

        // Left face
        indices.push(offset + 0, offset + 3, offset + 7);
        indices.push(offset + 0, offset + 7, offset + 4);

        // Right face
        indices.push(offset + 1, offset + 2, offset + 6);
        indices.push(offset + 1, offset + 6, offset + 5);
    }
    return indices;
}

function riemannPrismNormals(rectAmount) {
    let normals = [];
    for (let _ = 0; _ < rectAmount; _++) {
        normals.push([
            [0, -1, 0],
            [0,  1, 0],
            [0,  0, 1],
            [0,  0, -1],
            [-1, 0, 0],
            [1, 0, 0],
        ])
    }
}



function riemannPrismEdgeIndices(vertices) {
    let indices = [];
    const numVerticesPerPrism = 8; // 8 vertices per prism

    for (let i = 0; i < vertices.length; i += numVerticesPerPrism) {
        const offset = i;

        // Bottom face edges (vertices 0, 1, 2, 3)
        indices.push(offset + 0, offset + 1); // 0 -> 1
        indices.push(offset + 1, offset + 2); // 1 -> 2
        indices.push(offset + 2, offset + 3); // 2 -> 3
        indices.push(offset + 3, offset + 0); // 3 -> 0

        // Top face edges (vertices 4, 5, 6, 7)
        indices.push(offset + 4, offset + 5); // 4 -> 5
        indices.push(offset + 5, offset + 6); // 5 -> 6
        indices.push(offset + 6, offset + 7); // 6 -> 7
        indices.push(offset + 7, offset + 4); // 7 -> 4

        // Vertical edges (connecting top and bottom layers)
        indices.push(offset + 0, offset + 4); // 0 -> 4
        indices.push(offset + 1, offset + 5); // 1 -> 5
        indices.push(offset + 2, offset + 6); // 2 -> 6
        indices.push(offset + 3, offset + 7); // 3 -> 7
    }

    return indices;
}


function axisVertices(scaler) {
    const axisPoints = [
    
    1, 0, 0,
   -1, 0, 0, 
    0, 1, 0, 
    0,-1, 0, 
    0, 0, 1, 
    0, 0, -1
    ];
    
    return axisPoints.map((e) => e*scaler);
}

function lineIndices(length) {
    if (length % 2 != 0) {
        length -= 1
    }
    return [...Array(length).keys()]
}

function intervalLength(interval) {
    return interval[1] - interval[0]
}

function getNormal(p1, p2, p3) {
    return math.matrix([2, 3, 4])
}