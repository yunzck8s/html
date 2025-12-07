# 域名延迟监控工具 / Domain Latency Monitor

一个现代化的域名访问延迟检测工具，用于实时监控网络质量和访问抖动。

## ✨ 功能特点

- 🎯 **实时监控** - 持续检测域名访问延迟
- 📊 **数据可视化** - 实时延迟趋势图表
- 📈 **统计分析** - 平均延迟、最小/最大值、请求次数
- 🎨 **现代界面** - 渐变背景、毛玻璃效果、流畅动画
- 📱 **响应式设计** - 完美支持手机、平板和桌面设备
- ⚡ **零依赖** - 原生 JavaScript 实现

## 🚀 快速开始

### 本地运行

直接打开 `index.html` 文件即可在浏览器中使用。

### 使用 Docker

```bash
# 构建镜像
docker build -t latency-monitor .

# 运行容器
docker run -d -p 8080:80 latency-monitor

# 访问 http://localhost:8080
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 📖 使用说明

1. **输入域名** - 在输入框中输入要检测的域名（例如：`www.baidu.com`）
2. **选择间隔** - 设置检测间隔（0.5秒、1秒、2秒、5秒）
3. **开始检测** - 点击"开始检测"按钮，按钮会变为"停止检测"
4. **查看数据** - 实时查看延迟统计、趋势图和历史记录
5. **停止检测** - 点击"停止检测"暂停监控
6. **清空数据** - 点击"清空数据"重置所有历史记录

## 🎨 界面预览

### 主要特性

- **统计面板** - 当前延迟、平均延迟、最小/最大延迟、请求次数
- **延迟趋势图** - Canvas 绘制的实时曲线图，带平均线参考
- **历史记录** - 详细的检测记录列表，带时间戳和颜色编码

### 延迟质量分类

- 🟢 **优秀** - < 50ms
- 🔵 **良好** - 50-150ms
- 🟡 **一般** - 150-300ms
- 🔴 **较差** - > 300ms

## 🛠️ 技术栈

- **HTML5** - 语义化标签
- **CSS3** - 渐变、动画、毛玻璃效果
- **JavaScript (ES6+)** - 原生实现，无框架依赖
- **Canvas API** - 图表绘制
- **Fetch API** - 网络请求

## 📦 部署

### GitHub Actions

项目已配置 CI/CD 自动构建和部署：

- 推送到 `main` 分支时自动构建
- 推送 `v*` 标签时自动发布版本
- 自动推送 Docker 镜像到 Docker Hub

### Docker Hub

```bash
docker pull zunshen/latency-monitor:latest
docker run -d -p 80:80 zunshen/latency-monitor:latest
```

## 🔧 配置

### Nginx 配置（可选）

如需自定义 Nginx 配置，取消注释 Dockerfile 中的相关行并创建 `nginx.conf` 文件。

### 环境变量

GitHub Actions 需要配置以下 Secrets：

- `DOCKER_USERNAME` - Docker Hub 用户名
- `DOCKER_PASSWORD` - Docker Hub 密码或访问令牌

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- GitHub: [@zunshen](https://github.com/zunshen)
- Docker Hub: [zunshen/latency-monitor](https://hub.docker.com/r/zunshen/latency-monitor)
