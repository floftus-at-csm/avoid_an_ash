import { Pass, FullScreenQuad } from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/postprocessing/Pass.js';
import { PencilLinesMaterial } from './PencilLinesMaterial.js'
import {THREE} from './glob.js';

export class PencilLinesPass extends Pass {
	// fsQuad: FullScreenQuad
	// material: PencilLinesMaterial
	// normalBuffer: THREE.WebGLRenderTarget
	// normalMaterial: THREE.MeshNormalMaterial

	// scene: THREE.Scene
	// camera: THREE.Camera

	constructor(
		width,
		height,
		scene,
		camera, 
		uThresh = 0.75) {
		super()
		
		this.scene = scene
		this.camera = camera

		this.material = new PencilLinesMaterial()
		this.fsQuad = new FullScreenQuad(this.material)
		

		const normalBuffer = new THREE.WebGLRenderTarget(width, height)

		normalBuffer.texture.format = THREE.RGBAFormat
		normalBuffer.texture.type = THREE.HalfFloatType
		normalBuffer.texture.minFilter = THREE.NearestFilter
		normalBuffer.texture.magFilter = THREE.NearestFilter
		normalBuffer.texture.generateMipmaps = false
		normalBuffer.stencilBuffer = false
		this.normalBuffer = normalBuffer

		this.normalMaterial = new THREE.MeshNormalMaterial()

		this.material.uniforms.uResolution.value = new THREE.Vector2(width, height);
		this.material.uniforms.uThresh.value = uThresh;
		const loader = new THREE.TextureLoader()
		loader.load('https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/cloud-noise.png?v=1680861827995', (texture) => {
		// loader.load('./assets/brown-woven-fabric-close-up-texture.jpg', (texture) => {
			this.material.uniforms.uTexture.value = texture
		})
	}

	dispose() {
		this.material.dispose()
		this.fsQuad.dispose()
	}

	render(
		renderer,
		writeBuffer,
		readBuffer
	) {
		// this.material.uniforms.uThresh.value = 0.2;
		renderer.setRenderTarget(this.normalBuffer);
        // console.log(this.scene)
		const overrideMaterialValue = this.scene.overrideMaterial;

		this.scene.overrideMaterial = this.normalMaterial;
		renderer.render(this.scene, this.camera);
		this.scene.overrideMaterial = overrideMaterialValue;

		this.material.uniforms.uNormals.value = this.normalBuffer.texture;
		this.material.uniforms.tDiffuse.value = readBuffer.texture;

		if (this.renderToScreen) {
			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);
		} else {
			renderer.setRenderTarget(writeBuffer);
			if (this.clear) renderer.clear();
			this.fsQuad.render(renderer);
		}
	}
}
