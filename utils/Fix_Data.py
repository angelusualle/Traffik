import pandas as pd

inp_files_list = ['file_1','file_2','file_3']

#inp_files_list = ['file_1']


for inp_file in inp_files_list:

    inp_df  = pd.read_csv(inp_file + '.csv')

    def fix_age(row):
        if (row['A_D15_20'] == 1):
            return "Teen (15-20)"
        elif (row['A_D21_24'] == 1):
            return "Young Adult (21-24)"
        elif (row['A_D65PLS'] == 1):
            return "Senior (65+)"
        else:
            return "Adult (25-64)"
    
    def fix_weather(row):
        if (row['WEATHER'] == 0 or row['WEATHER'] == 1):
            return 0
        elif (row['WEATHER'] == 9 or row['WEATHER'] == 98 or row['WEATHER'] == 99):
            return 99
        else:
            return 1
    
    
        
    inp_df['DRIVER_AGE_BUCKET'] = inp_df.apply(fix_age, axis=1)
    inp_df['WEATHER'] = inp_df.apply(fix_weather, axis=1)

    inp_df.drop(['A_D15_20','A_D21_24','A_D65PLS'], axis=1, inplace=True)
    
    # Get column names
    
    cols = list(inp_df.columns.values)
    cols.remove('FATALS')
    
    inp_df = inp_df.groupby(cols)['FATALS'].sum().reset_index()
    #inp_df.reset_index(drop=True, inplace=True)

    inp_df.to_csv(inp_file + '_clean_age.csv', index=False)
