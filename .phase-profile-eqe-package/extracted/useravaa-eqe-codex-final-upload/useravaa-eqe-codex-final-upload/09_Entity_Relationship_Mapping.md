# Entity Relationship Mapping

Provider/User 1 -> 1 ExperienceProfile
ExperienceProfile 1 -> n ProviderWeeklyQuestion
ExperienceQuestionTemplate 1 -> n ProviderWeeklyQuestion
ProviderWeeklyQuestion 1 -> 0..1 ExperienceAnswer

No Admin relationship exists in MVP.
