# Kubernetes learning lab

Entry point: `../kubernetes.html`. Static ES modules; no build, backend, account,
external CDN or cluster connection. The study index discovers this HTML page
through the existing GitHub directory listing after merge to the default branch.
Serve the repository over HTTP (ES modules do not run reliably from `file://`).

`cluster.mjs` owns the bounded simulation and YAML validation. `app.mjs` connects
that same state to the editor, console, topology and task checks. User text is
rendered through textContent, never evaluated or inserted as HTML. Only the editor
draft is saved in localStorage; cluster state resets on reload. Download exports
the exact current draft, including any edits that have not been applied.

Supported: apply of multi-document YAML; get pods/deployments/services/nodes/
endpoints/events/all; named lookups and YAML output for pods/deployments/services;
describe; logs; scale; delete; rollout status/restart; current-context; help, ls,
cat app.yaml, clear. The on-page help is the exact supported command reference.
Unsupported commands/flags produce errors rather than run a shell.

## Deliberate teaching limits

- default namespace, Deployment and ClusterIP Service only, one container per Pod.
- Two workers with four arbitrary slots each. Existing Pods keep their assigned
  worker; pending Pods are scheduled when a slot becomes available.
- Reconciliation is synchronous. Template updates/restart replace all owned Pods
  immediately; no rolling-update timeline, real ReplicaSet objects or revisions.
- `:missing` simulates image pull failure; `:broken` simulates a crashing process.
  All other image strings succeed, with no registry validation or downloads.
- Running equals Ready. Service targets are shown from labels and readiness only.
  No packets, port listeners, DNS, probes, RBAC, volumes or CPU/memory scheduling.
- Additional manifest fields can be retained but are not simulated. Limits are
  stated on the page. Invalid input is validated before changing cluster state;
  this atomic exercise behavior differs from real multi-object kubectl apply.
- At most 20 replicas per Deployment, 20 YAML documents and 50 KB per manifest.

## Verification

From repository root:

```sh
node --test tests/kubernetes.test.mjs
node --check study/kubernetes/app.mjs
```

Manual browser check: apply → scale to 4 → select a Pod → submit the prepared
`delete` command → verify a new Pod and 4/4 tasks. Load the broken-image scenario,
apply, correct the image and apply again. Verify malformed YAML leaves the
existing cluster intact. Reload to check draft restoration and empty cluster.

YAML parser vendored from js-yaml 4.1.1 (`dist/js-yaml.mjs`), MIT license in
`vendor/LICENSE-js-yaml`. Source: https://www.npmjs.com/package/js-yaml/v/4.1.1 .
