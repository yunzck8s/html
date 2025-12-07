# Kubernetes 部署指南

本目录包含在 Kubernetes 集群中部署域名延迟监控工具的所有配置文件。

## 📁 目录结构

```
k8s/
├── base/                           # 基础配置
│   ├── deployment.yaml            # Deployment 资源
│   ├── service.yaml               # Service 资源
│   ├── ingress.yaml               # Ingress 资源
│   └── kustomization.yaml         # Kustomize 基础配置
├── overlays/                      # 环境覆盖配置
│   ├── dev/                       # 开发环境
│   │   ├── kustomization.yaml
│   │   └── deployment-patch.yaml
│   └── prod/                      # 生产环境
│       ├── kustomization.yaml
│       ├── deployment-patch.yaml
│       └── hpa.yaml
└── README.md

argocd/
├── application-dev.yaml           # ArgoCD 开发环境应用
├── application-prod.yaml          # ArgoCD 生产环境应用
├── appproject.yaml                # ArgoCD 项目配置
└── applicationset.yaml            # ArgoCD ApplicationSet（可选）
```

## 🚀 快速开始

### 方法 1: 使用 kubectl + kustomize

#### 部署到开发环境
```bash
# 创建命名空间
kubectl create namespace latency-monitor-dev

# 应用配置
kubectl apply -k k8s/overlays/dev

# 查看部署状态
kubectl get pods -n latency-monitor-dev
kubectl get svc -n latency-monitor-dev
kubectl get ingress -n latency-monitor-dev
```

#### 部署到生产环境
```bash
# 创建命名空间
kubectl create namespace latency-monitor

# 应用配置
kubectl apply -k k8s/overlays/prod

# 查看部署状态
kubectl get pods -n latency-monitor
kubectl get svc -n latency-monitor
kubectl get ingress -n latency-monitor
kubectl get hpa -n latency-monitor
```

### 方法 2: 使用 ArgoCD

#### 前置要求
确保已安装 ArgoCD：
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

#### 部署 Application

##### 选项 A: 部署单个环境
```bash
# 部署开发环境
kubectl apply -f argocd/application-dev.yaml

# 部署生产环境
kubectl apply -f argocd/application-prod.yaml
```

##### 选项 B: 使用 ApplicationSet（推荐）
```bash
# 一次性部署所有环境
kubectl apply -f argocd/applicationset.yaml
```

##### 选项 C: 使用 AppProject（企业推荐）
```bash
# 1. 创建项目
kubectl apply -f argocd/appproject.yaml

# 2. 修改 application-*.yaml 中的 project 字段为 "latency-monitor"
# 3. 应用 Application
kubectl apply -f argocd/application-dev.yaml
kubectl apply -f argocd/application-prod.yaml
```

#### 访问 ArgoCD UI
```bash
# 获取初始密码
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 端口转发
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 访问 https://localhost:8080
# 用户名: admin
# 密码: <上面获取的密码>
```

## ⚙️ 配置说明

### Base 配置

#### Deployment
- **镜像**: `zunshen/latency-monitor:latest`
- **副本数**: 2（可在 overlays 中覆盖）
- **资源限制**:
  - Requests: 50m CPU, 64Mi Memory
  - Limits: 200m CPU, 128Mi Memory
- **探针**: Liveness 和 Readiness 探针
- **安全上下文**: 非 root 用户运行，只读文件系统

#### Service
- **类型**: ClusterIP
- **端口**: 80

#### Ingress
- **TLS**: 支持（需配置 cert-manager）
- **域名**: 需要修改为实际域名（在 `ingress.yaml` 中）

### Overlays 配置

#### Dev 环境
- **命名空间**: `latency-monitor-dev`
- **副本数**: 1
- **资源**: 更少的资源限制
- **镜像标签**: `dev`

#### Prod 环境
- **命名空间**: `latency-monitor`
- **副本数**: 3
- **资源**: 更多的资源限制
- **镜像标签**: `latest`
- **HPA**: 自动伸缩（2-10 副本）
- **Pod 反亲和性**: 分散到不同节点

## 🔧 自定义配置

### 修改域名
编辑 `k8s/base/ingress.yaml`:
```yaml
spec:
  tls:
  - hosts:
    - your-domain.com  # 修改为你的域名
    secretName: latency-monitor-tls
  rules:
  - host: your-domain.com  # 修改为你的域名
```

