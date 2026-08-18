(function () {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    const hero = document.querySelector('.hero');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, hero.offsetWidth / hero.offsetHeight, 0.1, 1000);
    camera.position.z = 50;

    let width = hero.offsetWidth;
    let height = hero.offsetHeight;
    renderer.setSize(width, height);

    const PARTICLE_COUNT = 120;
    const CONNECTION_DISTANCE = 15;
    const MOUSE_INFLUENCE = 8;

    const mouse = new THREE.Vector2(0, 0);
    const mouse3D = new THREE.Vector3(0, 0, 0);

    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;
        velocities[i3] = (Math.random() - 0.5) * 0.08;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.08;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.04;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setDrawRange(0, 0);

    const lineMaterial = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const clock = new THREE.Clock();

    function updateColors() {
        const primary = isDark() ? [0.92, 0.14, 0.24] : [0.2, 0.6, 1.0];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const mix = Math.random();
            particleColors[i3] = primary[0] * (0.6 + mix * 0.4);
            particleColors[i3 + 1] = primary[1] * (0.6 + mix * 0.4);
            particleColors[i3 + 2] = primary[2] * (0.6 + mix * 0.4);
        }
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    }

    updateColors();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        const posAttr = particleGeometry.getAttribute('position');
        const pos = posAttr.array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            pos[i3] += velocities[i3];
            pos[i3 + 1] += velocities[i3 + 1];
            pos[i3 + 2] += velocities[i3 + 2];

            velocities[i3] += Math.sin(time * 0.5 + i) * 0.0003;
            velocities[i3 + 1] += Math.cos(time * 0.3 + i * 0.7) * 0.0003;

            const dx = mouse3D.x - pos[i3];
            const dy = mouse3D.y - pos[i3 + 1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_INFLUENCE * 5) {
                const force = (MOUSE_INFLUENCE * 5 - dist) / (MOUSE_INFLUENCE * 5) * 0.02;
                velocities[i3] += dx * force * 0.05;
                velocities[i3 + 1] += dy * force * 0.05;
            }

            velocities[i3] *= 0.999;
            velocities[i3 + 1] *= 0.999;
            velocities[i3 + 2] *= 0.999;

            if (Math.abs(pos[i3]) > 60) { pos[i3] *= -0.9; velocities[i3] *= -0.5; }
            if (Math.abs(pos[i3 + 1]) > 50) { pos[i3 + 1] *= -0.9; velocities[i3 + 1] *= -0.5; }
            if (Math.abs(pos[i3 + 2]) > 30) { pos[i3 + 2] *= -0.9; velocities[i3 + 2] *= -0.5; }
        }

        posAttr.needsUpdate = true;

        let lineIndex = 0;
        const linePos = lineGeometry.getAttribute('position').array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const i3 = i * 3;
                const j3 = j * 3;
                const dx = pos[i3] - pos[j3];
                const dy = pos[i3 + 1] - pos[j3 + 1];
                const dz = pos[i3 + 2] - pos[j3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONNECTION_DISTANCE) {
                    const alpha = 1 - dist / CONNECTION_DISTANCE;
                    linePos[lineIndex++] = pos[i3];
                    linePos[lineIndex++] = pos[i3 + 1];
                    linePos[lineIndex++] = pos[i3 + 2];
                    linePos[lineIndex++] = pos[j3];
                    linePos[lineIndex++] = pos[j3 + 1];
                    linePos[lineIndex++] = pos[j3 + 2];
                }
            }
        }

        lineGeometry.getAttribute('position').needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIndex / 3);

        particles.rotation.y = Math.sin(time * 0.05) * 0.1;
        particles.rotation.x = Math.cos(time * 0.03) * 0.05;
        lines.rotation.y = particles.rotation.y;
        lines.rotation.x = particles.rotation.x;

        renderer.render(scene, camera);
    }

    animate();

    hero.addEventListener('mousemove', function (e) {
        const rect = hero.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        mouse3D.x = mouse.x * 50;
        mouse3D.y = mouse.y * 40;
    });

    window.addEventListener('resize', function () {
        width = hero.offsetWidth;
        height = hero.offsetHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    const observer = new MutationObserver(function () {
        updateColors();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
