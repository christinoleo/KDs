<script lang="ts">
	import { graph, nodesOfInterest, selectedCypher, settings } from './../store.js';
	import { cypherTemplates, selectedIds } from '$lib/store';
	import SelectLabelBadge from './SelectLabelBadge.svelte';
	import { geoInterpolate } from 'd3';
	import type { GraphI, NeoGraphI, SlideI, neo4JURL } from '$lib/model.js';

	var cypher = '';
	var requiredSelections = -1;
	var requiredInputs = {};

	// async function fetchSlides(graph: GraphI) {
	// 	var urlCreator = window.URL || window.webkitURL;
	// 	if (urlCreator) {
	// 		graph.nodes.forEach(async (d, i) => {
	// 			fetchSlide(d);
	// 		});
	// 	}
	// }

	// async function generate() {
	// 	if ($selectedCypher && $selectedIds) {
	// 		const cypher = cypherTemplates[$selectedCypher];

	// 		const lastIndex = cypher.cypher.lastIndexOf('RETURN');
	// 		const where = `WHERE ${$selectedIds
	// 			.map((d) => `id(${d.nodeName}) = ${d.selectedId}`)
	// 			.join(' AND ')} `;
	// 		const injectedCypher = [
	// 			cypher.cypher.slice(0, lastIndex),
	// 			where,
	// 			cypher.cypher.slice(lastIndex)
	// 		].join('');
	// 		console.log(injectedCypher);
	// 		const res: NeoGraphI = await callNeo4j(injectedCypher);
	// 		const newGraph = fromNeo4J(res);
	// 		newGraph.nodes = newGraph.nodes.map((d, i) => {
	// 			d.visuals.inSlidePosition = i;
	// 			return d;
	// 		});
	// 		fetchSlides(newGraph);

	// 		$graph = mergeGraphs($graph, newGraph);
	// 	}
	// }

	function changed(e: any) {
		const selectedOptionSettings = cypherTemplates?.[e.target.value]?.defaults;
		if (selectedOptionSettings) {
			$settings.layout = selectedOptionSettings.layout;
			Object.keys($settings.show).forEach((d: string) => {
				if (selectedOptionSettings.lock.indexOf(d) === -1) $settings.show[d].layout = false;
				else $settings.show[d].layout = true;
			});
			$settings = $settings;
		}
	}
</script>

<div class="absolute top-[1rem] left-5 z-10 flex flex-col gap-4">
	<div class="w-full flex gap-3">
		<div class="flex flex-col gap-3">
			<div class="gap-5 flex flex-row items-center">
				<select class="input rounded-md" bind:value={$selectedCypher} on:change={(e) => changed(e)}>
					<!-- <option>Custom</option> -->
					{#each Object.keys(cypherTemplates) as item, i}
						<option value={item}>{cypherTemplates[item].text}</option>
					{/each}
				</select>
				<button
					class="btn btn-warning hover:bg-opacity-25 tooltip"
					data-tip={'Reset all selections'}
					on:click={() => {
						$selectedIds = [];
						$nodesOfInterest = [];
					}}
					>Reset
				</button>

				<!-- <button
					class="btn btn-sm btn-primary"
					disabled={$selectedIds.length !== requiredSelections}
					on:click={generate}>Generate Slides</button
				>
				<button class="btn btn-sm btn-outline" on:click={() => {}}>Show cypher</button> -->
			</div>
		</div>

		<!-- <textarea
		placeholder="akuwdgk"
		class="textarea w-full rounded-md"
		bind:value={cypher}
		on:input={(e) => {
			selectedOption = 'Custom';
			cypher = e.target?.value;
		}}
	/> -->
	</div>
</div>

<!-- {#if $selectedCypher !== 'Custom'}
	{@const selectionList = cypherTemplates[$selectedCypher].requires.selections}
	{#if selectionList !== undefined}
		<div class="absolute top-[11rem] left-5 z-10 flex flex-col gap-4">
			<div class="flex flex-row gap-3">
				<div class="prose max-w-[8rem] text-sm">
					You have to select {selectionList.length} nodes. Please click on one of the buttons to the
					left and then select the appropriate node in the visualization below.
				</div>
			</div>
		</div>
		<div class="absolute top-[11rem] left-[10rem] z-10 flex flex-col gap-4">
			<div class="flex flex-row gap-3">
				{#each selectionList as item}
					<SelectLabelBadge selection={item} />
				{/each}
				<button
					class="btn btn-warning hover:bg-opacity-25 tooltip"
					data-tip={'Reset all selections'}
					on:click={() => {
						$selectedIds = [];
						$nodesOfInterest = [];
					}}
					>Reset
				</button>
			</div>
		</div>
	{/if}
{/if} -->
