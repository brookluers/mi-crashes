import json
import pandas as pd

df_cr = open('crashes_scraped_oct13.txt')
dat_cr = json.load(df_cr)

f_p1116 = open('people-11_16_attempt3.txt')
dat_p1116 = json.load(f_p1116)
f_p0410 = open('people-04_10_attempt2.txt')
dat_p0410 = json.load(f_p0410)

dat_cr.pop('warnings')
dat_cr.pop('errors')
meta_cr = dat_cr.pop('meta')
headcr = dat_cr.pop('headers')

dat_p0410.pop('warnings')
dat_p0410.pop('errors')
dat_p1116.pop('errors')
dat_p1116.pop('warnings')

meta0410 = dat_p0410.pop('meta')
meta1116 = dat_p1116.pop('meta')
head0410 = dat_p0410.pop('headers')
head1116 = dat_p1116.pop('headers')

df_p0410 = pd.DataFrame.from_dict(dat_p0410, orient='index')
df_p1116 = pd.DataFrame.from_dict(dat_p1116, orient='index')
df_cr = pd.DataFrame.from_dict(dat_cr, orient='index')
df_pall = df_p0410.append(df_p1116)

df_pall.to_csv('people_all.txt', index=False)
df_cr.to_csv('crashes_all.txt', index=False)

#df_pall.groupby('crash_id',as_index=False).agg({"party_type": lambda x: np.sum(x=='Bicyclist')})

