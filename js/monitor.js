// 域名延迟监控工具
class LatencyMonitor {
    constructor() {
        // DOM 元素
        this.domainInput = document.getElementById('domainInput');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.intervalSelect = document.getElementById('intervalSelect');

        // 统计元素
        this.currentLatencyEl = document.getElementById('currentLatency');
        this.avgLatencyEl = document.getElementById('avgLatency');
        this.minMaxLatencyEl = document.getElementById('minMaxLatency');
        this.requestCountEl = document.getElementById('requestCount');

        // 历史记录元素
        this.historyList = document.getElementById('historyList');
        this.historyCount = document.getElementById('historyCount');

        // 图表元素
        this.canvas = document.getElementById('latencyChart');
        this.ctx = this.canvas.getContext('2d');

        // 状态变量
        this.isRunning = false;
        this.intervalId = null;
        this.latencies = [];
        this.maxDataPoints = 50;

        // 初始化
        this.init();
    }

    init() {
        // 设置 canvas 尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 绑定事件
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.clearBtn.addEventListener('click', () => this.clearData());

        // 绘制空图表
        this.drawChart();

        // 监听回车键
        this.domainInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isRunning) {
                this.toggle();
            }
        });
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.drawChart();
    }

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        const domain = this.domainInput.value.trim();
        if (!domain) {
            alert('请输入域名！');
            return;
        }

        this.isRunning = true;
        this.updateButtonState();
        this.domainInput.disabled = true;
        this.intervalSelect.disabled = true;

        const interval = parseInt(this.intervalSelect.value);

        // 立即执行一次
        this.checkLatency(domain);

        // 定时检测
        this.intervalId = setInterval(() => {
            this.checkLatency(domain);
        }, interval);
    }

    stop() {
        this.isRunning = false;
        this.updateButtonState();
        this.domainInput.disabled = false;
        this.intervalSelect.disabled = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateButtonState() {
        const btnIcon = this.toggleBtn.querySelector('.btn-icon');
        const btnText = this.toggleBtn.querySelector('.btn-text');

        if (this.isRunning) {
            this.toggleBtn.classList.remove('btn-start');
            this.toggleBtn.classList.add('btn-stop');
            btnText.textContent = '停止检测';
            btnIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
        } else {
            this.toggleBtn.classList.remove('btn-stop');
            this.toggleBtn.classList.add('btn-start');
            btnText.textContent = '开始检测';
            btnIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
    }

    async checkLatency(domain) {
        const startTime = performance.now();
        let latency = null;
        let success = false;

        try {
            // 使用 fetch 检测延迟
            // 由于浏览器的 CORS 限制，这里使用一个技巧：尝试加载 favicon 或使用 img 标签
            const url = `https://${domain}/favicon.ico?_=${Date.now()}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            latency = Math.round(performance.now() - startTime);
            success = true;
        } catch (error) {
            // 如果 fetch 失败，尝试使用 Image 对象
            try {
                latency = await this.checkLatencyWithImage(domain);
                success = true;
            } catch (imgError) {
                latency = null;
                success = false;
            }
        }

        // 添加数据
        this.addLatencyData(latency, success);
    }

    checkLatencyWithImage(domain) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const img = new Image();
            const timeout = setTimeout(() => {
                img.src = '';
                reject(new Error('Timeout'));
            }, 10000);

            img.onload = img.onerror = () => {
                clearTimeout(timeout);
                const latency = Math.round(performance.now() - startTime);
                resolve(latency);
            };

            img.src = `https://${domain}/favicon.ico?_=${Date.now()}`;
        });
    }

    addLatencyData(latency, success) {
        const timestamp = new Date();
        const data = {
            time: timestamp,
            latency: latency,
            success: success
        };

        this.latencies.push(data);

        // 限制数据点数量
        if (this.latencies.length > this.maxDataPoints) {
            this.latencies.shift();
        }

        // 更新显示
        this.updateStats();
        this.updateHistory(data);
        this.drawChart();
    }

    updateStats() {
        const successLatencies = this.latencies
            .filter(d => d.success && d.latency !== null)
            .map(d => d.latency);

        if (successLatencies.length === 0) {
            this.currentLatencyEl.textContent = '-- ms';
            this.avgLatencyEl.textContent = '-- ms';
            this.minMaxLatencyEl.textContent = '-- / --';
            this.requestCountEl.textContent = this.latencies.length;
            return;
        }

        // 当前延迟
        const current = this.latencies[this.latencies.length - 1];
        if (current.success && current.latency !== null) {
            this.currentLatencyEl.textContent = `${current.latency} ms`;
        } else {
            this.currentLatencyEl.textContent = '失败';
        }

        // 平均延迟
        const avg = Math.round(
            successLatencies.reduce((a, b) => a + b, 0) / successLatencies.length
        );
        this.avgLatencyEl.textContent = `${avg} ms`;

        // 最小/最大延迟
        const min = Math.min(...successLatencies);
        const max = Math.max(...successLatencies);
        this.minMaxLatencyEl.textContent = `${min} / ${max} ms`;

        // 请求次数
        this.requestCountEl.textContent = this.latencies.length;
    }

    updateHistory(data) {
        // 移除空状态
        const emptyState = this.historyList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // 创建历史记录项
        const item = document.createElement('div');
        item.className = 'history-item';

        const timeStr = this.formatTime(data.time);
        const latencyClass = this.getLatencyClass(data.latency);
        const latencyText = data.success && data.latency !== null
            ? `${data.latency} ms`
            : '失败';

        item.innerHTML = `
            <span class="history-time">${timeStr}</span>
            <span class="history-latency ${latencyClass}">${latencyText}</span>
        `;

        // 添加到列表顶部
        this.historyList.insertBefore(item, this.historyList.firstChild);

        // 更新计数
        this.historyCount.textContent = `共 ${this.latencies.length} 条记录`;

        // 限制显示的历史记录数量
        const items = this.historyList.querySelectorAll('.history-item');
        if (items.length > 100) {
            items[items.length - 1].remove();
        }
    }

    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${ms}`;
    }

    getLatencyClass(latency) {
        if (latency === null) return 'latency-error';
        if (latency < 50) return 'latency-excellent';
        if (latency < 150) return 'latency-good';
        if (latency < 300) return 'latency-fair';
        return 'latency-poor';
    }

    clearData() {
        if (this.latencies.length === 0) return;

        if (confirm('确定要清空所有数据吗？')) {
            this.latencies = [];
            this.updateStats();
            this.drawChart();

            // 清空历史记录
            this.historyList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>暂无检测数据</p>
                    <p class="empty-hint">点击"开始检测"按钮开始监控</p>
                </div>
            `;

            this.historyCount.textContent = '共 0 条记录';
        }
    }

    drawChart() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // 清空画布
        this.ctx.clearRect(0, 0, width, height);

        if (this.latencies.length === 0) {
            this.drawEmptyChart(width, height);
            return;
        }

        // 绘制图表
        const padding = { top: 20, right: 20, bottom: 30, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // 获取有效数据
        const validData = this.latencies.filter(d => d.success && d.latency !== null);

        if (validData.length === 0) {
            this.drawEmptyChart(width, height);
            return;
        }

        const maxLatency = Math.max(...validData.map(d => d.latency));
        const minLatency = Math.min(...validData.map(d => d.latency));
        const latencyRange = maxLatency - minLatency || 1;

        // 绘制网格线
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, y);
            this.ctx.lineTo(width - padding.right, y);
            this.ctx.stroke();

            // Y轴标签
            const value = Math.round(maxLatency - (latencyRange / 5) * i);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '11px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(value + 'ms', padding.left - 5, y + 4);
        }

        // 绘制延迟曲线
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        validData.forEach((data, index) => {
            const x = padding.left + (chartWidth / (validData.length - 1 || 1)) * index;
            const y = padding.top + chartHeight -
                     ((data.latency - minLatency) / latencyRange) * chartHeight;

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        // 绘制填充渐变
        this.ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        this.ctx.lineTo(padding.left, padding.top + chartHeight);
        this.ctx.closePath();

        const gradient = this.ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 绘制数据点
        validData.forEach((data, index) => {
            const x = padding.left + (chartWidth / (validData.length - 1 || 1)) * index;
            const y = padding.top + chartHeight -
                     ((data.latency - minLatency) / latencyRange) * chartHeight;

            this.ctx.fillStyle = '#10b981';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // 外圈
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // 绘制平均线
        const avgLatency = validData.reduce((sum, d) => sum + d.latency, 0) / validData.length;
        const avgY = padding.top + chartHeight -
                    ((avgLatency - minLatency) / latencyRange) * chartHeight;

        this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, avgY);
        this.ctx.lineTo(width - padding.right, avgY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 平均线标签
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`平均: ${Math.round(avgLatency)}ms`, padding.left + 5, avgY - 5);
    }

    drawEmptyChart(width, height) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('暂无数据', width / 2, height / 2);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new LatencyMonitor();
});
