import type { neo4jNode, neo4jRelationship } from '$lib/model';
import { max } from 'd3';
import neo4j, { PathSegment } from 'neo4j-driver';

const driver = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'infraconnexion'), {
	disableLosslessIntegers: true
});

const toDate = (json: {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
}) => {
	return new Date(json.year, json.month, json.day, json.hour, json.minute, json.second);
};

function populateDistance(
	final: neo4jNode,
	nodes: neo4jNode[],
	edges: neo4jRelationship[],
	currentDistance: number
) {
	const currentEdges = edges.filter((d) => d.start === final.identity || d.end === final.identity);

	const currentNodes = nodes.filter((d) =>
		currentEdges.some(
			(dd) => (dd.end === d.identity || dd.start === d.identity) && d.distance === -1
		)
	);

	let offset = 0;
	currentNodes.forEach((d, i) => {
		offset += i;
		nodes[nodes.findIndex((dd) => dd.identity === d.identity)].distance = currentDistance + offset;
		offset += populateDistance(d, nodes, edges, currentDistance + 1 + offset);
	});
	return offset;
}

const defaultQuery = 'match (n)-[r]-(m) return * limit 5000';
export const callQuery = async (queryStr: string, ids?: string[]) => {
	console.log('queryStr', queryStr);

	const session = driver.session();
	try {
		const result = await session.run(queryStr);
		const allNodes: Record<string, neo4jNode> = {};
		const allEdges: Record<string, neo4jRelationship> = {};
		result.records.map((v, i, a) => {
			Array.from(v.values()).forEach((d) => {
				let data = [d];
				if (Array.isArray(d)) data = d;
				data.forEach((d) => {
					if (neo4j.isRelationship(d)) {
						allEdges[d.identity.toString()] = {
							identity: d.identity as unknown as number,
							properties: JSON.parse(JSON.stringify(d.properties)),
							type: d.type,
							start: d.start as unknown as number,
							end: d.end as unknown as number
						};
					} else if (neo4j.isNode(d)) {
						allNodes[d.identity.toString()] = {
							identity: d.identity as unknown as number,
							properties: JSON.parse(JSON.stringify(d.properties)),
							labels: d.labels,
							distance: -1
						};
					} else if (neo4j.isPath(d)) {
						const start = d.start;
						const end = d.end;
						allNodes[start.identity.toString()] = {
							identity: start.identity as unknown as number,
							properties: JSON.parse(JSON.stringify(start.properties)),
							labels: start.labels,
							distance: -1
						};
						allNodes[end.identity.toString()] = {
							identity: end.identity as unknown as number,
							properties: JSON.parse(JSON.stringify(end.properties)),
							labels: end.labels,
							distance: -1
						};
						d.segments.forEach((dd) => {
							allNodes[dd.start.identity.toString()] = {
								identity: dd.start.identity as unknown as number,
								properties: JSON.parse(JSON.stringify(dd.start.properties)),
								labels: dd.start.labels,
								distance: -1
							};
							allNodes[dd.end.identity.toString()] = {
								identity: dd.end.identity as unknown as number,
								properties: JSON.parse(JSON.stringify(dd.end.properties)),
								labels: dd.end.labels,
								distance: -1
							};
							allEdges[dd.relationship.toString()] = {
								identity: dd.relationship.identity as unknown as number,
								properties: JSON.parse(JSON.stringify(dd.relationship.properties)),
								type: dd.relationship.type,
								start: dd.relationship.start as unknown as number,
								end: dd.relationship.end as unknown as number
							};
						});
					} else if (d === null) {
						// console.log('null');
					} else {
						console.log('unknown', d);
					}
				});
			});
		});

		let nodes = Object.values(allNodes);
		const edges = Object.values(allEdges);
		let main: neo4jNode | undefined = undefined;
		if (ids) main = nodes.find((d) => d.identity === parseInt(ids[0])) as neo4jNode;
		if (!main) {
			const insights = nodes.filter(
				(d) => d.labels.includes('H_SEQUENCE') && d.properties.label === 'insight'
			);
			if (insights.length > 0) {
				const max: any = { id: undefined, val: undefined };
				insights.forEach((d, i) => {
					const val = toDate(d.properties.updated as any).getTime();
					if (max.val === undefined || val > max.val) {
						max.id = i;
						max.val = val;
					}
				});
				main = insights[max.id];
			}
		}
		if (main) {
			main.distance = 0;
			populateDistance(main, nodes, edges, 0);

			nodes = nodes.sort((a, b) => {
				return a.distance > b.distance ? -1 : 1;
			});
		}

		return {
			nodes: nodes,
			edges: edges
		};
	} catch (e) {
		console.error(e);
		return {
			nodes: [],
			edges: []
		};
	} finally {
		session.close();
	}
};
