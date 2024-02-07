import {sveltekit} from '@sveltejs/kit/vite'
import type {UserConfig} from 'vite'

export default {
	plugins: [sveltekit()],
	build: {target: 'modules', reportCompressedSize: false}
} satisfies UserConfig
