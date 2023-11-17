<script lang="ts">
	import type { neo4jNode } from '$lib/model';
	import { colorMap, settings } from '$lib/store';
	import { callNeo4j, getContrastYIQ } from '$lib/utils';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	export let type: 'insight' | 'intention';
	let elements: neo4jNode[] = [];
	let filteredElements: neo4jNode[] = [];
	let search: string = '';
	let mounted = false;

	onMount(() => {
		console.log(type);
		mounted = true;
	});

	$: filteredElements = elements.filter(
		(e) => search === '' || e.properties.text.toLowerCase().includes(search.toLowerCase())
	);

	$: if ($settings && mounted) fetchData();

	function fetchData() {
		const tools = $settings.tools.map((d) => `"${d}"`).join(', ');

		callNeo4j(
			`MATCH (n:H_SEQUENCE {label: "${type}"}) WHERE n.tool in [${tools}] RETURN n LIMIT 25`
		).then((d) => {
			elements = d.nodes;
		});
	}
</script>

<div class="overflow-auto p-2 w-full h-[calc(100%-4rem)]">
	{#if !elements || elements.length === 0}
		Loading <span class="loading loading-spinner loading-xs" />
	{:else}
		<input
			type="text"
			class="input input-sm input-bordered w-full mb-2"
			placeholder="Search"
			bind:value={search}
		/>
		<ul class="menu bg-base-200 w-full gap-2 rounded-sm">
			{#each filteredElements as item, i (JSON.stringify(item.properties))}
				{@const color = $colorMap(item.labels[0])}
				{@const colorLabel = $colorMap(item.properties.label)}
				<li
					style={`--custom-color: ${color}; --contrast-color: ${getContrastYIQ(color)}`}
					in:fade
					animate:flip={{ duration: 200 }}
					class="bg-white p-1 w-full rounded-md border-solid border-[1px] bgcolor cursor-grab"
					draggable="true"
					on:dragstart={(event) => {
						if (event?.dataTransfer) event.dataTransfer.setData('text/plain', JSON.stringify(item));
					}}
				>
					{item.properties.text}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.bgcolor {
		border-color: var(--custom-color);
		/* color: var(--contrast-color); */
	}
</style>
