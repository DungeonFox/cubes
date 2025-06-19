// storage.js

/**
 * Manages IndexedDB storage for the 3D cube rendering architecture.
 * This module is designed to be drop-in-place and can be directly integrated into other projects.
 * The tables in the MD files (e.g., Cubes.md) are examples of the stores and guide the schema design.
 * 
 * References:
 *   - Cubes.md: Defines the overall hierarchy and storage structure (e.g., id, windowUID, value).
 *   - CubeVertices.md: Details the storage of cube vertices (e.g., vertexID, valueArray).
 *   - Subcubes.md: Describes subcube structure and relationships (e.g., cubeId, center, vertexArray).
 *   - SubcubeVertices.md: Outlines subcube vertex parameters (e.g., color, position, weight, proximity).
 *   - CubeMatrix.md: Explains CubeMatrix with RGB layers and position bins.
 *   - SubcubeMatrix.md: Details SubcubeMatrix with RGB layers and overlapping bins.
 *   - BackgroundMatrix.md: Describes BackgroundMatrix with 3D bins and ambient value.
 *   - Z-Axis.md: Defines Z-axis as depth, typically relative to the camera.
 *   - Ambient Value.md: Clarifies ambient value as quantized RGB layers.
 * 
 * Usage:
 *   - Initialize the storage: `const storage = new CubeStorage(); await storage.init();`
 *   - Save an entity: `await storage.save(entity, "Cubes");`
 *   - Update cube hierarchy: `await storage.updateCubeHierarchy(cubeData);`
 * 
 * Configuration:
 *   - Database name and version can be customized via constructor parameters.
 */
class CubeStorage {
  constructor(dbName = "CubeDB", version = 4) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        const cubeStore = db.createObjectStore("Cubes", { keyPath: "id" });
        cubeStore.createIndex("windowUID", "windowUID", { unique: false });
        cubeStore.createIndex("activeWindowUID", "activeWindowUID", { unique: false });
        cubeStore.createIndex("blendingLogicId", "blendingLogicId", { unique: false });

        const cubeVertexStore = db.createObjectStore("CubeVertices", { keyPath: "vertexID" });
        cubeVertexStore.createIndex("windowUID", "windowUID", { unique: false });
        cubeVertexStore.createIndex("activeWindowUID", "activeWindowUID", { unique: false });

        const subcubeStore = db.createObjectStore("Subcubes", { keyPath: "id" });
        subcubeStore.createIndex("cubeId", "cubeId", { unique: false });
        subcubeStore.createIndex("windowUID", "windowUID", { unique: false });
        subcubeStore.createIndex("activeWindowUID", "activeWindowUID", { unique: false });
        subcubeStore.createIndex("originID", "originID", { unique: false });
        subcubeStore.createIndex("blendingLogicId", "blendingLogicId", { unique: false });

        const subcubeVertexStore = db.createObjectStore("SubcubeVertices", { keyPath: "id" });
        subcubeVertexStore.createIndex("cubeId", "cubeId", { unique: false });
        subcubeVertexStore.createIndex("subCubeID", "subCubeID", { unique: false });
        subcubeVertexStore.createIndex("originID", "originID", { unique: false });
        subcubeVertexStore.createIndex("windowUID", "windowUID", { unique: false });
        subcubeVertexStore.createIndex("activeWindowUID", "activeWindowUID", { unique: false });
        subcubeVertexStore.createIndex("proximityPadding", "proximityPadding", { unique: false });
        subcubeVertexStore.createIndex("weight", "value.weight", { unique: false });
        subcubeVertexStore.createIndex("proximity", "value.proximity", { unique: false });

        const cubeMatrixStore = db.createObjectStore("CubeMatrix", { keyPath: "id" });
        cubeMatrixStore.createIndex("windowUID", "windowUID", { unique: false });
        cubeMatrixStore.createIndex("redLayer", "redLayer", { unique: false });
        cubeMatrixStore.createIndex("greenLayer", "greenLayer", { unique: false });
        cubeMatrixStore.createIndex("blueLayer", "blueLayer", { unique: false });
        cubeMatrixStore.createIndex("binData", "binData", { unique: false });