### 修改 Git 仓库地址
编辑 ArgoCD Application 文件，修改 `repoURL`:
```yaml
spec:
  source:
    repoURL: https://github.com/your-username/your-repo.git
```

### 修改镜像版本
编辑对应环境的 `kustomization.yaml`:
```yaml
images:
- name: zunshen/latency-monitor
  newTag: v1.0.0  # 指定版本
```

### 调整资源限制
编辑对应环境的 `deployment-patch.yaml`:
```yaml
spec:
  template:
    spec:
      containers:
      - name: latency-monitor
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
```

### 配置 HPA
生产环境已包含 HPA 配置，可根据需要调整：
```yaml
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # 调整 CPU 阈值
```

## 📊 监控和日志

### 查看日志
```bash
# 查看 Pod 日志
kubectl logs -f deployment/latency-monitor -n latency-monitor

# 查看所有 Pod 日志
kubectl logs -l app=latency-monitor -n latency-monitor --tail=100
```

### 查看资源使用
```bash
# 查看 Pod 资源使用
kubectl top pods -n latency-monitor

# 查看 HPA 状态
kubectl get hpa -n latency-monitor
kubectl describe hpa latency-monitor -n latency-monitor
```

### ArgoCD 同步状态
```bash
# 查看 Application 状态
kubectl get application -n argocd

# 查看详细信息
argocd app get latency-monitor-prod

# 手动同步
argocd app sync latency-monitor-prod
```

## 🔄 更新和回滚

### 使用 kubectl
```bash
# 更新镜像
kubectl set image deployment/latency-monitor \
  latency-monitor=zunshen/latency-monitor:v2.0.0 \
  -n latency-monitor

# 查看发布历史
kubectl rollout history deployment/latency-monitor -n latency-monitor

# 回滚到上一个版本
kubectl rollout undo deployment/latency-monitor -n latency-monitor

# 回滚到指定版本
kubectl rollout undo deployment/latency-monitor --to-revision=2 -n latency-monitor
```

### 使用 ArgoCD
```bash
# 同步到最新版本
argocd app sync latency-monitor-prod

# 回滚到之前的版本
argocd app rollback latency-monitor-prod <revision-id>

# 查看历史版本
argocd app history latency-monitor-prod
```

## 🧹 清理

### 使用 kubectl
```bash
# 删除开发环境
kubectl delete -k k8s/overlays/dev
kubectl delete namespace latency-monitor-dev

# 删除生产环境
kubectl delete -k k8s/overlays/prod
kubectl delete namespace latency-monitor
```

### 使用 ArgoCD
```bash
# 删除 Application（会级联删除所有资源）
kubectl delete -f argocd/application-dev.yaml
kubectl delete -f argocd/application-prod.yaml

# 或使用 ArgoCD CLI
argocd app delete latency-monitor-dev
argocd app delete latency-monitor-prod
```

## 🔐 安全建议

1. **使用私有镜像仓库**: 配置 `imagePullSecrets`
2. **启用 NetworkPolicy**: 限制 Pod 间通信
3. **配置 RBAC**: 限制服务账号权限
4. **使用 Secret**: 存储敏感配置
5. **启用 Pod Security Policy/Standards**: 强制安全上下文
6. **定期更新镜像**: 修复安全漏洞

## 📝 注意事项

1. **Ingress Controller**: 确保集群已安装 Ingress Controller（如 nginx-ingress）
2. **cert-manager**: 如需自动 TLS 证书，需安装 cert-manager
3. **Metrics Server**: HPA 需要 Metrics Server 支持
4. **持久化**: 本应用为纯静态站点，无需持久化存储
5. **域名解析**: 确保域名正确解析到集群 Ingress

## 🆘 故障排查

### Pod 无法启动
```bash
kubectl describe pod <pod-name> -n latency-monitor
kubectl logs <pod-name> -n latency-monitor
```

### Ingress 无法访问
```bash
kubectl describe ingress latency-monitor -n latency-monitor
kubectl get endpoints latency-monitor -n latency-monitor
```

### HPA 不工作
```bash
kubectl get hpa -n latency-monitor
kubectl describe hpa latency-monitor -n latency-monitor
kubectl top pods -n latency-monitor
```

### ArgoCD 同步失败
```bash
argocd app get latency-monitor-prod
argocd app logs latency-monitor-prod
```

## 📚 参考文档

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Kustomize 文档](https://kustomize.io/)
- [ArgoCD 文档](https://argo-cd.readthedocs.io/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager](https://cert-manager.io/)
