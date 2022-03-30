<script>
	import Settings from "../store/settings";
	import dict from "../store/dict";

	const settings = new Settings();
	const langs = settings.getLangs();
	const levels = settings.getLevels();

	let params
	settings.settings.subscribe(s => params = s);

	let showMenu = false;
	const onToggleMenu = () => {showMenu = !showMenu};

	const onChangeLang = (langIndex) => {
		settings.setSetting("lang", langIndex);
	}

	const onChangeLevel = (e) => {
		const newLevel = e.target.value
		
		settings.setSetting("level", newLevel)
	}
	const i18 = dict();
</script>

<button class="menu-button {showMenu ? "active" : ""}" on:click={onToggleMenu}>
	<div class="line"/>
	<div class="line"/>
	<div class="line"/>
</button>

<nav style="right: {showMenu ? "0" : "-100%"}">
	<ul>
		<li class="menu__fields">
			<button> {"<"} </button>
			<button> {">"} </button>
		</li>
		<li class="menu__fields"><div class="line"/></li>
		<li class="menu__fields">{i18("lev", params.lang)}: <select on:change={onChangeLevel}>
			{#each levels as level}
				<option value={level} selected={params.level == level ? true : false}>{i18(level, params.lang)}</option>
			{/each}
			</select></li>
		<li class="menu__fields">
			<ul class="menu__fields field-lang">
			{#each langs as lang, ind}
				<li><a on:click={()=>onChangeLang(ind)} class="{params.lang == ind ? "active" : ""}">{lang}</a></li>
			{/each}
			</ul>
		</li>
	</ul>
</nav>

<style>
	.field-lang {
		display: flex;
	}
	.field-lang li:not(:last-child) {
		padding-right: 5px;
	}
	a {
		font-size: 20px;
		text-decoration: none;
		color: darkslategray;
		cursor: pointer;
		transition: all .3s ease 0s;
	}
	a.active {
		text-decoration: underline;
		color: black;
	}
	nav {
		position: fixed;
		z-index: 2;
		display: flex;
		top: 0;
		padding-top: 70px;
		height: 100%;
		width: 220px;
		transition: right .5s ease 0s;
		background: white;
	}
	ul {
		list-style-type: none;
	}
	li {
		text-align: left;	
	}
	.menu-button {
		z-index: 3;
		position: fixed;
		top: 15px;
		right: 25px;
		height: 40px;
		width: 40px;
		border: none;
		background: initial;
	}

	button.active div:last-child{
		top: auto;
		transform: rotate(-45deg);

	}
	button.active div:nth-child(2){
		width: 0;

	}
	button.active div:first-child{
		bottom: auto;
		transform: rotate(45deg);

	}
	.menu-button div:last-child{
		top: 5px;
	}
	.menu-button div:first-child{
		bottom: 5px;
	}
	div.line {
		position: absolute;
		height: 1px;
		width: 100%;
		background: gray;
		transition: all .5s ease 0s;
	}

</style>
