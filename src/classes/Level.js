import * as THREE from "three";
import { walls } from "../variables/walls.js";

export class Level {
  constructor(scene, loadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager; // Pass the loading manager
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);

    // Texture paths for floor, wall, and ceiling
    this.floorTexturesPaths = {
      albedo: "/assets/textures/floor1/brown_planks_03_diff_4k.jpg",
      normal: "/assets/textures/floor1/brown_planks_03_nor_dx_4k.jpg",
      roughness: "/assets/textures/floor1/brown_planks_03_rough_4k.jpg",
      metallic: "/assets/textures/floor1/brown_planks_03_nor_gl_4k.jpg",
      ao: "/assets/textures/floor1/brown_planks_03_ao_4k.jpg",
      height: "/assets/textures/floor1/brown_planks_03_disp_4k.jpg",
    };

    this.wallTexturesPaths = {
      albedo: "/assets/textures/wall1/random_bricks_thick_diff_4k.jpg",
      normal: "/assets/textures/wall1/random_bricks_thick_nor_dx_4k.jpg",
      roughness: "/assets/textures/wall1/random_bricks_thick_rough_4k.jpg",
      metallic: "/assets/textures/wall1/random_bricks_thick_nor_gl_4k.jpg",
      ao: "/assets/textures/wall1/random_bricks_thick_ao_4k.jpg",
      height: "/assets/textures/wall1/random_bricks_thick_disp_4k.jpg",
    };

    this.ceilingTexturesPaths = {
      albedo: "/assets/textures/ceiling1/OfficeCeiling001_4K_Color.jpg",
      normal: "/assets/textures/ceiling1/OfficeCeiling001_4K_NormalDX.jpg",
      roughness: "/assets/textures/ceiling1/OfficeCeiling001_4K_Roughness.jpg",
      metallic: "/assets/textures/ceiling1/OfficeCeiling001_4K_Metalness.jpg",
      ao: "/assets/textures/ceiling1/OfficeCeiling001_4K_AmbientOcclusion.jpg",
      height: "/assets/textures/ceiling1/OfficeCeiling001_4K_Displacement.jpg",
    };

    // Placeholder for textures
    this.floorTextures = {};
    this.wallTextures = {};
    this.ceilingTextures = {};

    // Load textures first
    this.loadTextures()
      .then(() => {
        // Textures loaded, now create the level
        this.createFloor();
        this.createCeiling();
        this.createWalls(walls["room_1"]);
      })
      .catch((error) => {
        console.error("Error loading textures:", error);
      });
  }

  loadTextures() {
    const texturePromises = [];

    // Load floor textures
    for (const [key, path] of Object.entries(this.floorTexturesPaths)) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            path,
            (texture) => {
              this.floorTextures[key] = texture;
              this.setTextureRepeating(texture, 96, 96, 2.4);
              resolve(texture);
            },
            undefined,
            (error) =>
              reject(new Error(`Failed to load floor texture: ${path}`))
          );
        })
      );
    }

    // Load wall textures
    for (const [key, path] of Object.entries(this.wallTexturesPaths)) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            path,
            (texture) => {
              this.wallTextures[key] = texture;
              this.setTextureRepeating(texture, 10, 2.4, 2.4);
              resolve(texture);
            },
            undefined,
            (error) => reject(new Error(`Failed to load wall texture: ${path}`))
          );
        })
      );
    }

    // Load ceiling textures
    for (const [key, path] of Object.entries(this.ceilingTexturesPaths)) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            path,
            (texture) => {
              this.ceilingTextures[key] = texture;
              this.setTextureRepeating(texture, 48, 48, 2.4);
              resolve(texture);
            },
            undefined,
            (error) =>
              reject(new Error(`Failed to load ceiling texture: ${path}`))
          );
        })
      );
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

  createFloor() {
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: this.floorTextures.albedo,
      normalMap: this.floorTextures.normal,
      roughnessMap: this.floorTextures.roughness,
      metalnessMap: this.floorTextures.metallic,
      aoMap: this.floorTextures.ao,
      displacementMap: this.floorTextures.height,
      displacementScale: 0.1,
      side: THREE.DoubleSide,
    });

    const floorGeometry = new THREE.PlaneGeometry(96, 96);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);
  }

  createCeiling() {
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: this.ceilingTextures.albedo,
      normalMap: this.ceilingTextures.normal,
      roughnessMap: this.ceilingTextures.roughness,
      metalnessMap: this.ceilingTextures.metallic,
      aoMap: this.ceilingTextures.ao,
      displacementMap: this.ceilingTextures.height,
      displacementScale: 0.1,
      side: THREE.DoubleSide,
    });

    const ceilingGeometry = new THREE.PlaneGeometry(96, 96);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 2.4;
    this.scene.add(ceiling);
  }

  createWalls(walls) {
    console.log("creating walls", walls);

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: this.wallTextures.albedo,
      normalMap: this.wallTextures.normal,
      roughnessMap: this.wallTextures.roughness,
      metalnessMap: this.wallTextures.metallic,
      aoMap: this.wallTextures.ao,
      displacementMap: this.wallTextures.height,
      displacementScale: 0.05,
      side: THREE.DoubleSide,
    });

    walls.map((w, i) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(...Object.values(w.size)),
        wallMaterial
      );

      wall.position.set(...Object.values(w.position));
      wall.isWall = true;
      this.scene.add(wall);
    });
  }

  update() {
    // Additional updates will go here
  }
}
