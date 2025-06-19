// main.js
import { CubeStorage } from './storage.js';
import { Cube, CubeVertex, Subcube, SubcubeVertex } from './models.js';
import { Painter } from './painter.js';
import { Renderer } from './rendering.js';

async function main() {
  const storage = new CubeStorage();
  await storage.init();

  // Sample data
  const vertex1 = new CubeVertex("1vrtx0", 1, [-75, -75, -75], [255, 0, 0], "blendBackground");
  const vertex2 = new CubeVertex("1vrtx1", 1, [75, -75, -75], [0, 255, 0], "blendBackground");
  const cube = new Cube(1, 1, [0, 0, 0], ["AA"], [vertex1, vertex2], "blendBackground");
  const subcubeVertex = new SubcubeVertex("AAv0", 1, 1, "AA", "11", [[0, 255, 0], [0, 0, 0], 0.5, "weightedSphere"], 1);
  const subcube = new Subcube("AA", 1, [0, 0, 0], 0, [["AAv0", "BlendCornerByProximity"]], 1, "11", "BlendCornerByProximity");

  // Save individual entities
  await storage.save(cube, "Cubes");
  await storage.save(vertex1, "CubeVertices");
  await storage.save(vertex2, "CubeVertices");
  await storage.save(subcube, "Subcubes");
  await storage.save(subcubeVertex, "SubcubeVertices");

  // Test batch update
  const cubeData = {
    cube,
    subcubes: [subcube],
    subcubeVertices: [subcubeVertex],
    cubeVertices: [vertex1, vertex2]
  };
  await storage.updateCubeHierarchy(cubeData);
  console.log("Cube hierarchy updated.");

  // Test matrix batch update
  const matrixUpdates = [
    { type: "CubeMatrix", matrix: { id: 1, windowUID: 1, redLayer: [[0, 255]], greenLayer: [[0, 0]], blueLayer: [[255, 0]], binData: [{ row: 0, col: 0, depth: 0, value: [0, 0, 0] }] } },
    { type: "BackgroundMatrix", matrix: { id: 1, windowUID: 1, ambientValue: [10, 10, 10], redLayer: [[10, 20]], greenLayer: [[50, 60]], blueLayer: [[90, 100]], binData: [{ row: 0, col: 0, depth: 1, value: [10, 10, 10] }], blendingLogicId: "blendBackground" } }
  ];
  await storage.batchUpdateMatrices(matrixUpdates);
  console.log("Matrices updated.");

  // Test spatial query
  const bounds = { min: [-100, -100, -100], max: [100, 100, 100] };
  const entities = await storage.getEntitiesInBounds(bounds, 1);
  console.log("Entities in bounds:", entities);

  // Test spatial index
  const spatialIndex = await storage.buildSpatialIndex(1, 50);
  const nearEntities = spatialIndex.queryNearPosition([0, 0, 0], 100);
  console.log("Entities near position:", nearEntities);

  const painter = new Painter();
  const bins = painter.createBins([cube, subcube]);
  const renderer = new Renderer();
  const miniMap = renderer.renderMiniMap(bins, 100, 100);
}

main().catch(console.error);