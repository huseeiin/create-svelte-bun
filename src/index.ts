#!/usr/bin/env bun
import childProcess from 'child_process'
import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	outro,
	spinner,
	text
} from '@clack/prompts'
import {faker} from '@faker-js/faker'
import {existsSync} from 'fs'
import {bgGray, bgYellow, green, bold} from 'kolorist'
import {DEPENDENCIES, DEV_DEPENDENCIES, EXTENSIONS, packageJson} from './consts'
import filenamify from 'filenamify'

intro(bgYellow('Create a new SvelteKit app using Bun.'))
;(async function createProject() {
	const random = await confirm({
		message: 'Use a random project name?',
		initialValue: false
	})

	if (isCancel(random)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	const projectName = random
		? `${faker.word.adjective()}-${faker.word.noun()}`
		: await text({
				message: 'Project name',
				placeholder: 'new-app',
				defaultValue: 'new-app'
		  })

	if (isCancel(projectName)) {
		cancel('Operation cancelled.')

		process.exit(0)
	}

	const normalizedProjectName = filenamify(projectName)
	if (normalizedProjectName !== projectName)
		log.warn(
			`Project name after normalization: ${bold(normalizedProjectName)}`
		)

	// Process exists when using `await exists` instead of `existsSync` here? https://github.com/oven-sh/bun/issues/8696
	if (existsSync(normalizedProjectName)) {
		log.error(
			'A file or directory with the same name exists. Trying a different one.'
		)

		return createProject()
	}

	log.info(
		`Project path: ${Bun.pathToFileURL(normalizedProjectName).href.replace(
			normalizedProjectName,
			green(normalizedProjectName)
		)}`
	)

	const check = await confirm({
		message: `Use ${bgGray(
			'svelte-check'
		)} for typechecking and Svelte code quality?`
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

	await Bun.$`cp -r ${import.meta.dir}/files ${normalizedProjectName}`

	await Bun.write(
		`${normalizedProjectName}/package.json`,
		JSON.stringify(packageJson)
	)

	await Bun.write(
		`${normalizedProjectName}/tsconfig.json`,
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

		await Bun.write(
			`${normalizedProjectName}/biome.json`,
			JSON.stringify({
				$schema: 'https://biomejs.dev/schemas/1.5.2/schema.json',
				linter: {
					ignore: ['build', '.svelte-kit', 'node_modules']
				},
				formatter: {
					enabled: false
				}
			})
		)
	}

	await Bun.write(
		`${normalizedProjectName}/.vscode/extensions.json`,
		JSON.stringify(EXTENSIONS)
	)

	const s = spinner()

	s.start('Installing dependencies with Bun...')

	function exec(cmd: string): Promise<string> {
		return new Promise((resolve, reject) => {
			childProcess.exec(
				cmd,
				{
					cwd:
						typeof normalizedProjectName === 'string'
							? normalizedProjectName
							: undefined
				},
				(error, stdout) => {
					if (error) reject(error)

					resolve(stdout)
				}
			)
		})
	}

	// When using Bun.$ (or Bun.spawn) here it thinks dependencies are git repositories? https://github.com/oven-sh/bun/issues/8699
	await exec(
		`bun i ${DEPENDENCIES.join(' ')} && bun i ${DEV_DEPENDENCIES.join(
			' '
		)} -d`
	)

	s.stop()

	await exec('bun run svelte-kit sync')

	outro('🚀 Project created successfully! Thank you for your patience.')

	// Bun.$ logs stdout without asking it to? https://github.com/oven-sh/bun/issues/8701
	if (!(await Bun.$`which code`).exitCode) {
		const open = await confirm({message: 'Open in VSCode?'})

		if (isCancel(open)) cancel()

		if (open === true)
			Bun.spawn(['code', '.'], {cwd: normalizedProjectName})
	}
})()
