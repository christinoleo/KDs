import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { callQuery } from './query';
import type { neo4jURL } from '$lib/model';

const defaultQuery = 'match (n)-[r]-(m) return * limit 5000';
export const POST: RequestHandler = async ({ url, params, route, request }) => {
	const { cypher, ids } = await request.json();
	const result = await callQuery(cypher, ids);

	return json({
		nodes: result.nodes,
		edges: result.edges
	});
};
