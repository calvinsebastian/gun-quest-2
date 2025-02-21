import * as THREE from "three";
import PF from "pathfinding";
import { generateNavGrid, generateUUID, getMapPosition } from "../js/utility";

export class Level {
  constructor(scene, renderer, loadingManager, levelConfig) {
    this.scene = scene;
    this.gridSize = 39;
    this.occupiedCells = {};
    this.renderer = renderer;
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
        this.navGrid = generateNavGrid(this.gridSize, this.occupiedCells);
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
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.anisotropy = Math.min(
                  this.renderer.capabilities.getMaxAnisotropy(),
                  4
                );

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
        case "ceilings":
          this.renderCeilings(v);
          break;

        case "floors":
          this.renderFloors(v);
          break;

        case "perimeter_walls":
          this.renderPerimeterWalls(v);
          break;

        case "default_walls":
          this.renderDefaultWalls(v);
          break;

        default:
          break;
      }
    });
  }

  renderCeilings(ceilings) {
    ceilings.forEach((ceiling) => {
      // Build Material
      const { albedo, normal, roughness, metallic, ao, height } = {
        ...this.textures[ceiling.texturePack],
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

      // Build geometry and set rotation / position of ceilings
      const geometry = new THREE[ceiling.geometryType](
        ...Object.values({ ...ceiling.dimensions })
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...Object.values(ceiling.position));
      if (ceiling.rotation)
        mesh.rotation.set(...Object.values(ceiling.rotation));

      // Manage collision rules
      if (ceiling.collision) {
        Object.keys(ceiling.collision).forEach((subject) => {
          if (subject) {
            mesh.collision = { ...mesh.collision, [subject]: true };
          }
        });
      }

      this.scene.add(mesh);
    });
  }

  renderFloors(floors) {
    floors.forEach((floor) => {
      // Build Material
      const { albedo, normal, roughness, metallic, ao, height } = {
        ...this.textures[floor.texturePack],
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

      // Build geometry and set rotation / position of floors
      const geometry = new THREE[floor.geometryType](
        ...Object.values({ ...floor.dimensions })
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...Object.values(floor.position));
      if (floor.rotation) mesh.rotation.set(...Object.values(floor.rotation));

      // Manage collision rules
      if (floor.collision) {
        Object.keys(floor.collision).forEach((subject) => {
          if (subject) {
            mesh.collision = { ...mesh.collision, [subject]: true };
          }
        });
      }

      this.scene.add(mesh);
    });
  }

  renderPerimeterWalls(perimeterWalls) {
    perimeterWalls.forEach((perimeterWall) => {
      // Build Material

      const { albedo, normal, roughness, metallic, ao, height } = {
        ...this.textures[perimeterWall.texturePack],
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
      const geometry = new THREE[perimeterWall.geometryType](
        ...Object.values({ ...perimeterWall.dimensions })
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...Object.values(perimeterWall.position));
      if (perimeterWall.rotation)
        mesh.rotation.set(...Object.values(perimeterWall.rotation));

      // Manage collision rules
      if (perimeterWall.collision) {
        Object.keys(perimeterWall.collision).forEach((subject) => {
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
      this.occupiedCells[`${wall[0]},${wall[1]}`] = { wall: true };
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

      const { albedo, alt, alt2, normal, roughness, metallic, ao, height } = {
        ...this.textures[wallConfig.wallTexturePack],
      };

      const material = new THREE.MeshStandardMaterial({
        map:
          wall[0].toString().includes("6") && wall[1].toString().includes("6")
            ? alt
            : wall[0].toString().includes("5") &&
              wall[1].toString().includes("5")
            ? alt2
            : albedo,
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

  getPath(start, end) {
    const finder = new PF.AStarFinder();
    const gridClone = this.navGrid.clone(); // Clone the grid to avoid modifying the original

    // Use grid positions as the starting point and end point for pathfinding
    const path = finder.findPath(start.x, start.z, end.x, end.z, gridClone);

    // Convert path from grid coordinates to world coordinates (center of each grid cell)
    return path.map(([x, z]) => {
      // Get the world position of the center of each grid cell
      const worldPos = getMapPosition(x, z);
      return {
        x: worldPos.x,
        y: 1, // Assuming constant height for simplicity
        z: worldPos.z,
      };
    });
  }

  update() {
    console.log("updating");
    // Additional updates will go here
  }
}
