<script lang="ts">
	import type IField from "..interfaces/IField";
	import  Field from "./Field.svelte"; 

	export let fields: [IField]
</script>

<div class="su-square">
	{#each fields as field}
		<Field value={field}/>
	{/each}

</div>

<style>
	.su-square {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		outline: 1px solid darkgray;
		height: 100%;
		width: 100%;
	}
</style>
