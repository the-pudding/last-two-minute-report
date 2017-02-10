
# coding: utf-8

# In[1]:

import agate
import math

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
    'committing_team': agate.Text(),
    'disadvantaged_team': agate.Text(),
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
    'ref_made_call': agate.Text()
}

data = agate.Table.from_csv('../output/all_games.csv', column_types=specified_types)
incorrect = data.where(lambda r: r['review_decision'] in ['IC', 'INC'])
ic = incorrect.where(lambda r: r['review_decision'] == 'IC')
inc = incorrect.where(lambda r: r['review_decision'] == 'INC')


# In[2]:

# game data and play data
game_include = ['game_id', 'away', 'home', 'date', 'ref_1', 'ref_2', 'ref_3', 'score_away', 'score_home', 'original_pdf','box_score_url']

by_game = incorrect.group_by('game_id')

by_game_with_count = by_game.aggregate([
    ('incorrect', agate.Count())
])

game_data = data.select(game_include).distinct()

# merge
game_data_merged = game_data.join(by_game_with_count, 'game_id','game_id')
game_data_merged.to_csv('output/web_games.csv')


# In[3]:

play_include = ['game_id', 'period', 'time', 'seconds_left', 'call_type', 'committing_player', 'disadvantaged_player','review_decision', 'comment', 'video', 'committing_team', 'disadvantaged_team' ,'play_id', 'ref_made_call']
play_data = data.select(play_include)
play_data.to_csv('output/web_plays.csv')


# In[4]:

# basic stats
by_game = data.group_by('game_id')

game_count = by_game.aggregate([
    ('count', agate.Count())
])

num_games = len(game_count.rows)
num_calls = len(data.rows)
num_calls_incorrect = len(incorrect.rows)
percent_incorrect = float(num_calls_incorrect) / float(num_calls) * 100.0
num_calls_incorrect_per_game = float(num_calls_incorrect) / float(num_games)


# In[5]:

# calls incorrect per minute played
data_with_quarter = data.compute([
    ('quarter', agate.Formula(agate.Number(), lambda r: int(r['period'].replace('Q', '')))),
    ('quarter_id', agate.Formula(agate.Text(), lambda r: r['game_id'] + '-' + r['period']))
])

# find total minutes played
unique_quarters = data_with_quarter.distinct('quarter_id').select(['quarter'])

def getMinutes(row):
    if(row['quarter'] == 4):
        return 2
    return 5
    
quarter_minutes = unique_quarters.compute([
    ('minutes_played', agate.Formula(agate.Number(), getMinutes))
])

minutes_played = int(quarter_minutes.aggregate(agate.Sum('minutes_played')))
num_calls_incorrect_per_minute = float(num_calls_incorrect) / float(minutes_played)


# In[6]:

# export summary data

summary_column_names = ['key', 'value']
summary_column_types = [agate.Text(), agate.Text()]

summary_rows = [
    ('num_games', format(num_games, ',d')),
    ('num_calls', format(num_calls, ',d')),
    ('num_calls_incorrect', format(num_calls_incorrect, ',d')),
    ('minutes_played', format(minutes_played, ',d')),
    ('percent_incorrect', format(percent_incorrect, '.1f')),
    ('num_calls_incorrect_per_game', format(num_calls_incorrect_per_game, '.2f')),
    ('num_calls_incorrect_per_minute', format(num_calls_incorrect_per_minute, '.2f')),
]

summary_table = agate.Table(summary_rows, summary_column_names, summary_column_types)
summary_table.to_csv('output/web_summary.csv')


# In[7]:

# home / away
def hasLocationAdvantage(row, location):
    d = row['disadvantaged_team']
    c = row['committing_team']
    r = row['review_decision']
    l = row[location]
    if (c == l and r == 'INC'):
        return True
    elif (d == l and r == 'IC'):
        return True
    return False
    
home_advantage = incorrect.where(lambda r: hasLocationAdvantage(r, 'home'))
away_advantage = incorrect.where(lambda r: hasLocationAdvantage(r, 'away'))

num_home_advantage = len(home_advantage.rows)
num_away_advantage = len(away_advantage.rows)

location_column_names = ['key', 'value']
location_column_types = [agate.Text(), agate.Text()]
location_rows = [
    ('num_home_advantage', num_home_advantage),
    ('num_away_advantage', num_away_advantage),
]
location_table = agate.Table(location_rows, location_column_names, location_column_types)
location_table.to_csv('output/web_location.csv')


# In[8]:

#latest games
sorted_date = data.order_by('date', reverse=True)
last_date = sorted_date.rows[0]['date']
recent_games = data.where(lambda r: r['date'] == last_date)
exclude_recent = ['away', 'box_score_url', 'date', 'home', 'original_pdf', 'ref_1', 'ref_2', 'ref_3', 'score_away', 'score_home']
recent_games.exclude(exclude_recent).to_csv('output/web_recent.csv')


