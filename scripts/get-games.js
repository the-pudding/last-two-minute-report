/*
download pdf links from the site and convert to text files
*/

const cwd = process.cwd()

const fs = require('fs')
const shell = require('shelljs')
const cheerio = require('cheerio')

// scrape archive and get links to each game's pdf
function scrapeGameLinks(maxGames) {
	const $ = cheerio.load(fs.readFileSync(`${cwd}/processing/archive.html`))
	const urls = []
	let added = 0
	$('.entry-content p a').each((i, el) => {
		const url = $(el).attr('href').trim()
		const valid = url.startsWith('http://official.nba.com/') && url.endsWith('.pdf')
		if (valid && added < maxGames) {
			added += 1
			urls.push(url)
		}
	})
	return urls
}

function savePDFs(urls, cb) {
	let i = 0
	const next = () => {
		console.log(urls[i])
		const command = `cd processing/pdf; curl -O ${urls[i]}`
		shell.exec(command, { silent: true }, () => {
			i += 1
			if (i < urls.length) next()
			else cb()
		})
	}
	next()
}


function convertToText() {
	const command = 'cd processing/pdf; for file in *.pdf; do pdftotext -layout -nopgbrk "$file" "../text/$file.txt"; done'
	shell.exec(command, { silent: true })
}

function convertToHTML() {
	const command = 'cd processing/pdf; for file in *.pdf; do pdftohtml -s -i -nomerge -noframes "$file" "../html/$file.html"; done'
	shell.exec(command, { silent: true })
}

function removePDFs() {
	const command = 'rm processing/pdf/*.pdf'
	shell.exec(command, { silent: true })
}

function init() {
	const command = 'curl -o processing/archive.html http://official.nba.com/nba-last-two-minute-reports-archive/'
	shell.exec(command, { silent: true })

	let maxGames = 99999
	if (process.argv.length > 2 && !isNaN(+process.argv[2])) maxGames = +process.argv[2]

	const urls = scrapeGameLinks(maxGames)
	savePDFs(urls, () => {
		console.log('Converting PDFs...')
		convertToText()
		convertToHTML()
		removePDFs()
	})
}

init()
