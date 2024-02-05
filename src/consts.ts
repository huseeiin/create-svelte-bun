export const packageJson = {
	private: true,
	type: 'module',
	scripts: {
		start: 'bun build/index.js',
		build: 'bun --bun vite build',
		dev: 'bun --bun vite'
	},
	prettier: {
		arrowParens: 'avoid',
		bracketSpacing: false,
		semi: false,
		singleQuote: true,
		trailingComma: 'none'
	}
}

export const DEPENDENCIES = [
	'@calle.wester/svelte-adapter-bun',
	'@sveltejs/kit',
	'@sveltejs/vite-plugin-svelte',
	'svelte',
	'vite'
]

export const DEV_DEPENDENCIES = ['typescript', '@types/bun']

export const EXTENSIONS = {
	recommendations: [
		'EditorConfig.EditorConfig',
		'esbenp.prettier-vscode',
		'svelte.svelte-vscode'
	]
}
