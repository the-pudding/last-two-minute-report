setup:
	mkdir processing
	cd processing; mkdir pdf text boxscore html csv output

concat:
	csvstack processing/csv/* > output/all_games.csv