# In[9]:

# decision breakdown
by_decision = data.group_by('review_decision')

decision_totals = by_decision.aggregate([
    ('count', agate.Count())
]).where(lambda r: r['review_decision'] is not None)

# decision_totals.order_by('count', reverse=True).print_table()

decision_totals.to_csv('output/web_decision.csv')


# In[10]:

# call type breakdown
# by_call = incorrect.group_by('call_type')

# call_totals = by_call.aggregate([
#     ('count', agate.Count())
# ])

# call_totals.order_by('count', reverse=True).print_table(max_column_width=100,max_rows=100)

# inc
by_call_inc = inc.group_by('call_type')

call_totals_inc = by_call_inc.aggregate([
    ('count_inc', agate.Count())
])

# call_totals_inc.order_by('count_inc', reverse=True).print_table(max_column_width=100,max_rows=10)

# ic
by_call_ic = ic.group_by('call_type')

call_totals_ic = by_call_ic.aggregate([
    ('count_ic', agate.Count())
])

# call_totals_ic.order_by('count_ic', reverse=True).print_table(max_column_width=100,max_rows=5)

call_totals_merged = call_totals_inc.join(call_totals_ic, 'call_type','call_type')

def addCallTypes(row):
    count_ic = 0 if row['count_ic'] is None else row['count_ic']
    count_inc = 0 if row['count_inc'] is None else row['count_inc']
    return count_ic + count_inc
    
call_totals_all = call_totals_merged.compute([
    ('count', agate.Formula(agate.Number(), addCallTypes))
]).order_by('count', reverse=True)

call_totals_all.to_csv('output/web_call_types.csv')


# In[11]:

# when wrong calls happen (in last 2 minutes)
in_last_two = incorrect.where(lambda r: float(r['seconds_left']) < 120)

with_bin = in_last_two.compute([
    ('seconds_left_bin', agate.Formula(agate.Number(), lambda r: math.floor(float(r['seconds_left']) / 10) ))
])

by_bin = with_bin.group_by('seconds_left_bin')


counts_bin = by_bin.aggregate([
    ('count', agate.Count())
]).order_by('seconds_left_bin')


# counts_bin.line_chart('seconds_left_bin', 'count')

counts_bin.to_csv('output/web_when.csv')


# In[12]:

# worst ref
ref_dict = {}

def update_ref_dict(str):
    names = str.split(',')
    for name in names:
        ref_dict.setdefault(name, 0)
        ref_dict[name] += 1

by_ref = data.where(lambda r: r['ref_made_call'] is not None)

for row in by_ref.rows:
    update_ref_dict(row['ref_made_call'])

ref_table = agate.Table(ref_dict.items(),column_names=['name', 'count']).order_by('name').order_by('count', reverse=True)

# ref_table.print_table(max_rows=100)

# ref_count.order_by('count', reverse=True).print_table(max_column_width=100,max_rows=100)

ref_table.to_csv('output/web_ref.csv')


# In[14]:

# star treatment

# got away with calls (INC + committing)
by_player_for_inc = inc.where(lambda r: r['committing_player'] is not None).group_by('committing_player')
count_player_for1 = by_player_for_inc.aggregate([
    ('count_inc', agate.Count())
])

# or got calls (IC + disadvantaged)
by_player_for_ic = ic.where(lambda r: r['disadvantaged_player'] is not None).group_by('disadvantaged_player')
count_player_for2 = by_player_for_ic.aggregate([
    ('count_ic', agate.Count())
])

# count_player_for1.order_by('count_inc', reverse=True).print_table()
# count_player_for2.order_by('count_ic', reverse=True).print_table()

count_player_for_joined = count_player_for1.join(count_player_for2, 'committing_player', 'disadvantaged_player')

count_player_for_renamed = count_player_for_joined.rename(column_names=['player', 'count_for_inc', 'count_for_ic'])

def addCountFor(row):
    count_ic = 0 if row['count_for_ic'] is None else row['count_for_ic']
    count_inc = 0 if row['count_for_inc'] is None else row['count_for_inc']
    return count_ic + count_inc

count_player_for = count_player_for_renamed.compute([
    ('count_for', agate.Formula(agate.Number(), addCountFor))
])

# count_player_for.order_by('count_for', reverse=True).print_table()


# In[13]:

#anti-star treatment
# did not get call they shouldve (INC + disadvantaged)
by_player_against_inc = inc.where(lambda r: r['disadvantaged_player'] is not None).group_by('disadvantaged_player')
count_player_against1 = by_player_against_inc.aggregate([
    ('count_inc', agate.Count())
])

