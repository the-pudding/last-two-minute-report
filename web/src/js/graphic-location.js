import * as d3 from 'd3'
import './utils/find-polyfill'

const graphic = d3.select('.graphic__location')

function cleanData(row) {
	return {
		...row,
		value: +row.value,
	}
}

function createBars(data) {
	const total = d3.sum(data, d => d.value)
	const home = data.find(d => d.key === 'num_home_advantage').value
	const away = data.find(d => d.key === 'num_away_advantage').value
	const homePercent = `${(home / total) * 100}%`
	const awayPercent = `${(away / total) * 100}%`

	graphic.select('.bar__home')
		.style('width', homePercent)

	graphic.select('.bar__away')
		.style('width', awayPercent)

	graphic.select('.text__home')
		.text(`Home: ${home}`)

	graphic.select('.text__away')
		.text(`Away: ${away}`)
}

function init() {
	d3.csv('assets/data/web_location.csv', cleanData, (err,  data) => {
		createBars(data)
	})
}

export default { init }
