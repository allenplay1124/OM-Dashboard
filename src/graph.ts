import { App, TFile } from 'obsidian';
import { Lang } from './i18n';
import { OMDashboardSettings } from './settings';

export interface GraphNode {
	id: string;
	name: string;
	file: TFile;
	degree: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface GraphLink {
	a: number;
	b: number;
}

export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
}

export function collectGraph(app: App, settings: OMDashboardSettings, limit = 120): GraphData {
	const root = settings.notesRoot.trim().replace(/^\/+|\/+$/g, '');
	const prefix = root ? `${root}/` : '';

	const selected = app.vault.getMarkdownFiles().filter((file) => {
		const fm = app.metadataCache.getFileCache(file)?.frontmatter;
		if (fm?.['pm-project'] === true || fm?.['pm-task'] === true) return false;
		if (prefix && !file.path.startsWith(prefix)) return false;
		return true;
	});

	const index = new Map(selected.map((f, i) => [f.path, i]));
	const degree = new Array(selected.length).fill(0);
	const rawLinks: Array<[number, number]> = [];

	for (const file of selected) {
		const out = app.metadataCache.resolvedLinks[file.path] ?? {};
		for (const target of Object.keys(out)) {
			const j = index.get(target);
			if (j === undefined) continue;
			const i = index.get(file.path)!;
			if (i === j) continue;
			rawLinks.push([i, j]);
			degree[i]++;
			degree[j]++;
		}
	}

	// Dedupe undirected links
	const seen = new Set<string>();
	const unique: Array<[number, number]> = [];
	for (const [a, b] of rawLinks) {
		const key = a < b ? `${a}-${b}` : `${b}-${a}`;
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push([a, b]);
	}

	// Rank nodes by degree, keep top `limit`
	const order = selected
		.map((_, i) => i)
		.sort((a, b) => degree[b] - degree[a])
		.slice(0, limit);
	const keep = new Set(order);
	const remap = new Map<number, number>();
	order.forEach((old, ni) => remap.set(old, ni));

	const nodes: GraphNode[] = order
		.map((old) => ({ old, file: selected[old] }))
		.filter((entry): entry is { old: number; file: TFile } => entry.file instanceof TFile)
		.map(({ old, file }) => ({
			id: file.path,
			name: file.basename,
			file,
			degree: Number(degree[old] ?? 0),
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
		}));

	const links: GraphLink[] = [];
	for (const [a, b] of unique) {
		if (!keep.has(a) || !keep.has(b)) continue;
		links.push({ a: remap.get(a)!, b: remap.get(b)! });
	}

	// Initial positions on a circle
	const n = nodes.length;
	nodes.forEach((nd, i) => {
		const ang = (i / Math.max(n, 1)) * Math.PI * 2;
		nd.x = Math.cos(ang) * 100;
		nd.y = Math.sin(ang) * 100;
	});

	return { nodes, links };
}

