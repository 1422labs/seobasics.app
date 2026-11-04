{{- define "seobasics.fullname" -}}
{{- if contains .Chart.Name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "seobasics.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "seobasics.selector" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "seobasics.itemPath" -}}
{{- required "onepassword.itemPath is required: dev and prod each have their own 1Password item" .Values.onepassword.itemPath -}}
{{- end -}}

{{- define "seobasics.secretName" -}}
{{- default (include "seobasics.fullname" .) .Values.onepassword.secretName -}}
{{- end -}}

{{- define "seobasics.image" -}}
{{ .Values.image.repository }}:{{ required "image.tag is required: an immutable sha-<commit> tag, never latest" .Values.image.tag }}
{{- end -}}

{{/*
The operator restarts a Deployment that uses the item's Secret when the item changes, if the
Deployment (or the OnePasswordItem) has this annotation; it does not read pod-template
annotations. The Secret itself comes only from the OnePasswordItem: no item-path annotation,
so the operator doesn't manage a second copy.
*/}}
{{- define "seobasics.restartAnnotation" -}}
operator.1password.io/auto-restart: "true"
{{- end -}}

{{/* Neither pod talks to the Kubernetes API. */}}
{{- define "seobasics.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: 1001
runAsGroup: 1001
fsGroup: 1001
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{/* The image writes nothing under /app; /tmp is the only writable path. */}}
{{- define "seobasics.containerSecurityContext" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities:
  drop: ["ALL"]
{{- end -}}

{{- define "seobasics.tmpVolume" -}}
volumes:
  - name: tmp
    emptyDir:
      sizeLimit: 64Mi
{{- end -}}

{{- define "seobasics.tmpMount" -}}
volumeMounts:
  - name: tmp
    mountPath: /tmp
{{- end -}}

{{- define "seobasics.dnsConfig" -}}
dnsConfig:
  options:
    - name: ndots
      value: "1"
{{- end -}}
