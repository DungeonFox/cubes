// rendering.js
import * as THREE from 'three';

class Renderer {
  constructor() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(800, 600);
    document.body.appendChild(this.renderer.domElement);
  }

  renderMiniMap(bins, width, height, isBackground = false) {
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      1, 1000
    );
    const geometry = new THREE.PlaneGeometry(width, height);
    const data = new Uint8Array(width * height * 3);
    let index = 0;
    for (const [, bin] of bins) {
      data[index++] = bin.color[0];
      data[index++] = bin.color[1];
      data[index++] = bin.color[2];
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    this.scene.add(plane);
    camera.position.z = isBackground ? 1000 : 500;
    this.renderer.render(this.scene, camera);
    return this.renderer.domElement;
  }
}

export { Renderer };