import { graph } from 'neo4j-driver';
import type {
	EdgeI,
	GraphI,
	NeoGraphI,
	NodeI,
	SlideI,
	neo4JURL,
	neo4jNode,
	neo4jRelationship
} from './model';
import { get } from 'svelte/store';
import { pictureMap, graph as storeGraph } from './store';
import CryptoJS from 'crypto-js';

export const getImages = async () => {
	const _graph = get(storeGraph) as GraphI;
	const nodes = _graph.nodes.filter((d) => d.visuals.slide && !d.visuals.blob);
	pictureMap.set({});
	for (const node of nodes) {
		const hex = getHex(node.properties.url);
		callPPT(node.properties.url, false).then((blob) => {
			const _pictureMap = get(pictureMap);
			const _q = JSON.parse(node.properties.url) as neo4JURL;
			_pictureMap[hex] = {
				picture: URL.createObjectURL(blob),
				height: _q.screenHeight,
				width: _q.screenWidth,
				href: _q.href
			};
			pictureMap.set(_pictureMap);
		});
		// try {
		// 	// const res = await fetch(`http://localhost:9002/backup/${hex}_thumb.png`);
		// 	// const blob = await res.blob();
		// 	const blob = await callPPT(node.properties.url, false);
		// 	const _pictureMap = get(pictureMap);
		// 	const _q = JSON.parse(node.properties.url) as neo4JURL;
		// 	_pictureMap[hex] = {
		// 		picture: URL.createObjectURL(blob),
		// 		height: _q.screenHeight,
		// 		width: _q.screenWidth,
		// 		href: _q.href
		// 	};
		// 	pictureMap.set(_pictureMap);
		// } catch (e) {
		// 	// const blob = await callPPT(node.properties.url, false);
		// 	console.error(e);
		// }
	}
};

export const fromNeo4J = (neoGraph: NeoGraphI): GraphI => {
	let nodes: NodeI[] = neoGraph.nodes.map((d, i) => ({
		...d,
		id: d.identity,
		x: i * Math.random(),
		y: i * Math.random(),
		visuals: { inSlidePosition: 0 }
	}));

	let lastIdx = 1;
	nodes = nodes.map((d) => {
		if (d.properties.url) {
			d.visuals.inSlidePosition = lastIdx++;
			// d.visuals.inSlidePosition = d.distance;
			d.visuals.slide = getHex(d.properties.url);
		}
		return d;
	});

	return {
		nodes: nodes,
		edges: neoGraph.edges.map((d, i) => ({
			...d,
			id: d.identity,
			x: 0,
			y: 0,
			source: d.start,
			target: d.end
		}))
	};
};

export const mergeGraphs = (graph1: GraphI, graph2: GraphI): GraphI => {
	const nodeIds = graph1.nodes.map((d) => d.id);
	const edgeIds = graph1.edges.map((d) => d.id);

	const newGraph: GraphI = { nodes: [...graph1.nodes], edges: [...graph1.edges] };
	graph2.nodes.forEach((d) => {
		if (!nodeIds.includes(d.id)) newGraph.nodes.push(d);
		else {
			const node = newGraph.nodes.find((n) => n.id === d.id);
			if (node) {
				node.visuals = d.visuals;
			}
		}
	});
	graph2.edges.forEach((d) => {
		if (!edgeIds.includes(d.id)) newGraph.edges.push(d);
	});
	return newGraph;
};

export async function fetchSlide(node: NodeI): Promise<boolean> {
	if (!node.properties.url) return false;
	const nodeId = node.id;
	const _graph = get(storeGraph) as GraphI;
	const idx = _graph.nodes.findIndex((dd) => dd.id === nodeId);
	if (idx === -1) return false;

	const nodeUrl = JSON.parse(node.properties.url) as neo4JURL;

	const slide: SlideI = {
		href: nodeUrl.href,
		width: nodeUrl.screenWidth,
		height: nodeUrl.screenHeight
	};
	const urlCreator = window.URL || window.webkitURL;
	if (!urlCreator) return false;

	const ret = await fetch(`http://localhost:8080/ppt`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ ...slide, wait: 10 })
	})
		.then((d) => d.blob())
		.catch((e) => {
			console.error(e);
			throw e;
		});

	slide.picture = urlCreator.createObjectURL(ret);

	_graph.nodes[idx].visuals.slide = getHex(node.properties.url);
	storeGraph.set(_graph);
	return true;
}

export function jsonDiff(
	obj1: Record<string, any>,
	obj2: Record<string, any>
): Record<string, any> {
	const result: Record<string, any> = {};
	if (Object.is(obj1, obj2)) {
		return {};
	}
	if (!obj2 || typeof obj2 !== 'object') {
		return obj2;
	}
	Object.keys(obj1 || {})
		.concat(Object.keys(obj2 || {}))
		.forEach((key) => {
			if (obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key])) {
				result[key] = obj2[key];
			}
			if (typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
				const value = jsonDiff(obj1[key], obj2[key]);
				if (value !== undefined) {
					result[key] = value;
				}
			}
		});
	return result;
}

export async function callNeo4j(cypher: string, ids?: number[]): Promise<NeoGraphI> {
	console.log('cypher', cypher);

	return new Promise((resolve, reject) => {
		fetch('/api/neo4j', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ cypher: cypher, ids: ids })
		})
			.then((d) => d.json().then(resolve).catch(reject))
			.catch(reject);
	});
}

export function getHex(query: string): string {
	const _q = JSON.parse(query) as neo4JURL;
	const q = {
		height: _q.screenHeight,
		url: _q.href,
		width: _q.screenWidth
	};

	return CryptoJS.MD5(CryptoJS.enc.Utf8.parse(JSON.stringify(q))).toString(CryptoJS.enc.Hex);
}

export async function callPPT(query: string, force = false): Promise<Blob> {
	console.log('query', query);
	if (!query) {
		return new Promise((resolve, reject) => reject('no query'));
	}
	const _q = JSON.parse(query) as neo4JURL;
	const q = {
		height: _q.screenHeight,
		width: _q.screenWidth,
		href: _q.href,
		wait: 15,
		force: force
	};

	return new Promise((resolve, reject) => {
		fetch('/api/ppt', {
			method: 'POST',
			headers: {
				'Content-Type': 'image/png'
			},
			body: JSON.stringify(q)
		})
			.then((d) => d.blob().then(resolve).catch(reject))
			.catch(reject);
	});
}

export function getContrastYIQ(hexcolor: string) {
	const r = parseInt(hexcolor.substring(1, 3), 16);
	const g = parseInt(hexcolor.substring(3, 5), 16);
	const b = parseInt(hexcolor.substring(5, 7), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 160 ? 'black' : 'white';
}
