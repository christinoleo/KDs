<script lang="ts">
	import { colorMap, selecting, cypherTemplates, selectedIds, selectedCypher } from '$lib/store';
	import { getContrastYIQ } from '$lib/utils';
	import type { QuerySelection, QuerySelectionDefinition } from './types';

	export let selection: QuerySelectionDefinition;

	function onclick() {
		if ($selecting === selection) {
			$selecting = undefined;
		} else {
			$selecting = selection;
			if ($selecting !== undefined && !!$selecting?.text) {
				//@ts-ignore
				$selectedIds = $selectedIds.filter((d) => d.selection.text !== $selecting.text);
				$selectedIds = $selectedIds;
			}
		}
	}
</script>

<div class="flex flex-row gap-3 flex-wrap pointer-events-auto">
	<div class="flex flex-row">
		{#each [selection.labelMatch] as item}
			{@const color = $colorMap(item)}
			{@const contrastColor = getContrastYIQ(color)}
			{@const alreadySelected = $selectedIds.find((d) => d.text === selection.text)}
			<div style={`--custom-color: ${color}; --contrast-color: ${contrastColor}`}>
				<button
					class="btn hover:bg-opacity-25 tooltip capitalize-f bgcolor"
					data-tip={'click this button and then select a node of type ' + item}
					class:active={$selecting === selection}
					class:selected={!!alreadySelected}
					on:click={() => onclick()}
				>
					<div class="capitalize-f">{selection.text}</div>
					{#if $selecting === selection}
						<div>currently selecting</div>
					{/if}
					{#if !!alreadySelected}
						<div class="flex flex-row items-center gap-1 pointer-events-none">
							<input type="checkbox" checked class="checkbox checkbox-sm" />selected id {alreadySelected.selectedId}
						</div>
					{/if}
					<!-- <div>{item}</div> -->
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	.capitalize-f {
		text-transform: none;
	}
	.bgcolor {
		/* background-color: var(--custom-color); */
		border: 1px solid var(--custom-color);
		color: var(--contrast-color);
		/* border: 0px solid black; */
	}
	.bgcolor.active {
		background-color: var(--custom-color);
		border: 2px solid black;
	}
	.bgcolor.selected {
		background-color: var(--custom-color);
		border: 2px solid black;
	}
	.bgcolor:hover {
		background-color: var(--custom-color);
		/* opacity: 0.75; */
	}
</style>
