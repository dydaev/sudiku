<script lang="ts">
	//import {board as boardStore} from "../store/board";
	import Settings from "./store/settings"
	import Board from "./components/Board.svelte";
	import Menu from "./components/Menu.svelte";
	export let name: string;
//	export let data;

	

	let props = Settings.$settings;
	console.log(props)
</script>

<main>
	<Menu />
	<h1 class="h">{name}</h1>
	<Board />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		height: 100%;
		width: 100%;
	}

	.h {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
