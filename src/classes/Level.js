import * as THREE from "three";

export class Level {
  constructor(scene, loadingManager, levelConfig) {
    this.scene = scene;
    this.loadingManager = loadingManager;
    this.config = levelConfig;

    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.texturePaths = {};
    this.textures = {};
  }

  async load() {
    this.populateTexturePaths();
    this.loadTextures()
      .then(() => {
        // Textures loaded, now populate basic planes
        this.renderPlanes(this.config.staticObjects.planes);
      })
      .catch((error) => {
        console.error("Error loading textures:", error);
      });
  }

  populateTexturePaths() {
    for (const [k, v] of Object.entries(this.config.textures)) {
      for (const [key, path] of Object.entries(v)) {
        this.texturePaths[k] = { [key]: path };
      }
    }
  }

  loadTextures() {
    const texturePromises = [];

    // Load floor textures
    for (const [k, v] of Object.entries(this.texturePaths)) {
      for (const [key, path] of Object.entries(v.paths)) {
        texturePromises.push(
          new Promise((resolve, reject) => {
            this.textureLoader.load(
              path,
              (texture) => {
                this.textures[k] = { ...this.textures[k], [key]: texture };
                const { length, height, repeatValue } =
                  this.config.textures[k].repeating;
                this.setTextureRepeating(texture, length, height, repeatValue);
                resolve(texture);
              },
              undefined,
              (error) => reject(new Error(`Failed to load texture: ${path}`))
            );
          })
        );
      }
    }

    return Promise.all(texturePromises); // Wait until all textures are loaded
  }

  setTextureRepeating(texture, length, height, repeatValue) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const repeatX = length / repeatValue;
    const repeatY = height / repeatValue;

    texture.repeat.set(repeatX, repeatY);
  }

  renderPlanes(planes) {
    planes.forEach((plane) => {
      // Build Material

      const { albedo, normal, roughness, metallic, ao, height } = {
        ...this.textures[plane.texturePack],
      };
      const material = new THREE.MeshStandardMaterial({
        map: albedo,
        normalMap: normal,
        roughnessMap: roughness,
        metalnessMap: metallic,
        aoMap: ao,
        displacementMap: height,
        displacementScale: 0,
        side: THREE.FrontSide,
      });

      // Build Geometry

      const geometry = new THREE[plane.geometryType](
        ...Object.values({ ...plane.dimensions })
      );

      // Build Mesh
      const mesh = new THREE.Mesh(geometry, material);

      // Set rotation and position of planes
      if (plane.rotation) mesh.rotation.set(...Object.values(plane.rotation));
      mesh.position.set(...Object.values(plane.position));

      // Seperate
      if (plane.collision) {
        Object.keys(plane.collision).forEach((subject) => {
          if (subject) {
            mesh.collision = { ...mesh.collision, [subject]: true };
          }
        });
      }
      this.scene.add(mesh);
    });
  }

  update() {
    console.log("updating");
    // Additional updates will go here
  }
}
