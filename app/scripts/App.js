import {TweenMax, Power2, TimelineLite} from "gsap/TweenMax";
import * as dat from 'dat.gui';

//TEXTURE
import imgMap from '../assets/Texture/Leather/Leather_001_NRM.png';
import imgDisp from '../assets/Texture/Leather/Leather_001_DISP.png';

//SHADER
import landscapeVertexShader from './Shaders/LandscapeShader/landscapeVertex.glsl';
import landscapeFragmentShader from './Shaders/LandscapeShader/landscapeFragment.glsl';
import glowVertexShader from './Shaders/GlowShader/glowVertex.glsl';
import glowFragmentShader from './Shaders/GlowShader/glowFragment.glsl';

//POST PROC
import 'three/examples/js/postprocessing/EffectComposer';
import 'three/examples/js/postprocessing/RenderPass';
import 'three/examples/js/postprocessing/ShaderPass';
import 'three/examples/js/shaders/CopyShader'

import 'three/examples/js/shaders/DotScreenShader'
import 'three/examples/js/shaders/LuminosityHighPassShader';
import 'three/examples/js/postprocessing/UnrealBloomPass';


let composer;
let params = {
    exposure: 1,
    bloomStrength: 2.3,
    bloomThreshold: 0.3,
    bloomRadius: 0.08
};

let movemento = 0;
let nbParticules = 15;
let groupRotation = 2;
let Stats = require('stats-js');
//let InstancedMesh = require('three-instanced-mesh')( THREE );

export default class App {