# called wrongly (IC + committing)
by_player_against_ic = ic.where(lambda r: r['committing_player'] is not None).group_by('committing_player')
count_player_against2 = by_player_against_ic.aggregate([
    ('count_ic', agate.Count())
])

# count_player_against1.order_by('count_inc', reverse=True).print_table()
# count_player_against2.order_by('count_ic', reverse=True).print_table()

count_player_against_joined = count_player_against1.join(count_player_against2, 'disadvantaged_player', 'committing_player')

count_player_against_renamed = count_player_against_joined.rename(column_names=['player', 'count_against_inc', 'count_against_ic'])

def addCountAgainst(row):
    count_ic = 0 if row['count_against_ic'] is None else row['count_against_ic']
    count_inc = 0 if row['count_against_inc'] is None else row['count_against_inc']
    return count_ic + count_inc

count_player_against = count_player_against_renamed.compute([
    ('count_against', agate.Formula(agate.Number(), addCountAgainst))
])

# count_player_against.order_by('count_against', reverse=True).print_table()


# In[15]:

# join star tables
count_player = count_player_for.join(count_player_against, 'player', 'player')

def addPlayerNet(row):
    count_for = 0 if row['count_for'] is None else row['count_for']
    count_against = 0 if row['count_against'] is None else row['count_against']
    return count_for - count_against

count_player_with_net = count_player.compute([
    ('net', agate.Formula(agate.Number(), addPlayerNet))
]).order_by('net', reverse=True)


count_player_with_net.to_csv('output/web_player.csv')


# In[18]:

# teams
# got away with calls (INC + committing)
by_team_for_inc = inc.where(lambda r: r['committing_team'] is not None).group_by('committing_team')
count_team_for1 = by_team_for_inc.aggregate([
    ('count_inc', agate.Count())
])

# or got calls (IC + disadvantaged)
by_team_for_ic = ic.where(lambda r: r['disadvantaged_team'] is not None).group_by('disadvantaged_team')
count_team_for2 = by_team_for_ic.aggregate([
    ('count_ic', agate.Count())
])

# count_team_for1.order_by('count_inc', reverse=True).print_table()
# count_team_for2.order_by('count_ic', reverse=True).print_table()

count_team_for_joined = count_team_for1.join(count_team_for2, 'committing_team', 'disadvantaged_team')

count_team_for_renamed = count_team_for_joined.rename(column_names=['team', 'count_for_inc', 'count_for_ic'])

def addCountFor(row):
    count_ic = 0 if row['count_for_ic'] is None else row['count_for_ic']
    count_inc = 0 if row['count_for_inc'] is None else row['count_for_inc']
    return count_ic + count_inc

count_team_for = count_team_for_renamed.compute([
    ('count_for', agate.Formula(agate.Number(), addCountFor))
])

# count_team_for.order_by('count_for', reverse=True).print_table(max_rows=100)


# In[19]:

# anti - team
# did not get call they shouldve (INC + disadvantaged)
by_team_against_inc = inc.where(lambda r: r['disadvantaged_team'] is not None).group_by('disadvantaged_team')
count_team_against1 = by_team_against_inc.aggregate([
    ('count_inc', agate.Count())
])

# called wrongly (IC + committing)
by_team_against_ic = ic.where(lambda r: r['committing_team'] is not None).group_by('committing_team')
count_team_against2 = by_team_against_ic.aggregate([
    ('count_ic', agate.Count())
])

# count_team_against1.order_by('count_inc', reverse=True).print_table()
# count_team_against2.order_by('count_ic', reverse=True).print_table()

count_team_against_joined = count_team_against1.join(count_team_against2, 'disadvantaged_team', 'committing_team')

count_team_against_renamed = count_team_against_joined.rename(column_names=['team', 'count_against_inc', 'count_against_ic'])

def addCountAgainst(row):
    count_ic = 0 if row['count_against_ic'] is None else row['count_against_ic']
    count_inc = 0 if row['count_against_inc'] is None else row['count_against_inc']
    return count_ic + count_inc

count_team_against = count_team_against_renamed.compute([
    ('count_against', agate.Formula(agate.Number(), addCountAgainst))
])

# count_team_against.order_by('count_against', reverse=True).print_table(max_rows=100)


# In[20]:

# join teams
count_team = count_team_for.join(count_team_against, 'team', 'team')

def addTeamNet(row):
    count_for = 0 if row['count_for'] is None else row['count_for']
    count_against = 0 if row['count_against'] is None else row['count_against']
    return count_for - count_against

count_team_with_net = count_team.compute([
    ('net', agate.Formula(agate.Number(), addTeamNet))
]).order_by('net', reverse=True)


count_team_with_net.to_csv('output/web_team.csv')


# In[ ]:



