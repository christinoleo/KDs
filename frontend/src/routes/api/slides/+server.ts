import type { SlideI } from '$lib/model';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ url, params, route, request }) => {
	const slide = await request.json();

	const ret = await fetch(`http://localhost:8080/ppt`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(slide)
	})
		.then((d) => d.blob())
		.catch((e) => console.error(e));

	console.log('slide', slide, ret);

	return json({});
};
