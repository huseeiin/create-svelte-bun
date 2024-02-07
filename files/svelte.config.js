import adapter from '@calle.wester/svelte-adapter-bun'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'

/**
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	kit: {
		adapter: adapter({
			precompress: {gzip: true}
		})
	},
	preprocess: vitePreprocess()
}

export default config
