import { loadFontGroup } from './utils/load-font';

const publico = [
	{ family: 'Publico Text Web', weight: 400 },
	{ family: 'Publico Text Web', weight: 700 },
];

const atlas = [
	{ family: 'Atlas Grotesk Web', weight: 300 },
	{ family: 'Atlas Grotesk Web', weight: 400 },
	{ family: 'Atlas Grotesk Web', weight: 500 },
];

loadFontGroup(publico);
loadFontGroup(atlas);
