export const views = {
  test: {
    cameras: [
      {
        label: "mainCamera",
        type: "PerspectiveCamera",
        fov: 50,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100,
        position: {
          x: 25,
          y: 25,
          z: 25,
        },
        focusPoint: {
          x: 0,
          y: 5,
          z: 0,
        },
      },
    ],
    lights: [
      {
        label: "ambientLight",
        type: "AmbientLight",
        color: 0x404040,
        intensity: 0.4,
      },
    ],
    level: {
      textures: {
        wall001: {
          repeating: {
            length: 1.2,
            height: 1.2,
            repeatValue: 1.2,
          },
          paths: {
            albedo:
              "/assets/textures/walls/wall001/random_bricks_thick_diff_4k.jpg",
            normal:
              "/assets/textures/walls/wall001/random_bricks_thick_nor_dx_4k.jpg",
            roughness:
              "/assets/textures/walls/wall001/random_bricks_thick_rough_4k.jpg",
            metallic:
              "/assets/textures/walls/wall001/random_bricks_thick_nor_gl_4k.jpg",
            ao: "/assets/textures/walls/wall001/random_bricks_thick_ao_4k.jpg",
            height:
              "/assets/textures/walls/wall001/random_bricks_thick_disp_4k.jpg",
          },
        },
        ceiling001: {
          repeating: {
            length: 96,
            height: 96,
            repeatValue: 4.8,
          },
          paths: {
            albedo:
              "/assets/textures/ceilings/ceiling001/OfficeCeiling001_4K_Color.jpg",
            normal:
              "/assets/textures/ceilings/ceiling001/OfficeCeiling001_4K_NormalDX.jpg",
            roughness:
              "/assets/textures/ceilings/ceiling001/OfficeCeiling001_4K_Roughness.jpg",
            metallic:
              "/assets/textures/ceilings/ceiling001/OfficeCeiling001_4K_Metalness.jpg",
            ao: "/assets/textures/ceilings/ceiling001/OfficeCeiling001_4K_AmbientOcclusion.jpg",
            height:
              "/assets/textures/ceilings/ceiling001/OfficeCeiling001_4K_Displacement.jpg",
          },
        },
        floor001: {
          repeating: {
            length: 96,
            height: 96,
            repeatValue: 2.4,
          },
          paths: {
            albedo:
              "/assets/textures/floors/floor001/brown_planks_03_diff_4k.jpg",
            normal:
              "/assets/textures/floors/floor001/brown_planks_03_nor_dx_4k.jpg",
            roughness:
              "/assets/textures/floors/floor001/brown_planks_03_rough_4k.jpg",
            metallic:
              "/assets/textures/floors/floor001/brown_planks_03_nor_gl_4k.jpg",
            ao: "/assets/textures/floors/floor001/brown_planks_03_ao_4k.jpg",
            height:
              "/assets/textures/floors/floor001/brown_planks_03_disp_4k.jpg",
          },
        },
      },
      staticObjects: {
        planes: [
          {
            id: "uuid_floor_0001",
            texturePack: "floor001",
            type: "floor",
            geometryType: "PlaneGeometry",
            dimensions: { width: 96, height: 96 },
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
          },
          {
            id: "uuid_ceiling_0001",
            texturePack: "ceiling001",
            type: "ceiling",
            geometryType: "PlaneGeometry",
            dimensions: { width: 96, height: 96 },
            position: { x: 0, y: 2.4, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
          },
          {
            id: "uuid_wall_0001",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: {
              width: 2.4,
              height: 2.4,
              depth: 2.4,
            },
            position: { x: 0, y: 1.2, z: -48 },
          },
          {
            id: "uuid_wall_0002",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: {
              width: 2.4,
              height: 2.4,
              depth: 2.4,
            },
            position: { x: 48, y: 1.2, z: 0 },
          },
          {
            id: "uuid_wall_0003",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: {
              width: 2.4,
              height: 2.4,
              depth: 2.4,
            },
            position: { x: 0, y: 1.2, z: 48 },
          },
          {
            id: "uuid_wall_0004",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: {
              width: 2.4,
              height: 2.4,
              depth: 2.4,
            },
            position: { x: -48, y: 1.2, z: 0 },
          },
          {
            id: "uuid_wall_0005",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: { width: 2.4, height: 2.4, depth: 2.4 },
            position: { x: 4.8, y: 1.2, z: 0 },
          },
          {
            id: "uuid_wall_0006",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: { width: 2.4, height: 2.4, depth: 2.4 },
            position: { x: 0, y: 1.2, z: 4.8 },
          },
          {
            id: "uuid_wall_0007",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: { width: 2.4, height: 2.4, depth: 2.4 },
            position: { x: -4.8, y: 1.2, z: 0 },
          },
          {
            id: "uuid_wall_0008",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: { width: 2.4, height: 2.4, depth: 2.4 },
            position: { x: 0, y: 1.2, z: -4.8 },
          },
          {
            id: "uuid_wall_0009",
            texturePack: "wall001",
            type: "wall",
            geometryType: "BoxGeometry",
            dimensions: { width: 2.4, height: 2.4, depth: 2.4 },
            position: { x: 10, y: 1.2, z: -4.8 },
          },
        ],
      },
    },
  },
};
