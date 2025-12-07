# 使用指定版本的 nginx 基础镜像
FROM nginx:1.25-alpine

# 设置维护者信息
LABEL maintainer="zunshen"
LABEL description="Domain Latency Monitor - 域名延迟监控工具"

# 删除默认的 nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 复制项目文件到 nginx 目录
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY image/ /usr/share/nginx/html/image/
COPY favicon.ico /usr/share/nginx/html/

# 复制自定义 nginx 配置（可选）
# COPY nginx.conf /etc/nginx/nginx.conf

# 暴露 80 端口
EXPOSE 80

# 启动 nginx（前台运行）
CMD ["nginx", "-g", "daemon off;"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
