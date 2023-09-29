import type { RequestHandler } from '@sveltejs/kit';
import { json, text } from '@sveltejs/kit';
import type { neo4jURL } from '$lib/model';

export const POST: RequestHandler = async ({ url, params, route, request }) => {
	const { href, width, height, wait, force } = await request.json();

	const body = JSON.stringify({ href, width, height, wait, force });

	return await fetch('http://localhost:8080/ppt', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: body
	});
};
