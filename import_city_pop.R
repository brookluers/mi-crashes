cfips <- read_csv("mi_county_fips2010.txt",
                  col_names=c("state","statefips","county_fips","county","h1")) %>%
  select(county_fips,county)

minpop <- 10000
cc16 <-
  read_csv("city-pop-2016.csv",
           col_types = cols(SUMLEV=col_integer())) %>%
  filter(STNAME == "Michigan")
mi16 <- filter(cc16, SUMLEV==40)         
         
cc16 <- filter(cc16, SUMLEV==61) %>%
  select(city=NAME, county_fips = COUNTY,
         paste("POPESTIMATE", 2010:2016, sep=''))

cc10 <- read_csv("city-pop-2010.csv",
                 col_types = cols(SUMLEV=col_integer())) %>%
  filter(STNAME == "Michigan")
mi10 <- filter(cc10, SUMLEV==40)

cc10 <- filter(cc10, SUMLEV==61) %>%
  select(city=NAME, county_fips = COUNTY, 
         paste("POPESTIMATE",2004:2009,sep=''))

cc <- 
  inner_join(cc10, cc16, 
          by=c('city'='city','county_fips'='county_fips')) %>%
  select(-county_fips) %>%
  group_by(city) %>% summarise_all(funs(sum)) %>% 
  filter(POPESTIMATE2016 > minpop) %>%
  arrange(desc(POPESTIMATE2016))

cipop <- 
  cc %>%
  gather(contains("POPESTIMATE"),
         key=year,value=pop) %>%
  mutate(year = as.integer(str_replace(year, "POPESTIMATE", "")),
         city_short = str_replace(city, " city", ""),
         city_short = str_replace(city_short, " charter township", " Twp."))
