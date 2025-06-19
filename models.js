// models.js
/**
 * Defines data models for the 3D cube rendering architecture based on MD file examples.
 */

class CubeVertex {
  /**
   * Creates a new CubeVertex instance.
   * @param {string} vertexID - The unique identifier for the vertex.
   * @param {number} windowUID - The window UID.
   * @param {number[]} position - The [x, y, z] coordinates.
   * @param {number[]} color - The [r, g, b] color values (0-255).
   * @param {string} blendingLogicId - The blending logic identifier.
   */
  constructor(vertexID, windowUID, position, color, blendingLogicId) {
    this.vertexID = vertexID;
    this.windowUID = windowUID;
    this.valueArray = [position, color];
    this.blendingLogicId = blendingLogicId;
  }
}

class Cube {
  /**
   * Creates a new Cube instance.
   * @param {number} id - The unique identifier for the cube.
   * @param {number} windowUID - The window UID.
   * @param {number[]} position - The [x, y, z] position.
   * @param {string[]} subcubeIDs - The array of subcube IDs.
   * @param {CubeVertex[]} vertices - The array of cube vertices.
   * @param {string} blendingLogicId - The blending logic identifier.
   */
  constructor(id, windowUID, position, subcubeIDs, vertices, blendingLogicId) {
    this.id = id;
    this.windowUID = windowUID;
    this.value = [position, subcubeIDs, vertices.map(v => v.valueArray)];
    this.blendingLogicId = blendingLogicId;
  }
}

class SubcubeVertex {
  /**
   * Creates a new SubcubeVertex instance.
   * @param {string} id - The unique identifier for the subcube vertex.
   * @param {number} windowUID - The window UID.
   * @param {number} cubeId - The ID of the parent cube.
   * @param {string} subCubeID - The ID of the parent subcube.
   * @param {string} originID - The originating windowUID + cubeId.
   * @param {number[]} value - The [color, position, weight, proximity] array.
   * @param {number} activeWindowUID - The active window UID.
   */
  constructor(id, windowUID, cubeId, subCubeID, originID, value, activeWindowUID) {
    this.id = id;
    this.windowUID = windowUID;
    this.cubeId = cubeId;
    this.subCubeID = subCubeID;
    this.originID = originID;
    this.value = value; // [color, position, weight, proximity]
    this.activeWindowUID = activeWindowUID;
    this.proximityPadding = value[2] >= 0 ? value[2] : -value[2]; // Derive from weight
  }
}

class Subcube {
  /**
   * Creates a new Subcube instance.
   * @param {string} id - The unique identifier for the subcube.
   * @param {number} windowUID - The window UID.
   * @param {number[]} center - The [x, y, z] center coordinates.
   * @param {number} order - The order index.
   * @param {string[][]} vertexArray - The array of [vertexID, blendingLogicId] pairs.
   * @param {number} cubeId - The ID of the parent cube.
   * @param {string} originID - The originating windowUID + cubeId.
   * @param {string} blendingLogicId - The blending logic identifier.
   */
  constructor(id, windowUID, center, order, vertexArray, cubeId, originID, blendingLogicId) {
    this.id = id;
    this.windowUID = windowUID;
    this.center = center;
    this.order = order;
    this.vertexArray = vertexArray;
    this.cubeId = cubeId;
    this.originID = originID;
    this.blendingLogicId = blendingLogicId;
  }
}

export { CubeVertex, Cube, SubcubeVertex, Subcube };