export const packageJson = {
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
	recommendations: ['EditorConfig.EditorConfig', 'esbenp.prettier-vscode', 'svelte.svelte-vscode']
}

export const BIOME = {
	$schema: 'https://biomejs.dev/schemas/1.5.2/schema.json',
	linter: {
		ignore: ['build', '.svelte-kit', 'node_modules'],
		rules: {
			all: true
		}
	},
	formatter: {
		enabled: false
	}
}

// biome-ignore lint/style/useNamingConvention: <explanation>
export function TSCONFIG(strict: boolean) {
	return JSON.stringify({
		extends: './.svelte-kit/tsconfig.json',
		compilerOptions: {
			checkJs: true,
			esModuleInterop: true,
			skipLibCheck: true,
			strict
		}
	})
}

const argv = process.argv.slice(2)

export const args: {[key: string]: string | boolean | undefined} = {}

for (const [index, arg] of argv.entries()) {
	const value = argv[index + 1]
	if (arg.startsWith('-')) args[arg.replaceAll('-', '')] = value ? value : true
}
