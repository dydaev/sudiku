<script lang="ts">
	import {board as boardStore} from "../store/board";

	import Square from "./Square.svelte";

	import type IField from "../interfaces/IField"

	const { squares } = boardStore
</script>

<div class="su-board">
	{#each squares as square}
		<Square fields={square}/>
	{/each}
</div>

<style>
	.su-board {
		height: 300px;
		width: 300px;
		display: grid;
		grid-template-columns: 33.3% 33.3% 33.3%;
		grid-template-rows: 33.3% 33.3% 33.3%;
		outline: 1px solid darkgray;
	}
</style>
