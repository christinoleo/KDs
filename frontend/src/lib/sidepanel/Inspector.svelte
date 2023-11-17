<script lang="ts">
	import { JsonView } from '@zerodevx/svelte-json-view';
	import BasicData from './BasicData.svelte';
	import { hovered, pictureMap, selected } from '$lib/store';
	import { callPPT, getHex, jsonDiff } from '$lib/utils';
	import type { neo4JURL } from '$lib/model';

	$: data = $hovered ? $hovered : $selected ? $selected : undefined;
	let hex: string | undefined;
	$: hex = data && data.properties.url ? getHex(data.properties.url) : undefined;

	let _jsonDiff: Record<string, any> | undefined = undefined;
	$: if ($hovered && $selected) {
		_jsonDiff = jsonDiff($selected.properties, $hovered.properties);
		delete _jsonDiff['created'];
		delete _jsonDiff['updated'];
		delete _jsonDiff['UNIQUE IMPORT ID'];
		delete _jsonDiff['id'];
	} else {
		_jsonDiff = undefined;
	}

	let loading_src = false;
	let src: string | undefined = undefined;
	async function regenerate() {
		if (data && data?.properties.url && hex) {
			loading_src = true;
			delete $pictureMap[hex as string];
			$pictureMap = $pictureMap;
			callPPT(data.properties.url, true).then((blob) => {
				const _q = JSON.parse(data.properties.url) as neo4JURL;
				$pictureMap[hex as string] = {
					picture: URL.createObjectURL(blob),
					height: _q.screenHeight,
					width: _q.screenWidth,
					href: _q.href
				};
				$pictureMap = $pictureMap;
			});
			loading_src = false;
		}
	}
</script>

<div>
	{#if $hovered}
		<BasicData data={$hovered} />
	{:else if $selected}
		<BasicData data={$selected} />
	{/if}
</div>
{#if data?.visuals?.slide}
	{#if hex && hex in $pictureMap}
		<img src={$pictureMap[hex].picture} alt="slide" />
		<button class="w-full btn btn-sm mt-1" on:click={regenerate}>Regenerate slide</button>
	{:else}
		Loading <span class="loading loading-spinner loading-xs" />
	{/if}
{/if}
<p class="mt-7">
	{#if _jsonDiff}
		<JsonView json={_jsonDiff} />
	{:else if !!$hovered}
		<JsonView json={$hovered} />
	{:else if !!$selected}
		<JsonView json={$selected} />
	{/if}
	<!-- {JSON.stringify(hovered, null, 2)} -->
</p>