export function mountGraph(
	container: HTMLElement,
	data: GraphData,
	app: App,
	lang: Lang,
	t: (lang: Lang, key: string) => string,
): () => void {
	container.empty();
	container.createDiv({ cls: 'om-card-title', text: t(lang, 'graph') });

	if (data.nodes.length === 0) {
		container.createDiv({ cls: 'om-graph-empty', text: t(lang, 'graphEmpty') });
		return () => {};
	}

	const wrap = container.createDiv({ cls: 'om-graph-wrap' });
	const canvas = wrap.createEl('canvas');
	const tooltip = wrap.createDiv({ cls: 'om-graph-tooltip' });
	tooltip.setCssProps({ display: 'none' });

	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};

	const dpr = window.devicePixelRatio || 1;
	let width = 0;
	let height = 0;
	const resize = (): void => {
		const r = wrap.getBoundingClientRect();
		width = Math.max(1, r.width);
		height = Math.max(1, r.height);
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.setCssProps({ width: `${width}px`, height: `${height}px` });
	};
	resize();

	const { nodes, links } = data;

	// View transform
	let scale = 1;
	let tx = 0;
	let ty = 0;

	let tick = 0;
	let rafId = 0;
	let running = true;

	const draw = (): void => {
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);
		const cx = width / 2 + tx;
		const cy = height / 2 + ty;

		// links
		ctx.strokeStyle = 'rgba(120,120,120,0.35)';
		ctx.lineWidth = 1;
		for (const l of links) {
			const a = nodes[l.a]!;
			const b = nodes[l.b]!;
			ctx.beginPath();
			ctx.moveTo(cx + a.x * scale, cy + a.y * scale);
			ctx.lineTo(cx + b.x * scale, cy + b.y * scale);
			ctx.stroke();
		}
		// nodes
		for (const nd of nodes) {
			ctx.beginPath();
			ctx.arc(cx + nd.x * scale, cy + nd.y * scale, 3 + Math.min(nd.degree, 6), 0, Math.PI * 2);
			ctx.fillStyle = '#2f6f6b';
			ctx.fill();
		}
	};

	const step = (): void => {
		if (!running) return;
		// repulsion
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const ni = nodes[i]!;
				const nj = nodes[j]!;
				let dx = ni.x - nj.x;
				let dy = ni.y - nj.y;
				let dist = Math.hypot(dx, dy) || 1;
				const f = 600 / (dist * dist);
				const fx = (dx / dist) * f;
				const fy = (dy / dist) * f;
				ni.vx += fx;
				ni.vy += fy;
				nj.vx -= fx;
				nj.vy -= fy;
			}
		}
		// attraction
		for (const l of links) {
			const a = nodes[l.a]!;
			const b = nodes[l.b]!;
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const dist = Math.hypot(dx, dy) || 1;
			const f = (dist - 50) * 0.015;
			const fx = (dx / dist) * f;
			const fy = (dy / dist) * f;
			a.vx += fx;
			a.vy += fy;
			b.vx -= fx;
			b.vy -= fy;
		}
		// center gravity + integrate
		for (const nd of nodes) {
			nd.vx -= nd.x * 0.002;
			nd.vy -= nd.y * 0.002;
			nd.vx *= 0.86;
			nd.vy *= 0.86;
			nd.x += nd.vx;
			nd.y += nd.vy;
		}
		tick++;
		draw();
		if (tick < 220) rafId = window.requestAnimationFrame(step);
		else running = false;
	};

	// Interaction state
	let dragging = false;
	let dragMoved = false;
	let lastX = 0;
	let lastY = 0;

	const findNodeAt = (sx: number, sy: number): number => {
		let best = -1;
		let bestDist = 14;
		nodes.forEach((nd, i) => {
			const nsx = width / 2 + tx + nd.x * scale;
			const nsy = height / 2 + ty + nd.y * scale;
			const d = Math.hypot(nsx - sx, nsy - sy);
			if (d < bestDist) {
				bestDist = d;
				best = i;
			}
		});
		return best;
	};

	const handleHover = (e: MouseEvent): void => {
		const rect = canvas.getBoundingClientRect();
		const sx = e.clientX - rect.left;
		const sy = e.clientY - rect.top;
		const idx = findNodeAt(sx, sy);
		if (idx >= 0) {
			tooltip.textContent = nodes[idx]!.name;
			tooltip.setCssProps({ display: 'block' });
			const nd = nodes[idx]!;
			const nsx = width / 2 + tx + nd.x * scale;
			const nsy = height / 2 + ty + nd.y * scale;
			const r = 3 + Math.min(nd.degree, 6);
			const tw = tooltip.offsetWidth || 120;
			const th = tooltip.offsetHeight || 18;
			let left = nsx + r + 8;
			if (left + tw > width - 4) left = nsx - r - 8 - tw;
			left = Math.max(4, Math.min(left, width - tw - 4));
			let top = nsy - th / 2;
			top = Math.max(4, Math.min(top, height - th - 4));
			tooltip.setCssProps({ left: `${left}px`, top: `${top}px` });
			canvas.setCssProps({ cursor: 'pointer' });
		} else {
			tooltip.setCssProps({ display: 'none' });
			canvas.setCssProps({ cursor: dragging ? 'grabbing' : 'grab' });
		}
	};

	const onMouseDown = (e: MouseEvent): void => {
		dragging = true;
		tooltip.setCssProps({ display: 'none' });
		dragMoved = false;
		lastX = e.clientX;
		lastY = e.clientY;
		canvas.setCssProps({ cursor: 'grabbing' });
	};

	const onMouseMove = (e: MouseEvent): void => {
		if (dragging) {
			const dx = e.clientX - lastX;
			const dy = e.clientY - lastY;
			if (Math.hypot(dx, dy) > 4) dragMoved = true;
			tx += dx;
			ty += dy;
			lastX = e.clientX;
			lastY = e.clientY;
			draw();
			return;
		}
		handleHover(e);
	};

	const onMouseUp = (e: MouseEvent): void => {
		if (!dragging) return;
		dragging = false;
		canvas.setCssProps({ cursor: 'grab' });
		if (dragMoved) return;
		// click
		const idx = findNodeAt(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
		if (idx >= 0) void app.workspace.getLeaf(false).openFile(nodes[idx]!.file);
	};

	const onWheel = (e: WheelEvent): void => {
		e.preventDefault();
		tooltip.setCssProps({ display: 'none' });
		const rect = canvas.getBoundingClientRect();
		const sx = e.clientX - rect.left;
		const sy = e.clientY - rect.top;
		const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
		const newScale = Math.min(3, Math.max(0.3, scale * factor));
		if (newScale === scale) return;
		const gx = (sx - (width / 2 + tx)) / scale;
		const gy = (sy - (height / 2 + ty)) / scale;
		scale = newScale;
		tx = sx - width / 2 - gx * scale;
		ty = sy - height / 2 - gy * scale;
		draw();
	};

	const onMouseLeave = (): void => {
		tooltip.setCssProps({ display: 'none' });
		if (!dragging) canvas.setCssProps({ cursor: 'grab' });
	};

	canvas.setCssProps({ cursor: 'grab' });
	canvas.addEventListener('mousedown', onMouseDown);
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', onMouseUp);
	canvas.addEventListener('wheel', onWheel, { passive: false });
	canvas.addEventListener('mouseleave', onMouseLeave);

	const ro = new ResizeObserver(() => {
		resize();
		draw();
	});
	ro.observe(wrap);

	rafId = window.requestAnimationFrame(step);

	return () => {
		running = false;
		cancelAnimationFrame(rafId);
		ro.disconnect();
		canvas.removeEventListener('mousedown', onMouseDown);
		window.removeEventListener('mousemove', onMouseMove);
		window.removeEventListener('mouseup', onMouseUp);
		canvas.removeEventListener('wheel', onWheel);
		canvas.removeEventListener('mouseleave', onMouseLeave);
	};
}
