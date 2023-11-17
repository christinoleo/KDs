<script lang="ts">
	import type { NodeI } from '$lib/model';
	import { onMount, getContext } from 'svelte';

	export let node: NodeI;

	const { getCyInstance } = getContext('graphSharedState');
	const cyInstance = getCyInstance();

	cyInstance.add({
		group: 'nodes',
		id: node.id,
		data: { ...node }
	});
</script>
