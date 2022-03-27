<script lang="ts">
	import type IField from "interfaces/IField";
	export let value: IField = {
		v: 0,
		x: 0
	}

	const handleChangeInput = (e: any) => {
		
		const key = e.key

		if (key*1 >=1 && key*1 < 10) {
			value = {
				...value,
				v: key*1
			}
		} else {
			value = {
				...value,
				v: ""
			}
		}
	}
</script>

<div class="su-field">
	<input
	 on:keydown|preventDefault={handleChangeInput}
	 on:input|preventDefault
	 maxlength="1"
	 min="1"
  	 max="9"
  	 size="1"
    	type="number"
	disabled={value.x || false}
  	 value={value.v || ""}
  	>
</div>

<style>
	.su-field {
		height: 100%;
		width: 100%;
		outline: 1px solid aliceblue;
	}
	input {
		box-sizing: content-box;
		padding: 0;
		margin: 0;
		-webkit-appearance: textfield;
		text-align: center;
		border: none;
		height: 100%;
		width: 100%;
		outline: none;
	}
	input[type="number"]:disabled{
		color: darkslategray;
	}
</style>
