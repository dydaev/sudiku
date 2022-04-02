<script lang="ts">
	//import {board as boardStore} from "../store/board";
	import Settings from "./store/settings";

	import Board from "./components/Board.svelte";
	import SettingsPage from "./components/Settings.svelte";
	import MainMenu from "./components/Menu.svelte";
	import LevelMenu from "./components/StartGame.svelte";

	type pagesType = "MainMenu" | "LevelMenu" | "Board";

	export let name: string;

	let props;
	const settings = new Settings();
	settings.settings.subscribe(s => props = s);
	
	let currentLevel = settings.getLevel();
	let currentPage: pagesType = "MainMenu";

	const handleChangePage = (nextPage: pagesType) => {
		currentPage = nextPage;
	}

	const handleBackPage = () => {
		switch (currentPage) {
		case "LevelMenu":
			 handleChangePage("MainMenu");
			break;
		case "Board":
			handleChangePage("LevelMenu");
			break;
		}
	}
</script>

<main>
	{#if currentPage != "MainMenu"}
		<button
	  		class="button-back"
			on:click={handleBackPage}
     		>
			<div class="line"/>
			<div class="line"/>
		</button>
	{/if}

	<SettingsPage {settings} />

	<h1 class="logo">{name}</h1>

	{#if currentPage == "MainMenu"}
		<MainMenu {props} onChangePage={handleChangePage}/>
	{/if}

	{#if currentPage == "LevelMenu"}
		<LevelMenu
	 		{props}
	 		{settings}
	 		params={props}
	 		onChangePage={handleChangePage}
	 	/>
	{/if}

	{#if currentPage == "Board"}
		<Board settings={settings}/>
	{/if}
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

	.button-back {
		z-index: 3;
		position: fixed;
		top: 20px;
		left: 25px;
		height: 40px;
		width: 40px;
		border: none;
		background: initial;
		transform: rotate(45deg);
	}

	.button-back :last-child {
		transform: rotate(-90deg);
		top: 13px;
		left: -6px;
	}

	.logo {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	div.line {
		position: absolute;
		top: 25px;
		height: 1px;
		width: 60%;
		background: gray;
		transition: all .5s ease 0s;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
