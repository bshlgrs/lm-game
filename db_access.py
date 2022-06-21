#%%
from sqlalchemy import create_engine
from secrets import DB_URL

engine = create_engine(DB_URL, echo=False)

print(engine.execute("SELECT * FROM lm_game_guesses").fetchone())

# %% Creation for the whichone game

# DANGER # engine.execute("DROP TABLE whichone_game_guesses")

# create_whichone_table = """
# CREATE TABLE whichone_game_guesses (
#   id SERIAL PRIMARY KEY,
#   username VARCHAR(40) NOT NULL,
#   guess INT NOT NULL,
#   reason VARCHAR(200) NOT NULL,
#   comparison_id INT NOT NULL,
#   created_on DATE,
#   updated_on DATE
#   )
#  """
# engine.execute(create_whichone_table)
# print(engine.execute("SELECT * FROM whichone_game_guesses").fetchall())

# %% creation fo the whichonescored game
create_whichonescored_table = """
CREATE TABLE whichonescored_game_guesses (
  id SERIAL PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  guess FLOAT NOT NULL,
  comparison_id INT NOT NULL,
  created_on DATE,
  updated_on DATE
  )
 """
engine.execute(create_whichonescored_table)
print(engine.execute("SELECT * FROM whichonescored_game_guesses").fetchall())

# %%
print(engine.execute("SELECT * FROM whichone_game_guesses").fetchall())

# %%
request = "SELECT id, username, guess, correct_answer, guessed_token_idx, doc_id FROM lm_game_guesses"
data = engine.execute(request).fetchall()
# %%
import json


def load_doc(idx):
    d = json.load(open(f"docs/doc{idx}.json"))
    return "".join(d)


import pandas as pd

df = pd.DataFrame(
    data={
        "id": [x[0] for x in data],
        "username": [x[1] for x in data],
        "guess": [x[2] for x in data],
        "correct_answer": [x[3] for x in data],
        "guessed_token_idx": [x[4] for x in data],
        "doc_id": [x[5] for x in data],
        "docstr": [load_doc(x[5]) for x in data],
    }
)
# %%
