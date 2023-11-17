<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import GraphStyles from './GraphStyles.js';

	let refElement: HTMLDivElement;
	let cyInstance: cytoscape.Core;

	setContext('graphSharedState', {
		getCyInstance: () => cyInstance
	});

	onMount(() => {
		cytoscape.use(dagre);

		cyInstance = cytoscape({
			container: refElement,
			style: GraphStyles as any
		});

		cyInstance.on('add', () => {
			cyInstance
				.makeLayout({
					name: 'dagre',
					rankDir: 'TB',
					nodeSep: 150
				} as any)
				.run();
		});
	});
</script>

<div class="graph w-full h-full" bind:this={refElement}>
	{#if cyInstance}
		<slot />
	{/if}
</div>
