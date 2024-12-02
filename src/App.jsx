import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { gsap } from 'gsap'

function App() {
  const cameraRef = useRef() // Reference to the camera

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera // Store camera reference
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // Set initial size
    document.body.appendChild(renderer.domElement);
// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // Soft white light with reduced intensity
scene.add(ambientLight)

// Add multiple directional lights for even distribution
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight1.position.set(5, 10, 5)
scene.add(directionalLight1)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight2.position.set(-5, 10, 5)
scene.add(directionalLight2)

const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight3.position.set(5, 10, -5)
scene.add(directionalLight3)

const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight4.position.set(-5, 10, -5)
scene.add(directionalLight4)

    // Load the 3D model
    const loader = new GLTFLoader()
    loader.load('/assets/scene.glb', (gltf) => {
      scene.add(gltf.scene)
      controls.target.copy(gltf.scene.position) // Set the target to the model's position
    }, undefined, (error) => {
      console.error('An error occurred while loading the model:', error)
    })

    camera.position.set(0, 1, 5) // Position the camera away from the model

    // Initialize OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true // Enable damping for smoother controls
    controls.dampingFactor = 0.25 // Damping factor
    controls.target.set(0, 1, 0) // Set the target to the model's position

    // Set clamping for zoom and rotation
    controls.minDistance = 2; // Minimum zoom distance
    controls.maxDistance = 5; // Maximum zoom distance
    controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation to prevent looking under the model
    controls.minPolarAngle = 0; // Limit vertical rotation to prevent looking above the model

    // Disable panning
    controls.enablePan = false; // Disable panning

    // Create a gradient texture
    const createGradientTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const context = canvas.getContext('2d')

      // Create gradient
      const gradient = context.createLinearGradient(0, 0, 0, 256)
      gradient.addColorStop(0, 'pink') // Start color
      gradient.addColorStop(1, 'lightblue') // End color

      context.fillStyle = gradient
      context.fillRect(0, 0, 256, 256)

      return new THREE.CanvasTexture(canvas)
    }

    const gradientTexture = createGradientTexture()

    // Define interactable points
    const points = [
      { position: new THREE.Vector3(-2, 0.5, 0), name: 'Point 1', targetPosition: new THREE.Vector3(-4.02, 1.88, 0) },
      { position: new THREE.Vector3(2, 1.4, 1), name: 'Point 2', targetPosition: new THREE.Vector3(2.7, 0.4, .2) },
      { position: new THREE.Vector3(1.4, 1.4, -0.82), name: 'Point 3', targetPosition: new THREE.Vector3(0.2, 0.9, -1.92) } // New point
    ]

    // Create spheres for each point with glassmorphic effect
    const spheres = [] // Store references to the spheres
    points.forEach(point => {
      const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16)
      const sphereMaterial = new THREE.MeshPhysicalMaterial({
        map: gradientTexture, // Apply the gradient texture
        transparent: true,
        opacity: 0.6, // Adjust opacity for glass effect
        depthWrite: false, // Prevent depth writing for transparency
        roughness: 0.1, // Slightly rough surface
        metalness: 0.1 // Slight metallic effect
      })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.copy(point.position)
      sphere.userData = { name: point.name, targetPosition: point.targetPosition } // Store point name and target position in userData
      scene.add(sphere)
      spheres.push(sphere) // Add sphere to the array
    })

    // Raycaster for detecting clicks
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // Handle mouse click
    const onMouseClick = (event) => {
      // Convert mouse coordinates to normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera)

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(spheres) // Check against all spheres

      // Log mouse position and world coordinates
      console.log(`Mouse Position: (${event.clientX}, ${event.clientY})`)

      if (intersects.length > 0) {
        const clickedPoint = intersects[0].object
        const targetPosition = clickedPoint.userData.targetPosition // Get the target position from userData

        // Animate the camera to the specified position when the point is clicked
        animateCameraTo(targetPosition)
      } 
    }

    // Animate camera to a specific position using GSAP
    const animateCameraTo = (targetPosition) => {
      const endPosition = targetPosition.clone().add(new THREE.Vector3(0, 1, 0.5)) // Adjust height and distance

      gsap.to(camera.position, {
        x: endPosition.x,
        y: endPosition.y,
        z: endPosition.z,
        duration: 1, // Duration in seconds
        onUpdate: () => {
          camera.lookAt(targetPosition) // Look at the target position
        }
      })
    }

    // Add event listener for mouse clicks
    window.addEventListener('click', onMouseClick)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update() // Update controls
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight; // Update camera aspect ratio
      camera.updateProjectionMatrix(); // Update the camera projection matrix
      renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer size
    };

    window.addEventListener('resize', handleResize);


    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', onMouseClick)
      document.body.removeChild(renderer.domElement)
    }
  }, [])

  return null // No additional UI elements
}

export default App