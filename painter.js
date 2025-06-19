// painter.js
import { blendingFunctions } from './utils.js';

class Painter {
  constructor(binSize = 10, ambientValue = [10, 10, 10]) {
    this.binSize = binSize;
    this.ambientValue = ambientValue;
    this.bins = new Map();
  }

  createBins(data, isBackground = false) {
    const maxDepth = this.findFarthestDepth(data);
    this.bins.clear();
    for (const item of data) {
      for (const vertex of item.value[2] || item.vertexArray.map(v => ({ valueArray: v }))) {
        const [x, y, z] = vertex.valueArray[1] || vertex.value[1];
        const row = Math.floor(x / this.binSize);
        const col = Math.floor(y / this.binSize);
        const depthBin = Math.floor(z / this.binSize);
        const binKey = isBackground ? `${row},${col},${depthBin}` : `${row},${col}`;
        if (!this.bins.has(binKey)) {
          this.bins.set(binKey, { color: [...this.ambientValue], active: false, depth: z });
        }
        if (z <= maxDepth + 1) {
          const blendLogic = vertex.valueArray[3] || vertex[1] || 'blendBackground';
          this.bins.get(binKey).color = this.blend(
            this.bins.get(binKey).color,
            vertex.valueArray[0] || vertex.value[0],
            { weight: vertex.valueArray[2] || vertex.value[2], proximity: blendLogic }
          );
          this.bins.get(binKey).active = true;
          if (isBackground) this.bins.get(binKey).depth = Math.max(this.bins.get(binKey).depth, z);
        }
      }
    }
    return this.bins;
  }

  blend(color1, color2, { weight, proximity }) {
    const blendFunc = blendingFunctions[proximity] || blendingFunctions.blendBackground;
    return blendFunc(color1, color2, { weight, ambient: this.ambientValue });
  }

  findFarthestDepth(data) {
    let maxZ = -Infinity;
    for (const item of data) {
      for (const vertex of item.value[2] || item.vertexArray.map(v => ({ valueArray: v }))) {
        const z = (vertex.valueArray[1] || vertex.value[1])[2];
        maxZ = Math.max(maxZ, z);
      }
    }
    return maxZ;
  }
}

export { Painter };