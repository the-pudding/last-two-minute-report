import agate

specified_types = {
    'period': agate.Text(),
    'time': agate.Text(),
    'seconds_left': agate.Number(),
    'call_type': agate.Text(),
    'committing_player': agate.Text(),
    'disadvantaged_player': agate.Text(),
    'review_decision': agate.Text(),
    'comment': agate.Text(),
    'video': agate.Text(),
    'game_id': agate.Text(),
    'play_id': agate.Text(),
    'away': agate.Text(),
    'home': agate.Text(),
    'date': agate.Text(),
    'ref_1': agate.Text(),
    'ref_2': agate.Text(),
    'ref_3': agate.Text(),
    'score_away': agate.Number(),
    'score_home': agate.Number(),
    'original_pdf': agate.Text(),
    'box_score_url': agate.Text(),
    'committing_team': agate.Text(),
    'disadvantaged_team': agate.Text()
}

data = agate.Table.from_csv('../.tmp/concat.csv', column_types=specified_types)

select_columns = ['play_id', 'ref_1', 'ref_2', 'ref_3', 'video', 'box_score_url', 'original_pdf', 'game_id']

ic = data.where(lambda r: r['review_decision'] == 'IC').select(select_columns)

ic.to_csv('incorrect_call.csv')