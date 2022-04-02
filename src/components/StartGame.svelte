<script lang="ts">

	import dict from "../store/dict";

	export let params;
	export let settings;
	export let onChangePage;

	const levels = settings.getLevels();
	
	const i18 = dict();

	const handleStartGame = (level: number) => {
	console.log(level)
		settings.setSetting("level", level);
		onChangePage("Board");
	}
</script>

<div>
	{#each levels as level}
		<button	on:click={() => handleStartGame(level)}>
		{i18(level, params.lang)}
		</button>
	{/each}
</div>


