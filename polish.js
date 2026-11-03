import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
export function installPolish({T,scene,camera,renderer,composer,spots,tiles,beams}) {
 const owned=[];
 // SSAO reinforces object contact; it is not a substitute for cast shadows.
 const ao=new SSAOPass(scene,camera,innerWidth,innerHeight);
 ao.kernelRadius=5;ao.minDistance=.003;ao.maxDistance=.12;
 composer.insertPass(ao,1);
 // Height-aware aerial perspective on opaque lit surfaces.
 const patched=new Set();
 scene.traverse(object=>{
  const materials=Array.isArray(object.material)?object.material:[object.material];
  for(const material of materials){
   if(!material||patched.has(material)||!material.isMeshStandardMaterial)continue;
   patched.add(material);
   material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vAerialWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vec4 aerialPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
 aerialPosition=instanceMatrix*aerialPosition;
#endif
vAerialWorld=(modelMatrix*aerialPosition).xyz;`);
    shader.fragmentShader='varying vec3 vAerialWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`
#ifdef USE_FOG
float aerialDistance=length(vAerialWorld-cameraPosition);
float aerialH0=max(cameraPosition.y,0.0);
float aerialH1=max(vAerialWorld.y,0.0);
float aerialDelta=(aerialH1-aerialH0)*0.055;
float aerialIntegral=exp(-aerialH0*0.055);
if(abs(aerialDelta)>0.001){aerialIntegral*=(1.0-exp(-aerialDelta))/aerialDelta;}
float aerialAmount=clamp(1.0-exp(-aerialDistance*(0.002+0.007*aerialIntegral)),0.0,0.82);
gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,aerialAmount);
#endif
`);
   };
   material.customProgramCacheKey=()=> 'meow-height-fog-v1';material.needsUpdate=true;
   if(material.normalMap)material.normalScale.set(.28,.28);
  }
 });
 // Main screen: a slow interference field and a restrained scan-line texture.
 const screenMaterial=new T.ShaderMaterial({uniforms:{time:{value:0},first:{value:new T.Color(0xff48bc)},second:{value:new T.Color(0x55dfff)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float time;uniform vec3 first,second;void main(){vec2 p=vUv;float wave=.5+.5*sin(p.x*9.+sin(p.y*6.-time*.24)*1.6+time*.18);float band=pow(.5+.5*sin(p.x*4.-p.y*5.+time*.2),5.);float scan=.92+.08*sin(p.y*180.);float edge=smoothstep(0.,.08,p.x)*(1.-smoothstep(.92,1.,p.x));vec3 c=mix(first,second,wave)*(.035+.11*band)*scan*edge;gl_FragColor=vec4(c,1.);}`});
 const screen=new T.Mesh(new T.PlaneGeometry(17.2,5.1),screenMaterial);screen.position.set(0,4.5,-12.56);scene.add(screen);owned.push(screen.geometry,screenMaterial);
 // Replace flat beam stripes with continuous, non-flashing noise.
 const beamMats=[];
 for(const pivot of beams){const m=pivot.children[1].material;
  if(!m.uniforms?.tint)continue;
  m.fragmentShader=`varying vec2 vUv;varying vec3 vPos;uniform vec3 tint;uniform float time,density,seed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){float d=clamp(-vPos.y/23.,0.,1.);float fade=smoothstep(0.,.035,d)*(1.-smoothstep(.55,1.,d));float a=vUv.x*6.2831853;vec2 q=vec2(cos(a),sin(a))*2.;float n=noise(q+vec2(d*7.-time*.12,seed+time*.08));float mist=.55+.45*n;float axial=1./(1.+d*d*5.);gl_FragColor=vec4(tint*1.4,density*fade*mist*axial);}`;
  m.needsUpdate=true;beamMats.push(m);
 }
 // Keep lettering and neon legible without making every surface reflective.
 tiles.forEach(tile=>{tile.material.roughness=.29;tile.material.clearcoat=.45});
 let lastW=0,lastH=0;
 return {update(time,high,reduced){
  const w=Math.floor(innerWidth*renderer.getPixelRatio()),h=Math.floor(innerHeight*renderer.getPixelRatio());
  if(w!==lastW||h!==lastH){ao.setSize(w,h);lastW=w;lastH=h;}
  ao.enabled=high;
  screenMaterial.uniforms.time.value=reduced?0:time;
  screenMaterial.uniforms.first.value.copy(spots[0].color);screenMaterial.uniforms.second.value.copy(spots[1].color);
  beamMats.forEach(m=>m.uniforms.density.value=high?.09:.05);
 },dispose(){composer.removePass(ao);ao.dispose();scene.remove(screen);owned.forEach(r=>r.dispose());}};
}
