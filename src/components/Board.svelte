<script lang="ts">
	import Board from "../store/Board";

	import Square from "./Square.svelte";

	import type IField from "../interfaces/IField";

	export let settings;

	const level = settings.getLevel();
	const showingErr = settings.getSetting("showErrors");

	const boardStore = new Board(level);
	const { squares } = boardStore;

	const handleChangeField = (nSquare, nField, num = 0) => {
		const numField = boardStore.getFieldNumBySquareAndFieldInSquare(nSquare, nField);
		boardStore.setField(numField, {v: num, x: 0})

		const doubleX = boardStore.getIndexesOfNumberInLine("x", numField, num);
		const doubleY = boardStore.getIndexesOfNumberInLine("y", numField, num);
		const doubleSqu = boardStore.getIndexesOfNumberInSquare(numField, num);

		if (doubleX.length > 1 || doubleY.length > 1 || doubleSqu.length > 1) {
			console.log(doubleX, doubleY, doubleSqu)
			console.log(nSquare, nField, numField);
		}
	}
</script>

<div class="su-board">
	{#each squares as square, ind}
		<Square
	  		{ind}
			fields={square} 
	  		onChangeField={handleChangeField}
	  	/>
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
