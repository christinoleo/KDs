<script lang="ts">
	import { settings } from './../../store.js';
	import { colorMap } from '$lib/store';
	import { getContrastYIQ } from '$lib/utils.js';
</script>

<div class="absolute right-0 card bg-white card-bordered bg-opacity-70 m-3 z-10">
	<div class="card-body p-2">
		<div class="form-control gap-2">
			<label class="label gap-2 py-0">
				<span>Layout:</span>
				<select class="select select-bordered select-sm w-full" bind:value={$settings.layout}>
					<option value="circle">Circle</option>
					<option value="klay">Klay</option>
					<option value="dagre">Dagre</option>
					<option value="grid">Grid</option>
					<option value="concentric">Concentric</option>
					<option value="avsdf">Avsdf</option>
					<option value="breadthfirst">Breadthfirst</option>
					<!-- <option value="elk">Elk</option> -->
					<option value="fcose">Fcose</option>
					<option value="cose">Cose</option>
					<option value="cose-bilkent">Cose-Bilkent</option>
					<option value="cola">Cola</option>
					<option value="cise">Cise</option>
				</select>
			</label>
			{#each Object.keys($settings.show) as key}
				{@const color = $colorMap(key)}
				{@const contrastColor = getContrastYIQ(color)}
				<label
					class="label gap-3 justify-normal rounded-full px-3"
					style={`--custom-color: ${color}; --contrast-color: ${contrastColor}`}
				>
					<input
						type="checkbox"
						class="checkbox checkbox-xs"
						bind:checked={$settings.show[key].show}
					/>
					<input
						type="checkbox"
						class="checkbox checkbox-xs"
						bind:checked={$settings.show[key].layout}
					/>
					<span class="label-text-alt">{$settings.show[key].text}</span>
				</label>
			{/each}
		</div>
	</div>
</div>

<style>
	.label {
		background-color: var(--custom-color);
	}
	span {
		color: var(--contrast-color);
	}
</style>
