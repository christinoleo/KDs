<script lang="ts">
	import { goto } from '$app/navigation';
	import { mainCypher } from '$lib/store';

	export let cypher: string;

	async function onsubmit() {
		$mainCypher = cypher;
	}
</script>

<form class="w-[40rem] flex gap-3" on:submit|preventDefault={onsubmit}>
	<textarea
		name="query"
		placeholder="Query"
		class="textarea w-full rounded-md"
		bind:value={cypher}
	/>
	<button class="btn btn-primary self-center">Send Query</button>
</form>
