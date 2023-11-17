import { scaleOrdinal, schemeCategory10 } from 'd3';
import { writable } from 'svelte/store';
import type { QuerySelection, QuerySelectionDefinition, QueryTemplate } from './query/types';
import type { GraphI, NodeI, SlideI, neo4jNode } from './model';

// export const cypherTemplates: Record<string, QueryTemplate> = {
// 	'insight list from a selected intention': {
// 		cypher: `MATCH p1=((n1)-[:UPDATES_HUMAN]-()-[:SYNCHRONIZES_TO]-(c:M_STATE)-[:PREV_STATE*0..2]-(m:M_STATE)-[:SYNCHRONIZES_TO]-()-[:UPDATES_HUMAN]-(n {label: 'insight'}))
// 		RETURN DISTINCT n, n1
// 	`,
// 		requires: {
// 			selections: [
// 				{
// 					text: 'starting intention',
// 					labelMatch: 'H_SEQUENCE',
// 					filter: { label: 'intention' },
// 					nodeName: 'n1'
// 				}
// 			]
// 		}
// 	}
// };

type CypherTemplateI = {
	text: string;
	cypher: string;
	defaults: { layout: string; lock: string[] };
};
export const cypherTemplates: Record<string, CypherTemplateI> = {
	findInsights: {
		text: 'insight list related to node',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "insight"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}]
		RETURN p
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findInsightsS: {
		text: 'insight list related to node of same user',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "insight"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}] and n.user = n1.user
		RETURN p
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findIntentions: {
		text: 'intention list related to node',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "intention"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}]
		RETURN p
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findIntentionsS: {
		text: 'intention list related to node of same user',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "intention"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}] and n.user = n1.user
		RETURN p
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findClosestInsight: {
		text: 'closest insight related to node',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "insight"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}]
		WITH nodes(p) as px, relationships(p) as rx order by length(p) limit 1
		return rx, px
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findClosestInsightS: {
		text: 'closest insight related to node of same user',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "insight"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}] and n.user = n1.user
		WITH nodes(p) as px, relationships(p) as rx order by length(p) limit 1
		return rx, px
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findClosestIntention: {
		text: 'closest intention related to node',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "intention"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}]
		WITH nodes(p) as px, relationships(p) as rx order by length(p) limit 1
		return rx, px
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	findClosestIntentionS: {
		text: 'closest intention related to node of same user',
		cypher: `
		MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "intention"})
		WHERE id(n1) in [{{ids}}] and n.tool in [{{tools}}] and n.user = n1.user
		WITH nodes(p) as px, relationships(p) as rx order by length(p) limit 1
		return rx, px
	`,
		defaults: { layout: 'avsdf', lock: ['H_SEQUENCE'] }
	},
	closestIntentionInteractions: {
		text: 'interactions from closest intention which led to node',
		cypher: `
		MATCH p=(n)-[:UPDATES_HUMAN]-(n1)-[r:PREV_STATE*0..10]-(n2)-[:UPDATES_HUMAN]-(nf {label: "intention"})
		WHERE id(n) in [{{ids}}] and n.tool in [{{tools}}]
		match p1=(n2:H_STATE)-[:SYNCHRONIZES_TO]-(c:M_STATE)<-[:PREV_STATE*0..20]-(m:M_STATE)-[rr:SYNCHRONIZES_TO]-(n1:H_STATE)
		match states=shortestPath((c:M_STATE)<-[:PREV_STATE*0..20]-(m:M_STATE))
		with length(states) AS totalPaths, nodes(states) as statenodes, p, relationships(states) as rx, p1, rr ORDER BY totalPaths ASC LIMIT 1
		UNWIND statenodes as statenodesunwound
		CALL{
			with statenodesunwound
			optional match (statenodesunwound)<-[ir]-(interactions:M_SEQUENCE)
			optional match (hseq)-[hseqr:UPDATES_HUMAN]-(hs)<-[rhs:SYNCHRONIZES_TO]-(statenodesunwound)
			return interactions, ir, hs, rhs, hseq, hseqr LIMIT 1
		}
		return statenodesunwound, interactions, hs, rx, ir, rhs, hseqr, hseq, p, rr
		limit 150
	`,
		defaults: { layout: 'cose-bilkent', lock: ['H_STATE', 'M_STATE', 'H_SEQUENCE', 'M_SEQUENCE'] }
	},
	closestIntentionInteractionsSingleUser: {
		text: 'interactions from closest intention of same user which led to node',
		cypher: `
		MATCH p=(n)-[:UPDATES_HUMAN]-(n1)-[r:PREV_STATE*0..10]-(n2)-[:UPDATES_HUMAN]-(nf {label: "intention"})
		WHERE id(n) in [{{ids}}] and n.tool in [{{tools}}] and n.user = nf.user
		match p1=(n2:H_STATE)-[:SYNCHRONIZES_TO]-(c:M_STATE)<-[:PREV_STATE*0..20]-(m:M_STATE)-[rr:SYNCHRONIZES_TO]-(n1:H_STATE)
		WHERE n.user = nf.user
		match states=shortestPath((c:M_STATE)<-[:PREV_STATE*0..20]-(m:M_STATE))
		with length(states) AS totalPaths, nodes(states) as statenodes, p, relationships(states) as rx, p1, rr, n ORDER BY totalPaths ASC LIMIT 1
		UNWIND statenodes as statenodesunwound
		CALL{
			with statenodesunwound, n
			optional match (hseq)-[hseqr:UPDATES_HUMAN]-(hs)<-[rhs:SYNCHRONIZES_TO]-(statenodesunwound)
			WHERE n.user = hseq.user
			optional match (statenodesunwound)<-[ir]-(interactions:M_SEQUENCE)
			WHERE interactions.user = n.user
			return interactions, ir, hs, rhs, hseq, hseqr LIMIT 1
		}
		return statenodesunwound, interactions, hs, rx, ir, rhs, hseqr, p, rr, hseq
		limit 150
	`,
		defaults: { layout: 'cose-bilkent', lock: ['H_STATE', 'M_STATE', 'H_SEQUENCE', 'M_SEQUENCE'] }
	},
	closestInsightInteractions: {
		text: 'interactions from closest insight which led to node',
		cypher: `
		MATCH p=(n)-[:UPDATES_HUMAN]-(n1)-[r:PREV_STATE*0..10]-(n2)-[:UPDATES_HUMAN]-(nf {label: "insight"})
		WHERE id(n) in [{{ids}}] and n.tool in [{{tools}}]
		match p1=(nf)-[:UPDATES_HUMAN]-()-[:SYNCHRONIZES_TO]-(c:M_STATE)-[:PREV_STATE*0..20]->(m:M_STATE)-[rr:SYNCHRONIZES_TO]-()-[:UPDATES_HUMAN]-(n)
		match states=shortestPath((c:M_STATE)-[:PREV_STATE*0..20]->(m:M_STATE))
		with nodes(states) as statenodes, p, relationships(states) as rx, p1, rr
		UNWIND statenodes as statenodesunwound
		CALL{
			with statenodesunwound
			optional match (statenodesunwound)<-[ir]-(interactions:M_SEQUENCE)
			optional match (hseq)-[hseqr:UPDATES_HUMAN]-(hs)-[rhs:SYNCHRONIZES_TO]-(statenodesunwound)
			return interactions, ir, hs, rhs, hseq, hseqr LIMIT 1
		}
		return statenodesunwound, interactions, hs, rx, ir, rhs, hseqr, hseq, p, rr
		limit 150
	`,
		defaults: { layout: 'cose-bilkent', lock: ['H_STATE', 'M_STATE', 'H_SEQUENCE', 'M_SEQUENCE'] }
	}
	// TEST: {
	// 	text: 'TEST',
	// 	cypher: `MATCH p=(n:H_SEQUENCE)-[:UPDATES_HUMAN]-(n1:H_STATE)-[r:PREV_STATE*0..10]-(n2:H_STATE)-[:UPDATES_HUMAN]-(nf:H_SEQUENCE {label: "intention"})
	// 	WHERE id(n) in [485] and n.tool in ['qol']
	// 	MATCH p1=(nf)-[:UPDATES_HUMAN]-()-[:SYNCHRONIZES_TO]-(c:M_STATE)<-[:PREV_STATE*0..20]-(m:M_STATE)-[rr:SYNCHRONIZES_TO]-(n1)-[:UPDATES_HUMAN]-(n)
	// 	MATCH states=shortestPath((c:M_STATE)<-[:PREV_STATE*0..20]-(m:M_STATE))
	// 	WITH nodes(states) as statenodes, p, relationships(states) as rx, rr
	// 	UNWIND statenodes as statenodesunwound
	// 	CALL{
	// 		WITH statenodesunwound
	// 		OPTIONAL MATCH (statenodesunwound)<-[ir]-(interactions:M_SEQUENCE)
	// 		OPTIONAL MATCH (hseq)-[hseqr:UPDATES_HUMAN]-(hs)-[rhs:SYNCHRONIZES_TO]-(statenodesunwound)
	// 		RETURN interactions, ir, hs, rhs, hseq, hseqr
	// 		LIMIT 1
	// 	}
	// 	RETURN statenodesunwound, interactions, rx, p, ir, hs, rhs, hseq, hseqr, rr
	// 	LIMIT 150
	// `,
	// 	defaults: { layout: 'fcose', lock: ['H_STATE', 'M_STATE'] }
	// }
};

