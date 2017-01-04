/*
download pdf links from the site and convert to text files
*/

const fs = require('fs')
const shell = require('shelljs')
const cheerio = require('cheerio')

const cwd = process.cwd()

// scrape archive and get links to each game's pdf
function scrapeGameLinks(maxGames) {
	const $ = cheerio.load(fs.readFileSync(`${cwd}/archive.html`))
	const urls = []
	$('.entry-content p a').each((i, el) => {
		const url = $(el).attr('href').trim()
		const valid = url.startsWith('http://official.nba.com/') && url.endsWith('.pdf')
		if (valid && i < maxGames) urls.push(url)
	})
	return urls
}

function savePDFs(urls, cb) {
	let i = 0
	const next = () => {
		console.log(urls[i])
		const command = `cd pdf; curl -O ${urls[i]}`
		shell.exec(command, { silent: true }, () => {
			i += 1
			if (i < urls.length) next()
			else cb()
		})
	}
	next()
}


function convertToText() {
	const command = 'cd pdf; for file in *.pdf; do pdftotext -layout -nopgbrk "$file" "../text/$file.txt"; done'
	shell.exec(command)
}

function convertToHTML() {
	const command = 'cd pdf; for file in *.pdf; do pdftohtml -s -i -nomerge -noframes "$file" "../html/$file.html"; done'
	shell.exec(command)
}

function removePDFs() {
	const command = 'rm pdf/*.pdf'
	shell.exec(command)
}

function init() {
	const command = 'curl -o archive.html http://official.nba.com/nba-last-two-minute-reports-archive/'
	shell.exec(command, { silent: true })

	let maxGames = 99999
	if (process.argv.length > 2 && !isNaN(+process.argv[2])) maxGames = +process.argv[2]

	const urls = scrapeGameLinks(maxGames)
	savePDFs(urls, () => {
		convertToText()
		convertToHTML()
		removePDFs()
	})
}

init()
