import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ========== 场景与渲染器 ==========
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// ========== 光照 ==========
// 微弱环境光，让暗面不至于全黑
const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
scene.add(ambientLight);

// 模拟太阳光
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(5, 2, 5);
scene.add(sunLight);

// ========== 纹理加载 ==========
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

// 地球表面纹理（蓝色弹珠 - 海洋与大陆）
const earthMap = textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
);
earthMap.colorSpace = THREE.SRGBColorSpace;

// 地形高度图（凹凸贴图，让山脉有立体感）
const earthBump = textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-topology.png'
);

// 水域遮罩（镜面反射贴图，海洋反光）
const earthSpecular = textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-water.png'
);

// 云层纹理
const cloudsMap = textureLoader.load(
    'https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png'
);
cloudsMap.colorSpace = THREE.SRGBColorSpace;

// 加载完成
loadingManager.onLoad = () => {
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => { loading.style.display = 'none'; }, 600);
};

// 加载失败
loadingManager.onError = (url) => {
    console.error('纹理加载失败:', url);
    document.getElementById('loading').innerHTML =
        '<p style="color:#ff6b6b">纹理加载失败，请检查网络连接后刷新</p>';
};

// ========== 地球本体 ==========
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthMap,
    bumpMap: earthBump,
    bumpScale: 0.05,
    specularMap: earthSpecular,
    specular: new THREE.Color(0x333333),
    shininess: 15
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// ========== 云层 ==========
const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);
const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsMap,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
});
const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(clouds);

// ========== 大气层光晕 ==========
const atmosphereVertex = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const atmosphereFragment = `
    varying vec3 vNormal;
    void main() {
        float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
`;
const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertex,
    fragmentShader: atmosphereFragment,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);

// ========== 星空背景 ==========
const starsGeometry = new THREE.BufferGeometry();
const starCount = 6000;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    const r = 80 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);
    // 随机星星颜色（偏白/偏蓝/偏黄）
    const c = 0.7 + Math.random() * 0.3;
    starColors[i * 3] = c;
    starColors[i * 3 + 1] = c;
    starColors[i * 3 + 2] = c * (0.85 + Math.random() * 0.15);
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const starsMaterial = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// ========== 鼠标交互控制器 ==========
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;       // 惯性阻尼
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;
controls.minDistance = 1.4;           // 最近缩放距离
controls.maxDistance = 8;             // 最远缩放距离
controls.enablePan = false;           // 禁用平移

// ========== 状态变量 ==========
let autoRotate = true;
let cloudsVisible = true;
let atmosphereVisible = true;

// ========== 动画循环 ==========
function animate() {
    requestAnimationFrame(animate);

    if (autoRotate) {
        earth.rotation.y += 0.0008;
    }
    clouds.rotation.y += 0.0012;
    stars.rotation.y += 0.00005;

    controls.update();
    renderer.render(scene, camera);
}
animate();

// ========== UI 按钮事件 ==========
document.getElementById('toggle-rotation').addEventListener('click', (e) => {
    autoRotate = !autoRotate;
    e.target.textContent = autoRotate ? '暂停自转' : '开始自转';
});

document.getElementById('toggle-clouds').addEventListener('click', (e) => {
    cloudsVisible = !cloudsVisible;
    clouds.visible = cloudsVisible;
    e.target.textContent = cloudsVisible ? '隐藏云层' : '显示云层';
});

document.getElementById('toggle-atmosphere').addEventListener('click', (e) => {
    atmosphereVisible = !atmosphereVisible;
    atmosphere.visible = atmosphereVisible;
    e.target.textContent = atmosphereVisible ? '隐藏大气' : '显示大气';
});

document.getElementById('reset-view').addEventListener('click', () => {
    camera.position.set(0, 0, 3);
    controls.target.set(0, 0, 0);
    controls.update();
});

// ========== 窗口大小自适应 ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