        const subcubeMatrixStore = db.createObjectStore("SubcubeMatrix", { keyPath: "id" });
        subcubeMatrixStore.createIndex("cubeId", "cubeId", { unique: false });
        subcubeMatrixStore.createIndex("windowUID", "windowUID", { unique: false });
        subcubeMatrixStore.createIndex("redLayer", "redLayer", { unique: false });
        subcubeMatrixStore.createIndex("greenLayer", "greenLayer", { unique: false });
        subcubeMatrixStore.createIndex("blueLayer", "blueLayer", { unique: false });
        subcubeMatrixStore.createIndex("binData", "binData", { unique: false });

        const bgMatrixStore = db.createObjectStore("BackgroundMatrix", { keyPath: "id" });
        bgMatrixStore.createIndex("ambientValue", "ambientValue", { unique: false });
        bgMatrixStore.createIndex("windowUID", "windowUID", { unique: false });
        bgMatrixStore.createIndex("redLayer", "redLayer", { unique: false });
        bgMatrixStore.createIndex("greenLayer", "greenLayer", { unique: false });
        bgMatrixStore.createIndex("blueLayer", "blueLayer", { unique: false });
        bgMatrixStore.createIndex("binData", "binData", { unique: false });
        bgMatrixStore.createIndex("blendingLogicId", "blendingLogicId", { unique: false });

        const blendingLogicStore = db.createObjectStore("BlendingLogic", { keyPath: "logicId" });

        const zAxisConfigStore = db.createObjectStore("ZAxisConfig", { keyPath: "id" });
        zAxisConfigStore.createIndex("cameraPosition", "cameraPosition", { unique: false });
        zAxisConfigStore.createIndex("userDefinedPoint", "userDefinedPoint", { unique: false });
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async validateEntity(entity, storeName) {
    if (!this.db) throw new Error("Database not initialized");
    switch (storeName) {
      case "CubeVertices":
      case "SubcubeVertices":
        if (!Array.isArray(entity.valueArray) || entity.valueArray.length !== 4) throw new Error("Invalid valueArray format: expected [color, position, weight, proximity]");
        const [color, position, weight, proximity] = entity.valueArray;
        if (!Array.isArray(color) || color.length !== 3 || color.some(c => c < 0 || c > 255)) throw new Error("Invalid color range: must be [0-255, 0-255, 0-255]");
        if (!Array.isArray(position) || position.length !== 3) throw new Error("Invalid position format: must be [x, y, z]");
        if (typeof weight !== "number" || isNaN(weight)) throw new Error("Invalid weight: must be a number");
        if (typeof proximity !== "string") throw new Error("Invalid proximity: must be a string");
        entity.proximityPadding = weight >= 0 ? weight : -weight;
        break;
      case "Subcubes":
        if (!Array.isArray(entity.vertexArray) || !entity.vertexArray.every(v => Array.isArray(v) && v.length === 2)) throw new Error("Invalid vertexArray format: expected [vertexID, blendingLogicId]");
        if (!Array.isArray(entity.center) || entity.center.length !== 3) throw new Error("Invalid center format: must be [x, y, z]");
        break;
      case "CubeMatrix":
      case "SubcubeMatrix":
      case "BackgroundMatrix":
        if (!Array.isArray(entity.redLayer) || !Array.isArray(entity.greenLayer) || !Array.isArray(entity.blueLayer)) throw new Error("Invalid matrix layers: must include redLayer, greenLayer, blueLayer");
        if (!Array.isArray(entity.binData)) throw new Error("Invalid binData: must be an array of bin objects");
        break;
    }
    return true;
  }

  validateOriginID(originID, windowUID, cubeId) {
    const expected = `${windowUID}${cubeId}`;
    if (originID !== expected) throw new Error(`Invalid originID: expected ${expected}, got ${originID}`);
    return true;
  }

