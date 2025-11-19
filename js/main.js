  // --- Configuration & State ---
        // Default initial image
        const defaultImage = "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
        
        // Initial Shape (Triangle)
        let points = [
            { x: 50, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 100 }
        ];

        let draggingIndex = -1;
        let activeIndex = -1; 
        
        // Zoom State
        let currentZoom = 1;
        const MIN_ZOOM = 0.2;
        const MAX_ZOOM = 3.0;
        const ZOOM_STEP = 0.1;

        // --- DOM Elements ---
        const workspace = document.getElementById('workspace');
        const zoomContainer = document.getElementById('zoom-container');
        const clippedElement = document.getElementById('clipped-element');
        const handlesLayer = document.getElementById('handles-layer');
        const cssOutput = document.getElementById('css-code');
        const canvasDims = document.getElementById('canvas-dims');
        const zoomLevelLabel = document.getElementById('zoom-level');
        const presetsContainer = document.getElementById('presets-container');
        const customUrlInput = document.getElementById('custom-url-input');

        // --- Presets Data ---
        const presets = [
            { name: "Triangle", points: [{x:50, y:0}, {x:0, y:100}, {x:100, y:100}] },
            { name: "Square", points: [{x:0, y:0}, {x:100, y:0}, {x:100, y:100}, {x:0, y:100}] },
            { name: "Trapezoid", points: [{x:20, y:0}, {x:80, y:0}, {x:100, y:100}, {x:0, y:100}] },
            { name: "Pentagon", points: [{x:50, y:0}, {x:100, y:38}, {x:82, y:100}, {x:18, y:100}, {x:0, y:38}] },
            { name: "Star", points: [{x:50, y:0}, {x:61, y:35}, {x:98, y:35}, {x:68, y:57}, {x:79, y:91}, {x:50, y:70}, {x:21, y:91}, {x:32, y:57}, {x:2, y:35}, {x:39, y:35}] },
            { name: "Arrow", points: [{x:40, y:0}, {x:40, y:20}, {x:100, y:20}, {x:100, y:80}, {x:40, y:80}, {x:40, y:100}, {x:0, y:50}] },
            { name: "Message", points: [{x:0, y:0}, {x:100, y:0}, {x:100, y:75}, {x:75, y:75}, {x:75, y:100}, {x:50, y:75}, {x:0, y:75}] },
            { name: "Cross", points: [{x:20, y:0}, {x:0, y:20}, {x:30, y:50}, {x:0, y:80}, {x:20, y:100}, {x:50, y:70}, {x:80, y:100}, {x:100, y:80}, {x:70, y:50}, {x:100, y:20}, {x:80, y:0}, {x:50, y:30}] },
            { name: "Frame", points: [{x:0, y:0}, {x:0, y:100}, {x:25, y:100}, {x:25, y:25}, {x:75, y:25}, {x:75, y:75}, {x:25, y:75}, {x:14, y:100}, {x:100, y:100}, {x:100, y:0}] },
            { name: "Custom", points: [{x:20, y:20}, {x:80, y:20}, {x:80, y:80}, {x:50, y:95}, {x:20, y:80}] }, 
        ];

        // --- Initialization ---
        function init() {
            renderPresets();
            render();
            updateCanvasDims();
            window.addEventListener('resize', updateCanvasDims);
            
            // Initialize Zoom Listener
            workspace.addEventListener('wheel', handleZoom, { passive: false });
        }

        function updateCanvasDims() {
            const rect = clippedElement.getBoundingClientRect();
            const baseWidth = rect.width / currentZoom;
            const baseHeight = rect.height / currentZoom;
            canvasDims.innerText = `${Math.round(baseWidth)} x ${Math.round(baseHeight)}`;
        }

        // --- Background Logic ---
        function setBgImage(url) {
            clippedElement.style.backgroundImage = `url('${url}')`;
            clippedElement.style.backgroundColor = 'transparent';
            showToast("Background image updated");
        }

        function setBgColor(color) {
            clippedElement.style.backgroundImage = 'none';
            clippedElement.style.backgroundColor = color;
            showToast("Solid color applied");
        }

        function applyCustomUrl() {
            const url = customUrlInput.value.trim();
            if (url) {
                // Basic validation
                const img = new Image();
                img.onload = function() {
                    setBgImage(url);
                }
                img.onerror = function() {
                    showToast("Invalid image URL!", true);
                }
                img.src = url;
            } else {
                showToast("Please enter a URL first", true);
            }
        }

        function scrollToSettings() {
            const settingsPanel = document.getElementById('bg-settings');
            settingsPanel.scrollIntoView({ behavior: 'smooth' });
        }

        // --- Zoom Logic ---
        function handleZoom(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            const newZoom = Math.min(Math.max(currentZoom + delta, MIN_ZOOM), MAX_ZOOM);
            setZoom(newZoom);
        }

        function setZoom(level) {
            currentZoom = level;
            zoomContainer.style.transform = `scale(${currentZoom})`;
            zoomLevelLabel.innerText = `${Math.round(currentZoom * 100)}%`;
        }

        function resetZoom() {
            setZoom(1);
        }

        // --- Core Logic ---

        function updateCSS() {
            const polygonString = points.map(p => `${Math.round(p.x)}% ${Math.round(p.y)}%`).join(', ');
            
            // Update Element
            clippedElement.style.clipPath = `polygon(${polygonString})`;
            
            // Update Code Block
            cssOutput.innerHTML = `<span class="text-rose-400">clip-path</span>: <span class="text-amber-300">polygon</span>(<br>${points.map(p => `  <span class="text-sky-300">${Math.round(p.x)}% ${Math.round(p.y)}%</span>`).join(',<br>')}<br>);`;
        }

        function render() {
            handlesLayer.innerHTML = '';

            points.forEach((p, index) => {
                const handle = document.createElement('div');
                handle.className = `handle ${index === activeIndex ? 'active' : ''}`;
                handle.style.left = `${p.x}%`;
                handle.style.top = `${p.y}%`;
                
                handle.addEventListener('mousedown', (e) => startDrag(e, index));
                handle.addEventListener('dblclick', (e) => removePoint(index));
                handle.addEventListener('touchstart', (e) => startDrag(e, index));

                handlesLayer.appendChild(handle);
            });

            updateCSS();
        }

        function renderPresets() {
            presets.forEach(preset => {
                const btn = document.createElement('button');
                btn.className = "p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-rose-500 rounded-lg flex flex-col items-center gap-2 transition-all group relative overflow-hidden";
                
                if(preset.name === 'Custom') {
                    btn.classList.add('border-indigo-500/50', 'bg-indigo-900/20');
                }

                const pointsStr = preset.points.map(p => `${p.x},${p.y}`).join(' ');
                btn.innerHTML = `
                    <svg viewBox="0 0 100 100" class="w-8 h-8 text-slate-500 group-hover:text-rose-500 fill-current transition-colors pointer-events-none bg-slate-900/50 rounded p-1">
                        <polygon points="${pointsStr}" />
                    </svg>
                    <span class="text-[10px] text-slate-400 group-hover:text-white uppercase font-bold">${preset.name}</span>
                `;
                
                btn.onclick = () => {
                    points = JSON.parse(JSON.stringify(preset.points));
                    activeIndex = -1; 
                    render();
                    showToast(`${preset.name} shape applied`);
                };
                
                presetsContainer.appendChild(btn);
            });
        }

        // --- Point Management ---

        function addPoint() {
            const newPoint = { x: 50, y: 50 };
            if (activeIndex !== -1 && activeIndex < points.length - 1) {
                points.splice(activeIndex + 1, 0, newPoint);
                activeIndex = activeIndex + 1; 
            } else {
                points.push(newPoint);
                activeIndex = points.length - 1; 
            }
            render();
            showToast("New point added");
        }

        function removeActivePoint() {
             if (activeIndex !== -1) {
                removePoint(activeIndex);
            } else {
                if(points.length > 0) removePoint(points.length - 1);
            }
        }

        function removePoint(index) {
            if (points.length <= 3) {
                showToast("Minimum 3 points required!", true);
                return;
            }
            points.splice(index, 1);
            activeIndex = -1; 
            render();
            showToast("Point removed");
        }


        // --- Interaction Logic ---

        function startDrag(e, index) {
            e.preventDefault();
            e.stopPropagation(); 
            draggingIndex = index;
            activeIndex = index; 
            
            document.body.classList.add('is-dragging');
            
            render(); 
        }

        function handleMove(e) {
            if (draggingIndex === -1) return;

            e.preventDefault();

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            const rect = clippedElement.getBoundingClientRect();
            
            let x = ((clientX - rect.left) / rect.width) * 100;
            let y = ((clientY - rect.top) / rect.height) * 100;

            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            points[draggingIndex] = { x, y };
            render();
        }

        function stopDrag() {
            if (draggingIndex !== -1) {
                draggingIndex = -1;
                render(); 
            }
            document.body.classList.remove('is-dragging');
        }

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', stopDrag);


        // --- Utilities ---

        function copyToClipboard() {
            const polygonString = points.map(p => `${Math.round(p.x)}% ${Math.round(p.y)}%`).join(', ');
            const css = `clip-path: polygon(${polygonString});`;
            
            navigator.clipboard.writeText(css).then(() => {
                showToast("CSS copied to clipboard!");
            }).catch(err => {
                showToast("Failed to copy code.", true);
            });
        }

        function showToast(message, isError = false) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast pointer-events-auto px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
                isError ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`;
            
            toast.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${isError 
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' 
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'}
                </svg>
                ${message}
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('hiding');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            }, 3000);
        }

        init();