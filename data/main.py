import pandas as pd
import numpy as np

# Assuming you've read your CSV file into a DataFrame named 'df'
df = pd.read_csv('filtered_spotify.csv')

# Convert 'rank' to numeric for proper filtering
df['rank'] = pd.to_numeric(df['rank'], errors='coerce')

# Drop duplicates based on the 'rank', 'country', and 'week' attributes
df_no_duplicates = df.drop_duplicates(subset=['rank', 'country', 'week'])

# Define a list of genres to check
desired_genres = ['pop', 'trap', 'reggaeton', 'rock', 'latin', 'hip hop', 'rap', 'r&b']

# Loop through desired genres and update 'artist_genre' accordingly
for genre in desired_genres:
    genre_mask = df_no_duplicates['artist_genre'].str.contains(genre, case=False, na=False)
    df_no_duplicates.loc[genre_mask, 'artist_genre'] = genre

# Update genres not in the desired list to 'other'
df_no_duplicates.loc[~df_no_duplicates['artist_genre'].isin(desired_genres), 'artist_genre'] = 'other'

# Now df_no_duplicates has the updated 'artist_genre' column
df_top_20 = df_no_duplicates[df_no_duplicates['rank'] <= 20]

# Save to CSV without including the index column
df_top_20.to_csv('data.csv', index=False)

# Display the result
print(df_no_duplicates)
