
const ORIGIN = [0, 0, 0]

class FunctionGraph {
    expr;
    xy_func;

    constructor(expr) {
        this.expr = expr
        this.xz_func = this.parse(this.expr)
    }

    parse(expr) {
        console.log(expr)
        return eval(`(x, z) => ${expr}`)
    }

    update_func(expr) {
        this.xz_func = this.parse(expr)
    }

    sample(xinterval, zinterval, rate) {
        var inc = 1 / rate
        var samples = [];
        var lx, ux, lz, uz;
        var [lx, ux] = xinterval
        var [lz, uz] = zinterval
        for (let i = lx; i < ux; i += inc) {

            for (let j = lz; j < uz; j += inc) {
                samples.push([i, this.xz_func(i, j), j])

            }
        }
        return samples;
    }
}


function tesellation(samplesX, samplesY) {
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

function riemann_prisms(samples, rate) {

}

function axisVertices(scaler) {
    const axisPoints = [
    1, 0, 0,
    -1, 0, 0, 
    0, 1, 0, 
    0, -1, 0, 
    0, 0, 1, 
    0, 0, -1
    ];
    console.log(axisPoints.map((e) => e*scaler))
    return axisPoints.map((e) => e*scaler);
}