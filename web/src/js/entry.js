import debounce from 'lodash.debounce'
import * as $ from './utils/dom'
import isMobile from './utils/is-mobile'
import graphicLocation from './graphic-location'
import graphicRecent from './graphic-recent'
import graphicGames from './graphic-games'
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
	}
}

function init() {
	addMobileClass()
	window.addEventListener('resize', debounce(handleResize, 150))
	graphicLocation.init()
	graphicRecent.init()
	graphicGames.init()
	graphicTeams.init()
	graphicCalls.init()
	graphicRefs.init()
	graphicPlayers.init()
	graphicWhen.init()
}

init()
