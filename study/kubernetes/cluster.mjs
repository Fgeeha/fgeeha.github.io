// A bounded teaching model, not a Kubernetes API or a shell.
import { loadAll, dump, JSON_SCHEMA } from './vendor/js-yaml.mjs';
export const EXAMPLE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:stable
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
`;
export const HELP = `Поддерживается учебное подмножество kubectl (namespace: default):
  kubectl apply -f app.yaml
  kubectl get pods|deployments|services|nodes|endpoints|events|all
  kubectl get pod NAME -o yaml
  kubectl get pods -o wide
  kubectl describe pod|deployment|service NAME
  kubectl logs POD
  kubectl scale deployment web --replicas=4
  kubectl delete pod POD
  kubectl delete deployment|service NAME
  kubectl rollout status deployment/web
  kubectl rollout restart deployment/web
  kubectl config current-context
  ls · cat app.yaml · clear · help
Сокращения: po, deploy, svc, ep, no; также TYPE/NAME (deployment/web).
↑ / ↓ — история команд. Tab — дополнение команды или имени Pod.
Это имитация: shell, сеть, контейнеры и настоящий кластер не запускаются.`;
const aliases = { pod:'pods',po:'pods',pods:'pods',deploy:'deployments',deployment:'deployments',deployments:'deployments',svc:'services',service:'services',services:'services',no:'nodes',node:'nodes',nodes:'nodes',ep:'endpoints',endpoints:'endpoints',events:'events',all:'all' };
const NODES = [['control-plane','control-plane'],['worker-1','worker'],['worker-2','worker']];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const map = v => v && typeof v === 'object' && !Array.isArray(v);
const labelsOK = v => map(v) && Object.keys(v).length > 0 && Object.values(v).every(x => typeof x === 'string');
const matches = (labels, selector) => Object.entries(selector).every(([k,v]) => labels[k] === v);
const portOK = n => Number.isInteger(n) && n >= 1 && n <= 65535;
const table = (headers, rows) => [headers,...rows].map(r => r.map((v,i) => String(v).padEnd(Math.max(...[headers,...rows].map(a=>String(a[i] ?? '').length))+3)).join('').trimEnd()).join('\n');
export class Cluster {
  constructor(){ this.reset(); }
  reset(){ this.deployments = new Map(); this.services = new Map(); this.pods = []; this.events = []; this.sequence = 0; this.serviceSequence = 10; this.replacementPod = null; }
  event(text){ this.events.push(text); this.events = this.events.slice(-40); }
  validate(doc){
    assert(map(doc), 'Документ YAML должен быть объектом.');
    assert(['Deployment','Service'].includes(doc.kind), 'В симуляторе поддерживаются только Deployment и Service.');
    assert(doc.apiVersion === (doc.kind === 'Deployment' ? 'apps/v1' : 'v1'), 'Проверьте apiVersion: apps/v1 для Deployment, v1 для Service.');
    assert(/^[a-z]([a-z0-9-]{0,48}[a-z0-9])?$/.test(doc.metadata?.name ?? ''), 'metadata.name: используйте 1–50 строчных латинских букв, цифр или дефисов; начните с буквы.');
    assert(!doc.metadata.namespace || doc.metadata.namespace === 'default', 'В песочнице доступен только namespace default.');
    const s = doc.spec;
    assert(map(s), 'Требуется spec.');
    if(doc.kind === 'Deployment'){
      const n = s.replicas ?? 1;
      assert(Number.isInteger(n) && n >= 0 && n <= 20, 'spec.replicas: целое число от 0 до 20 в учебной модели.');
      assert(labelsOK(s.selector?.matchLabels), 'Задайте spec.selector.matchLabels (значения меток — строки).');
      assert(!s.selector.matchExpressions, 'matchExpressions не поддерживается в симуляторе.');
      const t = s.template;
      assert(labelsOK(t?.metadata?.labels) && matches(t.metadata.labels, s.selector.matchLabels), 'selector.matchLabels должен совпадать с метками template.metadata.labels.');
      const cs = t.spec?.containers;
      assert(Array.isArray(cs) && cs.length === 1, 'В учебной модели требуется ровно один контейнер в Pod.');
      assert(typeof cs[0].name === 'string' && cs[0].name.length > 0 && typeof cs[0].image === 'string' && cs[0].image.trim().length > 0, 'У контейнера должны быть name и image.');
      assert(!cs[0].ports || (Array.isArray(cs[0].ports) && cs[0].ports.every(p => portOK(p.containerPort))), 'containerPort должен быть целым числом от 1 до 65535.');
      const old = this.deployments.get(doc.metadata.name);
      assert(!old || JSON.stringify(old.spec.selector) === JSON.stringify(s.selector), 'Deployment selector неизменяем: удалите Deployment или верните прежний selector.');
    } else {
      assert(!s.type || s.type === 'ClusterIP', 'В модели поддерживается Service типа ClusterIP.');
      assert(labelsOK(s.selector), 'Задайте spec.selector для Service.');
      assert(Array.isArray(s.ports) && s.ports.length === 1 && portOK(s.ports[0].port) && portOK(s.ports[0].targetPort ?? s.ports[0].port), 'В модели Service нужен один числовой port/targetPort от 1 до 65535.');
      assert(!s.ports[0].protocol || s.ports[0].protocol === 'TCP', 'В модели поддерживается только TCP.');
    }
  }
  apply(yaml){
    assert(yaml.length <= 50000, 'Манифест слишком большой (максимум 50 КБ).');
    const docs = loadAll(yaml, null, { schema:JSON_SCHEMA, json:false }).filter(d => d != null);
    assert(docs.length > 0 && docs.length <= 20, 'Нужно от 1 до 20 YAML-документов.');
    const keys = new Set();
    for(const doc of docs){ this.validate(doc); const key = doc.kind + '/' + doc.metadata.name; assert(!keys.has(key), 'Один ресурс указан дважды: ' + key); keys.add(key); }
    // Validate the complete exercise before changing state (a deliberate simplification).
    const result = docs.map(doc => {
      const store = doc.kind === 'Deployment' ? this.deployments : this.services;
      const name = doc.metadata.name, old = store.get(name);
      const next = structuredClone(doc);
      next.metadata.namespace = 'default';
      if(doc.kind === 'Deployment'){
        next.spec.replicas ??= 1;
        if(old && JSON.stringify(old.spec.template) !== JSON.stringify(next.spec.template)) this.pods = this.pods.filter(p => p.owner !== name);
      } else next.spec.clusterIP = old?.spec.clusterIP ?? `10.96.0.${this.serviceSequence++}`;
      store.set(name, next);
      const message = `${doc.kind.toLowerCase()}/${name} ${old ? 'configured' : 'created'}`;
      this.event(message); return message;
    });
    this.reconcile(); return result.join('\n');
  }
  reconcile(){
    this.pods = this.pods.filter(p => this.deployments.has(p.owner));
    for(const [name,d] of this.deployments){
      let owned = this.pods.filter(p=>p.owner === name);
      while(owned.length > d.spec.replicas){ const p = owned.pop(); this.pods = this.pods.filter(x=>x!==p); }
      while(owned.length < d.spec.replicas){
        const p = { name:`${name}-lab-${String(++this.sequence).padStart(3,'0')}`,owner:name,labels:structuredClone(d.spec.template.metadata.labels),containerName:d.spec.template.spec.containers[0].name,image:d.spec.template.spec.containers[0].image,node:null,status:'Pending' };
        owned.push(p); this.pods.push(p); this.event(`ReplicaSet ${name}-lab: created pod ${p.name}`);
      }
    }
    // Two workers, four teaching slots each; not a real resource scheduler.
    const slots = [1,2].map(i => this.pods.filter(p => p.node === `worker-${i}`).length);
    for(const p of this.pods){
      if(!p.node){
        const i = slots[0] <= slots[1] ? 0 : 1;
        p.node = slots[i] < 4 ? `worker-${i+1}` : null;
        if(p.node) slots[i]++;
      }
      p.status = !p.node ? 'Pending' : p.image.endsWith(':missing') ? 'ImagePullBackOff' : p.image.endsWith(':broken') ? 'CrashLoopBackOff' : 'Running';
    }
  }
  endpoints(s){ return this.pods.filter(p=>p.status==='Running' && matches(p.labels,s.spec.selector)); }
  get(resource, name, output){
    const kind = aliases[resource]; assert(kind, 'Неизвестный ресурс. Введите help.');
    if(kind === 'all') return ['deployments','pods','services'].map(k=>this.get(k)).join('\n\n');
    const items = kind === 'pods' ? this.pods : kind === 'deployments' ? [...this.deployments.values()] : kind === 'services' || kind === 'endpoints' ? [...this.services.values()] : kind === 'nodes' ? NODES.map(([name]) => ({name})) : [];
    const found = name ? items.filter(x => (x.name ?? x.metadata.name) === name) : items;
    if(name) assert(found.length, `Error from server (NotFound): ${kind} "${name}" not found`);
    if(output === 'yaml'){
      assert(['pods','deployments','services'].includes(kind), '-o yaml поддерживается для pods, deployments и services.');
      const docs = found.map(x => kind === 'pods' ? {apiVersion:'v1',kind:'Pod',metadata:{name:x.name,namespace:'default',labels:x.labels},spec:{nodeName:x.node,containers:[{name:x.containerName,image:x.image}]},status:{phase:['Pending','ImagePullBackOff'].includes(x.status) ? 'Pending' : 'Running',containerStatuses:[{name:x.containerName,ready:x.status === 'Running',state:x.status === 'Running' ? {running:{}} : {waiting:{reason:x.status}}}]}} : x);
      return dump(name ? docs[0] : {apiVersion:'v1',kind:'List',items:docs}, {noRefs:true});
    }
    if(kind === 'nodes') return table(['NAME','STATUS','ROLE'],NODES.filter(([n]) => !name || n === name).map(([n,role]) => [n,'Ready',role]));
    if(kind === 'events') return this.events.length ? this.events.join('\n') : 'No events found in default namespace.';
    if(!found.length) return 'No resources found in default namespace.';
    if(kind === 'pods') return table(['NAME','READY','STATUS','NODE',...(output === 'wide' ? ['IMAGE'] : [])],found.map(p=>[p.name,p.status==='Running'?'1/1':'0/1',p.status,p.node ?? '<none>',...(output === 'wide' ? [p.image] : [])]));
    if(kind === 'deployments') return table(['NAME','READY','DESIRED'],found.map(d=>[d.metadata.name,`${this.pods.filter(p=>p.owner===d.metadata.name && p.status==='Running').length}/${d.spec.replicas}`,d.spec.replicas]));
    if(kind === 'services') return table(['NAME','TYPE','CLUSTER-IP','PORT'],found.map(s=>[s.metadata.name,'ClusterIP',s.spec.clusterIP,`${s.spec.ports[0].port}/TCP`]));
    return table(['NAME','READY PODS'],found.map(s=>[s.metadata.name,this.endpoints(s).map(p=>p.name).join(', ') || '<none>']));
  }
  run(command, yaml){
    const cmd = command.trim();
    if(cmd === 'help' || cmd === 'kubectl --help') return HELP;
    if(cmd === 'clear') return '';
    if(cmd === 'ls') return 'app.yaml';
    if(cmd === 'cat app.yaml') return yaml;
    assert(!/[|;&<>`$]/.test(cmd), 'Это учебная консоль: shell, перенаправления и цепочки команд не поддерживаются. Введите help.');
    const t = cmd.split(/\s+/);
    assert(t.shift() === 'kubectl', 'Команда не поддерживается. Введите help.');
    const verb = t.shift();
    if(verb === 'config' && t.join(' ') === 'current-context') return 'study-simulator';
    if(verb === 'apply'){
      assert(t.join(' ') === '-f app.yaml', 'Используйте kubectl apply -f app.yaml — содержимое берётся из редактора.');
      return this.apply(yaml);
    }
    if(verb === 'get'){
      const resource = t.shift(); let name, output;
      while(t.length){ const arg=t.shift(); if(arg === '-o'){ output=t.shift(); assert(['wide','yaml'].includes(output), 'Доступны -o wide и -o yaml.'); } else { assert(!arg.startsWith('-') && !name, 'Флаг не поддерживается. Введите help.'); name=arg; } }
      return this.get(resource,name,output);
    }
    if(verb === 'scale'){
      const m = t.join(' ').match(/^(?:deployment|deploy)(?:\s+|\/)([a-z0-9-]+) --replicas(?:=|\s+)(\d+)$/);
      assert(m, 'Используйте kubectl scale deployment web --replicas=4');
      const d=this.deployments.get(m[1]); assert(d, 'Deployment не найден.');
      assert(Number(m[2]) <= 20, 'В учебной модели максимум 20 реплик.');
      d.spec.replicas=Number(m[2]); this.event(`Scaled ${m[1]} to ${m[2]}`); this.reconcile(); return `deployment.apps/${m[1]} scaled`;
    }
    if(verb === 'delete' || verb === 'describe'){
      const parts = t.join(' ').replace('/', ' ').split(/\s+/); assert(parts.length===2, `Используйте kubectl ${verb} pod|deployment|service NAME`);
      const [type,name]=parts, kind=aliases[type]; assert(['pods','deployments','services'].includes(kind), 'Доступны pod, deployment и service.');
      const item=kind==='pods'?this.pods.find(p=>p.name===name):(kind==='deployments'?this.deployments:this.services).get(name);
      assert(item, `Error from server (NotFound): ${type} "${name}" not found`);
      if(verb === 'delete'){
        const before = this.sequence, noun = kind.slice(0,-1);
        if(kind==='pods') this.pods=this.pods.filter(p=>p!==item);
        else (kind==='deployments'?this.deployments:this.services).delete(name);
        this.event(`Deleted ${noun}/${name}`); this.reconcile();
        if(kind==='pods' && this.sequence > before) this.replacementPod = this.pods.at(-1).name;
        return `${noun} "${name}" deleted`;
      }
      if(kind==='pods') return `Name: ${name}\nNode: ${item.node ?? '<none>'}\nStatus: ${item.status}\nImage: ${item.image}\nControlled By: ReplicaSet/${item.owner}-lab\nEvents (simulated): ${item.status==='Pending'?'FailedScheduling: все 8 учебных слотов заняты':item.status==='ImagePullBackOff'?'Failed: учебный образ :missing не найден':item.status==='CrashLoopBackOff'?'BackOff: учебный контейнер :broken завершается с ошибкой':'Scheduled; Pulled; Created; Started'}`;
      if(kind==='services') return `Name: ${name}\nSelector: ${JSON.stringify(item.spec.selector)}\nPort: ${item.spec.ports[0].port} → ${item.spec.ports[0].targetPort ?? item.spec.ports[0].port}\nReady Pods: ${this.endpoints(item).map(p=>p.name).join(', ') || '<none>'}`;
      return `Name: ${name}\nReplicas: ${item.spec.replicas} desired\nSelector: ${JSON.stringify(item.spec.selector.matchLabels)}\nImage: ${item.spec.template.spec.containers[0].image}`;
    }
    if(verb==='logs'){
      assert(t.length===1, 'Используйте kubectl logs POD'); const p=this.pods.find(p=>p.name===t[0]); assert(p,'Pod не найден.');
      assert(p.node && p.status!=='ImagePullBackOff', `Контейнер ещё не запущен: ${p.status}`);
      return p.status==='CrashLoopBackOff'?'[simulated] fatal: application exited with code 1':'[simulated] server started; listening on container port. Это учебные логи.';
    }
    if(verb==='rollout'){
      assert(t.length===2 && ['status','restart'].includes(t[0]), 'Используйте kubectl rollout status|restart deployment/web');
      const name=t[1].match(/^(?:deployment|deploy)\/([a-z0-9-]+)$/)?.[1], d=this.deployments.get(name); assert(d,'Deployment не найден; используйте deployment/NAME.');
      if(t[0]==='restart'){ this.pods=this.pods.filter(p=>p.owner!==name); this.event(`Restarted ${name}`); this.reconcile(); return `deployment.apps/${name} restarted (упрощённая замена всех Pod)`; }
      const ready=this.pods.filter(p=>p.owner===name && p.status==='Running').length;
      return ready===d.spec.replicas?`deployment "${name}" successfully rolled out`:`Waiting: ${ready} of ${d.spec.replicas} replicas available. Проверьте describe pod.`;
    }
    throw new Error('Команда или её аргументы не поддерживаются. Введите help.');
  }
}
