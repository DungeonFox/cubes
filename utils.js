// utils.js
const blendingFunctions = {
  BlendCornerByProximity: (color1, color2, { weight, ambient }) => {
    const padding = weight >= 0 ? weight : -weight;
    const distanceFactor = Math.max(0, 1 - (distanceToSubject / padding)); // Placeholder for distance
    return [
      color1[0] * (1 - distanceFactor) + color2[0] * distanceFactor + ambient[0],
      color1[1] * (1 - distanceFactor) + color2[1] * distanceFactor + ambient[1],
      color1[2] * (1 - distanceFactor) + color2[2] * distanceFactor + ambient[2],
    ];
  },
  BlendVrtxByWeight: (color1, color2, { weight, ambient }) => {
    return [
      color1[0] * (1 - weight) + color2[0] * weight + ambient[0],
      color1[1] * (1 - weight) + color2[1] * weight + ambient[1],
      color1[2] * (1 - weight) + color2[2] * weight + ambient[2],
    ];
  },
  blendBackground: (color1, color2, { ambient }) => {
    return [
      Math.min(255, color1[0] + color2[0] + ambient[0]),
      Math.min(255, color1[1] + color2[1] + ambient[1]),
      Math.min(255, color1[2] + color2[2] + ambient[2]),
    ];
  },
};

function calculateProximityPadding(weight) {
  return weight >= 0 ? weight : -weight;
}

export { blendingFunctions, calculateProximityPadding };