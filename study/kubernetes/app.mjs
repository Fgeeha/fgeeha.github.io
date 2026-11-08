import { Cluster, EXAMPLE } from './cluster.mjs';
const $ = id => document.getElementById(id);
const cluster = new Cluster();
const editor = $('manifest'), terminal = $('terminal'), input = $('command');
const storageKey = 'study-kubernetes-draft-v1';
let saved = ''; try { saved = localStorage.getItem(storageKey) || ''; } catch { /* Storage may be disabled. */ }
editor.value = saved || EXAMPLE;
let applied = null, history = [], cursor = 0, historyDraft = '';
const scenarios = {
  start:{yaml:EXAMPLE,note:'Примени манифест и увеличь число реплик до 4. Выбери Pod на схеме и выполни подготовленную команду delete. Контроллер создаст замену.'},
  image:{yaml:EXAMPLE.replace('nginx:stable','nginx:missing'),note:'Примени YAML. Найди причину ImagePullBackOff через describe. Исправь image на nginx:stable в редакторе и снова выполни apply.'},
  selector:{yaml:EXAMPLE.replace('kind: Service\nmetadata:\n  name: web\nspec:\n  selector:\n    app: web','kind: Service\nmetadata:\n  name: web\nspec:\n  selector:\n    app: other'),note:'Примени YAML. Service не выбирает ни одного Pod. Сравни его selector с метками Pod, исправь YAML и примени снова.'},
  capacity:{yaml:EXAMPLE.replace('replicas: 2','replicas: 10'),note:'Примени YAML: 10 Pod не помещаются в 8 условных слотов. Изучи describe для Pending Pod и уменьши replicas до 8 или меньше.'}
};
function output(text){ terminal.textContent = (terminal.textContent + text + '\n').slice(-24000); terminal.scrollTop = terminal.scrollHeight; }
function dirty(){ $('draft-status').textContent = editor.value === applied ? 'Применено' : 'Есть изменения'; }
function save(){ try { localStorage.setItem(storageKey,editor.value); } catch { /* The exercise remains usable without storage. */ } dirty(); }
function run(command){
  if(!command.trim()) return;
  if(command.trim() === 'clear'){ terminal.textContent=''; return; }
  output(`\nstudent@lab:~$ ${command}`);
  try { output(cluster.run(command,editor.value)); if(command.trim().split(/\s+/).join(' ')==='kubectl apply -f app.yaml') applied=editor.value; }
  catch(error){ output('Ошибка: ' + error.message); }
  dirty(); render();
}
function element(tag, className, text){ const e=document.createElement(tag); if(className)e.className=className; if(text!==undefined)e.textContent=text; return e; }
function resourceButton(title, detail, command, cls='resource'){
  const b=element('button',cls,title); b.type='button'; b.append(element('span','',detail)); b.addEventListener('click',()=>run(command)); return b;
}
function podButton(p){
  const b=element('button','pod'+(p.status==='Pending'?' pending-pod':p.status!=='Running'?' error':''),`● ${p.name}`);
  b.type='button'; b.append(element('small','',`${p.status} · ${p.image}`));
  b.addEventListener('click',()=>{run(`kubectl describe pod ${p.name}`); input.value=`kubectl delete pod ${p.name}`; input.focus({preventScroll:true});});
  b.title='Показать describe и подготовить команду удаления'; return b;
}
function render(){
  const running=cluster.pods.filter(p=>p.status==='Running').length;
  $('summary').textContent=`${running}/${cluster.pods.length} Ready · ${cluster.deployments.size} Deployment`;
  $('services').replaceChildren(); $('owners').replaceChildren(); $('nodes').replaceChildren();
  if(!cluster.services.size) $('services').append(element('p','empty','Service ещё не создан.'));
  for(const [name,s] of cluster.services){
    const targets=cluster.endpoints(s);
    $('services').append(resourceButton(`Service / ${name}`,`${s.spec.clusterIP}:${s.spec.ports[0].port} → ${s.spec.ports[0].targetPort ?? s.spec.ports[0].port} · selector ${JSON.stringify(s.spec.selector)} · Ready Pod: ${targets.map(p=>p.name).join(', ') || 'нет'}`,`kubectl describe service ${name}`));
  }
  for(const [name,d] of cluster.deployments){
    $('owners').append(resourceButton(`Deployment / ${name} → ReplicaSet / ${name}-lab`,`${d.spec.replicas} desired · labels ${JSON.stringify(d.spec.template.metadata.labels)}`,`kubectl describe deployment ${name}`));
  }
  for(const name of ['worker-1','worker-2',null]){
    const pods=cluster.pods.filter(p=>p.node===name); if(name===null && !pods.length) continue;
    const box=element('div',name?'node':'node pending');
    const title=element('h4','',name ?? 'Ожидают размещения'); title.append(element('span','',name?`${pods.length}/4 слота`:`${pods.length} Pending`)); box.append(title);
    if(!pods.length) box.append(element('p','empty','Пусто · примени app.yaml'));
    pods.forEach(p=>box.append(podButton(p))); $('nodes').append(box);
  }
  const d=cluster.deployments.get('web'), s=cluster.services.get('web');
  const tasks = [
    ['Создай Deployment web и Service web через apply.',!!d && !!s],
    ['Получи минимум 4 работающих Pod приложения web.',cluster.pods.filter(p=>p.owner==='web' && p.status==='Running').length>=4],
    ['Удали Pod и наблюдай его автоматическую замену.',cluster.pods.some(p=>p.name===cluster.replacementPod && p.status==='Running')],
    ['Добейся, чтобы Service web выбрал хотя бы один готовый Pod.',!!s && cluster.endpoints(s).length>0]
  ];
  $('tasks').replaceChildren(...tasks.map(([label,done])=>element('li',done?'done':'',`${done?'✓ ':''}${label}`)));
  $('task-count').textContent=`${tasks.filter(t=>t[1]).length} / ${tasks.length}`;
}
$('command-form').addEventListener('submit',e=>{e.preventDefault();const cmd=input.value.trim();if(!cmd)return;history.push(cmd);history=history.slice(-100);cursor=history.length;historyDraft='';input.value='';run(cmd);});
input.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp' || e.key==='ArrowDown'){
    e.preventDefault(); if(cursor===history.length)historyDraft=input.value;
    cursor=Math.max(0,Math.min(history.length,cursor+(e.key==='ArrowUp'?-1:1))); input.value=cursor===history.length?historyDraft:history[cursor];
  }
  if(e.key==='Tab'){
    const options=['help','kubectl apply -f app.yaml','kubectl get pods','kubectl get services','kubectl get deployments','kubectl get nodes','kubectl get endpoints','kubectl get events',...cluster.pods.flatMap(p=>[`kubectl describe pod ${p.name}`,`kubectl delete pod ${p.name}`,`kubectl logs ${p.name}`])];
    const found=options.filter(v=>v.startsWith(input.value)); if(found.length===1){e.preventDefault();input.value=found[0];}
  }
});
editor.addEventListener('input',save);
editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');save();}});
$('apply').addEventListener('click',()=>run('kubectl apply -f app.yaml'));
$('clear').addEventListener('click',()=>{terminal.textContent='';});
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>run(b.dataset.command)));
$('reset').addEventListener('click',()=>{cluster.reset();applied=null;terminal.textContent='';output('Кластер сброшен. Редактор сохранён. Выполни kubectl apply -f app.yaml.');dirty();render();});
$('load-scenario').addEventListener('click',()=>{
  const scenario=scenarios[$('scenario').value]; editor.value=scenario.yaml; cluster.reset();applied=null;terminal.textContent='';save();$('scenario-note').textContent=scenario.note;output('Сценарий загружен. Нажми «Применить YAML», чтобы начать.');render();
});
$('scenario-note').textContent=scenarios.start.note;
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([editor.value],{type:'text/yaml;charset=utf-8'}));const a=element('a');a.href=url;a.download='app.yaml';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('menu').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu').setAttribute('aria-expanded',String(open));});
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{$('sidebar').classList.remove('open');$('menu').setAttribute('aria-expanded','false');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape' && $('sidebar').classList.contains('open')){$('sidebar').classList.remove('open');$('menu').setAttribute('aria-expanded','false');$('menu').focus();}});
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}},{rootMargin:'-10% 0px -65% 0px'});
document.querySelectorAll('main section').forEach(s=>observer.observe(s));
function progress(){const max=document.documentElement.scrollHeight-innerHeight;$('progress').style.width=(max>0?scrollY/max*100:0)+'%';}
addEventListener('scroll',progress,{passive:true});addEventListener('resize',progress);
output('Kubernetes Lab / study-simulator\nКластер пуст. Начни с «Применить YAML» или введи help.\nЭто имитация kubectl. Команды не обращаются к серверам.');
if(saved)output('Восстановлен черновик YAML. Для создания ресурсов снова выполни apply.');
dirty();render();progress();