export const mainCypher = writable<string>('MATCH (n)-[r]-(m) RETURN * LIMIT 35');
// export const mainCypher = writable<string>('MATCH (n)-[r]-(m) RETURN * LIMIT 3500');
// export const mainCypher = writable<string>('MATCH (n {tool: "qol"})-[r]-(m) RETURN * LIMIT 3500');
export const colorMap = writable(
	scaleOrdinal(schemeCategory10).domain([
		'H_STATE',
		'H_SEQUENCE',
		'M_STATE',
		'M_SEQUENCE',
		'insight',
		'intention',
		'qol',
		'modKT',
		'ocean'
	])
);
export const graph = writable<GraphI>({
	nodes: [],
	edges: []
});
export const displayGraph = writable<GraphI>({
	nodes: [],
	edges: []
});
export const thumbnails = writable<Record<string, string>>({});
// export const selectedCypher = writable<string>('findIntentions');
export const selectedCypher = writable<string>('TEST');
export const selectedIds = writable<QuerySelection[]>([]);
export const selecting = writable<QuerySelectionDefinition | undefined>(undefined);
export const selected = writable<NodeI | undefined>(undefined);
export const ppts = writable<{ id: number; data: NodeI }[]>([]);
export const hovered = writable<NodeI | undefined>(undefined);
export const nodesOfInterest = writable<neo4jNode[]>([]);
export const pictureMap = writable<Record<string, SlideI>>({});
export const settings = writable<{
	layout: string;
	nodeSize: number;
	edgeSize: number;
	tools: string[];
	show: Record<string, { text: string; show: boolean; layout: boolean }>;
	filter: Record<string, Record<string, boolean>>;
}>({
	layout: 'fcose',
	nodeSize: 10,
	edgeSize: 1,
	tools: ['qol'],
	show: {
		H_SEQUENCE: { text: 'Human Temporal Sequence', show: true, layout: false },
		H_STATE: { text: 'Human States', show: true, layout: true },
		M_STATE: { text: 'Machine States', show: true, layout: true },
		M_SEQUENCE: { text: 'Machine Temporal Sequence', show: true, layout: false }
	},
	filter: {
		type: {
			INSIGHT: true,
			INTENTION: true
		}
	}
});
