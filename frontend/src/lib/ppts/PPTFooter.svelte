<script lang="ts">
	import { pictureMap } from './../store.ts';
	import type { NodeI, neo4JURL } from '$lib/model';
	import { graph, ppts, selected } from '$lib/store';
	import { onMount } from 'svelte';
	import SortableList from './SortableList.svelte';

	let selfChanged = false;

	$: $ppts = $graph.nodes
		.filter((d) => !!d.properties.url)
		.map((d) => ({ id: d.id, data: d }))
		.sort((d) => d.data.visuals.inSlidePosition);

	const sortList = (ev: any) => {
		$ppts = ev.detail.map((d: { id: any; data: NodeI }, i: number) => {
			d.data.visuals.inSlidePosition = i + 1;
			return d;
		});
	};

	let box: HTMLDivElement;
	let generating = false;
	function parseScroll(e: any) {
		box.scrollLeft += e.deltaY + e.deltaX;
	}

	type pptReqBody = {
		ppts: {
			href: string;
			width: number;
			height: number;
			label: string;
			type: string;
			shapes: Record<string, any>[];
			data: Record<string, any>;
		}[];
	};
	async function generateSlides() {
		generating = true;
		const body: pptReqBody = {
			ppts: $ppts.map((d) => {
				const _q = JSON.parse(d.data.properties.url) as neo4JURL;
				const shapes = JSON.parse(d.data.properties.shapes || '[]');
				return {
					href: _q.href,
					width: _q.screenWidth,
					height: _q.screenHeight,
					wait: 10,
					label: d.data.labels[0],
					type: d.data.properties?.label || '',
					shapes: shapes,
					data: { text: d.data.properties?.text || d.data.properties?.label || '' }
				};
			})
		};
		console.log(body);
		fetch('http://localhost:8080/ppt/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
			.then((response) => response.blob())
			.then((blob) => {
				var url = window.URL.createObjectURL(blob);
				var a = document.createElement('a');
				a.href = url;
				a.download = 'filename.pptx';
				document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
				a.click();
				a.remove(); //afterwards we remove the element again

				generating = false;
			});
		// const data = await res.json();
		// console.log(data);

		// for (let i = 0; i < $ppts.length; i++) {
		// 	const d = $ppts[i];
		// 	if (d.data.properties.url) {
		// 		console.log('calling', d.id);
		// 		await callPPT(d.data.properties.url, true);
		// 		console.log('finished calling', d.id);
		// 	}
		// }
		// console.log('FINISHED');
	}
</script>

<button
	class="absolute bottom-[11rem] left-2 btn btn-primary"
	on:click={() => generateSlides()}
	disabled={generating}
>
	{#if generating}
		<span>Generating...</span>
		<div class="loading loading-spinner" />
	{:else}
		<span>Generate Slides</span>
	{/if}
</button>
<div
	class="w-full h-full bg-white flex flex-row overflow-auto gap-2 p-2 pt-0"
	on:mousewheel={parseScroll}
	bind:this={box}
>
	<SortableList list={$ppts} key="id" on:sort={sortList} let:item let:index>
		<button
			on:click={() => {
				$selected = item.data;
			}}
			class="hover:bg-gray-100 rounded-md"
			class:is-active={$selected && $selected.id === item.data.id}
		>
			<div class="flex flex-row px-5 py-1">
				<h3 class="">Slide {index + 1}</h3>
				<button
					class="btn btn-xs btn-circle btn-outline btn-error ml-auto"
					on:click|stopPropagation={() => {
						$ppts = $ppts.filter((d) => d.id !== item.id);
					}}>X</button
				>
			</div>
			<!-- <img
				src={`http://localhost:9002/backup/${item.data.visuals.slide}_thumb.png`}
				alt="slide"
				class="h-[6rem] min-w-[6rem] pointer-events-none rounded-b-md"
			/> -->
			{#if $pictureMap?.[item.data.visuals.slide]}
				<img
					src={$pictureMap?.[item.data.visuals.slide].picture}
					alt="slide"
					class="h-[6rem] min-w-[6rem] pointer-events-none rounded-b-md"
				/>
			{:else}
				<div
					class="loading loading-spinner h-[6rem] min-w-[6rem] pointer-events-none rounded-b-md"
				/>
			{/if}
		</button>
	</SortableList>
</div>

<style>
	.ppt {
	}
	.ppt:hover {
		border: 1px solid black;
	}
	.is-active {
		border: 1px solid black;
	}
</style>
