import * as THREE from 'three';

export interface ParticleOptions {
  count: number;
  color: string;
  position: THREE.Vector3;
  size: number;
  speed: number;
  spread: number;
  lifeTime: number;
  gravity?: number;
}

export class ParticleSystem {
  private particles: THREE.Points[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  emit(options: ParticleOptions): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(options.count * 3);
    const velocities = new Float32Array(options.count * 3);
    const sizes = new Float32Array(options.count);
    const colors = new Float32Array(options.count * 3);

    const baseColor = new THREE.Color(options.color);

    for (let i = 0; i < options.count; i++) {
      // Position
      positions[i * 3] = options.position.x;
      positions[i * 3 + 1] = options.position.y;
      positions[i * 3 + 2] = options.position.z;

      // Velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = options.speed * (0.5 + Math.random() * 0.5);

      velocities[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      velocities[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      velocities[i * 3 + 2] = r * Math.cos(phi);

      // Sizes
      sizes[i] = options.size * (0.5 + Math.random() * 0.5);

      // Colors (slight variation)
      const c = baseColor.clone().multiplyScalar(0.8 + Math.random() * 0.4);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 1,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.userData = {
      life: 1.0,
      decay: 1.0 / (options.lifeTime * 60), // assume 60fps
      gravity: options.gravity || 0
    };

    this.scene.add(points);
    this.particles.push(points);
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const geo = p.geometry as THREE.BufferGeometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const velAttr = geo.getAttribute('velocity') as THREE.BufferAttribute;
      
      p.userData.life -= p.userData.decay;

      if (p.userData.life <= 0) {
        this.scene.remove(p);
        geo.dispose();
        (p.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      (p.material as THREE.PointsMaterial).opacity = p.userData.life;

      for (let j = 0; j < posAttr.count; j++) {
        // Apply velocity
        posAttr.setX(j, posAttr.getX(j) + velAttr.getX(j) * deltaTime);
        posAttr.setY(j, posAttr.getY(j) + velAttr.getY(j) * deltaTime);
        posAttr.setZ(j, posAttr.getZ(j) + velAttr.getZ(j) * deltaTime);

        // Apply gravity
        velAttr.setY(j, velAttr.getY(j) - p.userData.gravity * deltaTime);
        
        // Add some drag
        velAttr.setX(j, velAttr.getX(j) * 0.98);
        velAttr.setY(j, velAttr.getY(j) * 0.98);
        velAttr.setZ(j, velAttr.getZ(j) * 0.98);
      }

      posAttr.needsUpdate = true;
    }
  }
}
