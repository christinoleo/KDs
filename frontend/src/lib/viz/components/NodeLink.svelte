<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		hovered,
		selected,
		settings,
		selectedIds,
		nodesOfInterest,
		ppts,
		pictureMap
	} from './../../store.js';
	import { selecting } from './../../store.js';
	import { graph, colorMap } from '$lib/store';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import {
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCenter,
		quadtree,
		drag,
		select,
		forceCollide,
		forceRadial,
		scaleOrdinal,
		schemeCategory10,
		type Simulation
	} from 'd3';
	import type {
		NodeI,
		EdgeI,
		neo4jNode,
		neo4jRelationship,
		PosI,
		PosLinkI,
		GraphI
	} from '$lib/model';
	import { fromNeo4J, getHex, getImages } from '$lib/utils';
	import Legend from './Legend.svelte';
	const { data, width, height, xScale } = getContext('LayerCake') as any;
	import { cloneDeep, identity, map, merge, slice } from 'lodash-es';
	import { runLayout } from './cyutils.js';
	import BasicData from '$lib/sidepanel/BasicData.svelte';

	const dispatch = createEventDispatcher();

	export let manyBodyStrength = -10;
	export let radius = 10;

	let displayNodes: NodeI[] = [];
	let displayEdges: EdgeI[] = [];
	let displayGraph: GraphI = { nodes: [], edges: [] };
	let simulation: Simulation<NodeI, EdgeI>;

	let found: NodeI | undefined;
	let draggingNode: NodeI | undefined;
	let panning = false;
	// let pan = { x: -200, y: -200 };
	let pan = { x: 0, y: 0 };
	let scale = 1;
	let amount = 1;

	$: pan = { x: $width / 2, y: $height / 2 };

	onMount(() => {});

	$: {
		$graph = fromNeo4J($data);
		getImages();
	}

	function generateDisplayNodes() {
		displayGraph.nodes = cloneDeep($graph.nodes).filter((n) => $settings.show[n.labels[0]].show);
		const ids = new Set(displayGraph.nodes.map((d) => d.id));
		displayGraph.edges = cloneDeep($graph.edges).filter((l) => {
			return ids.has(l.source) && ids.has(l.target);
		});

		const layouts = Object.keys($settings.show).filter((d) => $settings.show[d].layout);
		const layoutNodes = displayGraph.nodes.filter(
			(n) => $nodesOfInterest.map((d) => d.identity).includes(n.id) || layouts.includes(n.labels[0])
		);
		const posOffset =
			$settings.layout === 'circle' ? 0 : $settings.layout === 'avsdf' ? -550 : -200;
		runLayout(
			layoutNodes,
			cloneDeep(displayGraph.edges),
			$settings.layout,
			layouts.map((l) => layoutNodes.filter((n) => n.labels[0] === l).map((n) => n.id.toString())),
			$width / 2,
			$height / 2
		).forEach((n, i) => {
			const p = n.position();
			const id = parseInt(n.id());
			const idx = displayGraph.nodes.findIndex((d) => d.id === id);
			displayGraph.nodes[idx].fx = p.x + posOffset;
			displayGraph.nodes[idx].fy = p.y + posOffset;
		});
	}
	$: {
		if ($graph && $settings && $nodesOfInterest) generateDisplayNodes();
	}

	$: {
		// $colorMap = $colorMap.domain($graph.nodes.map((d) => d.labels[0]));
		simulation = forceSimulation<NodeI, EdgeI>(displayGraph.nodes);
		simulation.on('tick', () => {
			displayNodes = simulation.nodes();
			displayEdges = displayGraph.edges;
		});
	}

	$: {
		simulation
			.alpha(0.7)
			.alphaDecay(0.03)
			.alphaTarget(0)
			.force(
				'link',
				forceLink<NodeI, EdgeI>(displayGraph.edges)
					.id((d) => d.id)
					.strength(1.5)
					.distance(radius * 5)
			)
			.force('charge', forceManyBody().strength(manyBodyStrength).distanceMax(200).distanceMin(0))
			// .force('center', forceCenter($width / 2, $height / 2).strength(0.02))
			.force(
				'collide',
				forceCollide<NodeI>()
					.strength(0.2)
					.radius((d) => (!!d.properties.url ? 70 : radius * 3.5))
					.iterations(1)
			) // Force that avoids circle overlapping
			// .force('attract', forceRadial<NodeI>(radius * 50, width / 2, height / 2).strength(0.002))
			.restart();
	}
	function mousedown(e: any) {
		panning = true;
		// simulation.stop();
	}
	function mousemove(e: any) {
		if (!!draggingNode) {
			dragging(e.x, e.y);
		} else if (panning) {
			pan.x += e.movementX / amount;
			pan.y += e.movementY / amount;
		}
	}
	function mouseup(e: any) {
		panning = false;
		if (!!draggingNode) stoppedDragging(draggingNode);
		// simulation.restart();
	}
	function mousewheel(e: any) {
		let x = e.x;
		let y = e.y;

		amount = 1 + e.wheelDeltaY / 3000;
		scale *= amount;
		pan.x = x - (x - pan.x) * amount;
		pan.y = y - (y - pan.y) * amount;
	}
	function mouseleave(e: any) {
		mouseup(e);
	}

	function processSelection() {
		if ($selecting !== undefined && !!$selecting?.text) {
			//@ts-ignore
			$selectedIds = $selectedIds.filter((d) => d.selection.text !== $selecting.text);
			if ($selected) {
				$selectedIds.push({
					...$selecting,
					selectedId: $selected.id
				});
			}
			$selectedIds = $selectedIds;
		}
	}

	function startedDragging(node: NodeI) {
		draggingNode = node;
		if ($selected?.id === node.id) {
			$selected = undefined;
			processSelection();
		} else {
			$selected = node;
			if ($selecting && $selecting.labelMatch === $selected?.labels[0]) {
				processSelection();
				$selected = undefined;
				$selecting = undefined;
			}
		}
	}
	function dragging(x: number, y: number) {
		if (!draggingNode) return;
		simulation.alpha(0.1).restart();
		// if (simulation. === 0) {
		// 	startDragging = node.id;
		// 	simulation.alpha(0.01).restart();
		// }
		// if (simulation.alpha() < 0.005) simulation.alpha(0.01);
		draggingNode.fx = (x - pan.x) / scale;
		draggingNode.fy = (y - pan.y) / scale;
	}

	function stoppedDragging(node: NodeI) {
		// node.fx = null;
		// node.fy = null;
		simulation.alphaTarget(0);
		draggingNode = undefined;
	}

	const preload = async (src: string) => {
		const resp = await fetch(src);
		const blob = await resp.blob();

		return new Promise(function (resolve, reject) {
			let reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	};
</script>

<Legend />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svg
	class="root bg-gray-200"
	on:mousewheel|capture|preventDefault|stopPropagation={mousewheel}
	on:mousedown={mousedown}
	on:mousemove={mousemove}
	on:mouseup={mouseup}
	on:mouseleave={mouseleave}
>
	<defs>
		<marker
			id="arrowhead"
			markerWidth="10"
			markerHeight="7"
			refX={radius + 8}
			refY="3.5"
			orient="auto"
		>
			<polygon points="0 0, 10 3.5, 0 7" />
		</marker>
	</defs>
	<g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
		{#each displayEdges as edge}
			<line
				class="edge"
				x1={edge.source.x}
				x2={edge.target.x}
				y1={edge.source.y}
				y2={edge.target.y}
				stroke="black"
				opacity="0.7"
				marker-end="url(#arrowhead)"
			/>
		{/each}
		{#each displayNodes as node, i}
			{#if node.properties.url}
				{@const hex = getHex(node.properties.url)}
				{@const ppt = $ppts.findIndex((d) => d.data.id === node.id)}
				<g transform={`translate(${node.x - 50}, ${node.y - 50})`}>
					<rect
						on:mousedown|capture|preventDefault|stopPropagation={() => startedDragging(node)}
						on:mouseenter={() => ($hovered = node)}
						on:mouseleave={() => ($hovered = undefined)}
						width="100px"
						height="95px"
						x={0}
						y={0}
						fill={node.id === found?.id ? 'red' : $colorMap(node.labels[0])}
						rx="5"
						class:selected={node.id === $selected?.id}
					/>
					<text class="pointer-events-none overflow-auto" x={10} y={19}>
						{node.properties.label.length > 10
							? node.properties.label.slice(0, 8).trim() + '...'
							: node.properties.label}
					</text>
					<foreignObject x={0} y={73} width={100} height={100}>
						<div class="flex flex-row w-full justify-between items-center">
							<button
								class="btn btn-xs btn-ghost w-2"
								on:click={() => {
									if (ppt > 0) {
										$ppts.splice(ppt - 1, 0, $ppts.splice(ppt, 1)[0]);
										$ppts = $ppts;
									}
								}}
							>
								{'<'}
							</button>
							<span class="text-sm w-full self-center align-middle text-center">
								{#if ppt >= 0}
									{ppt + 1}
								{:else}
									-
								{/if}
							</span>
							<button
								class="btn btn-xs btn-ghost w-2"
								on:click={() => {
									if (ppt < $ppts.length - 1) {
										$ppts.splice(ppt + 1, 0, $ppts.splice(ppt, 1)[0]);
										$ppts = $ppts;
									}
								}}
							>
								{'>'}
							</button>

							{#if ppt >= 0}
								<button
									class="btn btn-xs btn-ghost w-2"
									on:click={() => {
										$ppts = $ppts.filter((d) => d.id !== node.id);
									}}>{'X'}</button
								>
							{:else}
								<button
									class="btn btn-xs btn-ghost w-2"
									on:click={() => {
										$ppts.push({ id: node.id, data: node });
										$ppts = $ppts;
									}}>{'√'}</button
								>
							{/if}
						</div>
					</foreignObject>
					{#if hex in $pictureMap}
						<image
							class="pointer-events-none"
							xlink:href={$pictureMap[hex].picture}
							width="90px"
							height="90px"
							x={5}
							y={5}
						/>
					{:else}
						<foreignObject x={25} y={25} width="90px" height="90px">
							<div class="loading loading-spinner" />
						</foreignObject>
					{/if}

					{#if node.properties.label === 'intention' || node.properties.label == 'insight'}
						<circle
							class="pointer-events-none"
							cx={85}
							cy={12.5}
							r={5}
							fill={node.properties.label === 'insight' ? 'white' : 'black'}
						/>
					{/if}
				</g>
			{:else}
				<circle
					on:mousedown|capture|preventDefault|stopPropagation={() => startedDragging(node)}
					on:mouseenter={() => ($hovered = node)}
					on:mouseleave={() => ($hovered = undefined)}
					class="node"
					r={radius}
					fill={node.id === found?.id ? 'red' : $colorMap(node.labels[0])}
					class:of-interest={$nodesOfInterest.map((d) => d.identity).includes(node.id)}
					class:selected={node.id === $selected?.id}
					class:inSlides={node.visuals.inSlidePosition !== undefined}
					class:canSelect={$selecting?.labelMatch === node.labels[0] && $selecting?.filter
						? !Object.entries($selecting.filter).some((d) => {
								return node.properties?.[d[0]] !== d[1];
						  })
						: false}
					class:canNotSelect={$selecting &&
						($selecting?.labelMatch !== node.labels[0] ||
							($selecting?.filter
								? !Object.entries($selecting.filter).some((d) => {
										return node.properties?.[d[0]] === d[1];
								  })
								: false))}
					cx={node.x}
					cy={node.y}
				/>
				{#if node.properties.label === 'intention'}
					<circle r={radius / 5} fill={'black'} cx={node.x} cy={node.y} />
				{:else if node.properties.label === 'insight'}
					<circle r={radius / 5} fill={'white'} cx={node.x} cy={node.y} />
				{/if}
			{/if}
		{/each}

		{#if $hovered}
			{@const node = displayNodes.find((d) => d.id === $hovered?.id)}
			{#if node}
				<foreignObject
					x={node.x + 50}
					y={node.y + 10}
					width="300"
					height="700"
					class="pointer-events-none"
				>
					<div
						class="absolute top-0 left-0 w-fit max-w-[20rem] h-fit card card-bordered z-50 bg-white rounded-sm pointer-events-none"
						in:fade={{ duration: 100 }}
					>
						<div class="card-body">
							<div class="card-title">Node Data</div>
							<div>
								<BasicData data={node} />
							</div>
						</div>
					</div>
				</foreignObject>
			{/if}
		{/if}
	</g>
</svg>

<style>
	.root {
		width: 100%;
		height: 100%;
	}
	.node {
		cursor: pointer;
		transition: 0.3s fill;
		stroke-width: 3px;
	}
	.node:hover {
		stroke: black;
	}
	.selected {
		stroke: #3a3a3d;
		stroke-width: 4px;
	}
	.inSlides {
		stroke: black;
		stroke-width: 4px;
	}
	.canSelect {
		/* stroke: greenyellow;
		stroke-width: 3px; */
	}
	.canNotSelect {
		fill: black;
	}
	.of-interest {
		stroke: #772626;
		stroke-width: 4px;
	}
</style>
