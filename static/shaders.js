

vertexShader = `
            attribute vec3 position;
            attribute vec3 normal;

            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            uniform vec3 lightDirection; // Direction of the light source, in world coordinates
            uniform vec4 objectColor;    // Base color of the object
            uniform bool interpolate;

            varying vec4 v_color;

            void main() {
                vec4 lightColor = vec4(1.0, 1.0, 1.0, 1.0); // White light
                // Transform the normal to world space
                vec3 transformedNormal = mat3(viewMatrix) * normal;
                transformedNormal = normalize(transformedNormal);

                // Normalize the light direction
                vec3 normalizedLightDir = normalize(lightDirection);

                // Compute the diffuse lighting factor (Lambertian reflectance)
                float diffuseFactor = max(dot(transformedNormal, -normalizedLightDir), 0.0);

                // Compute the final color
                vec4 diffuseColor = diffuseFactor * lightColor;
                v_color = objectColor;

                // Transform the vertex position
                gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
            }
`;

fragmentShader = `
        precision mediump float;
        varying vec4 v_color;

        void main() {
            gl_FragColor = v_color;
        }
`;