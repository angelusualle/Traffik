import pandas as pd


inp_df  = pd.read_csv('file_3_clean_age.csv')

out_df = pd.get_dummies(inp_df,prefix=['SPEEDING','ALCOHOL','DISTRACTED','SROWSY',
                                            'WRK_ZONE','WEATHER', 'DRIVER_AGE_BUCKET'],
                               columns=['A_SPCRA','A_POSBAC','A_DIST','A_DROWSY',
                                            'WRK_ZONE','WEATHER','DRIVER_AGE_BUCKET'])

out_df.to_csv('file_3_oneHotEnc.csv', index=False)
