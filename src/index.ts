#!/usr/bin/env bun
import {existsSync} from 'node:fs'
import {cancel, confirm, intro, isCancel, log, outro, text} from '@clack/prompts'
import {faker} from '@faker-js/faker'
import {$, pathToFileURL, spawn, which, write} from 'bun'
import {bgGray, bgYellow, green} from 'kolorist'
import {BIOME, DEPENDENCIES, DEV_DEPENDENCIES, EXTENSIONS, TSCONFIG, packageJson} from './consts'
import {resolve} from 'node:path'

intro(bgYellow('Create a new SvelteKit app using Bun.'))

interface Options {
	name?: string
	svelteCheck?: boolean
	biome?: boolean
	strictTs?: boolean
}

const api = /*!import.meta.main*/ false
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export async function createProject(opts: Options = {}) {
	const random = `${faker.word.adjective()}-${faker.word.noun()}`

	const argv = process.argv.slice(2)

	const args: Record<string, string> = {}

	for (const [index, arg] of argv.entries()) {
		const value = argv[index + 1]
		if (value) args[arg.replace('--', '')] = value
	}

	const projectName = api
		? opts.name ?? random
		: args.name ??
			(await text({
				message: 'Project name',
				placeholder: random,
				defaultValue: random
			}))

	if (!api && isCancel(projectName)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	if (typeof projectName !== 'string') return

	if (existsSync(projectName)) {
		log.error('A file or directory with the same name exists. Trying a different one.')

		return createProject()
	}

	log.info(
		`Project path: ${pathToFileURL(projectName).href.replace(projectName, green(projectName))}`
	)

	const check = api
		? opts.svelteCheck
		: args.check ||
			(await confirm({
				message: `Use ${bgGray('svelte-check')} for typechecking and Svelte code quality?`
			}))

	if (isCancel(check)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	if (check) {
		DEV_DEPENDENCIES.push('svelte-check')

		Object.assign(packageJson.scripts, {
			check: 'bun --bun svelte-kit sync && svelte-check'
		})
	}

	const biome = api
		? opts.biome
		: args.biome ||
			(await confirm({
				message: 'Use Biome linter? (Svelte support is planned)'
			}))

	if (isCancel(biome)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	const strict = api
		? opts.strictTs
		: args.strict ||
			(await confirm({
				message: 'Use strict TypeScript?'
			}))

	if (isCancel(strict)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	await $`cp -r ${resolve(import.meta.dir, '../files')} ${projectName}`
	await $`mv ${projectName}/_gitignore ${projectName}/.gitignore`

	await write(`${projectName}/package.json`, JSON.stringify(packageJson))

	await write(`${projectName}/tsconfig.json`, TSCONFIG(!!strict))

	if (biome) {
		DEV_DEPENDENCIES.push('@biomejs/biome')
		EXTENSIONS.recommendations.push('biomejs.biome')

		Object.assign(packageJson.scripts, {lint: 'biome lint ./src'})

		await write(`${projectName}/biome.json`, JSON.stringify(BIOME))
	}

	await write(`${projectName}/.vscode/extensions.json`, JSON.stringify(EXTENSIONS))

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

	await $`cd ${projectName} && bun svelte-kit sync`

	outro('🚀 Project created successfully! Thank you for your patience.')

	if (!api && which('code')) {
		const open = await confirm({message: 'Open in VSCode?'})

		if (isCancel(open)) cancel()

		if (open === true) await $`code ${projectName}`
	}
}

if (!api) createProject()
