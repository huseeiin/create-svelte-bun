#!/usr/bin/env bun
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {cancel, confirm, intro, isCancel, log, outro, text} from '@clack/prompts'
import {faker} from '@faker-js/faker'
import {$, pathToFileURL, spawn, which} from 'bun'
import consola from 'consola'
import {bgGray, bgYellow, bold, green} from 'kolorist'
import {
	BIOME,
	DEPENDENCIES,
	DEV_DEPENDENCIES,
	EXTENSIONS,
	TSCONFIG,
	args,
	packageJson
} from './consts'

interface Options {
	name?: string
	svelteCheck?: boolean
	biome?: boolean
	strictTs?: boolean
}

const api = /*!import.meta.main*/ false

;(api ? consola.box : intro)(bgYellow('Create a new SvelteKit app using Bun.'))

/**
 * Create a new SvelteKit app using Bun.
 * @param opts Project name (default is random/pretty name (ex: `closed-cop`)), enable `svelte-check`, biome or strict TS.
 * @example
 * ```js
 * await createProject({ strictTs: true, svelteCheck: false, biome: false })
 * ```
 */

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export async function createProject(opts: Options = {}) {
	const random = `${faker.word.adjective()}-${faker.word.noun()}`

	const projectName = args?.Y
		? random
		: api
			? opts.name || random
			: await text({
					message: 'Project name',
					placeholder: random,
					defaultValue: random
				})

	if (isCancel(projectName)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	if (existsSync(projectName)) {
		if (api) consola.error('A file or directory with the same name exists.')

		log.error('A file or directory with the same name exists. Trying a different one.')

		args.name = undefined

		return createProject()
	}

	;(api ? consola.info : log.info)(
		`Project path: ${green(bold(pathToFileURL(projectName).href))}`
	)

	const y = args.y || args?.Y

	let check: boolean | symbol = !!y || !!opts.svelteCheck || !!args.check

	if (!(check || api))
		check = await confirm({
			message: `Use ${bgGray('svelte-check')} for typechecking and Svelte code quality?`
		})

	if (isCancel(check)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	if (check) {
		DEV_DEPENDENCIES.push('svelte-check')

		Object.assign(packageJson.scripts, {
			check: 'bun postinstall && svelte-check'
		})
	}

	let biome: boolean | symbol = !!y || !!opts.biome || !!args.biome

	if (!(biome || api))
		biome = await confirm({
			message: 'Use Biome linter? (Svelte support is planned)'
		})

	if (isCancel(biome)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	let strict: boolean | symbol = !!y || !!opts.strictTs || !!args.strict

	if (!(strict || api))
		strict = await confirm({
			message: 'Use strict TypeScript?'
		})

	if (isCancel(strict)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	function write(fileName: string, content: string) {
		if (typeof projectName === 'string') return Bun.write(`${projectName}/${fileName}`, content)
		return
	}

	await $`cp -r ${resolve(import.meta.dir, '../files')} ${projectName}`
	await $`mv ${projectName}/_gitignore ${projectName}/.gitignore`

	await write('package.json', JSON.stringify(packageJson))

	await write('tsconfig.json', TSCONFIG(!!strict))

	if (biome) {
		DEV_DEPENDENCIES.push('@biomejs/biome')
		EXTENSIONS.recommendations.push('biomejs.biome')

		Object.assign(packageJson.scripts, {lint: 'biome lint ./src'})

		await write('biome.json', JSON.stringify(BIOME))
	}

	await write('.vscode/extensions.json', JSON.stringify(EXTENSIONS))

	// const s = spinner()

	// s.start('Installing dependencies with Bun...')

	// await $`cd ${projectName} && bun i ${DEPENDENCIES.join(' ')}`

	const prod = spawn(['bun', 'i', ...DEPENDENCIES], {
		cwd: projectName
	})

	await prod.exited

	// await $`cd ${projectName} && bun i ${DEPENDENCIES.join(' ')} -d`

	const dev = spawn(['bun', 'i', ...DEV_DEPENDENCIES, '-d'], {
		cwd: projectName
	})

	await dev.exited

	// s.stop()
	;(api ? consola.info : outro)('🚀 Project created successfully! Thank you for your patience.')

	if (!api && which('code')) {
		const open = await confirm({message: 'Open in VSCode?'})

		if (isCancel(open)) cancel()

		if (open === true) await $`code ${projectName}`
	}
}

if (!api) createProject()
