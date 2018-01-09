library(tidyverse)
library(stringr)

## County population counts
cpop <- read_csv('county-pop.csv')  %>%
  select(year = Year, county = Area, pop = Population)

# Import Census population counts (including Michigan)
source("import_city_pop.R")

# Format Michigan population
mipop <- bind_rows(mi10 %>% select(state=NAME, paste("POPESTIMATE", 2004:2009,sep='')) %>%
                     gather(-state, key=year, value=pop),
                   mi16 %>% select(state=NAME, paste("POPESTIMATE", 2010:2016, sep='')) %>%
                     gather(-state, key=year, value=pop)) %>%
  mutate(year = as.integer(str_replace(year, "POPESTIMATE", "")))

# Import information on cyclists
source("import_people.R")

#### one row per crash
cr <- read_csv('crashes_all.txt',
               col_types = cols(crash_id=col_character())) %>%
  mutate(date = as.Date(paste(accident_year, accident_month, accident_day),'%Y %B %d'),
         weeknum = as.numeric(format(date, '%V'))) %>%
  rename(year = accident_year,
         month = accident_month,
         day = accident_day) %>%
  filter(total_motor_vehicles > 0) 

cr <-
  mutate(cr, city_short =  str_replace(city_or_township,
                                       ".*County: ", ""))

# Join with cyclist information
cr <- left_join(cr, cr_cyclist_info,
          by=c('crash_id'='crash_id'))

cr %>% group_by(county, year) %>% 
  summarise(n_crash = n(),
            ncyc_killed = sum(ncyc_killed)) %>%
  right_join(cpop, by=c('county'='county', 'year'='year'))  %>% ungroup %>%
  mutate(n_crash = ifelse(is.na(n_crash), 0, n_crash),
         ncyc_killed = ifelse(is.na(ncyc_killed), 0, ncyc_killed),
         crash_rate_100k = n_crash * 100000 / pop,
         fatal_rate_100k = ncyc_killed * 100000 / pop) -> crashes.year.county

cr %>% group_by(year) %>% 
  summarise(n_crash=n(),
            ncyc_killed = sum(ncyc_killed)) %>% 
  right_join(mipop, by=c('year'='year')) %>% 
  ungroup %>% 
  mutate(crash_rate_100k = n_crash * 100000 / pop,
         fatal_rate_100k = ncyc_killed * 100000 / pop) -> crashes.year.mi

# Wide-format tables with geographies in columns
crashes.year.mi %>% select(state, year, crash_rate_100k)%>%
  spread(key=state,value=crash_rate_100k) -> cr_wide_mi

crashes.year.mi %>% select(state, year, fatal_rate_100k) %>%
  spread(key = state, value=fatal_rate_100k) -> fatal_wide_mi

select(crashes.year.county,county,year,crash_rate_100k) %>% 
  spread(key=county,value=crash_rate_100k) -> cr_wide_county

select(crashes.year.county, county, year, n_crash) %>%
  spread(key=county, value=n_crash) -> ncr_wide_county

counties_any_fatal <-
  select(crashes.year.county, county, year, fatal_rate_100k) %>% 
  group_by(county) %>% 
  summarise(maxrate = max(fatal_rate_100k)) %>% 
  filter(maxrate > 0) %>% .$county

crashes.year.county %>%
  filter(county %in% counties_any_fatal) %>%
  select(county, year, fatal_rate_100k) %>% 
  spread(key=county,value=fatal_rate_100k) -> fatal_wide_county

left_join(cr_wide_county, cr_wide_mi,
          by=c('year'='year')) -> cr_wide

write.table(cr_wide, 'cr-county-year.csv',
            quote=F, sep=',', row.names=F)
write.table(ncr_wide_county, 'ncr-county-year.csv',
            quote=F, sep=',', row.names=F)
cr %>%
  group_by(city_short, year) %>% 
  summarise(n_crash = n(),
            ncyc_killed = sum(ncyc_killed)) %>%
  inner_join(cipop, by=c('year'='year','city_short'='city_short')) %>%
  mutate(crash_rate_100k = n_crash * 100000 / pop,
         fatal_rate_100k = ncyc_killed * 100000 / pop) -> crashes.year.cities

cities_any_fatal <-
  crashes.year.cities %>%
    group_by(city_short) %>% summarise(maxrate = max(fatal_rate_100k)) %>%
    filter(maxrate > 0) %>%
    .$city_short

crashes.year.cities %>%
  filter(city_short %in% cities_any_fatal)%>%
  select(city_short, year, fatal_rate_100k) %>% 
  spread(key=city_short, value=fatal_rate_100k) -> fatal_wide_city
