import type { EdgeI, NodeI } from '$lib/model';
import cytoscape from 'cytoscape';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import cise from 'cytoscape-cise';
// import elk from 'cytoscape-elk';
import fcose from 'cytoscape-fcose';
import coseBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import avsdf from 'cytoscape-avsdf';

cytoscape.use(klay);
cytoscape.use(dagre);
cytoscape.use(cise);
// cytoscape.use(elk);
cytoscape.use(fcose);
cytoscape.use(coseBilkent);
cytoscape.use(cola);
cytoscape.use(avsdf);

type CytoNode = {
	data: {
		id: string;
		type?: string;
		source?: string;
		target?: string;
		position?: {
			x: number;
			y: number;
		};
		label?: string;
		count?: number;
		color?: string;
	};
};

export const runLayout = (
	nodes: NodeI[],
	edges: EdgeI[],
	layoutType: string,
	clusters: string[][],
	screenWidth: number,
	screenHeight: number
): cytoscape.NodeCollection => {
	const nodeIds = new Set(nodes.map((n) => n.id));
	if (nodes.length === 0) return cytoscape().nodes();
	const cy = makecy(
		nodes,
		edges.filter((d) => nodeIds.has(d.source) && nodeIds.has(d.target)),
		screenWidth,
		screenHeight
	);
	const layout = cy.layout({
		name: layoutType,
		padding: 40,
		klay: {
			compactComponents: false,
			nodeLayering: 'INTERACTIVE',
			nodePlacement: 'INTERACTIVE',
			layoutHierarchy: false
		},
		dagre: {
			rankDir: 'LR',
			ranker: 'longest-path',
			nodeSep: 10
		},
		fit: true,
		nodeSeparation: 180,
		clusters: clusters,
		nodeDimensionsIncludeLabels: true,

		// Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
		// boundingBox: undefined,

		ready: function () {
			// console.info('Layout.ready');
		}, // on layoutready
		stop: function () {
			// console.debug('Layout.stop');
		} // on layoutstop
	} as any);
	layout.run();

	const ret = cy.nodes();
	return ret;
};

export const makecy = (
	nodes: NodeI[],
	edges: EdgeI[],
	screenWidth: number,
	screenHeight: number
) => {
	return cytoscape({
		elements: {
			nodes: nodes.map((d) => ({
				data: {
					id: d.id.toString(),
					label: d.labels[0],
					position: {
						x: d.x,
						y: d.y
					}
				}
			})),
			edges: edges.map((d) => ({
				data: {
					id: d.source.toString() + d.target.toString(),
					source: d.source.toString(),
					target: d.target.toString()
				}
			}))
		},
		headless: true,
		styleEnabled: true,

		style: [
			// the stylesheet for the graph
			{
				selector: 'node',
				style: {
					label: 'data(id)',
					width: '100px',
					height: '100px',
					shape: 'ellipse',
					'border-width': 1,
					'padding-left': '3px',
					'padding-right': '3px',
					'padding-top': '3px',
					'padding-bottom': '3px'
				}
				// selector: 'node',
				// style: {
				//   content: 'data(id)',
				//   // label: 'data(id)',
				//   shape: 'round-rectangle',
				//   // width: 'label',
				//   // height: 200,
				//   'font-size': '10px',
				//   'padding-left': '5px',
				//   'padding-right': '5px',
				//   'padding-top': '5px',
				//   'padding-bottom': '5px',
				// },
			},

			{
				selector: 'edge',
				style: {
					'target-arrow-shape': 'triangle',
					'curve-style': 'bezier'
				}
			}
		]
	});
};
