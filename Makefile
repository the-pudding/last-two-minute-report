setup:
	mkdir processing
	cd processing; mkdir pdf text boxscore html csv output

concat: 
	csvstack processing/csv/* > output/all_games.csv;

latest:
	npm run get-games 10;
	npm run parse-games;
	csvstack processing/csv/* > output/all_games.csv;
	git add output/all_games.csv;
	git commit -m 'update with latest data';
	git push;