<script lang="ts">
	import type { NodeI } from '../model';
	import { colorMap } from '../store';
	import { fetchSlide, getContrastYIQ } from '../utils';

	export let data: NodeI;
	let color = $colorMap(data.labels[0]);
	let contrastColor = getContrastYIQ(color);
</script>

{#if data}
	<div style={`--custom-color: ${color}; --contrast-color: ${contrastColor}`} class="prose">
		<div>
			<span class="badge bgcolor">{data.labels}</span>
			{#if data.properties?.label === 'insight'}
				<span class="badge bg-white">insight</span>
			{/if}
			{#if data.properties?.label === 'intention'}
				<span class="badge bg-black text-white">intention</span>
			{/if}
		</div>
		<div><b>user</b>: {data.properties?.user || 'Empty'}</div>
		<div><b>analysis</b>: {JSON.stringify(data.properties?.analysis)}</div>
		<div><b>tags</b>: {data.properties?.label || 'Empty'}</div>
		<div><b>lemmas</b>: {JSON.parse(data.properties?.lemmas || '["Empty"]').join(', ')}</div>
		<div><b>raw text</b>: {data.properties?.text || 'Empty'}</div>
	</div>
{/if}

<style>
	.bgcolor {
		background-color: var(--custom-color);
		color: var(--contrast-color);
	}
</style>
