// import loadCSS from './utils/load-css'
import { loadFont } from './utils/load-font'

// comment out fonts you wont be using
const ptSerif = [
	{
		family: 'PT Serif',
		weight: 400,
	},
	{
		family: 'PT Serif',
		weight: 700,
	},
]

const roboto = [
	{
		family: 'Roboto',
		weight: 300,
	},
	{
		family: 'Roboto',
		weight: 400,
	},
	{
		family: 'Roboto',
		weight: 500,
	},
	{
		family: 'Roboto',
		weight: 700,
	},
]

ptSerif.forEach(loadFont)
roboto.forEach(loadFont)
