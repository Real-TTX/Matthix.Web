(() => {
    const canvas = document.getElementById("life-canvas");
    if (!canvas) {
        return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
        return;
    }

    const body = document.body;
    const gameToggle = document.getElementById("game-toggle");
    const gamePanel = document.getElementById("game-panel");
    const settingsToggle = document.getElementById("settings-toggle");
    const randomSeedButton = document.getElementById("random-seed");
    const seedThresholdInput = document.getElementById("seed-threshold");
    const seedThresholdValue = document.getElementById("seed-threshold-value");
    const autoResetGenerationInput = document.getElementById("auto-reset-generation");
    const autoResetGenerationValue = document.getElementById("auto-reset-generation-value");
    const themeSelect = document.getElementById("theme-select");
    const statLiving = document.getElementById("stat-living");
    const statDying = document.getElementById("stat-dying");
    const statGeneration = document.getElementById("stat-generation");
    const livingGraph = document.getElementById("living-graph");
    const graphLabel = document.getElementById("graph-label");
    const sectionLinks = Array.from(document.querySelectorAll("[data-section-link]"));
    const sections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const storageKey = "matthix-game-settings";
    const generationHistory = [];
    const maxHistory = 4;
    const stepFrames = prefersReducedMotion ? 999999 : 12;
    const themes = {
        normal: {
            backgroundTop: "#f3f8f7",
            backgroundMid: "#e6efee",
            backgroundBottom: "#d4e0de",
            guide: "rgba(15, 169, 181, 0.08)",
            grid: "rgba(34, 48, 61, 0.035)",
            currentFill: "15, 169, 181",
            currentStroke: "34, 48, 61",
            historyFill: "61, 69, 83",
            historyStroke: "61, 69, 83",
            shape: "square"
        },
        tron: {
            backgroundTop: "#02060b",
            backgroundMid: "#07111a",
            backgroundBottom: "#0c1822",
            guide: "rgba(0, 255, 255, 0.08)",
            grid: "rgba(0, 225, 255, 0.08)",
            currentFill: "0, 240, 255",
            currentStroke: "220, 255, 255",
            historyFill: "0, 115, 145",
            historyStroke: "0, 195, 220",
            shape: "tron"
        },
        simpsons: {
            backgroundTop: "#7dd1ff",
            backgroundMid: "#b6e4ff",
            backgroundBottom: "#9bd05b",
            guide: "rgba(255, 255, 255, 0.16)",
            grid: "rgba(255, 187, 35, 0.06)",
            currentFill: "255, 226, 72",
            currentStroke: "71, 112, 179",
            historyFill: "255, 153, 102",
            historyStroke: "182, 85, 40",
            shape: "simpsons"
        },
        orbs: {
            backgroundTop: "#f5fbfb",
            backgroundMid: "#e2f0ef",
            backgroundBottom: "#d2e3e2",
            guide: "rgba(15, 169, 181, 0.04)",
            grid: "rgba(34, 48, 61, 0.025)",
            currentFill: "15, 169, 181",
            currentStroke: "34, 48, 61",
            historyFill: "116, 130, 138",
            historyStroke: "116, 130, 138",
            shape: "orb"
        },
        city: {
            backgroundTop: "#b8d38b",
            backgroundMid: "#a9c779",
            backgroundBottom: "#9cbb6e",
            guide: "rgba(255, 255, 255, 0)",
            grid: "rgba(72, 72, 72, 0.16)",
            currentFill: "216, 92, 49",
            currentStroke: "63, 63, 63",
            historyFill: "126, 148, 96",
            historyStroke: "96, 118, 74",
            shape: "city"
        },
        trees: {
            backgroundTop: "#eaf5ea",
            backgroundMid: "#dbeedb",
            backgroundBottom: "#cadfc5",
            guide: "rgba(92, 129, 82, 0.05)",
            grid: "rgba(92, 129, 82, 0.035)",
            currentFill: "79, 126, 69",
            currentStroke: "66, 84, 54",
            historyFill: "112, 124, 95",
            historyStroke: "94, 104, 82",
            shape: "trees"
        },
        "rainbow-road": {
            backgroundTop: "#090313",
            backgroundMid: "#120722",
            backgroundBottom: "#1b0c2f",
            guide: "rgba(255, 255, 255, 0)",
            grid: "rgba(91, 54, 165, 0.16)",
            currentFill: "255, 255, 255",
            currentStroke: "255, 255, 255",
            historyFill: "126, 92, 205",
            historyStroke: "186, 155, 255",
            shape: "rainbow-road"
        }
    };
    const world = {
        cellSize: 24,
        cols: 0,
        rows: 0,
        current: [],
        next: []
    };

    let frame = 0;
    let generationCount = 0;
    let lastDyingCount = 0;
    let activeTheme = "normal";
    let frameWithinStep = 0;
    let livingHistory = [];
    let dyingHistory = [];
    let seedThreshold = Number(seedThresholdInput?.value ?? 0.76);
    let autoResetGeneration = Number(autoResetGenerationInput?.value ?? 120);
    const graphHistoryLength = 48;
    let settingsCollapsed = false;

    const loadSettings = () => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw);
            if (typeof parsed.seedThreshold === "number") {
                seedThreshold = parsed.seedThreshold;
            }
            if (typeof parsed.autoResetGeneration === "number") {
                autoResetGeneration = parsed.autoResetGeneration;
            }
            if (typeof parsed.theme === "string" && themes[parsed.theme]) {
                activeTheme = parsed.theme;
            }
            if (typeof parsed.settingsCollapsed === "boolean") {
                settingsCollapsed = parsed.settingsCollapsed;
            }
        } catch {
            // Ignore malformed local storage content and keep defaults.
        }
    };

    const saveSettings = () => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify({
                seedThreshold,
                autoResetGeneration,
                theme: activeTheme,
                settingsCollapsed
            }));
        } catch {
            // Ignore local storage write failures.
        }
    };

    const createGrid = (cols, rows) =>
        Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() > seedThreshold ? 1 : 0)));

    const cloneGrid = (grid) => grid.map((row) => row.slice());
    const countLivingCells = (grid) => grid.reduce((total, row) => total + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
    const seededValue = (x, y, salt = 0) => {
        const raw = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + salt * 37.719) * 43758.5453;
        return raw - Math.floor(raw);
    };
    const isAlive = (grid, x, y) => Boolean(grid?.[y]?.[x]);

    const updateStats = () => {
        const livingCount = countLivingCells(world.current);
        statLiving.textContent = String(livingCount);
        statDying.textContent = String(lastDyingCount);
        statGeneration.textContent = String(generationCount);
        livingHistory.push(livingCount);
        dyingHistory.push(lastDyingCount);

        if (livingHistory.length > graphHistoryLength) {
            livingHistory = livingHistory.slice(-graphHistoryLength);
        }

        if (dyingHistory.length > graphHistoryLength) {
            dyingHistory = dyingHistory.slice(-graphHistoryLength);
        }

        drawLivingGraph();
    };

    const updateSeedThresholdLabel = () => {
        if (seedThresholdValue) {
            const density = 1 - seedThreshold;
            const percentage = Math.round(density * 100);
            let label = "Sehr locker";

            if (density > 0.32) {
                label = "Sehr dicht";
            } else if (density > 0.24) {
                label = "Dicht";
            } else if (density > 0.17) {
                label = "Mittel";
            } else if (density > 0.1) {
                label = "Locker";
            }

            seedThresholdValue.textContent = `${label} (${percentage} % aktiv)`;
        }
    };

    const updateAutoResetLabel = () => {
        if (autoResetGenerationValue) {
            autoResetGenerationValue.textContent = `${autoResetGeneration} Generationen`;
        }
    };

    const drawLivingGraph = () => {
        if (!livingGraph) {
            return;
        }

        const graphContext = livingGraph.getContext("2d");
        if (!graphContext) {
            return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssWidth = livingGraph.clientWidth || 260;
        const cssHeight = livingGraph.clientHeight || 82;
        const width = Math.floor(cssWidth * dpr);
        const height = Math.floor(cssHeight * dpr);

        if (livingGraph.width !== width || livingGraph.height !== height) {
            livingGraph.width = width;
            livingGraph.height = height;
        }

        graphContext.setTransform(dpr, 0, 0, dpr, 0, 0);

        const drawWidth = cssWidth;
        const drawHeight = cssHeight;
        const theme = themes[activeTheme] ?? themes.normal;
        const livingValues = livingHistory.length > 1 ? livingHistory : [0, 0];
        const dyingValues = dyingHistory.length > 1 ? dyingHistory : [0, 0];
        const values = [...livingValues, ...dyingValues];
        const maxValue = Math.max(...values, 1);
        const minValue = Math.min(...values, 0);
        const range = Math.max(maxValue - minValue, 1);

        graphContext.clearRect(0, 0, drawWidth, drawHeight);

        graphContext.fillStyle = "rgba(255,255,255,0.12)";
        graphContext.fillRect(0, 0, drawWidth, drawHeight);

        graphContext.strokeStyle = "rgba(34, 48, 61, 0.08)";
        graphContext.lineWidth = 1;

        for (let y = 12; y < drawHeight; y += 20) {
            graphContext.beginPath();
            graphContext.moveTo(0, y);
            graphContext.lineTo(drawWidth, y);
            graphContext.stroke();
        }

        const accent = `rgba(${theme.currentFill}, 0.72)`;
        const accentSoft = `rgba(${theme.currentFill}, 0.12)`;
        const dyingAccent = "rgba(216, 92, 49, 0.62)";
        const dyingAccentSoft = "rgba(216, 92, 49, 0.1)";
        graphContext.lineJoin = "round";
        graphContext.lineCap = "round";

        graphContext.beginPath();
        livingValues.forEach((value, index) => {
            const x = (index / (livingValues.length - 1)) * (drawWidth - 8) + 4;
            const normalized = (value - minValue) / range;
            const y = drawHeight - 8 - normalized * (drawHeight - 20);

            if (index === 0) {
                graphContext.moveTo(x, y);
            } else {
                graphContext.lineTo(x, y);
            }
        });

        graphContext.lineTo(drawWidth - 4, drawHeight - 4);
        graphContext.lineTo(4, drawHeight - 4);
        graphContext.closePath();
        graphContext.fillStyle = accentSoft;
        graphContext.fill();

        graphContext.beginPath();
        livingValues.forEach((value, index) => {
            const x = (index / (livingValues.length - 1)) * (drawWidth - 8) + 4;
            const normalized = (value - minValue) / range;
            const y = drawHeight - 8 - normalized * (drawHeight - 20);

            if (index === 0) {
                graphContext.moveTo(x, y);
            } else {
                graphContext.lineTo(x, y);
            }
        });

        graphContext.strokeStyle = accent;
        graphContext.lineWidth = 2;
        graphContext.stroke();

        graphContext.beginPath();
        dyingValues.forEach((value, index) => {
            const x = (index / (dyingValues.length - 1)) * (drawWidth - 8) + 4;
            const normalized = (value - minValue) / range;
            const y = drawHeight - 8 - normalized * (drawHeight - 20);

            if (index === 0) {
                graphContext.moveTo(x, y);
            } else {
                graphContext.lineTo(x, y);
            }
        });

        graphContext.lineTo(drawWidth - 4, drawHeight - 4);
        graphContext.lineTo(4, drawHeight - 4);
        graphContext.closePath();
        graphContext.fillStyle = dyingAccentSoft;
        graphContext.fill();

        graphContext.beginPath();
        dyingValues.forEach((value, index) => {
            const x = (index / (dyingValues.length - 1)) * (drawWidth - 8) + 4;
            const normalized = (value - minValue) / range;
            const y = drawHeight - 8 - normalized * (drawHeight - 20);

            if (index === 0) {
                graphContext.moveTo(x, y);
            } else {
                graphContext.lineTo(x, y);
            }
        });

        graphContext.strokeStyle = dyingAccent;
        graphContext.lineWidth = 1.6;
        graphContext.stroke();
    };

    const seedWorld = () => {
        world.current = createGrid(world.cols, world.rows);
        world.next = createGrid(world.cols, world.rows);
        generationHistory.length = 0;
        generationHistory.push(cloneGrid(world.current));
        generationCount = 0;
        lastDyingCount = 0;
        frameWithinStep = 0;
        updateStats();
    };

    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        world.cols = Math.ceil(width / world.cellSize) + maxHistory;
        world.rows = Math.ceil(height / world.cellSize) + maxHistory;
        seedWorld();
    };

    const countNeighbors = (x, y) => {
        let neighbors = 0;

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                if (offsetX === 0 && offsetY === 0) {
                    continue;
                }

                const wrappedX = (x + offsetX + world.cols) % world.cols;
                const wrappedY = (y + offsetY + world.rows) % world.rows;
                neighbors += world.current[wrappedY][wrappedX];
            }
        }

        return neighbors;
    };

    const stepLife = () => {
        let dyingCount = 0;

        for (let y = 0; y < world.rows; y += 1) {
            for (let x = 0; x < world.cols; x += 1) {
                const alive = world.current[y][x] === 1;
                const neighbors = countNeighbors(x, y);
                let nextValue = 0;

                if (alive && (neighbors === 2 || neighbors === 3)) {
                    nextValue = 1;
                } else if (!alive && neighbors === 3) {
                    nextValue = 1;
                }

                if (alive && nextValue === 0) {
                    dyingCount += 1;
                }

                world.next[y][x] = nextValue;
            }
        }

        [world.current, world.next] = [world.next, world.current];
        generationHistory.unshift(cloneGrid(world.current));
        generationCount += 1;
        lastDyingCount = dyingCount;

        if (generationHistory.length > maxHistory) {
            generationHistory.length = maxHistory;
        }

        updateStats();

        if (generationCount >= autoResetGeneration) {
            seedWorld();
        }
    };

    const drawBackground = (width, height) => {
        const theme = themes[activeTheme];
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, theme.backgroundTop);
        gradient.addColorStop(0.58, theme.backgroundMid);
        gradient.addColorStop(1, theme.backgroundBottom);
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        if (theme.shape === "city") {
            return;
        }

        if (theme.shape === "tron") {
            context.strokeStyle = "rgba(0, 240, 255, 0.08)";
            context.lineWidth = 1;

            for (let y = height * 0.52; y < height; y += 18) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(width, y);
                context.stroke();
            }

            for (let x = 0; x < width; x += 36) {
                context.beginPath();
                context.moveTo(x, height * 0.52);
                context.lineTo(x, height);
                context.stroke();
            }

            context.strokeStyle = "rgba(255, 128, 32, 0.18)";
            context.beginPath();
            context.moveTo(0, height * 0.52);
            context.lineTo(width, height * 0.52);
            context.stroke();
            return;
        }

        if (theme.shape === "simpsons") {
            context.fillStyle = "#91d8ff";
            context.fillRect(0, 0, width, height * 0.68);
            context.fillStyle = "#88c858";
            context.fillRect(0, height * 0.68, width, height * 0.32);

            context.fillStyle = "rgba(255,255,255,0.92)";
            for (let i = 0; i < 5; i += 1) {
                const cloudX = seededValue(i, generationCount, 12) * width;
                const cloudY = 34 + seededValue(i, generationCount, 19) * height * 0.24;
                context.beginPath();
                context.arc(cloudX, cloudY, 18, 0, Math.PI * 2);
                context.arc(cloudX + 18, cloudY - 8, 22, 0, Math.PI * 2);
                context.arc(cloudX + 38, cloudY, 17, 0, Math.PI * 2);
                context.fill();
            }
            return;
        }

        if (theme.shape === "rainbow-road") {
            context.fillStyle = "rgba(255, 255, 255, 0.9)";
            for (let index = 0; index < 72; index += 1) {
                const x = (seededValue(index, generationCount, 2) * width);
                const y = (seededValue(index, generationCount, 4) * height);
                const radius = 0.7 + seededValue(index, generationCount, 9) * 1.8;
                context.beginPath();
                context.arc(x, y, radius, 0, Math.PI * 2);
                context.fill();
            }
            return;
        }

        context.strokeStyle = theme.guide;
        context.lineWidth = 1;

        for (let x = -120; x < width + 220; x += 52) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x - 160, height);
            context.stroke();
        }
    };

    const projectCell = (gridX, gridY, layer) => {
        const offsetX = 0;
        const offsetY = 0;

        return {
            x: offsetX + gridX * world.cellSize,
            y: offsetY + gridY * world.cellSize
        };
    };

    const drawCityLake = (x, y, width, height) => {
        context.fillStyle = "#63b8e6";
        context.beginPath();
        context.moveTo(x + width * 0.14, y + height * 0.2);
        context.bezierCurveTo(x - width * 0.04, y + height * 0.34, x + width * 0.03, y + height * 0.82, x + width * 0.32, y + height * 0.9);
        context.bezierCurveTo(x + width * 0.54, y + height, x + width * 0.92, y + height * 0.84, x + width * 0.96, y + height * 0.56);
        context.bezierCurveTo(x + width, y + height * 0.2, x + width * 0.76, y + height * 0.02, x + width * 0.46, y + height * 0.06);
        context.bezierCurveTo(x + width * 0.3, y + height * 0.04, x + width * 0.2, y + height * 0.09, x + width * 0.14, y + height * 0.2);
        context.fill();
    };

    const drawCityTrees = (x, y, count, spacing) => {
        for (let index = 0; index < count; index += 1) {
            const baseX = x + index * spacing;
            context.fillStyle = "#855c34";
            context.fillRect(baseX + 4, y + 18, 4, 12);
            context.fillStyle = index % 2 === 0 ? "#2f6b2d" : "#417d32";
            context.beginPath();
            context.moveTo(baseX, y + 22);
            context.lineTo(baseX + 6, y);
            context.lineTo(baseX + 12, y + 22);
            context.closePath();
            context.fill();
        }
    };

    const drawCityHouse = (x, y, width, height, bodyColor, roofColor) => {
        context.fillStyle = bodyColor;
        context.fillRect(x, y + height * 0.28, width, height * 0.72);
        context.fillStyle = roofColor;
        context.beginPath();
        context.moveTo(x - 2, y + height * 0.3);
        context.lineTo(x + width / 2, y);
        context.lineTo(x + width + 2, y + height * 0.3);
        context.closePath();
        context.fill();
        context.fillStyle = "rgba(255,255,255,0.7)";
        context.fillRect(x + width * 0.18, y + height * 0.45, width * 0.18, height * 0.16);
        context.fillRect(x + width * 0.62, y + height * 0.45, width * 0.18, height * 0.16);
    };

    const drawCityRoads = (width, height) => {
        const roadsX = [44, width * 0.48, width * 0.83];
        const roadsY = [height * 0.26, height * 0.58, height * 0.87];
        const roadWidth = 34;

        context.fillStyle = "#8f9088";

        for (const x of roadsX) {
            context.fillRect(x - roadWidth / 2, 0, roadWidth, height);
        }

        for (const y of roadsY) {
            context.fillRect(0, y - roadWidth / 2, width, roadWidth);
        }

        context.strokeStyle = "rgba(255,255,255,0.85)";
        context.lineWidth = 2;
        context.setLineDash([7, 7]);

        for (const x of roadsX) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }

        for (const y of roadsY) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        context.setLineDash([]);
    };

    const drawCityBackdrop = (width, height) => {
        context.fillStyle = "#7aa35a";
        context.fillRect(0, 0, width, height);
    };

    const drawTreesBackdrop = (width, height) => {
        context.fillStyle = "#eef7ea";
        context.fillRect(0, 0, width, height);
    };

    const drawRainbowRoadBackdrop = (width, height) => {
        const stripeHeight = Math.max(22, world.cellSize * 0.9);
        const colors = ["#ff4d6d", "#ff9f1c", "#ffe14d", "#4cd964", "#4dc3ff", "#7d5cff"];

        context.fillStyle = "#0b0417";
        context.fillRect(0, 0, width, height);

        for (let y = 0; y < height + stripeHeight; y += stripeHeight) {
            for (let index = 0; index < colors.length; index += 1) {
                context.fillStyle = colors[index];
                context.fillRect(index * (width / colors.length), y, width / colors.length + 1, stripeHeight - 2);
            }
        }
    };

    const drawCityObjectTree = (x, y, size, opacity) => {
        context.fillStyle = `rgba(122, 83, 49, ${Math.max(0.2, opacity * 0.7)})`;
        context.fillRect(x + size * 0.44, y + size * 0.58, size * 0.12, size * 0.26);
        context.fillStyle = `rgba(47, 107, 45, ${opacity})`;
        context.beginPath();
        context.moveTo(x + size * 0.18, y + size * 0.62);
        context.lineTo(x + size * 0.5, y + size * 0.12);
        context.lineTo(x + size * 0.82, y + size * 0.62);
        context.closePath();
        context.fill();
    };

    const drawCityObjectHouse = (x, y, size, opacity) => {
        context.fillStyle = `rgba(245, 244, 231, ${opacity})`;
        context.fillRect(x + size * 0.18, y + size * 0.38, size * 0.64, size * 0.42);
        context.fillStyle = `rgba(198, 124, 47, ${opacity})`;
        context.beginPath();
        context.moveTo(x + size * 0.12, y + size * 0.42);
        context.lineTo(x + size * 0.5, y + size * 0.16);
        context.lineTo(x + size * 0.88, y + size * 0.42);
        context.closePath();
        context.fill();
        context.fillStyle = `rgba(112, 167, 206, ${opacity * 0.8})`;
        context.fillRect(x + size * 0.28, y + size * 0.48, size * 0.14, size * 0.12);
        context.fillRect(x + size * 0.58, y + size * 0.48, size * 0.14, size * 0.12);
    };

    const drawCityObjectTower = (x, y, size, opacity) => {
        context.fillStyle = `rgba(223, 181, 55, ${opacity})`;
        context.fillRect(x + size * 0.22, y + size * 0.14, size * 0.56, size * 0.72);
        context.fillStyle = `rgba(255, 244, 174, ${opacity * 0.8})`;
        for (let row = 0; row < 4; row += 1) {
            for (let col = 0; col < 3; col += 1) {
                context.fillRect(x + size * (0.3 + col * 0.14), y + size * (0.24 + row * 0.14), size * 0.06, size * 0.08);
            }
        }
    };

    const drawCityObjectLake = (x, y, size, opacity) => {
        context.fillStyle = `rgba(99, 184, 230, ${opacity})`;
        context.beginPath();
        context.moveTo(x + size * 0.18, y + size * 0.3);
        context.bezierCurveTo(x + size * 0.02, y + size * 0.44, x + size * 0.08, y + size * 0.84, x + size * 0.34, y + size * 0.86);
        context.bezierCurveTo(x + size * 0.6, y + size * 0.92, x + size * 0.88, y + size * 0.76, x + size * 0.84, y + size * 0.44);
        context.bezierCurveTo(x + size * 0.8, y + size * 0.16, x + size * 0.42, y + size * 0.1, x + size * 0.18, y + size * 0.3);
        context.fill();
    };

    const drawCityObjectBlock = (x, y, size, opacity) => {
        context.fillStyle = `rgba(115, 176, 206, ${opacity})`;
        context.fillRect(x + size * 0.22, y + size * 0.14, size * 0.56, size * 0.72);
        context.fillStyle = `rgba(227, 241, 248, ${opacity * 0.75})`;
        for (let row = 0; row < 4; row += 1) {
            context.fillRect(x + size * 0.34, y + size * (0.22 + row * 0.13), size * 0.08, size * 0.08);
            context.fillRect(x + size * 0.56, y + size * (0.22 + row * 0.13), size * 0.08, size * 0.08);
        }
    };

    const drawTreeLeaves = (x, y, size, opacity, progress, dying) => {
        const palette = [
            [78, 135, 74],
            [116, 160, 76],
            [219, 181, 55],
            [197, 92, 58]
        ];
        const leafColor = palette[Math.floor(seededValue(x, y, 5) * palette.length)];
        const crownRadius = size * (0.2 + progress * 0.22);
        const centerX = x + size * 0.5;
        const centerY = y + size * 0.38;

        context.fillStyle = `rgba(${leafColor[0]}, ${leafColor[1]}, ${leafColor[2]}, ${opacity})`;
        context.beginPath();
        context.arc(centerX, centerY, crownRadius, 0, Math.PI * 2);
        context.fill();

        if (dying) {
            for (let index = 0; index < 4; index += 1) {
                const drift = seededValue(x + index, y, 11);
                const leafX = centerX + (drift - 0.5) * size * 0.8;
                const leafY = centerY + size * (0.18 + progress * (0.55 + index * 0.04));
                context.fillStyle = `rgba(${leafColor[0]}, ${leafColor[1]}, ${leafColor[2]}, ${opacity * 0.7})`;
                context.beginPath();
                context.ellipse(leafX, leafY, size * 0.06, size * 0.09, drift * Math.PI, 0, Math.PI * 2);
                context.fill();
            }
        }
    };

    const drawTreeCell = (point, cellSize, opacity, progress, mode) => {
        const trunkHeight = cellSize * (mode === "born" ? 0.22 + progress * 0.28 : 0.5);
        const trunkWidth = cellSize * 0.12;
        const trunkX = point.x + cellSize * 0.44;
        const trunkY = point.y + cellSize * (0.78 - trunkHeight / cellSize);

        context.fillStyle = `rgba(112, 80, 46, ${Math.max(0.22, opacity * 0.8)})`;
        context.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);

        if (mode === "history") {
            drawTreeLeaves(point.x, point.y, cellSize, opacity * 0.55, 0.9, false);
            return;
        }

        if (mode === "dying") {
            drawTreeLeaves(point.x, point.y, cellSize, opacity, progress, true);
            return;
        }

        drawTreeLeaves(point.x, point.y, cellSize, opacity, Math.max(0.18, progress), false);
    };

    const drawRainbowRoadCell = (point, cellSize, opacity, progress, mode, x, y) => {
        const stripeCount = 6;
        const hueOffset = ((x + y + generationCount) % stripeCount);
        const colors = ["#ff4d6d", "#ff9f1c", "#ffe14d", "#4cd964", "#4dc3ff", "#7d5cff"];
        const roadHeight = mode === "born" ? cellSize * Math.max(0.25, progress) : cellSize * 0.82;
        const roadY = point.y + (cellSize - roadHeight) / 2;
        const segmentWidth = cellSize / stripeCount;

        for (let index = 0; index < stripeCount; index += 1) {
            context.fillStyle = colors[(index + hueOffset) % stripeCount];
            context.globalAlpha = opacity * (mode === "history" ? 0.42 : 1);
            context.fillRect(point.x + index * segmentWidth, roadY, segmentWidth + 1, roadHeight);
        }

        context.globalAlpha = 1;
        context.strokeStyle = `rgba(255,255,255,${mode === "history" ? opacity * 0.18 : opacity * 0.55})`;
        context.lineWidth = 1;
        context.strokeRect(point.x, roadY, cellSize, roadHeight);

        if (mode === "dying") {
            context.fillStyle = `rgba(255,255,255,${opacity * 0.3 * (1 - progress)})`;
            context.fillRect(point.x, roadY, cellSize, roadHeight);
        }
    };

    const drawTronCell = (point, cellSize, opacity, progress, mode, x, y) => {
        const size = mode === "born" ? cellSize * (0.3 + progress * 0.7) : cellSize;
        const offset = (cellSize - size) / 2;
        const color = mode === "dying" ? "255, 128, 32" : "0, 240, 255";
        const glow = mode === "history" ? opacity * 0.18 : opacity * 0.42;

        context.fillStyle = `rgba(${color}, ${glow})`;
        context.fillRect(point.x + offset - 1, point.y + offset - 1, size + 2, size + 2);
        context.fillStyle = `rgba(${color}, ${mode === "history" ? opacity * 0.4 : opacity})`;
        context.fillRect(point.x + offset, point.y + offset, size, size);
        context.strokeStyle = `rgba(220,255,255,${mode === "history" ? opacity * 0.18 : opacity * 0.75})`;
        context.lineWidth = 1;
        context.strokeRect(point.x + offset, point.y + offset, size, size);

        if (mode !== "history" && ((x + y + generationCount) % 7 === 0)) {
            context.strokeStyle = `rgba(0,240,255,${opacity * 0.22})`;
            context.beginPath();
            context.moveTo(point.x + size / 2, point.y + size / 2);
            context.lineTo(point.x + size / 2, point.y + size * 1.5);
            context.stroke();
        }
    };

    const drawSimpsonsCell = (point, cellSize, opacity, progress, mode, x, y) => {
        const bodySize = mode === "born" ? cellSize * (0.28 + progress * 0.72) : cellSize * 0.9;
        const offset = (cellSize - bodySize) / 2;
        const drawX = point.x + offset;
        const drawY = point.y + offset;

        if ((x + y) % 5 === 0) {
            context.fillStyle = `rgba(255, 154, 192, ${opacity * 0.85})`;
            context.beginPath();
            context.arc(drawX + bodySize * 0.5, drawY + bodySize * 0.5, bodySize * 0.42, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = `rgba(255, 215, 96, ${opacity})`;
            context.beginPath();
            context.arc(drawX + bodySize * 0.5, drawY + bodySize * 0.5, bodySize * 0.2, 0, Math.PI * 2);
            context.fill();
            return;
        }

        context.fillStyle = mode === "dying"
            ? `rgba(255, 153, 102, ${opacity})`
            : `rgba(255, 226, 72, ${mode === "history" ? opacity * 0.55 : opacity})`;
        context.fillRect(drawX, drawY + bodySize * 0.12, bodySize, bodySize * 0.72);
        context.fillStyle = `rgba(71, 112, 179, ${opacity * 0.85})`;
        context.fillRect(drawX + bodySize * 0.16, drawY + bodySize * 0.48, bodySize * 0.16, bodySize * 0.14);
        context.fillRect(drawX + bodySize * 0.68, drawY + bodySize * 0.48, bodySize * 0.16, bodySize * 0.14);
        context.strokeStyle = `rgba(71, 112, 179, ${mode === "history" ? opacity * 0.25 : opacity * 0.75})`;
        context.strokeRect(drawX, drawY + bodySize * 0.12, bodySize, bodySize * 0.72);
    };

    const drawCurrentThemeCell = (theme, point, cellSize, fillColor, strokeColor, fillOpacity, strokeOpacity, x, y, mode, progress) => {
        if (theme.shape === "tron") {
            drawTronCell(point, cellSize, fillOpacity, progress, mode, x, y);
            return;
        }

        if (theme.shape === "simpsons") {
            drawSimpsonsCell(point, cellSize, fillOpacity, progress, mode, x, y);
            return;
        }

        if (theme.shape === "orb") {
            const radius = cellSize * (mode === "born" ? 0.2 + progress * 0.28 : 0.48);
            const centerX = point.x + cellSize / 2;
            const centerY = point.y + cellSize / 2;
            const gradient = context.createRadialGradient(
                centerX - radius * 0.35,
                centerY - radius * 0.35,
                radius * 0.15,
                centerX,
                centerY,
                radius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${fillOpacity * 0.95})`);
            gradient.addColorStop(0.28, `rgba(${fillColor}, ${fillOpacity})`);
            gradient.addColorStop(1, `rgba(${fillColor}, ${fillOpacity * (mode === "history" ? 0.12 : 0.18)})`);
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, Math.PI * 2);
            context.fillStyle = gradient;
            context.fill();

            if (strokeOpacity > 0 && mode !== "history") {
                context.strokeStyle = `rgba(${strokeColor}, ${strokeOpacity})`;
                context.lineWidth = 1;
                context.stroke();
            }
            return;
        }

        if (theme.shape === "city") {
            drawCityCell(point, cellSize, fillColor, strokeColor, fillOpacity, strokeOpacity, mode !== "history");
            return;
        }

        if (theme.shape === "trees") {
            drawTreeCell(point, cellSize, fillOpacity, progress, mode);
            return;
        }

        if (theme.shape === "rainbow-road") {
            drawRainbowRoadCell(point, cellSize, fillOpacity, progress, mode, x, y);
            return;
        }

        const size = mode === "born" ? cellSize * (0.28 + progress * 0.72) : cellSize;
        const offset = (cellSize - size) / 2;
        context.fillStyle = `rgba(${fillColor}, ${fillOpacity})`;
        context.fillRect(point.x + offset, point.y + offset, size, size);

        if (strokeOpacity > 0 && mode !== "history") {
            context.strokeStyle = `rgba(${strokeColor}, ${strokeOpacity})`;
            context.lineWidth = 1;
            context.strokeRect(point.x + offset, point.y + offset, size, size);
        }
    };

    const drawCityCell = (point, cellSize, fillColor, strokeColor, fillOpacity, strokeOpacity, isCurrent) => {
        const objectSeed = (Math.floor(point.x / world.cellSize) * 17 + Math.floor(point.y / world.cellSize) * 31) % 5;
        const baseOpacity = isCurrent ? Math.max(0.65, fillOpacity) : Math.max(0.14, fillOpacity * 0.95);

        if (objectSeed === 0) {
            drawCityObjectTree(point.x, point.y, cellSize, baseOpacity);
        } else if (objectSeed === 1) {
            drawCityObjectHouse(point.x, point.y, cellSize, baseOpacity);
        } else if (objectSeed === 2) {
            drawCityObjectTower(point.x, point.y, cellSize, baseOpacity);
        } else if (objectSeed === 3) {
            drawCityObjectLake(point.x, point.y, cellSize, Math.max(0.12, baseOpacity * 0.85));
        } else {
            drawCityObjectBlock(point.x, point.y, cellSize, baseOpacity);
        }

        if (isCurrent && strokeOpacity > 0) {
            context.strokeStyle = `rgba(${strokeColor}, ${strokeOpacity})`;
            context.lineWidth = 1;
            context.strokeRect(point.x + 2, point.y + 2, cellSize - 4, cellSize - 4);
        }
    };

    const drawLayer = (grid, layerIndex) => {
        const theme = themes[activeTheme];
        const age = layerIndex / Math.max(maxHistory - 1, 1);
        const transitionProgress = stepFrames > 0 ? frameWithinStep / stepFrames : 1;
        const cellSize = world.cellSize - 4;

        for (let y = 0; y < world.rows; y += 1) {
            for (let x = 0; x < world.cols; x += 1) {
                const point = projectCell(x, y, layerIndex);
                const currentAlive = isAlive(grid, x, y);

                if (layerIndex === 0) {
                    const nextAlive = isAlive(world.next, x, y);
                    const fillColor = theme.currentFill;
                    const strokeColor = theme.currentStroke;

                    if (currentAlive && nextAlive) {
                        drawCurrentThemeCell(theme, point, cellSize, fillColor, strokeColor, 0.62, 0.28, x, y, "current", 1);
                    } else if (currentAlive && !nextAlive) {
                        drawCurrentThemeCell(theme, point, cellSize, fillColor, strokeColor, 0.52, 0.22, x, y, "dying", transitionProgress);
                    } else if (!currentAlive && nextAlive) {
                        drawCurrentThemeCell(theme, point, cellSize, fillColor, strokeColor, 0.44, 0.16, x, y, "born", transitionProgress);
                    }

                    continue;
                }

                if (currentAlive) {
                    drawCurrentThemeCell(
                        theme,
                        point,
                        cellSize,
                        theme.historyFill,
                        theme.historyStroke,
                        Math.max(0.012, 0.14 * Math.pow(1 - age, 2)),
                        0,
                        x,
                        y,
                        "history",
                        1
                    );
                }
            }
        }
    };

    const drawBasePlane = () => {
        const theme = themes[activeTheme];
        const cellStep = world.cellSize * 2;

        if (theme.shape === "city") {
            drawCityBackdrop(window.innerWidth, window.innerHeight);
            return;
        }

        if (theme.shape === "trees") {
            drawTreesBackdrop(window.innerWidth, window.innerHeight);
        }

        if (theme.shape === "rainbow-road") {
            drawRainbowRoadBackdrop(window.innerWidth, window.innerHeight);
            return;
        }

        if (theme.shape === "tron") {
            context.strokeStyle = "rgba(0, 240, 255, 0.12)";
            context.lineWidth = 1;

            for (let x = 0; x < window.innerWidth; x += cellStep) {
                context.beginPath();
                context.moveTo(x, window.innerHeight * 0.52);
                context.lineTo(x, window.innerHeight);
                context.stroke();
            }

            for (let y = window.innerHeight * 0.52; y < window.innerHeight; y += cellStep * 0.6) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(window.innerWidth, y);
                context.stroke();
            }
            return;
        }

        if (theme.shape === "simpsons") {
            context.fillStyle = "rgba(130, 199, 88, 0.32)";
            context.beginPath();
            context.arc(window.innerWidth * 0.18, window.innerHeight * 0.82, 180, Math.PI, 0);
            context.arc(window.innerWidth * 0.52, window.innerHeight * 0.86, 220, Math.PI, 0);
            context.fill();
            return;
        }

        context.strokeStyle = theme.grid;
        context.lineWidth = 1;

        for (let x = 0; x < window.innerWidth; x += cellStep) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, window.innerHeight);
            context.stroke();
        }

        for (let y = 0; y < window.innerHeight; y += cellStep) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(window.innerWidth, y);
            context.stroke();
        }
    };

    const setTheme = (themeName) => {
        activeTheme = themes[themeName] ? themeName : "normal";
        if (themeSelect) {
            themeSelect.value = activeTheme;
        }
        if (graphLabel) {
            graphLabel.textContent = `${themeSelect?.selectedOptions?.[0]?.textContent ?? "Theme"} / Living`;
        }
        saveSettings();
        drawLivingGraph();
        render();
    };

    const openGameMode = () => {
        body.classList.add("game-mode");
        gameToggle?.setAttribute("aria-label", "Zur Website");
    };

    const closeGameMode = () => {
        body.classList.remove("game-mode");
        gameToggle?.setAttribute("aria-label", "Game of Life Modus");
    };

    const applySettingsPanelState = () => {
        if (!gamePanel || !settingsToggle) {
            return;
        }

        gamePanel.classList.toggle("is-collapsed", settingsCollapsed);
        settingsToggle.setAttribute("aria-label", settingsCollapsed ? "Settings ausklappen" : "Settings einklappen");
        saveSettings();
    };

    const updateActiveSection = () => {
        if (body.classList.contains("game-mode")) {
            sectionLinks.forEach((link) => link.classList.remove("is-active"));
            return;
        }

        const triggerY = window.scrollY + 160;
        let activeId = sections[0]?.id ?? "";

        for (const section of sections) {
            if (section.offsetTop <= triggerY) {
                activeId = section.id;
            }
        }

        sectionLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${activeId}`;
            link.classList.toggle("is-active", isActive);
        });
    };

    const render = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        drawBackground(width, height);
        drawBasePlane();

        for (let index = generationHistory.length - 1; index >= 0; index -= 1) {
            drawLayer(generationHistory[index], index);
        }
    };

    const tick = () => {
        frame += 1;
        frameWithinStep += 1;

        if (frame % stepFrames === 0) {
            stepLife();
            frameWithinStep = 0;
        }

        render();
        window.requestAnimationFrame(tick);
    };

    loadSettings();
    if (seedThresholdInput) {
        seedThresholdInput.value = seedThreshold.toFixed(2);
    }
    if (autoResetGenerationInput) {
        autoResetGenerationInput.value = String(autoResetGeneration);
    }
    livingHistory = Array(graphHistoryLength).fill(0);
    dyingHistory = Array(graphHistoryLength).fill(0);
    resize();
    setTheme(activeTheme);
    render();
    updateActiveSection();
    updateSeedThresholdLabel();
    updateAutoResetLabel();
    applySettingsPanelState();

    if (!prefersReducedMotion) {
        window.requestAnimationFrame(tick);
    }

    gameToggle?.addEventListener("click", () => {
        if (body.classList.contains("game-mode")) {
            closeGameMode();
            updateActiveSection();
            return;
        }

        openGameMode();
        updateActiveSection();
    });
    settingsToggle?.addEventListener("click", () => {
        settingsCollapsed = !settingsCollapsed;
        applySettingsPanelState();
    });
    randomSeedButton?.addEventListener("click", () => {
        seedWorld();
        render();
    });
    seedThresholdInput?.addEventListener("input", (event) => {
        seedThreshold = Number(event.target.value);
        updateSeedThresholdLabel();
        saveSettings();
    });
    autoResetGenerationInput?.addEventListener("input", (event) => {
        autoResetGeneration = Number(event.target.value);
        updateAutoResetLabel();
        saveSettings();
    });
    themeSelect?.addEventListener("change", (event) => {
        setTheme(event.target.value);
    });
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateActiveSection, { passive: true });
})();
