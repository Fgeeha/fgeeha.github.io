import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cluster, EXAMPLE } from '../study/kubernetes/cluster.mjs';
test('apply, service selection, scaling, pod replacement and deletion form one state',()=>{
 const c=new Cluster(); c.run('kubectl apply -f app.yaml',EXAMPLE);
 assert.equal(c.pods.length,2); assert.equal(c.endpoints(c.services.get('web')).length,2);
 c.run('kubectl scale deployment/web --replicas=4',EXAMPLE); assert.equal(c.pods.length,4);
 const name=c.pods[0].name; c.run(`kubectl delete pod ${name}`,EXAMPLE);
 assert.equal(c.pods.length,4); assert(!c.pods.some(p=>p.name===name));
 c.run('kubectl delete deployment web',EXAMPLE); assert.equal(c.pods.length,0); assert.equal(c.services.size,1); assert.equal(c.endpoints(c.services.get('web')).length,0);
});
test('invalid YAML and invalid later documents leave resources unchanged',()=>{
 const c=new Cluster(); c.apply(EXAMPLE); const before=c.get('all');
 for(const invalid of ['kind: [',EXAMPLE.replace('kind: Service','kind: Secret'),EXAMPLE.replace('replicas: 2','replicas: -1'),EXAMPLE.replace('replicas: 2','replicas: 2.5'),EXAMPLE.replace('app: web','app: different'),EXAMPLE.replace('targetPort: 80','targetPort: bad'),EXAMPLE.replace('app: web','app: 123')]){
 assert.throws(()=>c.apply(invalid)); assert.equal(c.get('all'),before);
 }
});
test('diagnostics: image failure, crash, no endpoints, capacity and recovery',()=>{
 const c=new Cluster(); c.apply(EXAMPLE.replace('nginx:stable','nginx:missing'));
 assert(c.pods.every(p=>p.status==='ImagePullBackOff')); assert.equal(c.endpoints(c.services.get('web')).length,0);
 assert.match(c.run(`kubectl describe pod ${c.pods[0].name}`,EXAMPLE),/Failed/);
 assert.throws(()=>c.run(`kubectl logs ${c.pods[0].name}`,EXAMPLE));
 c.apply(EXAMPLE.replace('nginx:stable','nginx:broken')); assert.match(c.run(`kubectl logs ${c.pods[0].name}`,EXAMPLE),/fatal/);
 c.apply(EXAMPLE.replace('replicas: 2','replicas: 10')); assert.equal(c.pods.filter(p=>p.status==='Pending').length,2);
 c.run('kubectl scale deployment web --replicas 8',EXAMPLE); assert(c.pods.every(p=>p.status==='Running'));
 const wrong=EXAMPLE.replace('kind: Service\nmetadata:\n  name: web\nspec:\n  selector:\n    app: web','kind: Service\nmetadata:\n  name: web\nspec:\n  selector:\n    app: other');
 c.apply(wrong); assert.equal(c.endpoints(c.services.get('web')).length,0);
 c.apply(EXAMPLE); assert.equal(c.endpoints(c.services.get('web')).length,2);
});
test('apply overrides manual scale, template update replaces pods, selector stays immutable',()=>{
 const c=new Cluster(); c.apply(EXAMPLE); c.run('kubectl scale deployment web --replicas=0',EXAMPLE); assert.equal(c.pods.length,0);
 c.apply(EXAMPLE); const names=c.pods.map(p=>p.name); c.apply(EXAMPLE.replace('nginx:stable','nginx:alpine'));
 assert(c.pods.every(p=>!names.includes(p.name))); assert.throws(()=>c.apply(EXAMPLE.replaceAll('app: web','app: other')),/неизменяем/);
 assert.match(c.run('kubectl rollout status deployment/web',EXAMPLE),/successfully/);
 c.run('kubectl rollout restart deployment/web',EXAMPLE); assert.equal(c.pods.length,2);
});
test('unsupported commands and flags are explicit, outputs support named lookups and YAML',()=>{
 const c=new Cluster(); c.apply(EXAMPLE);
 for(const cmd of ['rm -rf /','kubectl get secrets','kubectl get pods -n production','kubectl scale deployment web --replicas=-1','kubectl apply -f other.yaml','kubectl get pods | cat','kubectl logs no-such-pod'])assert.throws(()=>c.run(cmd,EXAMPLE));
 assert.match(c.run('kubectl get deployment web -o yaml',EXAMPLE),/kind: Deployment/);
 assert.match(c.run('kubectl get pods -o wide',EXAMPLE),/worker-1/);
 assert.match(c.run('kubectl config current-context',EXAMPLE),/study-simulator/);
 c.reset(); assert.equal(c.pods.length,0);assert.equal(c.services.size,0);assert.equal(c.events.length,0);
});
test('existing pods keep their assigned worker after another pod is deleted',()=>{
 const c=new Cluster(); c.apply(EXAMPLE.replace('replicas: 2','replicas: 6'));
 const before=c.pods.map(p=>({...p})); c.run(`kubectl delete pod ${before[0].name}`,EXAMPLE);
 for(const old of before.slice(1))assert.equal(c.pods.find(p=>p.name===old.name).node,old.node);
 assert.equal(c.pods.length,6);
});
