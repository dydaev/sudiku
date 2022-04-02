<script lang="ts">
	import dict from "../store/dict";

	export let props;
	export let onChangePage; 

	const i18 = dict();

</script>

<button on:click={() => onChangePage("LevelMenu")}>{i18("new_g", props.lang)}</button>
<button>{i18("score", props.lang)}</button>
