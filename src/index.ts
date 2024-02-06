#!/usr/bin/env bun
import {existsSync} from 'node:fs'
import {cancel, confirm, intro, isCancel, log, outro, text} from '@clack/prompts'
import {faker} from '@faker-js/faker'
import {$, pathToFileURL, spawn, which, write} from 'bun'
import {bgGray, bgYellow, green} from 'kolorist'
import {BIOME, DEPENDENCIES, DEV_DEPENDENCIES, EXTENSIONS, packageJson} from './consts'

intro(bgYellow('Create a new SvelteKit app using Bun.'))
;(async function createProject() {
	const random = `${faker.word.adjective()}-${faker.word.noun()}`

	const projectName = await text({
		message: 'Project name',
		placeholder: random,
		defaultValue: random
	})

	if (isCancel(projectName)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	// Process exists when using `await exists` instead of `existsSync` here? https://github.com/oven-sh/bun/issues/8696
	if (existsSync(projectName)) {
		log.error('A file or directory with the same name exists. Trying a different one.')

		return createProject()
	}

	log.info(
		`Project path: ${pathToFileURL(projectName).href.replace(projectName, green(projectName))}`
	)

	const check = await confirm({
		message: `Use ${bgGray('svelte-check')} for typechecking and Svelte code quality?`
	})

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

	const biome = await confirm({
		message: 'Use Biome linter? (Svelte support is planned)'
	})

	if (isCancel(biome)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	const strict = await confirm({
		message: 'Use strict TypeScript?'
	})

	if (isCancel(strict)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	await $`cp -r ${import.meta.dir}/files ${projectName}`
	await $`mv ${projectName}/_gitignore ${projectName}/.gitignore`

	await write(`${projectName}/package.json`, JSON.stringify(packageJson))

	await write(
		`${projectName}/tsconfig.json`,
		JSON.stringify({
			extends: './.svelte-kit/tsconfig.json',
			compilerOptions: {
				checkJs: true,
				esModuleInterop: true,
				strict
			}
		})
	)

	if (biome) {
		DEV_DEPENDENCIES.push('@biomejs/biome')
		EXTENSIONS.recommendations.push('biomejs.biome')

		Object.assign(packageJson.scripts, {lint: 'biome lint ./src'})

		await write(`${projectName}/biome.json`, JSON.stringify(BIOME))
	}

	await write(`${projectName}/.vscode/extensions.json`, JSON.stringify(EXTENSIONS))

	// const s = spinner()

	// s.start('Installing dependencies with Bun...')

	// const prod = $`cd ${projectName} && bun i ${DEPENDENCIES.join(' ')}`

	const prod = spawn(['bun', 'i', ...DEPENDENCIES], {
		cwd: projectName
	})

	await prod.exited

	// const dev = $`cd ${projectName} && bun i ${DEPENDENCIES.join(' ')} -d`

	const dev = spawn(['bun', 'i', ...DEV_DEPENDENCIES, '-d'], {
		cwd: projectName
	})

	await dev.exited

	// s.stop()

	await $`cd ${projectName} && bun svelte-kit sync`

	outro('🚀 Project created successfully! Thank you for your patience.')

	if (which('code')) {
		const open = await confirm({message: 'Open in VSCode?'})

		if (isCancel(open)) cancel()

		if (open === true) await $`code ${projectName}`
	}
})()
