import debounce from 'lodash.debounce'
import * as $ from './utils/dom'
import isMobile from './utils/is-mobile'
import * as d3 from 'd3'
import graphicLocation from './graphic-location'
import graphicRecent from './graphic-recent'
import graphicTeams from './graphic-teams'
import graphicCalls from './graphic-calls'
import graphicRefs from './graphic-refs'
import graphicPlayers from './graphic-players'
import graphicWhen from './graphic-when'

const DEV_MODE = window.location.hostname.indexOf('localhost') > -1

const bodyEl = $.select('body')
let previousWidth = 0

function addMobileClass() {
	const el = $.select('html')
	if (isMobile.any()) $.addClass(el, 'is-mobile')
}

function handleResize() {
	const width = bodyEl.offsetWidth
	if (previousWidth !== width) {
		// resize here
		previousWidth = width
		graphicPlayers.resize()
		graphicWhen.resize()
	}
}

function loadGameData(cb) {
	d3.csv('assets/data/web_games.csv', (err, data) => {
		if (err) console.error(err)
		cb(data)
	})
}

function init() {
	addMobileClass()
	window.addEventListener('resize', debounce(handleResize, 150))

	// depend on games data
	loadGameData((gameData) => {
		graphicRecent.init(gameData)
	})

	graphicCalls.init()
	graphicPlayers.init()
	graphicWhen.init()
	graphicRefs.init()
	graphicLocation.init()
	graphicTeams.init()
}

init()
