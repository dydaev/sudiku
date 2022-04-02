import App from './App.svelte';

function generateBoard(){
	return new Array(9)
		.fill(0)
		.reduce(acc => [
			...acc,
			Array(9)
			 .fill(0)
			 .map((_, ind) => ({
				 v: ind + 1,
				 x: ind + 1
			 }))
		], [])
}

const app = new App({
	target: document.body,
	props: {
		name: 'sud!ku',
	}
});

export default app;