    constructor() {

        this.pollen = [];
        this.container = document.querySelector( '#main' );
    	document.body.appendChild( this.container );

        //STATS
        this.stats();

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
        this.camera.position.z = 3.5;

    	this.scene = new THREE.Scene();

        this.groupPollen = new THREE.Group();
        this.groupLine = new THREE.Group();

        //LANDSCAPE
        this.landscape();

        //LIGHT
        this.newLight();

        //POLLEN GENERATION
        this.pollenCreate(1.05);

        //HEART
        this.heartCreate();

        //GLOW SPHERE
        this.glowSphere();

        //TIGE
        this.tigeCreate();

        //CURVE
        this.curveCreate();

        //Gui
        const gui = new dat.GUI();
        gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
            bloomPass.threshold = Number( value );
        } );
        gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
            bloomPass.strength = Number( value );
        } );
        gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
            bloomPass.radius = Number( value );
        } );

    	//ORIGINAL RENDERER
    	/*this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    	this.renderer.setPixelRatio( window.devicePixelRatio );
    	this.renderer.setSize( window.innerWidth, window.innerHeight );
    	this.container.appendChild( this.renderer.domElement );

    	window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize();
        this.renderer.animate( this.render.bind(this));*/

        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize();
    	//BLOOM RENDER
        let renderScene = new THREE.RenderPass( this.scene, this.camera );
        let bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        //bloomPass.renderToScreen = true;
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;
        composer = new THREE.EffectComposer( this.renderer );
        composer.setSize( window.innerWidth, window.innerHeight );
        composer.addPass( renderScene );
        composer.addPass( bloomPass );
        //Add to fixe
        let copyPass = new THREE.ShaderPass(THREE.CopyShader);
        copyPass.renderToScreen = true;
        composer.addPass(copyPass)

        this.renderer.animate( this.render.bind(this));
    }


    landscape() {
        this.landscapeGeometry = new THREE.SphereBufferGeometry(5, 20, 20)

        this.uniforms = {
            uTime: { type: 'f', value: 0},
            uAmp: { type:'f', value: 2. },
        };
        this.landscapeMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: this.uniforms,
            vertexShader: landscapeVertexShader,
            fragmentShader: landscapeFragmentShader,
            side: THREE.BackSide
        });

        this.landscapeMesh = new THREE.Mesh( this.landscapeGeometry, this.landscapeMaterial );
        this.scene.add(this.landscapeMesh)
    }

    newLight() {
        this.ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
        this.scene.add( this.ambientLight);

        this.dirLight = new THREE.DirectionalLight( 0xffffff, 8 );//Power light
        this.dirLight.castShadow = true;
        this.dirLight.position.set(0,0,0);
        this.scene.add(this.dirLight);

        this.dirLightHelper = new THREE.DirectionalLightHelper( this.dirLight, 10 );
        //this.scene.add( this.dirLightHelper );

        this.pointLight = new THREE.PointLight( 0xffffff, 1, 100 ); //0xffeea1
        this.scene.add( this.pointLight );

        let sphereSize = 0.1;
        this.pointLightHelper = new THREE.PointLightHelper( this.pointLight, sphereSize );
        //this.scene.add( this.pointLightHelper );

        this.pointLightCircle = new THREE.PointLight( 0xffffff, 1, 100 ); //0xffeea1
        this.scene.add( this.pointLightCircle );

        this.pointLightCircleHelper = new THREE.PointLightHelper( this.pointLightCircle, sphereSize );
        //this.scene.add( this.pointLightCircleHelper );
    }

    pollenCreate(rayon) {
        for(let x = 0 ; x < nbParticules; x++) {
            for(let y = 0 ; y < nbParticules; y++) {
                let geometry = new THREE.SphereBufferGeometry(0.03, 20, 20 );
                geometry.rotateX(Math.PI / 2);
                let material = new THREE.MeshPhongMaterial();
                this.mesh = new THREE.Mesh( geometry, material );

                this.mesh.position.x = THREE.Math.randFloat(rayon, rayon * 1.1) * Math.cos(y) * Math.sin(x);
                this.mesh.position.y = THREE.Math.randFloat(rayon, rayon * 1.1) * Math.sin(y) * Math.sin(x);
                this.mesh.position.z = THREE.Math.randFloat(rayon, rayon * 1.1) * Math.cos(x);

                let scale = THREE.Math.randFloat(.3, 1.5)
                this.mesh.scale.set(scale, scale, scale)

                this.pollen.push(this.mesh);
                this.scene.add(this.mesh);

                this.groupPollen.add(this.mesh);
                this.scene.add(this.groupPollen);
                this.groupPollen.rotation.x = groupRotation;
            }
        }
        //INSTANCED MESH
        /*for(let x = 0 ; x < nbParticules; x++) {

            let geometry = new THREE.SphereBufferGeometry(0.03, 20, 20 );
            geometry.rotateX(Math.PI / 2);
            let material = new THREE.MeshPhongMaterial();

            this.cluster = new THREE.InstancedMesh(
                geometry,                 //this is the same
                material,
                nbParticules,                       //instance count
                false,                       //is it dynamic
                false,                        //does it have color
                true,                        //uniform scale, if you know that the placement function will not do a non-uniform scale, this will optimize the shader
                );

                this.cluster.position.x = THREE.Math.randFloat(rayon, rayon * 1.1) * Math.cos(y) * Math.sin(x);
                this.cluster.position.y = THREE.Math.randFloat(rayon, rayon * 1.1) * Math.sin(y) * Math.sin(x);
                this.cluster.position.z = THREE.Math.randFloat(rayon, rayon * 1.1) * Math.cos(x);

                let scale = THREE.Math.randFloat(.3, 1.5)
                this.cluster.scale.set(scale, scale, scale)

                this.pollen.push(this.cluster);
                this.scene.add(this.cluster);

                this.groupPollen.add(this.cluster);
                this.scene.add(this.groupPollen);
                this.groupPollen.rotation.x = groupRotation;
        }*/
    }

    generateRandom(min, max) {
        let num = Math.floor(Math.random() * (max - min + 1)) + min;
        return (num === 0) ? this.generateRandom(min, max) : num;
    }

    curveCreate() {

        //CURVE LINE
        for(let i = 0 ; i < this.groupPollen.children.length ;i++) {
            let curve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, this.generateRandom(-1, 1), 0),
                new THREE.Vector3(this.groupPollen.children[i].position.x, this.groupPollen.children[i].position.y, this.groupPollen.children[i].position.z)
            );
            let curveGeometry = new THREE.Geometry();
            curveGeometry.vertices = curve.getPoints(10);
            let curveMaterial = new THREE.LineBasicMaterial({color: 0x010102,transparent:true, opacity: 1});

            this.curveLine = new THREE.Line(curveGeometry, curveMaterial);
            this.groupLine.add( this.curveLine );
            this.groupPollen.add(this.groupLine);
        }
        //TUBE GEOEMETRY
        /*for(let i = 0 ; i < this.groupPollen.children.length ;i++) {

            let curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(this.groupPollen.children[i].position.x, this.groupPollen.children[i].position.y, this.groupPollen.children[i].position.z)
            ]);

            curve.verticesNeedUpdate = true;

            let geometry = new THREE.TubeGeometry(curve, 20, 0.005, 8, false);
            geometry.dynamic = true;
            let material = new THREE.MeshPhongMaterial({transparent:true, opacity: .2});

            this.curveMesh = new THREE.Mesh(geometry, material);

            this.groupLine.add( this.curveMesh );
            this.groupPollen.add(this.groupLine);
        }*/
    }

    tigeCreate() {
        function CustomSinCurve( scale ) {

            THREE.Curve.call( this );

            this.scale = ( scale === undefined ) ? 1 : scale;

        }

        CustomSinCurve.prototype = Object.create( THREE.Curve.prototype );
        CustomSinCurve.prototype.constructor = CustomSinCurve;

        CustomSinCurve.prototype.getPoint = function ( t ) {

            let tx = t * 2 - 1.5;
            let ty = Math.sin( .5 * Math.PI * t );
            let tz = 0;

            return new THREE.Vector3( tx, ty, tz ).multiplyScalar( this.scale );

        };

        let path = new CustomSinCurve( 10 );
        let tigeGeometry = new THREE.TubeBufferGeometry( path, 20, .6, 10, false );
        let tigeMaterial = new THREE.MeshPhongMaterial({color: 0x222222 ,transparent:true, opacity:.5});
        this.tigeMesh = new THREE.Mesh( tigeGeometry, tigeMaterial );
        this.scene.add( this.tigeMesh );

        this.tigeMesh.position.set(-.1,-2.5,0);
        this.tigeMesh.scale.set(.15,.25,.05);
        this.tigeMesh.rotation.set(0,4.6,.4);
    }

    heartCreate() {
        let geometry = new THREE.SphereBufferGeometry(.25, 20, 20 );

        let textureLoader = new THREE.TextureLoader();
        let texture = textureLoader.load(imgMap);
        //let textureColor = textureLoader.load(imgColor);
        let textureDisp = textureLoader.load(imgDisp);
        let material = new THREE.MeshPhongMaterial({
            color: 0X000000,
            normalMap: texture,
            displacementMap: textureDisp,
            displacementScale: .15,
            normalScale: new THREE.Vector2(1, 1),
            transparent: true,
            opacity: .7
        });
        this.heartGeometry = new THREE.Mesh( geometry, material );
        this.heartGeometry.position.y = - 0.05;
        this.heartGeometry.position.z =  0.15;
        this.scene.add(this.heartGeometry)
    }

    glowSphere() {

        let sphereGeom = new THREE.SphereGeometry(1.2, 32, 16);

        let customMaterial = new THREE.ShaderMaterial(
            {
                uniforms:
                    {
                        "c":   { type: "f", value: 0.25 },
                        "p":   { type: "f", value: 3 },
                        glowColor: { type: "c", value: new THREE.Color(0x0e54b9) }, //0x0069ff clearly
                        viewVector: { type: "v3", value: this.camera.position }
                    },
                vertexShader: glowVertexShader,
                fragmentShader: glowFragmentShader,
                side: THREE.FrontSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            }   );

        this.moonGlow = new THREE.Mesh( sphereGeom, customMaterial);
        this.moonGlow.position.z = 0.15;
        this.scene.add( this.moonGlow );
    }

    render(t) {
        this.stats.begin()

        let time = Date.now()/1000;
        this.landscapeMaterial.uniforms.uTime.value += time /100000000000;
        let random = Math.floor(Math.random()*(this.groupPollen.children.length-1));
        movemento = document.querySelector('#score').innerText /10000;

        //DANDELION MOVEMENT
        //this.groupPollen.position.z = - movemento*3;
        //this.groupPollen.rotation.x += ((groupRotation + (movemento)) - this.groupPollen.rotation.x) * 0.5;
        //this.groupPollen.rotation.y += ((groupRotation + (movemento)) - this.groupPollen.rotation.y) * 0.5;

        TweenMax.to(this.groupPollen.position, .3, {
            z:- movemento*3,
            ease:Sine.easeOut});

        TweenMax.to(this.groupPollen.rotation,.3, {
            x: ((groupRotation + (movemento) * (Math.random()*3)) - this.groupPollen.rotation.x) * 0.5,
            y: ((groupRotation/.5 + (movemento) * (Math.random()*2)) - this.groupPollen.rotation.y) * 0.5,
        })

        //LIGHT MOVEMENT
        this.pointLight.position.x = Math.cos(t / 752) * 1;
        this.pointLight.position.y = Math.sin(t / 438) * 1;
        this.pointLight.position.z = Math.sin(t / 678) *.1;
        this.pointLightCircle.position.x = Math.cos(t / 678) *1.6;
        this.pointLightCircle.position.y = Math.sin(t / 678) *1.6;

        //HEART MOVEMENT
        let scaling = 1 + Math.abs(Math.sin(t/1000)*.05)
        this.heartGeometry.scale.set(scaling - movemento,scaling - movemento,scaling - movemento)


        for ( let i = 0; i < this.groupPollen.children.length; i ++ ) {
            //POLLEN POSITION
            this.groupPollen.children[i].position.x += Math.cos((t * 0.001) + this.groupPollen.children[i].position.x) * 0.0005;
            this.groupPollen.children[i].position.y += Math.sin((t * 0.001) + this.groupPollen.children[i].position.y) * 0.0005;
            this.groupPollen.children[i].position.z += Math.sin((t * 0.001) + this.groupPollen.children[i].position.z) * 0.0001;

            //LINE POSITION
            this.groupLine.children[i].geometry.vertices[1].x += Math.cos((t * 0.001) + this.groupPollen.children[i].position.x) * 0.0005;
            this.groupLine.children[i].geometry.vertices[1].y += Math.sin((t * 0.001) + this.groupPollen.children[i].position.y) * 0.0005;
            this.groupLine.children[i].geometry.vertices[1].z += Math.sin((t * 0.001) + this.groupPollen.children[i].position.z) * 0.0001;
            this.groupLine.children[i].geometry.verticesNeedUpdate = true;
        }

        //LOW MOVEMENT
        if(movemento > 0.08){
            let tl = new TimelineLite();
            tl.to(this.groupPollen.children[random].position, 100 , { x:Math.random() * (60 + 30 ) - 30, y:Math.random() * (40 + 20 ) - 20, z:Math.random() * (50 + 30 ) - 30, ease:Elastic.easeOut, useFrames:true})
                .to(this.tigeMesh.rotation, 2, {x:-.3-(movemento*2),y:4.6,z:.6, ease:Elastic.easeOut, useFrames:true}, '-=100')

            let tline = new TimelineLite();
            tline.to(this.groupLine.children[random].position, 100 , { x:Math.random() * (60 + 30 ) - 30, y:Math.random() * (40 + 20 ) - 20, z:Math.random() * (50 + 30 ) - 30, ease:Elastic.easeOut, useFrames:true})
        }

        //STRONG MOVEMENT
        if(movemento > 0.15){
            let tl = new TimelineLite();
            tl.to(this.groupPollen.children[random].position, 20 , { x:Math.random() * (60 + 30 ) - 30, y:Math.random() * (40 + 20 ) - 20, z:Math.random() * (50 + 30 ) - 30, ease:Elastic.easeOut, useFrames:true})
                .to(this.tigeMesh.rotation, 2, {x:-.3-(movemento*2),y:4.6,z:.6, ease:Elastic.easeOut, useFrames:true}, '-=20')
        }

        else {
            let tl = new TimelineLite();
            tl.to(this.tigeMesh.rotation, 2, {x:-.2,y:4.6,z:.4, ease:Elastic.easeOut, useFrames:true})
        }

        //RENDER
        //this.renderer.render( this.scene, this.camera ); //Default
        composer.render(); //Bloom
        this.stats.end();
    }

    onWindowResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    stats() {
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.left = '0px';
        document.body.appendChild( this.stats.domElement );
    }
}
