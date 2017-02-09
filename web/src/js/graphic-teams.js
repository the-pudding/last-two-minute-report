import * as d3 from 'd3'
import teamLookup from './team-lookup'

const graphic = d3.select('.graphic__teams')
const chart = graphic.select('.graphic__chart')

function cleanData(row) {
	return {
		...row,
	}
}

// function loadGames(cb) {
// 	d3.csv('assets/data/web_games.csv', cleanData, (err,  data) => {
// 		cb(null, data)
// 	})
// }

function init() {
	console.log(teamLookup)
	// const q = d3.queue()
	// q
	// 	.defer(loadGames)
	// 	.awaitAll(createChart)
}

export default { init }
