people <- read_csv('people_all.txt',
                   col_types = cols(crash_id=col_character()))

pp_type <- count(people, crash_id, party_type) %>% 
  spread(key=party_type,value=n) %>%
  mutate_all(funs(ifelse(is.na(.), 0, .)))

people <- mutate(people,
                 person_age = ifelse(person_age=='Less than 1 year old', 1, 
                                     as.numeric(person_age)))
cyclists <- 
  filter(people, party_type=="Bicyclist")

cr_cyclist_info <-
  cyclists %>%
  group_by(crash_id) %>% 
  summarise(ncyc = n(), 
            ncyc_killed = sum(person_degree_of_injury=="Fatal injury (K)"),
            min_cyc_age = min(person_age),
            min_cyc_age_killed = ifelse(ncyc_killed > 0,
                                        min(person_age[which(person_degree_of_injury=="Fatal injury (K)")]),
                                        NA),
            max_cyc_age_killed = ifelse(ncyc_killed > 0,
                                        max(person_age[which(person_degree_of_injury=="Fatal injury (K)")]),
                                        NA)) 


agepairs <- people %>% filter(party_type %in% c('Motor vehicle driver','Bicyclist')) %>%
  select(crash_id,party_type,person_age) %>%
  group_by(crash_id, party_type) %>% 
  mutate(subid = row_number()) %>%
  spread(party_type, person_age) 
#select(Bicyclist, driver=`Motor vehicle driver`)
