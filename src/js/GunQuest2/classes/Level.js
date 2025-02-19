import * as THREE from "three";
import { generateUUID, getMapPosition } from "../js/utility";

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
        this.renderObjects(this.config.staticObjects.objects);
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

  renderObjects(objectGroups) {
    Object.entries(objectGroups).forEach(([k, v]) => {
      switch (k) {
        case "perimeters":
          this.renderPerimeters(v);
          break;

        case "default_walls":
          this.renderDefaultWalls(v);
          break;

        default:
          break;
      }
    });
  }

  renderPerimeters(perimeters) {
    perimeters.forEach((perimeter) => {
      // Build Material
      const { albedo, normal, roughness, metallic, ao, height } = {
        ...this.textures[perimeter.texturePack],
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

      // Build geometry and set rotation / position of perimeters
      const geometry = new THREE[perimeter.geometryType](
        ...Object.values({ ...perimeter.dimensions })
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...Object.values(perimeter.position));
      if (perimeter.rotation)
        mesh.rotation.set(...Object.values(perimeter.rotation));

      // Manage collision rules
      if (perimeter.collision) {
        Object.keys(perimeter.collision).forEach((subject) => {
          if (subject) {
            mesh.collision = { ...mesh.collision, [subject]: true };
          }
        });
      }

      this.scene.add(mesh);
    });
  }

  renderDefaultWalls(walls) {
    walls.forEach((wall, i) => {
      const wallConfig = {
        id: `uuid_wall_${generateUUID()}`,
        wallTexturePack: "wall001",
        geometryType: "BoxGeometry",
        size: { x: 2.4, y: 2.4, z: 2.4 },
        collision: {
          Player: true,
          Enemy: true,
        },
      };

      const { albedo, normal, roughness, metallic, ao, height } = {
        ...this.textures[wallConfig.wallTexturePack],
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

      const geometry = new THREE[wallConfig.geometryType](
        ...Object.values({
          x: wallConfig.size.x,
          y: wallConfig.size.y,
          z: wallConfig.size.z,
        })
      );
      const newPlanePosition = getMapPosition(wall[0], wall[1]);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...Object.values(newPlanePosition));
      if (wallConfig.collision) {
        Object.keys(wallConfig.collision).forEach((subject) => {
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