  async save(entity, storeName) {
    await this.validateEntity(entity, storeName);
    if (["Subcubes", "SubcubeVertices"].includes(storeName)) {
      this.validateOriginID(entity.originID, entity.windowUID, entity.cubeId);
    }
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(entity);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key, storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex(indexName, value, storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Performs a complete cube update including all subcubes and vertices in a single transaction.
   * This ensures atomicity when making changes that affect multiple related entities.
   * @param {Object} cubeData - Complete cube data including subcubes and vertices
   * @returns {Promise<void>} Resolves when all updates are complete
   */
  async updateCubeHierarchy(cubeData) {
    if (!this.db) throw new Error("Database not initialized");
    
    return new Promise((resolve, reject) => {
      const storeNames = ["Cubes", "Subcubes", "SubcubeVertices", "CubeVertices"];
      const transaction = this.db.transaction(storeNames, "readwrite");
      
      let operationsCompleted = 0;
      let totalOperations = 0;
      
      totalOperations += 1; // Main cube
      totalOperations += cubeData.subcubes ? cubeData.subcubes.length : 0;
      totalOperations += cubeData.subcubeVertices ? cubeData.subcubeVertices.length : 0;
      totalOperations += cubeData.cubeVertices ? cubeData.cubeVertices.length : 0;
      
      const checkCompletion = () => {
        operationsCompleted++;
        if (operationsCompleted === totalOperations) {
          resolve();
        }
      };
      
      transaction.onerror = () => reject(transaction.error);
      
      const cubeStore = transaction.objectStore("Cubes");
      const cubeRequest = cubeStore.put(cubeData.cube);
      cubeRequest.onsuccess = checkCompletion;
      cubeRequest.onerror = () => reject(cubeRequest.error);
      
      if (cubeData.subcubes && cubeData.subcubes.length > 0) {
        const subcubeStore = transaction.objectStore("Subcubes");
        cubeData.subcubes.forEach(subcube => {
          const subcubeRequest = subcubeStore.put(subcube);
          subcubeRequest.onsuccess = checkCompletion;
          subcubeRequest.onerror = () => reject(subcubeRequest.error);
        });
      }
      
      if (cubeData.subcubeVertices && cubeData.subcubeVertices.length > 0) {
        const subcubeVertexStore = transaction.objectStore("SubcubeVertices");
        cubeData.subcubeVertices.forEach(vertex => {
          const vertexRequest = subcubeVertexStore.put(vertex);
          vertexRequest.onsuccess = checkCompletion;
          vertexRequest.onerror = () => reject(vertexRequest.error);
        });
      }
      
      if (cubeData.cubeVertices && cubeData.cubeVertices.length > 0) {
        const cubeVertexStore = transaction.objectStore("CubeVertices");
        cubeData.cubeVertices.forEach(vertex => {
          const vertexRequest = cubeVertexStore.put(vertex);
          vertexRequest.onsuccess = checkCompletion;
          vertexRequest.onerror = () => reject(vertexRequest.error);
        });
      }
    });
  }

  /**
   * Efficiently updates matrix data for multiple cubes simultaneously.
   * This is useful when the rendering pipeline needs to update multiple matrices
   * after a scene change or camera movement.
   * @param {Array} matrixUpdates - Array of matrix update objects
   * @returns {Promise<void>} Resolves when all matrix updates are complete
   */
  async batchUpdateMatrices(matrixUpdates) {
    if (!this.db) throw new Error("Database not initialized");
    
    return new Promise((resolve, reject) => {
      const storeNames = new Set();
      matrixUpdates.forEach(update => {
        if (update.type === "CubeMatrix") storeNames.add("CubeMatrix");
        if (update.type === "SubcubeMatrix") storeNames.add("SubcubeMatrix");
        if (update.type === "BackgroundMatrix") storeNames.add("BackgroundMatrix");
      });
      
      const transaction = this.db.transaction([...storeNames], "readwrite");
      let operationsCompleted = 0;
      const totalOperations = matrixUpdates.length;
      
      const checkCompletion = () => {
        operationsCompleted++;
        if (operationsCompleted === totalOperations) {
          resolve();
        }
      };
      
      transaction.onerror = () => reject(transaction.error);
      
      matrixUpdates.forEach(update => {
        const store = transaction.objectStore(update.type);
        const request = store.put(update.matrix);
        request.onsuccess = checkCompletion;
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Optimized method for spatial queries that need to find all entities within a 3D region.
   * This is useful for frustum culling, collision detection, or level-of-detail calculations.
   * @param {Object} bounds - 3D bounding box {min: [x,y,z], max: [x,y,z]}
   * @param {number} windowUID - Window to search within
   * @returns {Promise<Object>} Object containing all entities within the bounds
   */
  async getEntitiesInBounds(bounds, windowUID) {
    if (!this.db) throw new Error("Database not initialized");
    
    const [cubes, subcubes, subcubeVertices] = await Promise.all([
      this.getAllByIndex("windowUID", windowUID, "Cubes"),
      this.getAllByIndex("windowUID", windowUID, "Subcubes"),
      this.getAllByIndex("windowUID", windowUID, "SubcubeVertices")
    ]);
    
    const isInBounds = (position) => {
      return position[0] >= bounds.min[0] && position[0] <= bounds.max[0] &&
             position[1] >= bounds.min[1] && position[1] <= bounds.max[1] &&
             position[2] >= bounds.min[2] && position[2] <= bounds.max[2];
    };
    
    const result = {
      cubes: cubes.filter(cube => {
        const center = cube.value[0];
        return isInBounds(center);
      }),
      subcubes: subcubes.filter(subcube => isInBounds(subcube.center)),
      subcubeVertices: subcubeVertices.filter(vertex => {
        const position = vertex.value[1];
        return isInBounds(position);
      })
    };
    
    return result;
  }

  /**
   * Creates optimized spatial indices for faster 3D queries.
   * This builds additional in-memory data structures for spatial lookups.
   * @param {number} windowUID - Window to build indices for
   * @param {number} binSize - Size of spatial bins for indexing
   * @returns {Promise<Object>} Spatial index structure
   */
  async buildSpatialIndex(windowUID, binSize = 50) {
    const entities = await this.getEntitiesInBounds(
      { min: [-Infinity, -Infinity, -Infinity], max: [Infinity, Infinity, Infinity] },
      windowUID
    );
    
    const spatialIndex = {
      binSize,
      bins: new Map(),
      
      getBinCoords(position) {
        return [
          Math.floor(position[0] / binSize),
          Math.floor(position[1] / binSize),
          Math.floor(position[2] / binSize)
        ];
      },
      
      getBinKey(binCoords) {
        return `${binCoords[0]},${binCoords[1]},${binCoords[2]}`;
      },
      
      queryNearPosition(position, radius) {
        const results = { cubes: [], subcubes: [], subcubeVertices: [] };
        const radiusInBins = Math.ceil(radius / binSize);
        const centerBin = this.getBinCoords(position);
        
        for (let x = centerBin[0] - radiusInBins; x <= centerBin[0] + radiusInBins; x++) {
          for (let y = centerBin[1] - radiusInBins; y <= centerBin[1] + radiusInBins; y++) {
            for (let z = centerBin[2] - radiusInBins; z <= centerBin[2] + radiusInBins; z++) {
              const binKey = this.getBinKey([x, y, z]);
              const bin = this.bins.get(binKey);
              if (bin) {
                const addIfInRadius = (entity, pos) => {
                  const distance = Math.sqrt(
                    Math.pow(position[0] - pos[0], 2) +
                    Math.pow(position[1] - pos[1], 2) +
                    Math.pow(position[2] - pos[2], 2)
                  );
                  return distance <= radius;
                };
                
                results.cubes.push(...bin.cubes.filter(cube => addIfInRadius(cube, cube.value[0])));
                results.subcubes.push(...bin.subcubes.filter(subcube => addIfInRadius(subcube, subcube.center)));
                results.subcubeVertices.push(...bin.subcubeVertices.filter(vertex => addIfInRadius(vertex, vertex.value[1])));
              }
            }
          }
        }
        
        return results;
      }
    };
    
    entities.cubes.forEach(cube => {
      const binCoords = spatialIndex.getBinCoords(cube.value[0]);
      const binKey = spatialIndex.getBinKey(binCoords);
      
      if (!spatialIndex.bins.has(binKey)) {
        spatialIndex.bins.set(binKey, { cubes: [], subcubes: [], subcubeVertices: [] });
      }
      spatialIndex.bins.get(binKey).cubes.push(cube);
    });
    
    entities.subcubes.forEach(subcube => {
      const binCoords = spatialIndex.getBinCoords(subcube.center);
      const binKey = spatialIndex.getBinKey(binCoords);
      
      if (!spatialIndex.bins.has(binKey)) {
        spatialIndex.bins.set(binKey, { cubes: [], subcubes: [], subcubeVertices: [] });
      }
      spatialIndex.bins.get(binKey).subcubes.push(subcube);
    });
    
    entities.subcubeVertices.forEach(vertex => {
      const binCoords = spatialIndex.getBinCoords(vertex.value[1]);
      const binKey = spatialIndex.getBinKey(binCoords);
      
      if (!spatialIndex.bins.has(binKey)) {
        spatialIndex.bins.set(binKey, { cubes: [], subcubes: [], subcubeVertices: [] });
      }
      spatialIndex.bins.get(binKey).subcubeVertices.push(vertex);
    });
    
    return spatialIndex;
  }
}

export { CubeStorage };