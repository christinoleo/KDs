<script lang="ts">
	import { identity } from 'lodash-es';
	import { cypherTemplates, selectedCypher, thumbnails } from './../lib/store.js';
	import CyNL from './../lib/viz/cy/CyNL.svelte';
	import CyEdge from './../lib/viz/cy/CyEdge.svelte';
	import CyNode from './../lib/viz/cy/CyNode.svelte';
	import type { EdgeI, NeoGraphI, NodeI, neo4JURL, neo4jNode, neo4jRelationship } from '$lib/model';
	import { Html, LayerCake, Svg } from 'layercake';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import BasicData from '$lib/sidepanel/BasicData.svelte';
	import QuerySelector from '$lib/query/QuerySelector.svelte';
	import QueryMain from '$lib/query/QueryMain.svelte';
	import {
		hovered,
		nodesOfInterest,
		selected,
		selectedIds,
		selecting,
		settings
	} from '$lib/store.js';
	import { mainCypher } from '$lib/store';
	import { callNeo4j, callPPT, jsonDiff } from '$lib/utils';
	import { onMount } from 'svelte';
	import NodeLink from '$lib/viz/components/NodeLink.svelte';
	import Inspector from '$lib/sidepanel/Inspector.svelte';
	import SelectorList from '$lib/sidepanel/SelectorList.svelte';
	import { flip } from 'svelte/animate';
	import PptFooter from '$lib/ppts/PPTFooter.svelte';

	let backendQueryResult: NeoGraphI = { nodes: [], edges: [] };
	let mounted = false;
	let tab = 0;
	let lastSelectedCypher = $selectedCypher;

	function requestNodes(clear: boolean = false) {
		console.log('requesting nodes');

		if (clear) {
			backendQueryResult = { nodes: [], edges: [] };
			return;
		}
		if (lastSelectedCypher !== $selectedCypher) {
			lastSelectedCypher = $selectedCypher;
			backendQueryResult = { nodes: [], edges: [] };
		}
		const ids = $nodesOfInterest.map((d) => `${d.identity}`).join(', ');
		const tools = $settings.tools.map((d) => `'${d}'`).join(', ');
		// const c = `MATCH (n) WHERE id(n) in [${ids}] RETURN * LIMIT 35`;
		// const c = `
		// MATCH p=(n1)-[:UPDATES_HUMAN]-()-[:SYNCHRONIZES_TO]-(c:M_STATE)-[r:PREV_STATE*0..4]-(m:M_STATE)-[:SYNCHRONIZES_TO]-()-[:UPDATES_HUMAN]-(n {label: "intention"})
		// WHERE id(n1) in [${ids}] and n.tool in [${tools}]
		// RETURN p, COUNT(r)
		// ORDER BY COUNT(r)
		// `;
		// const c = `
		// MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "intention"})
		// WHERE id(n1) in [${ids}] and n.tool in [${tools}]
		// RETURN p
		// `;
		// const c = `
		// MATCH p=(n1)-[:UPDATES_HUMAN]-()-[r:PREV_STATE*0..10]-()-[:UPDATES_HUMAN]-(n {label: "insight"})
		// WHERE id(n1) in [${ids}] and n.tool in [${tools}]
		// RETURN p
		// `;
		const c = cypherTemplates[$selectedCypher].cypher
			.replaceAll('{{ids}}', ids)
			.replaceAll('{{tools}}', tools);
		console.log(c);
		callNeo4j(
			c,
			$nodesOfInterest.map((d) => d.identity)
		).then((d) => {
			console.log(
				d.nodes.filter((dd) => dd.labels[0] === 'H_SEQUENCE').map((dd) => dd.properties.label)
			);
			backendQueryResult = d;
		});
	}

	function onToolClick(tool: string) {
		if ($settings.tools.includes(tool)) {
			const idx = $settings.tools.findIndex((d) => d === tool);
			if (idx !== -1) $settings.tools.splice(idx, 1);
		} else {
			$settings.tools.push(tool);
		}
		$settings.tools = $settings.tools;
	}

	$: if ($nodesOfInterest && $selectedCypher) requestNodes($nodesOfInterest.length === 0);

	function onDrop(event: DragEvent) {
		console.log(event);
		dragState = 0;
		const data = event.dataTransfer?.getData('text/plain');
		if (data) {
			const node = JSON.parse(data) as neo4jNode;
			$nodesOfInterest.push(node);
			$nodesOfInterest = $nodesOfInterest;
		}
	}

	$: if ($selected && tab != 2) tab = 2;

	let dragState: number = 0;
</script>

<!-- <div class="absolute top-5 left-5 z-10 w-[70vw] flex flex-col gap-4">
	<QueryMain cypher={$mainCypher} />
</div> -->
<QuerySelector />
<div class="flex w-screen h-screen">
	<div
		class="chart-container w-full h-screen"
		on:dragenter={() => (dragState = 1)}
		on:dragleave={() => (dragState = 0)}
		on:dragover={(ev) => ev.preventDefault()}
		on:drop={(e) => onDrop(e)}
		class:dropping={dragState === 1}
		role="article"
	>
		<LayerCake data={backendQueryResult} x={'x'} y={'y'} flatData={backendQueryResult.nodes}>
			<NodeLink />
		</LayerCake>
		<!-- <CyNL>
			{@const g = fromNeo4J(backendQueryResult)}
			{@const nodes = g.nodes}
			{@const edges = g.edges}
			{#each nodes as node}
				<CyNode {node} />
			{/each}

			{#each edges as edge}
				<CyEdge {edge} />
			{/each}
		</CyNL> -->
	</div>
	<div class="w-[30rem] overflow-auto p-3">
		<div class="tabs tabs-boxed w-full justify-center mb-1">
			<button
				class="tab tab-sm mx-1"
				class:tab-active={$settings.tools.includes('qol')}
				on:click={() => onToolClick('qol')}>QOL</button
			>
			<button
				class="tab tab-sm mx-1"
				class:tab-active={$settings.tools.includes('ocean')}
				on:click={() => onToolClick('ocean')}>Ocean</button
			>
			<button
				class="tab tab-sm mx-1"
				class:tab-active={$settings.tools.includes('modkt')}
				on:click={() => onToolClick('modkt')}>ModKT</button
			>
		</div>
		<div class="tabs tabs-boxed w-full justify-center">
			<button
				class="tab tab-sm mx-1"
				class:tab-active={tab === 0}
				on:click={() => {
					tab = 0;
					$selected = undefined;
				}}>Insights</button
			>
			<button
				class="tab tab-sm mx-1"
				class:tab-active={tab === 1}
				on:click={() => {
					tab = 1;
					$selected = undefined;
				}}>Intentions</button
			>
			<button
				class="tab tab-sm mx-1"
				class:tab-active={tab === 2}
				on:click={() => {
					tab = 2;
					$selected = undefined;
				}}>Inspector</button
			>
		</div>

		{#if tab === 0}
			<SelectorList type="insight" />
		{:else if tab === 1}
			<SelectorList type="intention" />
		{:else if tab === 2}
			<Inspector />
		{/if}
	</div>
	<div class="absolute bottom-0 h-[10rem] w-[calc(100%-22.5rem)]">
		<PptFooter />
	</div>
</div>

<style>
	.chart-container {
		height: 100vh;
	}

	.circle {
		position: absolute;
		border-radius: 50%;
		background-color: rgba(171, 0, 214);
		transform: translate(-50%, -50%);
		pointer-events: none;
		width: 10px;
		height: 10px;
	}

	.dropping {
		border: 2px dashed red;
	}
</style>
