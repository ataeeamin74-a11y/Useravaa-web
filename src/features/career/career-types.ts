export type RawCareerCard = Readonly<{
  Card_ID: string;
  Job_Domain_Group: string;
  General_Job_Category: string;
  Mid_Job_Category: string;
  Final_Job_Subfamily: string;
  Seniority_Level: string;
  Card_Title_FA: string;
  Card_Subtitle_FA: string;
  Key_Technical_Skills_FA: string;
  Key_Tools_Tech_FA: string;
  Key_Soft_Skills_FA: string;
  Supporting_Requirements_FA: string;
  Audience_Card_Text_FA: string;
}>;

export type CareerCard = Readonly<{
  id: string;
  domain: string;
  generalCategory: string;
  midCategory: string;
  subfamily: string;
  seniority: string;
  title: string;
  subtitle: string;
  keyTechnicalSkills: readonly string[];
  keyTools: readonly string[];
  keySoftSkills: readonly string[];
  supportingRequirements: readonly string[];
  audienceText: string;
  searchableText: string;
}>;

export type CareerDomain = Readonly<{
  id: string;
  label: string;
}>;

export type GuideCategory = Readonly<{
  id: "career-choice" | "resume" | "interview" | "specialized-learning";
  title: string;
  description: string;
}>;
