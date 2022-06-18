#%%
from sqlalchemy import create_engine
from secrets import DB_URL

engine = create_engine(DB_URL, echo=False)

print(engine.execute("SELECT * FROM lm_game_guesses").fetchone())

# %% Creation

create_teacher_table = """
CREATE TABLE whichone_game_guesses (
  id INT PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  guess INT NOT NULL,
  reason VARCHAR(200) NOT NULL,
  comparison_id INT NOT NULL,
  created_on DATE,
  updated_on DATE
  )
 """
engine.execute(create_teacher_table)
print(engine.execute("SELECT * FROM whichone_game_guesses").fetchall())

# %%
print(engine.execute("SELECT * FROM whichone_game_guesses").fetchall())

# %%
